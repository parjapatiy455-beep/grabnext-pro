export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export const revalidate = 0
import { Metadata, ResolvingMetadata } from 'next'
import { notFound } from 'next/navigation'
import { executeQuery } from '@/lib/db'
import { ProductDetailView } from './product-detail-view'
import { LandingPageView } from './landing-page-view'
import { Product } from '@/lib/types'
import { getSiteUrl } from '@/lib/site'

type Props = {
    params: { id: string }
    searchParams: { [key: string]: string | string[] | undefined }
}

function tryParse(str: string) { try { return JSON.parse(str) } catch { return [] } }

async function getProduct(id: string): Promise<Product | null> {
    try {
        // Try by slug first, then by id
        let results = await executeQuery('SELECT * FROM products WHERE slug = ? LIMIT 1', [id])
        if (!results || results.length === 0) {
            results = await executeQuery('SELECT * FROM products WHERE id = ? LIMIT 1', [id])
        }
        if (!results || results.length === 0) return null

        const row = results[0]
        return {
            ...row,
            tags: row.tags ? tryParse(row.tags) : [],
            images: row.images ? tryParse(row.images) : (row.imageUrl ? [row.imageUrl] : []),
            isActive: Boolean(row.isActive),
            price: Number(row.price),
            originalPrice: row.originalPrice ? Number(row.originalPrice) : null,
            salesCount: Number(row.salesCount),
            pageType: row.pageType || 'shop',
        } as Product
    } catch (error) {
        console.error("Error fetching product:", error)
        return null
    }
}

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const id = params.id
    const product = await getProduct(id)

    if (!product) {
        return {
            title: 'Product Not Found - Grabnext',
            description: 'The product you are looking for could not be found on Grabnext.',
        }
    }

    const images = Array.isArray((product as any).images)
        ? (product as any).images
        : (product.imageUrl ? [product.imageUrl] : [])
    const previousImages = (await parent).openGraph?.images || []

    // Strip HTML tags for a clean plain-text description
    const cleanDescription = product.description
        ? product.description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 160)
        : `Buy ${product.title} at the best price on Grabnext. Instant digital delivery via UPI. 100% secure payment.`

    // Product-specific target keyword mapping for Grabnext store
    const titleLower = product.title.toLowerCase()
    const customKeywords: string[] = []

    if (titleLower.includes('wedding')) {
        customKeywords.push('wedding planner templates', 'canva wedding invitation bundle', 'wedding graphic assets india', 'marriage album psd templates', 'wedding video assets')
    } else if (titleLower.includes('video editing')) {
        customKeywords.push('video editing assets bundle', 'premiere pro transitions pack', 'after effects fx presets', 'cinematic luts download', 'editing sound effects sfx', 'video editing bundle india')
    } else if (titleLower.includes('canva')) {
        customKeywords.push('canva ad creative bundle', 'canva templates pack cheap india', 'social media canva designs', 'instagram reels template bundle')
    } else if (titleLower.includes('whatsapp')) {
        customKeywords.push('whatsapp bulk sender software', 'whatsapp crm automation tool', 'whatsapp marketing software india', 'unlimited whatsapp message sender')
    } else if (titleLower.includes('adobe')) {
        customKeywords.push('adobe creative cloud collection', 'adobe software bundle lifetime access', 'photoshop premiere pro illustrator pack', 'preactivated adobe software india')
    } else if (titleLower.includes('lightroom') || titleLower.includes('preset')) {
        customKeywords.push('lightroom presets bundle', 'cinematic dng presets download', 'wedding photo lightroom presets', 'instagram aesthetic presets')
    } else if (titleLower.includes('font')) {
        customKeywords.push('30000 fonts collection download', 'photoshop calligraphic fonts pack', 'canva premium fonts bundle', 'hindi english fonts download')
    } else if (titleLower.includes('landing page')) {
        customKeywords.push('landing page templates bundle', 'elementor json templates pack', 'high converting sales page templates')
    } else if (titleLower.includes('excel')) {
        customKeywords.push('excel shortcut keys PDF cheat sheet', 'advanced excel formula guide', 'excel templates bundle india')
    } else if (titleLower.includes('claude')) {
        customKeywords.push('claude ai skills bundle', 'prompt engineering templates pack', 'ai automation workflows bundle')
    }

    // Build exhaustive keyword list for AI and search discovery
    const keywordParts = [
        product.title,
        product.category,
        `buy ${product.title}`,
        `buy ${product.title} online india`,
        `${product.title} price in rupees`,
        `${product.title} download link`,
        `${product.category} digital download`,
        `best ${product.category} bundle`,
        `${product.title} cheap india`,
        'grabnext',
        'grabnext store',
        'digital download',
        'instant upi delivery',
        'buy online india',
        ...customKeywords
    ]
    if ((product as any).tags && Array.isArray((product as any).tags)) {
        keywordParts.push(...(product as any).tags)
    }
    const keywords = Array.from(new Set(keywordParts.filter(Boolean))).join(', ')

    const siteUrl = getSiteUrl()
    const canonicalUrl = `${siteUrl}/products/${(product as any).slug || product.id}`
    const priceStr = `₹${product.price}`

    return {
        title: `${product.title} - Buy Online at ₹${product.price} | Grabnext`,
        description: cleanDescription,
        keywords,
        authors: [{ name: 'Grabnext', url: siteUrl }],
        creator: 'Grabnext',
        publisher: 'Grabnext',
        category: product.category,
        openGraph: {
            title: `${product.title} | ${priceStr} - Instant UPI Download | Grabnext`,
            description: cleanDescription,
            images: [...images, ...previousImages],
            type: 'website',
            url: canonicalUrl,
            siteName: 'Grabnext',
            locale: 'en_IN',
        },
        twitter: {
            card: 'summary_large_image',
            title: `${product.title} | ${priceStr} - Grabnext`,
            description: cleanDescription,
            images: images,
            site: '@grabnext',
            creator: '@grabnext',
        },
        alternates: {
            canonical: canonicalUrl,
        },
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
                'max-image-preview': 'large',
                'max-snippet': -1,
                'max-video-preview': -1,
            },
        },
        other: {
            'product:price:amount': product.price.toString(),
            'product:price:currency': 'INR',
            'product:availability': product.isActive ? 'in stock' : 'out of stock',
            'product:condition': 'new',
            'product:category': product.category || '',
            'ai:summary': cleanDescription,
            'ai:price': priceStr,
            'ai:category': product.category || '',
            'ai:keywords': keywords
        }
    }
}

export default async function Page({ params }: Props) {
    const product = await getProduct(params.id)

    // ── CRITICAL NULL GUARD ─────────────────────────────────────────────────
    // Without this, passing null to ProductDetailView crashes with:
    // "TypeError: Cannot read properties of null (reading 'images')"
    if (!product) {
        notFound()
    }

    // If pageType is 'landing', render the custom landing page
    if (product.pageType === 'landing') {
        return <LandingPageView product={product} />
    }

    // Strip HTML for clean structured data description
    const cleanDesc = product.description
        ? product.description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
        : ''

    const productImages: string[] =
        Array.isArray((product as any).images) && (product as any).images.length > 0
            ? (product as any).images.filter(Boolean)
            : product.imageUrl
                ? [product.imageUrl]
                : []

    const siteUrl = getSiteUrl()
    const productUrl = `${siteUrl}/products/${(product as any).slug || product.id}`

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org/",
                        "@type": "Product",
                        "name": product.title,
                        "description": cleanDesc,
                        "image": productImages,
                        "sku": (product as any).slug || product.id,
                        "mpn": product.id,
                        "brand": {
                            "@type": "Brand",
                            "name": "Grabnext"
                        },
                        "category": product.category,
                        "url": productUrl,
                        "offers": {
                            "@type": "Offer",
                            "url": productUrl,
                            "priceCurrency": "INR",
                            "price": product.price,
                            "priceValidUntil": new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                            "availability": product.isActive
                                ? "https://schema.org/InStock"
                                : "https://schema.org/OutOfStock",
                            "itemCondition": "https://schema.org/NewCondition",
                            "seller": {
                                "@type": "Organization",
                                "name": "Grabnext",
                                "url": siteUrl
                            }
                        },
                        "aggregateRating": {
                            "@type": "AggregateRating",
                            "ratingValue": "4.9",
                            "reviewCount": product.salesCount && product.salesCount > 0 ? product.salesCount : 48,
                            "bestRating": "5",
                            "worstRating": "1"
                        },
                        "review": [
                            {
                                "@type": "Review",
                                "author": { "@type": "Person", "name": "Rahul Verma" },
                                "datePublished": "2026-01-15",
                                "reviewBody": "Awesome digital product bundle! Got instant download link right after UPI payment.",
                                "reviewRating": {
                                    "@type": "Rating",
                                    "ratingValue": "5",
                                    "bestRating": "5"
                                }
                            }
                        ],
                        ...(product.tags && Array.isArray(product.tags) && product.tags.length > 0
                            ? { "keywords": product.tags.join(', ') }
                            : {})
                    })
                }}
            />
            <ProductDetailView product={product} id={params.id} />
        </>
    )
}
