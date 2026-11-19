"use client"

import type React from "react"
import { useAuth } from "@/contexts/auth-context"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ADMIN_EMAIL } from "@/lib/auth"
import { Loader2, Menu, X, Store } from "lucide-react"
import { AdminSidebar } from "@/components/admin-sidebar"
import Link from "next/link"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isBuilder = pathname?.includes('/landing-page')

  // Automatically close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!loading) {
      // Check if user is admin either by DB role or by hardcoded email
      const isAdmin = userProfile?.role === "admin" || (user?.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase())

      if (!user || !isAdmin) {
        router.push("/")
      } else {
        setIsAuthorized(true)
      }
    }
  }, [user, userProfile, loading, router])

  if (loading || !isAuthorized) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-slate-500 font-medium">Verifying access...</span>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">
      {/* Desktop Sticky Sidebar — Pinned 100vh height, never scrolls with page */}
      {!isBuilder && (
        <aside className="hidden md:flex h-screen w-64 shrink-0 flex-col sticky top-0 z-30">
          <AdminSidebar className="w-64 h-full" />
        </aside>
      )}

      {/* Mobile Drawer Overlay */}
      {!isBuilder && mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white shadow-2xl flex flex-col h-full animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button at top */}
            <div className="absolute top-3.5 right-3.5 z-20">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <AdminSidebar onNavigate={() => setMobileMenuOpen(false)} className="w-full h-full" />
          </div>
        </div>
      )}

      {/* Main Content Column */}
      <div className="flex flex-1 flex-col h-screen min-w-0 overflow-hidden">
        {/* Mobile Top Header Bar */}
        {!isBuilder && (
          <header className="md:hidden sticky top-0 z-20 flex items-center justify-between px-4 py-2.5 bg-white border-b border-slate-200 shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="p-1.5 -ml-1 text-slate-700 hover:bg-slate-100 rounded-lg focus:outline-none transition-colors"
                aria-label="Open Admin Menu"
              >
                <Menu className="h-6 w-6" />
              </button>
              <Link href="/admin" className="flex items-center gap-2 font-bold text-sm text-slate-900">
                <div className="bg-slate-900 text-white p-1 rounded-md">
                  <Store className="h-3.5 w-3.5 text-emerald-400" />
                </div>
                <span>Admin Panel</span>
              </Link>
            </div>
            <Link
              href="/"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white transition-colors"
            >
              Store
            </Link>
          </header>
        )}

        {/* Scrollable Page Content — Only this scrolls on desktop & mobile */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}
