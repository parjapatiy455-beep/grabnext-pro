"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { TiltCard } from "@/components/3d/tilt-card"
import { Sparkles, ArrowRight, Zap, ShieldCheck } from "lucide-react"

export function CTASection() {
  const triggerConfetti = async () => {
    try {
      const confetti = (await import("canvas-confetti")).default
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      })
    } catch {
      // optional fallback
    }
  }

  return (
    <section className="py-16 bg-slate-50/50 dark:bg-slate-900/50 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <TiltCard scale={1.01} perspective={1200}>
          <div className="relative rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-800 text-white p-8 md:p-16 shadow-2xl overflow-hidden border border-indigo-400/30">
            {/* Glowing Orbs */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-sky-400/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 text-center max-w-3xl mx-auto space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 border border-white/20 text-white text-xs font-bold backdrop-blur-md">
                <Sparkles className="h-4 w-4 text-amber-300" />
                <span>Ready to Elevate Your Digital Workflow?</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                Unlock Instant Access to Premium Software & Code Today
              </h2>

              <p className="text-sm sm:text-base text-indigo-100 font-medium max-w-xl mx-auto">
                Join over 50,000+ developers, designers, and creators who build faster with GrabNext. Single purchase, lifetime ownership, and zero monthly fees.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Button
                  asChild
                  onClick={triggerConfetti}
                  size="lg"
                  className="w-full sm:w-auto bg-white text-indigo-950 hover:bg-slate-100 font-extrabold px-8 py-6 rounded-xl shadow-xl hover:scale-105 transition-all text-sm"
                >
                  <Link href="/products" className="flex items-center gap-2">
                    <span>Browse All Products</span>
                    <ArrowRight className="h-4 w-4 text-indigo-600" />
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto border-2 border-white/30 hover:border-white text-white font-bold px-6 py-6 rounded-xl bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all text-sm"
                >
                  <a href="#what-is-grabnext">Learn About Services</a>
                </Button>
              </div>

              <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-indigo-200 font-medium">
                <span className="flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-amber-300" /> Instant Download
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-300" /> Lifetime Updates
                </span>
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-sky-300" /> 24/7 Priority Support
                </span>
              </div>
            </div>
          </div>
        </TiltCard>
      </div>
    </section>
  )
}
