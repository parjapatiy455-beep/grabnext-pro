import { MetadataRoute } from 'next'
import { executeQuery } from '@/lib/db'
import { getSiteUrl } from '@/lib/site'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Cache for 1 hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const rawUrl = getSiteUrl()
    const baseUrl = rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl

    let productEntries: MetadataRoute.Sitemap = []
    let categoryEntries: MetadataRoute.Sitemap = []

    try {
        // Fetch active products with image and title
        const products = await executeQuery(
            'SELECT slug, id, title, imageUrl, updatedAt FROM products WHERE isActive = 1 ORDER BY updatedAt DESC'
        )
        if (Array.isArray(products)) {
            productEntries = products.map((p: any) => {
                const updatedDate = p.updatedAt
                    ? (typeof p.updatedAt === 'number' ? new Date(p.updatedAt) : new Date(p.updatedAt))
                    : new Date()

                const entry: MetadataRoute.Sitemap[number] = {
                    url: `${baseUrl}/products/${p.slug || p.id}`,
                    lastModified: isNaN(updatedDate.getTime()) ? new Date() : updatedDate,
                    changeFrequency: 'daily',
                    priority: 0.9,
                }
                // Standard Next.js Sitemap expects string[] for images
                if (p.imageUrl) {
                    const imgUrl = p.imageUrl.startsWith('http') ? p.imageUrl : `${baseUrl}${p.imageUrl}`
                    ;(entry as any).images = [imgUrl]
                }
                return entry
            })
        }

        // Fetch active categories
        const categories = await executeQuery(
            'SELECT slug, name, updatedAt FROM categories WHERE isActive = 1'
        )
        if (Array.isArray(categories)) {
            categoryEntries = categories.map((c: any) => {
                const updatedDate = c.updatedAt
                    ? (typeof c.updatedAt === 'number' ? new Date(c.updatedAt) : new Date(c.updatedAt))
                    : new Date()

                return {
                    url: `${baseUrl}/products?category=${c.slug}`,
                    lastModified: isNaN(updatedDate.getTime()) ? new Date() : updatedDate,
                    changeFrequency: 'weekly',
                    priority: 0.7,
                }
            })
        }
    } catch (error) {
        console.error("Sitemap generation error:", error)
    }

    // Static pages — always included with priority & keywords alignment
    const staticPages: MetadataRoute.Sitemap = [
        { route: '', priority: 1.0, freq: 'daily' },
        { route: '/products', priority: 0.9, freq: 'daily' },
        { route: '/software', priority: 0.9, freq: 'weekly' },
        { route: '/editing', priority: 0.9, freq: 'weekly' },
        { route: '/masterclass', priority: 0.8, freq: 'weekly' },
        { route: '/claude-skills', priority: 0.8, freq: 'weekly' },
        { route: '/categories', priority: 0.7, freq: 'weekly' },
        { route: '/about', priority: 0.5, freq: 'monthly' },
        { route: '/contact', priority: 0.5, freq: 'monthly' },
        { route: '/faq', priority: 0.6, freq: 'weekly' },
        { route: '/privacy', priority: 0.3, freq: 'monthly' },
        { route: '/terms', priority: 0.3, freq: 'monthly' },
        { route: '/refund', priority: 0.4, freq: 'monthly' },
    ].map(({ route, priority, freq }) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: freq as MetadataRoute.Sitemap[number]['changeFrequency'],
        priority,
    }))

    return [...staticPages, ...productEntries, ...categoryEntries]
}
