import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export function ProductCardSkeleton({ className = "" }: { className?: string }) {
  return (
    <Card
      className={`group relative bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden h-full flex flex-col ${className}`}
    >
      {/* Image Area Skeleton matching real ProductCard aspect ratio [4/3] sm:[16/11] */}
      <div className="relative aspect-[4/3] sm:aspect-[16/11] w-full bg-slate-50 dark:bg-slate-950 overflow-hidden flex items-center justify-center p-3 transition-colors">
        {/* Simulating discount badge placeholder */}
        <Skeleton className="absolute top-2.5 left-2.5 h-4.5 w-11 rounded-full z-10" />
        {/* Simulating product thumbnail */}
        <Skeleton className="h-full w-full rounded-xl" />
      </div>

      {/* Content Area Skeleton */}
      <CardContent className="p-3.5 flex-1 flex flex-col gap-1.5">
        {/* Title (2 lines) */}
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-4/5 rounded" />
        </div>

        {/* Rating line */}
        <div className="flex items-center gap-1.5 pt-0.5">
          <Skeleton className="h-4 w-12 rounded-md" />
          <Skeleton className="h-3 w-8 rounded" />
        </div>

        {/* Price block */}
        <div className="mt-auto pt-1 space-y-1">
          <div className="flex items-baseline gap-1.5">
            <Skeleton className="h-5 w-16 sm:w-20 rounded" />
            <Skeleton className="h-3.5 w-12 rounded" />
          </div>
          <Skeleton className="h-2.5 w-20 rounded mt-0.5" />
        </div>

        {/* Download Button skeleton */}
        <Skeleton className="w-full mt-2 h-9 rounded-xl" />
      </CardContent>
    </Card>
  )
}

export function ProductGridSkeleton({
  count = 8,
  className = "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 px-1.5 sm:px-0",
}: {
  count?: number
  className?: string
}) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}
