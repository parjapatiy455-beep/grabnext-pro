export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'
import { getSession } from '@/lib/session'
import { sendOrderRecoveryEmail } from '@/lib/brevo'

export const dynamic = 'force-dynamic'

async function isAdminSession(): Promise<boolean> {
  try {
    const session = await getSession()
    if (!session?.uid) return false
    const rows = (await executeQuery('SELECT role, email FROM users WHERE uid = ? LIMIT 1', [session.uid])) as any[]
    if (rows && rows.length > 0 && rows[0].role === 'admin') {
      return true
    }
    if (session.role === 'admin' || session.email === 'yk8292238@gmail.com') {
      return true
    }
  } catch (err) {
    console.error('[Admin Check Error]:', err)
  }
  return false
}

// POST /api/orders/[id]/send-recovery - Admin triggers 10% OFF recovery email to customer
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
    if (order.status === 'paid' || order.status === 'completed') {
      return NextResponse.json({ error: 'This order is already paid' }, { status: 400 })
    }

    const emailRes = await sendOrderRecoveryEmail(id)
    if (!emailRes.success) {
      return NextResponse.json({ error: emailRes.error || 'Failed to send recovery email' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `10% Discount recovery email successfully sent to ${order.userEmail || 'customer'}`,
      orderId: id,
    })
  } catch (error: any) {
    console.error('[Send Recovery Email API Error]:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
