"use client"

import { useState, useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { Zap, X, ShieldCheck } from "lucide-react"

interface PurchaseAlert {
  name: string
  city: string
  item: string
  timeAgo: string
  avatar: string
}

const RECENT_PURCHASES: PurchaseAlert[] = [
  {
    name: "Rahul S.",
    city: "Mumbai",
    item: "Mega Creator Video Editing Bundle",
    timeAgo: "2 mins ago",
    avatar: "R"
  },
  {
    name: "Pooja V.",
    city: "Delhi NCR",
    item: "900+ Canva Social Media Ad Templates",
    timeAgo: "5 mins ago",
    avatar: "P"
  },
  {
    name: "Vikram K.",
    city: "Bengaluru",
    item: "Premiere Pro & After Effects VFX Pack",
    timeAgo: "9 mins ago",
    avatar: "V"
  },
  {
    name: "Ananya M.",
    city: "Pune",
    item: "Viral Reels Growth & Hook Templates",
    timeAgo: "14 mins ago",
    avatar: "A"
  },
  {
    name: "Siddharth T.",
    city: "Hyderabad",
    item: "Cinematic LUTs & Sound FX Presets",
    timeAgo: "19 mins ago",
    avatar: "S"
  },
  {
    name: "Neha G.",
    city: "Jaipur",
    item: "Digital Marketing Masterclass Pack",
    timeAgo: "24 mins ago",
    avatar: "N"
  }
]

export function SocialProofToast() {
  const pathname = usePathname()
  const [currentIdx, setCurrentIdx] = useState(0)
  const [visible, setVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const isHoveredRef = useRef(false)

  // Do not show on checkout, software landing funnels, or admin panel
  const isHiddenRoute =
    !pathname ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/software")

  useEffect(() => {
    if (isHiddenRoute || isDismissed) return

    // First show after 4 seconds of landing
    const initialTimer = setTimeout(() => {
      setVisible(true)
    }, 4000)

    // Repeat cycle every 22 seconds
    const interval = setInterval(() => {
      if (isHoveredRef.current) return // pause if user is hovering
      setVisible(false)

      setTimeout(() => {
        setCurrentIdx((prev) => (prev + 1) % RECENT_PURCHASES.length)
        setVisible(true)
      }, 1000)
    }, 22000)

    return () => {
      clearTimeout(initialTimer)
      clearInterval(interval)
    }
  }, [isHiddenRoute, isDismissed])

  // Hide the toast after 6 seconds of being visible
  useEffect(() => {
    if (!visible) return
    const autoHide = setTimeout(() => {
      if (!isHoveredRef.current) {
        setVisible(false)
      }
    }, 6000)
    return () => clearTimeout(autoHide)
  }, [visible, currentIdx])

  if (isHiddenRoute || isDismissed || !visible) {
    return null
  }

  const alert = RECENT_PURCHASES[currentIdx]

  return (
    <div
      role="status"
      aria-live="polite"
      onMouseEnter={() => { isHoveredRef.current = true }}
      onMouseLeave={() => { isHoveredRef.current = false }}
      className="fixed bottom-20 md:bottom-6 left-3 sm:left-6 z-30 max-w-[320px] sm:max-w-xs animate-in slide-in-from-bottom-5 fade-in duration-300"
    >
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3 shadow-2xl shadow-slate-900/10 dark:shadow-violet-950/20 flex items-start gap-3 relative">
        
        {/* Buyer Avatar Pill */}
        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-violet-600 to-purple-500 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md">
          {alert.avatar}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="font-bold text-slate-900 dark:text-white truncate">
              {alert.name}
            </span>
            <span className="text-[10px] text-slate-400">• {alert.city}</span>
          </div>

          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5 leading-snug">
            Purchased <span className="text-violet-600 dark:text-violet-400">{alert.item}</span>
          </p>

          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
              <ShieldCheck className="h-3 w-3 stroke-[2.5]" /> Verified Buyer
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              {alert.timeAgo}
            </span>
          </div>
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="absolute top-2.5 right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="h-3.5 w-3.5" />
        </button>

      </div>
    </div>
  )
}
