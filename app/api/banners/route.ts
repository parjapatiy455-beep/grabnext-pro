export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET all banners (active only for public, all for admin)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const all = searchParams.get('all') === '1'

        const sql = all
            ? 'SELECT * FROM banners ORDER BY sortOrder ASC, createdAt DESC'
            : 'SELECT * FROM banners WHERE isActive = 1 ORDER BY sortOrder ASC, createdAt DESC'

        const results = await executeQuery(sql, [])
        return NextResponse.json(results || [], {
            headers: all ? {} : { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=600' }
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// POST create banner
export async function POST(request: NextRequest) {
    try {
        const data = await request.json()
        const id = crypto.randomUUID()
        const now = Date.now()

        await executeQuery(
            `INSERT INTO banners (id, title, subtitle, imageUrl, linkUrl, buttonText, bgColor, isActive, sortOrder, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                data.title || 'New Banner',
                data.subtitle || '',
                data.imageUrl || '',
                data.linkUrl || '/products',
                data.buttonText || 'Shop Now',
                data.bgColor || '#1e40af',
                data.isActive !== false ? 1 : 0,
                data.sortOrder || 0,
                now,
                now,
            ]
        )

        return NextResponse.json({ success: true, id })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
