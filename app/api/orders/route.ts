export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'
import { sendOrderSuccessEmail, sendOrderFailedEmail } from '@/lib/brevo'
import { isAdminSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const page  = Math.max(1, parseInt(url.searchParams.get('page')  || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10)))
    const offset = (page - 1) * limit
    const statusFilter = url.searchParams.get('status') || ''
    const searchQuery  = url.searchParams.get('search')  || ''

    // Build dynamic WHERE clause safely (no string interpolation of user input)
    const conditions: string[] = []
    const queryParams: any[] = []

    if (statusFilter && statusFilter !== 'all') {
      conditions.push('o.status = ?')
      queryParams.push(statusFilter)
    }

    if (searchQuery.trim()) {
      conditions.push(`(
        o.id LIKE ? OR
        o.userName LIKE ? OR
        o.userEmail LIKE ? OR
        o.userPhone LIKE ? OR
        o.paymentId LIKE ?
      )`)
      const q = `%${searchQuery.trim().slice(0, 50)}%`
      queryParams.push(q, q, q, q, q)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Get total count for pagination metadata
    let totalCount = 0
    try {
      const countResult = await executeQuery(
        `SELECT COUNT(*) as cnt FROM orders o ${whereClause}`,
        queryParams
      ) as any[]
      totalCount = countResult?.[0]?.cnt ?? 0
    } catch {
      // Non-fatal — pagination metadata won't be available
    }

    // Fetch paginated rows with JOIN
    let results: any[] = []
    try {
      results = await executeQuery(
        `SELECT
          o.id, o.userId, o.userName, o.userEmail, o.userPhone,
          o.items, o.totalAmount, o.status, o.paymentId,
          o.couponCode, o.discountAmount, o.createdAt, o.updatedAt,
          u.displayName AS u_name,
          u.email      AS u_email,
          u.phone      AS u_phone
        FROM orders o
        LEFT JOIN users u ON o.userId = u.uid
        ${whereClause}
        ORDER BY o.createdAt DESC
        LIMIT ? OFFSET ?`,
        [...queryParams, limit, offset]
      ) as any[]
    } catch (e) {
      console.warn('[Orders API] JOIN query failed, falling back:', e)
      results = await executeQuery(
        `SELECT * FROM orders o ${whereClause} ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
        [...queryParams, limit, offset]
      ) as any[]
    }

    // Safe JSON parse — only for rows that need it
    const orders = (results || []).map((o: any) => {
      let items: any[] = []
      if (Array.isArray(o.items)) {
        items = o.items
      } else if (typeof o.items === 'string' && o.items) {
        try { items = JSON.parse(o.items) } catch { items = [] }
      }

      return {
        id:            o.id,
        userId:        o.userId,
        userName:      o.userName  || o.u_name  || (o.userEmail ? o.userEmail.split('@')[0] : null) || (o.userId && o.userId !== 'guest' ? 'Registered User' : 'Guest Customer'),
        userEmail:     o.userEmail || o.u_email || '',
        userPhone:     o.userPhone || o.u_phone || '',
        items,
        totalAmount:   o.totalAmount,
        status:        o.status,
        paymentId:     o.paymentId,
        couponCode:    o.couponCode,
        discountAmount: o.discountAmount,
        createdAt:     o.createdAt,
        updatedAt:     o.updatedAt,
      }
    })

    // If client requested paginated structure or passed pagination parameters, return with pagination metadata
    if (url.searchParams.has('page') || url.searchParams.has('limit') || url.searchParams.has('paginated')) {
      return NextResponse.json({
        orders,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasMore: page * limit < totalCount,
        }
      })
    }

    // Default backward compatible response: direct array (capped at limit to protect CPU)
    return NextResponse.json(orders)
  } catch (error: any) {
    console.error('[Orders API] GET Error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const id = 'ORD-' + crypto.randomUUID().slice(0, 8).toUpperCase()
    const now = Date.now()

    const userName  = data.userName  || data.name  || null
    const userEmail = data.userEmail || data.email || null
    const userPhone = data.userPhone || data.phone || null

    const clientItems = Array.isArray(data.items) ? data.items : []
    if (clientItems.length === 0) {
      return NextResponse.json({ error: 'Your cart is empty' }, { status: 400 })
    }

    // 1. TAMPER PROTECTION: Fetch real prices from database in ONE batch query
    const productIds = clientItems
      .map((i: any) => i.productId || i.id)
      .filter((pid: any) => typeof pid === 'string' && pid.length > 0)

    if (productIds.length === 0) {
      return NextResponse.json({ error: 'Invalid product list' }, { status: 400 })
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
        console.warn('[Orders API] dbProducts query error:', err)
      }
    }

    // Build O(1) lookup map — NO per-item DB calls
    const productMap = new Map<string, any>()
    for (const p of (dbProducts || [])) {
      if (p.id) {
        productMap.set(p.id, p)
        productMap.set(String(p.id).toLowerCase(), p)
      }
      if (p.slug) {
        productMap.set(p.slug, p)
        productMap.set(String(p.slug).toLowerCase(), p)
      }
    }

    let calculatedSubtotal = 0
    const verifiedItems: any[] = []

    for (const clientItem of clientItems) {
      const pid = clientItem.productId || clientItem.id
      const dbProd = productMap.get(pid) || (typeof pid === 'string' ? productMap.get(pid.toLowerCase()) : null)

      if (!dbProd) {
        return NextResponse.json({ error: `Product not found: ${pid}` }, { status: 400 })
      }

      const qty       = Math.max(1, parseInt(clientItem.quantity, 10) || 1)
      const unitPrice = Number(dbProd.price) || 0
      calculatedSubtotal += unitPrice * qty

      verifiedItems.push({
        productId:   dbProd.id,
        title:       dbProd.title,
        price:       unitPrice,
        quantity:    qty,
        imageUrl:    dbProd.imageUrl    || clientItem.imageUrl || null,
        downloadUrl: dbProd.downloadUrl || null,
      })
    }

    // 2. TAMPER PROTECTION: Server-side coupon validation
    let discountAmount    = 0
    let verifiedCouponCode: string | null = null

    const rawCoupon = (data.couponCode || data.coupon || '').toString().trim()
    if (rawCoupon) {
      const clean = rawCoupon.toUpperCase()
      if (clean === 'SAVE50') {
        verifiedCouponCode = 'SAVE50'
        discountAmount = Math.round(calculatedSubtotal * 0.50)
      } else if (clean === 'SAVE40') {
        verifiedCouponCode = 'SAVE40'
        discountAmount = Math.round(calculatedSubtotal * 0.40)
      } else {
        try {
          const coupons: any[] = await executeQuery(
            'SELECT * FROM coupons WHERE UPPER(code) = ? LIMIT 1',
            [clean]
          )
          if (coupons?.length > 0) {
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
          } else {
            // Check active products for discountPopupCoupon
            const prodCoupons: any[] = await executeQuery(
              'SELECT discountPopupCoupon, discountPopupType, discountPopupPercent, discountPopupAmount FROM products WHERE UPPER(discountPopupCoupon) = ? AND enableDiscountPopup = 1 LIMIT 1',
              [clean]
            ).catch(() => [])
            if (prodCoupons && prodCoupons.length > 0) {
              const pc = prodCoupons[0]
              verifiedCouponCode = (pc.discountPopupCoupon || clean).toUpperCase()
              const pType = pc.discountPopupType === 'fixed' ? 'fixed' : 'percentage'
              if (pType === 'fixed') {
                discountAmount = Math.min(calculatedSubtotal, Math.round(Number(pc.discountPopupAmount || 0)))
              } else {
                discountAmount = Math.round((Number(pc.discountPopupPercent || 50) / 100) * calculatedSubtotal)
              }
            }
          }
        } catch (e) {
          console.warn('[Orders API] Coupon lookup error:', e)
        }
      }
    }

    discountAmount = Math.max(0, Math.min(discountAmount, calculatedSubtotal))
    const serverVerifiedTotal = Math.max(0, calculatedSubtotal - discountAmount)
    const initialStatus = serverVerifiedTotal === 0 ? 'paid' : 'pending'

    try {
      await executeQuery(`
        INSERT INTO orders (id, userId, userName, userEmail, userPhone, items, totalAmount, status, paymentId, couponCode, discountAmount, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id, data.userId || 'guest', userName, userEmail, userPhone,
        JSON.stringify(verifiedItems), serverVerifiedTotal, initialStatus,
        initialStatus === 'paid' ? 'FREE_ORDER' : null,
        verifiedCouponCode, discountAmount, now, now,
      ])
    } catch {
      try {
        await executeQuery(`
          INSERT INTO orders (id, userId, userName, userEmail, userPhone, items, totalAmount, status, paymentId, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          id, data.userId || 'guest', userName, userEmail, userPhone,
          JSON.stringify(verifiedItems), serverVerifiedTotal, initialStatus,
          initialStatus === 'paid' ? 'FREE_ORDER' : null, now, now,
        ])
      } catch {
        await executeQuery(`
          INSERT INTO orders (id, userId, items, totalAmount, status, paymentId, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          id, data.userId || 'guest',
          JSON.stringify(verifiedItems), serverVerifiedTotal, initialStatus,
          initialStatus === 'paid' ? 'FREE_ORDER' : null, now, now,
        ])
      }
    }

    let emailRes: { success: boolean; error?: string; messageId?: string } | null = null
    if (initialStatus === 'paid') {
      try { emailRes = await sendOrderSuccessEmail(id) }
      catch (e: any) { console.error(`[Email Failure] Free Order ${id}:`, e.message) }
    }

    return NextResponse.json({
      success: true, id,
      totalAmount: serverVerifiedTotal,
      discountAmount,
      couponCode: verifiedCouponCode,
      status: initialStatus,
      emailSent:  emailRes ? emailRes.success : null,
      emailError: emailRes && !emailRes.success ? emailRes.error : null,
    }, { status: 201 })
  } catch (error: any) {
    console.error('[Orders API] POST Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const data = await request.json()
    const { id, status, paymentId, reason } = data

    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    const newStatus = status || 'failed'

    if (newStatus === 'paid' || newStatus === 'completed') {
      const admin = await isAdminSession()
      if (!admin) {
        const cleanPaymentId = paymentId ? String(paymentId).trim() : ''
        if (!cleanPaymentId || cleanPaymentId.length < 4 || cleanPaymentId.toLowerCase() === 'null') {
          console.warn(`[Security Alert] Unauthorized attempt to mark order ${id} as paid without payment ID.`)
          return NextResponse.json({
            error: 'Unauthorized: Orders cannot be marked as paid directly without verified payment.'
          }, { status: 403 })
        }

        const orders: any[] = await executeQuery(
          'SELECT id, totalAmount, status FROM orders WHERE id = ? LIMIT 1',
          [id]
        )
        if (!orders || orders.length === 0) {
          return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        try {
          const reused: any[] = await executeQuery(
            "SELECT id FROM orders WHERE paymentId = ? AND id != ? AND (status = 'paid' OR status = 'completed') LIMIT 1",
            [cleanPaymentId, id]
          )
          if (reused?.length > 0) {
            return NextResponse.json({
              error: 'Security alert: Payment reference already claimed by another order.'
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

    let emailRes: { success: boolean; error?: string; messageId?: string } | null = null
    if (newStatus === 'paid' || newStatus === 'completed') {
      try { emailRes = await sendOrderSuccessEmail(id) }
      catch (e: any) { console.error(`[Email Failure] Order ${id}:`, e.message) }
    } else if (newStatus === 'failed') {
      try { emailRes = await sendOrderFailedEmail(id, reason) }
      catch (e: any) { console.error(`[Email Failure] Order ${id}:`, e.message) }
    }

    return NextResponse.json({
      success: true,
      emailSent:  emailRes ? emailRes.success : null,
      emailError: emailRes && !emailRes.success ? emailRes.error : null,
    })
  } catch (error: any) {
    console.error('[Orders API] PATCH Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
