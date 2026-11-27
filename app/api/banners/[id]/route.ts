export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'
import { isAdminSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

// PUT update banner
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        if (!(await isAdminSession())) {
            return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 })
        }

        const data = await request.json()
        await executeQuery(
            `UPDATE banners SET title=?, subtitle=?, imageUrl=?, linkUrl=?, buttonText=?, bgColor=?, isActive=?, sortOrder=?, updatedAt=? WHERE id=?`,
            [
                data.title,
                data.subtitle || '',
                data.imageUrl || '',
                data.linkUrl || '/products',
                data.buttonText || 'Shop Now',
                data.bgColor || '#1e40af',
                data.isActive ? 1 : 0,
                data.sortOrder || 0,
                Date.now(),
                params.id,
            ]
        )
        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// DELETE banner
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        if (!(await isAdminSession())) {
            return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 })
        }

        await executeQuery('DELETE FROM banners WHERE id = ?', [params.id])
        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
