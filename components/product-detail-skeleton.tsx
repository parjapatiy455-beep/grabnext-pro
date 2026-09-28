import { Skeleton } from "@/components/ui/skeleton"
import { StoreHeader } from "@/components/store-header"
import { Footer } from "@/components/footer"
import { Separator } from "@/components/ui/separator"

export function ProductDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col text-slate-900 dark:text-slate-100 transition-colors">
      <StoreHeader />

      <main className="flex-1 w-full max-w-6xl mx-auto px-3 sm:px-5 lg:px-8 py-4 sm:py-6 space-y-4">
        {/* Breadcrumb Skeleton */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-16 rounded" />
          <span className="text-gray-300">/</span>
          <Skeleton className="h-4 w-20 rounded" />
          <span className="text-gray-300">/</span>
          <Skeleton className="h-4 w-32 rounded" />
        </div>

        {/* Hero Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* LEFT — Image Gallery Skeleton */}
            <div className="flex flex-col gap-3 p-4 sm:p-6 lg:border-r lg:border-gray-100 dark:lg:border-slate-800">
              <div className="relative rounded-xl overflow-hidden bg-gray-50 dark:bg-slate-950 h-[300px] sm:h-[380px] flex items-center justify-center p-6">
                <Skeleton className="h-64 w-64 rounded-xl" />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="shrink-0 h-14 w-14 rounded-lg" />
                ))}
              </div>
            </div>

            {/* RIGHT — Info + Actions Skeleton */}
            <div className="flex flex-col gap-4 p-4 sm:p-6">
              {/* Category pill & Title */}
              <div className="space-y-2">
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-7 w-5/6 rounded-md" />
                <Skeleton className="h-7 w-3/5 rounded-md" />
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-16 rounded" />
                <Skeleton className="h-4 w-24 rounded" />
              </div>

              <Separator className="dark:bg-slate-800" />

              {/* Price */}
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <Skeleton className="h-9 w-28 rounded-md" />
                  <Skeleton className="h-5 w-16 rounded-md" />
                  <Skeleton className="h-5 w-16 rounded-md" />
                </div>
                <Skeleton className="h-4 w-32 rounded" />
              </div>

              {/* Features list */}
              <div className="space-y-2 py-2">
                <Skeleton className="h-4 w-4/5 rounded" />
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-4 w-2/3 rounded" />
              </div>

              {/* CTA Buttons */}
              <div className="space-y-2.5 pt-2">
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Skeleton className="h-12 rounded-lg" />
                <Skeleton className="h-12 rounded-lg" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs & Description skeleton */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 space-y-4">
          <div className="flex gap-4 border-b pb-3">
            <Skeleton className="h-7 w-28 rounded" />
            <Skeleton className="h-7 w-24 rounded" />
          </div>
          <div className="space-y-3 pt-2">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-5/6 rounded" />
            <Skeleton className="h-4 w-4/5 rounded" />
            <Skeleton className="h-4 w-3/4 rounded" />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
