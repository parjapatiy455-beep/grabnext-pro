import { getRequestContext } from '@cloudflare/next-on-pages'
import { executeQuery } from '@/lib/db'

function getEnv(key: string): string | undefined {
  try {
    const ctx = getRequestContext()
    return (ctx?.env as any)?.[key] ?? process.env[key]
  } catch {
    return process.env[key]
  }
}

export async function getBrevoSettings() {
  const envApiKey = getEnv('BREVO_API_KEY')?.trim()
  const envSenderEmail = getEnv('BREVO_SENDER_EMAIL')?.trim()
  const envSenderName = getEnv('BREVO_SENDER_NAME')?.trim()
  const envAppUrl = getEnv('NEXT_PUBLIC_APP_URL')?.trim()
  const envWhatsapp = getEnv('WHATSAPP_NUMBER')?.trim()

  let dbApiKey = ''
  let dbSenderEmail = ''
  let dbSenderName = ''
  let dbAppUrl = ''
  let dbWhatsapp = ''

  // Query settings table in D1 DB as backup / primary admin config
  try {
    const rows = await executeQuery(
      "SELECT key, value FROM settings WHERE key IN ('brevo_api_key', 'brevo_sender_email', 'brevo_sender_name', 'app_url', 'whatsapp_number')"
    ).catch((err) => {
      console.warn('[Brevo DB Warning]', err)
      return []
    })

    if (Array.isArray(rows)) {
      for (const r of rows) {
        if (r.key === 'brevo_api_key') dbApiKey = r.value?.trim() || ''
        if (r.key === 'brevo_sender_email') dbSenderEmail = r.value?.trim() || ''
        if (r.key === 'brevo_sender_name') dbSenderName = r.value?.trim() || ''
        if (r.key === 'app_url') dbAppUrl = r.value?.trim() || ''
        if (r.key === 'whatsapp_number') dbWhatsapp = r.value?.trim() || ''
      }
    }
  } catch (e) {
    console.warn('[Brevo] Could not fetch settings from DB:', e)
  }

  // Precedence: ENV variable > Database Setting > Default
  const apiKey = envApiKey || dbApiKey || ''
  const senderEmail = envSenderEmail || dbSenderEmail || ''
  const senderName = envSenderName || dbSenderName || 'Grabnext'
  const appUrl = envAppUrl || dbAppUrl || 'https://grabnext.in'
  const whatsappNumber = (envWhatsapp || dbWhatsapp || '917500167987').replace(/[^0-9]/g, '')

  const source = envApiKey
    ? 'env'
    : dbApiKey
    ? 'database'
    : 'none'

  return {
    apiKey,
    senderEmail,
    senderName,
    appUrl: appUrl.replace(/\/$/, ''),
    whatsappNumber,
    source,
    isEnvConfigured: Boolean(envApiKey && envSenderEmail),
    isDbConfigured: Boolean(dbApiKey && dbSenderEmail),
  }
}

export function getWhatsAppBoxHtml(whatsappNumber: string, senderName: string, textContext: string) {
  const cleanNumber = whatsappNumber || '917500167987'
  const waUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(`Hi ${senderName}, I need help with ${textContext}`)}`
  return `
    <!-- WhatsApp Support Toggle Box -->
    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px 20px; margin-top: 24px; text-align: center;">
      <p style="margin: 0 0 10px 0; font-size: 13px; color: #166534; font-weight: 600;">
        💬 Need Instant Help or Have Questions? Chat with us on WhatsApp!
      </p>
      <a href="${waUrl}" target="_blank" style="background-color: #25D366; color: #ffffff; text-decoration: none; padding: 10px 22px; border-radius: 999px; font-size: 13px; font-weight: 700; display: inline-block; box-shadow: 0 4px 12px rgba(37, 211, 102, 0.35);">
        🟢 Chat on WhatsApp (+${cleanNumber})
      </a>
    </div>
  `
}

export async function sendBrevoEmail({
  toEmail,
  toName,
  subject,
  htmlContent,
}: {
  toEmail: string
  toName?: string
  subject: string
  htmlContent: string
}) {
  const { apiKey, senderEmail, senderName } = await getBrevoSettings()

  if (!apiKey) {
    console.error('[Brevo Error] BREVO_API_KEY is not configured.')
    return { success: false, error: 'BREVO_API_KEY is missing' }
  }

  if (!senderEmail) {
    console.error('[Brevo Error] BREVO_SENDER_EMAIL is not configured.')
    return { success: false, error: 'BREVO_SENDER_EMAIL is missing' }
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to: [
          {
            email: toEmail.trim(),
            name: toName || toEmail.split('@')[0],
          },
        ],
        subject,
        htmlContent,
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      console.error('[Brevo API Error]', data)
      let errMsg = data.message || JSON.stringify(data)
      if (errMsg.toLowerCase().includes('key not found') || data.code === 'unauthorized') {
        errMsg = "Brevo API Key Invalid (Key not found). Please generate a new key on Brevo.com -> Profile -> 'SMTP & API' -> 'API Keys' tab."
      }
      return { success: false, error: errMsg }
    }

    console.log(`[Brevo Email Sent] Message ID: ${data.messageId} to ${toEmail}`)
    return { success: true, messageId: data.messageId }
  } catch (err: any) {
    console.error('[Brevo Exception]', err)
    return { success: false, error: err.message || 'Failed to send email' }
  }
}

/**
 * Sends a Purchase Success email with Product Download Links to the customer
 */
export async function sendOrderSuccessEmail(orderId: string) {
  try {
    const { appUrl, senderName, whatsappNumber } = await getBrevoSettings()

    // 1. Fetch order details from DB with JOIN to users table as fallback
    let orderRows = await executeQuery(`
      SELECT 
        o.*,
        u.displayName AS u_name,
        u.email AS u_email
      FROM orders o
      LEFT JOIN users u ON o.userId = u.uid
      WHERE o.id = ? LIMIT 1
    `, [orderId]).catch(() => [])

    if (!Array.isArray(orderRows) || orderRows.length === 0) {
      orderRows = await executeQuery('SELECT * FROM orders WHERE id = ? LIMIT 1', [orderId])
    }

    if (!Array.isArray(orderRows) || orderRows.length === 0) {
      console.warn(`[Brevo] Order ${orderId} not found`)
      return { success: false, error: 'Order not found' }
    }
    const order = orderRows[0] as any
    const recipientEmail = order.userEmail || order.u_email || (order.userId && order.userId.includes('@') ? order.userId : null)
    const recipientName = order.userName || order.u_name || (recipientEmail ? recipientEmail.split('@')[0] : 'Valued Customer')

    if (!recipientEmail) {
      console.warn(`[Brevo] Order ${orderId} does not have a userEmail`)
      return { success: false, error: 'User email missing on order' }
    }

    const items: any[] = order.items ? JSON.parse(order.items) : []
    const productIds = items.map((item) => item.productId).filter(Boolean)

    // 2. Fetch product download URLs
    let productsMap: Record<string, any> = {}
    if (productIds.length > 0) {
      const placeholders = productIds.map(() => '?').join(',')
      const productsRows = await executeQuery(
        `SELECT id, title, downloadUrl, price FROM products WHERE id IN (${placeholders})`,
        productIds
      )
      if (Array.isArray(productsRows)) {
        for (const p of productsRows) {
          productsMap[p.id] = p
        }
      }
    }

    // 3. Build product rows & download links HTML
    let itemsTableHtml = ''
    let downloadLinksHtml = ''

    items.forEach((item: any) => {
      const pId = item.productId || item.id
      const product = productsMap[pId] || {}
      const title = item.title || product.title || 'Digital Product'
      const price = item.price ?? product.price ?? 0
      const formattedPrice = `₹${price}`

      itemsTableHtml += `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eeeeee; font-size: 14px; color: #333333;">
            <strong>${title}</strong>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eeeeee; font-size: 14px; color: #333333; text-align: right;">
            ${formattedPrice}
          </td>
        </tr>
      `

      // Parse download URLs/assets
      const rawDownloadUrl = product.downloadUrl || item.downloadUrl
      let assets: any[] = []
      if (rawDownloadUrl) {
        try {
          assets = JSON.parse(rawDownloadUrl)
        } catch {
          assets = [
            {
              id: 'legacy',
              name: title,
              type: 'file',
              provider: 'external',
              url: rawDownloadUrl,
            },
          ]
        }
      }

      downloadLinksHtml += `
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <h4 style="margin: 0 0 10px 0; color: #1e293b; font-size: 15px;">📦 ${title}</h4>
      `

      if (assets.length > 0) {
        assets.forEach((asset: any) => {
          const isLegacy = asset.id === 'legacy'
          const downloadUrl = isLegacy
            ? asset.url
            : `${appUrl}/api/user/secure-asset?productId=${pId}&assetId=${asset.id}`

          downloadLinksHtml += `
            <div style="margin-top: 8px; display: flex; align-items: center; justify-content: space-between;">
              <span style="font-size: 13px; color: #475569; font-weight: 500;">🔹 ${asset.name || 'Download File'}</span>
              <a href="${downloadUrl}" target="_blank" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 8px 14px; border-radius: 6px; font-size: 12px; font-weight: 600; display: inline-block;">
                📥 Access / Download
              </a>
            </div>
          `
        })
      } else {
        const directUrl = `${appUrl}/checkout/success?utr=${order.paymentId || order.id}`
        downloadLinksHtml += `
          <div style="margin-top: 8px;">
            <a href="${directUrl}" target="_blank" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 8px 14px; border-radius: 6px; font-size: 12px; font-weight: 600; display: inline-block;">
              ⚡ View Downloads Page
            </a>
          </div>
        `
      }

      downloadLinksHtml += `</div>`
    })

    const logoUrl = `${appUrl}/logo.png`
    const viewAccessUrl = `${appUrl}/checkout/success?utr=${order.paymentId || order.id}`

    // 4. Construct Animated HTML Email Body with Logo
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation - ${order.id}</title>
        <style>
          @keyframes pulseGlow {
            0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.4); }
            50% { box-shadow: 0 0 16px 4px rgba(37, 99, 235, 0.5); }
            100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.4); }
          }
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
          .pulse-btn {
            animation: pulseGlow 2.5s infinite ease-in-out;
          }
        </style>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);">
          
          <!-- Animated Accent Top Line -->
          <div class="animated-header-bar" style="height: 4px; background: linear-gradient(90deg, #2563eb, #8b5cf6, #ec4899); text-align: center;"></div>

          <!-- Header with Brand Logo -->
          <div style="background-color: #0f172a; padding: 28px 24px; text-align: center; color: #ffffff;">
            <img src="${logoUrl}" alt="${senderName}" style="max-height: 48px; width: auto; display: block; margin: 0 auto 12px auto; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4)); border: 0;" />
            <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px; color: #ffffff;">${senderName}</h1>
            <p style="margin: 6px 0 0 0; color: #94a3b8; font-size: 13px; font-weight: 500;">Order & Instant Download Confirmation</p>
          </div>

          <!-- Body Container -->
          <div style="padding: 28px 24px;">
            
            <!-- Success Status Badge -->
            <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 1px solid #bbf7d0; border-radius: 12px; padding: 18px; text-align: center; margin-bottom: 24px; box-shadow: inset 0 1px 0 rgba(255,255,255,0.6);">
              <h2 style="margin: 0; color: #166534; font-size: 19px; font-weight: 800;">🎉 Purchase Confirmed!</h2>
              <p style="margin: 4px 0 0 0; color: #15803d; font-size: 13px; font-weight: 500;">Your digital files are ready to download immediately.</p>
            </div>

            <p style="font-size: 14px; color: #334155; margin-bottom: 20px; line-height: 1.5;">
              Hi <strong>${recipientName}</strong>,<br>
              Thank you for shopping with us! Here are your direct product download links. You can click on any file below to download it right now.
            </p>

            <!-- Order Meta Details Box -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; color: #475569; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;">
              <tr>
                <td style="padding: 10px 14px;"><strong>Order ID:</strong> <span style="font-family: monospace; font-weight: 700; color: #0f172a;">${order.id}</span></td>
                <td style="padding: 10px 14px; text-align: right;"><strong>Payment Ref:</strong> <span style="font-family: monospace; color: #2563eb;">${order.paymentId || 'Completed'}</span></td>
              </tr>
              <tr>
                <td style="padding: 10px 14px; border-top: 1px dashed #e2e8f0;"><strong>Total Paid:</strong> ₹${order.totalAmount}</td>
                <td style="padding: 10px 14px; text-align: right; border-top: 1px dashed #e2e8f0;"><span style="background-color: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 999px; font-weight: 700; font-size: 11px;">PAID</span></td>
              </tr>
            </table>

            <!-- Downloads Section -->
            <h3 style="color: #0f172a; font-size: 16px; font-weight: 700; margin: 24px 0 14px 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
              📥 Your Download Links
            </h3>
            ${downloadLinksHtml}

            <!-- Items Summary Table -->
            <h3 style="color: #0f172a; font-size: 16px; font-weight: 700; margin: 24px 0 14px 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
              🛍️ Order Summary
            </h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <thead>
                <tr style="background-color: #f1f5f9; text-align: left;">
                  <th style="padding: 10px 12px; font-size: 12px; color: #475569; text-transform: uppercase;">Product</th>
                  <th style="padding: 10px 12px; font-size: 12px; color: #475569; text-transform: uppercase; text-align: right;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsTableHtml}
                <tr>
                  <td style="padding: 12px; font-size: 14px; font-weight: 800; color: #0f172a;">Total Paid</td>
                  <td style="padding: 12px; font-size: 14px; font-weight: 800; color: #0f172a; text-align: right;">₹${order.totalAmount}</td>
                </tr>
              </tbody>
            </table>

            <!-- Animated Call-to-Action Button -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="${viewAccessUrl}" target="_blank" class="pulse-btn" style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-size: 15px; font-weight: 700; display: inline-block; box-shadow: 0 4px 14px rgba(22, 163, 74, 0.35);">
                🚀 View Purchases on Store
              </a>
            </div>

            ${getWhatsAppBoxHtml(whatsappNumber, senderName, `Order ${order.id}`)}

            <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 28px; line-height: 1.4;">
              If you have any questions or need assistance, simply reply to this email.
            </p>
          </div>

          <!-- Footer with Logo -->
          <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
            <img src="${logoUrl}" alt="${senderName}" style="max-height: 24px; width: auto; opacity: 0.6; margin: 0 auto 6px auto; display: block;" />
            © ${new Date().getFullYear()} ${senderName}. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `

    return await sendBrevoEmail({
      toEmail: recipientEmail,
      toName: recipientName,
      subject: `🎉 Order Confirmed! Downloads Ready - ${order.id}`,
      htmlContent,
    })
  } catch (error: any) {
    console.error('[Brevo sendOrderSuccessEmail Error]', error)
    return { success: false, error: error.message || 'Error processing success email' }
  }
}

/**
 * Sends a Payment Failed alert email to the customer with retry link
 */
export async function sendOrderFailedEmail(orderId: string, reason?: string) {
  try {
    const { appUrl, senderName, whatsappNumber } = await getBrevoSettings()

    // Fetch order details from DB with JOIN to users table as fallback
    let orderRows = await executeQuery(`
      SELECT 
        o.*,
        u.displayName AS u_name,
        u.email AS u_email
      FROM orders o
      LEFT JOIN users u ON o.userId = u.uid
      WHERE o.id = ? LIMIT 1
    `, [orderId]).catch(() => [])

    if (!Array.isArray(orderRows) || orderRows.length === 0) {
      orderRows = await executeQuery('SELECT * FROM orders WHERE id = ? LIMIT 1', [orderId])
    }

    if (!Array.isArray(orderRows) || orderRows.length === 0) {
      console.warn(`[Brevo] Order ${orderId} not found`)
      return { success: false, error: 'Order not found' }
    }
    const order = orderRows[0] as any
    const recipientEmail = order.userEmail || order.u_email || (order.userId && order.userId.includes('@') ? order.userId : null)
    const recipientName = order.userName || order.u_name || (recipientEmail ? recipientEmail.split('@')[0] : 'Valued Customer')

    if (!recipientEmail) {
      console.warn(`[Brevo] Order ${orderId} does not have a valid userEmail`)
      return { success: false, error: 'User email missing on order' }
    }

    const items: any[] = order.items ? JSON.parse(order.items) : []
    const retryCheckoutUrl = `${appUrl}/checkout`
    const logoUrl = `${appUrl}/logo.png`

    let itemsListHtml = ''
    items.forEach((item: any) => {
      itemsListHtml += `
        <li style="margin-bottom: 8px; font-size: 14px; color: #334155;">
          <strong>${item.title || 'Product'}</strong> — <span style="color: #0f172a; font-weight: 700;">₹${item.price || 0}</span>
        </li>
      `
    })

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Unsuccessful - ${order.id}</title>
        <style>
          @keyframes pulseFailed {
            0% { box-shadow: 0 0 0 0 rgba(234, 88, 12, 0.4); }
            50% { box-shadow: 0 0 16px 4px rgba(234, 88, 12, 0.5); }
            100% { box-shadow: 0 0 0 0 rgba(234, 88, 12, 0.4); }
          }
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
          .pulse-btn-failed {
            animation: pulseFailed 2.5s infinite ease-in-out;
          }
        </style>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);">
          
          <!-- Animated Accent Top Line -->
          <div class="animated-header-bar-failed"></div>

          <!-- Header with Brand Logo -->
          <div style="background-color: #0f172a; padding: 28px 24px; text-align: center; color: #ffffff;">
            <img src="${logoUrl}" alt="${senderName}" style="max-height: 48px; width: auto; display: block; margin: 0 auto 12px auto; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4)); border: 0;" />
            <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff;">${senderName}</h1>
            <p style="margin: 6px 0 0 0; color: #94a3b8; font-size: 13px; font-weight: 500;">Payment Status Alert</p>
          </div>

          <!-- Body Container -->
          <div style="padding: 28px 24px;">
            
            <!-- Failed Banner -->
            <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border: 1px solid #fecaca; border-radius: 12px; padding: 18px; text-align: center; margin-bottom: 24px;">
              <h2 style="margin: 0; color: #991b1b; font-size: 19px; font-weight: 800;">⚠️ Payment Unsuccessful</h2>
              <p style="margin: 4px 0 0 0; color: #dc2626; font-size: 13px; font-weight: 500;">Your payment for Order #${order.id} was not completed.</p>
            </div>

            <p style="font-size: 14px; color: #334155; margin-bottom: 20px; line-height: 1.5;">
              Hi <strong>${recipientName}</strong>,<br>
              We noticed that your recent payment attempt for order <strong style="color: #0f172a;">${order.id}</strong> (Total: <strong>₹${order.totalAmount}</strong>) was cancelled or interrupted.
            </p>

            ${
              reason
                ? `<p style="font-size: 13px; color: #b91c1c; background-color: #fff1f2; border: 1px solid #fecaca; padding: 12px 16px; border-radius: 8px; font-weight: 500;"><strong>Notice:</strong> ${reason}</p>`
                : ''
            }

            <h3 style="color: #0f172a; font-size: 15px; font-weight: 700; margin: 24px 0 10px 0;">Items waiting in your order:</h3>
            <ul style="padding-left: 20px; margin: 0 0 24px 0;">
              ${itemsListHtml}
            </ul>

            <p style="font-size: 13px; color: #475569; margin-bottom: 24px; line-height: 1.5; background-color: #f8fafc; padding: 12px 16px; border-radius: 8px; border-left: 4px solid #f97316;">
              💡 <strong>Need to try again?</strong> If any amount was debited by your bank, it will be automatically refunded within 3-5 business days. You can complete your purchase using the retry link below.
            </p>

            <!-- Animated Retry Button -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="${retryCheckoutUrl}" target="_blank" class="pulse-btn-failed" style="background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-size: 15px; font-weight: 700; display: inline-block; box-shadow: 0 4px 14px rgba(234, 88, 12, 0.35);">
                🔄 Retry Checkout / Complete Payment
              </a>
            </div>

            ${getWhatsAppBoxHtml(whatsappNumber, senderName, `Failed Payment Order ${order.id}`)}

            <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 28px;">
              Need help with payment? Reply directly to this email and our support team will assist you.
            </p>
          </div>

          <!-- Footer with Logo -->
          <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
            <img src="${logoUrl}" alt="${senderName}" style="max-height: 24px; width: auto; opacity: 0.6; margin: 0 auto 6px auto; display: block;" />
            © ${new Date().getFullYear()} ${senderName}. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `

    return await sendBrevoEmail({
      toEmail: recipientEmail,
      toName: recipientName,
      subject: `⚠️ Payment Unsuccessful for Order ${order.id}`,
      htmlContent,
    })
  } catch (error: any) {
    console.error('[Brevo sendOrderFailedEmail Error]', error)
    return { success: false, error: error.message || 'Error processing failure email' }
  }
}

/**
 * Sends an Account Confirmation & Password Creation email to Guest Checkout Users
 */
export async function sendGuestAccountEmail({
  toEmail,
  toName,
  temporaryPassword,
}: {
  toEmail: string
  toName?: string
  temporaryPassword?: string
}) {
  try {
    const { appUrl, senderName, whatsappNumber } = await getBrevoSettings()
    const logoUrl = `${appUrl}/logo.png`
    const loginUrl = `${appUrl}/login`
    const recipientName = toName || toEmail.split('@')[0] || 'Valued Customer'

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Created & Password Set - ${senderName}</title>
        <style>
          @keyframes pulseGlow {
            0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.4); }
            50% { box-shadow: 0 0 16px 4px rgba(37, 99, 235, 0.5); }
            100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.4); }
          }
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
          .pulse-btn {
            animation: pulseGlow 2.5s infinite ease-in-out;
          }
        </style>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);">
          
          <!-- Animated Accent Top Line -->
          <div class="animated-header-bar"></div>

          <!-- Header with Brand Logo -->
          <div style="background-color: #0f172a; padding: 28px 24px; text-align: center; color: #ffffff;">
            <img src="${logoUrl}" alt="${senderName}" style="max-height: 48px; width: auto; display: block; margin: 0 auto 12px auto; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4)); border: 0;" />
            <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff;">${senderName}</h1>
            <p style="margin: 6px 0 0 0; color: #94a3b8; font-size: 13px; font-weight: 500;">Account Creation & Password Setup</p>
          </div>

          <!-- Body Container -->
          <div style="padding: 28px 24px;">
            
            <!-- Welcome Banner -->
            <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 1px solid #bbf7d0; border-radius: 12px; padding: 18px; text-align: center; margin-bottom: 24px;">
              <h2 style="margin: 0; color: #166534; font-size: 19px; font-weight: 800;">🎉 Welcome to ${senderName}!</h2>
              <p style="margin: 4px 0 0 0; color: #15803d; font-size: 13px; font-weight: 500;">Your account has been created for your checkout purchase.</p>
            </div>

            <p style="font-size: 14px; color: #334155; margin-bottom: 20px; line-height: 1.5;">
              Hi <strong>${recipientName}</strong>,<br>
              An account has been created for you so you can access your purchased downloads anytime from your personal dashboard.
            </p>

            <!-- Login Details Card -->
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <h3 style="margin: 0 0 14px 0; color: #0f172a; font-size: 15px; font-weight: 700; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
                🔑 Your Login Credentials:
              </h3>
              <p style="margin: 8px 0; font-size: 13px; color: #334155;">
                <strong>Email Address:</strong> <span style="font-family: monospace; color: #2563eb; font-weight: 700;">${toEmail}</span>
              </p>
              ${
                temporaryPassword
                  ? `
                    <p style="margin: 8px 0; font-size: 13px; color: #334155;">
                      <strong>Temporary Password:</strong> <span style="background: #e2e8f0; padding: 4px 10px; border-radius: 6px; font-family: monospace; font-weight: 800; color: #0f172a; letter-spacing: 0.5px;">${temporaryPassword}</span>
                    </p>
                  `
                  : ''
              }
            </div>

            <p style="font-size: 13px; color: #475569; margin-bottom: 24px; line-height: 1.5; background-color: #eff6ff; padding: 12px 16px; border-radius: 8px; border-left: 4px solid #2563eb;">
              💡 <strong>Tip:</strong> You can use these credentials to log in to your dashboard anytime and view all your purchases and download links.
            </p>

            <!-- Call-to-Action Button -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="${loginUrl}" target="_blank" class="pulse-btn" style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-size: 15px; font-weight: 700; display: inline-block; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);">
                🔐 Log In to Your Account
              </a>
            </div>

            ${getWhatsAppBoxHtml(whatsappNumber, senderName, 'account login & password setup')}

            <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 28px;">
              If you did not request this account creation, please ignore this email.
            </p>
          </div>

          <!-- Footer with Logo -->
          <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
            <img src="${logoUrl}" alt="${senderName}" style="max-height: 24px; width: auto; opacity: 0.6; margin: 0 auto 6px auto; display: block;" />
            © ${new Date().getFullYear()} ${senderName}. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `

    return await sendBrevoEmail({
      toEmail,
      toName: recipientName,
      subject: `🔑 Welcome! Account Created & Password Info - ${senderName}`,
      htmlContent,
    })
  } catch (error: any) {
    console.error('[Brevo sendGuestAccountEmail Error]', error)
    return { success: false, error: error.message || 'Error sending guest account email' }
  }
}

/**
 * Sends a test email to test Brevo configuration
 */
export async function sendTestBrevoEmail(toEmail: string) {
  const { senderName, source, appUrl, whatsappNumber } = await getBrevoSettings()
  const logoUrl = `${appUrl}/logo.png`
  const htmlContent = `
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
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f1f5f9; padding: 20px; margin: 0;">
      <div style="max-width: 550px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);">
        <div class="animated-header-bar"></div>
        <div style="background-color: #0f172a; padding: 24px; text-align: center; color: #ffffff;">
          <img src="${logoUrl}" alt="${senderName}" style="max-height: 44px; width: auto; margin: 0 auto 10px auto; display: block; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));" />
          <h2 style="margin: 0; font-size: 20px; font-weight: 800;">${senderName}</h2>
          <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 13px;">Email Service Verification Test</p>
        </div>
        <div style="padding: 24px;">
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 16px; text-align: center; margin-bottom: 20px;">
            <h3 style="margin: 0; color: #166534; font-size: 17px;">✅ Brevo Service Connected Successfully!</h3>
            <p style="margin: 4px 0 0 0; color: #15803d; font-size: 13px;">Your email configuration is working and ready to deliver transactional emails.</p>
          </div>
          <p style="font-size: 13px; color: #475569; margin: 0 0 12px 0;"><strong>Credentials Source:</strong> <span style="background: #e2e8f0; padding: 2px 8px; border-radius: 4px; font-weight: 700; color: #0f172a;">${source.toUpperCase()}</span></p>
          <p style="font-size: 12px; color: #94a3b8; margin: 0;">Sent at: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</p>

          ${getWhatsAppBoxHtml(whatsappNumber, senderName, 'testing email service')}
        </div>
        <div style="background-color: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
          <img src="${logoUrl}" alt="${senderName}" style="max-height: 20px; width: auto; opacity: 0.6; margin: 0 auto 4px auto; display: block;" />
          © ${new Date().getFullYear()} ${senderName}. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `
  return await sendBrevoEmail({
    toEmail,
    subject: `✅ Test Email from ${senderName}`,
    htmlContent,
  })
}
