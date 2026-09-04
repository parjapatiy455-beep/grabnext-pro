import { Metadata } from "next";
import { getSiteUrl } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl()
  const pageUrl = `${siteUrl}/masterclass`

  return {
    title: "Digital Product Selling Masterclass ₹49 | Live Workshop & Blueprint | Grabnext",
    description: "Learn how to build a ₹1,00,000/month digital product business in Hindi. Digital product sourcing, 30-min website building & Facebook ads setup @ ₹49 only!",
    keywords: [
      "digital product selling masterclass hindi",
      "how to sell digital products india",
      "facebook ads for digital products",
      "buy digital products resell rights",
      "plr mrr digital products masterclass",
      "grabnext masterclass"
    ],
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: "Digital Product Selling Masterclass ₹49 | Grabnext",
      description: "Learn how to build a ₹1,00,000/month digital product business in Hindi. Live workshop + recording + ₹15,000 free bonuses!",
      url: pageUrl,
      type: "website",
      siteName: "Grabnext",
    },
    twitter: {
      card: "summary_large_image",
      title: "Digital Product Selling Masterclass ₹49 | Grabnext",
      description: "Learn how to build a ₹1,00,000/month digital product business in Hindi. Live workshop + recording + ₹15,000 free bonuses!",
    }
  }
}

export default function MasterclassLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
