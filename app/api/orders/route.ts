export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'
import { sendOrderSuccessEmail, sendOrderFailedEmail } from '@/lib/brevo'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic';

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
    console.error("[Orders API] Admin verification failed:", err)
  }
  return false
}

export async function GET(request: NextRequest) {
  try {
    let results: any[] = []
    try {
      results = await executeQuery(`
        SELECT 
          o.*,
          u.displayName AS u_name,
          u.email AS u_email,
          u.phone AS u_phone
        FROM orders o
        LEFT JOIN users u ON o.userId = u.uid
        ORDER BY o.createdAt DESC
      `)
    } catch (e) {
      console.warn("[v0] Orders JOIN query failed, falling back to simple SELECT:", e)
      results = await executeQuery("SELECT * FROM orders ORDER BY createdAt DESC")
    }

    const orders = (results || []).map((o: any) => {
      const userName = o.userName || o.u_name || (o.userEmail ? o.userEmail.split('@')[0] : null) || (o.userId && o.userId !== 'guest' ? 'Registered User' : 'Guest Customer')
      const userEmail = o.userEmail || o.u_email || ''
      const userPhone = o.userPhone || o.u_phone || ''

      return {
        ...o,
        userName,
        userEmail,
        userPhone,
        items: o.items ? JSON.parse(o.items) : []
      }
    })

    return NextResponse.json(orders)
  } catch (error: any) {
    console.error("[v0] Orders API Error:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const id = "ORD-" + crypto.randomUUID().slice(0, 8).toUpperCase()
    const now = Date.now()

    const userName = data.userName || data.name || null
    const userEmail = data.userEmail || data.email || null
    const userPhone = data.userPhone || data.phone || null

    const clientItems = Array.isArray(data.items) ? data.items : []
    if (clientItems.length === 0) {
      return NextResponse.json({ error: "Your cart is empty" }, { status: 400 })
    }

    // 1. TAMPER PROTECTION: Fetch real prices from database
    const productIds = clientItems
      .map((i: any) => i.productId || i.id)
      .filter((pid: any) => typeof pid === 'string' && pid.length > 0)

    if (productIds.length === 0) {
      return NextResponse.json({ error: "Invalid product list" }, { status: 400 })
    }

    const placeholders = productIds.map(() => '?').join(',')
    const dbProducts: any[] = await executeQuery(
      `SELECT id, title, price, imageUrl, downloadUrl FROM products WHERE id IN (${placeholders})`,
      productIds
    )

    let calculatedSubtotal = 0
    const verifiedItems: any[] = []

    for (const clientItem of clientItems) {
      const pid = clientItem.productId || clientItem.id
      const dbProd = (dbProducts || []).find((p: any) => p.id === pid)
      if (!dbProd) {
        return NextResponse.json({ error: `Product not found: ${pid}` }, { status: 400 })
      }
      const qty = Math.max(1, parseInt(clientItem.quantity, 10) || 1)
      const unitPrice = Number(dbProd.price) || 0
      calculatedSubtotal += unitPrice * qty

      verifiedItems.push({
        productId: dbProd.id,
        title: dbProd.title,
        price: unitPrice,
        quantity: qty,
        imageUrl: dbProd.imageUrl || clientItem.imageUrl || null,
        downloadUrl: dbProd.downloadUrl || null
      })
    }

    // 2. TAMPER PROTECTION: Server-side coupon validation
    let discountAmount = 0
    let verifiedCouponCode: string | null = null

    if (data.couponCode && typeof data.couponCode === 'string') {
      const clean = data.couponCode.toUpperCase().trim()
      try {
        const coupons: any[] = await executeQuery(
          'SELECT * FROM coupons WHERE code = ? AND isActive = 1 LIMIT 1',
          [clean]
        )
        if (coupons && coupons.length > 0) {
          const c = coupons[0]
          verifiedCouponCode = clean
          if (c.type === 'percentage') {
            discountAmount = Math.round((Number(c.value) / 100) * calculatedSubtotal)
          } else if (c.type === 'fixed') {
            discountAmount = Math.min(calculatedSubtotal, Number(c.value))
          }
        } else if (clean === 'SAVE50' || clean === 'SAVE40') {
          verifiedCouponCode = clean
          const pct = clean === 'SAVE40' ? 40 : 50
          discountAmount = Math.round((pct / 100) * calculatedSubtotal)
        }
      } catch (e) {
        console.warn("[Orders API] Coupon verification error:", e)
      }
    }

    discountAmount = Math.max(0, Math.min(discountAmount, calculatedSubtotal))
    const serverVerifiedTotal = Math.max(0, calculatedSubtotal - discountAmount)

    // 3. TAMPER PROTECTION: Initial status is strictly 'pending' (unless 100% free discount)
    const initialStatus = serverVerifiedTotal === 0 ? 'paid' : 'pending'

    try {
      await executeQuery(`
        INSERT INTO orders (id, userId, userName, userEmail, userPhone, items, totalAmount, status, paymentId, couponCode, discountAmount, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        data.userId || 'guest',
        userName,
        userEmail,
        userPhone,
        JSON.stringify(verifiedItems),
        serverVerifiedTotal,
        initialStatus,
        initialStatus === 'paid' ? 'FREE_ORDER' : null,
        verifiedCouponCode,
        discountAmount,
        now,
        now
      ])
    } catch (err) {
      // Fallback if missing columns on older database table version
      await executeQuery(`
        INSERT INTO orders (id, userId, items, totalAmount, status, paymentId, couponCode, discountAmount, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        data.userId || 'guest',
        JSON.stringify(verifiedItems),
        serverVerifiedTotal,
        initialStatus,
        initialStatus === 'paid' ? 'FREE_ORDER' : null,
        verifiedCouponCode,
        discountAmount,
        now,
        now
      ])
    }

    let emailRes: { success: boolean; error?: string; messageId?: string } | null = null
    if (initialStatus === 'paid') {
      emailRes = await sendOrderSuccessEmail(id)
      if (!emailRes.success) {
        console.error(`[Order Success Email Failure] Order ${id}:`, emailRes.error)
      }
    }

    return NextResponse.json({
      success: true,
      id,
      totalAmount: serverVerifiedTotal,
      status: initialStatus,
      emailSent: emailRes ? emailRes.success : null,
      emailError: emailRes && !emailRes.success ? emailRes.error : null
    }, { status: 201 })
  } catch (error: any) {
    console.error("[v0] Create Order Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const data = await request.json()
    const { id, status, paymentId, reason } = data

    if (!id) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
    }

    const newStatus = status || 'failed'

    // 4. TAMPER PROTECTION: Disallow direct public updating to 'paid' or 'completed'
    if (newStatus === 'paid' || newStatus === 'completed') {
      const isAdmin = await isAdminSession()
      if (!isAdmin) {
        console.warn(`[Security Alert] Unauthorized attempt to mark order ${id} as paid directly.`)
        return NextResponse.json({
          error: "Unauthorized: Orders cannot be marked as paid directly. Payments must be verified through the secure gateway verification endpoint."
        }, { status: 403 })
      }
    }

    const now = Date.now()
    await executeQuery(`
      UPDATE orders 
      SET status = ?, paymentId = COALESCE(?, paymentId), updatedAt = ?
      WHERE id = ?
    `, [newStatus, paymentId || null, now, id])

    // Trigger Brevo transactional emails (await to guarantee execution on Cloudflare Edge)
    let emailRes: { success: boolean; error?: string; messageId?: string } | null = null
    if (newStatus === 'paid') {
      emailRes = await sendOrderSuccessEmail(id)
      if (!emailRes.success) {
        console.error(`[Order Success Email Failure] Order ${id}:`, emailRes.error)
      }
    } else if (newStatus === 'failed') {
      emailRes = await sendOrderFailedEmail(id, reason)
      if (!emailRes.success) {
        console.error(`[Order Failure Email Failure] Order ${id}:`, emailRes.error)
      }
    }

    return NextResponse.json({
      success: true,
      emailSent: emailRes ? emailRes.success : null,
      emailError: emailRes && !emailRes.success ? emailRes.error : null
    })
  } catch (error: any) {
    console.error("[v0] Update Order Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}


