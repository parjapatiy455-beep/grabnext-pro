"use client"

import type React from "react"
import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Lock, ShieldCheck, ArrowRight, CheckCircle2, Tag, ChevronDown, ChevronUp, ShoppingBag } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"
import { trackInitiateCheckout, trackAddPaymentInfo } from "@/lib/pixel"
import { Logo } from "@/components/logo"

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
              toast({ title: `🎉 Coupon ${clean} Applied!`, description: `Instant 50% discount active.` })
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
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="text-center max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl">
          <ShoppingBag className="w-12 h-12 text-amber-400 mx-auto mb-4 opacity-80" />
          <h2 className="text-2xl font-black mb-2 text-white">Your cart is empty</h2>
          <p className="text-sm text-slate-400 mb-6">Select a digital product or masterclass to continue.</p>
          <button
            onClick={() => router.push("/products")}
            className="w-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 py-3.5 px-6 font-bold rounded-xl hover:from-amber-300 hover:to-amber-400 transition-all shadow-lg"
          >
            Browse Products
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950 pb-12 relative overflow-hidden">
      {/* Subtle Ambient Background Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-amber-500/10 via-indigo-500/10 to-transparent blur-[130px] rounded-full" />
        <div className="absolute top-1/2 -right-32 w-[450px] h-[300px] bg-blue-500/10 blur-[140px] rounded-full" />
        <div className="absolute bottom-10 -left-32 w-[450px] h-[300px] bg-emerald-500/10 blur-[140px] rounded-full" />
      </div>
      
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 py-3.5 px-4 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Logo textClassName="text-white text-lg sm:text-xl" />
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full font-semibold">
            <Lock className="w-3.5 h-3.5" />
            <span>256-Bit SSL Secured</span>
          </div>
        </div>
      </header>

      {/* Main Container - Compact & Single Screen Responsive */}
      <main className="max-w-4xl mx-auto px-4 pt-6 sm:pt-10">
        
        {/* Mobile Cart Summary Accordion Toggle */}
        <div className="block lg:hidden mb-6">
          <button
            onClick={() => setShowOrderSummaryMobile(!showOrderSummaryMobile)}
            className="w-full bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between text-left text-sm font-semibold text-white shadow-md"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              <span>Order Summary ({items.length} {items.length === 1 ? 'item' : 'items'})</span>
              {showOrderSummaryMobile ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </div>
            <span className="text-amber-400 font-extrabold text-base">{formatPrice(finalAmount)}</span>
          </button>

          {showOrderSummaryMobile && (
            <div className="bg-slate-900/90 border border-slate-800 border-t-0 p-4 rounded-b-xl space-y-3 mt-0.5">
              {items.map((item) => (
                <div key={item.productId} className="flex gap-3 items-center text-xs border-b border-slate-800 pb-3">
                  <img
                    src={item.product.imageUrl || '/placeholder.svg'}
                    alt={item.product.title}
                    className="w-12 h-12 object-cover rounded bg-slate-800 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white truncate">{item.product.title}</p>
                    <p className="text-slate-400 text-[11px]">Qty: {item.quantity}</p>
                  </div>
                  <span className="font-bold text-amber-400">{formatPrice(item.product.price * item.quantity)}</span>
                </div>
              ))}
              <div className="flex justify-between text-xs text-slate-400 pt-1">
                <span>Subtotal: {formatPrice(totalAmount)}</span>
                {appliedCoupon && <span className="text-emerald-400">Discount: -{formatPrice(appliedCoupon.discountAmount)}</span>}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Fast 1-Step Form Box (Compact 7 Columns on Desktop) */}
          <div className="lg:col-span-7">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-2xl relative">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-white">Fast Checkout</h1>
                  <p className="text-xs text-slate-400 mt-0.5">Enter details below to complete your order instantly.</p>
                </div>
                <span className="text-xs bg-amber-500/10 text-amber-400 font-bold px-2.5 py-1 rounded border border-amber-500/20">
                  Instant Delivery
                </span>
              </div>

              {/* 1-Step Fast Form */}
              <form onSubmit={handleFastCheckoutSubmit} className="space-y-4">
                
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Full Name <span className="text-amber-400">*</span>
                  </label>
                  <input
                    name="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 transition-colors placeholder:text-slate-500"
                  />
                </div>

                {/* Mobile Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    WhatsApp / Phone Number <span className="text-amber-400">*</span>
                  </label>
                  <input
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    placeholder="10-digit mobile number"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 transition-colors placeholder:text-slate-500 font-mono"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Email Address (For Instant Download) <span className="text-amber-400">*</span>
                  </label>
                  <input
                    name="email"
                    type="email"
                    placeholder="yourname@gmail.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled={!!user?.email}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 transition-colors placeholder:text-slate-500 disabled:opacity-60"
                  />
                </div>

                {/* Compact Promo / Coupon Code */}
                <div className="pt-1">
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-semibold flex items-center gap-1"><Tag className="w-3.5 h-3.5 text-amber-400" /> Have a Promo Code?</span>
                      {appliedCoupon && <span className="text-emerald-400 font-bold">-{formatPrice(appliedCoupon.discountAmount)}</span>}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="ENTER CODE"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                        disabled={!!appliedCoupon || isApplyingCoupon}
                        className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono font-bold text-white placeholder:text-slate-600 uppercase focus:outline-none focus:border-amber-500"
                      />
                      {appliedCoupon ? (
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          className="px-3 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-xs font-bold transition-colors border border-red-500/30"
                        >
                          Remove
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          disabled={isApplyingCoupon || !couponCode.trim()}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 border border-slate-700"
                        >
                          {isApplyingCoupon ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Apply"}
                        </button>
                      )}
                    </div>
                    {couponError && <p className="text-red-400 text-xs mt-1">{couponError}</p>}
                  </div>
                </div>

                {/* Big Single Action Button (Pay Now) */}
                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 px-6 rounded-xl font-black text-lg text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.4)] transition-all duration-300 transform active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
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
                <div className="grid grid-cols-3 gap-2 pt-2 text-center text-[11px] text-slate-400 border-t border-slate-800/80">
                  <div className="flex items-center justify-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>UPI & Cards</span>
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Instant Link</span>
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>SSL Secure</span>
                  </div>
                </div>

              </form>

            </div>
          </div>

          {/* Right Column: Desktop Order Summary Card (Compact 5 Columns on Desktop) */}
          <div className="hidden lg:block lg:col-span-5">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl sticky top-24">
              
              <h3 className="font-bold text-white text-base border-b border-slate-800 pb-3 mb-4 flex items-center justify-between">
                <span>Order Summary</span>
                <span className="text-xs bg-amber-500/10 text-amber-400 font-bold px-2 py-0.5 rounded border border-amber-500/20">
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
                      className="w-14 h-14 object-cover rounded-lg bg-slate-950 border border-slate-800 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-xs line-clamp-2">{item.product.title}</p>
                      <p className="text-slate-400 text-[11px] mt-0.5">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-bold text-amber-400 text-sm shrink-0">{formatPrice(item.product.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-slate-800 pt-4 mt-4 space-y-2 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatPrice(totalAmount)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-400 font-semibold">
                    <span>Discount ({appliedCoupon.code})</span>
                    <span>-{formatPrice(appliedCoupon.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-400">
                  <span>Delivery Fee</span>
                  <span className="text-emerald-400 font-bold text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded">FREE INSTANT ACCESS</span>
                </div>
                <div className="flex justify-between items-center text-base font-black pt-3 border-t border-slate-800 text-white">
                  <span>Total Amount</span>
                  <span className="text-amber-400 text-lg font-mono">{formatPrice(finalAmount)}</span>
                </div>
              </div>

            </div>
          </div>

        </div>

      </main>
    </div>
  )
}
