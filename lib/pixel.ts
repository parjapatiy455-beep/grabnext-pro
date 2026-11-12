/**
 * lib/pixel.ts
 * Centralized Meta (Facebook) Pixel, CAPI & Google Analytics (GA4) helper.
 */

import { gaViewItem, gaAddToCart, gaBeginCheckout, gaPurchase } from "@/lib/gtag"

const envPixelList = (process.env.NEXT_PUBLIC_FB_PIXEL_IDS || process.env.NEXT_PUBLIC_FB_PIXEL_ID || "")
  .split(",")
  .map(id => id.trim())
  .filter(Boolean)

export const ALL_FB_PIXEL_IDS = Array.from(new Set(envPixelList))

// Optional env fallback only (no hardcoded pixel IDs; Admin Panel Primary Pixel is authoritative)
export const FB_PIXEL_ID = ALL_FB_PIXEL_IDS[0] || ""

// Set of initialized pixel IDs in window
const initializedInWindow = new Set<string>()
let runtimePrimaryPixelId: string | null = null
let primaryPixelPromise: Promise<string> | null = null

export function setRuntimePrimaryPixelId(pixelId: string | null): void {
  const clean = pixelId && pixelId.trim().length > 4 ? pixelId.trim() : null
  runtimePrimaryPixelId = clean
  if (typeof window !== "undefined") {
    ;(window as any).__GRABNEXT_PRIMARY_PIXEL__ = clean
  }
}

/**
 * Resolves the active Pixel ID with strict isolation:
 * Priority:
 * 1. URL param (?pixel= or ?pixel_id= or ?fb_pixel=)
 * 2. sessionStorage ("grabnext_active_pixel")
 * 3. explicitPixelId passed from product/action (Admin Product Form)
 * 4. Admin Panel Primary / Fallback Pixel (loaded from /api/pixels)
 * 5. Optional env fallback (FB_PIXEL_ID)
 */
export function getActivePixelId(explicitPixelId?: string | null): string {
  if (typeof window !== "undefined") {
    try {
      // 1. Highest priority: URL query param (?pixel=... or ?pixel_id=... or ?fb_pixel=...)
      const sp = new URLSearchParams(window.location.search)
      const urlPixel = sp.get("pixel") || sp.get("pixel_id") || sp.get("fb_pixel")
      if (urlPixel && urlPixel.trim().length > 4) {
        const clean = urlPixel.trim()
        sessionStorage.setItem("grabnext_active_pixel", clean)
        return clean
      }

      // 2. Second priority: Active pixel stored in browser session from earlier ad click
      const stored = sessionStorage.getItem("grabnext_active_pixel")
      if (stored && stored.trim().length > 4) {
        return stored.trim()
      }
    } catch {}
  }

  // 3. Third priority: Explicit pixel assigned to this product in Admin Panel
  if (explicitPixelId && typeof explicitPixelId === "string" && explicitPixelId.trim().length > 4) {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("grabnext_active_pixel", explicitPixelId.trim())
      } catch {}
    }
    return explicitPixelId.trim()
  }

  // 4. Fourth priority: Admin Panel Primary / Default Fallback Pixel
  if (runtimePrimaryPixelId) return runtimePrimaryPixelId
  if (typeof window !== "undefined" && (window as any).__GRABNEXT_PRIMARY_PIXEL__) {
    return (window as any).__GRABNEXT_PRIMARY_PIXEL__
  }

  // 5. Optional env fallback
  return FB_PIXEL_ID
}

export async function resolveActivePixelId(explicitPixelId?: string | null): Promise<string> {
  const immediate = getActivePixelId(explicitPixelId)
  if (immediate) return immediate

  if (typeof window === "undefined") return FB_PIXEL_ID

  if (!primaryPixelPromise) {
    primaryPixelPromise = fetch("/api/pixels", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : []))
      .then((pixels: any[]) => {
        if (!Array.isArray(pixels)) return ""
        const primary =
          pixels.find((p) => p.type === "facebook" && p.isActive && Number(p.isPrimary) === 1 && p.pixelId) ||
          pixels.find((p) => p.type === "facebook" && p.isActive && p.pixelId)
        const pid = primary?.pixelId ? String(primary.pixelId).trim() : ""
        if (pid) setRuntimePrimaryPixelId(pid)
        return pid
      })
      .catch(() => "")
      .finally(() => {
        primaryPixelPromise = null
      })
  }

  const resolved = await primaryPixelPromise
  return resolved || FB_PIXEL_ID
}

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
function ensureFbq(): any {
  if (typeof window === "undefined") return null
  const w = window as any
  if (typeof w.fbq === "function") return w.fbq

  // Initialize official Meta Pixel queue stub if not yet loaded
  const n: any = function () {
    n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
  }
  if (!w._fbq) w._fbq = n
  n.push = n
  n.loaded = true
  n.version = "2.0"
  n.queue = []
  w.fbq = n
  return n
}

function _fbq(
  action: "track" | "trackCustom" | "init" | "set",
  eventName: string,
  params?: Record<string, any>,
  options?: { eventID?: string }
): void {
  if (typeof window === "undefined") return
  const fbqFn = ensureFbq()
  if (typeof fbqFn !== "function") return
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

  try {
    fbqFn.apply(null, args)
  } catch (err) {
    console.warn("[Meta Pixel] Execution warning:", err)
  }
}

/**
 * Single-Pixel isolated dispatch using Meta's official trackSingle / trackSingleCustom
 */
export function _fbqSingle(
  targetPixelId: string,
  action: "track" | "trackCustom",
  eventName: string,
  params?: Record<string, any>,
  options?: { eventID?: string }
): void {
  if (typeof window === "undefined") return
  const fbqFn = ensureFbq()
  if (typeof fbqFn !== "function") return
  if (!eventName || typeof eventName !== "string" || eventName.trim() === "") return

  // Ensure target pixel is initialized
  if (targetPixelId && !initializedInWindow.has(targetPixelId)) {
    try {
      fbqFn("init", targetPixelId)
      initializedInWindow.add(targetPixelId)
    } catch {}
  }

  const singleAction = action === "trackCustom" ? "trackSingleCustom" : "trackSingle"
  const args: any[] = [singleAction, targetPixelId, eventName]
  if (params && Object.keys(params).length > 0) {
    args.push(params)
    if (options && Object.keys(options).length > 0) {
      args.push(options)
    }
  } else if (options && Object.keys(options).length > 0) {
    args.push({})
    args.push(options)
  }

  try {
    fbqFn.apply(null, args)
  } catch (err) {
    console.warn(`[Meta Pixel trackSingle ${targetPixelId}] warning:`, err)
  }
}

export { _fbq as fbq }

// ── CAPI Sync Helper ──────────────────────────────────────────────────────────
function dispatchIsolatedEvent(
  targetPixelId: string,
  eventName: StandardEvent | string,
  customData: Record<string, any>,
  userData: UserData,
  isCustom: boolean
) {
  if (!targetPixelId) return

  const eventId = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

  const action = isCustom ? "trackCustom" : "track"

  // Strict isolation: Dispatch ONLY to targetPixelId
  _fbqSingle(targetPixelId, action, eventName, customData, { eventID: eventId })

  if (typeof window !== "undefined") {
    const eventUrl = window.location.href

    fetch("/api/capi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetPixelId,
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

export function trackEventWithCAPI(
  eventName: StandardEvent | string,
  customData: Record<string, any> = {},
  userData: UserData = {},
  isCustom = false,
  explicitPixelId?: string | null
) {
  const targetPixelId = getActivePixelId(explicitPixelId)
  if (targetPixelId) {
    dispatchIsolatedEvent(targetPixelId, eventName, customData, userData, isCustom)
    return
  }

  // Admin-configured primary pixel hasn't finished loading yet; resolve it asynchronously
  resolveActivePixelId(explicitPixelId).then((resolvedId) => {
    if (resolvedId) {
      dispatchIsolatedEvent(resolvedId, eventName, customData, userData, isCustom)
    }
  })
}

// ── Standard event helpers (Meta + GA4 Dual Tracker) ──────────────────────────

export function trackPageView(userData?: UserData, pixelId?: string | null): void {
  trackEventWithCAPI("PageView", {}, userData, false, pixelId)
}

export function trackViewContent(params: {
  content_name: string
  content_category?: string
  content_ids: string[]
  contents?: Array<{ id: string; quantity: number; item_price?: number }>
  value: number
  currency?: string
}, userData?: UserData, pixelId?: string | null): void {
  trackEventWithCAPI("ViewContent", {
    content_type: "product",
    currency: "INR",
    ...params,
  }, userData, false, pixelId)

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
}, userData?: UserData, pixelId?: string | null): void {
  trackEventWithCAPI("AddToCart", {
    content_type: "product",
    currency: "INR",
    ...params,
  }, userData, false, pixelId)

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
}, userData?: UserData, pixelId?: string | null): void {
  trackEventWithCAPI("InitiateCheckout", {
    currency: "INR",
    ...params,
  }, userData, false, pixelId)

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
}, userData?: UserData, pixelId?: string | null): void {
  trackEventWithCAPI("AddPaymentInfo", {
    currency: "INR",
    ...params,
  }, userData, false, pixelId)
}

export function trackPurchase(params: {
  value: number
  content_ids?: string[]
  contents?: Array<{ id: string; quantity: number; item_price?: number }>
  currency?: string
}, userData?: UserData, pixelId?: string | null): void {
  const sanitizedValue = Math.max(0, Number(params.value) || 0)
  const sanitizedCurrency = params.currency || "INR"
  const sanitizedContentIds = Array.isArray(params.content_ids) && params.content_ids.length > 0
    ? params.content_ids.map(String)
    : ["grabnext_digital_item"]

  const sanitizedContents = Array.isArray(params.contents) && params.contents.length > 0
    ? params.contents.map((c) => ({
        id: String(c.id),
        quantity: Number(c.quantity) || 1,
        item_price: Number(c.item_price) || sanitizedValue,
      }))
    : sanitizedContentIds.map((id) => ({
        id,
        quantity: 1,
        item_price: sanitizedValue,
      }))

  const purchasePayload = {
    content_type: "product",
    currency: sanitizedCurrency,
    value: sanitizedValue,
    content_ids: sanitizedContentIds,
    contents: sanitizedContents,
    num_items: sanitizedContents.reduce((sum, item) => sum + (item.quantity || 1), 0),
  }

  // Dispatch via Meta Pixel (fbq) & Server CAPI strictly to the target pixel
  trackEventWithCAPI("Purchase", purchasePayload, userData, false, pixelId)

  // Dual Track in Google Analytics (GA4)
  try {
    gaPurchase({
      transaction_id: `tx_${Date.now()}`,
      value: sanitizedValue,
      items: sanitizedContents.map((c) => ({ id: c.id, name: c.id, price: c.item_price || sanitizedValue })),
    })
  } catch {}
}

export function trackLead(params?: {
  content_name?: string
  value?: number
  currency?: string
}, userData?: UserData, pixelId?: string | null): void {
  trackEventWithCAPI("Lead", params || {}, userData, false, pixelId)
}

export function trackCompleteRegistration(params?: {
  content_name?: string
  status?: boolean | string
}, userData?: UserData, pixelId?: string | null): void {
  trackEventWithCAPI("CompleteRegistration", params || {}, userData, false, pixelId)
}
