"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Compass, ShoppingBag, User, Search } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { useAuth } from "@/contexts/auth-context"

export function MobileBottomNav() {
  const pathname = usePathname()
  const { totalItems, setDrawerOpen } = useCart()
  const { user } = useAuth()

  // Do not show on checkout, admin dashboard, or product detail page (which has its own high-converting Sticky Buy Bar)
  if (
    !pathname ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/products/")
  ) {
    return null
  }

  const isHome = pathname === "/"
  const isProducts = pathname === "/products"
  const isDashboard = pathname.startsWith("/dashboard") || pathname.startsWith("/auth")

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="grid grid-cols-5 h-15 items-center justify-center px-1">
        
        {/* 1. Home */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center h-full py-1 gap-1 transition-all active:scale-90 ${
            isHome
              ? "text-violet-600 dark:text-violet-400 font-bold"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Home className={`h-5 w-5 ${isHome ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
          <span className="text-[10px] tracking-tight">Home</span>
        </Link>

        {/* 2. Explore / Products */}
        <Link
          href="/products"
          className={`flex flex-col items-center justify-center h-full py-1 gap-1 transition-all active:scale-90 ${
            isProducts
              ? "text-violet-600 dark:text-violet-400 font-bold"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Compass className={`h-5 w-5 ${isProducts ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
          <span className="text-[10px] tracking-tight">Explore</span>
        </Link>

        {/* 3. Search Quick-Trigger */}
        <button
          type="button"
          onClick={() => {
            const searchInput = document.querySelector('input[name="q"]') as HTMLInputElement
            if (searchInput) {
              searchInput.focus()
              window.scrollTo({ top: 0, behavior: "smooth" })
            } else {
              window.location.href = "/products"
            }
          }}
          className="flex flex-col items-center justify-center h-full py-1 gap-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all active:scale-90"
        >
          <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Search className="h-4.5 w-4.5 stroke-[2]" />
          </div>
          <span className="text-[10px] tracking-tight">Search</span>
        </button>

        {/* 4. Cart with real-time Badge */}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="relative flex flex-col items-center justify-center h-full py-1 gap-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all active:scale-90"
        >
          <div className="relative">
            <ShoppingBag className="h-5 w-5 stroke-[1.8]" />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-2 min-w-[17px] h-[17px] px-1 bg-red-600 text-white font-black text-[10px] rounded-full flex items-center justify-center shadow-sm animate-in zoom-in-75">
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight">Cart</span>
        </button>

        {/* 5. Account / Orders */}
        <Link
          href={user ? "/dashboard" : "/auth/login"}
          className={`flex flex-col items-center justify-center h-full py-1 gap-1 transition-all active:scale-90 ${
            isDashboard
              ? "text-violet-600 dark:text-violet-400 font-bold"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <User className={`h-5 w-5 ${isDashboard ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
          <span className="text-[10px] tracking-tight">{user ? "Orders" : "Login"}</span>
        </Link>

      </div>
    </nav>
  )
}
