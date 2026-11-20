/**
 * Image URL normalization helper.
 * Automatically rewrites any blocked or legacy Vercel Blob storage URLs
 * to local Cloudflare CDN static assets under `/products/...`.
 */

const VERCEL_BLOB_REGEX = /https?:\/\/[a-zA-Z0-9_\-\.]+\.public\.blob\.vercel-storage\.com\/products\/([a-zA-Z0-9_\-\.]+)/g

export function normalizeImageUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') return ''
  const trimmed = url.trim()
  if (!trimmed) return ''
  
  // Replace vercel blob domain with local /products path
  return trimmed.replace(
    /https?:\/\/[a-zA-Z0-9_\-\.]+\.public\.blob\.vercel-storage\.com\/products\//g,
    '/products/'
  )
}

export function normalizeImageArray(images: any): string[] {
  if (!images) return []
  let arr: any[] = []
  if (Array.isArray(images)) {
    arr = images
  } else if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images)
      arr = Array.isArray(parsed) ? parsed : [parsed]
    } catch {
      arr = [images]
    }
  }
  return arr.map((item) => normalizeImageUrl(item)).filter(Boolean)
}

export function normalizeHtmlContent(html: string | null | undefined): string {
  if (!html || typeof html !== 'string') return ''
  return html.replace(
    /https?:\/\/[a-zA-Z0-9_\-\.]+\.public\.blob\.vercel-storage\.com\/products\//g,
    '/products/'
  )
}

export function normalizeProductData<T extends Record<string, any>>(p: T): T {
  if (!p) return p
  
  const rawImages = p.images ? (Array.isArray(p.images) ? p.images : (() => { try { return JSON.parse(p.images) } catch { return [] } })()) : []
  const normImages = normalizeImageArray(rawImages)
  const normImageUrl = normalizeImageUrl(p.imageUrl) || normImages[0] || ''

  const rawProof = p.proofImages ? (Array.isArray(p.proofImages) ? p.proofImages : (() => { try { return JSON.parse(p.proofImages) } catch { return [] } })()) : []
  const normProof = normalizeImageArray(rawProof)

  return {
    ...p,
    imageUrl: normImageUrl,
    images: normImages.length > 0 ? normImages : (normImageUrl ? [normImageUrl] : []),
    proofImages: normProof,
    description: normalizeHtmlContent(p.description),
  }
}
