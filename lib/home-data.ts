import { executeQuery } from '@/lib/db'
import type { Product } from '@/lib/types'

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
    const primaryProductsSql = 'SELECT * FROM products WHERE isActive = 1 ORDER BY displayOrder ASC, createdAt DESC'
    const fallbackProductsSql = 'SELECT * FROM products WHERE isActive = 1 ORDER BY createdAt DESC'
    const ratingsSql = 'SELECT productId, ROUND(AVG(rating),1) AS avgRating, COUNT(id) AS reviewCount FROM reviews GROUP BY productId'
    const categoriesSql = 'SELECT * FROM categories WHERE isActive = 1 ORDER BY name ASC'
    const bannersSql = 'SELECT * FROM banners WHERE isActive = 1 ORDER BY sortOrder ASC, createdAt DESC'

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
    const products: Product[] = productRows.map((p: any) => ({
      ...p,
      tags: p.tags ? tryParse(p.tags) : [],
      images: p.images ? tryParse(p.images) : (p.imageUrl ? [p.imageUrl] : []),
      isActive: Boolean(p.isActive),
      price: Number(p.price),
      originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
      avgRating: ratingsMap[p.id]?.avgRating || null,
      reviewCount: ratingsMap[p.id]?.reviewCount || 0,
    }))

    const categoryRows = Array.isArray(categoryRowsRaw) ? categoryRowsRaw : []
    const categories: HomeCategory[] = categoryRows.filter((c: any) => c.isActive !== 0)

    const bannerRows = Array.isArray(bannerRowsRaw) ? bannerRowsRaw : []
    const banners: HomeBanner[] = bannerRows

    return { products, categories, banners }
  } catch (error) {
    console.error('[getHomePageData error]', error)
    return { products: [], categories: [], banners: [] }
  }
}
