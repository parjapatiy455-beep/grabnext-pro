"use client"
export const runtime = 'edge'

import { Suspense } from "react"
import { DashboardView } from "@/components/dashboard-view"
import { Loader2 } from "lucide-react"

export default function DownloadsDirectPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Loading your downloads...</p>
        </div>
      }
    >
      <DashboardView initialTab="downloads" />
    </Suspense>
  )
}
