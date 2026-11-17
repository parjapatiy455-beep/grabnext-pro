// WhatsApp Helpers and Templates (Safe for both Server and Client Components)

export function formatWhatsAppPhone(phone?: string | null): string {
  if (!phone) return ''
  let cleaned = String(phone).replace(/[^0-9]/g, '')
  if (!cleaned) return ''
  // 10 digits Indian mobile number without country code
  if (cleaned.length === 10) {
    return `91${cleaned}`
  }
  // 11 digits starting with 0 (e.g. 09876543210)
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return `91${cleaned.slice(1)}`
  }
  return cleaned
}

export const DEFAULT_PENDING_TEMPLATE = `Hello {{name}} ji! 👋

Aapka {{site_name}} par order #{{order_id}} incomplete reh gaya tha.

📦 Products: {{products}}
💰 Original Price: {{original_amount}}
🔥 Special 10% OFF: Pay only {{amount}}!

Aapko login karne ki koi zaroorat nahi hai. Niche diye gaye link par click karke aap apna order complete kar sakte hain aur payment ke turant baad product access kar sakte hain:
👉 {{recovery_link}}

Agar koi sawal ya dikkat ho to aap hume yahan WhatsApp par message kar sakte hain. Thank you! 😊`

export const DEFAULT_PAID_TEMPLATE = `Hello {{name}} ji! 🎉

Thank you for your order at {{site_name}}!
Aapka order #{{order_id}} successfully complete ho gaya hai.

📦 Products: {{products}}
💰 Amount Paid: {{amount}}

Aap apne products niche diye gaye link se download ya access kar sakte hain:
📥 {{download_links}}

Agar aapko access karne me koi bhi issue aaye, to isi WhatsApp chat par reply karein. Happy learning! 🚀`
