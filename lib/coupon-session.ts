const SCOPED_COUPON_KEY = "copiedCouponCode"
const DEFAULT_COUPON_TTL_MS = 30 * 60 * 1000 // 30 minutes

export interface ScopedCouponEntry {
  code: string
  productId: string | null
  expiresAt: number
}

export function saveScopedCoupon(code: string, productId?: string | null, ttlMs = DEFAULT_COUPON_TTL_MS) {
  if (typeof window === "undefined") return
  const cleanCode = code.trim().toUpperCase()
  if (!cleanCode) return

  const payload: ScopedCouponEntry = {
    code: cleanCode,
    productId: productId ? String(productId).trim() : null,
    expiresAt: Date.now() + ttlMs,
  }

  try {
    sessionStorage.setItem(SCOPED_COUPON_KEY, JSON.stringify(payload))
  } catch {}
}

export function readScopedCoupon(activeProductIds: string[]): ScopedCouponEntry | null {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem(SCOPED_COUPON_KEY)
    if (!raw) return null

    // Ignore/clear legacy plain-string entries without productId binding
    if (!raw.startsWith("{")) {
      sessionStorage.removeItem(SCOPED_COUPON_KEY)
      return null
    }

    const parsed = JSON.parse(raw) as ScopedCouponEntry
    if (!parsed || !parsed.code || !parsed.expiresAt || Date.now() > Number(parsed.expiresAt)) {
      sessionStorage.removeItem(SCOPED_COUPON_KEY)
      return null
    }

    // Strictly require the scoped product to be present in current checkout items
    if (parsed.productId) {
      const normalizedIds = new Set(activeProductIds.map((id) => String(id).trim().toLowerCase()))
      if (!normalizedIds.has(String(parsed.productId).trim().toLowerCase())) {
        return null
      }
    }

    return {
      code: String(parsed.code).trim().toUpperCase(),
      productId: parsed.productId ? String(parsed.productId).trim() : null,
      expiresAt: Number(parsed.expiresAt),
    }
  } catch {
    return null
  }
}

export function clearScopedCoupon() {
  if (typeof window === "undefined") return
  try {
    sessionStorage.removeItem(SCOPED_COUPON_KEY)
  } catch {}
}
