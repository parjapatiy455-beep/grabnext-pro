import { Metadata } from "next";
import { getSiteUrl } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl()
  const pageUrl = `${siteUrl}/software`

  return {
    title: "Adobe All Premium Software Bundle 2026 ₹249 | Pre-Activated Lifetime Access | Grabnext",
    description: "Get lifetime access to 20+ Adobe CC apps including Photoshop, Premiere Pro, Illustrator, After Effects, and Lightroom. Pre-activated for Windows & Mac with instant download.",
    keywords: [
      "adobe software bundle cheap india",
      "buy adobe photoshop premiere pro online",
      "adobe creative cloud lifetime access india",
      "preactivated software bundle windows mac",
      "cheap software buy online upi",
      "grabnext software bundle"
    ],
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: "Adobe All Premium Software Bundle 2026 ₹249 | Grabnext",
      description: "Get lifetime access to 20+ Adobe CC apps, pre-activated for Windows & Mac. One-time payment of ₹249, no monthly subscriptions!",
      url: pageUrl,
      type: "website",
      siteName: "Grabnext",
    },
    twitter: {
      card: "summary_large_image",
      title: "Adobe All Premium Software Bundle 2026 ₹249 | Grabnext",
      description: "Get lifetime access to 20+ Adobe CC apps, pre-activated for Windows & Mac. One-time payment of ₹249, no monthly subscriptions!",
    }
  }
}

export default function SoftwareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
