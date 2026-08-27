import { Metadata } from "next"
import { EditingLandingPageClient } from "./editing-client"

export const runtime = "edge"
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "World's Biggest Video Editing Bundle | GrabNext",
  description: "Get over 70 GB of premium video editing assets: 800+ transitions, 2,000+ FX presets, 10,000+ fonts, 3,050+ sound effects, cinematic LUTs & full masterclass. Lifetime access for only ₹199!",
  openGraph: {
    title: "World's Biggest Video Editing Bundle | GrabNext",
    description: "Get over 70 GB of premium video editing assets: 800+ transitions, 2,000+ FX presets, 10,000+ fonts, 3,050+ sound effects, cinematic LUTs & full masterclass. Lifetime access for only ₹199!",
    url: "https://shop.grabnext.app/editing",
    siteName: "GrabNext",
    images: [
      {
        url: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/hero1.webp",
        width: 1400,
        height: 800,
        alt: "GrabNext Video Editing Assets Package Mockup"
      }
    ],
    locale: "en_IN",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "World's Biggest Video Editing Bundle | GrabNext",
    description: "Get over 70 GB of video editing assets, LUTs, FX, templates, and courses. Lifetime access for only ₹199.",
    images: ["https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/hero1.webp"]
  },
  alternates: {
    canonical: "https://shop.grabnext.app/editing"
  }
}

export default function EditingLandingPage() {
  return <EditingLandingPageClient />
}
