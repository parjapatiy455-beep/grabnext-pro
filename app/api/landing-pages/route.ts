export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'
import { isAdminSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

async function ensureTable() {
    await executeQuery(`
        CREATE TABLE IF NOT EXISTS landing_pages (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            slug TEXT UNIQUE,
            sections TEXT NOT NULL DEFAULT '[]',
            productIds TEXT DEFAULT '[]',
            isPublished INTEGER DEFAULT 0,
            createdAt INTEGER,
            updatedAt INTEGER
        )
    `)
}

export async function GET() {
    try {
        if (!(await isAdminSession())) {
            return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 })
        }
        await ensureTable()
        const rows = await executeQuery(
            'SELECT id, title, slug, isPublished, productIds, createdAt, updatedAt FROM landing_pages ORDER BY createdAt DESC'
        )
        return NextResponse.json(Array.isArray(rows) ? rows : [], {
            headers: { 'Cache-Control': 'no-store' }
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        if (!(await isAdminSession())) {
            return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 })
        }
        await ensureTable()
        const data = await request.json()
        const id = crypto.randomUUID()
        const now = Date.now()
        const title = data.title || 'Untitled Page'
        const slug = data.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + id.slice(0, 6)

        await executeQuery(
            'INSERT INTO landing_pages (id, title, slug, sections, productIds, isPublished, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [id, title, slug, data.sections || '[]', data.productIds || '[]', 0, now, now]
        )
        return NextResponse.json({ id, slug }, { status: 201 })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
