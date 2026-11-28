export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'
import { normalizeProductData } from '@/lib/image-url'
import { isAdminSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

function makeSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 80)
}
function sanitizeSlug(raw: string): string {
  return raw.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120)
}
function tryParse(str: string) { try { return JSON.parse(str) } catch { return [] } }

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const all = searchParams.get('all') === '1'
    const full = searchParams.get('full') === '1'
    const isAdmin = await isAdminSession()

    // Lightweight catalog projection by default; full details only when ?full=1
    const selectCols = (full || (all && isAdmin))
      ? '*'
      : 'id, title, price, originalPrice, category, tags, imageUrl, images, slug, isActive, salesCount, displayOrder, pageType, enableDiscountPopup, discountPopupType, discountPopupPercent, discountPopupAmount, metaPixelId, createdAt, updatedAt'

    // Try primary query with displayOrder sorting
    const primarySql = all
      ? `SELECT ${selectCols} FROM products ORDER BY displayOrder ASC, createdAt DESC`
      : `SELECT ${selectCols} FROM products WHERE isActive = 1 ORDER BY displayOrder ASC, createdAt DESC`

    const fallbackSql = all
      ? 'SELECT * FROM products ORDER BY createdAt DESC'
      : 'SELECT * FROM products WHERE isActive = 1 ORDER BY createdAt DESC'

    const ratingsSql = 'SELECT productId, ROUND(AVG(rating),1) AS avgRating, COUNT(id) AS reviewCount FROM reviews GROUP BY productId'

    let productRows: any[] = []

    try {
      productRows = await executeQuery(primarySql)
    } catch (err: any) {
      console.warn('[Products GET] Primary query with displayOrder failed, falling back to createdAt DESC:', err.message)
      executeQuery('ALTER TABLE products ADD COLUMN displayOrder INTEGER DEFAULT 0').catch(() => {})
      executeQuery('ALTER TABLE products ADD COLUMN videoUrl TEXT').catch(() => {})
      executeQuery('ALTER TABLE products ADD COLUMN proofImages TEXT').catch(() => {})
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

    const products = (Array.isArray(productRows) ? productRows : []).map((p: any) => {
      const normalized = normalizeProductData({
        ...p,
        description: full ? (p.description || '') : '',
        tags: p.tags ? tryParse(p.tags) : [],
        images: p.images ? tryParse(p.images) : [],
        proofImages: full && p.proofImages ? tryParse(p.proofImages) : [],
        videoUrl: full ? (p.videoUrl || "") : "",
        isActive: Boolean(p.isActive),
        price: Number(p.price),
        originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
        salesCount: Number(p.salesCount || 0),
        displayOrder: Number(p.displayOrder || 0),
        enableDiscountPopup: Boolean(p.enableDiscountPopup),
        discountPopupType: p.discountPopupType || 'percentage',
        discountPopupPercent: Number(p.discountPopupPercent || 50),
        discountPopupAmount: Number(p.discountPopupAmount || 0),
        discountPopupCoupon: p.discountPopupCoupon || 'SAVE50',
        discountPopupTimerMinutes: Number(p.discountPopupTimerMinutes || 10),
        discountPopupDelaySeconds: Number(p.discountPopupDelaySeconds || 30),
        discountPopupHeadline: p.discountPopupHeadline || '',
        metaPixelId: p.metaPixelId || null,
        avgRating: ratingsMap[p.id]?.avgRating ?? 0,
        reviewCount: ratingsMap[p.id]?.reviewCount ?? 0,
      })
      if (!isAdmin) {
        delete (normalized as any).downloadUrl
      }
      if (!full && !(all && isAdmin)) {
        delete (normalized as any).pageCode
      }
      return normalized
    })

    return NextResponse.json(products, {
      headers: {
        'Cache-Control': isAdmin
          ? 'private, no-store'
          : 'public, max-age=30, s-maxage=120, stale-while-revalidate=600',
      }
    })
  } catch (error: any) {
    console.error('[Products GET Error]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await isAdminSession()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 })
    }

    const data = await request.json()
    const id = crypto.randomUUID()
    const now = Date.now()
    const customSlug = data.slug ? sanitizeSlug(String(data.slug)) : ''
    const slug = customSlug || (makeSlug(data.title || 'product') + '-' + id.slice(0, 6))

    // Ensure slug is unique if provided or generated
    const existingSlugRows = await executeQuery('SELECT id FROM products WHERE slug = ? LIMIT 1', [slug]).catch(() => [])
    if (Array.isArray(existingSlugRows) && existingSlugRows.length > 0) {
      return NextResponse.json({ error: 'This product slug is already in use. Please choose a different slug.' }, { status: 409 })
    }
    const images = data.images && data.images.length > 0 ? data.images : (data.imageUrl ? [data.imageUrl] : [])
    const imageUrl = images[0] || data.imageUrl || ''
    const displayOrder = typeof data.displayOrder === 'number' ? data.displayOrder : (parseInt(data.displayOrder, 10) || 0)
    const videoUrl = data.videoUrl ? String(data.videoUrl).trim() : null
    const proofImages = Array.isArray(data.proofImages) ? data.proofImages : []
    const enableDiscountPopup = data.enableDiscountPopup ? 1 : 0
    const discountPopupType = data.discountPopupType === 'fixed' ? 'fixed' : 'percentage'
    const discountPopupPercent = typeof data.discountPopupPercent === 'number' ? data.discountPopupPercent : (parseInt(data.discountPopupPercent, 10) || 50)
    const discountPopupAmount = typeof data.discountPopupAmount === 'number' ? data.discountPopupAmount : (parseFloat(data.discountPopupAmount) || 0)
    const discountPopupCoupon = (data.discountPopupCoupon || (discountPopupType === 'fixed' ? 'FLAT' : 'SAVE50')).trim().toUpperCase()
    const discountPopupTimerMinutes = typeof data.discountPopupTimerMinutes === 'number' ? data.discountPopupTimerMinutes : (parseInt(data.discountPopupTimerMinutes, 10) || 10)
    const discountPopupDelaySeconds = typeof data.discountPopupDelaySeconds === 'number' ? data.discountPopupDelaySeconds : (parseInt(data.discountPopupDelaySeconds, 10) || 30)
    const discountPopupHeadline = data.discountPopupHeadline ? String(data.discountPopupHeadline).trim() : null
    const metaPixelId = data.metaPixelId ? String(data.metaPixelId).trim() : null

    // Ensure columns exist
    await executeQuery('ALTER TABLE products ADD COLUMN displayOrder INTEGER DEFAULT 0').catch(() => {})
    await executeQuery('ALTER TABLE products ADD COLUMN videoUrl TEXT').catch(() => {})
    await executeQuery('ALTER TABLE products ADD COLUMN proofImages TEXT').catch(() => {})
    await executeQuery('ALTER TABLE products ADD COLUMN enableDiscountPopup INTEGER DEFAULT 0').catch(() => {})
    await executeQuery("ALTER TABLE products ADD COLUMN discountPopupType TEXT DEFAULT 'percentage'").catch(() => {})
    await executeQuery('ALTER TABLE products ADD COLUMN discountPopupPercent INTEGER DEFAULT 50').catch(() => {})
    await executeQuery('ALTER TABLE products ADD COLUMN discountPopupAmount REAL DEFAULT 0').catch(() => {})
    await executeQuery("ALTER TABLE products ADD COLUMN discountPopupCoupon TEXT DEFAULT 'SAVE50'").catch(() => {})
    await executeQuery('ALTER TABLE products ADD COLUMN discountPopupTimerMinutes INTEGER DEFAULT 10').catch(() => {})
    await executeQuery('ALTER TABLE products ADD COLUMN discountPopupDelaySeconds INTEGER DEFAULT 30').catch(() => {})
    await executeQuery('ALTER TABLE products ADD COLUMN discountPopupHeadline TEXT').catch(() => {})
    await executeQuery('ALTER TABLE products ADD COLUMN metaPixelId TEXT').catch(() => {})

    try {
      await executeQuery(
        `INSERT INTO products (id, title, description, price, originalPrice, category, tags, imageUrl, images, videoUrl, proofImages, slug, downloadUrl, isActive, salesCount, pageCode, pageType, createdBy, displayOrder, enableDiscountPopup, discountPopupType, discountPopupPercent, discountPopupAmount, discountPopupCoupon, discountPopupTimerMinutes, discountPopupDelaySeconds, discountPopupHeadline, metaPixelId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, data.title || '', data.description || '', data.price || 0, data.originalPrice || null,
          data.category || 'general', JSON.stringify(data.tags || []), imageUrl, JSON.stringify(images),
          videoUrl, JSON.stringify(proofImages), slug,
          data.downloadUrl || '', data.isActive !== false ? 1 : 0, 0, data.pageCode || null, data.pageType || 'shop', data.createdBy || 'admin', displayOrder,
          enableDiscountPopup, discountPopupType, discountPopupPercent, discountPopupAmount, discountPopupCoupon, discountPopupTimerMinutes, discountPopupDelaySeconds, discountPopupHeadline, metaPixelId, now, now]
      )
    } catch (err: any) {
      await executeQuery(
        `INSERT INTO products (id, title, description, price, originalPrice, category, tags, imageUrl, images, videoUrl, proofImages, slug, downloadUrl, isActive, salesCount, pageCode, pageType, createdBy, displayOrder, enableDiscountPopup, discountPopupPercent, discountPopupCoupon, discountPopupTimerMinutes, discountPopupDelaySeconds, discountPopupHeadline, metaPixelId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, data.title || '', data.description || '', data.price || 0, data.originalPrice || null,
          data.category || 'general', JSON.stringify(data.tags || []), imageUrl, JSON.stringify(images),
          videoUrl, JSON.stringify(proofImages), slug,
          data.downloadUrl || '', data.isActive !== false ? 1 : 0, 0, data.pageCode || null, data.pageType || 'shop', data.createdBy || 'admin', displayOrder,
          enableDiscountPopup, discountPopupPercent, discountPopupCoupon, discountPopupTimerMinutes, discountPopupDelaySeconds, discountPopupHeadline, metaPixelId, now, now]
      ).catch(async () => {
        await executeQuery(
          `INSERT INTO products (id, title, description, price, originalPrice, category, tags, imageUrl, images, slug, downloadUrl, isActive, salesCount, pageCode, pageType, createdBy, displayOrder, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, data.title || '', data.description || '', data.price || 0, data.originalPrice || null,
            data.category || 'general', JSON.stringify(data.tags || []), imageUrl, JSON.stringify(images), slug,
            data.downloadUrl || '', data.isActive !== false ? 1 : 0, 0, data.pageCode || null, data.pageType || 'shop', data.createdBy || 'admin', displayOrder, now, now]
        ).catch(async () => {
          await executeQuery(
            `INSERT INTO products (id, title, description, price, originalPrice, category, tags, imageUrl, images, slug, downloadUrl, isActive, salesCount, pageCode, pageType, createdBy, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, data.title || '', data.description || '', data.price || 0, data.originalPrice || null,
              data.category || 'general', JSON.stringify(data.tags || []), imageUrl, JSON.stringify(images), slug,
              data.downloadUrl || '', data.isActive !== false ? 1 : 0, 0, data.pageCode || null, data.pageType || 'shop', data.createdBy || 'admin', now, now]
          )
        })
      })
    }

    return NextResponse.json({ success: true, id, slug }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
