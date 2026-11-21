export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'
import { sendOrderSuccessEmail } from '@/lib/brevo'
import { isAdminSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

// POST /api/orders/[id]/send-email - Admin manually triggers/resends Order Confirmation & Download Email
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const isAdmin = await isAdminSession()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 })
    }

    const { id } = params
    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    const orders = (await executeQuery(
      'SELECT id, userEmail, status FROM orders WHERE id = ? LIMIT 1',
      [id]
    )) as any[]

    if (!orders || orders.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const order = orders[0]
    const emailRes = await sendOrderSuccessEmail(id)

    if (!emailRes.success) {
      return NextResponse.json({
        error: emailRes.error || 'Failed to send confirmation email'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Order confirmation & download link email sent to ${order.userEmail || 'customer'}`,
      orderId: id,
    })
  } catch (error: any) {
    console.error('[Send Order Email API Error]:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
