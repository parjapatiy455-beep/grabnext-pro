"use client"

import { useState, useEffect } from "react"
import { ProductCard } from "./product-card"
import { ProductGridSkeleton } from "@/components/product-card-skeleton"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchProducts } from "@/lib/d1-client"
import type { Product } from "@/lib/types"
import Link from "next/link"

export function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      const allProducts = await fetchProducts()
      if (Array.isArray(allProducts) && allProducts.length > 0) {
        // Filter active products and slice 4
        const activeProducts = allProducts
          .filter((p: Product) => p && p.isActive)
          .slice(0, 4)
        setProducts(activeProducts)
      } else {
        setProducts([])
      }
    } catch (error) {
      console.error("[v0] Error loading products:", error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-br from-muted/30 via-background to-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <Skeleton className="h-8 w-64 mx-auto" />
            <Skeleton className="h-4 w-96 mx-auto" />
          </div>
          <ProductGridSkeleton count={4} className="grid md:grid-cols-2 lg:grid-cols-4 gap-6" />
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-gradient-to-br from-muted/30 via-background to-muted/20 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-primary opacity-5 rounded-full blur-3xl animate-pulse" />
      <div
        className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-secondary opacity-5 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "2s" }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center space-y-4 mb-12 animate-fade-in-up">
          <h2 className="text-3xl lg:text-4xl font-bold">
            Featured <span className="text-gradient-primary">Products</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Discover our most popular digital products, carefully curated and verified by our admin team.
          </p>
        </div>

        {products.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {products.map((product, index) => (
              <div key={product.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}

        {products.length === 0 && !loading && (
          <div className="text-center py-12 animate-fade-in-up">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                <span className="text-2xl">📦</span>
              </div>
              <h3 className="text-xl font-semibold">No Products Available</h3>
              <p className="text-muted-foreground">
                Our admin team is working on adding amazing digital products. Check back soon!
              </p>
            </div>
          </div>
        )}

        {products.length > 0 && (
          <div className="text-center animate-fade-in-up" style={{ animationDelay: "400ms" }}>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="bg-gradient-primary text-white border-0 hover:bg-gradient-secondary transition-all duration-300 hover:scale-105 hover:shadow-lg animate-glow"
            >
              <Link href="/products">
                View All Products
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
