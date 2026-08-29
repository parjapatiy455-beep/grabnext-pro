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
import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "Grabnext - Buy Digital Products, Software, Courses & Templates Online India",
    template: "%s | Grabnext",
  },
  description:
    "Grabnext is India's trusted digital marketplace. Buy software, online courses, design templates, ebooks & more at the best prices with instant delivery and secure UPI payment.",
  keywords: [
    "grabnext",
    "buy digital products india",
    "software buy online india",
    "online courses india",
    "design templates",
    "ebooks india",
    "digital download india",
    "instant delivery digital goods",
    "buy software cheap india",
    "digital marketplace india",
  ],
  authors: [{ name: "Grabnext", url: "https://shop.grabnext.app" }],
  creator: "Grabnext",
  publisher: "Grabnext",
  metadataBase: new URL("https://shop.grabnext.app"),
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://shop.grabnext.app",
    siteName: "Grabnext",
    title: "Grabnext - Buy Digital Products Online India",
    description:
      "India's trusted digital store. Software, courses, templates & more at the best prices with instant delivery.",
    images: [
      {
        url: "/favicon.png",
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
    title: "Grabnext - Buy Digital Products Online India",
    description:
      "India's trusted digital store. Software, courses, templates & more with instant delivery.",
    images: ["/favicon.png"],
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
    canonical: "https://shop.grabnext.app",
  },
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${GeistSans.variable}`}>
      <head>
        <meta name="google-adsense-account" content="ca-pub-4010815088153941" />
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
        {/* ── WebSite + Organization Structured Data (AI & Search Discovery) ── */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                "name": "Grabnext",
                "url": "https://shop.grabnext.app",
                "alternateName": "Grabnext Digital Marketplace",
                "description": "India's trusted digital marketplace. Buy software, online courses, design templates, ebooks & more with instant delivery.",
                "potentialAction": {
                  "@type": "SearchAction",
                  "target": {
                    "@type": "EntryPoint",
                    "urlTemplate": "https://shop.grabnext.app/products?q={search_term_string}"
                  },
                  "query-input": "required name=search_term_string"
                }
              },
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                "name": "Grabnext",
                "url": "https://shop.grabnext.app",
                "logo": "https://shop.grabnext.app/favicon.png",
                "description": "Grabnext is India's trusted digital marketplace for software, courses, templates & digital downloads with instant delivery.",
                "contactPoint": {
                  "@type": "ContactPoint",
                  "contactType": "customer support",
                  "url": "https://shop.grabnext.app/contact",
                  "availableLanguage": ["English", "Hindi"]
                },
                "sameAs": [
                  "https://grabnext.pages.dev"
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