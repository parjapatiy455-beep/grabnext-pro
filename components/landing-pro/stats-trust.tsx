"use client"

import { Star, ShieldCheck, Download, Users, Award, Heart } from "lucide-react"

const stats = [
  { label: "Total Downloads", value: "50,000+", icon: Download, color: "text-blue-500" },
  { label: "Verified Digital Assets", value: "1,200+", icon: Award, color: "text-indigo-500" },
  { label: "Active Creators & Devs", value: "35,000+", icon: Users, color: "text-purple-500" },
  { label: "Satisfied Reviews", value: "4.9 / 5.0", icon: Star, color: "text-amber-500" },
]

const reviews = [
  {
    name: "Rahul Sharma",
    role: "Fullstack Developer",
    text: "GrabNext saved me 3 weeks of work! Downloaded the Next.js SaaS boilerplate and launched my startup MVP in just 2 days.",
    rating: 5,
  },
  {
    name: "Priya Patel",
    role: "UI/UX Designer",
    text: "The Tailwind UI kits are top tier! Clean code, fully responsive, and worth 10x the price. Instant download worked flawlessly.",
    rating: 5,
  },
  {
    name: "Vikram Mehta",
    role: "Agency Founder",
    text: "Best digital store in India. 100% genuine code, lifetime updates, and WhatsApp support helped us immediately when we had setup questions.",
    rating: 5,
  },
]

export function StatsTrust() {
  return (
    <section className="py-20 bg-white dark:bg-slate-950">
      <div className="container mx-auto px-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {stats.map((st, i) => {
            const Icon = st.icon
            return (
              <div
                key={i}
                className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-2 hover:shadow-md transition-shadow"
              >
                <div className={`h-10 w-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center mx-auto shadow-sm ${st.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {st.value}
                </h3>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {st.label}
                </p>
              </div>
            )
          })}
        </div>

        {/* Customer Reviews Header */}
        <div className="text-center max-w-xl mx-auto space-y-3 mb-12">
          <div className="inline-flex items-center gap-1 text-amber-500">
            {Array.from({ length: 5 }).map((_, idx) => (
              <Star key={idx} className="h-4 w-4 fill-amber-500" />
            ))}
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Loved by 50,000+ Developers & Creators
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
            Here's what our community has to say about GrabNext.
          </p>
        </div>

        {/* Reviews Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((rev, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-slate-50/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 space-y-4 relative flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-amber-500">
                  {Array.from({ length: rev.rating }).map((_, idx) => (
                    <Star key={idx} className="h-3.5 w-3.5 fill-amber-500" />
                  ))}
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  "{rev.text}"
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{rev.name}</h4>
                  <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">{rev.role}</p>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900">
                  ✓ Verified Buyer
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
