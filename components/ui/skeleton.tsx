import * as React from "react"
import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("skeleton-shimmer rounded-md bg-slate-200/80 dark:bg-slate-800/80", className)}
      {...props}
    />
  )
}

export { Skeleton }