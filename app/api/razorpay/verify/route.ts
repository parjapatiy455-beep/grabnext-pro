export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'
import { executeQuery } from '@/lib/db'
import { sendOrderSuccessEmail } from '@/lib/brevo'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body

        if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return NextResponse.json({
                error: 'Missing required payment verification parameters'
            }, { status: 400 })
        }

        let keyId: string | undefined
        let keySecret: string | undefined
        try {
            const ctx = getRequestContext()
            keyId = (ctx?.env as any)?.NEXT_PUBLIC_RAZORPAY_KEY_ID
            keySecret = (ctx?.env as any)?.RAZORPAY_KEY_SECRET
        } catch { }
        if (!keyId) keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
        if (!keySecret) keySecret = process.env.RAZORPAY_KEY_SECRET

        if (!keyId || !keySecret) {
            return NextResponse.json({ error: 'Razorpay keys not configured' }, { status: 500 })
        }

        // 1. CRYPTOGRAPHIC SIGNATURE VERIFICATION (Native Web Crypto API for Cloudflare Edge)
        const enc = new TextEncoder()
        const key = await crypto.subtle.importKey(
            'raw',
            enc.encode(keySecret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        )
        const signPayload = `${razorpay_order_id}|${razorpay_payment_id}`
        const signBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(signPayload))
        const generatedSignature = Array.from(new Uint8Array(signBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('')

        if (generatedSignature.toLowerCase() !== razorpay_signature.toLowerCase()) {
            console.error(`[Razorpay Security Alert] Signature mismatch for order ${orderId}. Expected ${generatedSignature}, got ${razorpay_signature}`)
            return NextResponse.json({
                error: 'Tamper protection: Invalid payment signature'
            }, { status: 400 })
        }

        // 2. FETCH REAL ORDER FROM DATABASE
        const orders: any[] = await executeQuery(
            'SELECT id, totalAmount, status FROM orders WHERE id = ? LIMIT 1',
            [orderId]
        )

        if (!orders || orders.length === 0) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        const dbOrder = orders[0]

        // 3. SERVER-TO-SERVER GATEWAY VERIFICATION (Check with Razorpay API)
        const auth = btoa(`${keyId}:${keySecret}`)
        const payRes = await fetch(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}`, {
            headers: {
                'Authorization': `Basic ${auth}`,
            }
        })

        if (!payRes.ok) {
            const err = await payRes.text()
            console.error('[Razorpay Verify Fetch Error]:', err)
            return NextResponse.json({ error: 'Failed to verify payment with Razorpay' }, { status: 400 })
        }

        const payment = await payRes.json()

        // 4. DEEP INTEGRITY CHECKS
        // Check order id matches
        if (payment.order_id !== razorpay_order_id) {
            console.error(`[Razorpay Security Alert] Order ID mismatch: ${payment.order_id} vs ${razorpay_order_id}`)
            return NextResponse.json({ error: 'Security error: Payment not associated with this order' }, { status: 400 })
        }

        // Check payment status
        if (payment.status !== 'captured' && payment.status !== 'authorized') {
            console.error(`[Razorpay Verify] Payment status not successful: ${payment.status}`)
            return NextResponse.json({ error: `Payment is not completed. Current status: ${payment.status}` }, { status: 400 })
        }

        // CRITICAL CHECK: Verify amount paid matches DB order total in paise
        const expectedPaise = Math.round(Number(dbOrder.totalAmount) * 100)
        if (Number(payment.amount) !== expectedPaise) {
            console.error(`[Razorpay Price Tampering Detected] Order ${orderId}: Expected ₹${dbOrder.totalAmount} (${expectedPaise} paise), but paid ₹${payment.amount / 100} (${payment.amount} paise)`)
            return NextResponse.json({
                error: 'Security alert: Amount paid does not match order total. Transaction rejected.'
            }, { status: 400 })
        }

        // 5. SECURELY UPDATE ORDER TO PAID
        const now = Date.now()
        await executeQuery(
            'UPDATE orders SET status = ?, paymentId = ?, updatedAt = ? WHERE id = ?',
            ['paid', razorpay_payment_id, now, orderId]
        )

        // Trigger Brevo confirmation email
        let emailRes: { success: boolean; error?: string } | null = null
        try {
            emailRes = await sendOrderSuccessEmail(orderId)
        } catch (e: any) {
            console.error(`[Razorpay Verify] Email notification failed for ${orderId}:`, e.message)
        }

        return NextResponse.json({
            success: true,
            orderId,
            paymentId: razorpay_payment_id,
            emailSent: emailRes ? emailRes.success : null
        })
    } catch (error: any) {
        console.error('[Razorpay Verify Exception]:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
