export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { sendTestBrevoEmail, sendBrevoEmail, sendGuestAccountEmail, getBrevoSettings } from '@/lib/brevo'

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
      whatsappNumber: settings.whatsappNumber,
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

    if (type === 'guest') {
      const result = await sendGuestAccountEmail({
        toEmail: email,
        toName: email.split('@')[0],
        temporaryPassword: 'TempPassword123!',
      })
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 })
      }
      return NextResponse.json({ success: true, message: `Guest Account email sent to ${email}`, messageId: result.messageId })
    }

    if (type === 'success') {
      const appUrl = settings.appUrl
      const senderName = settings.senderName
      const logoUrl = `${appUrl}/logo.png`
      const sampleHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            @keyframes shimmer {
              0% { background-position: -200% 0; }
              100% { background-position: 200% 0; }
            }
            .animated-header-bar {
              height: 4px;
              background: linear-gradient(90deg, #2563eb, #8b5cf6, #ec4899, #2563eb);
              background-size: 200% 100%;
              animation: shimmer 3s infinite linear;
            }
          </style>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);">
            <div class="animated-header-bar"></div>
            <div style="background-color: #0f172a; padding: 28px 24px; text-align: center; color: #ffffff;">
              <img src="${logoUrl}" alt="${senderName}" style="max-height: 48px; width: auto; margin: 0 auto 12px auto; display: block; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4)); border: 0;" />
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff;">${senderName}</h1>
              <p style="margin: 6px 0 0 0; color: #94a3b8; font-size: 13px;">Sample Purchase Confirmation (Test)</p>
            </div>
            <div style="padding: 28px 24px;">
              <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 24px;">
                <h2 style="margin: 0; color: #166534; font-size: 18px; font-weight: 800;">🎉 Sample Purchase Confirmed!</h2>
                <p style="margin: 4px 0 0 0; color: #15803d; font-size: 13px;">Order ID: <strong>ORD-TEST-1234</strong> | UTR: <strong>UTR987654321</strong></p>
              </div>
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 10px 0; color: #0f172a; font-size: 15px;">📦 Premium Video Editing FX Bundle (Sample Product)</h3>
                <a href="${appUrl}/dashboard" target="_blank" style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: 700; font-size: 13px; display: inline-block; box-shadow: 0 4px 12px rgba(37,99,235,0.3);">
                  📥 Access / Download Asset
                </a>
              </div>
              <p style="font-size: 12px; color: #64748b; text-align: center;">This is a test notification email demonstrating purchase confirmation with product download links.</p>
            </div>
            <div style="background-color: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
              <img src="${logoUrl}" alt="${senderName}" style="max-height: 22px; width: auto; opacity: 0.6; margin: 0 auto 4px auto; display: block;" />
              © ${new Date().getFullYear()} ${senderName}. All rights reserved.
            </div>
          </div>
        </body>
        </html>
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
      const logoUrl = `${appUrl}/logo.png`
      const sampleHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            @keyframes shimmer {
              0% { background-position: -200% 0; }
              100% { background-position: 200% 0; }
            }
            .animated-header-bar-failed {
              height: 4px;
              background: linear-gradient(90deg, #f97316, #ef4444, #f59e0b, #f97316);
              background-size: 200% 100%;
              animation: shimmer 3s infinite linear;
            }
          </style>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);">
            <div class="animated-header-bar-failed"></div>
            <div style="background-color: #0f172a; padding: 28px 24px; text-align: center; color: #ffffff;">
              <img src="${logoUrl}" alt="${senderName}" style="max-height: 48px; width: auto; margin: 0 auto 12px auto; display: block; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4)); border: 0;" />
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff;">${senderName}</h1>
              <p style="margin: 6px 0 0 0; color: #94a3b8; font-size: 13px;">Sample Payment Alert (Test)</p>
            </div>
            <div style="padding: 28px 24px;">
              <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border: 1px solid #fecaca; border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 24px;">
                <h2 style="margin: 0; color: #991b1b; font-size: 18px; font-weight: 800;">⚠️ Sample Payment Unsuccessful</h2>
                <p style="margin: 4px 0 0 0; color: #dc2626; font-size: 13px;">Order: <strong>ORD-TEST-1234</strong> | Total: <strong>₹499</strong></p>
              </div>
              <div style="text-align: center; margin: 28px 0;">
                <a href="${appUrl}/checkout" target="_blank" style="background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); color: #ffffff; text-decoration: none; padding: 12px 26px; border-radius: 10px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 14px rgba(234,88,12,0.35);">
                  🔄 Retry Checkout
                </a>
              </div>
              <p style="font-size: 12px; color: #64748b; text-align: center;">This is a test notification email demonstrating payment failure alerts.</p>
            </div>
            <div style="background-color: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
              <img src="${logoUrl}" alt="${senderName}" style="max-height: 22px; width: auto; opacity: 0.6; margin: 0 auto 4px auto; display: block;" />
              © ${new Date().getFullYear()} ${senderName}. All rights reserved.
            </div>
          </div>
        </body>
        </html>
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
