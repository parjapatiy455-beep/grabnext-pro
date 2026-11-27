export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'
import { evaluateCouponForItems, type CouponCartItem } from '@/lib/coupon-utils'

export const dynamic = 'force-dynamic'

// POST /api/coupons/validate
export async function POST(request: NextRequest) {
    try {
        const { code, cartTotal, items, couponProductId } = await request.json()

        if (!code || (cartTotal === undefined && (!Array.isArray(items) || items.length === 0))) {
            return NextResponse.json({ valid: false, message: "Code and cart items are required" }, { status: 400 })
        }

        const cleanCode = String(code).toUpperCase().trim()
        const clientItems = Array.isArray(items) ? items : []

        if (clientItems.length === 0) {
            return NextResponse.json({ valid: false, message: "Cart items are required to validate coupon" }, { status: 400 })
        }

        const productIds = clientItems
            .map((i: any) => i.productId || i.id)
            .filter((pid: any) => typeof pid === 'string' && pid.length > 0)

        if (productIds.length === 0) {
            return NextResponse.json({ valid: false, message: "Invalid cart items" }, { status: 400 })
        }

        const placeholders = productIds.map(() => '?').join(',')
        let dbProducts: any[] = []
        try {
            dbProducts = await executeQuery(
                `SELECT id, price, slug FROM products WHERE id IN (${placeholders}) OR slug IN (${placeholders})`,
                [...productIds, ...productIds]
            ) as any[]
        } catch {
            dbProducts = await executeQuery(
                `SELECT id, price FROM products WHERE id IN (${placeholders})`,
                productIds
            ) as any[]
        }

        const productMap = new Map<string, any>()
        for (const p of (dbProducts || [])) {
            if (p.id) {
                productMap.set(p.id, p)
                productMap.set(String(p.id).toLowerCase(), p)
            }
            if (p.slug) {
                productMap.set(p.slug, p)
                productMap.set(String(p.slug).toLowerCase(), p)
            }
        }

        const verifiedItems: CouponCartItem[] = []
        for (const ci of clientItems) {
            const pid = String(ci.productId || ci.id || '')
            const dbProd = productMap.get(pid) || productMap.get(pid.toLowerCase())
            const qty = Math.max(1, parseInt(ci.quantity, 10) || 1)
            if (dbProd) {
                verifiedItems.push({
                    productId: pid,
                    slug: dbProd.slug || null,
                    price: Number(dbProd.price) || 0,
                    quantity: qty,
                })
            } else if (ci.price !== undefined) {
                verifiedItems.push({
                    productId: pid,
                    slug: null,
                    price: Number(ci.price) || 0,
                    quantity: qty,
                })
            }
        }

        if (verifiedItems.length === 0) {
            return NextResponse.json({ valid: false, message: "No valid products found in cart" }, { status: 400 })
        }

        const result = await evaluateCouponForItems(cleanCode, verifiedItems, couponProductId)

        if (!result.valid) {
            return NextResponse.json({
                valid: false,
                message: result.message || "Invalid coupon code",
            })
        }

        return NextResponse.json({
            valid: true,
            code: result.code,
            type: result.type,
            value: result.value,
            discountAmount: result.discountAmount,
            eligibleProductIds: result.eligibleProductIds,
            isProductScoped: result.isProductScoped,
            productRules: result.productRules || null,
        })
    } catch (error: any) {
        console.error('[Coupons Validation Error]', error)
        return NextResponse.json({ valid: false, message: "Server error during validation" }, { status: 500 })
    }
}
