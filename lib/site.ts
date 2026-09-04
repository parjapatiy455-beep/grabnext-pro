import { headers } from "next/headers"

/**
 * Returns the request base URL (e.g. "https://grabnext.pages.dev" or "https://shop.grabnext.app")
 * dynamically based on the incoming HTTP host header.
 * This guarantees canonical URLs, sitemaps, OpenGraph tags, and JSON-LD schema
 * match whichever domain Googlebot or the user is accessing.
 */
export function getSiteUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin
  }
  try {
    const headersList = headers()
    const host = headersList.get("host") || headersList.get("x-forwarded-host")
    const proto = headersList.get("x-forwarded-proto") || "https"
    if (host) {
      const cleanHost = host.split(":")[0]
      if (cleanHost === "localhost" || cleanHost === "127.0.0.1") {
        return `http://${host}`
      }
      return `${proto}://${host}`
    }
  } catch {}

  return process.env.NEXT_PUBLIC_SITE_URL || "https://grabnext.pages.dev"
}

export const SITE_NAME = "Grabnext"
export const DEFAULT_SITE_TITLE = "Grabnext - Buy Digital Products, Software, Courses & Templates Online India"
export const DEFAULT_SITE_DESCRIPTION =
  "Grabnext is India's trusted digital marketplace. Buy cheap software source code, video editing bundles, Canva design templates, online courses & ebooks with instant delivery and secure UPI payment."

export const DEFAULT_SEO_KEYWORDS = [
  "grabnext",
  "grabnext store",
  "buy digital products india",
  "software buy online india",
  "cheap software source code india",
  "video editing assets bundle",
  "canva templates bundle cheap india",
  "online courses masterclass india",
  "design templates india",
  "premiere pro transitions pack",
  "after effects fx presets",
  "cinematic luts download",
  "adobe software bundle lifetime access",
  "ebooks india",
  "digital download marketplace india",
  "instant delivery upi payment",
  "buy software cheap india",
  "instagram reels template bundle",
  "digital store india"
]
