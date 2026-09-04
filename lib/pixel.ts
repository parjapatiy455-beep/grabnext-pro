/**
 * lib/pixel.ts
 * Centralized Meta (Facebook) Pixel, CAPI & Google Analytics (GA4) helper.
 */

import { gaViewItem, gaAddToCart, gaBeginCheckout, gaPurchase } from "@/lib/gtag"

export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID || "864520106659183"

// ── TypeScript declarations ───────────────────────────────────────────────────
declare global {
  interface Window {
    fbq: (...args: any[]) => void
    _fbq: (...args: any[]) => void
  }
}

export type StandardEvent =
  | "PageView"
  | "ViewContent"
  | "AddToCart"
  | "InitiateCheckout"
  | "AddPaymentInfo"
  | "Purchase"
  | "Lead"
  | "CompleteRegistration"

export interface UserData {
  email?: string
  phone?: string
  firstName?: string
  lastName?: string
  external_id?: string // e.g. user.uid
  client_ip_address?: string
  client_user_agent?: string
}

// ── Core safe fbq wrapper ─────────────────────────────────────────────────────
function _fbq(
  action: "track" | "trackCustom" | "init" | "set",
  eventName: string,
  params?: Record<string, any>,
  options?: { eventID?: string }
): void {
  if (typeof window === "undefined") return
  if (typeof window.fbq !== "function") return
  if (!eventName || typeof eventName !== "string" || eventName.trim() === "") {
    console.warn("[Meta Pixel] Blocked: fbq called with empty or invalid event name.")
    return
  }

  const args: any[] = [action, eventName]
  if (params && Object.keys(params).length > 0) {
    args.push(params)
    if (options && Object.keys(options).length > 0) {
      args.push(options)
    }
  } else if (options && Object.keys(options).length > 0) {
    args.push({}) // must pass empty params if passing options as 4th arg
    args.push(options)
  }

  window.fbq.apply(null, args)
}

export { _fbq as fbq }

// ── CAPI Sync Helper ──────────────────────────────────────────────────────────
export function trackEventWithCAPI(
  eventName: StandardEvent | string,
  customData: Record<string, any> = {},
  userData: UserData = {},
  isCustom = false
) {
  const eventId = typeof crypto !== "undefined" && crypto.randomUUID 
    ? crypto.randomUUID() 
    : `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

  const action = isCustom ? "trackCustom" : "track"

  _fbq(action, eventName, customData, { eventID: eventId })

  if (typeof window !== "undefined") {
    const eventUrl = window.location.href

    fetch("/api/capi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventName,
        eventUrl,
        eventId,
        customData,
        userData,
      }),
    }).catch(err => {
      if (process.env.NODE_ENV !== "production") {
        console.error("[CAPI] Failed to dispatch event:", err)
      }
    })
  }
}

// ── Standard event helpers (Meta + GA4 Dual Tracker) ──────────────────────────

export function trackPageView(userData?: UserData): void {
  trackEventWithCAPI("PageView", {}, userData)
}

export function trackViewContent(params: {
  content_name: string
  content_category?: string
  content_ids: string[]
  contents?: Array<{ id: string; quantity: number; item_price?: number }>
  value: number
  currency?: string
}, userData?: UserData): void {
  trackEventWithCAPI("ViewContent", {
    content_type: "product",
    currency: "INR",
    ...params,
  }, userData)

  // Dual Track in Google Analytics (GA4)
  gaViewItem({
    id: params.content_ids[0] || "product",
    name: params.content_name,
    category: params.content_category,
    price: params.value,
  })
}

export function trackAddToCart(params: {
  content_name: string
  content_ids: string[]
  contents?: Array<{ id: string; quantity: number; item_price?: number }>
  value: number
  currency?: string
}, userData?: UserData): void {
  trackEventWithCAPI("AddToCart", {
    content_type: "product",
    currency: "INR",
    ...params,
  }, userData)

  // Dual Track in Google Analytics (GA4)
  gaAddToCart({
    id: params.content_ids[0] || "product",
    name: params.content_name,
    price: params.value,
    quantity: params.contents?.[0]?.quantity || 1,
  })
}

export function trackInitiateCheckout(params: {
  value: number
  num_items?: number
  content_ids?: string[]
  contents?: Array<{ id: string; quantity: number; item_price?: number }>
  currency?: string
}, userData?: UserData): void {
  trackEventWithCAPI("InitiateCheckout", {
    currency: "INR",
    ...params,
  }, userData)

  // Dual Track in Google Analytics (GA4)
  gaBeginCheckout({
    value: params.value,
    items: params.contents?.map((c) => ({ id: c.id, name: c.id, price: c.item_price || params.value })),
  })
}

export function trackAddPaymentInfo(params: {
  value: number
  num_items?: number
  content_ids?: string[]
  contents?: Array<{ id: string; quantity: number; item_price?: number }>
  currency?: string
}, userData?: UserData): void {
  trackEventWithCAPI("AddPaymentInfo", {
    currency: "INR",
    ...params,
  }, userData)
}

export function trackPurchase(params: {
  value: number
  content_ids: string[]
  contents?: Array<{ id: string; quantity: number; item_price?: number }>
  currency?: string
}, userData?: UserData): void {
  trackEventWithCAPI("Purchase", {
    content_type: "product",
    currency: "INR",
    ...params,
  }, userData)

  // Dual Track in Google Analytics (GA4)
  gaPurchase({
    transaction_id: `tx_${Date.now()}`,
    value: params.value,
    items: params.contents?.map((c) => ({ id: c.id, name: c.id, price: c.item_price || params.value })),
  })
}

export function trackLead(params?: {
  content_name?: string
  value?: number
  currency?: string
}, userData?: UserData): void {
  trackEventWithCAPI("Lead", params || {}, userData)
}

export function trackCompleteRegistration(params?: {
  content_name?: string
  status?: boolean | string
}, userData?: UserData): void {
  trackEventWithCAPI("CompleteRegistration", params || {}, userData)
}
