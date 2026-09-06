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
  const utr = searchParams.get("utr") || ""
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  // Guard against duplicate Purchase events if the effect re-runs
  const hasFiredPurchase = useRef(false)

  useEffect(() => {
    if (utr) {
      fetch(`/api/orders/by-payment/${utr}`)
        .then(r => r.json())
        .then(data => {
          if (!data.error) {
            setOrder(data)
            if (!hasFiredPurchase.current) {
              hasFiredPurchase.current = true
              trackPurchase(
                {
                  value: data.totalAmount || 0,
                  content_ids: data.items?.map((i: any) => i.productId) || [],
                  contents: data.items?.map((i: any) => ({
                    id: i.productId,
                    quantity: i.quantity || 1,
                    item_price: i.price,
                  })) || [],
                },
                {
                  email: data.userEmail,
                  phone: data.userPhone,
                  firstName: data.userName?.split(' ')[0],
                  lastName: data.userName?.split(' ').slice(1).join(' '),
                  external_id: data.userId
                }
              )
            }
          }
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [utr])

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
              {utr && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                  <p className="text-sm text-green-700 font-medium mb-1">Payment Reference (UTR)</p>
                  <p className="font-mono text-lg font-bold text-green-800">{utr}</p>
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
                                const secureUrl = isLegacy ? asset.url : `/api/user/secure-asset?productId=${pId}&assetId=${asset.id}`

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