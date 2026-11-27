export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'
import { isAdminSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        if (!(await isAdminSession())) {
            return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 })
        }
        const rows = await executeQuery('SELECT * FROM landing_pages WHERE id = ?', [params.id])
        const page = Array.isArray(rows) ? rows[0] : null
        if (!page) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        return NextResponse.json(page, { headers: { 'Cache-Control': 'no-store' } })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        if (!(await isAdminSession())) {
            return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 })
        }
        const data = await request.json()
        const now = Date.now()
        await executeQuery(
            'UPDATE landing_pages SET title=?, slug=?, sections=?, productIds=?, isPublished=?, updatedAt=? WHERE id=?',
            [
                data.title,
                data.slug,
                typeof data.sections === 'string' ? data.sections : JSON.stringify(data.sections),
                typeof data.productIds === 'string' ? data.productIds : JSON.stringify(data.productIds || []),
                data.isPublished ? 1 : 0,
                now,
                params.id
            ]
        )
        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        if (!(await isAdminSession())) {
            return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 })
        }
        await executeQuery('DELETE FROM landing_pages WHERE id=?', [params.id])
        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
