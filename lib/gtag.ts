/**
 * lib/gtag.ts
 * Centralized Google Analytics 4 (GA4) helper for PageViews and E-commerce Events.
 */

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID || "G-C3HYF0VYC0"

declare global {
  interface Window {
    gtag?: (...args: any[]) => void
    dataLayer?: any[]
  }
}

// Log page views on SPA route changes
export function pageview(url: string) {
  if (typeof window === "undefined" || !window.gtag) return
  window.gtag("config", GA_MEASUREMENT_ID, {
    page_path: url,
  })
}

// Generic event logger
export function event({
  action,
  category,
  label,
  value,
  params = {},
}: {
  action: string
  category?: string
  label?: string
  value?: number
  params?: Record<string, any>
}) {
  if (typeof window === "undefined" || !window.gtag) return
  window.gtag("event", action, {
    event_category: category,
    event_label: label,
    value: value,
    ...params,
  })
}

// GA4 E-commerce Standard Events
export function gaViewItem(item: { id: string; name: string; category?: string; price: number }) {
  event({
    action: "view_item",
    params: {
      currency: "INR",
      value: item.price,
      items: [
        {
          item_id: item.id,
          item_name: item.name,
          item_category: item.category || "Digital Product",
          price: item.price,
          quantity: 1,
        },
      ],
    },
  })
}

export function gaAddToCart(item: { id: string; name: string; category?: string; price: number; quantity?: number }) {
  event({
    action: "add_to_cart",
    params: {
      currency: "INR",
      value: item.price * (item.quantity || 1),
      items: [
        {
          item_id: item.id,
          item_name: item.name,
          item_category: item.category || "Digital Product",
          price: item.price,
          quantity: item.quantity || 1,
        },
      ],
    },
  })
}

export function gaBeginCheckout(params: { value: number; items?: Array<{ id: string; name: string; price: number }> }) {
  event({
    action: "begin_checkout",
    params: {
      currency: "INR",
      value: params.value,
      items: params.items?.map((i) => ({
        item_id: i.id,
        item_name: i.name,
        price: i.price,
        quantity: 1,
      })),
    },
  })
}

export function gaPurchase(params: { transaction_id: string; value: number; items?: Array<{ id: string; name: string; price: number }> }) {
  event({
    action: "purchase",
    params: {
      transaction_id: params.transaction_id,
      currency: "INR",
      value: params.value,
      items: params.items?.map((i) => ({
        item_id: i.id,
        item_name: i.name,
        price: i.price,
        quantity: 1,
      })),
    },
  })
}
