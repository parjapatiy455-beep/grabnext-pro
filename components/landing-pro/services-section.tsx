"use client"

import { TiltCard } from "@/components/3d/tilt-card"
import {
  Code,
  Layout,
  GraduationCap,
  Sparkles,
  Zap,
  ShieldCheck,
  RefreshCw,
  Headphones,
  Check,
  ArrowRight,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const services = [
  {
    icon: Code,
    title: "Software & Source Code",
    subtitle: "Production-Ready Scripts",
    description:
      "Fully functional Next.js, React, Node.js, Python, and Flutter source codes. Launch your startup or SaaS in hours instead of months.",
    color: "from-blue-500 to-indigo-600",
    shadow: "shadow-blue-500/20",
    badge: "Most Popular",
    stats: "350+ Scripts Available",
  },
  {
    icon: Layout,
    title: "UI Kits & Web Templates",
    subtitle: "Modern Tailwind Designs",
    description:
      "Pixel-perfect website templates, landing pages, and dashboard UI kits crafted with Tailwind CSS and Radix UI components.",
    color: "from-purple-500 to-pink-600",
    shadow: "shadow-purple-500/20",
    badge: "Developer Choice",
    stats: "250+ UI Kits",
  },
  {
    icon: GraduationCap,
    title: "Masterclasses & E-books",
    subtitle: "High-Income Skills",
    description:
      "Comprehensive video masterclasses, coding bootcamps, and action-oriented e-books to master full-stack, AI, and marketing.",
    color: "from-amber-500 to-orange-600",
    shadow: "shadow-amber-500/20",
    badge: "Top Rated",
    stats: "150+ Courses",
  },
  {
    icon: Sparkles,
    title: "AI Tools & Prompt Bundles",
    subtitle: "Next-Gen Automation",
    description:
      "Curated ChatGPT, Midjourney, and Claude prompt packs, workflow automations, and AI tool templates to boost productivity.",
    color: "from-emerald-500 to-teal-600",
    shadow: "shadow-emerald-500/20",
    badge: "Trending",
    stats: "180+ Bundles",
  },
]

const guarantees = [
  {
    icon: Zap,
    title: "Instant Automated Delivery",
    desc: "No waiting time. Receive download link & license directly after payment.",
  },
  {
    icon: ShieldCheck,
    title: "100% Virus & Malware Free",
    desc: "Every digital asset is scanned and manually verified by experts.",
  },
  {
    icon: RefreshCw,
    title: "Lifetime Updates & Access",
    desc: "Pay once and redownload updated versions of your purchased items anytime.",
  },
  {
    icon: Headphones,
    title: "24/7 Dedicated Support",
    desc: "Get instant assistance via WhatsApp and Email for code setup or queries.",
  },
]

export function ServicesSection() {
  return (
    <section id="what-is-grabnext" className="py-20 bg-slate-50/50 dark:bg-slate-900/50 relative overflow-hidden">
      {/* Background Accents */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-indigo-200/30 dark:bg-indigo-950/30 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-sky-200/30 dark:bg-sky-950/30 blur-3xl rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-100/80 dark:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider">
            <span>What is GrabNext?</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            India's Premier Marketplace for{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-500 bg-clip-text text-transparent">
              Instant Digital Assets
            </span>
          </h2>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
            GrabNext is an all-in-one digital platform created for developers, creators, entrepreneurs, and agencies. We eliminate development friction by providing high-quality, pre-built source codes, templates, masterclasses, and digital tools.
          </p>
        </div>

        {/* 4 Core Services Grid with 3D Tilt Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {services.map((service, index) => {
            const Icon = service.icon
            return (
              <TiltCard key={index} scale={1.03} perspective={1000} className="h-full">
                <div className="h-full p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
                  <div className="space-y-4">
                    {/* Header with Icon and Badge */}
                    <div className="flex items-center justify-between">
                      <div
                        className={`h-12 w-12 rounded-xl bg-gradient-to-br ${service.color} text-white flex items-center justify-center shadow-md ${service.shadow} group-hover:scale-110 transition-transform`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-full border border-indigo-100 dark:border-indigo-900">
                        {service.badge}
                      </span>
                    </div>

                    {/* Title & Subtitle */}
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {service.title}
                      </h3>
                      <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
                        {service.subtitle}
                      </p>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {service.description}
                    </p>
                  </div>

                  {/* Footer Stats & Arrow */}
                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between mt-4">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      {service.stats}
                    </span>
                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      Browse <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </TiltCard>
            )
          })}
        </div>

        {/* GrabNext Service Guarantees Grid */}
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-8 md:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Why Thousands Choose GrabNext
              </h3>
              <p className="text-sm text-slate-300">
                We guarantee hassle-free, secure, and instant access to all digital files.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {guarantees.map((item, idx) => {
                const GIcon = item.icon
                return (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-3 hover:bg-white/10 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
                      <GIcon className="h-5 w-5" />
                    </div>
                    <h4 className="text-sm font-bold text-white">{item.title}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">{item.desc}</p>
                  </div>
                )
              })}
            </div>

            {/* Quick Action Banner inside Guarantees */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10">
              <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                <Check className="h-4 w-4 text-emerald-400" />
                <span>Over 10,000+ Downloads Served Daily Across India & Worldwide</span>
              </div>
              <Button
                asChild
                className="bg-white text-slate-900 hover:bg-slate-100 font-bold px-6 py-2 rounded-xl text-xs shadow-md transition-transform hover:scale-105"
              >
                <Link href="/products">View All Products →</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
