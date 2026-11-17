export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'
import { verifyOrderRecoveryToken, getSession, encrypt } from '@/lib/session'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * GET /api/orders/recover?orderId=...&token=...
 * Fetches pending/incomplete order details safely using a signed recovery token.
 * Works seamlessly on any device/browser without requiring prior user login.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = (searchParams.get('orderId') || '').trim()
    const token = (searchParams.get('token') || '').trim()

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    let isAuthorized = false
    let tokenPayload: any = null

    // 1. Verify cryptographic token if provided
    if (token) {
      tokenPayload = await verifyOrderRecoveryToken(token)
      if (tokenPayload && tokenPayload.orderId === orderId) {
        isAuthorized = true
      }
    }

    // 2. Fallback authorization: Check authenticated session
    if (!isAuthorized) {
      const session = await getSession()
      if (session?.uid) {
        // Check if admin or order owner
        if (session.role === 'admin' || session.email === 'yk8292238@gmail.com') {
          isAuthorized = true
        } else {
          const ownerCheck = await executeQuery(
            'SELECT id FROM orders WHERE id = ? AND (userId = ? OR userEmail = ?) LIMIT 1',
            [orderId, session.uid, session.email]
          ) as any[]
          if (ownerCheck && ownerCheck.length > 0) {
            isAuthorized = true
          }
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Invalid, expired, or unauthorized recovery link. Please try checkout again or contact support.' },
        { status: 403 }
      )
    }

    // 3. Fetch real order from database
    const orders = (await executeQuery(
      'SELECT id, userId, userName, userEmail, userPhone, items, totalAmount, status, couponCode, discountAmount, createdAt FROM orders WHERE id = ? LIMIT 1',
      [orderId]
    )) as any[]

    if (!orders || orders.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const order = orders[0]

    // If order is already paid, inform client to redirect to success
    if (order.status === 'paid' || order.status === 'completed') {
      return NextResponse.json({
        success: true,
        isPaid: true,
        orderId: order.id,
        message: 'This order is already completed.',
      })
    }

    let items: any[] = []
    try {
      items = Array.isArray(order.items) ? order.items : JSON.parse(order.items)
    } catch {
      items = []
    }

    // 4. Calculate Custom Special Recovery Discount
    const baseTotal = Number(order.totalAmount || 0)
    let discountPercent = 10
    if (typeof tokenPayload?.discountPercent === 'number') {
      discountPercent = tokenPayload.discountPercent
    } else {
      const settingRows = (await executeQuery(
        "SELECT value FROM settings WHERE key = 'whatsapp_recovery_discount_percent' LIMIT 1"
      ).catch(() => [])) as any[]
      if (settingRows && settingRows.length > 0 && settingRows[0].value) {
        discountPercent = Number(settingRows[0].value)
      }
    }

    let discountAmount = 0
    let recoveryTotal = baseTotal

    const isAlreadyRecovered = order.couponCode && String(order.couponCode).startsWith('RECOVERY') && order.discountAmount > 0
    if (isAlreadyRecovered) {
      discountAmount = Number(order.discountAmount)
      recoveryTotal = baseTotal
    } else {
      discountAmount = discountPercent > 0 ? Math.max(1, Math.round(baseTotal * (discountPercent / 100))) : 0
      recoveryTotal = Math.max(1, baseTotal - discountAmount)
    }

    // 5. AUTO-LOGIN GUEST: If user is not logged in on this browser, but has a guest account,
    // establish a session cookie so all downstream pages work without "Please Login" / "Not Found" friction.
    try {
      const existingSession = await getSession()
      if (!existingSession && order.userEmail) {
        const userRows = (await executeQuery(
          'SELECT uid, email, displayName, role, isGuest FROM users WHERE email = ? LIMIT 1',
          [order.userEmail]
        )) as any[]

        if (userRows && userRows.length > 0) {
          const u = userRows[0]
          if (u.isGuest === 1 || u.isGuest === true) {
            const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            const sessionJwt = await encrypt({
              uid: u.uid,
              email: u.email,
              role: u.role || 'user',
              expires,
            })
            cookies().set('session', sessionJwt, { expires, httpOnly: true })
          }
        }
      }
    } catch (sessionErr) {
      console.warn('[Order Recovery Auto-Session Warning]:', sessionErr)
    }

    return NextResponse.json({
      success: true,
      isPaid: false,
      order: {
        id: order.id,
        userName: order.userName || 'Valued Customer',
        userEmail: order.userEmail || '',
        userPhone: order.userPhone || '',
        items,
        originalTotal: baseTotal + (isAlreadyRecovered ? discountAmount : 0),
        discountPercent,
        discountAmount,
        recoveryTotal,
        status: order.status,
      },
    })
  } catch (error: any) {
    console.error('[Order Recover GET Error]:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/orders/recover
 * Locks the 10% recovery discount in the database before gateway launch,
 * ensuring tamper checks and verify endpoints validate against the exact discounted amount.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, token } = body

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    let isAuthorized = false
    let tokenPayload: any = null
    if (token) {
      tokenPayload = await verifyOrderRecoveryToken(token)
      if (tokenPayload && tokenPayload.orderId === orderId) {
        isAuthorized = true
      }
    }

    if (!isAuthorized) {
      const session = await getSession()
      if (session?.uid) {
        if (session.role === 'admin' || session.email === 'yk8292238@gmail.com') {
          isAuthorized = true
        } else {
          const ownerCheck = await executeQuery(
            'SELECT id FROM orders WHERE id = ? AND (userId = ? OR userEmail = ?) LIMIT 1',
            [orderId, session.uid, session.email]
          ) as any[]
          if (ownerCheck && ownerCheck.length > 0) isAuthorized = true
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized order recovery request' }, { status: 403 })
    }

    const orders = (await executeQuery(
      'SELECT id, totalAmount, status, couponCode, discountAmount FROM orders WHERE id = ? LIMIT 1',
      [orderId]
    )) as any[]

    if (!orders || orders.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const order = orders[0]

    if (order.status === 'paid' || order.status === 'completed') {
      return NextResponse.json({ success: true, isPaid: true, orderId: order.id })
    }

    let discountPercent = 10
    if (typeof tokenPayload?.discountPercent === 'number') {
      discountPercent = tokenPayload.discountPercent
    } else {
      const settingRows = (await executeQuery(
        "SELECT value FROM settings WHERE key = 'whatsapp_recovery_discount_percent' LIMIT 1"
      ).catch(() => [])) as any[]
      if (settingRows && settingRows.length > 0 && settingRows[0].value) {
        discountPercent = Number(settingRows[0].value)
      }
    }

    const currentTotal = Number(order.totalAmount || 0)
    let newTotal = currentTotal
    let discountAmount = Number(order.discountAmount || 0)
    const recoveryCoupon = `RECOVERY${discountPercent}`

    // Apply recovery discount if not already applied
    const isAlreadyDiscounted = order.couponCode && String(order.couponCode).startsWith('RECOVERY')
    if (!isAlreadyDiscounted && discountPercent > 0) {
      discountAmount = Math.max(1, Math.round(currentTotal * (discountPercent / 100)))
      newTotal = Math.max(1, currentTotal - discountAmount)

      const now = Date.now()
      await executeQuery(`
        UPDATE orders 
        SET totalAmount = ?, discountAmount = ?, couponCode = ?, status = 'pending', updatedAt = ?
        WHERE id = ? AND (status = 'pending' OR status = 'failed')
      `, [newTotal, discountAmount, recoveryCoupon, now, orderId])
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      verifiedTotal: newTotal,
      discountAmount,
    })
  } catch (error: any) {
    console.error('[Order Recover POST Error]:', error)
    return NextResponse.json({ error: error.message || 'Failed to prepare order recovery' }, { status: 500 })
  }
}
