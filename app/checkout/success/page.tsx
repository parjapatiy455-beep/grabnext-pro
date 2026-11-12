"use client"
export const runtime = 'edge'

import { useSearchParams } from "next/navigation"
import { CheckCircle, Download, ArrowRight, ExternalLink, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StoreHeader } from "@/components/store-header"
import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { DigitalProductViewer } from "@/components/digital-product-viewer"
import { trackPurchase } from "@/lib/pixel"

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const utrParam = (searchParams.get("utr") || "").trim()
  const orderIdParam = (searchParams.get("orderId") || searchParams.get("id") || searchParams.get("order_id") || "").trim()
  const paymentRef = utrParam || orderIdParam || ""

  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  // Guard against duplicate Purchase events if the effect re-runs
  const hasFiredPurchase = useRef(false)

  // 1. Instant fallback tracking via cached session purchase
  useEffect(() => {
    try {
      const cachedRaw = sessionStorage.getItem("grabnext_last_purchase")
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw)
        const matchesCurrent =
          !orderIdParam && !utrParam
            ? true
            : (orderIdParam && cached.orderId === orderIdParam) ||
              (utrParam && (cached.utr === utrParam || cached.orderId === utrParam))

        if (matchesCurrent && cached.verifiedPaid === true) {
          const orderKey = cached.orderId || cached.utr || "order"
          const alreadyTracked = sessionStorage.getItem(`tracked_purchase_${orderKey}`) === "true"

          if (!alreadyTracked && !hasFiredPurchase.current) {
            hasFiredPurchase.current = true
            sessionStorage.setItem(`tracked_purchase_${orderKey}`, "true")
            trackPurchase(
              {
                value: Number(cached.value) || 0,
                currency: "INR",
                content_ids: cached.content_ids || [],
                contents: cached.contents || [],
              },
              cached.userData,
              cached.targetPixelId
            )
          }
        }
      }
    } catch (e) {
      console.warn("Cached purchase check warning:", e)
    }
  }, [orderIdParam, utrParam])

  // 2. Fetch full verified order from server and guarantee Purchase event firing
  useEffect(() => {
    if (!paymentRef) {
      setLoading(false)
      return
    }

    let attempts = 0
    let isCancelled = false

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/by-payment/${encodeURIComponent(paymentRef)}`)
        const data = await res.json()
        if (!data.error && data.id) {
          if (!isCancelled) {
            setOrder(data)
            setLoading(false)

            const checkKey = data.id || data.paymentId || paymentRef
            const alreadyTracked =
              sessionStorage.getItem(`tracked_purchase_${checkKey}`) === "true" ||
              (data.id && sessionStorage.getItem(`tracked_purchase_${data.id}`) === "true") ||
              (data.paymentId && sessionStorage.getItem(`tracked_purchase_${data.paymentId}`) === "true")

            if (data.status === "paid" && !alreadyTracked && !hasFiredPurchase.current) {
              hasFiredPurchase.current = true
              try {
                sessionStorage.setItem(`tracked_purchase_${data.id}`, "true")
                if (data.paymentId) sessionStorage.setItem(`tracked_purchase_${data.paymentId}`, "true")
              } catch {}

              const orderItems = Array.isArray(data.items) ? data.items : []
              const totalAmount = Number(data.totalAmount) || 0
              const contentIds = orderItems.map((i: any) => String(i.productId || i.id))
              const contents = orderItems.map((i: any) => ({
                id: String(i.productId || i.id),
                quantity: Number(i.quantity) || 1,
                item_price: Number(i.price) || (orderItems.length > 0 ? totalAmount / orderItems.length : totalAmount),
              }))

              let successPixelId: string | null = null
              try {
                const stored = sessionStorage.getItem("grabnext_active_pixel")
                if (stored && stored.trim().length > 4) successPixelId = stored.trim()
              } catch {}

              trackPurchase(
                {
                  value: totalAmount,
                  currency: "INR",
                  content_ids: contentIds,
                  contents: contents,
                },
                {
                  email: data.userEmail,
                  phone: data.userPhone,
                  firstName: data.userName?.split(" ")[0],
                  lastName: data.userName?.split(" ").slice(1).join(" "),
                  external_id: data.userId,
                },
                successPixelId
              )
            }
          }
          return
        }
      } catch (e) {
        console.warn("Order fetch attempt failed:", e)
      }

      attempts++
      if (attempts < 6 && !isCancelled) {
        setTimeout(fetchOrder, 1200)
      } else if (!isCancelled) {
        setLoading(false)
      }
    }

    fetchOrder()
    return () => { isCancelled = true }
  }, [paymentRef])

  const digitalItems = order?.items?.filter((i: any) => i.downloadUrl) || []

  return (
    <div className="min-h-screen bg-background">
      <StoreHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Payment Successful! 🎉</CardTitle>
              <p className="text-muted-foreground">
                Your order has been confirmed. Thank you for shopping with Grabnext!
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {(utrParam || order?.paymentId) && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                  <p className="text-sm text-green-700 font-medium mb-1">Payment Reference (UTR)</p>
                  <p className="font-mono text-lg font-bold text-green-800">{order?.paymentId || utrParam}</p>
                </div>
              )}

              {loading ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Preparing your downloads...</p>
                </div>
              ) : (
                <>
                  {digitalItems.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 font-semibold text-lg border-b pb-2">
                        <Download className="h-5 w-5 text-primary" />
                        <h3>Instant Access: Your Downloads</h3>
                      </div>
                      <div className="space-y-3">
                        {digitalItems.map((item: any, idx: number) => {
                          let assets: any[] = []
                          try {
                            assets = JSON.parse(item.downloadUrl)
                          } catch {
                            assets = [{ id: 'legacy', name: item.title, type: 'file', provider: 'external', url: item.downloadUrl }]
                          }
                          const pId = item.productId || item.id

                          return (
                            <div key={idx} className="space-y-2 mb-4">
                              <p className="font-semibold text-sm border-b border-gray-100 pb-1.5 px-1">{item.title}</p>
                              {assets.map((asset: any) => {
                                const isLegacy = asset.id === 'legacy'
                                const isDirectExternal =
                                  (asset.provider === 'external' || asset.type === 'link') &&
                                  typeof asset.url === 'string' &&
                                  asset.url.trim().startsWith('http')
                                const token = item.assetTokens?.[asset.id]
                                const secureUrl = (isLegacy || isDirectExternal)
                                  ? asset.url
                                  : `/api/user/secure-asset?productId=${encodeURIComponent(pId)}&assetId=${encodeURIComponent(asset.id)}${token ? `&token=${encodeURIComponent(token)}` : ''}`

                                return (
                                  <div key={asset.id} className="flex items-center justify-between p-3 ml-2 bg-primary/5 rounded-xl border border-primary/10 group hover:bg-primary/10 transition-colors">
                                    <div className="flex-1">
                                      <p className="font-medium text-sm line-clamp-1">{asset.name}</p>
                                      <p className="text-[10px] text-muted-foreground uppercase font-semibold mt-0.5">{asset.type} Asset</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {asset.type !== 'link' && <DigitalProductViewer assetUrl={secureUrl} title={asset.name} type={asset.type} />}
                                      <Button asChild size="sm" className="shrink-0 bg-primary hover:bg-primary/90 text-white shadow-sm">
                                        <a href={secureUrl} target="_blank" rel="noopener noreferrer">
                                          <Download className="h-4 w-4 sm:mr-2" />
                                          <span className="hidden sm:inline">Download</span>
                                        </a>
                                      </Button>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )
                        })}
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-xs text-blue-700">
                        <p className="font-semibold flex items-center gap-1.5 mb-1">
                          <ExternalLink className="h-3 w-3" />
                          Pro Tip:
                        </p>
                        You can also find these downloads in your "My Orders" section if you need them later.
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild className="flex-1">
                  <Link href="/dashboard">
                    View My Orders
                  </Link>
                </Button>
                <Button asChild variant="outline" className="flex-1 bg-transparent">
                  <Link href="/products">
                    Continue Shopping
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>

              <div className="text-center text-sm text-muted-foreground pt-4 border-t">
                <p>
                  Need help?{" "}
                  <Link href="/support" className="text-primary hover:underline">
                    Contact support
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}