"use client"
export const runtime = 'edge'

import { useState, useEffect, useRef } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { StoreHeader } from "@/components/store-header"
import { useAuth } from "@/contexts/auth-context"
import { getUserOrders } from "@/lib/d1-client"
import { toast } from "@/hooks/use-toast"
import { signOutUser } from "@/lib/auth"
import {
  User,
  ShoppingBag,
  Download,
  Loader2,
  Package,
  LogIn,
  CalendarDays,
  CreditCard,
  ExternalLink,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  MapPin,
  Lock,
  ShoppingCart,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  Copy,
  Check,
  LogOut,
  Key,
  Zap,
  Sparkles,
  RefreshCw,
  MessageCircle,
} from "lucide-react"
import Link from "next/link"
import { DigitalProductViewer } from "@/components/digital-product-viewer"
import { fbq } from "@/lib/pixel"

function StatusBadge({ status }: { status: string }) {
  const norm = (status || "").toLowerCase()
  if (norm === "paid" || norm === "completed") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Paid &amp; Active
      </span>
    )
  }
  if (norm === "pending") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
        <Clock className="h-3 w-3 text-amber-500" />
        Payment Pending
      </span>
    )
  }
  if (norm === "failed") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
        <XCircle className="h-3 w-3 text-rose-500" />
        Failed
      </span>
    )
  }
  if (norm === "refunded") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
        Refunded
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
      {norm ? norm.charAt(0).toUpperCase() + norm.slice(1) : "Unknown"}
    </span>
  )
}

function formatDateTime(ts: number | string) {
  if (!ts) return "—"
  const d = new Date(Number(ts))
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

// ─── Blob-based download row ─────────────────────────────────────────────────
function DownloadAssetRow({ asset, secureUrl }: { asset: any; secureUrl: string }) {
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    if (asset.type === "link") {
      window.open(secureUrl, "_blank", "noopener,noreferrer")
      return
    }
    setDownloading(true)
    try {
      const res = await fetch(`${secureUrl}&download=1`, { credentials: "include" })
      if (!res.ok) throw new Error(`Download failed: ${res.statusText}`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url

      let filename = asset.name || "download"
      const cd = res.headers.get("content-disposition")
      if (cd) {
        const match = cd.match(/filename="([^"]+)"/)
        if (match && match[1]) filename = match[1]
      } else {
        if (asset.type === "pdf" && !filename.toLowerCase().endsWith(".pdf")) filename += ".pdf"
        else if (asset.type === "video" && !filename.toLowerCase().endsWith(".mp4")) filename += ".mp4"
      }
      a.download = filename

      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err: any) {
      console.error("Download error:", err)
      toast({ title: "Download Issue", description: "Could not fetch file, please try again", variant: "destructive" })
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2.5 bg-white dark:bg-slate-900 p-3 sm:p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
      <div className="flex items-center gap-2.5 min-w-0 pr-2">
        <div className="h-8 w-8 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
          <Download className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{asset.name}</p>
          <span className="text-[10px] font-black uppercase text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/60 px-1.5 py-0.2 rounded inline-block mt-0.5">
            {asset.type || "FILE"}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {asset.type !== "link" && (
          <DigitalProductViewer assetUrl={secureUrl} title={asset.name} type={asset.type} />
        )}
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-slate-900 dark:bg-violet-600 hover:bg-slate-800 dark:hover:bg-violet-700 disabled:opacity-60 px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
        >
          {downloading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Fetching...</span>
            </>
          ) : (
            <>
              <Download className="h-3.5 w-3.5" />
              <span>{asset.type === "link" ? "Open Access" : "Download"}</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// ─── Fresh assets fetched from product DB ────────────────────────────────────
function FreshDownloadCard({ item }: { item: any }) {
  const [assets, setAssets] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(true)
  const productId = item.productId || item.id

  useEffect(() => {
    if (!productId) {
      setLoading(false)
      return
    }
    fetch(`/api/user/product-assets?productId=${productId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        setAssets(d.assets || [])
        setLoading(false)
      })
      .catch(() => {
        try {
          const snapshotAssets = JSON.parse(item.downloadUrl)
          setAssets(Array.isArray(snapshotAssets) ? snapshotAssets : [])
        } catch {
          setAssets([])
        }
        setLoading(false)
      })
  }, [productId, item.downloadUrl])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-400 py-3">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-500" />
        <span>Loading secure download links...</span>
      </div>
    )
  }

  if (!assets || assets.length === 0) {
    return (
      <div className="py-2.5 text-xs text-slate-400 flex items-center gap-1.5">
        <span>Files will be assigned shortly or sent directly to your email.</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 mt-2">
      {assets.map((asset: any) => {
        const secureUrl =
          asset.provider === "external" || asset.type === "link"
            ? asset.url
            : `/api/user/secure-asset?productId=${productId}&assetId=${asset.id}`
        return <DownloadAssetRow key={asset.id} asset={asset} secureUrl={secureUrl} />
      })}
    </div>
  )
}

// ─── Modern Order Card Component ─────────────────────────────────────────────
function OrderCard({ order, onPay }: { order: any; onPay?: (order: any) => void }) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  let items: any[] = []
  try {
    items = Array.isArray(order.items) ? order.items : JSON.parse(order.items)
  } catch {}

  const isPaid = order.status === "paid" || order.status === "completed"
  const isFailed = order.status === "failed"
  const isPending = order.status === "pending"

  const copyOrderId = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(order.id)
    setCopied(true)
    toast({ title: "Order ID copied to clipboard!" })
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all">
      {/* Order Header / Summary Row */}
      <div
        className="p-4 sm:p-5 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Left: ID & Date */}
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                {order.id}
              </span>
              <button
                type="button"
                onClick={copyOrderId}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                title="Copy Order ID"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 font-medium">
              <CalendarDays className="h-3 w-3" />
              <span>{formatDateTime(order.createdAt)}</span>
            </p>
          </div>
        </div>

        {/* Center: Total Price & Items count */}
        <div className="flex items-center justify-between md:justify-center gap-6 border-y md:border-y-0 border-slate-100 dark:border-slate-800 py-2 md:py-0">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Total</span>
            <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              ₹{Number(order.totalAmount || 0).toLocaleString("en-IN")}
            </span>
          </div>

          <div className="md:hidden">
            <StatusBadge status={order.status} />
          </div>
        </div>

        {/* Right: Status badge & Chevron */}
        <div className="flex items-center justify-between md:justify-end gap-3">
          <div className="hidden md:flex flex-col items-end gap-1">
            <StatusBadge status={order.status} />
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Zap className="h-2.5 w-2.5 fill-current" /> Instant Digital Access
            </span>
          </div>

          <button
            type="button"
            className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0 ml-auto md:ml-0"
            aria-label="Toggle details"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Order Details */}
      {expanded && (
        <div className="px-4 sm:px-6 pb-5 pt-1 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 space-y-4">
          {/* Customer / Order Metadata Pill */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-600 dark:text-slate-400 pt-3">
            {order.userName && (
              <span className="bg-white dark:bg-slate-900 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-800 font-medium">
                Customer: <strong className="text-slate-900 dark:text-white">{order.userName}</strong>
              </span>
            )}
            {order.userEmail && (
              <span className="bg-white dark:bg-slate-900 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-800 font-medium truncate max-w-xs">
                Email: <strong className="text-slate-900 dark:text-white">{order.userEmail}</strong>
              </span>
            )}
            {order.userPhone && (
              <span className="bg-white dark:bg-slate-900 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-800 font-medium">
                WhatsApp: <strong className="text-slate-900 dark:text-white">{order.userPhone}</strong>
              </span>
            )}
            {order.paymentId && (
              <span className="bg-white dark:bg-slate-900 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-800 font-medium font-mono text-[11px]">
                UTR / Ref: <strong className="text-slate-900 dark:text-white">{order.paymentId}</strong>
              </span>
            )}
          </div>

          {/* Action Callout if Pending / Failed */}
          {(isPending || isFailed) && onPay && (
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-amber-950 dark:text-amber-200">
                    {isFailed ? "Payment was incomplete or failed" : "Order is awaiting payment"}
                  </p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400">
                    Complete payment to instantly unlock your digital downloads &amp; license keys.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => onPay(order)}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-4 h-9 rounded-xl shadow-sm shrink-0 cursor-pointer"
              >
                <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                <span>Pay ₹{Number(order.totalAmount || 0).toLocaleString("en-IN")} Now</span>
              </Button>
            </div>
          )}

          {/* Ordered Products List */}
          <div className="space-y-3">
            <p className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>Purchased Products ({items.length})</span>
            </p>

            {items.map((item: any, i: number) => (
              <div
                key={i}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 space-y-3"
              >
                <div className="flex gap-3 items-center">
                  {/* Thumbnail strictly sized */}
                  <div className="w-14 h-14 min-w-[56px] min-h-[56px] max-w-[56px] max-h-[56px] rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden shrink-0 flex items-center justify-center p-1">
                    <img
                      src={item.imageUrl || "/placeholder.svg"}
                      alt={item.title}
                      className="w-full h-full max-w-full max-h-full object-contain aspect-square"
                    />
                  </div>

                  {/* Title & Qty */}
                  <div className="flex-1 min-w-0">
                    {item.id ? (
                      <Link
                        href={`/products/${item.id}`}
                        className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white hover:text-violet-600 transition-colors line-clamp-2"
                      >
                        {item.title}
                      </Link>
                    ) : (
                      <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-2">
                        {item.title}
                      </p>
                    )}
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Qty: {item.quantity || 1} • ₹{Number(item.price || 0).toLocaleString("en-IN")} each
                    </p>
                  </div>

                  {/* Item Total */}
                  <div className="text-right shrink-0">
                    <span className="font-black text-sm text-slate-900 dark:text-white">
                      ₹{((item.price || 0) * (item.quantity || 1)).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Digital Download Links (if paid) */}
                {isPaid && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Ready for Instant Download</span>
                    </div>
                    <FreshDownloadCard item={item} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Dashboard Page ─────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, loading: authLoading, refreshUser } = useAuth()
  const [orders, setOrders] = useState<any[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [profileForm, setProfileForm] = useState({
    displayName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "",
  })
  const [savingProfile, setSavingProfile] = useState(false)
  const [activeGateway, setActiveGateway] = useState<string>("xpay")
  const [xpayApiKey, setXpayApiKey] = useState<string>("xp_live_wtm5vj64kseuylg9cfmsl9")
  const [, setCompletingPayment] = useState<boolean>(false)
  const hasFiredDashboardView = useRef(false)

  // Load active payment gateway and XPay key
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.payment_gateway) setActiveGateway(data.payment_gateway)
        if (data.xpay_api_key) setXpayApiKey(data.xpay_api_key)
      })
      .catch(() => setActiveGateway("xpay"))
  }, [])

  // Load Razorpay script when needed
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

  useEffect(() => {
    if (user) {
      setProfileForm({
        displayName: user.displayName || "",
        phone: (user as any).phone || "",
        address: (user as any).address || "",
        city: (user as any).city || "",
        state: (user as any).state || "",
        country: (user as any).country || "",
      })
      loadOrders()
    } else if (!authLoading) {
      setOrdersLoading(false)
    }
  }, [user, authLoading])

  // Custom conversion: track authenticated users visiting /dashboard
  useEffect(() => {
    if (user && !hasFiredDashboardView.current) {
      hasFiredDashboardView.current = true
      fbq("trackCustom", "DashboardView", {
        url: "/dashboard",
        userId: user.uid,
      })
    }
  }, [user])

  const loadOrders = async () => {
    if (!user) return
    setOrdersLoading(true)
    try {
      const data = await getUserOrders(user.uid)
      setOrders(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
    } finally {
      setOrdersLoading(false)
    }
  }

  const updateOrder = async (orderId: string, paymentId: string) => {
    try {
      await fetch("/api/xpay/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          utr: paymentId,
        }),
      })
      toast({ title: "🎉 Payment Successful!" })
      loadOrders()
    } catch (err) {
      console.error("Order update error:", err)
    }
  }

  const handlePayNow = async (order: any) => {
    setCompletingPayment(true)
    const orderId = order.id

    if (activeGateway === "razorpay") {
      const orderRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      })
      const orderData = await orderRes.json()
      if (!orderData.orderId || !window.Razorpay) {
        toast({ title: "Failed to load payment gateway", variant: "destructive" })
        setCompletingPayment(false)
        return
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: "INR",
        name: "Grabnext",
        order_id: orderData.orderId,
        prefill: {
          name: order.userName || "",
          email: order.userEmail || "",
          contact: order.userPhone || "",
        },
        handler: async (response: any) => {
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
            toast({ title: "🎉 Payment Verified & Successful!" })
            loadOrders()
          } catch (vErr: any) {
            toast({ title: "Verification Failed", description: vErr.message, variant: "destructive" })
          }
          setCompletingPayment(false)
        },
        modal: { ondismiss: () => setCompletingPayment(false) },
      }
      const rzp = new window.Razorpay(options)
      rzp.open()
    } else {
      if (!window.XPay) {
        toast({ title: "XPay not loaded", variant: "destructive" })
        setCompletingPayment(false)
        return
      }
      const xpay = new window.XPay({
        api_key: xpayApiKey || "xp_live_wtm5vj64kseuylg9cfmsl9",
        amount: Math.round(order.totalAmount),
        title: `Order ${orderId}`,
        order_id: orderId,
        onSuccess: async (data: { utr: string }) => {
          await updateOrder(orderId, data.utr)
          setCompletingPayment(false)
        },
        onClose: () => setCompletingPayment(false),
      })
      xpay.open()
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)
    try {
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      })
      if (!res.ok) throw new Error("Failed to save")
      toast({ title: "✅ Profile updated successfully!" })
      await refreshUser()
    } catch {
      toast({ title: "Failed to update profile", variant: "destructive" })
    } finally {
      setSavingProfile(false)
    }
  }

  // Group downloadable items by their paid/completed orders
  const groupedDownloads = orders
    .filter((order) => order.status === "paid" || order.status === "completed")
    .map((order) => {
      let items: any[] = []
      try {
        items = Array.isArray(order.items) ? order.items : JSON.parse(order.items)
      } catch {}
      const digitalItems = items.filter((item: any) => item.downloadUrl)
      return {
        orderId: order.id,
        orderDate: order.createdAt,
        paymentId: order.paymentId,
        items: digitalItems,
      }
    })
    .filter((group) => group.items.length > 0)

  const totalDownloadsCount = groupedDownloads.reduce((sum, group) => sum + group.items.length, 0)
  const isGuest = (user as any)?.isGuest

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <StoreHeader />
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
          <p className="text-xs text-slate-400 font-medium">Loading your account...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
        <StoreHeader />
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="max-w-md mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-xl">
            <div className="h-16 w-16 rounded-2xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-black mb-2 text-slate-900 dark:text-white">Sign in to your account</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              View your purchased assets, track downloads, and manage your account.
            </p>
            <div className="flex gap-3 justify-center">
              <Button asChild className="bg-slate-950 hover:bg-slate-800 text-white dark:bg-violet-600 dark:hover:bg-violet-700 font-bold px-6 rounded-xl">
                <Link href="/auth/login">
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-slate-300 dark:border-slate-700 font-bold px-6 rounded-xl">
                <Link href="/auth/register">Create Account</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const initialLetter = (user.displayName || user.email || "Y")[0].toUpperCase()

  return (
    <div className="min-h-screen bg-slate-50/80 dark:bg-slate-950 text-slate-900 dark:text-white pb-16">
      <StoreHeader />

      <main className="container mx-auto px-4 pt-6 sm:pt-8 max-w-5xl">
        {/* 1. Hero Profile Bento Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl shadow-slate-200/40 dark:shadow-none mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            {/* Left: Avatar + Details */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="h-16 w-16 sm:h-18 sm:w-18 rounded-2xl bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-violet-500/20 shrink-0">
                  {initialLetter}
                </div>
                <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" title="Online" />
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    {user.displayName || "Valued Customer"}
                  </h1>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-violet-100 dark:bg-violet-950/80 text-violet-700 dark:text-violet-300 px-2 py-0.5 rounded-full border border-violet-200 dark:border-violet-800 flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3 text-violet-600" /> Verified Member
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{user.email}</p>
                {(user as any).phone && (
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">WhatsApp: {(user as any).phone}</p>
                )}
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {isGuest && (
                <Button
                  asChild
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
                >
                  <Link href="/dashboard/confirm-account" className="flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5" />
                    <span>Set Permanent Password</span>
                  </Link>
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await signOutUser()
                  await refreshUser()
                  window.location.href = "/auth/login"
                }}
                className="rounded-xl border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5 mr-1.5 text-red-500" />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
            <div className="bg-slate-50 dark:bg-slate-950 p-3 sm:p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Orders</span>
              <span className="text-base sm:text-xl font-black text-slate-900 dark:text-white mt-0.5 block">
                {orders.length}
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 p-3 sm:p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Downloads</span>
              <span className="text-base sm:text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                {totalDownloadsCount}
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 p-3 sm:p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Access Status</span>
              <span className="text-xs sm:text-sm font-black text-violet-600 dark:text-violet-400 mt-1 flex items-center gap-1 truncate">
                <Zap className="h-3 w-3 fill-current shrink-0" />
                <span className="truncate">Instant Active</span>
              </span>
            </div>
          </div>
        </div>

        {/* 2. Navigation Tabs (EXPLICIT USER INSTRUCTION: Profile moved to position 3!) */}
        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid grid-cols-3 max-w-md w-full bg-slate-200/70 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700 mb-6">
            {/* TAB 1: Orders */}
            <TabsTrigger
              value="orders"
              className="rounded-xl flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-violet-600 dark:data-[state=active]:text-violet-400 data-[state=active]:shadow-xs transition-all cursor-pointer"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>Orders</span>
              {orders.length > 0 && (
                <span className="text-[10px] bg-violet-100 dark:bg-violet-950/80 text-violet-700 dark:text-violet-300 px-1.5 py-0.2 rounded-full font-black">
                  {orders.length}
                </span>
              )}
            </TabsTrigger>

            {/* TAB 2: Downloads */}
            <TabsTrigger
              value="downloads"
              className="rounded-xl flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-violet-600 dark:data-[state=active]:text-violet-400 data-[state=active]:shadow-xs transition-all cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Downloads</span>
              {totalDownloadsCount > 0 && (
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.2 rounded-full font-black">
                  {totalDownloadsCount}
                </span>
              )}
            </TabsTrigger>

            {/* TAB 3: Profile (MOVED TO POSITION 3 AS REQUESTED) */}
            <TabsTrigger
              value="profile"
              className="rounded-xl flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-violet-600 dark:data-[state=active]:text-violet-400 data-[state=active]:shadow-xs transition-all cursor-pointer"
            >
              <User className="h-3.5 w-3.5" />
              <span>Profile</span>
            </TabsTrigger>
          </TabsList>

          {/* ─── TAB 1 CONTENT: Orders ────────────────────────────────────────── */}
          <TabsContent value="orders" className="space-y-4">
            {ordersLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
                <p className="text-xs text-slate-400">Loading your orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8">
                <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-4">
                  <Package className="h-8 w-8" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">No orders placed yet</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
                  Explore top-rated software bundles, editing toolkits, and premium digital assets.
                </p>
                <Button asChild className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-violet-600 dark:hover:bg-violet-700 font-bold rounded-xl px-6 text-xs shadow-md">
                  <Link href="/products">Browse Digital Products →</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3.5">
                {orders.map((order: any) => (
                  <OrderCard key={order.id} order={order} onPay={handlePayNow} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* ─── TAB 2 CONTENT: Downloads ─────────────────────────────────────── */}
          <TabsContent value="downloads" className="space-y-4">
            {groupedDownloads.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8">
                <div className="h-16 w-16 rounded-2xl bg-violet-50 dark:bg-violet-950/40 text-violet-500 flex items-center justify-center mx-auto mb-4">
                  <Download className="h-8 w-8" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">No active downloads yet</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
                  Paid orders containing digital software or templates will unlock instant files here.
                </p>
                <Button asChild className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-violet-600 dark:hover:bg-violet-700 font-bold rounded-xl px-6 text-xs shadow-md">
                  <Link href="/products">Explore Products →</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {groupedDownloads.map((group, groupIdx) => (
                  <div
                    key={groupIdx}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all"
                  >
                    <div className="bg-slate-50 dark:bg-slate-800/50 px-5 py-3.5 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap justify-between items-center gap-3">
                      <div>
                        <span className="text-[10px] uppercase font-black text-violet-600 dark:text-violet-400 tracking-wider">
                          Verified Order
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                            {group.orderId}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" /> {formatDateTime(group.orderDate)}
                          </span>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        Unlocked &amp; Active
                      </span>
                    </div>

                    <div className="p-4 sm:p-5 divide-y divide-slate-100 dark:divide-slate-800">
                      {group.items.map((item: any, i: number) => (
                        <div key={i} className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row gap-4 items-start">
                          <div className="w-16 h-16 min-w-[64px] min-h-[64px] max-w-[64px] max-h-[64px] rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-1 flex items-center justify-center shrink-0">
                            <img
                              src={item.imageUrl || "/placeholder.svg"}
                              alt={item.title}
                              className="w-full h-full max-w-full max-h-full object-contain aspect-square"
                            />
                          </div>

                          <div className="flex-1 min-w-0 w-full space-y-2">
                            <div>
                              {item.id ? (
                                <Link
                                  href={`/products/${item.id}`}
                                  className="font-bold text-slate-900 dark:text-white text-sm hover:text-violet-600 transition-colors line-clamp-1 flex items-center gap-1 group"
                                >
                                  <span>{item.title}</span>
                                  <ExternalLink className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 shrink-0" />
                                </Link>
                              ) : (
                                <p className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1">
                                  {item.title}
                                </p>
                              )}
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                ⚡ Lifetime Pre-Activated Access
                              </span>
                            </div>

                            <FreshDownloadCard item={item} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ─── TAB 3 CONTENT: Profile (MOVED TO POSITION 3) ────────────────── */}
          <TabsContent value="profile">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xs">
              <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-slate-100 dark:border-slate-800">
                <div className="h-9 w-9 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 flex items-center justify-center shrink-0">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    Personal Details &amp; Settings
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Manage your contact info for digital licenses and order receipts.
                  </p>
                </div>
              </div>

              {isGuest && (
                <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-start gap-3">
                  <Key className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1 text-xs">
                    <p className="font-bold text-amber-950 dark:text-amber-200">
                      Guest Account Detected
                    </p>
                    <p className="text-amber-800 dark:text-amber-400 mt-0.5">
                      Set a permanent password so you can easily log back into your dashboard from any smartphone or computer.
                    </p>
                    <Button
                      asChild
                      size="sm"
                      className="mt-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-xs cursor-pointer"
                    >
                      <Link href="/dashboard/confirm-account">Set Password Now →</Link>
                    </Button>
                  </div>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4 max-w-xl">
                {/* Full Name */}
                <div>
                  <Label htmlFor="displayName" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Full Name
                  </Label>
                  <Input
                    id="displayName"
                    value={profileForm.displayName}
                    onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })}
                    placeholder="Enter your name"
                    className="mt-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-sm"
                  />
                </div>

                {/* Email (Readonly) */}
                <div>
                  <Label htmlFor="email-display" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Email Address
                  </Label>
                  <Input
                    id="email-display"
                    value={user.email}
                    disabled
                    className="mt-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-sm opacity-70"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Email is linked to your order records and cannot be altered.
                  </p>
                </div>

                {/* Phone */}
                <div>
                  <Label htmlFor="phone" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    WhatsApp / Phone Number
                  </Label>
                  <Input
                    id="phone"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="mt-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-sm font-mono"
                  />
                </div>

                {/* Address */}
                <div>
                  <Label htmlFor="address" className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span>Street Address</span>
                  </Label>
                  <Input
                    id="address"
                    value={profileForm.address}
                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    placeholder="Street or locality"
                    className="mt-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-sm"
                  />
                </div>

                {/* City & State */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="city" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      City
                    </Label>
                    <Input
                      id="city"
                      value={profileForm.city}
                      onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                      placeholder="City"
                      className="mt-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      State
                    </Label>
                    <Input
                      id="state"
                      value={profileForm.state}
                      onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                      placeholder="State"
                      className="mt-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-sm"
                    />
                  </div>
                </div>

                {/* Save CTA */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={savingProfile}
                    className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-violet-600 dark:hover:bg-violet-700 font-bold px-6 h-11 rounded-xl text-xs cursor-pointer shadow-sm"
                  >
                    {savingProfile ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <span>Save Profile Changes</span>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
