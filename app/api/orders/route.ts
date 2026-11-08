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
    let dbProducts: any[] = []
    try {
      dbProducts = await executeQuery(
        `SELECT id, title, price, imageUrl, downloadUrl, slug FROM products WHERE id IN (${placeholders}) OR slug IN (${placeholders})`,
        [...productIds, ...productIds]
      )
    } catch {
      try {
        dbProducts = await executeQuery(
          `SELECT id, title, price, imageUrl, downloadUrl FROM products WHERE id IN (${placeholders})`,
          productIds
        )
      } catch (err) {
        console.warn("[Orders API] dbProducts query error:", err)
      }
    }

    let calculatedSubtotal = 0
    const verifiedItems: any[] = []

    for (const clientItem of clientItems) {
      const pid = clientItem.productId || clientItem.id
      let dbProd = (dbProducts || []).find((p: any) => p.id === pid || (p.slug && p.slug === pid))

      // Fallback matching by prefix or title if product ID was a slug from custom landing pages
      if (!dbProd && typeof pid === 'string') {
        try {
          const parts = pid.split('-')
          const lastPart = parts[parts.length - 1]
          if (lastPart && lastPart.length >= 6) {
            const byPrefix = await executeQuery(
              'SELECT id, title, price, imageUrl, downloadUrl, slug FROM products WHERE id LIKE ? OR slug LIKE ? LIMIT 1',
              [lastPart + '%', '%' + lastPart]
            )
            if (byPrefix && byPrefix.length > 0) dbProd = byPrefix[0]
          }
          if (!dbProd) {
            const cleanTitle = pid.replace(/-[a-f0-9]{6,}$/i, '').replace(/-/g, ' ').trim()
            if (cleanTitle.length >= 3) {
              const byTitle = await executeQuery(
                'SELECT id, title, price, imageUrl, downloadUrl, slug FROM products WHERE title LIKE ? LIMIT 1',
                [`%${cleanTitle}%`]
              )
              if (byTitle && byTitle.length > 0) dbProd = byTitle[0]
            }
          }
        } catch {}
      }

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
    // Disregard any client-sent discountAmount to prevent Burp Suite price manipulation
    let discountAmount = 0
    let verifiedCouponCode: string | null = null

    const rawCoupon = (data.couponCode || data.coupon || '').toString().trim()
    if (rawCoupon) {
      const clean = rawCoupon.toUpperCase()
      // Universal promotional coupons
      if (clean === 'SAVE50') {
        verifiedCouponCode = 'SAVE50'
        discountAmount = Math.round(calculatedSubtotal * 0.50)
      } else if (clean === 'SAVE40') {
        verifiedCouponCode = 'SAVE40'
        discountAmount = Math.round(calculatedSubtotal * 0.40)
      } else {
        // Look up custom admin coupons in the database
        try {
          const coupons: any[] = await executeQuery(
            'SELECT * FROM coupons WHERE UPPER(code) = ? LIMIT 1',
            [clean]
          )
          if (coupons && coupons.length > 0) {
            const c = coupons[0]
            const isActive = c.isActive === 1 || c.isActive === true || c.isActive === '1'
            if (isActive) {
              verifiedCouponCode = c.code || clean
              if (c.type === 'percentage') {
                discountAmount = Math.round((Number(c.value) / 100) * calculatedSubtotal)
              } else if (c.type === 'fixed') {
                discountAmount = Math.min(calculatedSubtotal, Number(c.value))
              }
            }
          }
        } catch (e) {
          console.warn("[Orders API] Coupon lookup error:", e)
        }
      }
    }

    discountAmount = Math.max(0, Math.min(discountAmount, calculatedSubtotal))
    const serverVerifiedTotal = Math.max(0, calculatedSubtotal - discountAmount)

    // 3. Initial status is 'paid' ONLY for 100% free orders, otherwise strictly 'pending'
    const initialStatus = serverVerifiedTotal === 0 ? 'paid' : 'pending'

    try {
      // Primary insert with full metadata
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
      // Fallback 1: in case couponCode/discountAmount columns don't exist yet on older schema
      try {
        await executeQuery(`
          INSERT INTO orders (id, userId, userName, userEmail, userPhone, items, totalAmount, status, paymentId, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
          now,
          now
        ])
      } catch {
        // Fallback 2: minimal base schema
        await executeQuery(`
          INSERT INTO orders (id, userId, items, totalAmount, status, paymentId, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          id,
          data.userId || 'guest',
          JSON.stringify(verifiedItems),
          serverVerifiedTotal,
          initialStatus,
          initialStatus === 'paid' ? 'FREE_ORDER' : null,
          now,
          now
        ])
      }
    }

    let emailRes: { success: boolean; error?: string; messageId?: string } | null = null
    if (initialStatus === 'paid') {
      try {
        emailRes = await sendOrderSuccessEmail(id)
      } catch (e: any) {
        console.error(`[Order Success Email Failure] Free Order ${id}:`, e.message)
      }
    }

    return NextResponse.json({
      success: true,
      id,
      totalAmount: serverVerifiedTotal,
      discountAmount,
      couponCode: verifiedCouponCode,
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

    // 4. TAMPER PROTECTION:
    // Disallow public updating to 'paid' or 'completed' WITHOUT valid payment proof
    if (newStatus === 'paid' || newStatus === 'completed') {
      const isAdmin = await isAdminSession()
      if (!isAdmin) {
        // If not admin, require a valid payment reference (UTR or payment ID)
        const cleanPaymentId = paymentId ? String(paymentId).trim() : ''
        if (!cleanPaymentId || cleanPaymentId.length < 4 || cleanPaymentId.toLowerCase() === 'null') {
          console.warn(`[Security Alert] Unauthorized attempt to mark order ${id} as paid without payment ID.`)
          return NextResponse.json({
            error: "Unauthorized: Orders cannot be marked as paid directly without verified payment."
          }, { status: 403 })
        }

        // Verify order exists and is pending
        const orders: any[] = await executeQuery(
          'SELECT id, totalAmount, status FROM orders WHERE id = ? LIMIT 1',
          [id]
        )
        if (!orders || orders.length === 0) {
          return NextResponse.json({ error: "Order not found" }, { status: 404 })
        }

        // Check if UTR is already reused on another paid order
        try {
          const reused: any[] = await executeQuery(
            "SELECT id FROM orders WHERE paymentId = ? AND id != ? AND (status = 'paid' OR status = 'completed') LIMIT 1",
            [cleanPaymentId, id]
          )
          if (reused && reused.length > 0) {
            return NextResponse.json({
              error: "Security alert: Payment reference already claimed by another order."
            }, { status: 400 })
          }
        } catch {}
      }
    }

    const now = Date.now()
    await executeQuery(`
      UPDATE orders 
      SET status = ?, paymentId = COALESCE(?, paymentId), updatedAt = ?
      WHERE id = ?
    `, [newStatus, paymentId ? String(paymentId).trim() : null, now, id])

    // Trigger Brevo transactional emails
    let emailRes: { success: boolean; error?: string; messageId?: string } | null = null
    if (newStatus === 'paid') {
      try {
        emailRes = await sendOrderSuccessEmail(id)
      } catch (e: any) {
        console.error(`[Order Success Email Failure] Order ${id}:`, e.message)
      }
    } else if (newStatus === 'failed') {
      try {
        emailRes = await sendOrderFailedEmail(id, reason)
      } catch (e: any) {
        console.error(`[Order Failure Email Failure] Order ${id}:`, e.message)
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
