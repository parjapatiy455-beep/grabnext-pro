"use client"

import { useEffect, useState, useRef, Suspense } from "react"
import { usePathname, useSearchParams } from "next/navigation"

function TopProgressBarInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const completeTimerRef = useRef<NodeJS.Timeout | null>(null)

  const startProgress = () => {
    if (completeTimerRef.current) clearTimeout(completeTimerRef.current)
    if (timerRef.current) clearInterval(timerRef.current)

    setVisible(true)
    setProgress(15)

    // Gradual increment simulating load progress
    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 85) {
          if (timerRef.current) clearInterval(timerRef.current)
          return 85
        }
        const step = Math.max(1, (90 - prev) * 0.15)
        return Math.min(85, prev + step)
      })
    }, 120)
  }

  const completeProgress = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setProgress(100)

    completeTimerRef.current = setTimeout(() => {
      setVisible(false)
      setProgress(0)
    }, 280)
  }

  // Intercept internal link clicks to trigger instant visual feedback
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      // Find closest anchor tag
      const anchor = (e.target as HTMLElement).closest("a")
      if (!anchor) return

      const href = anchor.getAttribute("href")
      const target = anchor.getAttribute("target")

      // Ignore special links
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("javascript:") ||
        target === "_blank" ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey ||
        e.altKey ||
        e.defaultPrevented
      ) {
        return
      }

      // Check if it's internal navigation
      try {
        const url = new URL(href, window.location.origin)
        if (url.origin === window.location.origin) {
          const isSamePage =
            url.pathname === window.location.pathname &&
            url.search === window.location.search

          if (!isSamePage) {
            startProgress()
          }
        }
      } catch {
        // invalid URL
      }
    }

    document.addEventListener("click", handleDocumentClick, { capture: true })
    return () => {
      document.removeEventListener("click", handleDocumentClick, { capture: true })
    }
  }, [])

  // Route changed: complete the progress bar
  useEffect(() => {
    if (visible) {
      completeProgress()
    }
  }, [pathname, searchParams])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (completeTimerRef.current) clearTimeout(completeTimerRef.current)
    }
  }, [])

  if (!visible && progress === 0) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none transition-opacity duration-200"
      style={{ opacity: visible ? 1 : 0 }}
      aria-hidden="true"
    >
      {/* Glow bar */}
      <div
        className="h-[3px] bg-gradient-to-r from-purple-600 via-pink-500 to-amber-400 shadow-[0_0_12px_rgba(168,85,247,0.9),0_0_6px_rgba(236,72,153,0.8)] transition-all duration-200 ease-out"
        style={{
          width: `${progress}%`,
        }}
      />
    </div>
  )
}

export function TopProgressBar() {
  return (
    <Suspense fallback={null}>
      <TopProgressBarInner />
    </Suspense>
  )
}
