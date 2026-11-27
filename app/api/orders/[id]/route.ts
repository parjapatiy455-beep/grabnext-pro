export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'
import { sendOrderSuccessEmail, sendOrderFailedEmail } from '@/lib/brevo'
import { isAdminSession } from '@/lib/admin-auth'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

// GET /api/orders/[id] - Get a single order (admin or authenticated order owner only)
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const admin = await isAdminSession()
        const session = admin ? null : await getSession()
        if (!admin && !session?.uid) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const results = await executeQuery(
            "SELECT * FROM orders WHERE id = ? LIMIT 1",
            [params.id]
        )
        if (!results || results.length === 0) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 })
        }
        const order = results[0] as any

        if (!admin) {
            const matchesUid = session?.uid && order.userId === session.uid
            const matchesEmail = session?.email && order.userEmail &&
                String(session.email).toLowerCase().trim() === String(order.userEmail).toLowerCase().trim()
            if (!matchesUid && !matchesEmail) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 })
            }
        }

        let parsedItems: any[] = []
        if (Array.isArray(order.items)) {
            parsedItems = order.items
        } else if (typeof order.items === 'string' && order.items.trim()) {
            try { parsedItems = JSON.parse(order.items) } catch { parsedItems = [] }
        }

        const isPaid = order.status === 'paid' || order.status === 'completed'
        if (!admin && !isPaid) {
            parsedItems = parsedItems.map((it: any) => {
                const { downloadUrl, ...rest } = it
                return rest
            })
        }

        return NextResponse.json({
            ...order,
            items: parsedItems
        }, { headers: { 'Cache-Control': 'private, no-store' } })
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

        const isAdmin = await isAdminSession()

        // TAMPER PROTECTION: Only admin can mark orders as 'paid' or 'completed' directly
        if (status === 'paid' || status === 'completed') {
            if (!isAdmin) {
                return NextResponse.json({
                    error: "Unauthorized: Admin authorization required to manually set order status to paid."
                }, { status: 403 })
            }
        }

        const now = Date.now()
        if (isAdmin) {
            await executeQuery(
                "UPDATE orders SET status = ?, updatedAt = ? WHERE id = ?",
                [status, now, params.id]
            )
        } else {
            await executeQuery(
                "UPDATE orders SET status = ?, updatedAt = ? WHERE id = ? AND status != 'paid' AND status != 'completed'",
                [status, now, params.id]
            )
        }

        // Trigger Brevo transactional emails (await to guarantee execution on Cloudflare Edge)
        let emailRes: { success: boolean; error?: string; messageId?: string } | null = null
        if (status === 'paid' || status === 'completed') {
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
