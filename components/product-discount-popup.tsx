"use client"

import { useState, useEffect } from "react"
import { Zap, Clock, X, CheckCircle2, ShieldCheck, ArrowRight, Sparkles, Tag } from "lucide-react"
import { Product } from "@/lib/types"

interface ProductDiscountPopupProps {
  product: Product
  isOpen: boolean
  onClose: () => void
  onClaim: (info: {
    code: string
    percent: number
    discountedPrice: number
    savings: number
  }) => void
}

export function ProductDiscountPopup({
  product,
  isOpen,
  onClose,
  onClaim,
}: ProductDiscountPopupProps) {
  const percent = Number(product.discountPopupPercent || 50)
  const couponCode = (product.discountPopupCoupon || "SAVE50").trim().toUpperCase()
  const timerMinutes = Number(product.discountPopupTimerMinutes || 10)
  const headline =
    product.discountPopupHeadline ||
    `🎉 Secret Offer Unlocked: Flat ${percent}% OFF!`

  const originalPrice = product.price
  const discountedPrice = Math.max(1, Math.round(originalPrice * (1 - percent / 100)))
  const savings = originalPrice - discountedPrice

  const [timeLeft, setTimeLeft] = useState<number>(timerMinutes * 60)
  const [isClaiming, setIsClaiming] = useState(false)

  // Initialize or resume 10-minute countdown timer from localStorage
  useEffect(() => {
    if (!product?.id) return

    const storageKey = `discount_timer_end_${product.id}`
    let endTime: number

    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        endTime = parseInt(stored, 10)
      } else {
        endTime = Date.now() + timerMinutes * 60 * 1000
        localStorage.setItem(storageKey, endTime.toString())
      }
    } catch {
      endTime = Date.now() + timerMinutes * 60 * 1000
    }

    const updateTimer = () => {
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000))
      setTimeLeft(remaining)
      if (remaining <= 0) {
        try {
          localStorage.removeItem(storageKey)
        } catch {}
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [product?.id, timerMinutes])

  if (!isOpen) return null

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`

  const handleClaim = () => {
    setIsClaiming(true)
    setTimeout(() => {
      onClaim({
        code: couponCode,
        percent,
        discountedPrice,
        savings,
      })
      setIsClaiming(false)
    }, 250)
  }

  const formatPrice = (val: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-amber-200/80 dark:border-amber-900/40 overflow-hidden transform animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated Gradient Accent Bar */}
        <div className="h-2 bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500 animate-pulse" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 h-8 w-8 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-full flex items-center justify-center transition-colors"
          title="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-5 sm:p-6 space-y-4">
          {/* Top Pill: Special Deal Tag */}
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
              <Sparkles className="h-3.5 w-3.5 fill-current" /> Limited Time Flash Offer
            </span>
            <span className="text-[11px] font-extrabold text-red-600 dark:text-red-400 uppercase tracking-wider bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
              Live Deal
            </span>
          </div>

          {/* Headline */}
          <div className="text-center pt-0.5">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
              {headline}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Grab this special discount before the timer runs out!
            </p>
          </div>

          {/* HIGH VISIBILITY URGENCY COUNTDOWN DISPLAY */}
          <div className="bg-gradient-to-b from-red-500/10 via-amber-500/10 to-red-500/5 dark:from-red-950/40 dark:via-amber-950/30 dark:to-red-950/20 border-2 border-red-500/30 rounded-2xl p-3 sm:p-4 text-center shadow-xs">
            <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm font-extrabold text-red-600 dark:text-red-400 uppercase tracking-wider mb-2">
              <Clock className="h-4 w-4 animate-pulse stroke-[2.5]" />
              <span>Offer Strictly Expires In:</span>
            </div>

            {/* Large Bold Responsive Digits */}
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              {/* Minutes Card */}
              <div className="flex flex-col items-center">
                <div className="w-16 sm:w-20 h-13 sm:h-15 bg-slate-900 dark:bg-black text-amber-400 rounded-xl border border-amber-500/40 flex items-center justify-center shadow-inner">
                  <span className="font-mono text-2xl sm:text-3xl font-black tracking-tight">
                    {String(minutes).padStart(2, "0")}
                  </span>
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">
                  MINUTES
                </span>
              </div>

              {/* Blinking Colon */}
              <span className="text-2xl sm:text-3xl font-black text-red-500 -mt-4 animate-pulse">
                :
              </span>

              {/* Seconds Card */}
              <div className="flex flex-col items-center">
                <div className="w-16 sm:w-20 h-13 sm:h-15 bg-slate-900 dark:bg-black text-amber-400 rounded-xl border border-amber-500/40 flex items-center justify-center shadow-inner">
                  <span className="font-mono text-2xl sm:text-3xl font-black tracking-tight">
                    {String(seconds).padStart(2, "0")}
                  </span>
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">
                  SECONDS
                </span>
              </div>
            </div>
          </div>

          {/* Product Mini Preview & Price Cut Card */}
          <div className="bg-gradient-to-br from-slate-50 to-amber-50/40 dark:from-slate-800/80 dark:to-slate-800/40 border border-amber-200/60 dark:border-amber-900/40 rounded-2xl p-3.5 flex items-center gap-3">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.title}
                className="h-16 w-16 rounded-xl object-contain bg-white dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-700 shrink-0 shadow-sm"
              />
            ) : null}

            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                {product.title}
              </p>

              {/* Price Cut Display */}
              <div className="flex items-baseline gap-2 mt-1 flex-wrap">
                <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {formatPrice(discountedPrice)}
                </span>
                <span className="text-xs text-slate-400 line-through">
                  {formatPrice(originalPrice)}
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.5 rounded-md">
                  SAVE {formatPrice(savings)} ({percent}% OFF)
                </span>
              </div>
            </div>
          </div>

          {/* Value Bullet Points */}
          <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 px-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Instant Download link delivered immediately to Email & WhatsApp</span>
            </div>
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-amber-500 shrink-0" />
              <span>
                Coupon Code <strong className="font-mono text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-1.5 py-0.5 rounded border border-amber-200">{couponCode}</strong> applied automatically
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-500 shrink-0" />
              <span>100% Genuine, Virus-Free & Verified Digital Files</span>
            </div>
          </div>

          {/* Primary CTA Button */}
          <div className="pt-2 space-y-2">
            <button
              onClick={handleClaim}
              disabled={isClaiming || timeLeft <= 0}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-extrabold text-white text-base bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <Zap className="h-5 w-5 fill-current shrink-0 animate-bounce" />
              <span>
                {isClaiming
                  ? "Applying Discount..."
                  : `Claim ${percent}% OFF • Pay ${formatPrice(discountedPrice)}`}
              </span>
              <ArrowRight className="h-4 w-4 shrink-0" />
            </button>

            {/* Negative Framing Rejection Link */}
            <button
              type="button"
              onClick={onClose}
              className="w-full text-center text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 py-1 transition-colors"
            >
              No thanks, I will pay full price {formatPrice(originalPrice)}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
