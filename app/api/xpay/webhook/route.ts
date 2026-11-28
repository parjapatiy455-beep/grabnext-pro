export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'
import { executeQuery } from '@/lib/db'
import { sendOrderSuccessEmail } from '@/lib/brevo'

export const dynamic = 'force-dynamic'

function getEnv(key: string): string | undefined {
    try {
        const ctx = getRequestContext()
        return (ctx?.env as any)?.[key] ?? process.env[key]
    } catch {
        return process.env[key]
    }
}

async function getXPaySecret(): Promise<string> {
    const rows = (await executeQuery(
        "SELECT value FROM settings WHERE key = 'xpay_api_secret' LIMIT 1"
    ).catch(() => [])) as any[]
    const dbSecret = rows?.[0]?.value ? String(rows[0].value).trim() : ''
    return dbSecret || getEnv('XPAY_API_SECRET') || ''
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

async function verifyWebhookSignature(rawBody: string, signatureHex: string, secret: string): Promise<boolean> {
    if (!rawBody || !signatureHex || !secret) return false
    const enc = new TextEncoder()
    const key = await crypto.subtle.importKey(
        'raw',
        enc.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    )
    const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(rawBody))
    const computedHex = Array.from(new Uint8Array(sigBuf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
    return constantTimeEqual(computedHex.toLowerCase(), signatureHex.trim().toLowerCase())
}

/**
 * POST /api/xpay/webhook
 * Receives signed server-to-server payment notifications from XPG Cloudflare Worker.
 */
export async function POST(request: NextRequest) {
    try {
        const rawBody = await request.text()
        const signatureHeader = request.headers.get('x-xpay-signature') || request.headers.get('X-XPay-Signature') || ''

        const apiSecret = await getXPaySecret()
        if (!apiSecret) {
            console.error('[XPay Webhook] XPAY_API_SECRET is not configured')
            return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
        }

        const isValidSig = await verifyWebhookSignature(rawBody, signatureHeader, apiSecret)
        if (!isValidSig) {
            console.warn('[XPay Webhook] Rejected request with invalid X-XPay-Signature')
            return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 })
        }

        const payload = JSON.parse(rawBody)
        const event = String(payload.event || '')
        const status = String(payload.status || '').toUpperCase()
        const grabnextOrderId = String(payload.externalId || payload.externalOrderId || payload.orderId || '').trim()
        const cleanUtr = String(payload.utr || payload.matchedUtr || '').trim().toUpperCase()
        const paidAmount = Number(payload.originalPrice ?? payload.amount ?? 0)

        if (event !== 'payment.success' || (status !== 'PAID' && status !== 'SUCCESS')) {
            return NextResponse.json({ received: true, ignored: true })
        }

        if (!grabnextOrderId || !cleanUtr) {
            return NextResponse.json({ error: 'Missing order reference or UTR in webhook' }, { status: 400 })
        }

        const orders: any[] = await executeQuery(
            'SELECT id, totalAmount, status, paymentId FROM orders WHERE id = ? LIMIT 1',
            [grabnextOrderId]
        )
        if (!orders || orders.length === 0) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        const dbOrder = orders[0]
        if (dbOrder.status === 'paid' || dbOrder.status === 'completed') {
            return NextResponse.json({ received: true, orderId: dbOrder.id, alreadyPaid: true })
        }

        const expectedAmount = Number(dbOrder.totalAmount)
        if (isNaN(paidAmount) || paidAmount + 0.01 < expectedAmount) {
            console.error(`[XPay Webhook Tamper Alert] Order ${grabnextOrderId}: expected ₹${expectedAmount}, received ₹${paidAmount}`)
            return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 })
        }

        const existingWithUtr: any[] = await executeQuery(
            "SELECT id FROM orders WHERE paymentId = ? AND id != ? AND (status = 'paid' OR status = 'completed') LIMIT 1",
            [cleanUtr, grabnextOrderId]
        ).catch(() => [])
        if (existingWithUtr && existingWithUtr.length > 0) {
            return NextResponse.json({ error: 'UTR already claimed by another order' }, { status: 400 })
        }

        const now = Date.now()
        await executeQuery(
            'UPDATE orders SET status = ?, paymentId = ?, updatedAt = ? WHERE id = ?',
            ['paid', cleanUtr, now, grabnextOrderId]
        )

        let emailSent = false
        try {
            const res = await sendOrderSuccessEmail(grabnextOrderId)
            emailSent = Boolean(res?.success)
        } catch (e: any) {
            console.error(`[XPay Webhook] Email dispatch error for ${grabnextOrderId}:`, e.message)
        }

        return NextResponse.json({
            received: true,
            orderId: grabnextOrderId,
            paymentId: cleanUtr,
            status: 'paid',
            emailSent,
        })
    } catch (error: any) {
        console.error('[XPay Webhook Exception]:', error)
        return NextResponse.json({ error: error.message || 'Webhook processing error' }, { status: 500 })
    }
}
