export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'
import { sendOrderSuccessEmail, sendOrderFailedEmail } from '@/lib/brevo'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

async function isAdminSession(): Promise<boolean> {
    try {
        const session = await getSession()
        if (!session?.uid) return false
        const rows = await executeQuery('SELECT role, email FROM users WHERE uid = ? LIMIT 1', [session.uid]) as any[]
        if (rows && rows.length > 0 && rows[0].role === 'admin') {
            return true
        }
        if (session.role === 'admin' || session.email === 'yk8292238@gmail.com') {
            return true
        }
    } catch (err) {
        console.error("[Orders ID API] Admin check failed:", err)
    }
    return false
}

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

        // TAMPER PROTECTION: Only admin can mark orders as 'paid' or 'completed' directly
        if (status === 'paid' || status === 'completed') {
            const isAdmin = await isAdminSession()
            if (!isAdmin) {
                return NextResponse.json({
                    error: "Unauthorized: Admin authorization required to manually set order status to paid."
                }, { status: 403 })
            }
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
