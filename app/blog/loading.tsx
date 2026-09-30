import { StoreHeader } from "@/components/store-header"
import { Footer } from "@/components/footer"
import { Skeleton } from "@/components/ui/skeleton"

export default function BlogLoading() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col text-slate-900 dark:text-slate-100 transition-colors">
      <StoreHeader />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl space-y-10">
        {/* Hero Banner Skeleton */}
        <div className="text-center space-y-3 py-6 bg-slate-100/50 dark:bg-slate-900/40 rounded-3xl p-6 border border-slate-200/60 dark:border-slate-800">
          <Skeleton className="h-6 w-48 mx-auto rounded-full" />
          <Skeleton className="h-10 w-3/4 max-w-xl mx-auto rounded-lg" />
          <Skeleton className="h-4 w-1/2 max-w-md mx-auto rounded" />
          <div className="flex justify-center gap-2 pt-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-6 w-20 rounded-full" />
            ))}
          </div>
        </div>

        {/* Featured Post Skeleton */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <Skeleton className="h-64 md:h-80 w-full rounded-xl" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-8 w-full rounded-md" />
              <Skeleton className="h-8 w-4/5 rounded-md" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-5 w-28 rounded pt-2" />
            </div>
          </div>
        </div>

        {/* Grid Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-6 w-48 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden p-0 space-y-3"
              >
                <Skeleton className="h-48 w-full rounded-none" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-3 w-28 rounded" />
                  <Skeleton className="h-5 w-full rounded" />
                  <Skeleton className="h-5 w-3/4 rounded" />
                  <Skeleton className="h-3 w-5/6 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
