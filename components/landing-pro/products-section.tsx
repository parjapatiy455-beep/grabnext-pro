"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ProductCard } from "@/components/product-card"
import { TiltCard } from "@/components/3d/tilt-card"
import { Button } from "@/components/ui/button"
import { fetchProducts, fetchCategories } from "@/lib/d1-client"
import type { Product } from "@/lib/types"
import { Sparkles, ArrowRight, Filter, Search, ShieldCheck } from "lucide-react"

export function ProductsSection() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [prods, cats] = await Promise.all([fetchProducts(), fetchCategories()])
        const activeProds = Array.isArray(prods)
          ? (prods as Product[]).filter((p) => p.isActive)
          : []
        const activeCats = Array.isArray(cats)
          ? cats.filter((c) => c.isActive !== 0)
          : []

        setProducts(activeProds)
        setCategories(activeCats)
      } catch (err) {
        console.error("Failed to load products in ProductsSection:", err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter(
          (p) => p.category?.toLowerCase() === selectedCategory.toLowerCase()
        )

  return (
    <section className="py-20 bg-white dark:bg-slate-950 relative">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Verified Store Collection</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Explore Our{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent">
                Trending Digital Products
              </span>
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
              Handpicked, production-tested software, source code, UI templates, and masterclasses.
            </p>
          </div>

          <Button
            asChild
            variant="outline"
            className="self-start md:self-auto border-slate-300 dark:border-slate-700 hover:border-indigo-500 font-semibold text-xs px-5 py-2.5 rounded-xl"
          >
            <Link href="/products" className="flex items-center gap-2">
              <span>View Full Catalog</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Category Filters Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedCategory === "all"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
            }`}
          >
            All Products ({products.length})
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.slug
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap capitalize ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                    : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                {cat.name}
              </button>
            )
          })}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-80 rounded-2xl bg-slate-100 dark:bg-slate-900 animate-pulse border border-slate-200/50 dark:border-slate-800"
              />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800">
            <div className="h-12 w-12 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              No products found in this category
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
              Explore our full store or check back soon for new drops.
            </p>
            <Button
              onClick={() => setSelectedCategory("all")}
              size="sm"
              className="bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-xl"
            >
              Reset Category Filter
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <TiltCard key={product.id} scale={1.02} perspective={900}>
                <ProductCard product={product} />
              </TiltCard>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
