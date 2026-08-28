export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'

export const dynamic = 'force-dynamic'

function makeSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 80)
}
function tryParse(str: string) { try { return JSON.parse(str) } catch { return [] } }

// GET /api/products/[id]  — supports both ID and slug lookup
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const p = params.id
    // Try by slug first, then by id
    let results = await executeQuery('SELECT * FROM products WHERE slug = ? LIMIT 1', [p])
    if (!results || results.length === 0) {
      results = await executeQuery('SELECT * FROM products WHERE id = ? LIMIT 1', [p])
    }
    if (!results || results.length === 0) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

    const row = results[0]
    return NextResponse.json({
      ...row,
      tags: row.tags ? tryParse(row.tags) : [],
      images: row.images ? tryParse(row.images) : (row.imageUrl ? [row.imageUrl] : []),
      isActive: Boolean(row.isActive),
      price: Number(row.price),
      originalPrice: row.originalPrice ? Number(row.originalPrice) : null,
      salesCount: Number(row.salesCount),
      displayOrder: Number(row.displayOrder || 0),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT /api/products/[id]
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await request.json()
    const now = Date.now()
    
    // Fetch the existing product's slug to ensure it doesn't change
    const existing = await executeQuery('SELECT slug FROM products WHERE id = ? LIMIT 1', [params.id])
    let slug = existing && existing[0]?.slug
    if (!slug) {
      slug = makeSlug(data.title || 'product') + '-' + params.id.slice(0, 6)
    }

    const images = data.images && data.images.length > 0 ? data.images : (data.imageUrl ? [data.imageUrl] : [])
    const imageUrl = images[0] || data.imageUrl || ''
    const displayOrder = typeof data.displayOrder === 'number' ? data.displayOrder : (parseInt(data.displayOrder, 10) || 0)

    await executeQuery(
      `UPDATE products SET title=?, description=?, price=?, originalPrice=?, category=?, tags=?, imageUrl=?, images=?, slug=?, downloadUrl=?, isActive=?, pageCode=?, pageType=?, displayOrder=?, updatedAt=? WHERE id=?`,
      [data.title, data.description || '', data.price, data.originalPrice || null, data.category,
      JSON.stringify(data.tags || []), imageUrl, JSON.stringify(images), slug,
      data.downloadUrl || '', data.isActive ? 1 : 0, data.pageCode || null, data.pageType || 'shop', displayOrder, now, params.id]
    )
    return NextResponse.json({ success: true, slug })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/products/[id]
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await executeQuery('DELETE FROM products WHERE id = ?', [params.id])
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
