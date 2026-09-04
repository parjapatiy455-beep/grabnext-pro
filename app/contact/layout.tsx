import { Metadata } from "next";
import { getSiteUrl } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl()
  const pageUrl = `${siteUrl}/contact`

  return {
    title: "Contact Us | Grabnext Digital Support",
    description: "Get in touch with Grabnext support team for assistance with digital product orders, software downloads, instant UPI payments, or business queries.",
    keywords: [
      "contact grabnext",
      "grabnext support email",
      "grabnext whatsapp support",
      "digital store customer care"
    ],
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: "Contact Us | Grabnext Support",
      description: "Get in touch with Grabnext support team for assistance with digital product orders and instant downloads.",
      url: pageUrl,
      type: "website",
      siteName: "Grabnext",
    }
  }
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
