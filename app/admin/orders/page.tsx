"use client"

import { useState, useEffect } from "react"
import { fetchAllOrders } from "@/lib/d1-client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Package, User, CreditCard, CalendarDays, ChevronDown, ChevronUp, ExternalLink,
  Download, Search, Filter, RefreshCw, Loader2, ShoppingBag, Phone, Mail, MapPin
} from "lucide-react"
import Link from "next/link"
import { DigitalProductViewer } from "@/components/digital-product-viewer"

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    paid: "bg-green-100 text-green-700 border-green-200",
    pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
    completed: "bg-blue-100 text-blue-700 border-blue-200",
    processing: "bg-purple-100 text-purple-700 border-purple-200",
    refunded: "bg-red-100 text-red-700 border-red-200",
    cancelled: "bg-gray-100 text-gray-600 border-gray-200",
  }
  const cls = variants[status] || "bg-gray-100 text-gray-600 border-gray-200"
  return (
    <span className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full border ${cls}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

function formatDateTime(ts: number | string) {
  if (!ts) return "—"
  const d = new Date(Number(ts))
  return d.toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true
  })
}

function OrderRow({ order, onStatusChange }: { order: any; onStatusChange: (id: string, status: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  let items: any[] = []
  try { items = Array.isArray(order.items) ? order.items : JSON.parse(order.items) } catch { }

  const handleStatusChange = async (newStatus: string) => {
    setUpdatingStatus(true)
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) {
        onStatusChange(order.id, newStatus)
      }
    } catch (e) {
      console.error("Failed to update status", e)
    } finally {
      setUpdatingStatus(false)
    }
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden hover:border-orange-300 hover:shadow-sm transition-all">
      {/* Summary Row */}
      <div
        className="flex flex-wrap gap-3 items-center px-4 py-3.5 bg-white cursor-pointer hover:bg-blue-50/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Order ID */}
        <div className="min-w-[140px]">
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Order ID</p>
          <p className="font-mono text-sm font-bold text-gray-800">{order.id}</p>
        </div>

        {/* Customer */}
        <div className="flex-1 min-w-[220px]">
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Customer Details</p>
          <p className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-blue-500 shrink-0" />
            {order.userName || "Customer"}
          </p>
          <div className="flex flex-col gap-0.5 mt-0.5 text-xs">
            {order.userEmail && (
              <span className="flex items-center gap-1 text-gray-600">
                <Mail className="h-3 w-3 text-purple-500 shrink-0" /> {order.userEmail}
              </span>
            )}
            {order.userPhone && (
              <span className="flex items-center gap-1 text-gray-600">
                <Phone className="h-3 w-3 text-emerald-500 shrink-0" /> {order.userPhone}
              </span>
            )}
            <span className="font-mono text-[10px] text-gray-400">UID: {order.userId || "guest"}</span>
          </div>
        </div>

        {/* Date */}
        <div className="min-w-[150px]">
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide flex items-center gap-1"><CalendarDays className="h-3 w-3" />Date & Time</p>
          <p className="text-sm text-gray-700">{formatDateTime(order.createdAt)}</p>
        </div>

        {/* Items count */}
        <div className="min-w-[70px] text-center">
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Items</p>
          <p className="text-sm font-bold text-gray-700">{items.length}</p>
        </div>

        {/* Total */}
        <div className="min-w-[100px] text-right">
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Total</p>
          <p className="text-base font-extrabold text-blue-600">₹{Number(order.totalAmount).toLocaleString("en-IN")}</p>
        </div>

        {/* Status */}
        <div>
          <StatusBadge status={order.status} />
        </div>

        <button className="text-gray-400 hover:text-blue-500 transition-colors ml-auto">
          {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 px-5 py-5 space-y-5">
          <div className="grid md:grid-cols-2 gap-5">
            {/* Customer Info */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wide text-gray-500 flex items-center gap-1.5 border-b pb-2">
                <User className="h-4 w-4 text-blue-500" /> Customer Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Name</p>
                  <p className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                    <User className="h-3.5 w-3.5 text-blue-500 shrink-0" /> {order.userName || "Guest Customer"}
                  </p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Email Address</p>
                  {order.userEmail ? (
                    <a href={`mailto:${order.userEmail}`} className="font-medium text-blue-600 hover:underline flex items-center gap-1 mt-0.5 truncate">
                      <Mail className="h-3.5 w-3.5 text-purple-500 shrink-0" /> {order.userEmail}
                    </a>
                  ) : <p className="text-gray-400 text-xs">Not provided</p>}
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Phone Number</p>
                  {order.userPhone ? (
                    <a href={`tel:${order.userPhone}`} className="font-semibold text-emerald-700 flex items-center gap-1 mt-0.5">
                      <Phone className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> {order.userPhone}
                    </a>
                  ) : <p className="text-gray-400 text-xs">Not provided</p>}
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Account User ID</p>
                  <p className="font-mono text-xs text-slate-600 mt-0.5 truncate">{order.userId || "guest"}</p>
                </div>
              </div>
            </div>

            {/* Payment & Status */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h4 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3 flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5" /> Payment & Status
              </h4>
              <div className="space-y-3 text-sm">
                {order.paymentId && (
                  <p className="text-gray-700">
                    <strong>Payment ID:</strong>
                    <span className="ml-1 font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{order.paymentId}</span>
                  </p>
                )}
                <div>
                  <p className="text-gray-500 mb-1.5 text-xs font-semibold uppercase tracking-wide">Update Status</p>
                  <div className="flex flex-wrap gap-1.5">
                    {["pending", "processing", "paid", "completed", "refunded", "cancelled"].map((s) => (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(s)}
                        disabled={order.status === s || updatingStatus}
                        className={`text-xs px-3 py-1.5 rounded-lg font-semibold border transition-all ${order.status === s
                          ? "bg-blue-500 text-white border-blue-500"
                          : "bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600"
                          } disabled:opacity-50`}
                      >
                        {updatingStatus && order.status !== s ? <Loader2 className="h-3 w-3 animate-spin" /> : s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Items */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3 flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5" /> Ordered Products ({items.length})
            </h4>
            <div className="space-y-2.5">
              {items.map((item: any, i: number) => (
                <div key={i} className="flex gap-3 items-start bg-white border border-gray-200 rounded-xl p-3">
                  {/* Image */}
                  <div className="shrink-0 h-16 w-16 rounded-lg overflow-hidden bg-gray-100 border">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Package className="h-6 w-6 text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        {item.id ? (
                          <Link href={`/products/${item.id}`} target="_blank" className="font-semibold text-gray-800 hover:text-blue-600 transition-colors flex items-center gap-1 group line-clamp-2 whitespace-pre-line">
                            {item.title}
                            <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 shrink-0" />
                          </Link>
                        ) : (
                          <p className="font-semibold text-gray-800 line-clamp-2 whitespace-pre-line">{item.title}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-0.5">
                          Qty: {item.quantity} × ₹{Number(item.price).toLocaleString("en-IN")}
                          {item.downloadUrl && (
                            <span className="ml-2 text-blue-600 font-semibold">• Digital</span>
                          )}
                        </p>
                        {item.id && (
                          <p className="text-xs text-gray-400 font-mono mt-0.5">ID: {item.id}</p>
                        )}
                      </div>
                      <p className="font-bold text-gray-800 shrink-0 text-base">
                        ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                      </p>
                    </div>
                    {item.downloadUrl && (
                      <div className="flex flex-col gap-2 mt-3 border-t border-gray-100 pt-3">
                        {(() => {
                          let assets: any[] = []
                          try { assets = JSON.parse(item.downloadUrl) }
                          catch { assets = [{ id: 'legacy', name: item.title, type: 'file', provider: 'external', url: item.downloadUrl }] }
                          const pId = item.productId || item.id

                          return assets.map((asset: any) => {
                            const isLegacy = asset.id === 'legacy'
                            const secureUrl = isLegacy ? asset.url : `/api/user/secure-asset?productId=${pId}&assetId=${asset.id}`
                            return (
                              <div key={asset.id} className="flex items-center justify-between bg-blue-50/50 p-2 rounded border border-blue-100/50">
                                <span className="text-xs font-medium text-blue-900 line-clamp-1 flex-1 pr-2">{asset.name}</span>
                                <div className="flex gap-2 shrink-0">
                                  {asset.type !== 'link' && <DigitalProductViewer assetUrl={secureUrl} title={asset.name} type={asset.type} />}
                                  <a
                                    href={secureUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 px-3 py-1.5 rounded-lg transition-all shadow-sm"
                                  >
                                    <Download className="h-3.5 w-3.5" /> Download
                                  </a>
                                </div>
                              </div>
                            )
                          })
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Order Total Footer */}
            <div className="flex justify-end mt-3 bg-white border border-gray-200 rounded-xl px-4 py-3">
              <div className="text-right">
                <p className="text-xs text-gray-500 font-semibold uppercase">Order Total</p>
                <p className="text-xl font-extrabold text-blue-600">₹{Number(order.totalAmount).toLocaleString("en-IN")}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const loadOrders = async () => {
    setLoading(true)
    try {
      const data = await fetchAllOrders()
      setOrders(data)
      setFiltered(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  useEffect(() => {
    let result = orders
    if (statusFilter !== "all") {
      result = result.filter(o => o.status === statusFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(o =>
        o.id?.toLowerCase().includes(q) ||
        o.userName?.toLowerCase().includes(q) ||
        o.userEmail?.toLowerCase().includes(q) ||
        o.userPhone?.toLowerCase().includes(q) ||
        o.userId?.toLowerCase().includes(q) ||
        o.paymentId?.toLowerCase().includes(q)
      )
    }
    setFiltered(result)
  }, [search, statusFilter, orders])

  const handleStatusChange = (id: string, newStatus: string) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o))
  }

  const totalRevenue = orders.filter(o => o.status === "paid" || o.status === "completed")
    .reduce((sum, o) => sum + Number(o.totalAmount), 0)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
            <ShoppingBag className="h-8 w-8 text-blue-500" /> Orders
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">{orders.length} total orders</p>
        </div>
        <button
          onClick={loadOrders}
          disabled={loading}
          className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-blue-600 bg-white border border-gray-200 hover:border-blue-300 px-4 py-2 rounded-xl transition-all"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Orders", value: orders.length, color: "text-gray-800" },
          { label: "Revenue", value: `₹${totalRevenue.toLocaleString("en-IN")}`, color: "text-blue-600" },
          { label: "Pending", value: orders.filter(o => o.status === "pending").length, color: "text-yellow-600" },
          { label: "Completed", value: orders.filter(o => o.status === "completed" || o.status === "paid").length, color: "text-green-600" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-gray-200 rounded-xl px-4 py-3">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">{stat.label}</p>
            <p className={`text-2xl font-extrabold mt-0.5 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by order ID, customer, email, payment ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="paid">Paid</option>
          <option value="completed">Completed</option>
          <option value="refunded">Refunded</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
          <ShoppingBag className="h-16 w-16 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <OrderRow key={order.id} order={order} onStatusChange={handleStatusChange} />
          ))}
        </div>
      )}
    </div>
  )
}