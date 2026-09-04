import { Metadata } from "next";
import { getSiteUrl } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl()
  const pageUrl = `${siteUrl}/faq`

  return {
    title: "Frequently Asked Questions (FAQ) | Grabnext Digital Store",
    description: "Find answers to common questions about ordering digital products, instant UPI payments, file downloads, refunds, and security on Grabnext India.",
    keywords: [
      "grabnext faq",
      "digital product order questions",
      "instant upi download help",
      "grabnext support",
      "software refund policy"
    ],
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: "Frequently Asked Questions (FAQ) | Grabnext",
      description: "Find answers to common questions about ordering digital products, instant UPI payments, file downloads, and refunds.",
      url: pageUrl,
      type: "website",
      siteName: "Grabnext",
    }
  }
}

export default function FaqLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
