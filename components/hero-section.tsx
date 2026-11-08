"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowRight, Flame } from "lucide-react"
import { Button } from "@/components/ui/button"

interface HeroSectionProps {
  customBanner?: {
    title?: string
    subtitle?: string
    imageUrl?: string
    linkUrl?: string
    buttonText?: string
  } | null
}

export function HeroSection({ customBanner }: HeroSectionProps) {
  // Flash sale countdown timer (2h 45m rolling demo for urgency)
  const [timeLeft, setTimeLeft] = useState({ hours: 2, minutes: 45, seconds: 18 })

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 }
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 }
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 }
        return { hours: 2, minutes: 59, seconds: 59 }
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const pad = (n: number) => n.toString().padStart(2, "0")

  // Dynamic values: can be overridden via Admin Banners or fallback to top bundle
  const heroTitle = customBanner?.title || "MEGA CREATOR BUNDLE 2026"
  const heroSubtitle =
    customBanner?.subtitle ||
    "BUY 1, GET 15+ PRO PACKS FREE! Get 900+ Canva Ad Templates, Premiere Pro & After Effects VFX, Cinematic LUTs, Sound FX Presets, Reels Growth Kit & Extra Marketing Tools."
  const heroLink = customBanner?.linkUrl || "/products"
  const heroButton = customBanner?.buttonText || "Grab the Deal →"
  const heroImg = customBanner?.imageUrl || "/images/hero-3d-bundle.png"

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#fdfaf6] via-[#faf6f0] to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border-b border-orange-150/70 dark:border-slate-800 py-4 sm:py-6 px-3 sm:px-6">
      <div className="container mx-auto max-w-6xl">
        
        {/* Flash Sale Urgency Strip - 100% Single Row (Never breaks or wraps) */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl shadow-md mb-4 max-w-4xl mx-auto flex items-center justify-between gap-2">
          {/* Left: Tag + Headline */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-300 fill-yellow-300 shrink-0" />
            <span className="bg-yellow-400 text-slate-950 text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
              FLASH SALE
            </span>
            <span className="text-[11px] sm:text-xs font-black truncate">
              90% OFF <span className="hidden sm:inline font-bold">— Limited Time Offer!</span>
            </span>
          </div>

          {/* Right: Countdown Timer (Always in 1 solid block, never wraps) */}
          <div className="flex items-center gap-1 bg-black/30 backdrop-blur-xs px-2 py-0.5 rounded-lg shrink-0 text-[11px] font-mono font-bold">
            <span className="text-orange-200 text-[10px] hidden xs:inline font-sans mr-0.5 font-medium">Ends:</span>
            <span className="bg-white text-slate-900 px-1.5 py-0.2 rounded text-[10px] sm:text-[11px] font-bold">
              {pad(timeLeft.hours)}
            </span>
            <span className="text-white/80">:</span>
            <span className="bg-white text-slate-900 px-1.5 py-0.2 rounded text-[10px] sm:text-[11px] font-bold">
              {pad(timeLeft.minutes)}
            </span>
            <span className="text-white/80">:</span>
            <span className="bg-white text-slate-900 px-1.5 py-0.2 rounded text-[10px] sm:text-[11px] font-bold">
              {pad(timeLeft.seconds)}
            </span>
          </div>
        </div>

        {/* 2-Column Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-center">
          
          {/* Left Column (Headline, Hook, Badges, CTA) */}
          <div className="md:col-span-7 space-y-3.5 text-left">
            
            {/* Tag Badge */}
            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-violet-700 dark:text-violet-300 bg-violet-100/80 dark:bg-violet-950/60 px-3 py-1 rounded-full border border-violet-200 dark:border-violet-800 shadow-xs">
              <span>⚡ All-In-One Power Bundle</span>
            </div>

            {/* Primary SEO H1 Heading */}
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-950 dark:text-white leading-[1.15] tracking-tight">
              {heroTitle}
            </h1>

            {/* Sub-Headline Hook */}
            <div className="text-base sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 tracking-tight">
              BUY 1, GET 15+ PRO PACKS FREE!
            </div>

            {/* Detailed Description */}
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal max-w-xl">
              {heroSubtitle}
            </p>

            {/* Trust Badges - Modern Pill Row */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-semibold text-[11px]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Instant Drive Access
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-semibold text-[11px]">
                💻 Windows &amp; Mac Supported
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-semibold text-[11px]">
                🔒 Lifetime Validity
              </span>
            </div>

            {/* Action CTA & Customer Social Proof */}
            <div className="pt-3 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-black px-8 h-12 text-sm rounded-xl shadow-xl shadow-violet-500/25 active:scale-95 transition-all"
              >
                <Link href={heroLink} className="flex items-center gap-2">
                  <span>{heroButton}</span>
                  <ArrowRight className="w-4.5 h-4.5" />
                </Link>
              </Button>

              {/* Creator Avatars Stack */}
              <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex -space-x-2 overflow-hidden">
                  <span className="h-7 w-7 rounded-full ring-2 ring-white dark:ring-slate-900 bg-purple-500 text-white font-bold text-[10px] flex items-center justify-center shadow-xs">R</span>
                  <span className="h-7 w-7 rounded-full ring-2 ring-white dark:ring-slate-900 bg-blue-500 text-white font-bold text-[10px] flex items-center justify-center shadow-xs">A</span>
                  <span className="h-7 w-7 rounded-full ring-2 ring-white dark:ring-slate-900 bg-emerald-500 text-white font-bold text-[10px] flex items-center justify-center shadow-xs">V</span>
                  <span className="h-7 w-7 rounded-full ring-2 ring-white dark:ring-slate-900 bg-amber-500 text-slate-950 font-black text-[9px] flex items-center justify-center shadow-xs">24k+</span>
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-bold text-[11px] text-slate-900 dark:text-white">⭐⭐⭐⭐⭐ 4.9/5 Rating</span>
                  <span className="text-[10px] text-slate-400">Trusted by Indian Creators</span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: 3D Floating Mockup with Ambient Glow Backdrop */}
          <div className="md:col-span-5 flex justify-center items-center relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-violet-500/25 via-pink-500/20 to-amber-500/25 blur-3xl rounded-full scale-90 pointer-events-none" />
            <Link
              href={heroLink}
              className="block relative group max-w-[340px] sm:max-w-[420px] w-full"
            >
              <div className="relative transition-transform duration-500 group-hover:scale-[1.03]">
                <img
                  src={heroImg}
                  alt={heroTitle}
                  width={650}
                  height={650}
                  fetchPriority="high"
                  loading="eager"
                  decoding="async"
                  className="w-full h-auto object-contain block drop-shadow-2xl animate-hero-float"
                />
              </div>
            </Link>
          </div>

        </div>
      </div>
    </section>
  )
}
