export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'
import { isAdminSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const admin = await isAdminSession()
    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const [orderStats, userStats, productStats] = await Promise.all([
      executeQuery(`
        SELECT 
          COUNT(*) as totalOrders,
          SUM(CASE WHEN status IN ('paid', 'completed') THEN totalAmount ELSE 0 END) as totalRevenue,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingOrders,
          SUM(CASE WHEN status IN ('paid', 'completed') THEN 1 ELSE 0 END) as completedOrders
        FROM orders
      `).catch(() => [{ totalOrders: 0, totalRevenue: 0, pendingOrders: 0, completedOrders: 0 }]),

      executeQuery(`
        SELECT 
          COUNT(*) as totalUsers,
          SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as adminUsers,
          SUM(CASE WHEN isGuest = 1 OR isGuest = '1' OR isGuest = true THEN 1 ELSE 0 END) as guestUsers,
          SUM(CASE WHEN isGuest IS NULL OR isGuest = 0 OR isGuest = '0' OR isGuest = false THEN 1 ELSE 0 END) as registeredUsers
        FROM users
      `).catch(() => [{ totalUsers: 0, adminUsers: 0, guestUsers: 0, registeredUsers: 0 }]),

      executeQuery(`SELECT COUNT(*) as totalProducts FROM products WHERE isActive = 1`).catch(() => [{ totalProducts: 0 }])
    ]) as any[]

    const o = orderStats?.[0] || {}
    const u = userStats?.[0] || {}
    const p = productStats?.[0] || {}

    return NextResponse.json({
      orders: Number(o.totalOrders || 0),
      revenue: Number(o.totalRevenue || 0),
      pendingOrders: Number(o.pendingOrders || 0),
      completedOrders: Number(o.completedOrders || 0),
      users: Number(u.totalUsers || 0),
      adminUsers: Number(u.adminUsers || 0),
      guestUsers: Number(u.guestUsers || 0),
      registeredUsers: Number(u.registeredUsers || 0),
      products: Number(p.totalProducts || 0)
    })
  } catch (error: any) {
    console.error('[Admin Stats Error]:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
