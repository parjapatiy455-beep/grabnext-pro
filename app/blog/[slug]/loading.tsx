import { StoreHeader } from "@/components/store-header"
import { Footer } from "@/components/footer"
import { Skeleton } from "@/components/ui/skeleton"

export default function BlogPostLoading() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col text-slate-900 dark:text-slate-100 transition-colors">
      <StoreHeader />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl space-y-6">
        {/* Breadcrumb Skeleton */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-12 rounded" />
          <span className="text-slate-300">/</span>
          <Skeleton className="h-4 w-12 rounded" />
          <span className="text-slate-300">/</span>
          <Skeleton className="h-4 w-32 rounded" />
        </div>

        {/* Header Skeleton */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-4 w-32 rounded" />
          </div>
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-3/4 rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>

        {/* Cover Image Skeleton */}
        <Skeleton className="aspect-video sm:h-96 w-full rounded-2xl" />

        {/* Content Paragraph Skeletons */}
        <div className="space-y-3 pt-4">
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-5/6 rounded" />
          <Skeleton className="h-4 w-3/4 rounded" />
          <Skeleton className="h-8 w-1/2 rounded-md mt-6" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-4/5 rounded" />
        </div>
      </main>

      <Footer />
    </div>
  )
}
