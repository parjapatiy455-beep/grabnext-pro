"use client"

import { useState, useEffect } from "react"
import {
  Zap, Clock, X, CheckCircle2, ShieldCheck, ArrowRight,
  Sparkles, Tag, Gift, Flame, Percent, Check, IndianRupee
} from "lucide-react"
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
    `🎉 Secret Flash Deal: Flat ${percent}% OFF!`

  const originalPrice = product.price
  const discountedPrice = Math.max(1, Math.round(originalPrice * (1 - percent / 100)))
  const savings = originalPrice - discountedPrice

  // Fresh countdown timer on every page load/refresh
  const [timeLeft, setTimeLeft] = useState<number>(timerMinutes * 60)
  const [isClaiming, setIsClaiming] = useState(false)

  useEffect(() => {
    // Reset timer freshly on page refresh or product mount
    const totalSeconds = timerMinutes * 60
    setTimeLeft(totalSeconds)
    const endTime = Date.now() + totalSeconds * 1000

    const updateTimer = () => {
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000))
      setTimeLeft(remaining)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [product?.id, timerMinutes])

  if (!isOpen) return null

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

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
    }, 200)
  }

  // AUTO-APPLY OFFER EVEN IF USER CLOSES THE POPUP (As requested by user)
  const handleCloseAndApply = () => {
    onClaim({
      code: couponCode,
      percent,
      discountedPrice,
      savings,
    })
    onClose()
  }

  const formatPrice = (val: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={handleCloseAndApply}
    >
      <div
        className="relative w-full max-w-md sm:max-w-lg md:max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-amber-500 overflow-hidden transform animate-in zoom-in-95 duration-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated Top Header Shimmer Bar */}
        <div className="h-2 bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 animate-pulse" />

        {/* Close Button - Automatically Applies Offer Too */}
        <button
          onClick={handleCloseAndApply}
          className="absolute top-3.5 right-3.5 z-20 h-8 w-8 bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 rounded-full flex items-center justify-center transition-colors cursor-pointer"
          title="Close (Offer will still be auto-applied)"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-4 sm:p-5 md:p-6 space-y-3 sm:space-y-3.5">
          {/* Header Section: Compact 3D Gift Box + Badges */}
          <div className="flex items-center gap-3 pr-8">
            <div className="relative shrink-0">
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 flex items-center justify-center text-2xl shadow-md shadow-orange-500/30">
                🎁
              </div>
              <span className="absolute -top-1 -right-1.5 bg-red-600 text-white text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full shadow-xs flex items-center gap-0.5">
                <Flame className="w-2.5 h-2.5 fill-white" /> HOT
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 mb-0.5">
                <Sparkles className="h-3 w-3 fill-current text-amber-500" />
                <span>DHAMAKA OFFER • FLAT {percent}% CHHOOT</span>
              </div>
              <h2 className="text-base sm:text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-tight line-clamp-1">
                {headline}
              </h2>
              <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 inline shrink-0" />
                <span>Special secret discount has been unlocked for you!</span>
              </p>
            </div>
          </div>

          {/* Responsive 2-Column Grid on Desktop / Clean Stack on Mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            {/* 1. VISUAL PRICE SLASH CARD */}
            <div className="bg-gradient-to-br from-amber-50/90 to-orange-50/70 dark:from-slate-800/90 dark:to-slate-800/50 border border-amber-300/80 dark:border-amber-700/60 rounded-2xl p-3 text-center flex flex-col justify-center">
              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                Special Discounted Price
              </div>

              <div className="flex items-center justify-center gap-2.5">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Asli Keemat</span>
                  <span className="text-sm sm:text-base text-red-500 line-through font-extrabold decoration-red-600 decoration-2">
                    {formatPrice(originalPrice)}
                  </span>
                </div>

                <span className="text-amber-700 dark:text-amber-400 font-black text-sm">➔</span>

                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-black uppercase">
                    Offer Price
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-900 px-2.5 py-0.5 rounded-xl border border-emerald-400 shadow-xs font-mono">
                    {formatPrice(discountedPrice)}
                  </span>
                </div>
              </div>

              <div className="mt-1.5 inline-block text-[10px] sm:text-[11px] font-extrabold text-emerald-800 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full">
                💰 AAPKI BACHAT: {formatPrice(savings)} ({percent}% OFF)
              </div>
            </div>

            {/* 2. URGENT COUNTDOWN TIMER CARD */}
            <div className="bg-red-500/10 dark:bg-red-950/40 border border-red-500/30 rounded-2xl p-3 text-center flex flex-col justify-center">
              <div className="flex items-center justify-center gap-1 text-[10px] sm:text-xs font-black text-red-600 dark:text-red-400 uppercase tracking-wider mb-1">
                <Clock className="h-3 w-3 animate-spin duration-1000" />
                <span>OFFER EXPIRES IN:</span>
              </div>

              <div className="flex items-center justify-center gap-2">
                <div className="bg-slate-900 text-amber-400 px-3 py-1 rounded-lg font-mono text-xl sm:text-2xl font-black shadow-inner">
                  {String(minutes).padStart(2, "0")}
                  <span className="text-[8px] block text-slate-400 font-sans -mt-1 font-bold">MIN</span>
                </div>
                <span className="text-xl font-black text-red-500 animate-pulse">:</span>
                <div className="bg-slate-900 text-amber-400 px-3 py-1 rounded-lg font-mono text-xl sm:text-2xl font-black shadow-inner">
                  {String(seconds).padStart(2, "0")}
                  <span className="text-[8px] block text-slate-400 font-sans -mt-1 font-bold">SEC</span>
                </div>
              </div>

              <span className="text-[10px] text-red-600 dark:text-red-400 font-bold mt-1">
                ⏱️ Limited time flash offer
              </span>
            </div>
          </div>

          {/* Graphical Trust Pills */}
          <div className="grid grid-cols-2 gap-2 text-left">
            <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-200/80 dark:border-slate-700 flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 flex items-center justify-center shrink-0">
                <Zap className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-black text-slate-800 dark:text-slate-200 leading-none">Instant Access</p>
                <p className="text-[9px] text-slate-500">Turant WhatsApp & Email</p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-200/80 dark:border-slate-700 flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-blue-100 dark:bg-blue-950/70 text-blue-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-black text-slate-800 dark:text-slate-200 leading-none">100% Safe UPI</p>
                <p className="text-[9px] text-slate-500">GPay, PhonePe, Paytm</p>
              </div>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="pt-0.5 space-y-1.5">
            <button
              onClick={handleClaim}
              disabled={isClaiming}
              className="w-full flex flex-col items-center justify-center py-3 sm:py-3.5 px-4 rounded-2xl font-black text-white text-sm sm:text-base bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-xl shadow-emerald-600/30 active:scale-[0.98] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 sm:h-5 sm:w-5 fill-current animate-bounce shrink-0" />
                <span className="tracking-wide">
                  {isClaiming
                    ? "Offer Apply Ho Raha Hai..."
                    : `⚡ ABHI OFFER LEIN • PAY ONLY ${formatPrice(discountedPrice)}`}
                </span>
                <ArrowRight className="h-4 w-4 shrink-0" />
              </div>
              <span className="text-[10px] font-medium text-emerald-100 mt-0.5">
                👉 Click karein aur {percent}% Discount paayein (Coupon {couponCode} auto-apply)
              </span>
            </button>

            {/* Close Button / Subtitle (Always applies offer too) */}
            <button
              type="button"
              onClick={handleCloseAndApply}
              className="w-full text-center text-[10px] sm:text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 py-0.5 transition-colors cursor-pointer"
            >
              Dismiss (Offer will still be applied to your page)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
