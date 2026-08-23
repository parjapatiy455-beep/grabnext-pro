export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'
import { getSession } from '@/lib/session'
import { runMigrations } from '@/lib/migrations'

export const dynamic = 'force-dynamic'

// Helper to check admin authorization
async function verifyAdmin() {
    const session = await getSession()
    if (!session) return { error: 'Not authenticated', status: 401 }

    const current = await executeQuery('SELECT role FROM users WHERE uid = ?', [session.uid]) as any[]
    if (!current || current.length === 0 || current[0].role !== 'admin') {
        return { error: 'Admin access required', status: 403 }
    }
    return { success: true }
}

// GET /api/admin/coupons
export async function GET(request: NextRequest) {
    try {
        const auth = await verifyAdmin()
        if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

        let coupons: any[]
        try {
            coupons = await executeQuery(
                'SELECT * FROM coupons ORDER BY createdAt DESC'
            ) as any[]
        } catch (dbError: any) {
            if (dbError.message?.includes('no such table') || dbError.message?.includes('no such column')) {
                console.log('[Admin Coupons GET] Missing table or column detected. Running migrations...');
                await runMigrations()
                coupons = await executeQuery(
                    'SELECT * FROM coupons ORDER BY createdAt DESC'
                ) as any[]
            } else {
                throw dbError
            }
        }

        return NextResponse.json(Array.isArray(coupons) ? coupons : [])
    } catch (error: any) {
        console.error('[Admin Coupons GET Error]', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// POST /api/admin/coupons (Create Coupon)
export async function POST(request: NextRequest) {
    try {
        const auth = await verifyAdmin()
        if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

        const { code, type, value, isActive } = await request.json()
        
        if (!code || !type || value === undefined) {
            return NextResponse.json({ error: 'Code, type, and value are required' }, { status: 400 })
        }

        const cleanCode = code.toUpperCase().trim()
        if (type !== 'percentage' && type !== 'fixed') {
            return NextResponse.json({ error: "Type must be either 'percentage' or 'fixed'" }, { status: 400 })
        }

        if (Number(value) <= 0) {
            return NextResponse.json({ error: 'Discount value must be greater than 0' }, { status: 400 })
        }

        // Check if coupon code already exists
        let existing: any[]
        try {
            existing = await executeQuery('SELECT code FROM coupons WHERE code = ?', [cleanCode]) as any[]
        } catch (dbError: any) {
            if (dbError.message?.includes('no such table')) {
                console.log('[Admin Coupons POST] Table not found. Running migrations...');
                await runMigrations()
                existing = await executeQuery('SELECT code FROM coupons WHERE code = ?', [cleanCode]) as any[]
            } else {
                throw dbError
            }
        }

        if (existing && existing.length > 0) {
            return NextResponse.json({ error: `Coupon code '${cleanCode}' already exists` }, { status: 400 })
        }

        const now = Date.now()
        await executeQuery(
            'INSERT INTO coupons (code, type, value, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
            [cleanCode, type, Number(value), isActive ? 1 : 0, now, now]
        )

        return NextResponse.json({ success: true, coupon: { code: cleanCode, type, value: Number(value), isActive: !!isActive } }, { status: 201 })
    } catch (error: any) {
        console.error('[Admin Coupons POST Error]', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// PATCH /api/admin/coupons (Toggle Active Status)
export async function PATCH(request: NextRequest) {
    try {
        const auth = await verifyAdmin()
        if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

        const { code, isActive } = await request.json()
        if (!code) {
            return NextResponse.json({ error: 'Code is required' }, { status: 400 })
        }

        const cleanCode = code.toUpperCase().trim()
        const now = Date.now()
        await executeQuery(
            'UPDATE coupons SET isActive = ?, updatedAt = ? WHERE code = ?',
            [isActive ? 1 : 0, now, cleanCode]
        )

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('[Admin Coupons PATCH Error]', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// DELETE /api/admin/coupons (Delete Coupon)
export async function DELETE(request: NextRequest) {
    try {
        const auth = await verifyAdmin()
        if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

        const { code } = await request.json()
        if (!code) {
            return NextResponse.json({ error: 'Code is required' }, { status: 400 })
        }

        const cleanCode = code.toUpperCase().trim()
        await executeQuery('DELETE FROM coupons WHERE code = ?', [cleanCode])

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('[Admin Coupons DELETE Error]', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
