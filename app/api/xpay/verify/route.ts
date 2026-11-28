export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'
import { executeQuery } from '@/lib/db'
import { sendOrderSuccessEmail } from '@/lib/brevo'

export const dynamic = 'force-dynamic'

const DEFAULT_XPAY_WORKER_URL = 'https://xpay-worker.lurnx.workers.dev'

function getEnv(key: string): string | undefined {
    try {
        const ctx = getRequestContext()
        return (ctx?.env as any)?.[key] ?? process.env[key]
    } catch {
        return process.env[key]
    }
}

async function getXPayConfig() {
    const settingsRows = (await executeQuery(
        "SELECT key, value FROM settings WHERE key IN ('xpay_api_key', 'xpay_api_secret', 'xpay_worker_url')"
    ).catch(() => [])) as any[]

    const map: Record<string, string> = {}
    if (Array.isArray(settingsRows)) {
        for (const r of settingsRows) map[r.key] = String(r.value || '').trim()
    }

    return {
        apiKey: map.xpay_api_key || getEnv('XPAY_API_KEY') || getEnv('NEXT_PUBLIC_XPAY_API_KEY') || '',
        apiSecret: map.xpay_api_secret || getEnv('XPAY_API_SECRET') || '',
        workerUrl: (map.xpay_worker_url || getEnv('XPAY_WORKER_URL') || DEFAULT_XPAY_WORKER_URL).replace(/\/+$/, ''),
    }
}

function constantTimeEqual(a: string, b: string): boolean {
    const enc = new TextEncoder()
    const bufA = enc.encode(a)
    const bufB = enc.encode(b)
    const len = Math.max(bufA.length, bufB.length)
    let diff = bufA.length ^ bufB.length
    for (let i = 0; i < len; i++) {
        diff |= (bufA[i] || 0) ^ (bufB[i] || 0)
    }
    return diff === 0
}

async function verifyHmacSha256(message: string, secret: string, expectedHex: string): Promise<boolean> {
    if (!secret || !expectedHex) return false
    const enc = new TextEncoder()
    const key = await crypto.subtle.importKey(
        'raw',
        enc.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    )
    const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(message))
    const computedHex = Array.from(new Uint8Array(sigBuf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
    return constantTimeEqual(computedHex.toLowerCase(), expectedHex.trim().toLowerCase())
}

/**
 * POST /api/xpay/verify
 * Server-to-server verification against XPG Cloudflare Worker (/api/check-status or /api/order/:id/status).
 * Verifies payment status, merchant ownership, Grabnext order binding, amount, signature, and UTR replay.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { orderId, xpayOrderId, utr } = body

        if (!orderId) {
            return NextResponse.json({
                error: 'orderId is required for payment verification'
            }, { status: 400 })
        }

        // 1. Fetch real Grabnext order from D1
        const orders: any[] = await executeQuery(
            'SELECT id, totalAmount, status, paymentId, userName, userEmail FROM orders WHERE id = ? LIMIT 1',
            [orderId]
        )

        if (!orders || orders.length === 0) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        const dbOrder = orders[0]

        if (dbOrder.status === 'paid' || dbOrder.status === 'completed') {
            return NextResponse.json({
                success: true,
                orderId: dbOrder.id,
                paymentId: dbOrder.paymentId || (utr ? String(utr).trim() : ''),
                message: 'Order is already marked as paid'
            })
        }

        const xpayConfig = await getXPayConfig()
        if (!xpayConfig.apiKey) {
            return NextResponse.json({ error: 'XPay API key is not configured' }, { status: 500 })
        }

        const cleanXpayOrderId = xpayOrderId ? String(xpayOrderId).trim() : ''
        if (!cleanXpayOrderId && !xpayConfig.apiSecret) {
            return NextResponse.json({
                error: 'Missing XPay order reference for server verification'
            }, { status: 400 })
        }

        // 2. SERVER-TO-SERVER VERIFICATION WITH XPG WORKER
        let verifiedOrder: any = null

        if (xpayConfig.apiSecret) {
            const lookupId = cleanXpayOrderId || String(orderId).trim()
            const checkUrl = `${xpayConfig.workerUrl}/api/check-status?order_id=${encodeURIComponent(lookupId)}`
            const checkRes = await fetch(checkUrl, {
                method: 'GET',
                headers: {
                    'X-Api-Key': xpayConfig.apiKey,
                    'X-Api-Secret': xpayConfig.apiSecret,
                },
            })

            const checkData: any = await checkRes.json().catch(() => null)
            if (!checkRes.ok || !checkData?.success) {
                return NextResponse.json({
                    error: checkData?.error || 'Failed to verify payment with XPay server'
                }, { status: 400 })
            }
            verifiedOrder = checkData
        } else {
            // Fallback when only XPAY_API_KEY is configured:
            // Resolve expected merchantId from API key and verify XPay order status directly on XPG Worker.
            const [merchantRes, statusRes] = await Promise.all([
                fetch(`${xpayConfig.workerUrl}/api/merchant/public-info?api_key=${encodeURIComponent(xpayConfig.apiKey)}`),
                fetch(`${xpayConfig.workerUrl}/api/order/${encodeURIComponent(cleanXpayOrderId)}/status`),
            ])

            const merchantData: any = await merchantRes.json().catch(() => null)
            const statusData: any = await statusRes.json().catch(() => null)

            if (!merchantRes.ok || !merchantData?.merchantId) {
                return NextResponse.json({
                    error: 'Could not verify XPay merchant ownership'
                }, { status: 400 })
            }
            if (!statusRes.ok || !statusData?.orderId) {
                return NextResponse.json({
                    error: statusData?.error || 'Order not found on XPay gateway'
                }, { status: 400 })
            }
            if (statusData.merchantId !== merchantData.merchantId) {
                console.error(`[XPay Security Alert] Merchant mismatch for order ${orderId}: expected ${merchantData.merchantId}, got ${statusData.merchantId}`)
                return NextResponse.json({
                    error: 'Security error: Payment does not belong to this store'
                }, { status: 403 })
            }

            verifiedOrder = {
                ...statusData,
                utr: statusData.matchedUtr || statusData.utr || '',
            }
        }

        // 3. STRICT GATEWAY STATUS & BINDING CHECKS
        if (verifiedOrder.status !== 'PAID' && verifiedOrder.status !== 'SUCCESS') {
            return NextResponse.json({
                error: `Payment is not completed yet. Gateway status: ${verifiedOrder.status || 'PENDING'}`
            }, { status: 400 })
        }

        const boundExternalId = String(verifiedOrder.externalId || verifiedOrder.externalOrderId || '').trim()
        if (!boundExternalId || boundExternalId !== String(dbOrder.id).trim()) {
            console.error(`[XPay Security Alert] Order binding mismatch: expected ${dbOrder.id}, gateway externalId=${boundExternalId}`)
            return NextResponse.json({
                error: 'Security alert: Payment is not bound to this order'
            }, { status: 400 })
        }

        const gatewayUtr = String(verifiedOrder.utr || verifiedOrder.matchedUtr || '').trim().toUpperCase()
        if (!gatewayUtr || gatewayUtr.length < 4) {
            return NextResponse.json({
                error: 'Invalid or missing verified UTR from XPay gateway'
            }, { status: 400 })
        }

        if (utr && String(utr).trim().toUpperCase() !== gatewayUtr) {
            console.error(`[XPay Security Alert] Client UTR mismatch for ${orderId}: client=${utr}, gateway=${gatewayUtr}`)
            return NextResponse.json({
                error: 'Security alert: Payment reference mismatch'
            }, { status: 400 })
        }

        // Verify optional gateway HMAC signature if apiSecret & signature are present
        if (xpayConfig.apiSecret && verifiedOrder.signature && verifiedOrder.updatedAt) {
            const sigPayload = `${verifiedOrder.orderId}|${verifiedOrder.amount}|${gatewayUtr}|${verifiedOrder.updatedAt}`
            const sigOk = await verifyHmacSha256(sigPayload, xpayConfig.apiSecret, String(verifiedOrder.signature))
            if (!sigOk) {
                console.error(`[XPay Security Alert] Invalid gateway signature for order ${orderId}`)
                return NextResponse.json({
                    error: 'Security alert: Invalid gateway payment signature'
                }, { status: 400 })
            }
        }

        // 4. ANTI-TAMPER AMOUNT CHECK (use pre-jitter originalPrice if present)
        const expectedAmount = Number(dbOrder.totalAmount)
        const gatewayPaidAmount = Number(verifiedOrder.originalPrice ?? verifiedOrder.amount ?? 0)
        if (isNaN(gatewayPaidAmount) || gatewayPaidAmount + 0.01 < expectedAmount) {
            console.error(`[XPay Tamper Alert] Order ${orderId}: Expected ₹${expectedAmount}, gateway reported ₹${gatewayPaidAmount}`)
            return NextResponse.json({
                error: `Security alert: Paid amount (₹${gatewayPaidAmount}) does not match order total (₹${expectedAmount}).`
            }, { status: 400 })
        }

        // 5. REPLAY PROTECTION IN D1
        const existingWithUtr: any[] = await executeQuery(
            "SELECT id FROM orders WHERE paymentId = ? AND id != ? AND (status = 'paid' OR status = 'completed') LIMIT 1",
            [gatewayUtr, orderId]
        ).catch(() => [])
        if (existingWithUtr && existingWithUtr.length > 0) {
            console.error(`[XPay Replay Attack] UTR ${gatewayUtr} already claimed by order ${existingWithUtr[0].id}`)
            return NextResponse.json({
                error: 'Security alert: This payment reference (UTR) has already been used for another order.'
            }, { status: 400 })
        }

        // 6. SECURELY UPDATE ORDER TO PAID
        const now = Date.now()
        await executeQuery(
            'UPDATE orders SET status = ?, paymentId = ?, updatedAt = ? WHERE id = ?',
            ['paid', gatewayUtr, now, orderId]
        )

        // 7. Trigger Brevo confirmation email
        let emailRes: { success: boolean; error?: string } | null = null
        try {
            emailRes = await sendOrderSuccessEmail(orderId)
        } catch (e: any) {
            console.error(`[XPay Verify] Email notification error for order ${orderId}:`, e.message)
        }

        return NextResponse.json({
            success: true,
            orderId,
            paymentId: gatewayUtr,
            status: 'paid',
            emailSent: emailRes ? emailRes.success : null
        })
    } catch (error: any) {
        console.error('[XPay Verify Exception]:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
