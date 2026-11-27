export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { isAdminSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    try {
        const isAdmin = await isAdminSession()
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 })
        }

        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF allowed.' }, { status: 400 })
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: 'File too large. Maximum size is 5MB.' }, { status: 400 })
        }

        const filename = `products/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`

        const blob = await put(filename, file, {
            access: 'public',
        })

        return NextResponse.json({ url: blob.url }, { status: 200 })
    } catch (error: any) {
        console.error('[Upload API Error]', error)
        return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 })
    }
}
