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
  let apiKey = getEnv('BREVO_API_KEY')
  let senderEmail = getEnv('BREVO_SENDER_EMAIL')
  let senderName = getEnv('BREVO_SENDER_NAME') || 'Grabnext'
  let appUrl = getEnv('NEXT_PUBLIC_APP_URL') || 'https://grabnext.in'

  // Fallback to settings table in D1 DB if env vars are not set
  try {
    const rows = await executeQuery(
      "SELECT key, value FROM settings WHERE key IN ('brevo_api_key', 'brevo_sender_email', 'brevo_sender_name', 'app_url')"
    ).catch((err) => {
      console.warn('[Brevo DB Warning]', err)
      return []
    })

    if (Array.isArray(rows)) {
      for (const r of rows) {
        if (r.key === 'brevo_api_key' && !apiKey) apiKey = r.value
        if (r.key === 'brevo_sender_email' && !senderEmail) senderEmail = r.value
        if (r.key === 'brevo_sender_name' && !senderName) senderName = r.value
        if (r.key === 'app_url' && !appUrl) appUrl = r.value
      }
    }
  } catch (e) {
    console.warn('[Brevo] Could not fetch settings from DB:', e)
  }

  return {
    apiKey: apiKey?.trim(),
    senderEmail: senderEmail?.trim(),
    senderName: senderName?.trim() || 'Grabnext',
    appUrl: appUrl?.replace(/\/$/, '') || 'https://grabnext.in',
  }
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
      return { success: false, error: data.message || JSON.stringify(data) }
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
    const { appUrl, senderName } = await getBrevoSettings()

    // 1. Fetch order details from DB
    const orderRows = await executeQuery('SELECT * FROM orders WHERE id = ? LIMIT 1', [orderId])
    if (!Array.isArray(orderRows) || orderRows.length === 0) {
      console.warn(`[Brevo] Order ${orderId} not found`)
      return { success: false, error: 'Order not found' }
    }
    const order = orderRows[0] as any
    const recipientEmail = order.userEmail
    const recipientName = order.userName || recipientEmail?.split('@')[0] || 'Valued Customer'

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

    const viewAccessUrl = `${appUrl}/checkout/success?utr=${order.paymentId || order.id}`

    // 4. Construct HTML Email Body
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Order Confirmation - ${order.id}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <div style="background-color: #0f172a; padding: 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">${senderName}</h1>
            <p style="margin: 6px 0 0 0; color: #94a3b8; font-size: 14px;">Order & Download Confirmation</p>
          </div>

          <!-- Body Container -->
          <div style="padding: 24px;">
            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 24px;">
              <h2 style="margin: 0; color: #166534; font-size: 18px;">🎉 Thank You for Your Purchase!</h2>
              <p style="margin: 4px 0 0 0; color: #15803d; font-size: 13px;">Your order has been confirmed successfully.</p>
            </div>

            <p style="font-size: 14px; color: #334155; margin-bottom: 20px;">
              Hi <strong>${recipientName}</strong>,<br>
              Here are the download links for your purchased items. You can download them directly below or access them anytime on your dashboard.
            </p>

            <!-- Order Meta Details -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; color: #475569; background-color: #f8fafc; border-radius: 8px; padding: 12px;">
              <tr>
                <td style="padding: 6px 12px;"><strong>Order ID:</strong> ${order.id}</td>
                <td style="padding: 6px 12px; text-align: right;"><strong>Payment Ref (UTR):</strong> ${order.paymentId || 'Completed'}</td>
              </tr>
              <tr>
                <td style="padding: 6px 12px;"><strong>Total Amount:</strong> ₹${order.totalAmount}</td>
                <td style="padding: 6px 12px; text-align: right;"><strong>Status:</strong> Paid</td>
              </tr>
            </table>

            <!-- Downloads Section -->
            <h3 style="color: #0f172a; font-size: 16px; margin: 24px 0 12px 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px;">
              📥 Your Download Links
            </h3>
            ${downloadLinksHtml}

            <!-- Items Purchased Table -->
            <h3 style="color: #0f172a; font-size: 16px; margin: 24px 0 12px 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px;">
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
                  <td style="padding: 12px; font-size: 14px; font-weight: bold; color: #0f172a;">Total Paid</td>
                  <td style="padding: 12px; font-size: 14px; font-weight: bold; color: #0f172a; text-align: right;">₹${order.totalAmount}</td>
                </tr>
              </tbody>
            </table>

            <!-- Direct Button -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="${viewAccessUrl}" target="_blank" style="background-color: #16a34a; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 15px; font-weight: 600; display: inline-block; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                🚀 View Purchases on Store
              </a>
            </div>

            <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 30px;">
              If you have any questions or need help with your download, please reply to this email or contact support.
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
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
    const { appUrl, senderName } = await getBrevoSettings()

    // Fetch order details from DB
    const orderRows = await executeQuery('SELECT * FROM orders WHERE id = ? LIMIT 1', [orderId])
    if (!Array.isArray(orderRows) || orderRows.length === 0) {
      console.warn(`[Brevo] Order ${orderId} not found`)
      return { success: false, error: 'Order not found' }
    }
    const order = orderRows[0] as any
    const recipientEmail = order.userEmail
    const recipientName = order.userName || recipientEmail?.split('@')[0] || 'Valued Customer'

    if (!recipientEmail) {
      console.warn(`[Brevo] Order ${orderId} does not have a userEmail`)
      return { success: false, error: 'User email missing on order' }
    }

    const items: any[] = order.items ? JSON.parse(order.items) : []
    const retryCheckoutUrl = `${appUrl}/checkout`

    let itemsListHtml = ''
    items.forEach((item: any) => {
      itemsListHtml += `
        <li style="margin-bottom: 6px; font-size: 14px; color: #334155;">
          <strong>${item.title || 'Product'}</strong> - ₹${item.price || 0}
        </li>
      `
    })

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Payment Failed - ${order.id}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <div style="background-color: #0f172a; padding: 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 700;">${senderName}</h1>
            <p style="margin: 6px 0 0 0; color: #94a3b8; font-size: 14px;">Payment Notification</p>
          </div>

          <!-- Body Container -->
          <div style="padding: 24px;">
            <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 24px;">
              <h2 style="margin: 0; color: #991b1b; font-size: 18px;">⚠️ Payment Unsuccessful</h2>
              <p style="margin: 4px 0 0 0; color: #dc2626; font-size: 13px;">Your payment for Order #${order.id} could not be completed.</p>
            </div>

            <p style="font-size: 14px; color: #334155; margin-bottom: 20px;">
              Hi <strong>${recipientName}</strong>,<br>
              We noticed that your recent payment attempt for order <strong>${order.id}</strong> (Total: ₹${order.totalAmount}) failed or was cancelled.
            </p>

            ${
              reason
                ? `<p style="font-size: 13px; color: #ef4444; background-color: #fff1f2; padding: 10px; border-radius: 6px;"><strong>Reason:</strong> ${reason}</p>`
                : ''
            }

            <h3 style="color: #0f172a; font-size: 15px; margin: 20px 0 10px 0;">Items in your order:</h3>
            <ul style="padding-left: 20px; margin: 0 0 24px 0;">
              ${itemsListHtml}
            </ul>

            <p style="font-size: 13px; color: #475569; margin-bottom: 24px;">
              Don't worry! If any money was deducted from your bank account, it will automatically be refunded back to you by your bank within 3-5 working days. You can retry your purchase below.
            </p>

            <!-- Retry Button -->
            <div style="text-align: center; margin: 28px 0;">
              <a href="${retryCheckoutUrl}" target="_blank" style="background-color: #ea580c; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 15px; font-weight: 600; display: inline-block;">
                🔄 Retry Checkout / Complete Payment
              </a>
            </div>

            <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 30px;">
              Need help? Feel free to reply to this email and our support team will assist you.
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
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
 * Sends a test email to test Brevo configuration
 */
export async function sendTestBrevoEmail(toEmail: string) {
  const { senderName } = await getBrevoSettings()
  const htmlContent = `
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #2563eb;">✅ Brevo Email Integration Working!</h2>
      <p>This is a test email sent from <strong>${senderName}</strong> using Brevo Transactional Email Service.</p>
      <p style="font-size: 12px; color: #64748b;">Timestamp: ${new Date().toISOString()}</p>
    </div>
  `
  return await sendBrevoEmail({
    toEmail,
    subject: `Test Email from ${senderName}`,
    htmlContent,
  })
}
