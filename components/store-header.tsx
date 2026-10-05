"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Search, ShoppingCart, User, Menu, ChevronDown, Package, LayoutGrid, Monitor, BookOpen, AlertTriangle, Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { CartDrawer } from "./cart-drawer"
import { useAuth } from "@/contexts/auth-context"
import { useCart } from "@/contexts/cart-context"
import { ADMIN_EMAIL } from "@/lib/auth"
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

  useEffect(() => {
    setMounted(true)
  }, [])

  const categories = [
    { name: "All Categories", icon: LayoutGrid, href: "/products" },
    { name: "Electronics", icon: Monitor, href: "/products?category=electronics" },
    { name: "Fashion", icon: Package, href: "/products?category=fashion" },
    { name: "Home & Kitchen", icon: BookOpen, href: "/products?category=home" },
  ]

  // Check if user is admin (either by Role OR by Email)
  const isAdmin = userProfile?.role === "admin" || (user?.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
  const isGuest = mounted && user?.isGuest === true;

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

          {/* Search Bar - Wide & Central */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-4">
            <form
              className="relative w-full flex shadow-sm"
              onSubmit={(e) => {
                e.preventDefault()
                const q = (e.currentTarget.querySelector('input') as HTMLInputElement)?.value?.trim()
                if (q) window.location.href = `/products?q=${encodeURIComponent(q)}`
                else window.location.href = '/products'
              }}
            >
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                name="q"
                placeholder="Search for products, brands and more"
                className="pl-10 rounded-r-none bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 border-r-0 dark:border-slate-800 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-500 dark:placeholder:text-gray-400 h-10"
              />
              <Button type="submit" className="rounded-l-none bg-yellow-400 dark:bg-yellow-500 text-gray-900 dark:text-slate-950 hover:bg-yellow-500 dark:hover:bg-yellow-600 border border-l-0 dark:border-slate-800 font-medium px-6 h-10">
                Search
              </Button>
            </form>
          </div>

          {/* Mobile Search Toggle & Right Actions */}
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

            {/* User Account Dropdown */}
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

            {/* Blog Link */}
            <Link
              href="/blog"
              className="hidden lg:flex items-center gap-1.5 text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 font-medium text-sm px-2.5 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <BookOpen className="h-4 w-4 text-purple-600" />
              <span>Blog</span>
            </Link>

            {/* Cart */}
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

            {/* Mobile Menu Trigger */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden text-slate-700 hover:bg-black/5">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="flex flex-col space-y-6 mt-6">
                  {isGuest && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-red-700 text-sm font-medium flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Guest Account
                      </p>
                      <p className="text-red-600 text-xs mt-1">Please set a permanent password to secure your account.</p>
                      <Link href="/dashboard/confirm-account" className="text-xs text-red-700 underline font-semibold mt-1 block">
                        Set Password →
                      </Link>
                    </div>
                  )}
                  
                  {/* Mobile Theme Switcher */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg border-b pb-2 flex items-center justify-between">
                      <span>Theme</span>
                      <span className="text-[10px] font-black bg-yellow-400 text-slate-900 px-2 py-0.5 rounded-full uppercase tracking-wider scale-90">Beta</span>
                    </h3>
                    {mounted && (
                      <Button 
                        variant="outline" 
                        className="w-full justify-between font-semibold"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                      >
                        <span className="flex items-center gap-2">
                          {theme === "dark" ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-slate-700" />}
                          {theme === "dark" ? "Light Mode" : "Dark Mode"}
                        </span>
                        <span className="text-[11px] text-muted-foreground">Switch</span>
                      </Button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg border-b pb-2">Categories</h3>
                    {categories.map((cat) => (
                      <Link
                        key={cat.name}
                        href={cat.href}
                        className="flex items-center gap-3 text-muted-foreground hover:text-blue-600 transition-colors"
                      >
                        <cat.icon className="h-4 w-4" />
                        {cat.name}
                      </Link>
                    ))}
                    <Link
                      href="/blog"
                      className="flex items-center gap-3 text-purple-600 dark:text-purple-400 font-semibold transition-colors"
                    >
                      <BookOpen className="h-4 w-4" />
                      Digital Products Blog & Guides
                    </Link>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg border-b pb-2">Account</h3>
                    {mounted && user ? (
                      <>
                        <Button asChild variant="ghost" className="w-full justify-start">
                          <Link href="/dashboard">My Dashboard</Link>
                        </Button>
                        <Button asChild variant="ghost" className="w-full justify-start">
                          <Link href="/dashboard">My Orders</Link>
                        </Button>
                        {isGuest && (
                          <Button asChild variant="destructive" className="w-full">
                            <Link href="/dashboard/confirm-account">🔑 Set Permanent Password</Link>
                          </Button>
                        )}
                        {isAdmin && (
                          <Button asChild variant="default" className="w-full">
                            <Link href="/admin">Admin Panel</Link>
                          </Button>
                        )}
                      </>
                    ) : (
                      <Button asChild className="w-full">
                        <Link href="/auth/login">Login</Link>
                      </Button>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Expandable Mobile Search Bar */}
      {isSearchOpen && (
        <div className="md:hidden bg-[#fdfaf6] dark:bg-slate-900 border-b border-orange-100/50 dark:border-slate-800 p-2.5 transition-all">
          <form
            className="relative w-full flex shadow-sm"
            onSubmit={(e) => {
              e.preventDefault()
              const q = (e.currentTarget.querySelector('input') as HTMLInputElement)?.value?.trim()
              if (q) window.location.href = `/products?q=${encodeURIComponent(q)}`
              else window.location.href = '/products'
            }}
          >
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              autoFocus
              name="q"
              placeholder="Search products, templates, bundles..."
              className="pl-10 rounded-r-none bg-white dark:bg-slate-950 text-gray-900 dark:text-gray-100 border-r-0 dark:border-slate-800 focus-visible:ring-0 placeholder:text-gray-500 h-10 text-sm"
            />
            <Button type="submit" className="rounded-l-none bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-semibold px-4 h-10">
              Search
            </Button>
          </form>
        </div>
      )}
    </div>
  )
}