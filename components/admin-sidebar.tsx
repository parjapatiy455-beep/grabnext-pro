"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ShoppingBag,
  List,
  ShoppingCart,
  Store,
  Users,
  Image,
  CreditCard,
  Bot,
  BarChart2,
  Activity,
  FileText,
  Ticket,
  Mail,
  Send,
  Target
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const sidebarItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Products", href: "/admin/products", icon: ShoppingBag },
  { name: "Categories", href: "/admin/categories", icon: List },
  { name: "Banners", href: "/admin/banners", icon: Image },
  { name: "Landing Pages", href: "/admin/landing-pages", icon: FileText },
  { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Bulk Email Offer", href: "/admin/bulk-email", icon: Send },
  { name: "Coupons", href: "/admin/coupons", icon: Ticket },
  { name: "Pixels & Tracking", href: "/admin/pixels", icon: Target },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart2 },
  { name: "Payment Settings", href: "/admin/payment-settings", icon: CreditCard },
  { name: "Email Test", href: "/admin/email-test", icon: Mail },
  { name: "AI Settings", href: "/admin/ai-settings", icon: Bot },
  { name: "AI Test", href: "/admin/ai-test", icon: Activity },
]

export function AdminSidebar({
  onNavigate,
  className
}: {
  onNavigate?: () => void
  className?: string
}) {
  const pathname = usePathname()

  return (
    <div className={cn("flex flex-col h-full bg-white border-r border-slate-200 select-none", className)}>
      {/* Header — Pinned at top */}
      <div className="h-16 px-5 border-b border-slate-100 flex items-center shrink-0">
        <Link
          href="/admin"
          onClick={onNavigate}
          className="flex items-center gap-2.5 shrink-0 group"
        >
          <div className="bg-slate-900 text-white p-2 rounded-xl flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <Store className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base text-slate-900 leading-tight group-hover:text-primary transition-colors">
              Admin Panel
            </span>
            <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
              GrabNext Store
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation items — scrollable inside sidebar, never overflowing window */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1 min-h-0 scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href} onClick={onNavigate}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-xs font-bold",
                  isActive
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 active:bg-slate-200"
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-emerald-400" : "text-slate-400")} />
                <span className="truncate">{item.name}</span>
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Footer — Pinned at bottom */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/60 shrink-0">
        <Button asChild variant="outline" size="sm" className="w-full justify-start gap-2.5 text-xs font-bold rounded-xl h-9 hover:bg-white">
          <Link href="/" onClick={onNavigate}>
            <Store className="h-4 w-4 text-slate-500" />
            <span>Back to Store</span>
          </Link>
        </Button>
      </div>
    </div>
  )
}
