import { executeQuery } from '@/lib/db'
import type { Product } from '@/lib/types'
import { normalizeProductData, normalizeImageUrl } from '@/lib/image-url'

function tryParse(str: string) {
  try {
    return JSON.parse(str)
  } catch {
    return []
  }
}

export interface HomeCategory {
  id: string
  name: string
  slug: string
  description?: string
  imageUrl?: string
  isActive?: number | boolean
}

export interface HomeBanner {
  id: string
  title?: string
  subtitle?: string
  imageUrl?: string
  linkUrl?: string
  buttonText?: string
  bgColor?: string
  isActive?: number | boolean
  sortOrder?: number
}

export async function getHomePageData(): Promise<{
  products: Product[]
  categories: HomeCategory[]
  banners: HomeBanner[]
}> {
  try {
    // Lightweight catalog projection: omit heavy description/pageCode/proofImages and never expose downloadUrl publicly
    const primaryProductsSql =
      'SELECT id, title, price, originalPrice, category, tags, imageUrl, images, slug, isActive, salesCount, displayOrder, pageType, metaPixelId, createdAt, updatedAt FROM products WHERE isActive = 1 ORDER BY displayOrder ASC, createdAt DESC'
    const fallbackProductsSql =
      'SELECT id, title, price, originalPrice, category, tags, imageUrl, images, slug, isActive, salesCount, pageType, createdAt, updatedAt FROM products WHERE isActive = 1 ORDER BY createdAt DESC'
    const ratingsSql = 'SELECT productId, ROUND(AVG(rating),1) AS avgRating, COUNT(id) AS reviewCount FROM reviews GROUP BY productId'
    const categoriesSql = 'SELECT id, name, slug, description, imageUrl, isActive FROM categories WHERE isActive = 1 ORDER BY name ASC'
    const bannersSql = 'SELECT id, title, subtitle, imageUrl, linkUrl, buttonText, bgColor, isActive, sortOrder FROM banners WHERE isActive = 1 ORDER BY sortOrder ASC, createdAt DESC'

    const [productRowsRaw, ratingRowsRaw, categoryRowsRaw, bannerRowsRaw] = await Promise.all([
      executeQuery(primaryProductsSql).catch(() =>
        executeQuery(fallbackProductsSql).catch(() => [])
      ),
      executeQuery(ratingsSql).catch(() => []),
      executeQuery(categoriesSql).catch(() => []),
      executeQuery(bannersSql).catch(() => []),
    ])

    const ratingRows = Array.isArray(ratingRowsRaw) ? ratingRowsRaw : []
    const ratingsMap: Record<string, { avgRating: number; reviewCount: number }> = {}
    for (const r of ratingRows) {
      if (r && r.productId) {
        ratingsMap[r.productId] = {
          avgRating: Number(r.avgRating || 0),
          reviewCount: Number(r.reviewCount || 0),
        }
      }
    }

    const productRows = Array.isArray(productRowsRaw) ? productRowsRaw : []
    const products: Product[] = productRows.map((p: any) => {
      const normalized = normalizeProductData({
        id: p.id,
        title: p.title,
        description: '',
        price: Number(p.price),
        originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
        category: p.category,
        tags: p.tags ? tryParse(p.tags) : [],
        imageUrl: p.imageUrl || '',
        images: p.images ? tryParse(p.images) : (p.imageUrl ? [p.imageUrl] : []),
        slug: p.slug,
        isActive: Boolean(p.isActive),
        downloadUrl: '',
        createdBy: 'admin',
        salesCount: Number(p.salesCount || 0),
        displayOrder: Number(p.displayOrder || 0),
        pageType: p.pageType || 'shop',
        metaPixelId: p.metaPixelId || null,
        avgRating: ratingsMap[p.id]?.avgRating || null,
        reviewCount: ratingsMap[p.id]?.reviewCount || 0,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })
      delete (normalized as any).downloadUrl
      return normalized
    })

    const categoryRows = Array.isArray(categoryRowsRaw) ? categoryRowsRaw : []
    const categories: HomeCategory[] = categoryRows.filter((c: any) => c.isActive !== 0).map((c: any) => ({
      ...c,
      imageUrl: normalizeImageUrl(c.imageUrl),
    }))

    const bannerRows = Array.isArray(bannerRowsRaw) ? bannerRowsRaw : []
    const banners: HomeBanner[] = bannerRows.map((b: any) => ({
      ...b,
      imageUrl: normalizeImageUrl(b.imageUrl),
    }))

    return { products, categories, banners }
  } catch (error) {
    console.error('[getHomePageData error]', error)
    return { products: [], categories: [], banners: [] }
  }
}
