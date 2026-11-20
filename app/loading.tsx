import { StoreHeader } from "@/components/store-header"
import { Footer } from "@/components/footer"
import { Skeleton } from "@/components/ui/skeleton"
import { ProductGridSkeleton } from "@/components/product-card-skeleton"
import { Flame } from "lucide-react"

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col text-slate-900 dark:text-slate-100 transition-colors">
      <StoreHeader />

      {/* 1. SEO & Conversion Hero Section Skeleton */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#fdfaf6] via-[#faf6f0] to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border-b border-orange-150/70 dark:border-slate-800 py-4 sm:py-6 px-3 sm:px-6">
        <div className="container mx-auto max-w-6xl">
          {/* Flash Sale Urgency Strip */}
          <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl shadow-md mb-4 max-w-4xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-300 fill-yellow-300 shrink-0" />
              <span className="bg-yellow-400 text-slate-950 text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
                FLASH SALE
              </span>
              <span className="text-[11px] sm:text-xs font-black truncate">
                90% OFF <span className="hidden sm:inline font-bold">— Limited Time Offer!</span>
              </span>
            </div>
            {/* Urgency Timer Skeleton */}
            <div className="flex items-center gap-1 bg-black/30 backdrop-blur-xs px-2 py-0.5 rounded-lg shrink-0">
              <span className="text-orange-200 text-[10px] hidden xs:inline font-sans mr-0.5 font-medium">Ends:</span>
              <div className="bg-white/90 text-slate-900 px-1.5 py-0.2 rounded text-[10px] sm:text-[11px] font-bold font-mono">02</div>
              <span className="text-white/80">:</span>
              <div className="bg-white/90 text-slate-900 px-1.5 py-0.2 rounded text-[10px] sm:text-[11px] font-bold font-mono">45</div>
              <span className="text-white/80">:</span>
              <div className="bg-white/90 text-slate-900 px-1.5 py-0.2 rounded text-[10px] sm:text-[11px] font-bold font-mono">18</div>
            </div>
          </div>

          {/* 2-Column Responsive Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-center">
            {/* Left Column */}
            <div className="md:col-span-7 space-y-3.5 text-left">
              {/* Tag Badge */}
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-violet-700 dark:text-violet-300 bg-violet-100/80 dark:bg-violet-950/60 px-3 py-1 rounded-full border border-violet-200 dark:border-violet-800 shadow-xs">
                <span>⚡ All-In-One Power Bundle</span>
              </div>

              {/* H1 Heading */}
              <div className="space-y-2">
                <Skeleton className="h-8 sm:h-11 w-4/5 rounded-xl" />
                <Skeleton className="h-6 sm:h-8 w-3/5 rounded-xl" />
              </div>

              {/* Sub-Headline */}
              <div className="text-base sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 tracking-tight">
                BUY 1, GET 15+ PRO PACKS FREE!
              </div>

              {/* Description */}
              <div className="space-y-1.5 max-w-xl">
                <Skeleton className="h-3.5 w-full rounded" />
                <Skeleton className="h-3.5 w-5/6 rounded" />
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Skeleton className="h-6 w-36 rounded-full" />
                <Skeleton className="h-6 w-44 rounded-full" />
                <Skeleton className="h-6 w-32 rounded-full" />
              </div>

              {/* CTA Button & Social Proof */}
              <div className="pt-3 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Skeleton className="h-12 w-48 rounded-xl shadow-md" />
                <div className="flex items-center gap-2.5">
                  <div className="flex -space-x-2">
                    <Skeleton className="h-7 w-7 rounded-full" />
                    <Skeleton className="h-7 w-7 rounded-full" />
                    <Skeleton className="h-7 w-7 rounded-full" />
                    <Skeleton className="h-7 w-7 rounded-full" />
                  </div>
                  <div className="space-y-1">
                    <Skeleton className="h-3.5 w-28 rounded" />
                    <Skeleton className="h-2.5 w-20 rounded" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: 3D Floating Mockup Graphic */}
            <div className="md:col-span-5 flex justify-center items-center relative">
              <div className="w-full max-w-[340px] sm:max-w-[420px] aspect-square rounded-2xl bg-gradient-to-tr from-slate-200/50 to-slate-100/50 dark:from-slate-800/40 dark:to-slate-900/40 flex items-center justify-center p-6 border border-slate-200/60 dark:border-slate-800 shadow-sm">
                <Skeleton className="w-full h-full rounded-2xl" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Category Quick-Nav (Modern 2026 Horizontal Pill Chips Skeleton) */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors py-2.5">
        <div className="container mx-auto px-3 sm:px-4 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-2 min-w-max">
            <Skeleton className="h-7 w-28 rounded-full" />
            <Skeleton className="h-7 w-24 rounded-full" />
            <Skeleton className="h-7 w-32 rounded-full" />
            <Skeleton className="h-7 w-24 rounded-full" />
            <Skeleton className="h-7 w-36 rounded-full" />
            <Skeleton className="h-7 w-28 rounded-full" />
            <Skeleton className="h-7 w-24 rounded-full" />
            <Skeleton className="h-7 w-32 rounded-full" />
          </div>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-0 sm:px-4 pt-3 pb-20 md:py-6 space-y-4 sm:space-y-6">
        {/* 3. Banner Carousel Skeleton */}
        <div className="mx-2 sm:mx-0 relative rounded-2xl overflow-hidden aspect-[2/1] md:max-h-[512px] shadow-md">
          <Skeleton className="w-full h-full rounded-2xl" />
        </div>

        {/* 4. Modern 2026 Trust & Guarantee Strip Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 px-2 sm:px-0">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 sm:p-4 flex items-center gap-3 shadow-xs"
            >
              <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-3.5 w-24 rounded" />
                <Skeleton className="h-2.5 w-32 rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* 5. All Products Section Skeleton */}
        <section className="bg-white dark:bg-slate-900 border-y sm:border dark:border-slate-800 rounded-none sm:rounded-2xl py-3.5 sm:p-5 px-0 sm:px-5 shadow-xs sm:shadow-sm transition-colors space-y-4">
          <div className="space-y-3 mb-4 px-2.5 sm:px-0">
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <Skeleton className="h-6 w-52 sm:w-64 rounded" />
                <Skeleton className="h-3.5 w-64 sm:w-80 rounded" />
              </div>
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>

            {/* Quick Filter Pill Chips Skeleton */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-28 rounded-full" />
              <Skeleton className="h-6 w-32 rounded-full" />
              <Skeleton className="h-6 w-32 rounded-full" />
            </div>
          </div>

          {/* Product Grid Skeleton */}
          <ProductGridSkeleton count={8} />
        </section>

        {/* 6. Shop by Category Section Skeleton */}
        <section className="bg-white dark:bg-slate-900 border-y sm:border dark:border-slate-800 rounded-none sm:rounded-2xl py-4 px-2.5 sm:p-5 shadow-xs sm:shadow-sm transition-colors space-y-4">
          <Skeleton className="h-6 w-36 rounded" />
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-100 dark:border-slate-800/80"
              >
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="h-3 w-16 rounded" />
              </div>
            ))}
          </div>
        </section>

        {/* 7. Guides & Blog Section Skeleton */}
        <section className="bg-white dark:bg-slate-900 border-y sm:border dark:border-slate-800 rounded-none sm:rounded-2xl py-4 px-3 sm:p-5 shadow-xs sm:shadow-sm transition-colors space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-3.5 w-28 rounded" />
              <Skeleton className="h-5 w-60 sm:w-80 rounded" />
            </div>
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-4 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-16 rounded" />
                  <Skeleton className="h-3 w-12 rounded" />
                </div>
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-3.5 w-3/4 rounded" />
                <Skeleton className="h-3 w-20 rounded mt-3" />
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
