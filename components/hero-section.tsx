"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowRight, Zap, ShieldCheck, Download, Sparkles, CheckCircle2, Flame, Star } from "lucide-react"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  // Flash sale countdown timer (2h 45m rolling demo for urgency)
  const [timeLeft, setTimeLeft] = useState({ hours: 2, minutes: 45, seconds: 18 })

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 }
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 }
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 }
        return { hours: 2, minutes: 59, seconds: 59 }
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const pad = (n: number) => n.toString().padStart(2, "0")

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#fffcf8] via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border-b border-orange-100/70 dark:border-slate-850 py-8 md:py-12 px-3 sm:px-4">
      {/* Background ambient decorative glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 dark:bg-purple-600/15 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse" />
      <div className="absolute top-1/3 right-10 w-80 h-80 bg-orange-500/10 dark:bg-orange-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="container mx-auto max-w-6xl">
        {/* Urgency Flash Sale Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 text-white px-4 py-2 rounded-xl sm:rounded-full shadow-md mb-6 max-w-3xl mx-auto">
          <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
            <Flame className="w-4 h-4 text-yellow-300 fill-yellow-300 animate-bounce" />
            <span className="tracking-wide uppercase text-[11px] sm:text-xs bg-yellow-400 text-slate-950 px-2 py-0.5 rounded font-black">
              Flash Deal
            </span>
            <span>Upto 90% OFF on Creator & Marketing Bundles!</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold ml-auto sm:ml-0 bg-black/25 px-2.5 py-1 rounded-md">
            <span className="text-orange-100 text-[11px]">Ends in:</span>
            <span className="font-mono bg-white text-slate-900 px-1.5 py-0.5 rounded text-[11px] font-bold">
              {pad(timeLeft.hours)}
            </span>
            <span>:</span>
            <span className="font-mono bg-white text-slate-900 px-1.5 py-0.5 rounded text-[11px] font-bold">
              {pad(timeLeft.minutes)}
            </span>
            <span>:</span>
            <span className="font-mono bg-white text-slate-900 px-1.5 py-0.5 rounded text-[11px] font-bold">
              {pad(timeLeft.seconds)}
            </span>
          </div>
        </div>

        {/* Hero Grid: Left Content, Right Visual Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column (Text & Value Prop & CTA) */}
          <div className="lg:col-span-7 space-y-4 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-100/80 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 text-orange-700 dark:text-orange-400 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-orange-600 fill-orange-500 animate-spin-slow" />
              <span>India&#39;s #1 Digital Creative &amp; Marketing Marketplace</span>
            </div>

            {/* Main SEO H1 (DigiGrowPro Style Headline) */}
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15]">
              Instant Access to Premium{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600">
                Digital Bundles &amp; Templates
              </span>
            </h1>

            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl mx-auto lg:mx-0">
              High-converting Canva templates, video editing assets (LUTs, SFX, Transitions), 
              ready-to-use marketing tools, courses, and digital blueprints designed to scale your business.
            </p>

            {/* Key Value Bullets */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 text-left max-w-lg mx-auto lg:mx-0 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Instant UPI Delivery</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Lifetime Access</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Verified Downloads</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
              <Button asChild size="lg" className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 hover:from-yellow-500 hover:to-red-600 text-slate-950 font-bold px-7 h-12 text-sm sm:text-base shadow-lg shadow-orange-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]">
                <Link href="/products" className="flex items-center gap-2">
                  <span>Explore Mega Deals</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>

              <Button asChild variant="outline" size="lg" className="border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold h-12 px-6 text-sm">
                <Link href="/categories">
                  Browse Categories
                </Link>
              </Button>
            </div>

            {/* Ratings & Social Proof Badge */}
            <div className="flex items-center justify-center lg:justify-start gap-2 pt-2 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="font-bold text-slate-700 dark:text-slate-200">4.9/5 Rating</span>
              <span>•</span>
              <span>Trusted by 10,000+ Creators &amp; Agencies</span>
            </div>
          </div>

          {/* Right Column: Interactive Animated Showcase Box */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-sm sm:max-w-md lg:max-w-none rounded-2xl bg-gradient-to-tr from-slate-900 to-indigo-950 text-white p-5 sm:p-6 shadow-2xl border border-indigo-500/30 overflow-hidden group">
              {/* Top Accent Ribbon */}
              <div className="absolute top-3 right-3 bg-red-600 text-white text-[10px] sm:text-xs font-black uppercase px-2.5 py-1 rounded-full shadow tracking-wider animate-pulse">
                90% OFF DEAL
              </div>

              {/* Title & Badge */}
              <div className="space-y-1 mb-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                  <Zap className="w-3.5 h-3.5" />
                  <span>ALL-IN-ONE CREATOR MEGA PACK</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Ultimate Creative &amp; Marketing Bundle
                </h3>
                <p className="text-xs text-indigo-200">Everything you need to launch, market &amp; edit content faster</p>
              </div>

              {/* Features List Box */}
              <div className="bg-slate-950/60 rounded-xl p-3 border border-indigo-500/20 space-y-2 text-xs">
                <div className="flex items-center justify-between pb-1 border-b border-white/10">
                  <span className="text-slate-300">📦 Included Bundles:</span>
                  <span className="font-bold text-emerald-400">10+ Premium Packs</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-300 pt-1">
                  <div className="flex items-center gap-1 truncate">
                    <span className="text-orange-400">✓</span> 900+ Canva Ad Templates
                  </div>
                  <div className="flex items-center gap-1 truncate">
                    <span className="text-orange-400">✓</span> Video Editing LUTs &amp; SFX
                  </div>
                  <div className="flex items-center gap-1 truncate">
                    <span className="text-orange-400">✓</span> Reels &amp; Shorts Growth Pack
                  </div>
                  <div className="flex items-center gap-1 truncate">
                    <span className="text-orange-400">✓</span> High-Converting Sales Copy
                  </div>
                </div>
              </div>

              {/* Pricing & Checkout Trigger */}
              <div className="mt-5 flex items-center justify-between gap-3 pt-2 border-t border-white/10">
                <div>
                  <div className="text-[11px] text-slate-400 line-through">₹4,999 Original</div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-3xl font-black text-amber-300">₹199</span>
                    <span className="text-[11px] text-emerald-400 font-bold">One-Time Pay</span>
                  </div>
                </div>

                <Button asChild className="bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-bold px-5 h-10 text-xs shadow-md">
                  <Link href="/products">
                    Grab Deal →
                  </Link>
                </Button>
              </div>

              {/* Trust footer indicators */}
              <div className="mt-4 flex items-center justify-around text-[10px] text-indigo-200 border-t border-white/5 pt-3">
                <span className="flex items-center gap-1"><Download className="w-3 h-3 text-amber-300" /> Instant Access</span>
                <span>•</span>
                <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-400" /> 100% Safe</span>
                <span>•</span>
                <span>UPI / QR Accepted</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
