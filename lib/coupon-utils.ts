import { executeQuery } from '@/lib/db'
import { runMigrations } from '@/lib/migrations'

export interface CouponCartItem {
  productId: string
  slug?: string | null
  price: number
  quantity: number
}

export interface ProductDiscountRule {
  type: 'percentage' | 'fixed'
  value: number
}

export interface CouponEvaluationResult {
  valid: boolean
  code: string
  type?: 'percentage' | 'fixed'
  value?: number
  discountAmount: number
  eligibleProductIds: string[]
  isProductScoped: boolean
  productRules?: Record<string, ProductDiscountRule>
  message?: string
}

// Dedicated campaign landing page product IDs that explicitly advertise SAVE50 on their page
const SAVE50_CAMPAIGN_PRODUCT_IDS = new Set([
  'mega-video-editing-bundle-the-ultimate-toolkit-for-creators-cf1b23',
  'adobe-all-premium-software-bundle-2026-for-windows-mac-420947',
])

function computeRuleDiscount(subtotal: number, type: 'percentage' | 'fixed', value: number): number {
  if (subtotal <= 0 || value <= 0) return 0
  if (type === 'fixed') {
    return Math.min(subtotal, Math.round(value))
  }
  return Math.min(subtotal, Math.round((value / 100) * subtotal))
}

function itemMatchesProduct(item: CouponCartItem, prod: { id?: string; slug?: string | null }): boolean {
  const itemPid = String(item.productId || '').trim().toLowerCase()
  const itemSlug = item.slug ? String(item.slug).trim().toLowerCase() : ''
  const pId = prod.id ? String(prod.id).trim().toLowerCase() : ''
  const pSlug = prod.slug ? String(prod.slug).trim().toLowerCase() : ''

  return Boolean(
    (pId && (itemPid === pId || (itemSlug && itemSlug === pId))) ||
    (pSlug && (itemPid === pSlug || (itemSlug && itemSlug === pSlug)))
  )
}

export async function evaluateCouponForItems(
  rawCode: string,
  items: CouponCartItem[],
  preferredProductId?: string | null
): Promise<CouponEvaluationResult> {
  const cleanCode = String(rawCode || '').trim().toUpperCase()
  if (!cleanCode) {
    return { valid: false, code: '', discountAmount: 0, eligibleProductIds: [], isProductScoped: false, message: 'Coupon code is required' }
  }

  if (!Array.isArray(items) || items.length === 0) {
    return { valid: false, code: cleanCode, discountAmount: 0, eligibleProductIds: [], isProductScoped: false, message: 'Cart is empty' }
  }

  // 1. Check active Product Discount Popups FIRST so popup codes never leak globally
  let prodCoupons: any[] = []
  try {
    prodCoupons = await executeQuery(
      'SELECT id, slug, price, discountPopupCoupon, discountPopupType, discountPopupPercent, discountPopupAmount FROM products WHERE UPPER(TRIM(discountPopupCoupon)) = ? AND enableDiscountPopup = 1',
      [cleanCode]
    ) as any[]
  } catch {
    try {
      prodCoupons = await executeQuery(
        'SELECT id, price, discountPopupCoupon, discountPopupType, discountPopupPercent, discountPopupAmount FROM products WHERE UPPER(TRIM(discountPopupCoupon)) = ? AND enableDiscountPopup = 1',
        [cleanCode]
      ) as any[]
    } catch (err) {
      console.warn('[Coupon Eval] Product popup lookup error:', err)
    }
  }

  const hasSave50CampaignItem = cleanCode === 'SAVE50' && items.some((it) => {
    const pid = String(it.productId || '').trim().toLowerCase()
    const slug = it.slug ? String(it.slug).trim().toLowerCase() : ''
    return SAVE50_CAMPAIGN_PRODUCT_IDS.has(pid) || (slug && SAVE50_CAMPAIGN_PRODUCT_IDS.has(slug))
  })

  if (prodCoupons && prodCoupons.length > 0) {
    let totalPopupDiscount = 0
    const eligibleProductIds: string[] = []
    const productRules: Record<string, ProductDiscountRule> = {}

    const normalizedPreferred = preferredProductId ? String(preferredProductId).trim().toLowerCase() : null

    for (const item of items) {
      const itemSubtotal = (Number(item.price) || 0) * Math.max(1, Number(item.quantity) || 1)
      if (itemSubtotal <= 0) continue

      const matchedProd = prodCoupons.find((pc) => itemMatchesProduct(item, pc))
      if (matchedProd) {
        // If caller specified a preferredProductId (e.g. from URL ?couponProduct=...), restrict to that product if it matches
        if (normalizedPreferred && String(item.productId).trim().toLowerCase() !== normalizedPreferred && String(item.slug || '').trim().toLowerCase() !== normalizedPreferred) {
          continue
        }
        const pType: 'percentage' | 'fixed' = matchedProd.discountPopupType === 'fixed' ? 'fixed' : 'percentage'
        const pVal = pType === 'fixed'
          ? Math.round(Number(matchedProd.discountPopupAmount || 0))
          : Number(matchedProd.discountPopupPercent || 50)
        const itemDiscount = computeRuleDiscount(itemSubtotal, pType, pVal)
        if (itemDiscount > 0) {
          totalPopupDiscount += itemDiscount
          eligibleProductIds.push(item.productId)
          productRules[item.productId] = { type: pType, value: pVal }
        }
      } else if (cleanCode === 'SAVE50') {
        const pid = String(item.productId || '').trim().toLowerCase()
        const slug = item.slug ? String(item.slug).trim().toLowerCase() : ''
        if (SAVE50_CAMPAIGN_PRODUCT_IDS.has(pid) || (slug && SAVE50_CAMPAIGN_PRODUCT_IDS.has(slug))) {
          const itemDiscount = computeRuleDiscount(itemSubtotal, 'percentage', 50)
          if (itemDiscount > 0) {
            totalPopupDiscount += itemDiscount
            eligibleProductIds.push(item.productId)
            productRules[item.productId] = { type: 'percentage', value: 50 }
          }
        }
      }
    }

    if (eligibleProductIds.length === 0) {
      return {
        valid: false,
        code: cleanCode,
        discountAmount: 0,
        eligibleProductIds: [],
        isProductScoped: true,
        message: 'This coupon is only valid on its specific offer product',
      }
    }

    const firstRule = productRules[eligibleProductIds[0]]
    return {
      valid: true,
      code: cleanCode,
      type: firstRule?.type || 'percentage',
      value: firstRule?.value || 0,
      discountAmount: Math.max(0, totalPopupDiscount),
      eligibleProductIds,
      isProductScoped: true,
      productRules,
    }
  }

  // 2. Check dedicated campaign landing pages for SAVE50 even if DB popup toggle is off
  if (hasSave50CampaignItem) {
    let totalCampaignDiscount = 0
    const eligibleProductIds: string[] = []
    const productRules: Record<string, ProductDiscountRule> = {}

    for (const item of items) {
      const pid = String(item.productId || '').trim().toLowerCase()
      const slug = item.slug ? String(item.slug).trim().toLowerCase() : ''
      if (SAVE50_CAMPAIGN_PRODUCT_IDS.has(pid) || (slug && SAVE50_CAMPAIGN_PRODUCT_IDS.has(slug))) {
        const itemSubtotal = (Number(item.price) || 0) * Math.max(1, Number(item.quantity) || 1)
        const itemDiscount = computeRuleDiscount(itemSubtotal, 'percentage', 50)
        if (itemDiscount > 0) {
          totalCampaignDiscount += itemDiscount
          eligibleProductIds.push(item.productId)
          productRules[item.productId] = { type: 'percentage', value: 50 }
        }
      }
    }

    if (eligibleProductIds.length > 0) {
      return {
        valid: true,
        code: 'SAVE50',
        type: 'percentage',
        value: 50,
        discountAmount: Math.max(0, totalCampaignDiscount),
        eligibleProductIds,
        isProductScoped: true,
        productRules,
      }
    }
  }

  // 3. Check Admin-managed coupons table
  let coupons: any[] = []
  try {
    coupons = await executeQuery('SELECT * FROM coupons WHERE UPPER(code) = ? LIMIT 1', [cleanCode]) as any[]
  } catch (dbError: any) {
    if (dbError.message?.includes('no such table') || dbError.message?.includes('no such column')) {
      await runMigrations()
      coupons = await executeQuery('SELECT * FROM coupons WHERE UPPER(code) = ? LIMIT 1', [cleanCode]) as any[]
    } else {
      throw dbError
    }
  }

  if (!coupons || coupons.length === 0) {
    return { valid: false, code: cleanCode, discountAmount: 0, eligibleProductIds: [], isProductScoped: false, message: 'Coupon code does not exist' }
  }

  const coupon = coupons[0]

  // Ignore legacy auto-seeded SAVE50/SAVE40 rows from old migrations unless explicitly edited by admin
  if (
    (cleanCode === 'SAVE50' || cleanCode === 'SAVE40') &&
    Number(coupon.createdAt) === 1700000000000 &&
    Number(coupon.updatedAt) === 1700000000000
  ) {
    return {
      valid: false,
      code: cleanCode,
      discountAmount: 0,
      eligibleProductIds: [],
      isProductScoped: true,
      message: 'This coupon is not valid for the selected product(s)',
    }
  }

  if (coupon.isActive !== 1 && coupon.isActive !== true && coupon.isActive !== '1') {
    return { valid: false, code: cleanCode, discountAmount: 0, eligibleProductIds: [], isProductScoped: false, message: 'This coupon is expired or inactive' }
  }

  const cType: 'percentage' | 'fixed' | null =
    coupon.type === 'percentage' ? 'percentage' : coupon.type === 'fixed' ? 'fixed' : null
  if (!cType) {
    return { valid: false, code: cleanCode, discountAmount: 0, eligibleProductIds: [], isProductScoped: false, message: 'Invalid coupon type configuration' }
  }

  const totalSubtotal = items.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * Math.max(1, Number(item.quantity) || 1),
    0
  )
  const discountAmount = computeRuleDiscount(totalSubtotal, cType, Number(coupon.value))

  return {
    valid: true,
    code: coupon.code || cleanCode,
    type: cType,
    value: Number(coupon.value),
    discountAmount: Math.max(0, discountAmount),
    eligibleProductIds: items.map((i) => i.productId),
    isProductScoped: false,
  }
}
