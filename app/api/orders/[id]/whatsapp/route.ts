export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'
import { getSession, createOrderRecoveryToken } from '@/lib/session'
import { formatWhatsAppPhone, DEFAULT_PENDING_TEMPLATE, DEFAULT_PAID_TEMPLATE } from '@/lib/whatsapp'
import { createOrGetShortLink } from '@/lib/short-link'

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

// GET /api/orders/[id]/whatsapp?type=pending|paid&discount=15
export async function GET(
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

    const url = new URL(request.url)
    const typeParam = url.searchParams.get('type') // 'pending' | 'paid'
    const discountParam = url.searchParams.get('discount') // custom discount override

    // Fetch order from DB
    const orderRows = (await executeQuery(
      `SELECT 
        o.*,
        u.displayName AS u_name,
        u.email AS u_email,
        u.phone AS u_phone
      FROM orders o
      LEFT JOIN users u ON o.userId = u.uid
      WHERE o.id = ? LIMIT 1`,
      [id]
    )) as any[]

    if (!orderRows || orderRows.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const order = orderRows[0]
    const isPaid = order.status === 'paid' || order.status === 'completed'
    const messageType = typeParam ? typeParam : (isPaid ? 'paid' : 'pending')

    // Fetch site settings
    const settingsRows = (await executeQuery(
      `SELECT key, value FROM settings WHERE key IN (
        'whatsapp_pending_template',
        'whatsapp_paid_template',
        'whatsapp_recovery_discount_percent',
        'app_url',
        'sender_name',
        'whatsapp_number'
      )`
    ).catch(() => [])) as any[]

    const settingsMap: Record<string, string> = {}
    if (Array.isArray(settingsRows)) {
      settingsRows.forEach((r) => {
        settingsMap[r.key] = r.value
      })
    }

    const appUrl = (settingsMap['app_url'] || process.env.NEXT_PUBLIC_APP_URL || 'https://grabnext.pages.dev').replace(/\/+$/, '')
    const siteName = settingsMap['sender_name'] || 'GrabNext'

    const customerName = order.userName || order.u_name || 'Customer'
    const rawPhone = order.userPhone || order.u_phone || ''
    const cleanPhone = formatWhatsAppPhone(rawPhone)

    let items: any[] = []
    try {
      items = Array.isArray(order.items) ? order.items : JSON.parse(order.items || '[]')
    } catch {
      items = []
    }

    const productNames = items.map((it: any) => it.title || it.name).filter(Boolean).join(', ') || 'Digital Products'
    const originalTotal = Number(order.totalAmount || 0)

    let message = ''
    let recoveryLink = ''
    let fullRecoveryUrl = ''
    let downloadLinks = ''
    let activeDiscountPercent = 10
    let discountedTotal = originalTotal

    if (messageType === 'pending') {
      const settingDiscount = Number(settingsMap['whatsapp_recovery_discount_percent'] || 10)
      activeDiscountPercent = discountParam !== null && discountParam !== undefined && !isNaN(Number(discountParam))
        ? Math.max(0, Math.min(100, Number(discountParam)))
        : settingDiscount

      const discountAmount = activeDiscountPercent > 0
        ? Math.max(1, Math.round(originalTotal * (activeDiscountPercent / 100)))
        : 0
      discountedTotal = Math.max(1, originalTotal - discountAmount)

      const recoveryToken = await createOrderRecoveryToken({
        orderId: order.id,
        email: order.userEmail || order.u_email || '',
        discountPercent: activeDiscountPercent,
      })

      fullRecoveryUrl = `${appUrl}/checkout?orderId=${encodeURIComponent(order.id)}&token=${encodeURIComponent(recoveryToken)}&recover=1`

      // Generate ultra short link for WhatsApp
      const shortCode = await createOrGetShortLink({
        targetUrl: fullRecoveryUrl,
        orderId: String(order.id),
        ttlDays: 14,
      })

      recoveryLink = `${appUrl}/r/${shortCode}`

      const template = settingsMap['whatsapp_pending_template'] || DEFAULT_PENDING_TEMPLATE

      message = template
        .replace(/{{name}}/g, customerName)
        .replace(/{{order_id}}/g, String(order.id))
        .replace(/{{products}}/g, productNames)
        .replace(/{{original_amount}}/g, `₹${originalTotal.toLocaleString('en-IN')}`)
        .replace(/{{amount}}/g, `₹${discountedTotal.toLocaleString('en-IN')}`)
        .replace(/{{discount}}/g, `${activeDiscountPercent}%`)
        .replace(/{{recovery_link}}/g, recoveryLink)
        .replace(/{{site_name}}/g, siteName)
    } else {
      // Paid order: generate access / download links
      const successUrl = `${appUrl}/checkout/success?orderId=${encodeURIComponent(order.id)}`
      
      downloadLinks = successUrl
      const template = settingsMap['whatsapp_paid_template'] || DEFAULT_PAID_TEMPLATE

      message = template
        .replace(/{{name}}/g, customerName)
        .replace(/{{order_id}}/g, String(order.id))
        .replace(/{{products}}/g, productNames)
        .replace(/{{amount}}/g, `₹${originalTotal.toLocaleString('en-IN')}`)
        .replace(/{{download_links}}/g, downloadLinks)
        .replace(/{{access_link}}/g, successUrl)
        .replace(/{{site_name}}/g, siteName)
    }

    const whatsappUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`

    return NextResponse.json({
      success: true,
      orderId: order.id,
      type: messageType,
      phone: cleanPhone,
      rawPhone,
      customerName,
      message,
      whatsappUrl,
      recoveryLink,
      fullRecoveryUrl,
      discountPercent: activeDiscountPercent,
      originalTotal,
      discountedTotal,
      downloadLinks,
    })
  } catch (error: any) {
    console.error('[WhatsApp Order API Error]:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
