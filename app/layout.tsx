import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { AuthProvider } from "@/contexts/auth-context"
import { CartProvider } from "@/contexts/cart-context"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { CartDrawer } from "@/components/cart-drawer"
import { WhatsAppToggle } from "@/components/whatsapp-toggle"
import { FacebookPixelScript, FacebookPixelRouteTracker } from "@/components/facebook-pixel"
import { getSiteUrl, DEFAULT_SITE_TITLE, DEFAULT_SITE_DESCRIPTION, DEFAULT_SEO_KEYWORDS } from "@/lib/site"
import "./globals.css"

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl()

  return {
    title: {
      default: DEFAULT_SITE_TITLE,
      template: "%s | Grabnext",
    },
    description: DEFAULT_SITE_DESCRIPTION,
    keywords: DEFAULT_SEO_KEYWORDS,
    authors: [{ name: "Grabnext", url: siteUrl }],
    creator: "Grabnext",
    publisher: "Grabnext",
    metadataBase: new URL(siteUrl),
    openGraph: {
      type: "website",
      locale: "en_IN",
      url: siteUrl,
      siteName: "Grabnext",
      title: "Grabnext - Buy Digital Products, Software & Bundles Online India",
      description:
        "India's trusted digital store. Software, courses, Canva templates, video editing bundles & more at the best prices with instant delivery and secure UPI payment.",
      images: [
        {
          url: `${siteUrl}/logo.png`,
          width: 512,
          height: 512,
          alt: "Grabnext - Digital Marketplace India",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@grabnext",
      creator: "@grabnext",
      title: "Grabnext - Buy Digital Products & Software Online India",
      description:
        "India's trusted digital store. Buy software, courses, design templates & video bundles with instant delivery.",
      images: [`${siteUrl}/logo.png`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    verification: {
      google: "a6IFtvu-QdswT63axIr-jp_-vPxu2OYz5dpN6y8CZmk",
    },
    icons: {
      icon: "/favicon.png",
      shortcut: "/favicon.png",
      apple: "/favicon.png",
    },
    alternates: {
      canonical: siteUrl,
    },
    other: {
      "ai:site_type": "Digital Products Marketplace",
      "ai:target_market": "India",
      "ai:llms_txt": `${siteUrl}/llms.txt`,
      "ai:currency": "INR",
      "ai:payment_methods": "UPI, Google Pay, PhonePe, Paytm"
    }
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const siteUrl = getSiteUrl()

  return (
    <html lang="en" suppressHydrationWarning className={`${GeistSans.variable}`}>
      <head>
        <meta name="google-adsense-account" content="ca-pub-4010815088153941" />
        <link rel="alternate" type="text/plain" href={`${siteUrl}/llms.txt`} title="LLM Knowledge Base" />
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-C3HYF0VYC0"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-C3HYF0VYC0');
            `,
          }}
        />
        <script src="https://x-pg.pages.dev/xpay.js" async />
        {/* ── Meta (Facebook) Pixel – init + first PageView ── */}
        <FacebookPixelScript />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "wf91qtq1oa");
            `,
          }}
        />
        <style dangerouslySetInnerHTML={{
          __html: `
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
}
        `
        }} />
        {/* ── WebSite + Organization + OnlineStore Structured Data (AI & Search Discovery) ── */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                "name": "Grabnext",
                "url": siteUrl,
                "alternateName": ["Grabnext Digital Marketplace", "Grabnext Store"],
                "description": DEFAULT_SITE_DESCRIPTION,
                "potentialAction": {
                  "@type": "SearchAction",
                  "target": {
                    "@type": "EntryPoint",
                    "urlTemplate": `${siteUrl}/products?q={search_term_string}`
                  },
                  "query-input": "required name=search_term_string"
                }
              },
              {
                "@context": "https://schema.org",
                "@type": "OnlineStore",
                "name": "Grabnext",
                "url": siteUrl,
                "logo": `${siteUrl}/logo.png`,
                "description": DEFAULT_SITE_DESCRIPTION,
                "currenciesAccepted": "INR",
                "paymentAccepted": "UPI, Google Pay, PhonePe, Paytm",
                "priceRange": "₹49 - ₹1999",
                "contactPoint": {
                  "@type": "ContactPoint",
                  "contactType": "customer support",
                  "url": `${siteUrl}/contact`,
                  "availableLanguage": ["English", "Hindi"]
                },
                "sameAs": [
                  "https://grabnext.pages.dev",
                  "https://shop.grabnext.app"
                ]
              }
            ])
          }}
        />
      </head>
      <body>
        {/* Meta Pixel noscript fallback */}
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=864520106659183&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <CartProvider>
              {/* Tracks PageView on every SPA route change */}
              <FacebookPixelRouteTracker />
              {children}
              <CartDrawer />
              <Toaster />
              <WhatsAppToggle />
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}