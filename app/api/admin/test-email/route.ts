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
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
            @media only screen and (max-width: 600px) {
              .email-body { padding: 0 !important; background-color: #ffffff !important; }
              .email-card { width: 100% !important; border-radius: 0px !important; box-shadow: none !important; margin: 0 !important; }
              .content-box { padding: 20px 14px !important; }
              .header-box { padding: 22px 14px !important; }
            }
          </style>
        </head>
        <body class="email-body" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px 0; -webkit-text-size-adjust: 100%;">
          <div class="email-card" style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.08);">
            <div class="animated-header-bar"></div>
            <div class="header-box" style="background-color: #ffffff; border-bottom: 1px solid #e2e8f0; padding: 16px 20px; text-align: center; color: #0f172a;">
              <img src="${logoUrl}" alt="${senderName}" style="height: 42px; max-height: 42px; width: auto; margin: 0 auto; display: block; border: 0;" />
              <p style="margin: 6px 0 0 0; color: #64748b; font-size: 12px;">Sample Purchase Confirmation (Test)</p>
            </div>
            <div class="content-box" style="padding: 24px 20px;">
              <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 22px;">
                <h2 style="margin: 0; color: #166534; font-size: 18px; font-weight: 800;">🎉 Sample Purchase Confirmed!</h2>
                <p style="margin: 4px 0 0 0; color: #15803d; font-size: 13px;">Order ID: <strong>ORD-TEST-1234</strong> | UTR: <strong>UTR987654321</strong></p>
              </div>
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; margin-bottom: 22px;">
                <h3 style="margin: 0 0 10px 0; color: #0f172a; font-size: 15px;">📦 Premium Video Editing FX Bundle (Sample Product)</h3>
                <a href="${appUrl}/dashboard" target="_blank" style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: 700; font-size: 13px; display: inline-block; box-shadow: 0 4px 12px rgba(37,99,235,0.3);">
                  📥 Download
                </a>
              </div>
              <p style="font-size: 12px; color: #64748b; text-align: center;">This is a test notification email demonstrating purchase confirmation with product download links.</p>
            </div>
            <div style="background-color: #f8fafc; padding: 16px 20px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
              <img src="${logoUrl}" alt="${senderName}" style="height: 22px; max-height: 22px; width: auto; opacity: 0.7; margin: 0 auto 4px auto; display: block;" />
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
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @keyframes shimmer {
              0% { background-position: -200% 0; }
              100% { background-position: 200% 0; }
            }
            .animated-header-bar-failed {
              height: 4px;
              background: linear-gradient(90deg, #f59e0b, #d97706, #3b82f6, #f59e0b);
              background-size: 200% 100%;
              animation: shimmer 3s infinite linear;
            }
            @media only screen and (max-width: 600px) {
              .email-body { padding: 0 !important; background-color: #ffffff !important; }
              .email-card { width: 100% !important; border-radius: 0px !important; box-shadow: none !important; margin: 0 !important; }
              .content-box { padding: 20px 14px !important; }
              .header-box { padding: 22px 14px !important; }
            }
          </style>
        </head>
        <body class="email-body" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px 0; -webkit-text-size-adjust: 100%;">
          <div class="email-card" style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.08);">
            <div class="animated-header-bar-failed"></div>
            <div class="header-box" style="background-color: #ffffff; border-bottom: 1px solid #e2e8f0; padding: 16px 20px; text-align: center; color: #0f172a;">
              <img src="${logoUrl}" alt="${senderName}" style="height: 42px; max-height: 42px; width: auto; margin: 0 auto; display: block; border: 0;" />
              <p style="margin: 6px 0 0 0; color: #64748b; font-size: 12px;">Sample Payment Alert (Test)</p>
            </div>
            <div class="content-box" style="padding: 24px 20px;">
              <div style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border: 1px solid #fde68a; border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 22px;">
                <h2 style="margin: 0; color: #92400e; font-size: 18px; font-weight: 800;">⚡ Sample Payment Incomplete</h2>
                <p style="margin: 4px 0 0 0; color: #b45309; font-size: 13px;">Order: <strong>ORD-TEST-1234</strong> | Total: <strong>₹499</strong></p>
              </div>
              <div style="text-align: center; margin: 26px 0;">
                <a href="${appUrl}/checkout" target="_blank" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; padding: 12px 26px; border-radius: 10px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 14px rgba(245,158,11,0.35);">
                  ⚡ Complete Payment
                </a>
              </div>
              <p style="font-size: 12px; color: #64748b; text-align: center;">This is a test notification email demonstrating payment failure alerts.</p>
            </div>
            <div style="background-color: #f8fafc; padding: 16px 20px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
              <img src="${logoUrl}" alt="${senderName}" style="height: 22px; max-height: 22px; width: auto; opacity: 0.7; margin: 0 auto 4px auto; display: block;" />
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
