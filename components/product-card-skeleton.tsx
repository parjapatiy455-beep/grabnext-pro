import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export function ProductCardSkeleton({ className = "" }: { className?: string }) {
  return (
    <Card
      className={`relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden h-full flex flex-col ${className}`}
    >
      {/* Image Area Skeleton */}
      <div className="relative h-44 w-full bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-4">
        {/* Simulating badge placeholder */}
        <Skeleton className="absolute top-2 left-2 h-4 w-10 rounded" />
        <Skeleton className="h-32 w-32 rounded-lg" />
      </div>

      {/* Content Area Skeleton */}
      <CardContent className="p-3 flex-1 flex flex-col gap-2">
        {/* Title (2 lines) */}
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-full rounded" />
          <Skeleton className="h-3.5 w-4/5 rounded" />
        </div>

        {/* Rating line */}
        <div className="flex items-center gap-1.5 pt-0.5">
          <Skeleton className="h-4 w-12 rounded" />
          <Skeleton className="h-3 w-8 rounded" />
        </div>

        {/* Price block */}
        <div className="mt-auto pt-2 space-y-1">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-20 rounded" />
            <Skeleton className="h-3.5 w-14 rounded" />
          </div>
          <Skeleton className="h-3 w-24 rounded" />
        </div>

        {/* Download Button skeleton */}
        <Skeleton className="w-full mt-2 h-8 rounded-md" />
      </CardContent>
    </Card>
  )
}

export function ProductGridSkeleton({
  count = 8,
  className = "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4",
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
