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
  const heroImg = customBanner?.imageUrl || "/images/featured-bundle.jpg"

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#fdfaf6] via-[#faf6f0] to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border-b border-orange-150/70 dark:border-slate-800 py-4 sm:py-6 px-3 sm:px-6">
      <div className="container mx-auto max-w-6xl">
        
        {/* Compact Urgency Flash Sale Bar (DigiGrowPro Top Bar) */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-[#d93829] dark:bg-red-700 text-white px-3.5 py-1.5 rounded-lg shadow-sm mb-4 max-w-4xl mx-auto">
          <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
            <Flame className="w-4 h-4 text-yellow-300 fill-yellow-300 animate-bounce" />
            <span className="tracking-wide uppercase text-[10px] sm:text-xs bg-yellow-400 text-slate-950 px-1.5 py-0.2 rounded font-black">
              FLASH SALE
            </span>
            <span>90% OFF — Limited Time Offer!</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold ml-auto sm:ml-0 bg-black/20 px-2 py-0.5 rounded">
            <span className="text-orange-100 text-[11px]">Ends in:</span>
            <span className="font-mono bg-white text-slate-900 px-1.5 py-0.2 rounded text-[11px] font-bold">
              {pad(timeLeft.hours)}
            </span>
            <span>:</span>
            <span className="font-mono bg-white text-slate-900 px-1.5 py-0.2 rounded text-[11px] font-bold">
              {pad(timeLeft.minutes)}
            </span>
            <span>:</span>
            <span className="font-mono bg-white text-slate-900 px-1.5 py-0.2 rounded text-[11px] font-bold">
              {pad(timeLeft.seconds)}
            </span>
          </div>
        </div>

        {/* 2-Column Compact Grid: Left Text, Right Direct 3D Showcase Image */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-8 items-center">
          
          {/* Left Column (Headline, Bonus Hook, CTA) */}
          <div className="md:col-span-7 space-y-3 animate-fade-in-left text-left">
            
            {/* Title 1: Bundle Brand Name */}
            <div className="inline-block text-xs font-bold tracking-wider uppercase text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 px-2.5 py-1 rounded border border-purple-200 dark:border-purple-800">
              ⚡ All-In-One Power Bundle
            </div>

            {/* Primary SEO H1 Heading */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
              {heroTitle}
            </h1>

            {/* Sub-Headline Hook (DigiGrowPro Style Flash Offer) */}
            <div className="text-lg sm:text-xl font-black text-red-600 dark:text-red-400 tracking-tight">
              BUY 1, GET 15 MORE FREE!
            </div>

            {/* Detailed Description */}
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              {heroSubtitle}
            </p>

            {/* Trust Bullet Highlights */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-slate-700 dark:text-slate-300 pt-1">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                ✓ Pre-Activated / Instant Download
              </span>
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                ✓ Lifetime Validity
              </span>
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                ✓ Windows &amp; Mac Supported
              </span>
            </div>

            {/* Action CTA Button */}
            <div className="pt-2 flex items-center gap-3">
              <Button
                asChild
                size="lg"
                className="bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-bold px-7 h-11 text-sm shadow-md transition-all hover:scale-105 active:scale-95"
              >
                <Link href={heroLink} className="flex items-center gap-2">
                  <span>{heroButton}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
                Don&#39;t miss out—limited time offer!
              </span>
            </div>
          </div>

          {/* Right Column: Fast Loading Image without any artificial background (DigiGrowPro style) */}
          <div className="md:col-span-5 flex justify-center items-center py-2 sm:py-0">
            <Link
              href={heroLink}
              className="block relative group w-full max-w-[280px] sm:max-w-[340px] md:max-w-[420px] animate-bounce-in-right"
            >
              <div className="relative transition-transform duration-500 group-hover:scale-[1.03] flex items-center justify-center">
                <img
                  src={heroImg}
                  alt={heroTitle}
                  width={650}
                  height={650}
                  fetchPriority="high"
                  loading="eager"
                  decoding="async"
                  className="w-full h-auto max-h-[340px] sm:max-h-[420px] object-contain block drop-shadow-xl animate-hero-float"
                />
              </div>
            </Link>
          </div>

        </div>
      </div>
    </section>
  )
}
