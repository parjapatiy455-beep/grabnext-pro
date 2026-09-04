export const runtime = 'edge'
import { Suspense } from "react"
import { Metadata } from "next"
import { ProductsContent } from "./products-content"
import { getSiteUrl } from "@/lib/site"

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
    const siteUrl = getSiteUrl()
    const pageUrl = `${siteUrl}/products`

    return {
        title: "Buy Digital Products, Software & Design Bundles Online | Grabnext",
        description: "Explore all digital products on Grabnext India. Buy cheap software source codes, Canva design templates, video editing FX bundles, and online masterclasses with instant download.",
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
        },
        twitter: {
            card: "summary_large_image",
            title: "Buy Digital Products & Software Online India | Grabnext",
            description: "Browse software source codes, graphic design templates, video editing bundles & courses with instant UPI delivery.",
        }
    }
}

export default function ProductsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm text-gray-400">Loading products...</p>
                </div>
            </div>
        }>
            <ProductsContent />
        </Suspense>
    )
}
