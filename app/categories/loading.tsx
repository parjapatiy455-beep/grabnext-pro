import { StoreHeader } from "@/components/store-header"
import { Skeleton } from "@/components/ui/skeleton"
import { ProductGridSkeleton } from "@/components/product-card-skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col">
      <StoreHeader />

      <main className="container mx-auto px-4 py-8 space-y-12">
        <div className="text-center space-y-3">
          <Skeleton className="h-10 w-64 mx-auto rounded-lg" />
          <Skeleton className="h-5 w-96 mx-auto rounded" />
        </div>

        {[...Array(2)].map((_, i) => (
          <div key={i} className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-7 w-40 rounded" />
                  <Skeleton className="h-4 w-24 rounded" />
                </div>
              </div>
              <Skeleton className="h-5 w-20 rounded" />
            </div>

            <ProductGridSkeleton count={4} />
          </div>
        ))}
      </main>
    </div>
  )
}
