"use client"

import Link from "next/link"
import { ShoppingCart, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useCart } from "@/contexts/cart-context"
import type { Product } from "@/lib/types"
import { useState, useEffect, useRef } from "react"
import { trackAddToCart } from "@/lib/pixel"

interface ProductCardProps { 
  product: Product
  priority?: boolean
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const { addToCart } = useCart()
  const [added, setAdded] = useState(false)
  const [imgIdx, setImgIdx] = useState(0)
  const [fade, setFade] = useState(true)
  const [isOpening, setIsOpening] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(price)

  const p = product as any
  const origPrice: number | null = p.originalPrice ? Number(p.originalPrice) : null
  const discount = origPrice && origPrice > product.price
    ? Math.round(((origPrice - product.price) / origPrice) * 100)
    : 0

  const avgRating: number = p.avgRating ? Number(p.avgRating) : 0
  const reviewCount: number = p.reviewCount ? Number(p.reviewCount) : 0

  const images: string[] = (() => {
    const arr = Array.isArray(p.images) ? p.images : []
    if (arr.filter(Boolean).length > 0) return arr.filter(Boolean)
    if (product.imageUrl) return [product.imageUrl]
    return []
  })()

  const isValidUrl = (url: string) => url && (url.startsWith("http") || url.startsWith("/"))
  const currentImg = images[imgIdx] && isValidUrl(images[imgIdx])
    ? images[imgIdx]
    : `/placeholder.svg?height=200&width=300&query=${encodeURIComponent(product?.category || "product")}`

  // Smooth crossfade: set fade=false before switching, then switch and back to true
  const switchTo = (newIdx: number) => {
    setFade(false)
    setTimeout(() => {
      setImgIdx(newIdx)
      setFade(true)
    }, 180)
  }

  const handleMouseEnter = () => {
    if (images.length < 2) return
    let i = 0
    timerRef.current = setInterval(() => {
      i = (i + 1) % images.length
      switchTo(i)
    }, 1200)
  }

  const handleMouseLeave = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
    switchTo(0)
  }

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  const handleCardClick = () => {
    setIsOpening(true)
    setTimeout(() => setIsOpening(false), 3500)
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    addToCart(product)
    trackAddToCart({
      content_name: product.title,
      content_ids: [product.id ?? ""],
      contents: [{ id: product.id ?? "", quantity: 1, item_price: product.price }],
      value: product.price,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  const href = `/products/${p.slug || product.id}`

  return (
    <Link href={href} className="block h-full select-none" onClick={handleCardClick}>
      <Card
        className="group relative bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl hover:border-violet-400 dark:hover:border-violet-500 shadow-xs hover:shadow-xl hover:shadow-violet-500/10 hover:-translate-y-1 transition-all duration-300 overflow-hidden h-full flex flex-col cursor-pointer"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Instant click & loading feedback indicator */}
        {isOpening && (
          <div className="absolute inset-0 bg-white/75 dark:bg-slate-950/75 backdrop-blur-[1px] z-30 flex flex-col items-center justify-center gap-2 animate-in fade-in duration-100">
            <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 px-2.5 py-0.5 rounded-full shadow-sm border border-slate-200 dark:border-slate-800">
              Opening...
            </span>
          </div>
        )}

        {/* Badges - Modern Rounded Glass/Gradient Pills */}
        {discount > 0 && (
          <div className="absolute top-2.5 left-2.5 z-10 bg-gradient-to-r from-red-600 to-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
            -{discount}%
          </div>
        )}
        {product.salesCount > 100 && (
          <div className="absolute top-2.5 right-2.5 z-10 bg-slate-900/85 backdrop-blur-md text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-400/30 flex items-center gap-1 shadow-sm">
            <span>🔥 Popular</span>
          </div>
        )}

        {/* Image with smooth crossfade and modern aspect ratio */}
        <div className="relative aspect-[4/3] sm:aspect-[16/11] w-full bg-slate-50 dark:bg-slate-950 overflow-hidden flex items-center justify-center p-3 transition-colors">
          <img
            src={currentImg}
            alt={product?.title || "product"}
            decoding="async"
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
            style={{
              opacity: fade ? 1 : 0,
              transition: "opacity 0.18s ease-in-out, transform 0.5s ease",
            }}
          />
          {images.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {images.map((_, i) => (
                <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === imgIdx ? "w-4 bg-primary" : "w-1 bg-gray-300 dark:bg-gray-700"}`} />
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <CardContent className="p-3.5 flex-1 flex flex-col gap-1.5">
          <h3 className="font-semibold text-slate-850 dark:text-slate-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors line-clamp-2 text-sm leading-snug whitespace-pre-line">
            {product.title}
          </h3>

          {avgRating > 0 ? (
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                {avgRating.toFixed(1)} <Star className="h-2.5 w-2.5 fill-current ml-0.5" />
              </div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">({reviewCount})</span>
            </div>
          ) : (
            <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">⭐ New Release</div>
          )}

          <div className="mt-auto pt-1">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">{formatPrice(product.price)}</span>
              {origPrice && origPrice > product.price && (
                <>
                  <span className="text-xs text-slate-400 dark:text-slate-500 line-through">{formatPrice(origPrice)}</span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{discount}% off</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Instant Delivery
            </div>
          </div>

          <Button
            className={`w-full mt-2 h-9 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-xs flex items-center justify-center gap-1.5 ${
              added
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-slate-900 hover:bg-slate-800 text-white dark:bg-violet-600 dark:hover:bg-violet-700"
            }`}
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            {added ? "✓ Added to Cart!" : "Download"}
          </Button>
        </CardContent>
      </Card>
    </Link>
  )
}
