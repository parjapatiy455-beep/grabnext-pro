"use client"
export const runtime = 'edge'

import type React from "react"
import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Loader2,
  Lock,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Tag,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  Zap,
  Headphones,
  Award,
  Check,
  User as UserIcon,
  Phone,
  Mail,
  Sparkles,
} from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"
import { trackInitiateCheckout, trackAddPaymentInfo, trackPurchase } from "@/lib/pixel"
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
  const [xpayApiKey, setXpayApiKey] = useState<string>("xp_live_wtm5vj64kseuylg9cfmsl9")
  const hasFiredCheckout = useRef(false)
  const [showOrderSummaryMobile, setShowOrderSummaryMobile] = useState(true)

  // Coupon Code States (Dynamic Only - No hardcoded coupons)
  const [couponCode, setCouponCode] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null)
  const [couponError, setCouponError] = useState("")
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)
  const [isCouponOpen, setIsCouponOpen] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  })

  // Load gateway and XPay setting
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.payment_gateway) setActiveGateway(data.payment_gateway)
        if (data.xpay_api_key) setXpayApiKey(data.xpay_api_key)
      })
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
        user
          ? {
              email: user.email || undefined,
              firstName: user.displayName?.split(" ")[0],
              lastName: user.displayName?.split(" ").slice(1).join(" "),
              external_id: user.uid,
            }
          : undefined
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

  // Dynamic Coupon Application: ONLY when explicitly provided via URL query or active campaign session
  useEffect(() => {
    if (totalAmount > 0 && !appliedCoupon && typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      const urlCoupon = urlParams.get("coupon")
      const sessionCoupon = sessionStorage.getItem("copiedCouponCode") || ""

      const incomingCode = (urlCoupon || sessionCoupon || "").toUpperCase().trim()
      if (incomingCode) {
        setCouponCode(incomingCode)
        setIsApplyingCoupon(true)
        fetch("/api/coupons/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: incomingCode, cartTotal: totalAmount }),
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.valid) {
              setAppliedCoupon(data)
              toast({
                title: `🎉 Coupon ${incomingCode} Applied!`,
                description: `Discount of ${formatPrice(data.discountAmount)} deducted.`,
              })
            }
          })
          .catch(() => {})
          .finally(() => {
            setIsApplyingCoupon(false)
            // Clear single-use session coupon once checked so it doesn't persist across future sessions
            try {
              sessionStorage.removeItem("copiedCouponCode")
            } catch {}
          })
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
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim(), cartTotal: totalAmount }),
      })
      const data = await res.json()
      if (data.valid) {
        setAppliedCoupon(data)
        toast({ title: "Coupon Applied!", description: `Discount of ${formatPrice(data.discountAmount)} deducted.` })
      } else {
        setCouponError(data.message || "Invalid coupon code")
        setAppliedCoupon(null)
      }
    } catch {
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
    setIsCouponOpen(false)
  }

  const finalAmount = appliedCoupon ? Math.max(0, totalAmount - appliedCoupon.discountAmount) : totalAmount

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value })

  const updateOrder = useCallback(
    async (orderId: string, status: string = "failed", paymentId?: string, reason?: string) => {
      try {
        await fetch("/api/orders", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: orderId,
            status,
            paymentId: paymentId || null,
            reason,
          }),
        })
      } catch (err) {
        console.error("Order update error:", err)
      }
    },
    []
  )

  const getOrCreateUserId = async () => {
    if (user?.uid) return user.uid
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

  const launchXPay = (orderId: string, verifiedAmount: number) => {
    if (!window.XPay) {
      toast({ title: "Payment system loading, please retry", variant: "destructive" })
      setLoading(false)
      return
    }
    const orderTitle =
      items.length === 1 ? items[0].product.title : `${items[0].product.title} + ${items.length - 1} more`
    let paymentSucceeded = false
    const xpay = new window.XPay({
      api_key: xpayApiKey || "xp_live_wtm5vj64kseuylg9cfmsl9",
      amount: Math.round(verifiedAmount),
      title: orderTitle,
      order_id: orderId,
      customer_email: formData.email,
      customer_name: formData.name,
      customer_phone: formData.phone,
      onSuccess: async (data: { utr: string; amount?: number }) => {
        paymentSucceeded = true
        setLoading(true)

        const finalPaidAmount = data.amount !== undefined ? Number(data.amount) : verifiedAmount
        const purchaseItems = items.map((i) => ({
          id: i.productId,
          quantity: i.quantity || 1,
          item_price: i.product.price,
        }))
        const purchaseContentIds = items.map((i) => i.productId)
        const purchaseUserData = {
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          firstName: formData.name.trim()?.split(" ")[0] || undefined,
          lastName: formData.name.trim()?.split(" ").slice(1).join(" ") || undefined,
          external_id: user?.uid || undefined,
        }

        // Cache purchase details in sessionStorage for instant retrieval on thank you page
        try {
          sessionStorage.setItem("grabnext_last_purchase", JSON.stringify({
            orderId,
            utr: data.utr || orderId,
            value: finalPaidAmount,
            content_ids: purchaseContentIds,
            contents: purchaseItems,
            userData: purchaseUserData,
            timestamp: Date.now(),
          }))
          sessionStorage.setItem(`tracked_purchase_${orderId}`, "true")
          if (data.utr) sessionStorage.setItem(`tracked_purchase_${data.utr}`, "true")
        } catch {}

        // Instant Multi-Pixel & CAPI Purchase Dispatch
        trackPurchase(
          {
            value: finalPaidAmount,
            currency: "INR",
            content_ids: purchaseContentIds,
            contents: purchaseItems,
          },
          purchaseUserData
        )

        try {
          const res = await fetch("/api/xpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId,
              utr: data.utr,
              amount: data.amount !== undefined ? data.amount : verifiedAmount,
            }),
          })
          const verifyData = await res.json()
          if (!res.ok || !verifyData.success) {
            throw new Error(verifyData.error || "Payment verification failed")
          }
          clearCart()
          router.push(`/checkout/success?utr=${encodeURIComponent(data.utr || orderId)}&orderId=${encodeURIComponent(orderId)}`)
        } catch (err: any) {
          console.error("XPay verify error:", err)
          toast({
            title: "Verification Issue",
            description: err.message || "Could not confirm payment status",
            variant: "destructive",
          })
          clearCart()
          router.push(`/checkout/success?utr=${encodeURIComponent(data?.utr || orderId)}&orderId=${encodeURIComponent(orderId)}`)
        } finally {
          setLoading(false)
        }
      },
      onClose: async () => {
        setLoading(false)
        if (!paymentSucceeded) {
          await updateOrder(orderId, "failed", undefined, "Payment window closed before completion")
        }
      },
    })
    xpay.open()
  }

  const launchRazorpay = async (orderId: string) => {
    const orderRes = await fetch("/api/razorpay/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    })
    const orderData = await orderRes.json()
    if (!orderData.orderId) {
      toast({ title: orderData.error || "Failed to create payment order", variant: "destructive" })
      await updateOrder(orderId, "failed", undefined, orderData.error || "Failed to create payment order")
      setLoading(false)
      return
    }

    if (!window.Razorpay) {
      toast({ title: "Payment gateway not loaded", variant: "destructive" })
      await updateOrder(orderId, "failed", undefined, "Payment gateway failed to load")
      setLoading(false)
      return
    }

    let paymentSucceeded = false
    const options = {
      key: orderData.keyId,
      amount: orderData.amount,
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
        paymentSucceeded = true
        setLoading(true)

        const purchaseItems = items.map((i) => ({
          id: i.productId,
          quantity: i.quantity || 1,
          item_price: i.product.price,
        }))
        const purchaseContentIds = items.map((i) => i.productId)
        const purchaseUserData = {
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          firstName: formData.name.trim()?.split(" ")[0] || undefined,
          lastName: formData.name.trim()?.split(" ").slice(1).join(" ") || undefined,
          external_id: user?.uid || undefined,
        }

        const paidAmount = orderData.amount ? orderData.amount / 100 : finalAmount

        try {
          sessionStorage.setItem("grabnext_last_purchase", JSON.stringify({
            orderId,
            utr: response.razorpay_payment_id || orderId,
            value: paidAmount,
            content_ids: purchaseContentIds,
            contents: purchaseItems,
            userData: purchaseUserData,
            timestamp: Date.now(),
          }))
          sessionStorage.setItem(`tracked_purchase_${orderId}`, "true")
          if (response.razorpay_payment_id) {
            sessionStorage.setItem(`tracked_purchase_${response.razorpay_payment_id}`, "true")
          }
        } catch {}

        trackPurchase(
          {
            value: paidAmount,
            currency: "INR",
            content_ids: purchaseContentIds,
            contents: purchaseItems,
          },
          purchaseUserData
        )

        try {
          const verifyRes = await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          })
          const verifyData = await verifyRes.json()
          if (!verifyRes.ok || !verifyData.success) {
            throw new Error(verifyData.error || "Payment verification failed")
          }
          clearCart()
          router.push(`/checkout/success?utr=${encodeURIComponent(response.razorpay_payment_id || orderId)}&orderId=${encodeURIComponent(orderId)}`)
        } catch (err: any) {
          toast({
            title: "Payment Verification Failed",
            description: err.message || "Could not verify transaction with payment gateway",
            variant: "destructive",
          })
          clearCart()
          router.push(`/checkout/success?utr=${encodeURIComponent(response?.razorpay_payment_id || orderId)}&orderId=${encodeURIComponent(orderId)}`)
        } finally {
          setLoading(false)
        }
      },
      modal: {
        ondismiss: async () => {
          setLoading(false)
          if (!paymentSucceeded) {
            await updateOrder(orderId, "failed", undefined, "Payment window dismissed by user")
          }
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
            quantity: i.quantity || 1,
          })),
          couponCode: appliedCoupon?.code || null,
        }),
      })

      const orderData = await orderRes.json()
      if (!orderData.id) throw new Error(orderData.error || "Failed to initialize order")

      const verifiedOrderTotal = orderData.totalAmount !== undefined ? orderData.totalAmount : finalAmount

      // Track Pixel payment info
      trackAddPaymentInfo(
        {
          value: verifiedOrderTotal,
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

      // If order is completely free or already paid
      if (orderData.totalAmount === 0 || orderData.status === "paid") {
        trackPurchase(
          {
            value: Number(orderData.totalAmount) || 0,
            currency: "INR",
            content_ids: items.map((i) => i.productId),
            contents: items.map((i) => ({
              id: i.productId,
              quantity: i.quantity || 1,
              item_price: 0,
            })),
          },
          {
            email: formData.email.trim() || undefined,
            phone: formData.phone.trim() || undefined,
            external_id: userId || undefined,
          }
        )
        try {
          sessionStorage.setItem(`tracked_purchase_${orderData.id}`, "true")
        } catch {}
        clearCart()
        router.push(`/checkout/success?utr=${encodeURIComponent(orderData.id)}&orderId=${encodeURIComponent(orderData.id)}`)
        return
      }

      // Open Gateway immediately
      if (activeGateway === "razorpay") {
        await launchRazorpay(orderData.id)
      } else {
        launchXPay(orderData.id, verifiedOrderTotal)
      }
    } catch (err: any) {
      setLoading(false)
      toast({ title: "Checkout Error", description: err.message, variant: "destructive" })
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 mx-auto mb-4 flex items-center justify-center">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black mb-2 text-slate-900 dark:text-white">Your Cart is Empty</h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6">
            Explore our curated digital assets, pre-activated software, and masterclasses.
          </p>
          <button
            onClick={() => router.push("/products")}
            className="w-full bg-slate-950 hover:bg-slate-900 dark:bg-amber-400 dark:hover:bg-amber-500 text-white dark:text-slate-950 py-3.5 px-6 font-black rounded-xl transition-all shadow-md text-sm cursor-pointer"
          >
            Browse Digital Products →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-sans selection:bg-amber-500 selection:text-slate-950 pb-12">
      {/* 1. Distraction-Free Modern Checkout Header */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Store</span>
            </Link>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
            <Logo />
          </div>

          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-full font-bold">
            <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>100% Secure Checkout</span>
          </div>
        </div>
      </header>

      {/* 2. Main Content Container */}
      <main className="max-w-4xl mx-auto px-3 sm:px-4 pt-4 sm:pt-6">
        {/* Mobile Collapsible Order Summary Card */}
        <div className="block lg:hidden mb-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <button
              type="button"
              onClick={() => setShowOrderSummaryMobile(!showOrderSummaryMobile)}
              className="w-full p-3.5 sm:p-4 flex items-center justify-between text-left text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-900 dark:text-white">Order Summary</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal ml-1.5">
                    ({items.length} {items.length === 1 ? "item" : "items"})
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-amber-600 dark:text-amber-400 font-black text-sm sm:text-base">
                  {formatPrice(finalAmount)}
                </span>
                {showOrderSummaryMobile ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </button>

            {showOrderSummaryMobile && (
              <div className="border-t border-slate-100 dark:border-slate-800 p-3 sm:p-4 bg-slate-50/60 dark:bg-slate-900/60 space-y-3">
                {items.map((item) => (
                  <div key={item.productId} className="flex gap-3 items-center text-xs">
                    <div className="w-12 h-12 min-w-[48px] min-h-[48px] max-w-[48px] max-h-[48px] rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden shrink-0 flex items-center justify-center p-1">
                      <img
                        src={item.product.imageUrl || "/placeholder.svg"}
                        alt={item.product.title}
                        className="w-full h-full max-w-full max-h-full object-contain aspect-square"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white truncate text-xs">{item.product.title}</p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                        <Zap className="w-2.5 h-2.5 fill-current" /> Instant Email & WhatsApp
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-black text-slate-900 dark:text-white text-xs">
                        {formatPrice(item.product.price * item.quantity)}
                      </span>
                      {item.quantity > 1 && (
                        <span className="block text-[10px] text-slate-400">Qty: {item.quantity}</span>
                      )}
                    </div>
                  </div>
                ))}

                <div className="border-t border-slate-200 dark:border-slate-800 pt-2.5 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Subtotal</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{formatPrice(totalAmount)}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                      <span>Discount ({appliedCoupon.code})</span>
                      <span>-{formatPrice(appliedCoupon.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-500">
                    <span>Instant Digital Delivery</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px] bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800">
                      FREE
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. Main Grid (Form Left, Summary Right on Desktop) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          {/* Left Column: 1-Step Form */}
          <div className="lg:col-span-7">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-7 shadow-xl shadow-slate-200/50 dark:shadow-none">
              {/* Form Title & SSL Badge */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5 mb-4 sm:mb-5">
                <div>
                  <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white">Customer Details</h1>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Your download link and license will be delivered here instantly.
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-full font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Verified</span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleFastCheckoutSubmit} className="space-y-4">
                {/* 1. Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                    <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>Full Name</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="name"
                    type="text"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3.5 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-base sm:text-sm focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all placeholder:text-slate-400 font-medium"
                  />
                </div>

                {/* 2. WhatsApp / Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>WhatsApp / Mobile Number</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      name="phone"
                      type="tel"
                      inputMode="numeric"
                      placeholder="10-digit mobile number"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3.5 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-base sm:text-sm focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all placeholder:text-slate-400 font-mono font-medium"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Instant order status & download link will be shared via WhatsApp.</p>
                </div>

                {/* 3. Email Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>Email Address (Instant Delivery)</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="email"
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled={!!user?.email}
                    className="w-full px-3.5 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-base sm:text-sm focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all placeholder:text-slate-400 font-medium disabled:opacity-60"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Direct Google Drive / download access links sent directly to this email.</p>
                </div>

                {/* 4. Promo / Coupon Code Section */}
                <div className="pt-1">
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-3.5 transition-all">
                    {appliedCoupon ? (
                      /* When Coupon is Active */
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                          <span className="flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-amber-500" /> Have a Coupon Code?
                          </span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                            -{formatPrice(appliedCoupon.discountAmount)} OFF
                          </span>
                        </div>
                        <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-2.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <div className="truncate">
                              <span className="font-mono font-black text-xs text-emerald-950 dark:text-emerald-200 uppercase">
                                {appliedCoupon.code}
                              </span>
                              <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium ml-1.5">
                                ({formatPrice(appliedCoupon.discountAmount)} saved)
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveCoupon}
                            className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 font-bold px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors shrink-0 cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : !isCouponOpen ? (
                      /* Default Collapsed: Clean single-line toggle */
                      <button
                        type="button"
                        onClick={() => setIsCouponOpen(true)}
                        className="w-full flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors group cursor-pointer text-left py-0.5"
                      >
                        <span className="flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-amber-500 group-hover:rotate-12 transition-transform" />
                          <span>Have a Coupon Code?</span>
                        </span>
                        <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-transform" />
                      </button>
                    ) : (
                      /* Expanded when user clicks on "Have a Coupon Code?" */
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsCouponOpen(false)
                            setCouponError("")
                          }}
                          className="w-full flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer text-left pb-1"
                        >
                          <span className="flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-amber-500" />
                            <span>Have a Coupon Code?</span>
                          </span>
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        </button>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="ENTER COUPON CODE"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase().replace(/\s+/g, ""))}
                            disabled={isApplyingCoupon}
                            autoFocus
                            className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white placeholder:text-slate-400 uppercase focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                          />
                          <button
                            type="button"
                            onClick={handleApplyCoupon}
                            disabled={isApplyingCoupon || !couponCode.trim()}
                            className="px-4 py-2 bg-slate-900 dark:bg-amber-400 hover:bg-slate-800 dark:hover:bg-amber-500 text-amber-400 dark:text-slate-950 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs shrink-0"
                          >
                            {isApplyingCoupon ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Apply"}
                          </button>
                        </div>
                        {couponError && <p className="text-red-500 text-xs mt-1 font-medium">{couponError}</p>}
                      </div>
                    )}
                  </div>
                </div>

                {/* 5. Big Single Action Button (Pay Now) */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 px-6 rounded-2xl font-black text-base sm:text-lg text-slate-950 bg-gradient-to-r from-amber-400 via-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-xl shadow-amber-500/25 active:scale-[0.99] transition-all duration-200 disabled:opacity-70 flex items-center justify-center gap-2 cursor-pointer"
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

                  {/* Fast Indian UPI Trust Strip */}
                  <div className="pt-3 pb-1 flex flex-col items-center justify-center gap-1.5 text-center">
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline" />
                      <span>1-Click UPI &amp; Instant Verification</span>
                    </div>
                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                      <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-[10px] text-slate-800 dark:text-slate-200 shadow-xs flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span> GPay
                      </span>
                      <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-[10px] text-purple-700 dark:text-purple-400 shadow-xs flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-600 inline-block"></span> PhonePe
                      </span>
                      <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-[10px] text-sky-600 dark:text-sky-400 shadow-xs flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 inline-block"></span> Paytm
                      </span>
                      <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-[10px] text-slate-800 dark:text-slate-200 shadow-xs">
                        BHIM UPI
                      </span>
                      <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium text-[10px] text-slate-500 dark:text-slate-400 shadow-xs">
                        Cards &amp; NetBanking
                      </span>
                    </div>
                  </div>
                </div>

                {/* 6. Trust & Confidence Strip */}
                <div className="pt-3 border-t border-slate-200/90 dark:border-slate-800 space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 sm:p-2.5 flex flex-col items-center justify-center">
                      <Lock className="w-4 h-4 text-emerald-600 mb-1" />
                      <span className="text-[11px] font-black text-slate-800 dark:text-slate-200">256-Bit SSL</span>
                      <span className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">Bank-Grade Safe</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 sm:p-2.5 flex flex-col items-center justify-center">
                      <Zap className="w-4 h-4 text-amber-500 mb-1" />
                      <span className="text-[11px] font-black text-slate-800 dark:text-slate-200">Instant Access</span>
                      <span className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">Email &amp; WhatsApp</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 sm:p-2.5 flex flex-col items-center justify-center">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 mb-1" />
                      <span className="text-[11px] font-black text-slate-800 dark:text-slate-200">100% Genuine</span>
                      <span className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">Lifetime Setup</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 sm:p-2.5 flex flex-col items-center justify-center">
                      <Headphones className="w-4 h-4 text-blue-600 mb-1" />
                      <span className="text-[11px] font-black text-slate-800 dark:text-slate-200">WhatsApp Help</span>
                      <span className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">+91 75001 67987</span>
                    </div>
                  </div>

                  {/* Rating / Social Proof */}
                  <div className="flex items-center justify-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-semibold pt-0.5">
                    <div className="flex text-amber-400 text-sm">★★★★★</div>
                    <span className="text-[11px]">Rated <strong>4.9/5</strong> by 3,929+ Indian Creators &amp; Editors</span>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: Desktop Order Summary Card */}
          <div className="hidden lg:block lg:col-span-5">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl sticky top-20">
              <h3 className="font-black text-slate-900 dark:text-white text-base border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 flex items-center justify-between">
                <span>Order Summary</span>
                <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                  {items.length} {items.length === 1 ? "item" : "items"}
                </span>
              </h3>

              {/* Items List */}
              <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                {items.map((item) => (
                  <div key={item.productId} className="flex gap-3 items-center text-xs">
                    <div className="w-14 h-14 min-w-[56px] min-h-[56px] max-w-[56px] max-h-[56px] rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden shrink-0 flex items-center justify-center p-1">
                      <img
                        src={item.product.imageUrl || "/placeholder.svg"}
                        alt={item.product.title}
                        className="w-full h-full max-w-full max-h-full object-contain aspect-square"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white text-xs line-clamp-2 leading-snug">
                        {item.product.title}
                      </p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                        ⚡ Instant Access Link
                      </p>
                      <p className="text-slate-400 text-[10px] mt-0.5">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-black text-slate-900 dark:text-white text-sm shrink-0">
                      {formatPrice(item.product.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formatPrice(totalAmount)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                    <span>Discount ({appliedCoupon.code})</span>
                    <span>-{formatPrice(appliedCoupon.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500">
                  <span>Delivery Fee</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold text-[10px] bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                    FREE INSTANT ACCESS
                  </span>
                </div>
                <div className="flex justify-between items-center text-base font-black pt-3 border-t border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
                  <span>Total Amount</span>
                  <span className="text-amber-600 dark:text-amber-400 text-lg font-mono">
                    {formatPrice(finalAmount)}
                  </span>
                </div>
              </div>

              {/* Desktop Buyer Protection Card */}
              <div className="mt-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-extrabold text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Buyer Protection Guaranteed</span>
                </div>
                <div className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Instant Email &amp; WhatsApp Delivery in 60s</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Free Installation &amp; Setup Assistance</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>100% Pre-Activated Lifetime Access</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
