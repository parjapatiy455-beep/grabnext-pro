"use client"

import type React from "react"
import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Lock, ShieldCheck, ArrowRight, CheckCircle2, Tag, ChevronDown, ChevronUp, ShoppingBag } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"
import { trackInitiateCheckout, trackAddPaymentInfo } from "@/lib/pixel"

declare global {
  interface Window {
    XPay: any
    Razorpay: any
  }
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, totalAmount, clearCart } = useCart()
  const { user, refreshUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [activeGateway, setActiveGateway] = useState<string>("xpay")
  const hasFiredCheckout = useRef(false)
  const [showOrderSummaryMobile, setShowOrderSummaryMobile] = useState(false)

  // Coupon Code States
  const [couponCode, setCouponCode] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null)
  const [couponError, setCouponError] = useState("")
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  })

  // Load gateway setting
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => setActiveGateway(data.payment_gateway || "xpay"))
      .catch(() => setActiveGateway("xpay"))
  }, [])

  // Load Razorpay script if needed
  useEffect(() => {
    if (activeGateway === "razorpay") {
      if (!document.querySelector('script[src*="razorpay"]')) {
        const script = document.createElement("script")
        script.src = "https://checkout.razorpay.com/v1/checkout.js"
        script.async = true
        document.body.appendChild(script)
      }
    }
  }, [activeGateway])

  // Track Pixel initiate checkout
  useEffect(() => {
    if (totalAmount > 0 && !hasFiredCheckout.current) {
      hasFiredCheckout.current = true
      trackInitiateCheckout(
        {
          value: totalAmount,
          num_items: items.length,
          content_ids: items.map((i) => i.productId),
          contents: items.map((i) => ({
            id: i.productId,
            quantity: i.quantity || 1,
            item_price: i.product.price,
          })),
        },
        user ? {
          email: user.email || undefined,
          firstName: user.displayName?.split(' ')[0],
          lastName: user.displayName?.split(' ').slice(1).join(' '),
          external_id: user.uid
        } : undefined
      )
    }
  }, [totalAmount, items, user])

  // Prefill user data
  useEffect(() => {
    if (user) {
      setFormData((f) => ({
        ...f,
        name: user.displayName || f.name || "",
        email: user.email || f.email || "",
        phone: (user as any).phone || f.phone || "",
      }))
    }
  }, [user])

  // Auto-apply saved/prefilled coupon code (e.g. SAVE50 from /editing popup)
  useEffect(() => {
    if (totalAmount > 0 && !appliedCoupon) {
      let saved = ""
      try {
        saved = sessionStorage.getItem("copiedCouponCode") || ""
      } catch {}
      if (!saved && typeof window !== "undefined") {
        saved = new URLSearchParams(window.location.search).get("coupon") || ""
      }
      if (saved) {
        const clean = saved.toUpperCase().trim()
        setCouponCode(clean)
        setIsApplyingCoupon(true)
        fetch('/api/coupons/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: clean, cartTotal: totalAmount })
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.valid) {
              setAppliedCoupon(data)
              toast({ title: `🎉 Coupon ${clean} Applied!`, description: `Instant ${data.value || 40}% discount active.` })
            }
          })
          .catch(() => {})
          .finally(() => setIsApplyingCoupon(false))
      }
    }
  }, [totalAmount, appliedCoupon])

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(price)

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
    setIsApplyingCoupon(true)
    setCouponError("")
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, cartTotal: totalAmount })
      })
      const data = await res.json()
      if (data.valid) {
        setAppliedCoupon(data)
        toast({ title: "Coupon Applied!", description: `Discount of ${formatPrice(data.discountAmount)} deducted.` })
      } else {
        setCouponError(data.message || "Invalid coupon code")
        setAppliedCoupon(null)
      }
    } catch (e) {
      setCouponError("Failed to apply coupon.")
      setAppliedCoupon(null)
    } finally {
      setIsApplyingCoupon(false)
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode("")
    setCouponError("")
  }

  const finalAmount = appliedCoupon ? Math.max(0, totalAmount - appliedCoupon.discountAmount) : totalAmount

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value })

  const updateOrder = useCallback(async (orderId: string, paymentId: string) => {
    try {
      await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: orderId,
          status: "paid",
          paymentId,
        }),
      })
    } catch (err) {
      console.error("Order update error:", err)
    }
  }, [])

  const getOrCreateUserId = async () => {
    if (user?.uid) return user.uid
    const nameParts = formData.name.trim().split(" ")
    const firstName = nameParts[0] || "Customer"
    const lastName = nameParts.slice(1).join(" ") || ""

    const regRes = await fetch("/api/auth/guest-register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formData.email.trim(),
        displayName: formData.name.trim(),
        phone: formData.phone.trim(),
      }),
    })
    const regData = await regRes.json()
    if (regRes.ok && regData.user?.uid) {
      await refreshUser()
      return regData.user.uid
    }
    return "guest"
  }

  const launchXPay = (orderId: string) => {
    if (!window.XPay) {
      toast({ title: "Payment system loading, please retry", variant: "destructive" })
      setLoading(false)
      return
    }
    const orderTitle = items.length === 1 ? items[0].product.title : `${items[0].product.title} + ${items.length - 1} more`
    const xpay = new window.XPay({
      api_key: "xp_live_wtm5vj64kseuylg9cfmsl9",
      amount: Math.round(finalAmount),
      title: orderTitle,
      onSuccess: async (data: { utr: string }) => {
        setLoading(false)
        await updateOrder(orderId, data.utr)
        clearCart()
        router.push(`/checkout/success?utr=${data.utr}`)
      },
      onClose: () => {
        setLoading(false)
      },
    })
    xpay.open()
  }

  const launchRazorpay = async (orderId: string) => {
    const orderRes = await fetch("/api/razorpay/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: finalAmount, currency: "INR" }),
    })
    const orderData = await orderRes.json()
    if (!orderData.orderId) {
      toast({ title: orderData.error || "Failed to create payment order", variant: "destructive" })
      setLoading(false)
      return
    }

    if (!window.Razorpay) {
      toast({ title: "Payment gateway not loaded", variant: "destructive" })
      setLoading(false)
      return
    }

    const options = {
      key: orderData.keyId,
      amount: Math.round(finalAmount * 100),
      currency: "INR",
      name: "Grabnext",
      description: items.length === 1 ? items[0].product.title : `${items.length} items`,
      order_id: orderData.orderId,
      prefill: {
        name: formData.name,
        email: formData.email,
        contact: formData.phone,
      },
      theme: { color: "#f59e0b" },
      handler: async (response: any) => {
        setLoading(false)
        const paymentId = response.razorpay_payment_id
        await updateOrder(orderId, paymentId)
        clearCart()
        router.push(`/checkout/success?utr=${paymentId}`)
      },
      modal: {
        ondismiss: () => {
          setLoading(false)
        },
      },
    }

    const rzp = new window.Razorpay(options)
    rzp.open()
  }

  // 1-STEP FAST CHECKOUT HANDLER
  const handleFastCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) return toast({ title: "Your cart is empty", variant: "destructive" })
    if (!formData.name.trim()) return toast({ title: "Please enter your name", variant: "destructive" })
    if (!formData.email.trim()) return toast({ title: "Please enter your email", variant: "destructive" })
    if (!formData.phone.trim()) return toast({ title: "Please enter your phone number", variant: "destructive" })

    setLoading(true)
    try {
      const userId = await getOrCreateUserId()
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          userEmail: formData.email.trim(),
          userName: formData.name.trim(),
          userPhone: formData.phone.trim(),
          items: items.map((i) => ({
            productId: i.productId,
            title: i.product.title,
            price: i.product.price,
            quantity: i.quantity,
            imageUrl: i.product.imageUrl,
            downloadUrl: i.product.downloadUrl
          })),
          totalAmount: finalAmount,
          couponCode: appliedCoupon?.code || null,
          discountAmount: appliedCoupon?.discountAmount || 0,
          status: "pending",
        }),
      })

      const orderData = await orderRes.json()
      if (!orderData.id) throw new Error("Failed to initialize order")

      // Track Pixel payment info
      trackAddPaymentInfo(
        {
          value: finalAmount,
          num_items: items.length,
          content_ids: items.map((i) => i.productId),
          contents: items.map((i) => ({
            id: i.productId,
            quantity: i.quantity || 1,
            item_price: i.product.price,
          })),
        },
        {
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          external_id: userId || undefined,
        }
      )

      // Open Gateway immediately
      if (activeGateway === "razorpay") {
        await launchRazorpay(orderData.id)
      } else {
        launchXPay(orderData.id)
      }
    } catch (err: any) {
      setLoading(false)
      toast({ title: "Checkout Error", description: err.message, variant: "destructive" })
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md bg-white border border-slate-200 p-8 rounded-2xl shadow-xl">
          <ShoppingBag className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black mb-2 text-slate-900">Your cart is empty</h2>
          <p className="text-sm text-slate-500 mb-6">Select a digital product or masterclass to continue.</p>
          <button
            onClick={() => router.push("/products")}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 py-3.5 px-6 font-bold rounded-xl transition-all shadow-md"
          >
            Browse Products
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-amber-500 selection:text-slate-950 pb-12 relative">
      
      {/* Main Container - Compact & High-Visibility Viewport */}
      <main className="max-w-4xl mx-auto px-4 pt-4 sm:pt-6">
        
        {/* Mobile Cart Summary Accordion Toggle */}
        <div className="block lg:hidden mb-4">
          <button
            onClick={() => setShowOrderSummaryMobile(!showOrderSummaryMobile)}
            className="w-full bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between text-left text-sm font-semibold text-slate-900 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-amber-600" />
              <span>Order Summary ({items.length} {items.length === 1 ? 'item' : 'items'})</span>
              {showOrderSummaryMobile ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </div>
            <span className="text-amber-600 font-extrabold text-base">{formatPrice(finalAmount)}</span>
          </button>

          {showOrderSummaryMobile && (
            <div className="bg-white border border-slate-200 border-t-0 p-4 rounded-b-xl space-y-3 mt-0.5 shadow-sm">
              {items.map((item) => (
                <div key={item.productId} className="flex gap-3 items-center text-xs border-b border-slate-100 pb-3">
                  <img
                    src={item.product.imageUrl || '/placeholder.svg'}
                    alt={item.product.title}
                    className="w-12 h-12 object-cover rounded bg-slate-100 border border-slate-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate">{item.product.title}</p>
                    <p className="text-slate-500 text-[11px]">Qty: {item.quantity}</p>
                  </div>
                  <span className="font-bold text-slate-900">{formatPrice(item.product.price * item.quantity)}</span>
                </div>
              ))}
              <div className="flex justify-between text-xs text-slate-500 pt-1">
                <span>Subtotal: {formatPrice(totalAmount)}</span>
                {appliedCoupon && <span className="text-emerald-600 font-medium">Discount: -{formatPrice(appliedCoupon.discountAmount)}</span>}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Fast 1-Step Form Box */}
          <div className="lg:col-span-7">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 shadow-xl relative">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900">Fast Checkout</h1>
                  <p className="text-xs text-slate-500 mt-0.5">Enter details below to complete your order instantly.</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-semibold">
                  <Lock className="w-3 h-3 text-emerald-600" />
                  <span>256-Bit SSL</span>
                </div>
              </div>

              {/* 1-Step Fast Form */}
              <form onSubmit={handleFastCheckoutSubmit} className="space-y-4">
                
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Full Name <span className="text-amber-500">*</span>
                  </label>
                  <input
                    name="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* Mobile Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    WhatsApp / Phone Number <span className="text-amber-500">*</span>
                  </label>
                  <input
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    placeholder="10-digit mobile number"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all placeholder:text-slate-400 font-mono"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Email Address (For Instant Download) <span className="text-amber-500">*</span>
                  </label>
                  <input
                    name="email"
                    type="email"
                    placeholder="yourname@gmail.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled={!!user?.email}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all placeholder:text-slate-400 disabled:opacity-60"
                  />
                </div>

                {/* Compact Promo / Coupon Code */}
                <div className="pt-1">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span className="font-semibold flex items-center gap-1"><Tag className="w-3.5 h-3.5 text-amber-500" /> Have a Promo Code?</span>
                      {appliedCoupon && <span className="text-emerald-600 font-bold">-{formatPrice(appliedCoupon.discountAmount)}</span>}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="ENTER CODE"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                        disabled={!!appliedCoupon || isApplyingCoupon}
                        className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 placeholder:text-slate-400 uppercase focus:outline-none focus:border-amber-500"
                      />
                      {appliedCoupon ? (
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          className="px-3 py-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg text-xs font-bold transition-colors border border-red-200"
                        >
                          Remove
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          disabled={isApplyingCoupon || !couponCode.trim()}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-amber-400 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                        >
                          {isApplyingCoupon ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Apply"}
                        </button>
                      )}
                    </div>
                    {couponError && <p className="text-red-500 text-xs mt-1">{couponError}</p>}
                  </div>
                </div>

                {/* Big Single Action Button (Pay Now) */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 px-6 rounded-xl font-black text-lg text-slate-950 bg-gradient-to-r from-amber-400 via-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-lg shadow-amber-500/25 transition-all duration-200 transform active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin text-slate-950" />
                        <span>Processing Order...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-5 h-5 text-slate-950" />
                        <span>PAY NOW — {formatPrice(finalAmount)}</span>
                        <ArrowRight className="w-5 h-5 text-slate-950" />
                      </>
                    )}
                  </button>
                </div>

                {/* Trust Badges */}
                <div className="grid grid-cols-3 gap-2 pt-3 text-center text-[11px] text-slate-600 border-t border-slate-100">
                  <div className="flex items-center justify-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>UPI & Cards</span>
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Instant Link</span>
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>SSL Secure</span>
                  </div>
                </div>

              </form>

            </div>
          </div>

          {/* Right Column: Desktop Order Summary Card */}
          <div className="hidden lg:block lg:col-span-5">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl sticky top-6">
              
              <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
                <span>Order Summary</span>
                <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded border border-amber-200">
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </span>
              </h3>

              {/* Items List */}
              <div className="space-y-4 max-h-[280px] overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.productId} className="flex gap-3 items-center text-xs">
                    <img
                      src={item.product.imageUrl || '/placeholder.svg'}
                      alt={item.product.title}
                      className="w-14 h-14 object-cover rounded-lg bg-slate-50 border border-slate-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-xs line-clamp-2">{item.product.title}</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-bold text-slate-900 text-sm shrink-0">{formatPrice(item.product.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-slate-100 pt-4 mt-4 space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatPrice(totalAmount)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Discount ({appliedCoupon.code})</span>
                    <span>-{formatPrice(appliedCoupon.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500">
                  <span>Delivery Fee</span>
                  <span className="text-emerald-700 font-bold text-[10px] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">FREE INSTANT ACCESS</span>
                </div>
                <div className="flex justify-between items-center text-base font-black pt-3 border-t border-slate-200 text-slate-900">
                  <span>Total Amount</span>
                  <span className="text-amber-600 text-lg font-mono">{formatPrice(finalAmount)}</span>
                </div>
              </div>

            </div>
          </div>

        </div>

      </main>
    </div>
  )
}
