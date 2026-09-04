import { Metadata } from "next";
import { getSiteUrl } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl()
  const pageUrl = `${siteUrl}/categories`

  return {
    title: "Browse Digital Product Categories - Software, Templates, Courses & Ebooks | Grabnext",
    description: "Explore all digital product categories on Grabnext India: Software, Graphic Design Templates, Video Editing Packs, Masterclasses, E-books, and Plugins.",
    keywords: [
      "digital product categories india",
      "software category buy online",
      "design templates category",
      "video editing assets category",
      "online courses category",
      "grabnext categories"
    ],
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: "Browse Digital Product Categories | Grabnext",
      description: "Explore all digital product categories on Grabnext India with instant download and UPI payment.",
      url: pageUrl,
      type: "website",
      siteName: "Grabnext",
    }
  }
}

export default function CategoriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
