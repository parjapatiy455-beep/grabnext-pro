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
        if (status === 'paid') {
            await sendOrderSuccessEmail(params.id).catch(err => console.error('[Brevo Success Email Error]', err))
        } else if (status === 'failed') {
            await sendOrderFailedEmail(params.id, reason).catch(err => console.error('[Brevo Failure Email Error]', err))
        }

        return NextResponse.json({ success: true, id: params.id, status })
    } catch (error: any) {
        console.error("[Orders PATCH Error]", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

