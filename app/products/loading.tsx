import { StoreHeader } from "@/components/store-header"
import { Footer } from "@/components/footer"
import { Skeleton } from "@/components/ui/skeleton"
import { ProductGridSkeleton } from "@/components/product-card-skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col">
      <StoreHeader />

      <main className="flex-1 container mx-auto px-3 md:px-4 py-5">
        {/* Filter Bar Skeleton */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-3 mb-4 flex gap-3 items-center">
          <Skeleton className="h-9 flex-1 rounded-md" />
          <Skeleton className="h-9 w-36 rounded-md hidden sm:block" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>

        {/* Category Pills Skeleton */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          <Skeleton className="h-8 w-16 rounded-full shrink-0" />
          <Skeleton className="h-8 w-24 rounded-full shrink-0" />
          <Skeleton className="h-8 w-28 rounded-full shrink-0" />
          <Skeleton className="h-8 w-20 rounded-full shrink-0" />
          <Skeleton className="h-8 w-32 rounded-full shrink-0" />
          <Skeleton className="h-8 w-24 rounded-full shrink-0" />
        </div>

        {/* Result count */}
        <div className="mb-4">
          <Skeleton className="h-4 w-32 rounded" />
        </div>

        {/* Product Grid Skeleton */}
        <ProductGridSkeleton
          count={10}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
        />
      </main>

      <Footer />
    </div>
  )
}
