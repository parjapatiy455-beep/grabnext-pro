export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'
import { sendOrderSuccessEmail, sendOrderFailedEmail } from '@/lib/brevo'

export const dynamic = 'force-dynamic'

// GET /api/orders/[id] - Get a single order
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const results = await executeQuery(
            "SELECT * FROM orders WHERE id = ? LIMIT 1",
            [params.id]
        )
        if (!results || results.length === 0) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 })
        }
        const order = results[0] as any
        return NextResponse.json({
            ...order,
            items: order.items ? JSON.parse(order.items) : []
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// PATCH /api/orders/[id] - Update order status
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { status, reason } = await request.json()
        if (!status) {
            return NextResponse.json({ error: "Status is required" }, { status: 400 })
        }

        const now = Date.now()
        await executeQuery(
            "UPDATE orders SET status = ?, updatedAt = ? WHERE id = ?",
            [status, now, params.id]
        )

        // Trigger Brevo transactional emails (await to guarantee execution on Cloudflare Edge)
        let emailRes: { success: boolean; error?: string; messageId?: string } | null = null
        if (status === 'paid') {
            emailRes = await sendOrderSuccessEmail(params.id)
            if (!emailRes.success) {
                console.error(`[Order Success Email Failure] Order ${params.id}:`, emailRes.error)
            }
        } else if (status === 'failed') {
            emailRes = await sendOrderFailedEmail(params.id, reason)
            if (!emailRes.success) {
                console.error(`[Order Failure Email Failure] Order ${params.id}:`, emailRes.error)
            }
        }

        return NextResponse.json({
            success: true,
            id: params.id,
            status,
            emailSent: emailRes ? emailRes.success : null,
            emailError: emailRes && !emailRes.success ? emailRes.error : null
        })
    } catch (error: any) {
        console.error("[Orders PATCH Error]", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

