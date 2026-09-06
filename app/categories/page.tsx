
"use client"
export const runtime = 'edge'

import { useState, useEffect } from "react"
import { StoreHeader } from "@/components/store-header"
import { ProductCard } from "@/components/product-card"
import { Card, CardContent } from "@/components/ui/card"
import { fetchProducts } from "@/lib/d1-client"
import type { Product } from "@/lib/types"
import Link from "next/link"

export default function CategoriesPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const fetchedProducts = await fetchProducts()
        setProducts(fetchedProducts.filter((p: Product) => p.isActive))
      } catch (error) {
        console.error("Failed to load products for categories:", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const categories = Array.from(new Set(products.map((p) => p.category))) as string[]
  const getCategoryProducts = (category: string) => products.filter((p) => p.category === category).slice(0, 4)

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "software":
        return "💻"
      case "template":
        return "🎨"
      case "course":
        return "📚"
      case "ebook":
        return "📖"
      case "plugin":
        return "🔌"
      default:
        return "📦"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <StoreHeader />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl font-bold text-gradient-primary mb-4">Browse Categories</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore our organized collection of digital products by category
          </p>
        </div>

        {loading ? (
          <div className="space-y-12">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-8 bg-muted rounded w-48 mb-6" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="h-96 bg-muted rounded-2xl" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-16">
            {categories.map((category, categoryIndex) => {
              const categoryProducts = getCategoryProducts(category)

              return (
                <div key={category} className={`animate-fade-in-up stagger-${categoryIndex + 1}`}>
                  {/* Category Header */}
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="text-4xl">{getCategoryIcon(category)}</div>
                      <div>
                        <h2 className="text-3xl font-bold text-gradient-secondary">
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </h2>
                        <p className="text-muted-foreground">
                          {products.filter((p) => p.category === category).length} products available
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/products?category=${category}`}
                      className="text-primary hover:text-primary/80 font-semibold transition-colors"
                    >
                      View All →
                    </Link>
                  </div>

                  {/* Category Products */}
                  {categoryProducts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {categoryProducts.map((product, index) => (
                        <div key={product.id} className={`animate-slide-up stagger-${index + 1}`}>
                          <ProductCard product={product} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Card className="border-dashed border-2 border-muted-foreground/20 bg-muted/20">
                      <CardContent className="flex flex-col items-center justify-center py-16">
                        <div className="text-4xl mb-4 opacity-50">📦</div>
                        <h3 className="text-xl font-semibold mb-2">No products yet</h3>
                        <p className="text-muted-foreground text-center">
                          Products in this category will appear here once added by admin
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )
            })}

            {categories.length === 0 && (
              <div className="text-center py-16 animate-fade-in-up">
                <div className="text-6xl mb-4">🏪</div>
                <h3 className="text-2xl font-semibold mb-2">No categories available</h3>
                <p className="text-muted-foreground">Categories will appear here once products are added by admin</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
