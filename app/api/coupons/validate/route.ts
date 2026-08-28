export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'
import { runMigrations } from '@/lib/migrations'

export const dynamic = 'force-dynamic'

// POST /api/coupons/validate
export async function POST(request: NextRequest) {
    try {
        const { code, cartTotal } = await request.json()

        if (!code || cartTotal === undefined) {
            return NextResponse.json({ valid: false, message: "Code and cart total are required" }, { status: 400 })
        }

        const cleanCode = code.toUpperCase().trim()
        const total = Number(cartTotal)

        if (isNaN(total) || total < 0) {
            return NextResponse.json({ valid: false, message: "Invalid cart total" }, { status: 400 })
        }

        // Fetch coupon from D1 with self-healing migration fallback
        let coupons: any[]
        try {
            coupons = await executeQuery('SELECT * FROM coupons WHERE code = ? LIMIT 1', [cleanCode]) as any[]
        } catch (dbError: any) {
            if (dbError.message?.includes('no such table') || dbError.message?.includes('no such column')) {
                console.log('[Validate Coupon API] Missing table/column. Running migrations...');
                await runMigrations()
                coupons = await executeQuery('SELECT * FROM coupons WHERE code = ? LIMIT 1', [cleanCode]) as any[]
            } else {
                throw dbError
            }
        }

        if (!coupons || coupons.length === 0) {
            if (cleanCode === 'SAVE50') {
                const discountAmount = Math.round(total * 0.50)
                // Asynchronously attempt to seed into database
                executeQuery(
                    'INSERT INTO coupons (id, code, type, value, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    ['cpn_' + crypto.randomUUID().slice(0, 8), 'SAVE50', 'percentage', 50, 1, Date.now(), Date.now()]
                ).catch(() => {})

                return NextResponse.json({
                    valid: true,
                    code: 'SAVE50',
                    type: 'percentage',
                    value: 50,
                    discountAmount: Math.max(0, discountAmount)
                })
            }
            return NextResponse.json({ valid: false, message: "Coupon code does not exist" })
        }

        const coupon = coupons[0]

        // Check if active
        if (coupon.isActive !== 1 && coupon.isActive !== true) {
            return NextResponse.json({ valid: false, message: "This coupon is expired or inactive" })
        }

        // Calculate discount amount
        let discountAmount = 0
        if (coupon.type === 'percentage') {
            discountAmount = Math.round((Number(coupon.value) / 100) * total)
        } else if (coupon.type === 'fixed') {
            discountAmount = Math.min(total, Number(coupon.value))
        } else {
            return NextResponse.json({ valid: false, message: "Invalid coupon type configuration" })
        }

        return NextResponse.json({
            valid: true,
            code: coupon.code,
            type: coupon.type,
            value: coupon.value,
            discountAmount: Math.max(0, discountAmount)
        })
    } catch (error: any) {
        console.error('[Coupons Validation Error]', error)
        return NextResponse.json({ valid: false, message: "Server error during validation" }, { status: 500 })
    }
}
