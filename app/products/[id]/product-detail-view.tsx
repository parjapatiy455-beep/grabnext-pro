"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
    Star, Zap, Shield,
    Heart, Share2, Loader2, X, ChevronLeft, ChevronRight, Clock, CheckCircle2,
    Play, Video, ShieldCheck, ZoomIn, ImageIcon
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { StoreHeader } from "@/components/store-header"
import { Footer } from "@/components/footer"
import { useCart } from "@/contexts/cart-context"
import { useAuth } from "@/contexts/auth-context"
import { fetchProductReviews, submitReview, fetchProducts } from "@/lib/d1-client"
import { toast } from "@/hooks/use-toast"
import type { Product } from "@/lib/types"
import { trackViewContent, trackAddToCart } from "@/lib/pixel"
import { getVideoInfo } from "@/lib/video-utils"

// ─── Star Rating ─────────────────────────────────────────────────────────────
function StarRating({ rating, interactive = false, onRate }: { rating: number; interactive?: boolean; onRate?: (r: number) => void }) {
    const [hovered, setHovered] = useState(0)
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} type="button" disabled={!interactive}
                    onClick={() => onRate?.(star)}
                    onMouseEnter={() => interactive && setHovered(star)}
                    onMouseLeave={() => interactive && setHovered(0)}
                    className={`${interactive ? "cursor-pointer" : "cursor-default"} focus:outline-none p-0.5`}>
                    <Star className={`h-4 w-4 transition-colors ${(hovered || rating) >= star ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                </button>
            ))}
        </div>
    )
}

// ─── Image / Screenshot Zoom Modal ───────────────────────────────────────────
function ZoomModal({ images, startIdx, onClose }: { images: string[]; startIdx: number; onClose: () => void }) {
    const [idx, setIdx] = useState(startIdx)
    const go = (d: number) => setIdx((i) => (i + d + images.length) % images.length)
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose()
            if (e.key === "ArrowLeft") go(-1)
            if (e.key === "ArrowRight") go(1)
        }
        window.addEventListener("keydown", handler)
        return () => window.removeEventListener("keydown", handler)
    }, [])
    return (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-3 sm:p-4" onClick={onClose}>
            <button onClick={(e) => { e.stopPropagation(); onClose() }}
                className="absolute top-4 right-4 h-10 w-10 bg-white/20 text-white rounded-full flex items-center justify-center hover:bg-white/30 transition-colors z-20">
                <X className="h-5 w-5" />
            </button>
            {images.length > 1 && (<>
                <button onClick={(e) => { e.stopPropagation(); go(-1) }} className="absolute left-2 sm:left-4 h-10 w-10 bg-white/20 text-white rounded-full flex items-center justify-center hover:bg-white/30 z-20">
                    <ChevronLeft className="h-5 w-5" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); go(1) }} className="absolute right-2 sm:right-4 h-10 w-10 bg-white/20 text-white rounded-full flex items-center justify-center hover:bg-white/30 z-20">
                    <ChevronRight className="h-5 w-5" />
                </button>
            </>)}
            <div className="max-h-[90vh] max-w-[95vw] sm:max-w-[90vw] overflow-auto flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                <img src={images[idx]} alt="Screenshot zoom" className="max-h-[85vh] max-w-full object-contain rounded-lg shadow-2xl" />
            </div>
            {images.length > 1 && (
                <div className="absolute bottom-4 flex gap-2">
                    {images.map((_, i) => <button key={i} onClick={(e) => { e.stopPropagation(); setIdx(i) }}
                        className={`h-2 rounded-full transition-all ${i === idx ? "w-8 bg-white" : "w-2 bg-white/40"}`} />)}
                </div>
            )}
        </div>
    )
}

// ─── Rating Bar ───────────────────────────────────────────────────────────────
function RatingBar({ label, count, total }: { label: string; count: number; total: number }) {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0
    return (
        <div className="flex items-center gap-2">
            <span className="w-12 text-right text-xs text-blue-600 dark:text-blue-400 shrink-0">{label}</span>
            <div className="flex-1 h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <span className="w-8 text-xs text-gray-400 dark:text-slate-500 text-right shrink-0">{pct}%</span>
        </div>
    )
}

export function ProductDetailView({ product: initialProduct, id }: { product: Product; id: string }) {
    const router = useRouter()
    const { addToCart } = useCart()
    const { user } = useAuth()

    const [product] = useState<Product>(initialProduct)
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
    const [reviews, setReviews] = useState<any[]>([])
    const [reviewStats, setReviewStats] = useState({ count: 0, avgRating: "0.0" })
    const [ratingBreakdown, setRatingBreakdown] = useState<Record<number, number>>({})
    const [pageLoading, setPageLoading] = useState(true)
    const [reviewForm, setReviewForm] = useState({ rating: 0, comment: "", userName: user?.displayName || "" })
    const [submittingReview, setSubmittingReview] = useState(false)
    const [wishlisted, setWishlisted] = useState(false)
    const [buyingNow, setBuyingNow] = useState(false)
    const [activeTab, setActiveTab] = useState<"description" | "reviews">("description")
    const [activeImg, setActiveImg] = useState(0)
    const [imgFade, setImgFade] = useState(true)
    const [activeMediaType, setActiveMediaType] = useState<"image" | "video">("image")
    const [zoomModalData, setZoomModalData] = useState<{ images: string[]; startIdx: number } | null>(null)

    const changeActiveImg = (i: number) => {
        setImgFade(false)
        setTimeout(() => { setActiveImg(i); setImgFade(true) }, 150)
    }

    useEffect(() => {
        if (user?.displayName) setReviewForm((f) => ({ ...f, userName: f.userName || user.displayName }))
    }, [user])

    useEffect(() => {
        const load = async () => {
            setPageLoading(true)
            try {
                const realId = initialProduct.id || id
                const [reviewData, allProds] = await Promise.all([fetchProductReviews(realId), fetchProducts()])
                setReviews(reviewData.reviews || [])
                setReviewStats(reviewData.stats || { count: 0, avgRating: "0.0" })
                const bd: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
                reviewData.reviews?.forEach((r: any) => { bd[r.rating] = (bd[r.rating] || 0) + 1 })
                setRatingBreakdown(bd)
                setRelatedProducts((allProds as Product[]).filter((p) => p.category === initialProduct.category && p.id !== initialProduct.id && p.isActive).slice(0, 4))
            } catch (e) { console.error(e) }
            finally { setPageLoading(false) }
        }
        load()
        trackViewContent({
            content_name: initialProduct.title,
            content_category: initialProduct.category,
            content_ids: [initialProduct.id || id],
            contents: [{ id: initialProduct.id || id, quantity: 1, item_price: initialProduct.price }],
            value: initialProduct.price,
        })
    }, [id, initialProduct])

    const handleReviewSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!reviewForm.rating) { toast({ title: "Please select a rating", variant: "destructive" }); return }
        if (!reviewForm.userName.trim()) { toast({ title: "Please enter your name", variant: "destructive" }); return }
        setSubmittingReview(true)
        try {
            const realProductId = product?.id || id
            await submitReview({ productId: realProductId, userId: user?.uid, userName: reviewForm.userName, rating: reviewForm.rating, comment: reviewForm.comment })
            toast({ title: "✅ Review submitted!" })
            setReviewForm({ rating: 0, comment: "", userName: user?.displayName || "" })
            const reviewData = await fetchProductReviews(realProductId)
            setReviews(reviewData.reviews || [])
            setReviewStats(reviewData.stats || { count: 0, avgRating: "0.0" })
            const bd: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
            reviewData.reviews?.forEach((r: any) => { bd[r.rating] = (bd[r.rating] || 0) + 1 })
            setRatingBreakdown(bd)
        } catch { toast({ title: "Failed to submit review", variant: "destructive" }) }
        finally { setSubmittingReview(false) }
    }

    const formatPrice = (price: number) =>
        new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(price)

    const images: string[] = (() => {
        const arr = Array.isArray((product as any).images) ? (product as any).images : []
        if (arr.filter(Boolean).length > 0) return arr.filter(Boolean)
        if (product.imageUrl) return [product.imageUrl]
        return [`/placeholder.svg?height=400&width=400&query=${encodeURIComponent(product.title)}`]
    })()

    const proofImages: string[] = (() => {
        const arr = Array.isArray((product as any).proofImages) ? (product as any).proofImages : []
        return arr.filter(Boolean)
    })()

    const videoInfo = product.videoUrl ? getVideoInfo(product.videoUrl) : null

    const originalPrice = (product as any).originalPrice || product.price * 1.25
    const discount = Math.round(((originalPrice - product.price) / originalPrice) * 100)
    const avgRating = parseFloat(reviewStats.avgRating)
    const descIsHtml = product.description?.includes("<") && product.description?.includes(">")

    const handleDescriptionClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement
        if (target.tagName === "IMG") {
            const src = (target as HTMLImageElement).src
            if (src) {
                setZoomModalData({ images: [src], startIdx: 0 })
            }
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col text-slate-900 dark:text-slate-100 transition-colors">
            <StoreHeader />

            <main className="flex-1 w-full max-w-6xl mx-auto px-3 sm:px-5 lg:px-8 py-4 sm:py-6 space-y-4">

                {/* ── Hero Card ─────────────────────────────────────────── */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden transition-colors">
                    <div className="grid grid-cols-1 lg:grid-cols-2">

                        {/* LEFT — Media (Image & Video) */}
                        <div className="flex flex-col gap-3 p-4 sm:p-6 lg:border-r lg:border-gray-100 dark:lg:border-slate-800">
                            
                            {/* Media Type Switcher Pill (if video exists) */}
                            {videoInfo && (
                                <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-slate-800/80 rounded-xl w-fit text-xs font-semibold">
                                    <button
                                        type="button"
                                        onClick={() => setActiveMediaType("image")}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                                            activeMediaType === "image"
                                                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                                                : "text-gray-500 hover:text-gray-900 dark:text-slate-400"
                                        }`}
                                    >
                                        <ImageIcon className="h-3.5 w-3.5" /> Photos ({images.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveMediaType("video")}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                                            activeMediaType === "video"
                                                ? "bg-red-600 text-white shadow-sm font-semibold"
                                                : "text-gray-500 hover:text-gray-900 dark:text-slate-400"
                                        }`}
                                    >
                                        <Play className="h-3.5 w-3.5 fill-current" /> Watch Video
                                    </button>
                                </div>
                            )}

                            {/* Main Media Display */}
                            {activeMediaType === "video" && videoInfo ? (
                                <div className="relative rounded-xl overflow-hidden bg-black shadow-inner aspect-video sm:aspect-[16/10] w-full flex items-center justify-center">
                                    {videoInfo.type === 'direct' ? (
                                        <video 
                                            src={videoInfo.embedUrl} 
                                            controls 
                                            playsInline 
                                            autoPlay 
                                            className="w-full h-full object-contain" 
                                        />
                                    ) : (
                                        <iframe
                                            src={videoInfo.embedUrl}
                                            className="w-full h-full border-0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                            allowFullScreen
                                        />
                                    )}
                                </div>
                            ) : (
                                <div
                                    className="relative rounded-xl overflow-hidden cursor-zoom-in bg-gray-50 dark:bg-slate-950"
                                    onClick={() => setZoomModalData({ images, startIdx: activeImg })}
                                >
                                    {product.salesCount > 100 && (
                                        <Badge className="absolute top-2 left-2 z-10 bg-blue-600 text-white text-[10px]">Bestseller</Badge>
                                    )}
                                    {discount > 0 && (
                                        <Badge className="absolute top-2 right-2 z-10 bg-red-500 text-white text-[10px] font-bold">{discount}% OFF</Badge>
                                    )}
                                    <div style={{ opacity: imgFade ? 1 : 0, transition: "opacity 0.15s ease-in-out" }}>
                                        <img
                                            src={images[activeImg]}
                                            alt={product.title}
                                            className="w-full h-auto max-h-[300px] sm:max-h-[380px] object-contain mx-auto block py-2"
                                        />
                                    </div>
                                    <p className="text-center text-[10px] text-gray-400 dark:text-slate-500 pb-1">Tap to zoom</p>
                                </div>
                            )}

                            {/* Thumbnails Row (Images + Video thumbnail) */}
                            {(images.length > 1 || videoInfo) && (
                                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                                    {images.map((img, i) => (
                                        <button
                                            key={i}
                                            onMouseEnter={() => { setActiveMediaType("image"); changeActiveImg(i) }}
                                            onClick={() => { setActiveMediaType("image"); changeActiveImg(i) }}
                                            className={`shrink-0 h-14 w-14 rounded-lg border-2 overflow-hidden transition-all duration-200 bg-gray-50 dark:bg-slate-950
                                                ${activeMediaType === "image" && i === activeImg ? "border-blue-600 dark:border-blue-500 shadow-md scale-105" : "border-gray-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500"}`}
                                        >
                                            <img src={img} alt={`View ${i + 1}`} className="w-full h-full object-contain p-1" />
                                        </button>
                                    ))}

                                    {videoInfo && (
                                        <button
                                            type="button"
                                            onClick={() => setActiveMediaType("video")}
                                            className={`shrink-0 h-14 w-14 rounded-lg border-2 overflow-hidden transition-all duration-200 relative bg-black flex items-center justify-center
                                                ${activeMediaType === "video" ? "border-red-600 shadow-md scale-105 ring-2 ring-red-500/20" : "border-gray-200 dark:border-slate-800 hover:border-red-500"}`}
                                            title="Watch product video"
                                        >
                                            {videoInfo.thumbnail ? (
                                                <img src={videoInfo.thumbnail} alt="Video preview" className="w-full h-full object-cover opacity-80" />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-red-950 to-black flex items-center justify-center" />
                                            )}
                                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                                                <div className="h-6 w-6 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md">
                                                    <Play className="h-3 w-3 fill-current ml-0.5" />
                                                </div>
                                                <span className="text-[8px] font-bold text-white tracking-wider uppercase mt-0.5">Video</span>
                                            </div>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* RIGHT — Info + Buttons */}
                        <div className="flex flex-col gap-3 p-4 sm:p-6">

                            {/* Category + Title */}
                            <div>
                                <span className="inline-block text-[11px] capitalize text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-full mb-2">
                                    {product.category}
                                </span>
                                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white leading-snug whitespace-pre-line">
                                    {product.title}
                                </h1>
                            </div>

                            {/* Ratings */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <button onClick={() => setActiveTab("reviews")} className="flex items-center gap-1 bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded hover:bg-green-700 transition">
                                    {avgRating > 0 ? avgRating.toFixed(1) : "New"} <Star className="h-3 w-3 fill-white ml-0.5" />
                                </button>
                                {reviewStats.count > 0 && (
                                    <span className="text-xs text-gray-400 dark:text-slate-500">
                                        ({reviewStats.count} customer reviews)
                                    </span>
                                )}
                            </div>

                            <Separator className="dark:bg-slate-800" />

                            {/* Price block */}
                            <div>
                                <div className="flex items-baseline gap-2 flex-wrap">
                                    <span className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                                        {formatPrice(product.price)}
                                    </span>
                                    <span className="text-sm text-gray-400 dark:text-slate-500 line-through">{formatPrice(originalPrice)}</span>
                                    <span className="text-xs font-bold text-green-700 dark:text-green-500 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/40 px-2 py-0.5 rounded-full">
                                        {discount}% off
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Inclusive of all taxes. Instant Delivery.</p>
                            </div>

                            {/* ── BUY NOW BUTTON ── */}
                            <div className="mt-1">
                                <button
                                    id="buy-now-btn"
                                    disabled={buyingNow}
                                    className="w-full flex items-center justify-center gap-2 h-13 py-3.5 rounded-xl font-bold text-base text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-red-600 shadow-md shadow-orange-200 dark:shadow-none transition-all duration-200 active:scale-[0.98] disabled:opacity-70"
                                    onClick={() => {
                                        setBuyingNow(true)
                                        addToCart(product)
                                        trackAddToCart({
                                            content_name: product.title,
                                            content_ids: [product.id || id],
                                            contents: [{ id: product.id || id, quantity: 1, item_price: product.price }],
                                            value: product.price,
                                        })
                                        router.push("/checkout")
                                    }}
                                >
                                    <Zap className="h-5 w-5 shrink-0" />
                                    {buyingNow ? "Redirecting..." : "Pay and Download"}
                                </button>
                            </div>

                            {/* Trust Image */}
                            <div className="mt-2.5 w-full flex justify-center rounded-xl overflow-hidden hover:opacity-95 transition-opacity px-1 dark:bg-slate-900/60 dark:p-2 dark:border dark:border-slate-800">
                                <img 
                                    src="/images/upi.webp" 
                                    alt="Guaranteed Safe and Secure Payments" 
                                    className="w-full h-auto object-contain max-w-sm drop-shadow-sm dark:brightness-95"
                                />
                            </div>

                            {/* Trust strip */}
                            <div className="flex items-center justify-around bg-gray-50 dark:bg-slate-900/60 rounded-xl p-2.5 border border-gray-100 dark:border-slate-800">
                                <div className="flex flex-col items-center gap-1">
                                    <Shield className="h-4 w-4 text-green-600" />
                                    <span className="text-[10px] text-gray-600 dark:text-slate-400 font-medium text-center">Secure<br/>Payment</span>
                                </div>
                                <div className="w-px h-8 bg-gray-200 dark:bg-slate-800" />
                                <div className="flex flex-col items-center gap-1">
                                    <Clock className="h-4 w-4 text-blue-600" />
                                    <span className="text-[10px] text-gray-600 dark:text-slate-400 font-medium text-center">Instant<br/>Delivery</span>
                                </div>
                                <div className="w-px h-8 bg-gray-200 dark:bg-slate-800" />
                                <div className="flex flex-col items-center gap-1">
                                    <CheckCircle2 className="h-4 w-4 text-purple-600" />
                                    <span className="text-[10px] text-gray-600 dark:text-slate-400 font-medium text-center">Verified<br/>Product</span>
                                </div>
                            </div>

                            {/* Tags */}
                            {product.tags && product.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {product.tags.map((tag: string) => (
                                        <span key={tag} className="text-[11px] capitalize bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-350 px-2.5 py-0.5 rounded-full">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Wishlist & Share */}
                            <div className="flex gap-2 pt-1">
                                <button
                                    className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-medium border transition-all
                                        ${wishlisted ? "text-red-500 border-red-200 bg-red-50 dark:border-red-950 dark:bg-red-950/20" : "text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800"}`}
                                    onClick={() => setWishlisted(!wishlisted)}
                                >
                                    <Heart className={`h-4 w-4 ${wishlisted ? "fill-red-500" : ""}`} />
                                    {wishlisted ? "Wishlisted" : "Wishlist"}
                                </button>
                                <button
                                    className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-medium border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all"
                                    onClick={() => { navigator.clipboard.writeText(window.location.href); toast({ title: "Link copied!" }) }}
                                >
                                    <Share2 className="h-4 w-4" /> Share
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Tabs: Description & Reviews ───────────────────────── */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden transition-colors">
                    {/* Tab bar */}
                    <div className="flex border-b border-gray-100 dark:border-slate-800">
                        {(["description", "reviews"] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 sm:flex-none px-5 sm:px-8 py-3.5 text-sm font-semibold capitalize transition-all border-b-2 -mb-px
                                    ${activeTab === tab ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400" : "border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-350"}`}
                            >
                                {tab}
                                {tab === "reviews" && reviewStats.count > 0 && (
                                    <span className="ml-1.5 text-[11px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400">
                                        {reviewStats.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="p-4 sm:p-6 lg:p-8">
                        {/* Description */}
                        {activeTab === "description" && (
                            <div className="space-y-8">
                                {pageLoading ? (
                                    <div className="animate-pulse space-y-3">
                                        {[...Array(5)].map((_, i) => (
                                            <div key={i} className="h-4 bg-gray-100 dark:bg-slate-800 rounded" style={{ width: `${70 + (i % 3) * 10}%` }} />
                                        ))}
                                    </div>
                                ) : product.description ? (
                                    descIsHtml ? (
                                        <div
                                            className="product-description max-w-none prose prose-blue dark:prose-invert prose-img:rounded-xl prose-img:shadow-md prose-img:cursor-zoom-in"
                                            dangerouslySetInnerHTML={{ __html: product.description }}
                                            onClick={handleDescriptionClick}
                                        />
                                    ) : (
                                        <div className="space-y-3">
                                            {product.description.split("\n").map((line, idx) => {
                                                const trimmed = line.trim()
                                                if (!trimmed) return <div key={idx} className="h-1.5" />
                                                
                                                if (trimmed.startsWith("###")) {
                                                    return (
                                                        <h3 key={idx} className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mt-4 mb-2 flex items-center gap-2 border-b border-gray-100 dark:border-slate-800 pb-1">
                                                            <span className="h-3.5 w-1 bg-blue-600 rounded-full inline-block" />
                                                            {trimmed.replace(/^###\s*/, "")}
                                                        </h3>
                                                    )
                                                }
                                                if (trimmed.startsWith("##")) {
                                                    return (
                                                        <h2 key={idx} className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white mt-5 mb-2.5 flex items-center gap-2 border-b border-gray-100 dark:border-slate-800 pb-1">
                                                            <span className="h-4 w-1.5 bg-blue-600 rounded-full inline-block" />
                                                            {trimmed.replace(/^##\s*/, "")}
                                                        </h2>
                                                    )
                                                }
                                                if (trimmed.startsWith("-") || trimmed.startsWith("*") || trimmed.startsWith("•")) {
                                                    const content = trimmed.replace(/^[-*•]\s*/, "")
                                                    return (
                                                        <div key={idx} className="flex items-start gap-2.5 my-1 pl-1 group">
                                                            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-1 transition-transform group-hover:scale-110" />
                                                            <span className="text-sm sm:text-base text-gray-600 dark:text-slate-350 leading-relaxed">{content}</span>
                                                        </div>
                                                    )
                                                }
                                                return (
                                                    <p key={idx} className="text-sm sm:text-base text-gray-600 dark:text-slate-300 leading-relaxed">
                                                        {line}
                                                    </p>
                                                )
                                            })}
                                        </div>
                                    )
                                ) : (
                                    <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-8">No description available.</p>
                                )}

                                {/* ── Verified Customer Proofs & Trust Section ── */}
                                {proofImages.length > 0 && (
                                    <div className="pt-6 border-t border-gray-100 dark:border-slate-800 space-y-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-slate-800 pb-3">
                                            <div className="flex items-center gap-2.5">
                                                <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                                    <ShieldCheck className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                        Customer Proofs & Real Results
                                                        <span className="text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                                                            100% Genuine
                                                        </span>
                                                    </h3>
                                                    <p className="text-xs text-gray-500 dark:text-slate-400">
                                                        Real buyer feedback, WhatsApp messages, and results screenshots from our community.
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-xs text-gray-400 dark:text-slate-500 font-medium">
                                                {proofImages.length} verified {proofImages.length === 1 ? 'screenshot' : 'screenshots'}
                                            </span>
                                        </div>

                                        {/* Responsive Screenshot Grid */}
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                                            {proofImages.map((proofUrl, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => setZoomModalData({ images: proofImages, startIdx: idx })}
                                                    className="group relative aspect-[3/4] sm:aspect-[4/5] rounded-xl overflow-hidden border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 cursor-zoom-in hover:shadow-lg transition-all hover:scale-[1.02]"
                                                >
                                                    <img
                                                        src={proofUrl}
                                                        alt={`Customer Proof ${idx + 1}`}
                                                        className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                                                        loading="lazy"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2.5 text-white">
                                                        <span className="text-[11px] font-medium flex items-center gap-1">
                                                            <ZoomIn className="h-3.5 w-3.5" /> Tap to zoom
                                                        </span>
                                                    </div>
                                                    <div className="absolute top-2 left-2 bg-black/65 backdrop-blur-sm text-white text-[9px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                                                        <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Genuine
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-center text-[11px] text-gray-400 dark:text-slate-500">
                                            Tip: Tap on any screenshot to zoom in and read full conversations and receipts.
                                        </p>
                                    </div>
                                )}

                                {/* Trust Value Proposition Cards */}
                                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-800">
                                    <h4 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                                        <Shield className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" /> Why buy from Grabnext?
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="flex gap-3 p-4 rounded-xl bg-blue-50/40 dark:bg-blue-950/10 border border-blue-100/50 dark:border-blue-900/30 hover:bg-blue-50/60 dark:hover:bg-blue-950/20 transition-colors">
                                            <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-semibold text-sm text-gray-900 dark:text-white">Instant Access</p>
                                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Your files are ready to download immediately after completing the payment.</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3 p-4 rounded-xl bg-green-50/40 dark:bg-green-950/10 border border-green-100/50 dark:border-green-900/30 hover:bg-green-50/60 dark:hover:bg-green-950/20 transition-colors">
                                            <Shield className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-semibold text-sm text-gray-900 dark:text-white">100% Safe & Secure</p>
                                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">We use advanced encryption protocols to process your checkout details securely.</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3 p-4 rounded-xl bg-purple-50/40 dark:bg-purple-950/10 border border-purple-100/50 dark:border-purple-900/30 hover:bg-purple-50/60 dark:hover:bg-purple-950/20 transition-colors">
                                            <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-semibold text-sm text-gray-900 dark:text-white">Lifetime Updates</p>
                                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Get future updates and releases for this package without paying anything extra.</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3 p-4 rounded-xl bg-orange-50/40 dark:bg-orange-950/10 border border-orange-100/50 dark:border-orange-900/30 hover:bg-orange-50/60 dark:hover:bg-orange-950/20 transition-colors">
                                            <CheckCircle2 className="h-5 w-5 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-semibold text-sm text-gray-900 dark:text-white">Verified & Tested</p>
                                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">All files are manually tested and verified to ensure they are 100% working.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Reviews */}
                        {activeTab === "reviews" && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                                {/* Rating summary */}
                                <div className="flex flex-col items-center lg:border-r lg:border-gray-100 dark:lg:border-slate-800 lg:pr-8 pb-4 lg:pb-0 border-b lg:border-b-0 border-gray-100 dark:border-slate-800">
                                    <div className="text-5xl font-bold text-gray-900 dark:text-white">
                                        {avgRating > 0 ? avgRating.toFixed(1) : "—"}
                                    </div>
                                    <StarRating rating={Math.round(avgRating)} />
                                    <p className="text-sm text-gray-400 dark:text-slate-500 mt-1 mb-4">{reviewStats.count} ratings</p>
                                    <div className="w-full space-y-1.5">
                                        {[5, 4, 3, 2, 1].map((star) => (
                                            <RatingBar key={star} label={`${star} star`} count={ratingBreakdown[star] || 0} total={reviewStats.count} />
                                        ))}
                                    </div>
                                </div>

                                {/* Write + list */}
                                <div className="lg:col-span-2">
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm sm:text-base">Write a Review</h3>
                                    <form onSubmit={handleReviewSubmit} className="space-y-3">
                                        <div>
                                            <Label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-350">Overall Rating</Label>
                                            <StarRating rating={reviewForm.rating} interactive onRate={(r) => setReviewForm({ ...reviewForm, rating: r })} />
                                        </div>
                                        <div>
                                            <Label htmlFor="reviewer-name" className="mb-1 block text-sm text-gray-700 dark:text-slate-300">Your Name</Label>
                                            <Input id="reviewer-name" value={reviewForm.userName}
                                                onChange={(e) => setReviewForm({ ...reviewForm, userName: e.target.value })}
                                                placeholder="Your name" required className="text-sm h-10 dark:bg-slate-900 dark:border-slate-800" />
                                        </div>
                                        <div>
                                            <Label htmlFor="review-comment" className="mb-1 block text-sm text-gray-700 dark:text-slate-300">Review <span className="text-gray-400 dark:text-slate-500">(optional)</span></Label>
                                            <Textarea id="review-comment" value={reviewForm.comment}
                                                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                                                placeholder="Share your experience..." rows={3} className="text-sm resize-none dark:bg-slate-900 dark:border-slate-800" />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={submittingReview}
                                            className="w-full sm:w-auto px-6 h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center gap-2"
                                        >
                                            {submittingReview ? <><Loader2 className="h-4 w-4 animate-spin" />Submitting...</> : "Submit Review"}
                                        </button>
                                    </form>

                                    <div className="mt-6 space-y-4">
                                        {pageLoading ? (
                                            <div className="animate-pulse space-y-3">
                                                {[...Array(2)].map((_, i) => <div key={i} className="h-16 bg-gray-100 dark:bg-slate-800 rounded-xl" />)}
                                            </div>
                                        ) : reviews.length === 0 ? (
                                            <div className="text-center py-8">
                                                <Star className="h-8 w-8 text-gray-200 dark:text-slate-700 mx-auto mb-2" />
                                                <p className="text-sm text-gray-400 dark:text-slate-500">No reviews yet. Be the first!</p>
                                            </div>
                                        ) : reviews.map((review: any) => (
                                            <div key={review.id} className="flex gap-3 pb-4 border-b border-gray-100 dark:border-slate-800 last:border-0">
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                                    {review.userName?.[0]?.toUpperCase() || "U"}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                                        <span className="font-semibold text-sm text-gray-900 dark:text-white">{review.userName}</span>
                                                        <StarRating rating={review.rating} />
                                                    </div>
                                                    <p className="text-[11px] text-gray-400 dark:text-slate-500 mb-1">
                                                        {new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                                    </p>
                                                    {review.comment && <p className="text-sm text-gray-650 dark:text-slate-350 leading-relaxed">{review.comment}</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Related Products ─────────────────────────────────── */}
                {relatedProducts.length > 0 && (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-4 sm:p-6 transition-colors">
                        <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">Related Products</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {relatedProducts.map((rp) => (
                                <Link key={rp.id} href={`/products/${(rp as any).slug || rp.id}`} className="group">
                                    <div className="rounded-xl p-3 border border-gray-100 dark:border-slate-800/80 hover:border-blue-200 dark:hover:border-blue-500/60 hover:shadow-md transition-all bg-gray-50 dark:bg-slate-950 h-full">
                                        <div className="aspect-square mb-2 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
                                            <img
                                                src={rp.imageUrl || `/placeholder.svg?height=200&width=200&query=${rp.category}`}
                                                alt={rp.title}
                                                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 dark:brightness-90"
                                            />
                                        </div>
                                        <h4 className="text-xs font-medium text-gray-900 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
                                            {rp.title}
                                        </h4>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">
                                            {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(rp.price)}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {zoomModalData && (
                <ZoomModal 
                    images={zoomModalData.images} 
                    startIdx={zoomModalData.startIdx} 
                    onClose={() => setZoomModalData(null)} 
                />
            )}
            <Footer />
        </div>
    )
}
