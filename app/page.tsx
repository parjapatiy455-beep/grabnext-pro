"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { StoreHeader } from "@/components/store-header"
import { Footer } from "@/components/footer"
import { ProductCard } from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { fetchProducts, fetchCategories } from "@/lib/d1-client"
import type { Product } from "@/lib/types"
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"

// ─── Carousel ───────────────────────────────────────────────────────────────
function useBannerCarousel(total: number) {
  const [idx, setIdx] = useState(0)
  const next = useCallback(() => setIdx((i) => (i + 1) % total), [total])
  const prev = useCallback(() => setIdx((i) => (i - 1 + total) % total), [total])
  useEffect(() => {
    if (total < 2) return
    const t = setInterval(next, 4500)
    return () => clearInterval(t)
  }, [next, total])
  return { idx, next, prev, setIdx }
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [banners, setBanners] = useState<any[]>([])   // empty = no carousel shown
  const [loading, setLoading] = useState(true)

  const { idx, next, prev, setIdx } = useBannerCarousel(banners.length)

  const loadProducts = useCallback(async () => {
    try {
      const [prods, cats] = await Promise.all([fetchProducts(), fetchCategories()])
      setProducts(Array.isArray(prods) ? (prods as Product[]).filter((p) => p.isActive) : [])
      setCategories(Array.isArray(cats) ? cats.filter((c) => c.isActive !== 0) : [])
      // Banners — only real ones from admin, no fallback dummies
      try {
        const res = await fetch("/api/banners", { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data) && data.length > 0) setBanners(data)
        }
      } catch { /* banners optional */ }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProducts()
    // Re-fetch when user returns to page (e.g. after submitting a review)
    const onVisible = () => { if (document.visibilityState === 'visible') loadProducts() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [loadProducts])

  const featured = products

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col text-slate-900 dark:text-slate-100 transition-colors">
      <StoreHeader />

      {/* Category Quick-Nav */}
      {categories.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 shadow-sm transition-colors">
          <div className="container mx-auto px-4 py-2 overflow-x-auto scrollbar-hide">
            <div className="flex gap-5 min-w-max">
              {categories.slice(0, 12).map((cat) => (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.slug}`}
                  className="flex flex-col items-center gap-1 group min-w-[56px]"
                >
                  <div className="h-11 w-11 rounded-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent group-hover:border-primary transition-all overflow-hidden flex items-center justify-center">
                    {cat.imageUrl
                      ? <img src={cat.imageUrl} alt={cat.name} className="h-full w-full object-cover" />
                      : <span className="text-lg font-bold text-slate-300">{cat.name[0]}</span>
                    }
                  </div>
                  <span className="text-[10px] font-semibold text-slate-650 dark:text-slate-400 group-hover:text-primary text-center leading-tight">
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 container mx-auto px-3 md:px-4 py-4 space-y-5">

        {/* Banner Carousel — only if admin added banners */}
        {banners.length > 0 && (
          <div className="relative rounded-2xl overflow-hidden w-full aspect-[2/1] md:max-h-[512px] shadow-md group">
            {banners.map((b, i) => {
              const isHex = b.bgColor?.startsWith("#")
              return (
                <Link
                  key={b.id}
                  href={b.linkUrl && b.linkUrl.trim() !== "" ? b.linkUrl.trim() : "/products"}
                  className={`block absolute inset-0 transition-opacity duration-700 cursor-pointer ${i === idx ? "opacity-100 z-10" : "opacity-0 z-0"} ${!isHex ? `bg-gradient-to-r ${b.bgColor || "from-blue-600 to-indigo-700"}` : ""}`}
                  style={isHex ? { background: b.bgColor } : {}}
                >
                  {b.imageUrl && (
                    <img 
                      src={b.imageUrl} 
                      alt={b.title || "Banner"} 
                      fetchPriority={i === 0 ? "high" : "low"}
                      loading={i === 0 ? "eager" : "lazy"}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-[1.01]" 
                    />
                  )}
                </Link>
              )
            })}
            {banners.length > 1 && (
              <>
                <button onClick={(e) => { e.preventDefault(); prev(); }} className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow transition-colors">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button onClick={(e) => { e.preventDefault(); next(); }} className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow transition-colors">
                  <ChevronRight className="h-5 w-5" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                  {banners.map((_, i) => (
                    <button key={i} onClick={(e) => { e.preventDefault(); setIdx(i); }}
                      className={`h-2 rounded-full transition-all ${i === idx ? "w-6 bg-white shadow-sm" : "w-2 bg-white/50 hover:bg-white/70"}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* All Products */}
        <section className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-5 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">All Products</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Browse all our products</p>
            </div>
            <Button asChild variant="outline" size="sm" className="text-xs h-8">
              <Link href="/products">View All <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => <div key={i} className="rounded-xl bg-gray-100 dark:bg-slate-800 animate-pulse h-60" />)}
            </div>
          ) : featured.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-slate-400 text-sm">No products yet.</p>
              <Button asChild variant="outline" className="mt-3" size="sm"><Link href="/admin/products">Add Products →</Link></Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {featured.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </section>

        {/* Category Cards */}
        {categories.length > 0 && (
          <section className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-5 shadow-sm transition-colors">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Shop by Category</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {categories.slice(0, 12).map((cat) => (
                <Link key={cat.id} href={`/products?category=${cat.slug}`}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-100 dark:border-slate-800/80 hover:border-primary hover:shadow-sm transition-all group">
                  <div className="h-12 w-12 rounded-full overflow-hidden bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-gray-100 dark:border-slate-800">
                    {cat.imageUrl
                      ? <img src={cat.imageUrl} alt={cat.name} className="h-full w-full object-cover" />
                      : <span className="text-xl font-bold text-slate-300">{cat.name[0]}</span>
                    }
                  </div>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-primary text-center leading-tight">{cat.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

      </main>
      <Footer />
    </div>
  )
}