"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { StoreHeader } from "@/components/store-header"
import { Footer } from "@/components/footer"
import { ProductCard } from "@/components/product-card"
import { ProductGridSkeleton } from "@/components/product-card-skeleton"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { fetchProducts, fetchCategories } from "@/lib/d1-client"
import type { Product } from "@/lib/types"
import type { HomeCategory, HomeBanner } from "@/lib/home-data"
import { ArrowRight, ChevronLeft, ChevronRight, ShieldCheck, Zap, Award, HelpCircle, BookOpen } from "lucide-react"
import { BLOG_POSTS } from "@/lib/blog-data"
import { HeroSection } from "@/components/hero-section"

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

const FAQ_ITEMS = [
  {
    q: "Grabnext par digital products buy kaise karein?",
    a: "Aap kisi bhi product par click karke Cart me add kar sakte hain aur UPI (Google Pay, PhonePe, Paytm, QR) se instant checkout kar sakte hain. Payment hote hi download link email aur screen par mil jata hai."
  },
  {
    q: "Kya sabhi digital products par instant download milta hai?",
    a: "Haan! Sabhi software, video editing bundles, Canva templates, aur masterclasses instant auto-delivery system ke dwara provide kiye jate hain."
  },
  {
    q: "Grabnext par software aur templates safe hain?",
    a: "Bilkul! Hum 100% verified digital tools, source code, templates, aur masterclass courses provide karte hain with 24/7 WhatsApp customer support."
  }
]

interface HomePageClientProps {
  initialProducts?: Product[]
  initialCategories?: HomeCategory[]
  initialBanners?: HomeBanner[]
}

export function HomePageClient({
  initialProducts = [],
  initialCategories = [],
  initialBanners = []
}: HomePageClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [categories, setCategories] = useState<HomeCategory[]>(initialCategories)
  const [banners, setBanners] = useState<HomeBanner[]>(initialBanners)
  const [loading, setLoading] = useState(initialProducts.length === 0)

  const { idx, next, prev, setIdx } = useBannerCarousel(banners.length)

  // Background revalidation or fallback if SSR had empty lists
  const loadFreshData = useCallback(async () => {
    try {
      const [prods, cats] = await Promise.all([fetchProducts(), fetchCategories()])
      if (Array.isArray(prods) && prods.length > 0) {
        setProducts((prods as Product[]).filter((p) => p.isActive))
      }
      if (Array.isArray(cats) && cats.length > 0) {
        setCategories(cats.filter((c: any) => c.isActive !== 0))
      }
      try {
        const res = await fetch("/api/banners")
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data) && data.length > 0) {
            setBanners(data)
          }
        }
      } catch { /* optional */ }
    } catch (e) {
      console.error("[HomePageClient] Background refresh error:", e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // If SSR provided no products (rare fallback), fetch immediately
    if (initialProducts.length === 0) {
      loadFreshData()
    }
    // Re-fetch when user returns to tab (e.g. after submitting a review or completing purchase)
    const onVisible = () => { if (document.visibilityState === 'visible') loadFreshData() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [initialProducts.length, loadFreshData])

  const featured = products

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* FAQ Schema Markup for Google Search Rich Snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": FAQ_ITEMS.map((f) => ({
              "@type": "Question",
              "name": f.q,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": f.a
              }
            }))
          })
        }}
      />

      <StoreHeader />

      {/* SEO & Conversion Hero Section (DigiGrowPro Style) */}
      <HeroSection customBanner={banners && banners.length > 0 ? banners[0] : null} />

      {/* Category Quick-Nav */}
      {categories.length > 0 ? (
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
      ) : loading ? (
        <div className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 shadow-sm">
          <div className="container mx-auto px-4 py-2 overflow-x-auto scrollbar-hide">
            <div className="flex gap-5 min-w-max">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5 min-w-[56px]">
                  <Skeleton className="h-11 w-11 rounded-full" />
                  <Skeleton className="h-2.5 w-12 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <main className="flex-1 container mx-auto px-3 md:px-4 py-4 space-y-6">

        {/* Banner Carousel — only if admin added banners */}
        {banners.length > 0 && (
          <div className="relative rounded-2xl overflow-hidden w-full aspect-[2/1] md:max-h-[512px] shadow-md group">
            {banners.map((b, i) => {
              const isHex = b.bgColor?.startsWith("#")
              return (
                <Link
                  key={b.id}
                  href={b.linkUrl && b.linkUrl.trim() !== "" ? b.linkUrl.trim() : "/software"}
                  className={`block absolute inset-0 transition-opacity duration-700 cursor-pointer ${i === idx ? "opacity-100 z-10" : "opacity-0 z-0"} ${!isHex ? `bg-gradient-to-r ${b.bgColor || "from-blue-600 to-indigo-700"}` : ""}`}
                  style={isHex ? { background: b.bgColor } : {}}
                >
                  {b.imageUrl && (
                    <img 
                      src={b.imageUrl} 
                      alt={b.title || "Banner"} 
                      fetchPriority={i === 0 ? "high" : "low"}
                      loading={i === 0 ? "eager" : "lazy"}
                      decoding="async"
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
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">All Digital Products & Software</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Explore best-selling templates, courses, assets & software</p>
            </div>
            <Button asChild variant="outline" size="sm" className="text-xs h-8">
              <Link href="/products">View All <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </div>
          {loading ? (
            <ProductGridSkeleton count={8} />
          ) : featured.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-slate-400 text-sm">Products loading or updating soon.</p>
              <Button asChild variant="outline" className="mt-3" size="sm">
                <Link href="/products">Browse All Collections →</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {featured.map((p, i) => (
                <ProductCard 
                  key={p.id} 
                  product={p} 
                  priority={i < 4}
                />
              ))}
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

        {/* Latest Digital Products Guides & SEO Blog Section */}
        <section className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-5 shadow-sm transition-colors space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400">
                <BookOpen className="h-3.5 w-3.5" />
                <span>Knowledge & Guides</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                Digital Products, Software & Growth Guides
              </h2>
            </div>
            <Button asChild variant="outline" size="sm" className="text-xs h-8">
              <Link href="/blog">View All Guides <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {BLOG_POSTS.slice(0, 3).map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group flex flex-col rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-4 hover:border-purple-300 dark:hover:border-purple-600 transition-all shadow-2xs hover:shadow-sm"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                  <span className="font-semibold text-purple-600 dark:text-purple-400">{post.category}</span>
                  <span>{post.readTime}</span>
                </div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-snug group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
                  {post.excerpt}
                </p>
                <div className="mt-auto pt-3 flex items-center text-xs font-semibold text-purple-600 dark:text-purple-400 gap-1 group-hover:underline">
                  <span>Read Guide</span>
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Dedicated SEO Keyword Content Block for Googlebot Indexing */}
        <section className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-colors space-y-4">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Why Choose Grabnext for Buying Digital Products in India?
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Grabnext is India's leading digital download marketplace offering high-quality <strong>software source codes</strong>, <strong>video editing bundles</strong> (Premiere Pro, After Effects, LUTs, FX presets), <strong>Canva design templates</strong>, <strong>Instagram reels bundles</strong>, and <strong>online masterclass courses</strong> at unbeatable prices.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1">⚡ Instant UPI Downloads</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Pay via Google Pay, PhonePe, Paytm or UPI ID and get instant download links sent straight to your email.</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1">🛡️ Lifetime Access & Support</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">All digital assets come with lifetime access links and dedicated WhatsApp customer support.</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1">💰 Unbeatable INR Prices</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Get premium masterclasses and digital product bundles starting at just ₹49 to ₹199.</p>
            </div>
          </div>
        </section>

        {/* Visible FAQ Accordion for Search Crawlers */}
        <section className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-colors">
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">{item.q}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* Trust & Guarantee Banner */}
      <section className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white py-6 px-4 border-t border-indigo-500/20 mt-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
            Grabnext — Verified Digital Products, Templates &amp; Masterclasses
          </h2>
          <p className="text-xs sm:text-sm text-indigo-200 font-medium max-w-2xl mx-auto">
            India&#39;s trusted marketplace for high-converting design templates, video editing bundles, AI prompts &amp; creator resources with instant delivery.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-3 text-[11px] text-amber-300 font-semibold">
            <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> Instant UPI Download</span>
            <span>•</span>
            <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> 100% Secure Payment</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5" /> Best Price Guarantee</span>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}
