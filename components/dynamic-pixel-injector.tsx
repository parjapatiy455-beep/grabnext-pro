"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"

interface PixelItem {
  id: string
  name: string
  type: 'facebook' | 'google_analytics' | 'tiktok' | 'custom_script'
  pixelId?: string | null
  scriptCode?: string | null
  placement: 'head' | 'body'
  triggerPage: 'all' | 'checkout' | 'success' | 'landing'
  testEventCode?: string | null
  description?: string | null
  isActive: number
}

// Global registry of initialized pixels to prevent duplicate initialization
const initializedPixels = new Set<string>()

export function DynamicPixelInjector() {
  const pathname = usePathname()
  const [pixels, setPixels] = useState<PixelItem[]>([])
  const isLoaded = useRef(false)
  const lastPath = useRef<string | null>(null)

  // 1. Fetch active pixels from API
  useEffect(() => {
    let isMounted = true
    async function loadPixels() {
      try {
        const res = await fetch('/api/pixels', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (isMounted && Array.isArray(data)) {
          setPixels(data)
        }
      } catch (err) {
        console.warn('[DynamicPixelInjector] Error loading pixels:', err)
      }
    }
    loadPixels()
    return () => {
      isMounted = false
    }
  }, [])

  // Helper to test if a triggerPage matches current pathname
  const matchesRoute = (triggerPage: string, currentPath: string) => {
    if (!triggerPage || triggerPage === 'all') return true
    if (triggerPage === 'checkout' && currentPath.startsWith('/checkout')) return true
    if (triggerPage === 'success' && currentPath.includes('/checkout/success')) return true
    if (triggerPage === 'landing' && (currentPath.startsWith('/lp') || currentPath.startsWith('/products'))) return true
    return false
  }

  // 2. Initialize and inject pixels once loaded
  useEffect(() => {
    if (pixels.length === 0) return
    isLoaded.current = true

    pixels.forEach((pixel) => {
      if (!pixel.isActive) return

      // --- META (FACEBOOK) PIXEL ---
      if (pixel.type === 'facebook' && pixel.pixelId) {
        const pid = pixel.pixelId.trim()
        if (!initializedPixels.has(`fb_${pid}`)) {
          initializedPixels.add(`fb_${pid}`)

          // Ensure base fbq exists
          if (typeof window !== 'undefined') {
            if (!(window as any).fbq) {
              const f: any = window
              const b: any = document
              const e = 'script'
              const v = 'https://connect.facebook.net/en_US/fbevents.js'
              if (!f.fbq) {
                const n: any = function () {
                  n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
                }
                if (!f._fbq) f._fbq = n
                n.push = n
                n.loaded = true
                n.version = '2.0'
                n.queue = []
                const t = b.createElement(e)
                t.async = true
                t.src = v
                const s = b.getElementsByTagName(e)[0]
                s.parentNode.insertBefore(t, s)
                f.fbq = n
              }
            }

            try {
              ;(window as any).fbq('init', pid)
              if (pixel.testEventCode) {
                ;(window as any).fbq('set', 'agent', 'test', pixel.testEventCode.trim())
              }
              // Track initial PageView
              ;(window as any).fbq('track', 'PageView')
            } catch (err) {
              console.warn(`[DynamicPixelInjector] FB Pixel ${pid} init error:`, err)
            }
          }
        }
      }

      // --- GOOGLE ANALYTICS 4 / GOOGLE TAG ---
      if (pixel.type === 'google_analytics' && pixel.pixelId) {
        const gid = pixel.pixelId.trim()
        if (!initializedPixels.has(`ga_${gid}`)) {
          initializedPixels.add(`ga_${gid}`)

          if (typeof window !== 'undefined') {
            const w: any = window
            w.dataLayer = w.dataLayer || []
            function gtag(...args: any[]) {
              w.dataLayer.push(args)
            }
            if (!w.gtag) w.gtag = gtag

            // Inject gtag.js if not already present for this ID
            const existingScript = document.querySelector(`script[src*="${gid}"]`)
            if (!existingScript) {
              const script = document.createElement('script')
              script.async = true
              script.src = `https://www.googletagmanager.com/gtag/js?id=${gid}`
              document.head.appendChild(script)
            }

            try {
              w.gtag('js', new Date())
              w.gtag('config', gid, {
                page_path: window.location.pathname,
                send_page_view: true,
              })
            } catch (err) {
              console.warn(`[DynamicPixelInjector] GA ${gid} init error:`, err)
            }
          }
        }
      }

      // --- TIKTOK PIXEL ---
      if (pixel.type === 'tiktok' && pixel.pixelId) {
        const tid = pixel.pixelId.trim()
        if (!initializedPixels.has(`tt_${tid}`)) {
          initializedPixels.add(`tt_${tid}`)

          if (typeof window !== 'undefined') {
            const w: any = window
            const d = document
            w.TiktokAnalyticsObject = 'ttq'
            const ttq: any = (w.ttq = w.ttq || [])
            ttq.methods = [
              'page',
              'track',
              'identify',
              'instances',
              'debug',
              'on',
              'off',
              'once',
              'ready',
              'alias',
              'group',
              'enableCookie',
              'disableCookie',
            ]
            ttq.setAndDefer = function (t: any, e: any) {
              t[e] = function () {
                t.push([e].concat(Array.prototype.slice.call(arguments, 0)))
              }
            }
            for (let i = 0; i < ttq.methods.length; i++) {
              ttq.setAndDefer(ttq, ttq.methods[i])
            }
            ttq.instance = function (t: any) {
              const e = ttq._i[t] || []
              for (let n = 0; n < ttq.methods.length; n++) {
                ttq.setAndDefer(e, ttq.methods[n])
              }
              return e
            }
            ttq.load = function (e: any, n: any) {
              const i = 'https://analytics.tiktok.com/i18n/pixel/events.js'
              ;(ttq._i = ttq._i || {})[e] = []
              ttq._i[e]._u = i
              ttq._t = ttq._t || {}
              ttq._t[e] = +new Date()
              ttq._o = ttq._o || {}
              ttq._o[e] = n || {}
              const a = document.createElement('script')
              a.type = 'text/javascript'
              a.async = true
              a.src = i + '?sdkid=' + e + '&lib=ttq'
              const o = document.getElementsByTagName('script')[0]
              o.parentNode?.insertBefore(a, o)
            }

            try {
              ttq.load(tid)
              ttq.page()
            } catch (err) {
              console.warn(`[DynamicPixelInjector] TikTok Pixel ${tid} init error:`, err)
            }
          }
        }
      }

      // --- CUSTOM SCRIPT / EVENT CODE ---
      if (pixel.type === 'custom_script' && pixel.scriptCode) {
        const scriptId = `dyn_script_${pixel.id}`
        if (!document.getElementById(scriptId) && matchesRoute(pixel.triggerPage, pathname)) {
          const targetParent = pixel.placement === 'body' ? document.body : document.head
          const container = document.createElement('div')
          container.id = scriptId
          container.style.display = 'none'

          // Extract script tags or evaluate code
          const rawCode = pixel.scriptCode.trim()
          if (rawCode.includes('<script')) {
            // Render HTML containing scripts/noscripts
            container.innerHTML = rawCode
            targetParent.appendChild(container)

            // Re-execute parsed scripts as innerHTML does not run scripts directly
            const scriptElements = container.querySelectorAll('script')
            scriptElements.forEach((oldScript) => {
              const newScript = document.createElement('script')
              Array.from(oldScript.attributes).forEach((attr) => newScript.setAttribute(attr.name, attr.value))
              newScript.appendChild(document.createTextNode(oldScript.innerHTML))
              oldScript.parentNode?.replaceChild(newScript, oldScript)
            })
          } else {
            // Pure JavaScript snippet
            const script = document.createElement('script')
            script.type = 'text/javascript'
            script.text = rawCode
            container.appendChild(script)
            targetParent.appendChild(container)
          }
        }
      }
    })
  }, [pixels, pathname])

  // 3. Track Route Navigation for all active pixels
  useEffect(() => {
    if (!lastPath.current) {
      lastPath.current = pathname
      return
    }

    if (lastPath.current === pathname) return
    lastPath.current = pathname

    // Route changed! Dispatch PageView to all configured pixels
    if (typeof window !== 'undefined') {
      // Meta (Facebook)
      if (typeof (window as any).fbq === 'function') {
        try {
          ;(window as any).fbq('track', 'PageView')
        } catch {}
      }

      // Google Analytics
      if (typeof (window as any).gtag === 'function') {
        pixels
          .filter((p) => p.type === 'google_analytics' && p.isActive && p.pixelId)
          .forEach((p) => {
            try {
              ;(window as any).gtag('config', p.pixelId, {
                page_path: pathname,
              })
            } catch {}
          })
      }

      // TikTok
      if (typeof (window as any).ttq?.page === 'function') {
        try {
          ;(window as any).ttq.page()
        } catch {}
      }
    }
  }, [pathname, pixels])

  return null
}
