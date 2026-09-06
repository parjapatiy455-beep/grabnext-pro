export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'
import { sendOrderSuccessEmail, sendOrderFailedEmail } from '@/lib/brevo'

export const dynamic = 'force-dynamic';

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
    const initialStatus = data.status || 'pending'

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
        JSON.stringify(data.items || []),
        data.totalAmount || 0,
        initialStatus,
        data.paymentId || null,
        data.couponCode || null,
        data.discountAmount || 0,
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
        JSON.stringify(data.items || []),
        data.totalAmount || 0,
        initialStatus,
        data.paymentId || null,
        data.couponCode || null,
        data.discountAmount || 0,
        now,
        now
      ])
    }

    if (initialStatus === 'paid') {
      await sendOrderSuccessEmail(id).catch(err => console.error('[Brevo Email Error]', err))
    } else if (initialStatus === 'failed') {
      await sendOrderFailedEmail(id).catch(err => console.error('[Brevo Email Error]', err))
    }

    return NextResponse.json({ success: true, id }, { status: 201 })
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

    const newStatus = status || 'paid'
    const now = Date.now()
    await executeQuery(`
      UPDATE orders 
      SET status = ?, paymentId = ?, updatedAt = ?
      WHERE id = ?
    `, [newStatus, paymentId || null, now, id])

    // Trigger Brevo transactional emails (await to guarantee execution on Cloudflare Edge)
    if (newStatus === 'paid') {
      await sendOrderSuccessEmail(id).catch(err => console.error('[Brevo Success Email Error]', err))
    } else if (newStatus === 'failed') {
      await sendOrderFailedEmail(id, reason).catch(err => console.error('[Brevo Failure Email Error]', err))
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Update Order Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}


