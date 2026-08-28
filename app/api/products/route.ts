export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'

export const dynamic = 'force-dynamic'

function makeSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 80)
}
function tryParse(str: string) { try { return JSON.parse(str) } catch { return [] } }

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const all = searchParams.get('all') === '1'

    // Try primary query with displayOrder sorting
    const primarySql = all
      ? 'SELECT * FROM products ORDER BY displayOrder ASC, createdAt DESC'
      : 'SELECT * FROM products WHERE isActive = 1 ORDER BY displayOrder ASC, createdAt DESC'

    const fallbackSql = all
      ? 'SELECT * FROM products ORDER BY createdAt DESC'
      : 'SELECT * FROM products WHERE isActive = 1 ORDER BY createdAt DESC'

    const ratingsSql = 'SELECT productId, ROUND(AVG(rating),1) AS avgRating, COUNT(id) AS reviewCount FROM reviews GROUP BY productId'

    let productRows: any[] = []

    try {
      productRows = await executeQuery(primarySql)
    } catch (err: any) {
      console.warn('[Products GET] Primary query with displayOrder failed, falling back to createdAt DESC:', err.message)
      // Attempt to auto-add displayOrder column in DB if missing
      executeQuery('ALTER TABLE products ADD COLUMN displayOrder INTEGER DEFAULT 0').catch(() => {})
      // Fallback query without displayOrder in ORDER BY
      productRows = await executeQuery(fallbackSql).catch(() => [])
    }

    // Aggregate ratings per product
    const ratingRows = await executeQuery(ratingsSql).catch(() => [] as any[])

    // Build a ratings map
    const ratingsMap: Record<string, { avgRating: number; reviewCount: number }> = {}
    if (Array.isArray(ratingRows)) {
      for (const r of ratingRows) {
        ratingsMap[r.productId] = {
          avgRating: Number(r.avgRating || 0),
          reviewCount: Number(r.reviewCount || 0),
        }
      }
    }

    const products = (Array.isArray(productRows) ? productRows : []).map((p: any) => ({
      ...p,
      tags: p.tags ? tryParse(p.tags) : [],
      images: p.images ? tryParse(p.images) : [],
      isActive: Boolean(p.isActive),
      price: Number(p.price),
      originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
      salesCount: Number(p.salesCount || 0),
      displayOrder: Number(p.displayOrder || 0),
      avgRating: ratingsMap[p.id]?.avgRating ?? 0,
      reviewCount: ratingsMap[p.id]?.reviewCount ?? 0,
    }))

    return NextResponse.json(products, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=300',
      }
    })
  } catch (error: any) {
    console.error('[Products GET Error]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const id = crypto.randomUUID()
    const now = Date.now()
    const slug = makeSlug(data.title || 'product') + '-' + id.slice(0, 6)
    const images = data.images && data.images.length > 0 ? data.images : (data.imageUrl ? [data.imageUrl] : [])
    const imageUrl = images[0] || data.imageUrl || ''
    const displayOrder = typeof data.displayOrder === 'number' ? data.displayOrder : (parseInt(data.displayOrder, 10) || 0)

    try {
      await executeQuery(
        `INSERT INTO products (id, title, description, price, originalPrice, category, tags, imageUrl, images, slug, downloadUrl, isActive, salesCount, pageCode, pageType, createdBy, displayOrder, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, data.title || '', data.description || '', data.price || 0, data.originalPrice || null,
          data.category || 'general', JSON.stringify(data.tags || []), imageUrl, JSON.stringify(images), slug,
          data.downloadUrl || '', data.isActive !== false ? 1 : 0, 0, data.pageCode || null, data.pageType || 'shop', data.createdBy || 'admin', displayOrder, now, now]
      )
    } catch (err: any) {
      await executeQuery('ALTER TABLE products ADD COLUMN displayOrder INTEGER DEFAULT 0').catch(() => {})
      await executeQuery(
        `INSERT INTO products (id, title, description, price, originalPrice, category, tags, imageUrl, images, slug, downloadUrl, isActive, salesCount, pageCode, pageType, createdBy, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, data.title || '', data.description || '', data.price || 0, data.originalPrice || null,
          data.category || 'general', JSON.stringify(data.tags || []), imageUrl, JSON.stringify(images), slug,
          data.downloadUrl || '', data.isActive !== false ? 1 : 0, 0, data.pageCode || null, data.pageType || 'shop', data.createdBy || 'admin', now, now]
      )
    }
    return NextResponse.json({ success: true, id, slug }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
