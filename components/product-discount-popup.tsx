"use client"

import { useState, useEffect } from "react"
import { Zap, Clock, X, ArrowRight, Tag } from "lucide-react"
import { Product } from "@/lib/types"

interface ProductDiscountPopupProps {
  product: Product
  isOpen: boolean
  onClose: () => void
  onClaim: (info: {
    code: string
    type?: "percentage" | "fixed"
    value?: number
    percent?: number
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
  const isFixed = product.discountPopupType === "fixed"
  const originalPrice = product.price
  const timerMinutes = Number(product.discountPopupTimerMinutes || 10)

  let savings = 0
  let discountedPrice = originalPrice
  let tagText = ""
  let savingsText = ""
  let defaultHeadline = ""
  let defaultCoupon = "SAVE50"
  let percentValue = 50

  if (isFixed) {
    const fixedAmount = Math.round(Number(product.discountPopupAmount || 0))
    savings = Math.min(originalPrice, fixedAmount)
    discountedPrice = Math.max(1, originalPrice - savings)
    percentValue = originalPrice > 0 ? Math.round((savings / originalPrice) * 100) : 0
    tagText = `Limited Time Deal • Flat ₹${savings} OFF`
    savingsText = `Save ₹${savings} Flat`
    defaultHeadline = `Special Offer: Flat ₹${savings} OFF`
    defaultCoupon = "FLAT" + savings
  } else {
    percentValue = Number(product.discountPopupPercent || 50)
    savings = Math.round(originalPrice * (percentValue / 100))
    discountedPrice = Math.max(1, originalPrice - savings)
    tagText = `Limited Time Deal • Flat ${percentValue}% OFF`
    savingsText = `Save ₹${savings} (${percentValue}% OFF)`
    defaultHeadline = `Special Offer: Flat ${percentValue}% OFF`
    defaultCoupon = "SAVE" + percentValue
  }

  const couponCode = (product.discountPopupCoupon || defaultCoupon).trim().toUpperCase()
  const headline = product.discountPopupHeadline || defaultHeadline

  // Fresh countdown timer on every page load/refresh
  const [timeLeft, setTimeLeft] = useState<number>(timerMinutes * 60)
  const [isClaiming, setIsClaiming] = useState(false)

  useEffect(() => {
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
        type: isFixed ? "fixed" : "percentage",
        value: isFixed ? Number(product.discountPopupAmount || 0) : percentValue,
        percent: percentValue,
        discountedPrice,
        savings,
      })
      setIsClaiming(false)
    }, 150)
  }

  // Close modal without silently auto-applying coupon across the session
  const handleCloseOnly = () => {
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={handleCloseOnly}
    >
      <div
        className="relative w-full max-w-md sm:max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform animate-in zoom-in-95 duration-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle top brand accent line */}
        <div className="h-1.5 bg-emerald-600" />

        {/* Close Button */}
        <button
          onClick={handleCloseOnly}
          className="absolute top-3.5 right-3.5 z-20 h-8 w-8 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-5 sm:p-6 space-y-4">
          {/* Header: Clean Tag & Clear English Headline */}
          <div className="space-y-1.5 pr-8">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <Tag className="h-3 w-3" />
              <span>{tagText}</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
              {headline}
            </h2>
          </div>

          {/* Clean 2-Column Deal Box (Pricing + Urgency Timer) */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            {/* Column 1: Pricing */}
            <div className="flex flex-col justify-center sm:border-r sm:border-slate-200 dark:sm:border-slate-700/80 sm:pr-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Regular Price:</span>
                <span className="text-sm font-semibold text-slate-400 line-through">
                  {formatPrice(originalPrice)}
                </span>
              </div>

              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
                  {formatPrice(discountedPrice)}
                </span>
              </div>

              <div className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-md w-fit">
                <span>{savingsText}</span>
              </div>
            </div>

            {/* Column 2: Urgency Timer */}
            <div className="flex flex-col items-center sm:items-start justify-center">
              <div className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span>Offer Expires In</span>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="bg-slate-900 text-white dark:bg-black px-3 py-1 rounded-xl font-mono text-xl sm:text-2xl font-bold min-w-[52px] text-center shadow-xs">
                  {String(minutes).padStart(2, "0")}
                  <span className="block text-[8px] text-slate-400 font-sans tracking-wider -mt-1 font-semibold">MIN</span>
                </div>
                <span className="text-xl font-bold text-slate-400">:</span>
                <div className="bg-slate-900 text-white dark:bg-black px-3 py-1 rounded-xl font-mono text-xl sm:text-2xl font-bold min-w-[52px] text-center shadow-xs">
                  {String(seconds).padStart(2, "0")}
                  <span className="block text-[8px] text-slate-400 font-sans tracking-wider -mt-1 font-semibold">SEC</span>
                </div>
              </div>

              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                Guaranteed price before time runs out
              </span>
            </div>
          </div>

          {/* Primary CTA Button */}
          <div className="pt-1">
            <button
              onClick={handleClaim}
              disabled={isClaiming}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl font-bold text-white text-base bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] shadow-lg shadow-emerald-600/25 transition-all cursor-pointer disabled:opacity-75"
            >
              <Zap className="h-4 w-4 fill-white shrink-0" />
              <span>
                {isClaiming
                  ? "Applying Discount..."
                  : `Claim Discount • Pay Only ${formatPrice(discountedPrice)}`}
              </span>
              <ArrowRight className="h-4 w-4 shrink-0" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
