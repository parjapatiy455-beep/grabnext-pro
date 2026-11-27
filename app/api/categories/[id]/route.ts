export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'
import { isAdminSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        if (!(await isAdminSession())) {
            return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 })
        }

        const data = await request.json()
        const slug = data.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || ''
        await executeQuery(
            `UPDATE categories SET name=?, slug=?, description=?, imageUrl=?, isActive=?, updatedAt=? WHERE id=?`,
            [data.name, slug, data.description || '', data.imageUrl || '', data.isActive ? 1 : 0, Date.now(), params.id]
        )
        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        if (!(await isAdminSession())) {
            return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 })
        }

        await executeQuery('DELETE FROM categories WHERE id = ?', [params.id])
        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
