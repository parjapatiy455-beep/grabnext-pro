"use client"
export const runtime = 'edge'

import { XCircle, ArrowLeft, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StoreHeader } from "@/components/store-header"
import Link from "next/link"

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen bg-background">
      <StoreHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl">Payment Cancelled</CardTitle>
              <p className="text-muted-foreground">
                Your payment was cancelled. No charges have been made to your account.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  If you experienced any issues during checkout, please try again or contact our support team.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild className="flex-1">
                  <Link href="/checkout">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Try Again
                  </Link>
                </Button>
                <Button asChild variant="outline" className="flex-1 bg-transparent">
                  <Link href="/cart">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    View Cart
                  </Link>
                </Button>
              </div>

              <div className="text-center">
                <Button asChild variant="ghost">
                  <Link href="/products">Continue Shopping</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}