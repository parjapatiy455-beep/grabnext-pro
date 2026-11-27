export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'
import { normalizeImageUrl } from '@/lib/image-url'
import { isAdminSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const results = await executeQuery(
      "SELECT * FROM categories ORDER BY name ASC"
    )

    const mapped = (Array.isArray(results) ? results : []).map((c: any) => ({ ...c, imageUrl: normalizeImageUrl(c.imageUrl) }))
    return NextResponse.json(mapped, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=600' }
    })
  } catch (error: any) {
    console.error("[v0] Categories API Error:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await isAdminSession())) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 })
    }
    const data = await request.json()
    const id = crypto.randomUUID()
    const now = Date.now()
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

    await executeQuery(`
      INSERT INTO categories (id, name, slug, description, imageUrl, isActive, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      data.name,
      slug,
      data.description || '',
      data.imageUrl || '',
      1,
      now,
      now
    ])

    return NextResponse.json({ success: true, id }, { status: 201 })
  } catch (error: any) {
    console.error("[v0] Create Category Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

