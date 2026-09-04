"use client"

import { useEffect, Suspense } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { pageview } from "@/lib/gtag"

function GARouteTrackerContent() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (pathname) {
      const url = searchParams?.toString() ? `${pathname}?${searchParams.toString()}` : pathname
      pageview(url)
    }
  }, [pathname, searchParams])

  return null
}

export function GoogleAnalyticsRouteTracker() {
  return (
    <Suspense fallback={null}>
      <GARouteTrackerContent />
    </Suspense>
  )
}
