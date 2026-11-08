"use client"

export const runtime = 'edge'

import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { StoreHeader } from "@/components/store-header"
import { ProductCard } from "@/components/product-card"
import { ProductGridSkeleton } from "@/components/product-card-skeleton"
import { Footer } from "@/components/footer"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Search, SlidersHorizontal, X, ChevronDown, ChevronUp, Sparkles, Zap } from "lucide-react"
import { fetchProducts, fetchCategories } from "@/lib/d1-client"
import type { Product } from "@/lib/types"

export function ProductsContent() {
    const searchParams = useSearchParams()
    const urlQ = searchParams?.get("q") || ""
    const urlCategory = searchParams?.get("category") || null

    const [products, setProducts] = useState<Product[]>([])
    const [categories, setCategories] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState(urlQ)
    const [selectedCategory, setSelectedCategory] = useState<string | null>(urlCategory)
    const [sortBy, setSortBy] = useState<"featured" | "newest" | "price-asc" | "price-desc" | "popular">("featured")
    const [showFilters, setShowFilters] = useState(false)
    const [maxProductPrice, setMaxProductPrice] = useState(10000)
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000])

    const loadData = useCallback(async () => {
        try {
            const [prods, cats] = await Promise.all([fetchProducts(), fetchCategories()])
            const active = (prods as Product[]).filter((p) => p.isActive)
            setProducts(active)
            const prices = active.map((p) => p.price).filter(Boolean)
            const max = prices.length > 0 ? Math.ceil(Math.max(...prices) / 500) * 500 : 10000
            setMaxProductPrice(max)
            setPriceRange([0, max])
            setCategories(Array.isArray(cats) ? cats : [])
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadData()
        const onVisible = () => { if (document.visibilityState === 'visible') loadData() }
        document.addEventListener('visibilitychange', onVisible)
        return () => document.removeEventListener('visibilitychange', onVisible)
    }, [loadData])

    // Sync from URL params on mount
    useEffect(() => { setSearchTerm(urlQ) }, [urlQ])
    useEffect(() => { setSelectedCategory(urlCategory) }, [urlCategory])

    const filtered = products
        .filter((p) => {
            const matchSearch = !searchTerm ||
                p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.category?.toLowerCase().includes(searchTerm.toLowerCase())
            const matchCat = !selectedCategory || p.category === selectedCategory
            const matchPrice = p.price >= priceRange[0] && p.price <= priceRange[1]
            return matchSearch && matchCat && matchPrice
        })
        .sort((a, b) => {
            if (sortBy === "featured") {
                const orderA = a.displayOrder && a.displayOrder > 0 ? a.displayOrder : 999999
                const orderB = b.displayOrder && b.displayOrder > 0 ? b.displayOrder : 999999
                if (orderA !== orderB) return orderA - orderB
                return Number(b.createdAt || 0) - Number(a.createdAt || 0)
            }
            if (sortBy === "price-asc") return a.price - b.price
            if (sortBy === "price-desc") return b.price - a.price
            if (sortBy === "popular") return (b.salesCount || 0) - (a.salesCount || 0)
            return Number(b.createdAt || 0) - Number(a.createdAt || 0)
        })

    const categoryMap: Record<string, string> = {}
    categories.forEach((c) => { categoryMap[c.slug] = c.name })
    const uniqueCategorySlugs = Array.from(new Set(products.map(p => p.category).filter(Boolean)))
    const formatPrice = (v: number) => `₹${v.toLocaleString("en-IN")}`
    const hasActiveFilters = !!searchTerm || !!selectedCategory || priceRange[0] > 0 || priceRange[1] < maxProductPrice

    const clearAll = () => {
        setSearchTerm("")
        setSelectedCategory(null)
        setPriceRange([0, maxProductPrice])
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col text-slate-900 dark:text-slate-100 transition-colors">
            <StoreHeader />

            <main className="flex-1 container mx-auto px-3 sm:px-4 pt-4 pb-24 md:py-6 max-w-7xl">
                
                {/* Modern Compact Heading */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2.5 mb-4 sm:mb-5">
                    <div>
                        <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-violet-700 dark:text-violet-300 bg-violet-100/80 dark:bg-violet-950/60 px-2.5 py-0.5 rounded-full mb-1.5 border border-violet-200 dark:border-violet-800">
                            <Zap className="w-3 h-3 fill-current text-violet-600" />
                            <span>Digital Store Catalog</span>
                        </div>
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                            Explore Digital Products &amp; Bundles
                        </h1>
                    </div>
                    <div className="text-xs font-semibold text-slate-650 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-full w-fit shadow-xs">
                        {loading ? "Loading..." : `${filtered.length} products found`}
                    </div>
                </div>

                {/* Search & Filter Bar */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3 shadow-xs mb-3.5 space-y-3">
                    <div className="flex flex-col sm:flex-row items-center gap-2.5">
                        
                        {/* Instant Search Bar */}
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search by title, category, keywords..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-9 h-10 text-sm rounded-xl bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus-visible:ring-violet-500"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                                    aria-label="Clear search"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        {/* Controls (Sort & Filter) */}
                        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="flex-1 sm:flex-initial h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
                            >
                                <option value="featured">⚡ Featured</option>
                                <option value="popular">🔥 Most Popular</option>
                                <option value="newest">✨ Newest First</option>
                                <option value="price-asc">Price: Low to High</option>
                                <option value="price-desc">Price: High to Low</option>
                            </select>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowFilters(!showFilters)}
                                className="h-10 px-3.5 rounded-xl border-slate-200 dark:border-slate-700 gap-1.5 text-xs font-bold shrink-0 bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-200"
                            >
                                <SlidersHorizontal className="h-3.5 w-3.5" />
                                Price
                                {showFilters ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                            </Button>
                        </div>
                    </div>

                    {/* Expandable Price Range Filter */}
                    {showFilters && (
                        <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                            <div className="max-w-md">
                                <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    <span>Price Range:</span>
                                    <span className="text-violet-600 dark:text-violet-400">{formatPrice(priceRange[0])} – {formatPrice(priceRange[1])}</span>
                                </div>
                                <Slider
                                    min={0}
                                    max={maxProductPrice}
                                    step={50}
                                    value={priceRange}
                                    onValueChange={(v) => setPriceRange(v as [number, number])}
                                    className="w-full"
                                />
                                <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                                    <span>{formatPrice(0)}</span>
                                    <span>{formatPrice(maxProductPrice)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Single Sleek Category Chips Row */}
                <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className={`text-xs px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap shrink-0 transition-all active:scale-95 ${
                            selectedCategory === null
                                ? "bg-slate-900 text-white dark:bg-violet-600 dark:text-white shadow-xs"
                                : "bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                    >
                        ✨ All Collections
                    </button>
                    {uniqueCategorySlugs.map((slug) => (
                        <button
                            key={slug}
                            onClick={() => setSelectedCategory(slug === selectedCategory ? null : slug)}
                            className={`text-xs px-3.5 py-1.5 rounded-full font-semibold capitalize whitespace-nowrap shrink-0 transition-all active:scale-95 ${
                                selectedCategory === slug
                                    ? "bg-slate-900 text-white dark:bg-violet-600 dark:text-white shadow-xs"
                                    : "bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                        >
                            {categoryMap[slug] || slug}
                        </button>
                    ))}
                </div>

                {/* Active filters bar if active */}
                {hasActiveFilters && (
                    <div className="flex items-center justify-between mb-3.5 text-xs text-slate-500">
                        <span>Showing filtered results</span>
                        <button onClick={clearAll} className="text-violet-600 dark:text-violet-400 font-bold hover:underline flex items-center gap-1">
                            <X className="h-3 w-3" /> Reset all filters
                        </button>
                    </div>
                )}

                {/* Product Grid */}
                {loading ? (
                    <ProductGridSkeleton
                        count={10}
                        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4"
                    />
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6">
                        <div className="text-4xl mb-3">🔍</div>
                        <h3 className="text-base font-bold mb-1 text-slate-800 dark:text-slate-200">No matching products found</h3>
                        <p className="text-xs text-slate-400 mb-4">Try searching with a different term or clear filters.</p>
                        {hasActiveFilters && (
                            <Button size="sm" onClick={clearAll} className="bg-slate-900 text-white rounded-xl">
                                Clear Filters
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4">
                        {filtered.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}

            </main>

            <Footer />
        </div>
    )
}
