"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Search, ShoppingCart, User, ChevronDown, BookOpen, AlertTriangle, Sun, Moon, ArrowRight, Zap, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { CartDrawer } from "./cart-drawer"
import { useAuth } from "@/contexts/auth-context"
import { useCart } from "@/contexts/cart-context"
import { ADMIN_EMAIL } from "@/lib/auth"
import { fetchCategories, fetchProducts } from "@/lib/d1-client"
import { Logo } from "@/components/logo"
import { useTheme } from "next-themes"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"

export function StoreHeader() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { user, userProfile } = useAuth()
  const { totalItems } = useCart()
  const { theme, setTheme } = useTheme()

  // Dynamic products and categories
  const [allProducts, setAllProducts] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [mobileSearchQuery, setMobileSearchQuery] = useState("")
  const [desktopResults, setDesktopResults] = useState<any[]>([])
  const [mobileResults, setMobileResults] = useState<any[]>([])
  const [isDesktopFocused, setIsDesktopFocused] = useState(false)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    fetchProducts()
      .then((prods) => {
        if (Array.isArray(prods) && prods.length > 0) {
          setAllProducts(prods.filter((p: any) => p.isActive))
        }
      })
      .catch(() => {})
  }, [])

  // Auto-search for desktop when typing 3+ letters
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase()
    if (q.length >= 3) {
      const matches = allProducts.filter((p) =>
        (p.title || "").toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q) ||
        (Array.isArray(p.tags) && p.tags.some((t: string) => t.toLowerCase().includes(q)))
      ).slice(0, 5)
      setDesktopResults(matches)
    } else {
      setDesktopResults([])
    }
  }, [searchQuery, allProducts])

  // Auto-search for mobile when typing 3+ letters
  useEffect(() => {
    const q = mobileSearchQuery.trim().toLowerCase()
    if (q.length >= 3) {
      const matches = allProducts.filter((p) =>
        (p.title || "").toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q) ||
        (Array.isArray(p.tags) && p.tags.some((t: string) => t.toLowerCase().includes(q)))
      ).slice(0, 5)
      setMobileResults(matches)
    } else {
      setMobileResults([])
    }
  }, [mobileSearchQuery, allProducts])

  // Close desktop search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsDesktopFocused(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Check if user is admin (either by Role OR by Email)
  const isAdmin = userProfile?.role === "admin" || (user?.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
  const isGuest = mounted && user?.isGuest === true;

  const handleDesktopSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsDesktopFocused(false)
    const q = searchQuery.trim()
    if (q) window.location.href = `/products?q=${encodeURIComponent(q)}`
    else window.location.href = '/products'
  }

  const handleMobileSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = mobileSearchQuery.trim()
    if (q) window.location.href = `/products?q=${encodeURIComponent(q)}`
    else window.location.href = '/products'
  }

  return (
    <div className="sticky top-0 z-50 w-full flex flex-col shadow-md">
      {/* Guest Banner - shown only for guest users */}
      {isGuest && (
        <div className="bg-red-600 text-white px-4 py-2 flex items-center justify-center gap-3 text-sm font-medium animate-pulse-once">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            ⚠️ <strong>Guest Account</strong> — Your account was created automatically. Please{" "}
            <Link
              href="/dashboard/confirm-account"
              className="underline font-bold hover:text-red-100 transition-colors"
            >
              set a permanent password
            </Link>{" "}
            to secure your orders.
          </span>
        </div>
      )}

      {/* Top Bar - Warm White Elegant Brand */}
      <header className="bg-[#fdfaf6] dark:bg-slate-950 text-slate-900 dark:text-slate-100 border-b border-orange-100/50 dark:border-slate-800 shadow-sm transition-colors">
        <div className="w-full px-3 sm:px-4 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <Logo />

          {/* Search Bar - Wide & Central with Instant 3-Letter Autocomplete */}
          <div ref={searchContainerRef} className="hidden md:flex flex-1 max-w-2xl mx-4 relative">
            <form
              className="relative w-full flex shadow-sm"
              onSubmit={handleDesktopSearchSubmit}
            >
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                name="q"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsDesktopFocused(true)}
                placeholder="Search products, software, bundles (min 3 letters)..."
                className="pl-10 rounded-r-none bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 border-r-0 dark:border-slate-800 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-500 dark:placeholder:text-gray-400 h-10"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-24 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <Button type="submit" className="rounded-l-none bg-yellow-400 dark:bg-yellow-500 text-gray-900 dark:text-slate-950 hover:bg-yellow-500 dark:hover:bg-yellow-600 border border-l-0 dark:border-slate-800 font-bold px-6 h-10">
                Search
              </Button>
            </form>

            {/* Desktop Autocomplete Live Dropdown Panel */}
            {isDesktopFocused && searchQuery.trim().length >= 3 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in zoom-in-95 duration-150">
                <div className="p-2.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-50/80 dark:bg-slate-800/60 flex items-center justify-between">
                  <span>Related Products ({desktopResults.length})</span>
                  <span className="text-[10px] text-slate-400">Click to view product</span>
                </div>
                {desktopResults.length > 0 ? (
                  <>
                    {desktopResults.map((prod) => (
                      <Link
                        key={prod.id}
                        href={`/products/${prod.slug || prod.id}`}
                        onClick={() => setIsDesktopFocused(false)}
                        className="flex items-center gap-3 p-3 hover:bg-violet-50 dark:hover:bg-slate-800/80 transition-colors group"
                      >
                        <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-1">
                          <img
                            src={prod.imageUrl || "/placeholder.svg"}
                            alt={prod.title}
                            className="h-full w-full object-contain"
                          />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 truncate">
                            {prod.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] capitalize text-slate-400">{prod.category}</span>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">• Instant Delivery</span>
                          </div>
                        </div>
                        <div className="text-xs font-black text-slate-900 dark:text-white shrink-0">
                          ₹{prod.price}
                        </div>
                      </Link>
                    ))}
                    <Link
                      href={`/products?q=${encodeURIComponent(searchQuery)}`}
                      onClick={() => setIsDesktopFocused(false)}
                      className="block p-2.5 text-center text-xs font-bold text-violet-600 dark:text-violet-400 bg-violet-50/50 dark:bg-slate-850 hover:bg-violet-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      View all results for &ldquo;{searchQuery}&rdquo; →
                    </Link>
                  </>
                ) : (
                  <div className="p-4 text-center text-xs text-slate-500">
                    No digital products found matching &ldquo;{searchQuery}&rdquo;
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Actions (Desktop & Mobile) */}
          <div className="flex items-center space-x-2 md:space-x-6 shrink-0">
            {/* Mobile Search Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-slate-700 dark:text-slate-300"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              aria-label="Toggle search"
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* User Account Dropdown (Desktop) */}
            {mounted && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="hidden md:flex gap-1 text-slate-700 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 font-medium relative">
                    <User className="h-4 w-4 text-primary" />
                    <span className="max-w-[100px] truncate">{user.displayName || "Account"}</span>
                    {isGuest && (
                      <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-primary"></span>
                    )}
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    {isGuest ? (
                      <span className="text-red-600 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Guest Account
                      </span>
                    ) : "My Account"}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">My Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">My Orders</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">Downloads</Link>
                  </DropdownMenuItem>

                  {/* Guest: show password set link */}
                  {isGuest && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild className="text-red-600 font-medium bg-red-50">
                        <Link href="/dashboard/confirm-account">🔑 Set Permanent Password</Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  {/* Explicit Admin Link for Admin Email */}
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild className="text-blue-600 font-medium bg-blue-50">
                        <Link href="/admin">Admin Panel</Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden md:block">
                <Button asChild className="bg-primary text-white hover:bg-primary/90 px-8 font-semibold shadow-md">
                  <Link href="/auth/login">
                    Login
                  </Link>
                </Button>
              </div>
            )}

            {/* Theme Toggle (Beta) */}
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="text-slate-700 hover:bg-black/5 dark:text-slate-350 dark:hover:bg-white/10 relative"
                title="Toggle Dark Mode (Beta)"
              >
                {theme === "dark" ? (
                  <div className="relative flex items-center justify-center">
                    <Sun className="h-5 w-5 text-amber-500" />
                    <span className="absolute -top-2.5 -right-2 text-[7px] font-black bg-yellow-500 text-slate-950 px-1 rounded-full scale-90">BETA</span>
                  </div>
                ) : (
                  <div className="relative flex items-center justify-center">
                    <Moon className="h-5 w-5 text-slate-700" />
                    <span className="absolute -top-2.5 -right-2 text-[7px] font-black bg-slate-900 text-white px-1 rounded-full scale-90">BETA</span>
                  </div>
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>
            )}

            {/* Blog Link (Desktop) */}
            <Link
              href="/blog"
              className="hidden lg:flex items-center gap-1.5 text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 font-medium text-sm px-2.5 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <BookOpen className="h-4 w-4 text-purple-600" />
              <span>Blog</span>
            </Link>

            {/* Cart Trigger */}
            <CartDrawer>
              <Button variant="ghost" className="flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10">
                <div className="relative">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  {mounted && totalItems > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-4 w-4 min-w-[16px] p-0 flex items-center justify-center text-[10px] bg-red-600 text-white border-2 border-primary">
                      {totalItems}
                    </Badge>
                  )}
                </div>
                <span className="hidden md:inline font-medium">Cart</span>
              </Button>
            </CartDrawer>

            {/* Note: 3-line hamburger menu removed on mobile as requested (Mobile Bottom Nav is active) */}

          </div>
        </div>
      </header>

      {/* Expandable Mobile Search Bar with Instant 3-Letter Autocomplete */}
      {isSearchOpen && (
        <div className="md:hidden bg-[#fdfaf6] dark:bg-slate-900 border-b border-orange-100/50 dark:border-slate-800 p-2.5 transition-all relative">
          <form
            className="relative w-full flex shadow-sm"
            onSubmit={handleMobileSearchSubmit}
          >
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              autoFocus
              name="q"
              value={mobileSearchQuery}
              onChange={(e) => setMobileSearchQuery(e.target.value)}
              placeholder="Search (type min 3 letters)..."
              className="pl-10 pr-9 rounded-r-none bg-white dark:bg-slate-950 text-gray-900 dark:text-gray-100 border-r-0 dark:border-slate-800 focus-visible:ring-0 placeholder:text-gray-500 h-10 text-sm"
            />
            {mobileSearchQuery && (
              <button
                type="button"
                onClick={() => setMobileSearchQuery("")}
                className="absolute right-20 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <Button type="submit" className="rounded-l-none bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-bold px-4 h-10 text-xs">
              Search
            </Button>
          </form>

          {/* Mobile Autocomplete Live Results */}
          {mobileSearchQuery.trim().length >= 3 && (
            <div className="mt-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
              <div className="p-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 flex justify-between">
                <span>Matching Products ({mobileResults.length})</span>
                <span className="text-violet-600">Tap to open</span>
              </div>
              {mobileResults.length > 0 ? (
                <>
                  {mobileResults.map((prod) => (
                    <Link
                      key={prod.id}
                      href={`/products/${prod.slug || prod.id}`}
                      onClick={() => setIsSearchOpen(false)}
                      className="flex items-center gap-2.5 p-2.5 hover:bg-violet-50 dark:hover:bg-slate-900 transition-colors"
                    >
                      <div className="h-9 w-9 rounded-md bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-0.5">
                        <img
                          src={prod.imageUrl || "/placeholder.svg"}
                          alt={prod.title}
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {prod.title}
                        </p>
                        <p className="text-[10px] text-emerald-600 font-semibold">
                          ₹{prod.price} • Instant Download
                        </p>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    </Link>
                  ))}
                  <Link
                    href={`/products?q=${encodeURIComponent(mobileSearchQuery)}`}
                    onClick={() => setIsSearchOpen(false)}
                    className="block p-2 text-center text-xs font-bold text-violet-600 bg-violet-50 dark:bg-slate-900"
                  >
                    View all results for &ldquo;{mobileSearchQuery}&rdquo; →
                  </Link>
                </>
              ) : (
                <div className="p-3 text-center text-xs text-slate-400">
                  No products found for &ldquo;{mobileSearchQuery}&rdquo;
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
