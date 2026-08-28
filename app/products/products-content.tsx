"use client"

export const runtime = 'edge'

import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { StoreHeader } from "@/components/store-header"
import { ProductCard } from "@/components/product-card"
import { Footer } from "@/components/footer"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Search, SlidersHorizontal, X, ChevronDown, ChevronUp } from "lucide-react"
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
        // Re-fetch whenever user returns to this page (after submitting a review)
        const onVisible = () => { if (document.visibilityState === 'visible') loadData() }
        document.addEventListener('visibilitychange', onVisible)
        return () => document.removeEventListener('visibilitychange', onVisible)
    }, [loadData])

    // Sync from URL params on mount
    useEffect(() => { setSearchTerm(urlQ) }, [urlQ])
    useEffect(() => { setSelectedCategory(urlCategory) }, [urlCategory])

    const filtered = products
        .filter((p) => {
            const matchSearch = !searchTerm || p.title.toLowerCase().includes(searchTerm.toLowerCase()) || p.description?.toLowerCase().includes(searchTerm.toLowerCase()) || p.category.toLowerCase().includes(searchTerm.toLowerCase())
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
    const uniqueCategorySlugs = Array.from(new Set(products.map(p => p.category)))
    const formatPrice = (v: number) => `₹${v.toLocaleString("en-IN")}`
    const hasActiveFilters = !!searchTerm || !!selectedCategory || priceRange[0] > 0 || priceRange[1] < maxProductPrice

    const clearAll = () => { setSearchTerm(""); setSelectedCategory(null); setPriceRange([0, maxProductPrice]) }

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col">
            <StoreHeader />

            <main className="flex-1 container mx-auto px-3 md:px-4 py-5">
                {/* Filter Bar */}
                <div className="bg-white rounded-xl shadow-sm p-3 mb-4 flex flex-col gap-3">
                    <div className="flex gap-3 items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 h-9 text-sm" />
                            {searchTerm && (
                                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setSearchTerm("")}>
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}
                            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none h-9">
                            <option value="featured">Featured (Admin Order)</option>
                            <option value="newest">Newest</option>
                            <option value="popular">Popular</option>
                            <option value="price-asc">Price ↑</option>
                            <option value="price-desc">Price ↓</option>
                        </select>
                        <Button variant="outline" size="sm" className="gap-1.5 h-9 shrink-0" onClick={() => setShowFilters(!showFilters)}>
                            <SlidersHorizontal className="h-3.5 w-3.5" />
                            Filters
                            {showFilters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </Button>
                    </div>

                    {showFilters && (
                        <div className="border-t pt-3 flex flex-col sm:flex-row gap-5">
                            {/* Price Range */}
                            <div className="flex-1">
                                <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                                    Price: <span className="text-primary font-bold">{formatPrice(priceRange[0])} – {formatPrice(priceRange[1])}</span>
                                </p>
                                <Slider min={0} max={maxProductPrice} step={100} value={priceRange}
                                    onValueChange={(v) => setPriceRange(v as [number, number])} className="w-full" />
                                <div className="flex justify-between text-xs text-gray-400 mt-1">
                                    <span>{formatPrice(0)}</span>
                                    <span>{formatPrice(maxProductPrice)}</span>
                                </div>
                            </div>
                            {/* Category */}
                            <div className="flex-1">
                                <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Category</p>
                                <div className="flex flex-wrap gap-1.5">
                                    <button onClick={() => setSelectedCategory(null)}
                                        className={`text-xs px-3 py-1 rounded-full border transition-colors ${selectedCategory === null ? "bg-primary text-white border-primary" : "bg-white border-gray-200 hover:border-primary"}`}>All</button>
                                    {uniqueCategorySlugs.map((slug) => (
                                        <button key={slug} onClick={() => setSelectedCategory(slug === selectedCategory ? null : slug)}
                                            className={`text-xs px-3 py-1 rounded-full border capitalize transition-colors ${selectedCategory === slug ? "bg-primary text-white border-primary" : "bg-white border-gray-200 hover:border-primary"}`}>
                                            {categoryMap[slug] || slug}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Category chips row */}
                <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
                    <button onClick={() => setSelectedCategory(null)}
                        className={`text-xs px-4 py-1.5 rounded-full border whitespace-nowrap shrink-0 transition-colors ${selectedCategory === null ? "bg-primary text-white border-primary" : "bg-white border-gray-200 hover:border-primary"}`}>All</button>
                    {uniqueCategorySlugs.map((slug) => (
                        <button key={slug} onClick={() => setSelectedCategory(slug === selectedCategory ? null : slug)}
                            className={`text-xs px-4 py-1.5 rounded-full border capitalize whitespace-nowrap shrink-0 transition-colors ${selectedCategory === slug ? "bg-primary text-white border-primary" : "bg-white border-gray-200 hover:border-primary"}`}>
                            {categoryMap[slug] || slug}
                        </button>
                    ))}
                </div>

                {/* Result count + clear */}
                <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-500">{loading ? "Loading..." : `${filtered.length} product${filtered.length !== 1 ? "s" : ""} found`}</p>
                    {hasActiveFilters && (
                        <button onClick={clearAll} className="text-xs text-primary underline flex items-center gap-1">
                            <X className="h-3 w-3" /> Clear filters
                        </button>
                    )}
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {[...Array(10)].map((_, i) => <div key={i} className="h-72 bg-white rounded-xl animate-pulse" />)}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl">
                        <div className="text-5xl mb-4">🔍</div>
                        <h3 className="text-lg font-semibold mb-2 text-gray-700">No products found</h3>
                        <p className="text-sm text-gray-400 mb-4">{hasActiveFilters ? "Try adjusting your filters." : "No products available right now."}</p>
                        {hasActiveFilters && <Button size="sm" variant="outline" onClick={clearAll}>Clear Filters</Button>}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {filtered.map((product) => <ProductCard key={product.id} product={product} />)}
                    </div>
                )}
            </main>
            <Footer />
        </div>
    )
}
