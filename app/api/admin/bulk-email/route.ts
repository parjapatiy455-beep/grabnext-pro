export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'
import { getSession } from '@/lib/session'
import { getBrevoSettings, sendBrevoEmail, generateOfferEmailHtml } from '@/lib/brevo'

export const dynamic = 'force-dynamic'

// GET: Fetch stats, products list, and coupons list for building bulk offer campaigns
export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const current = (await executeQuery('SELECT role FROM users WHERE uid = ?', [session.uid])) as any[]
    if (!current || current.length === 0 || current[0].role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // 1. User stats
    const users = (await executeQuery('SELECT uid, email, isGuest FROM users WHERE email IS NOT NULL AND email != \'\'')) as any[]
    const totalUsers = users.length
    const guestUsers = users.filter(u => u.isGuest === 1 || u.isGuest === true).length
    const registeredUsers = totalUsers - guestUsers

    // 2. Products list
    const products = (await executeQuery('SELECT id, title, price, originalPrice, imageUrl, slug FROM products WHERE isActive = 1 ORDER BY title ASC')) as any[]

    // 3. Coupons list (if coupons table exists)
    let coupons: any[] = []
    try {
      coupons = (await executeQuery('SELECT code, type, value, isActive FROM coupons WHERE isActive = 1')) as any[]
    } catch {
      coupons = []
    }

    const brevoSettings = await getBrevoSettings()

    return NextResponse.json({
      totalUsers,
      registeredUsers,
      guestUsers,
      products: Array.isArray(products) ? products : [],
      coupons: Array.isArray(coupons) ? coupons : [],
      isBrevoConfigured: Boolean(brevoSettings.apiKey && brevoSettings.senderEmail),
      senderEmail: brevoSettings.senderEmail || null,
      senderName: brevoSettings.senderName || 'Grabnext',
    })
  } catch (error: any) {
    console.error('[Bulk Email API GET Error]', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch campaign resources' }, { status: 500 })
  }
}

// POST: Send Test Email or Dispatch Bulk Offer Campaign
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const current = (await executeQuery('SELECT role FROM users WHERE uid = ?', [session.uid])) as any[]
    if (!current || current.length === 0 || current[0].role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const {
      isTestMode = false,
      testEmail,
      targetAudience = 'all',
      selectedUids = [],
      subject = '🔥 Special Offer from Grabnext!',
      headline = 'SPECIAL DISCOUNT OFFER',
      subheading = '',
      couponCode = '',
      discountBadge = '',
      productIds = [],
      ctaText = '⚡ Claim Offer Now',
      ctaUrl = '',
    } = await request.json()

    const { apiKey, senderEmail, senderName, appUrl, whatsappNumber } = await getBrevoSettings()

    if (!apiKey || !senderEmail) {
      return NextResponse.json(
        { error: 'Brevo API Key or Sender Email is missing. Please configure BREVO_API_KEY in settings or .env file.' },
        { status: 400 }
      )
    }

    // Fetch featured products details from DB if productIds provided
    let featuredProducts: any[] = []
    if (Array.isArray(productIds) && productIds.length > 0) {
      const placeholders = productIds.map(() => '?').join(',')
      featuredProducts = (await executeQuery(
        `SELECT id, title, price, originalPrice, imageUrl, slug FROM products WHERE id IN (${placeholders})`,
        productIds
      )) as any[]
    }

    // 1. HANDLE TEST MODE (Send single test email to admin)
    if (isTestMode) {
      const recipientEmail = testEmail || session.email || senderEmail
      if (!recipientEmail || !recipientEmail.includes('@')) {
        return NextResponse.json({ error: 'Valid test email address is required' }, { status: 400 })
      }

      const htmlContent = generateOfferEmailHtml({
        headline,
        subheading,
        couponCode,
        discountBadge,
        featuredProducts,
        ctaText,
        ctaUrl,
        recipientName: 'Valued Customer (Test)',
        senderName,
        appUrl,
        whatsappNumber,
      })

      const testResult = await sendBrevoEmail({
        toEmail: recipientEmail,
        subject: `[TEST] ${subject}`,
        htmlContent,
      })

      if (!testResult.success) {
        return NextResponse.json({ error: testResult.error }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: `✅ Test offer email sent successfully to ${recipientEmail}`,
        messageId: testResult.messageId,
      })
    }

    // 2. HANDLE BULK CAMPAIGN DISPATCH
    let query = 'SELECT uid, email, displayName, isGuest FROM users WHERE email IS NOT NULL AND email != \'\''
    let params: any[] = []

    if (targetAudience === 'registered') {
      query += ' AND (isGuest IS NULL OR isGuest = 0 OR isGuest = false)'
    } else if (targetAudience === 'guest') {
      query += ' AND (isGuest = 1 OR isGuest = true)'
    } else if (targetAudience === 'selected' && Array.isArray(selectedUids) && selectedUids.length > 0) {
      const placeholders = selectedUids.map(() => '?').join(',')
      query += ` AND uid IN (${placeholders})`
      params = selectedUids
    }

    const targetUsers = (await executeQuery(query, params)) as any[]

    if (!Array.isArray(targetUsers) || targetUsers.length === 0) {
      return NextResponse.json({ error: 'No recipients found for the selected target audience' }, { status: 400 })
    }

    // Deduplicate user emails
    const uniqueMap = new Map<string, { email: string; name: string }>()
    for (const u of targetUsers) {
      if (u.email && u.email.includes('@')) {
        const cleanEmail = u.email.trim().toLowerCase()
        if (!uniqueMap.has(cleanEmail)) {
          uniqueMap.set(cleanEmail, {
            email: u.email.trim(),
            name: u.displayName || u.email.split('@')[0] || 'Valued Customer',
          })
        }
      }
    }

    const recipients = Array.from(uniqueMap.values())
    let sentCount = 0
    let failedCount = 0
    const failedEmails: string[] = []

    // Send emails sequentially or in small batches to avoid rate limits
    for (const recipient of recipients) {
      const htmlContent = generateOfferEmailHtml({
        headline,
        subheading,
        couponCode,
        discountBadge,
        featuredProducts,
        ctaText,
        ctaUrl,
        recipientName: recipient.name,
        senderName,
        appUrl,
        whatsappNumber,
      })

      const res = await sendBrevoEmail({
        toEmail: recipient.email,
        toName: recipient.name,
        subject,
        htmlContent,
      })

      if (res.success) {
        sentCount++
      } else {
        failedCount++
        failedEmails.push(recipient.email)
      }
    }

    return NextResponse.json({
      success: true,
      totalTargeted: recipients.length,
      sentCount,
      failedCount,
      failedEmails,
      message: `🎉 Bulk Offer Email Campaign sent! Delivered to ${sentCount} of ${recipients.length} users.`,
    })
  } catch (error: any) {
    console.error('[Bulk Email API POST Error]', error)
    return NextResponse.json({ error: error.message || 'Error processing bulk email campaign' }, { status: 500 })
  }
}
