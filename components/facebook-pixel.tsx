"use client"

/**
 * components/facebook-pixel.tsx
 *
 * FacebookPixelScript  – Server-safe script tag: inits the pixel + fires the
 *                        very first PageView. Exported without "use client" so
 *                        it can be rendered in a Server Component (<head>).
 *
 * FacebookPixelRouteTracker – Client component that fires PageView on every
 *                             subsequent SPA route change (usePathname).
 *                             Skips the initial path because the inline script
 *                             already fired PageView on first load.
 */

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { trackPageView } from "@/lib/pixel"

// Optional env fallback only (no hardcoded pixel IDs; Admin Panel Primary Pixel is authoritative)
const envPixelList = (process.env.NEXT_PUBLIC_FB_PIXEL_IDS || process.env.NEXT_PUBLIC_FB_PIXEL_ID || "")
  .split(",")
  .map(id => id.trim())
  .filter(Boolean)

export const ALL_FB_PIXEL_IDS = Array.from(new Set(envPixelList))

export const FB_PIXEL_ID = ALL_FB_PIXEL_IDS[0] || ""

// ── SPA route-change tracker (Client Component) ───────────────────────────────
export function FacebookPixelRouteTracker() {
  const pathname = usePathname()
  /**
   * initialPath stores the very first path that was rendered server-side.
   * We skip firing PageView for it because the inline <script> in
   * FacebookPixelScript already fired fbq('track', 'PageView') on load.
   * Every subsequent navigation gets its own PageView call.
   */
  const initialPath = useRef<string | null>(null)
  const lastTrackedPath = useRef<string | null>(null)

  useEffect(() => {
    // Record the first path seen so we can skip it
    if (initialPath.current === null) {
      initialPath.current = pathname
      lastTrackedPath.current = pathname
      // Do NOT fire here – the inline script already fired PageView for this path
      return
    }

    // Skip if it's the same path (e.g. query-string update without navigation)
    if (lastTrackedPath.current === pathname) return

    // Skip if fbq hasn't loaded yet (pixel script still loading)
    if (typeof window === "undefined" || typeof window.fbq !== "function") return

    lastTrackedPath.current = pathname
    trackPageView()
  }, [pathname])

  return null
}

// ── Pixel init script (safe for Server or Client rendering) ───────────────────
/**
 * Renders the Facebook Pixel base code as an inline <script> tag.
 * Reads NEXT_PUBLIC_FB_TEST_EVENT_CODE at build/render time for test-event mode.
 *
 * Place this inside <head> in layout.tsx:
 *   <FacebookPixelScript />
 */
export function FacebookPixelScript() {
  // This env var is resolved at build time (NEXT_PUBLIC_ prefix) and is safe
  // to reference in both server and client components.
  const testCode = process.env.NEXT_PUBLIC_FB_TEST_EVENT_CODE ?? ""

  const initScript = [
    "!function(f,b,e,v,n,t,s){",
    "if(f.fbq)return;",
    "n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};",
    "if(!f._fbq)f._fbq=n;",
    "n.push=n;n.loaded=!0;n.version='2.0';",
    "n.queue=[];t=b.createElement(e);t.async=!0;",
    "t.src=v;s=b.getElementsByTagName(e)[0];",
    "s.parentNode.insertBefore(t,s)",
    "}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');",
    // optional: test event code for Facebook Events Manager
    testCode ? `fbq('set','agent','test','${testCode}');` : "",
    // Isolated first PageView: if ?pixel= or session pixel exists, track immediately; otherwise DynamicPixelInjector uses Admin Primary Pixel
    "try{",
    "  var sp=new URLSearchParams(window.location.search);",
    "  var urlPixel=sp.get('pixel')||sp.get('pixel_id')||sp.get('fb_pixel');",
    "  if(!urlPixel){try{urlPixel=sessionStorage.getItem('grabnext_active_pixel');}catch(e){}}",
    "  if(urlPixel){sessionStorage.setItem('grabnext_active_pixel',urlPixel);fbq('init',urlPixel);fbq('trackSingle',urlPixel,'PageView');window.__GRABNEXT_INITIAL_PV_FIRED__=true;}",
    "}catch(e){}",
  ]
    .filter(Boolean)
    .join("\n")

  return (
    <script
      id="fb-pixel-base"
      dangerouslySetInnerHTML={{ __html: initScript }}
    />
  )
}
