import { StoreHeader } from "@/components/store-header"
import { Footer } from "@/components/footer"
import { Skeleton } from "@/components/ui/skeleton"
import { ProductGridSkeleton } from "@/components/product-card-skeleton"

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col text-slate-900 dark:text-slate-100 transition-colors">
      <StoreHeader />

      {/* Category Quick-Nav Skeleton */}
      <div className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 shadow-sm">
        <div className="container mx-auto px-4 py-2 overflow-x-auto">
          <div className="flex gap-5 min-w-max">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1 min-w-[56px]">
                <Skeleton className="h-11 w-11 rounded-full" />
                <Skeleton className="h-2.5 w-10 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-3 md:px-4 py-4 space-y-6">
        {/* Banner Skeleton */}
        <div className="relative rounded-2xl overflow-hidden w-full aspect-[2/1] md:max-h-[360px] shadow-sm">
          <Skeleton className="w-full h-full rounded-2xl" />
        </div>

        {/* All Products Section Skeleton */}
        <section className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-6 w-52 rounded" />
              <Skeleton className="h-3.5 w-72 rounded" />
            </div>
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>

          <ProductGridSkeleton count={8} />
        </section>
      </main>

      <Footer />
    </div>
  )
}
