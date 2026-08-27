"use client"

import { TiltCard } from "@/components/3d/tilt-card"
import { Search, CreditCard, FileCheck, Sparkles, CheckCircle } from "lucide-react"

const steps = [
  {
    step: "01",
    title: "Browse & Select Asset",
    description:
      "Explore 1,200+ verified Next.js templates, software source code, UI kits, and courses.",
    icon: Search,
    color: "from-blue-600 to-indigo-600",
    badge: "Step 1",
  },
  {
    step: "02",
    title: "Instant Secure Payment",
    description:
      "Pay seamlessly using UPI, PhonePe, Google Pay, Cards, or Stripe with 256-bit SSL encryption.",
    icon: CreditCard,
    color: "from-purple-600 to-pink-600",
    badge: "Step 2",
  },
  {
    step: "03",
    title: "Immediate Download & License",
    description:
      "Access your direct high-speed ZIP download link instantly on-screen and directly in your inbox.",
    icon: FileCheck,
    color: "from-emerald-500 to-teal-600",
    badge: "Step 3",
  },
]

export function HowItWorks() {
  return (
    <section className="py-20 bg-slate-50 dark:bg-slate-900/60 relative overflow-hidden border-y border-slate-200/80 dark:border-slate-800">
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Seamless Workflow</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            How GrabNext Works in{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent">
              3 Simple Steps
            </span>
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 font-medium">
            From purchase to full deployment in less than 2 minutes.
          </p>
        </div>

        {/* 3 Step Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((s, idx) => {
            const Icon = s.icon
            return (
              <TiltCard key={idx} scale={1.04} perspective={1000} className="h-full">
                <div className="relative h-full p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl flex flex-col justify-between group overflow-hidden">
                  {/* Watermark Step Number */}
                  <span className="absolute -top-4 -right-2 text-7xl font-black text-slate-100 dark:text-slate-800/50 pointer-events-none select-none">
                    {s.step}
                  </span>

                  <div className="relative z-10 space-y-6">
                    {/* Badge & Icon */}
                    <div className="flex items-center justify-between">
                      <div
                        className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${s.color} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}
                      >
                        <Icon className="h-7 w-7" />
                      </div>
                      <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-900">
                        {s.badge}
                      </span>
                    </div>

                    {/* Step Title & Content */}
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {s.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                        {s.description}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Verification Check */}
                  <div className="relative z-10 pt-6 border-t border-slate-100 dark:border-slate-800/80 mt-6 flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle className="h-4 w-4" />
                    <span>Instant Execution Guaranteed</span>
                  </div>
                </div>
              </TiltCard>
            )
          })}
        </div>
      </div>
    </section>
  )
}
