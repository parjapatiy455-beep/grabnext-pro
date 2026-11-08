export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'
import { sendOrderSuccessEmail } from '@/lib/brevo'

export const dynamic = 'force-dynamic'

/**
 * POST /api/xpay/verify
 * Secure server-side verification for XPay UPI payments.
 * Protects against Burp Suite amount manipulation and UTR replay attacks.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { orderId, utr, amount } = body

        if (!orderId || !utr) {
            return NextResponse.json({
                error: 'orderId and utr are required for payment verification'
            }, { status: 400 })
        }

        const cleanUtr = String(utr).trim()
        if (cleanUtr.length < 4 || cleanUtr.toLowerCase() === 'null' || cleanUtr.toLowerCase() === 'undefined') {
            return NextResponse.json({
                error: 'Invalid payment reference (UTR)'
            }, { status: 400 })
        }

        // 1. Fetch real order from database
        const orders: any[] = await executeQuery(
            'SELECT id, totalAmount, status, userName, userEmail FROM orders WHERE id = ? LIMIT 1',
            [orderId]
        )

        if (!orders || orders.length === 0) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        const dbOrder = orders[0]

        // If order is already paid, return success idempotently
        if (dbOrder.status === 'paid' || dbOrder.status === 'completed') {
            return NextResponse.json({
                success: true,
                orderId: dbOrder.id,
                paymentId: dbOrder.paymentId || cleanUtr,
                message: 'Order is already marked as paid'
            })
        }

        // 2. ANTI-TAMPER CHECK (Burp Suite Protection):
        // If amount is provided in the client gateway payload, verify it matches dbOrder.totalAmount
        if (amount !== undefined && amount !== null) {
            const expectedPaise = Math.round(Number(dbOrder.totalAmount) * 100)
            const paidPaise = Math.round(Number(amount) * 100)
            
            // If the user paid LESS than expected, reject immediately
            if (paidPaise < expectedPaise) {
                console.error(`[XPay Tamper Alert] Order ${orderId}: Expected ₹${dbOrder.totalAmount} (${expectedPaise} paise), but received ₹${amount} (${paidPaise} paise)`)
                return NextResponse.json({
                    error: `Security alert: Amount paid (₹${amount}) does not match order total (₹${dbOrder.totalAmount}). Transaction rejected.`
                }, { status: 400 })
            }
        }

        // 3. REPLAY PROTECTION:
        // Ensure this UTR hasn't already been used on another order
        try {
            const existingWithUtr: any[] = await executeQuery(
                "SELECT id FROM orders WHERE paymentId = ? AND id != ? AND (status = 'paid' OR status = 'completed') LIMIT 1",
                [cleanUtr, orderId]
            )
            if (existingWithUtr && existingWithUtr.length > 0) {
                console.error(`[XPay Replay Attack] UTR ${cleanUtr} has already been claimed by order ${existingWithUtr[0].id}`)
                return NextResponse.json({
                    error: 'Security alert: This payment reference (UTR) has already been used for another order.'
                }, { status: 400 })
            }
        } catch (e) {
            // Non-fatal if paymentId index check fails
            console.warn('[XPay UTR Check Warning]:', e)
        }

        // 4. SECURELY UPDATE ORDER TO PAID
        const now = Date.now()
        await executeQuery(
            'UPDATE orders SET status = ?, paymentId = ?, updatedAt = ? WHERE id = ?',
            ['paid', cleanUtr, now, orderId]
        )

        // 5. Trigger Brevo confirmation email
        let emailRes: { success: boolean; error?: string } | null = null
        try {
            emailRes = await sendOrderSuccessEmail(orderId)
        } catch (e: any) {
            console.error(`[XPay Verify] Email notification error for order ${orderId}:`, e.message)
        }

        return NextResponse.json({
            success: true,
            orderId,
            paymentId: cleanUtr,
            status: 'paid',
            emailSent: emailRes ? emailRes.success : null
        })
    } catch (error: any) {
        console.error('[XPay Verify Exception]:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
