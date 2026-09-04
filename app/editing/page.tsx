import { Metadata } from "next"
import { EditingLandingPageClient } from "./editing-client"
import { getSiteUrl } from "@/lib/site"

export const runtime = "edge"
export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl()
  const pageUrl = `${siteUrl}/editing`

  return {
    title: "World's Biggest Video Editing Bundle ₹199 | Premiere Pro & After Effects Assets | Grabnext",
    description: "Get 70+ GB of premium video editing assets: 800+ transitions, 2,000+ FX presets, 10,000+ fonts, 3,050+ sound effects, cinematic LUTs & full masterclass. Lifetime access for ₹199!",
    keywords: [
      "video editing bundle india",
      "premiere pro transitions pack",
      "after effects fx presets buy online",
      "cinematic luts download",
      "video editing assets pack 70gb",
      "wedding invitation video templates",
      "10000 fonts collection",
      "youtube creator essential pack",
      "grabnext editing bundle"
    ],
    alternates: {
      canonical: pageUrl
    },
    openGraph: {
      title: "World's Biggest Video Editing Bundle ₹199 | Grabnext",
      description: "Get over 70 GB of premium video editing assets: 800+ transitions, 2,000+ FX presets, 10,000+ fonts, 3,050+ sound effects, cinematic LUTs & full masterclass. Lifetime access for only ₹199!",
      url: pageUrl,
      siteName: "Grabnext",
      images: [
        {
          url: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/hero1.webp",
          width: 1400,
          height: 800,
          alt: "Grabnext Video Editing Assets Package Mockup"
        }
      ],
      locale: "en_IN",
      type: "website"
    },
    twitter: {
      card: "summary_large_image",
      title: "World's Biggest Video Editing Bundle ₹199 | Grabnext",
      description: "Get over 70 GB of video editing assets, LUTs, FX, templates, and courses. Lifetime access for only ₹199.",
      images: ["https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/hero1.webp"]
    }
  }
}

export default function EditingLandingPage() {
  return <EditingLandingPageClient />
}
