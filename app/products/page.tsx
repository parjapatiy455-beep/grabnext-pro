export const runtime = 'edge'
import { Suspense } from "react"
import { Metadata } from "next"
import { ProductsContent } from "./products-content"
import ProductsLoading from "./loading"
import { getSiteUrl } from "@/lib/site"

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
    const siteUrl = getSiteUrl()
    const pageUrl = `${siteUrl}/products`

    return {
        title: "Buy Digital Products, Software & Bundles Online",
        description: "Browse premium digital products in India: cheap software source codes, Canva templates, video editing bundles & masterclasses with instant UPI download.",
        keywords: [
            "buy digital products online",
            "software buy cheap india",
            "design templates bundle",
            "video editing packs",
            "online courses india",
            "grabnext products",
            "instant digital download india"
        ],
        alternates: {
            canonical: pageUrl,
        },
        openGraph: {
            title: "Buy Digital Products & Software Online India | Grabnext",
            description: "Browse software source codes, graphic design templates, video editing bundles & courses with instant UPI delivery.",
            url: pageUrl,
            siteName: "Grabnext",
            type: "website",
            images: [
                {
                    url: `${siteUrl}/logo.webp`,
                    width: 1200,
                    height: 630,
                    alt: "Grabnext Digital Products Marketplace India",
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title: "Buy Digital Products & Software Online India | Grabnext",
            description: "Browse software source codes, graphic design templates, video editing bundles & courses with instant UPI delivery.",
            images: [`${siteUrl}/logo.webp`],
        }
    }
}

export default function ProductsPage() {
    return (
        <Suspense fallback={<ProductsLoading />}>
            <ProductsContent />
        </Suspense>
    )
}
