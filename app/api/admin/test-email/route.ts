export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { sendTestBrevoEmail, sendBrevoEmail, getBrevoSettings } from '@/lib/brevo'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const settings = await getBrevoSettings()
    return NextResponse.json({
      configured: Boolean(settings.apiKey && settings.senderEmail),
      hasApiKey: Boolean(settings.apiKey),
      senderEmail: settings.senderEmail || null,
      senderName: settings.senderName || 'Grabnext',
      appUrl: settings.appUrl,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, type = 'test' } = await request.json()
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid recipient email address is required' }, { status: 400 })
    }

    const settings = await getBrevoSettings()
    if (!settings.apiKey) {
      return NextResponse.json(
        { error: 'BREVO_API_KEY is not configured. Please set it in .env or settings table.' },
        { status: 400 }
      )
    }
    if (!settings.senderEmail) {
      return NextResponse.json(
        { error: 'BREVO_SENDER_EMAIL is not configured. Please set it in .env or settings table.' },
        { status: 400 }
      )
    }

    if (type === 'test') {
      const result = await sendTestBrevoEmail(email)
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 })
      }
      return NextResponse.json({ success: true, message: `Test email sent to ${email}`, messageId: result.messageId })
    }

    if (type === 'success') {
      const appUrl = settings.appUrl
      const senderName = settings.senderName
      const sampleHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
          <div style="background: #0f172a; padding: 16px; text-align: center; color: #fff; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">${senderName}</h2>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #94a3b8;">Sample Order Confirmation (Test)</p>
          </div>
          <div style="padding: 20px;">
            <h3 style="color: #166534; margin-top: 0;">🎉 Sample Purchase Confirmation</h3>
            <p>Order ID: <strong>ORD-TEST-1234</strong> | Payment Ref: <strong>UTR987654321</strong></p>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <h4 style="margin: 0 0 8px 0;">📦 Premium Video Editing FX Bundle (Sample Product)</h4>
              <a href="${appUrl}/dashboard" target="_blank" style="background: #2563eb; color: #fff; text-decoration: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; font-size: 13px; display: inline-block;">
                📥 Access / Download Asset
              </a>
            </div>
            <p style="font-size: 12px; color: #64748b;">This is a test notification email demonstrating purchase confirmation with product download links.</p>
          </div>
        </div>
      `
      const result = await sendBrevoEmail({
        toEmail: email,
        subject: `🎉 [TEST] Order Confirmed! Downloads Ready - ORD-TEST-1234`,
        htmlContent: sampleHtml,
      })
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 })
      }
      return NextResponse.json({ success: true, message: `Sample Order Success email sent to ${email}`, messageId: result.messageId })
    }

    if (type === 'failed') {
      const appUrl = settings.appUrl
      const senderName = settings.senderName
      const sampleHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
          <div style="background: #0f172a; padding: 16px; text-align: center; color: #fff; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">${senderName}</h2>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #94a3b8;">Sample Payment Alert (Test)</p>
          </div>
          <div style="padding: 20px;">
            <h3 style="color: #991b1b; margin-top: 0;">⚠️ Sample Payment Unsuccessful</h3>
            <p>We noticed your payment attempt for Order <strong>ORD-TEST-1234</strong> (Total: ₹499) could not be completed.</p>
            <div style="text-align: center; margin: 24px 0;">
              <a href="${appUrl}/checkout" target="_blank" style="background: #ea580c; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; display: inline-block;">
                🔄 Retry Checkout
              </a>
            </div>
            <p style="font-size: 12px; color: #64748b;">This is a test notification email demonstrating payment failure alerts.</p>
          </div>
        </div>
      `
      const result = await sendBrevoEmail({
        toEmail: email,
        subject: `⚠️ [TEST] Payment Unsuccessful for Order ORD-TEST-1234`,
        htmlContent: sampleHtml,
      })
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 })
      }
      return NextResponse.json({ success: true, message: `Sample Payment Failed email sent to ${email}`, messageId: result.messageId })
    }

    return NextResponse.json({ error: 'Invalid test type' }, { status: 400 })
  } catch (error: any) {
    console.error('[Test Email API Error]', error)
    return NextResponse.json({ error: error.message || 'Failed to send test email' }, { status: 500 })
  }
}
