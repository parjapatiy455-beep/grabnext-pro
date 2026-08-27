"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { HeroCanvas } from "@/components/3d/hero-canvas"
import { TiltCard } from "@/components/3d/tilt-card"
import {
  Sparkles,
  Zap,
  ShieldCheck,
  ArrowRight,
  Download,
  Star,
  CheckCircle2,
  Code2,
  Layers,
  Bot,
} from "lucide-react"

export function HeroPro() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pt-8 pb-16 border-b border-slate-200/60 dark:border-slate-800">
      {/* Background Decorative Gradients & Mesh */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] overflow-hidden opacity-70">
        <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-indigo-400/20 via-purple-300/30 to-sky-300/20 blur-[120px] rounded-full" />
        <div className="absolute top-20 right-1/4 w-[400px] h-[400px] bg-gradient-to-br from-cyan-300/20 via-blue-400/20 to-indigo-300/20 blur-[100px] rounded-full" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Top Announcement Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold shadow-sm backdrop-blur-md transition-all hover:scale-105">
            <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
            <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>GrabNext 3.0 — India's Premier Digital Marketplace</span>
            <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              NEW
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Text Content */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12]">
                Instant Premium{" "}
                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-500 bg-clip-text text-transparent drop-shadow-sm">
                  Digital Products
                </span>{" "}
                & Source Code.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto lg:mx-0 font-medium leading-relaxed">
                GrabNext delivers instant access to production-ready Software, Next.js Templates, UI Kits, AI Prompts, and Masterclasses. Zero waiting time, 100% verified quality, and lifetime updates.
              </p>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-1">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                <Zap className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Instant Download</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span>100% Verified Malware-Free</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-semibold">
                <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                <span>4.9/5 Rating (5K+ Reviews)</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white font-bold px-8 py-6 rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] transition-all"
              >
                <Link href="/products" className="flex items-center gap-2">
                  <span>Explore All Products</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border-2 border-slate-300 dark:border-slate-700 hover:border-indigo-500 text-slate-800 dark:text-slate-200 font-semibold px-6 py-6 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                <a href="#what-is-grabnext" className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span>What is GrabNext?</span>
                </a>
              </Button>
            </div>

            {/* Mini Trust Stats */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200/80 dark:border-slate-800 max-w-lg mx-auto lg:mx-0">
              <div>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white">50,000+</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Happy Creators</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white">1,200+</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Digital Products</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white">99.9%</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Instant Delivery</p>
              </div>
            </div>
          </div>

          {/* Right 3D Interactive Canvas & Floating Cards */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            {/* 3D Canvas */}
            <div className="w-full h-[400px] sm:h-[480px] relative rounded-3xl bg-gradient-to-tr from-indigo-500/10 via-sky-500/5 to-purple-500/10 border border-slate-200/80 dark:border-slate-800 backdrop-blur-xl shadow-2xl shadow-indigo-500/10 overflow-hidden flex items-center justify-center">
              <HeroCanvas />

              {/* Overlay Glass Floating Badge Top Right */}
              <div className="absolute top-6 right-6 z-20 pointer-events-auto">
                <TiltCard scale={1.05} perspective={600}>
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-white/60 dark:border-slate-700/80 shadow-lg backdrop-blur-md">
                    <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                      <Code2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">Ready-to-Use Code</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Next.js, React, Node.js</p>
                    </div>
                  </div>
                </TiltCard>
              </div>

              {/* Overlay Glass Floating Badge Bottom Left */}
              <div className="absolute bottom-6 left-6 z-20 pointer-events-auto">
                <TiltCard scale={1.05} perspective={600}>
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-white/60 dark:border-slate-700/80 shadow-lg backdrop-blur-md">
                    <div className="h-9 w-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md">
                      <Download className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">Instant ZIP Download</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Direct After Payment</p>
                    </div>
                  </div>
                </TiltCard>
              </div>

              {/* Floating Badge Center Left */}
              <div className="absolute top-1/2 -translate-y-1/2 left-4 z-20 hidden sm:block pointer-events-auto">
                <TiltCard scale={1.05} perspective={600}>
                  <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-700 shadow-md backdrop-blur-md">
                    <Bot className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">AI Prompt Kits</span>
                  </div>
                </TiltCard>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
