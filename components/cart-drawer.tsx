"use client"

import * as React from "react"
import { Minus, Plus, ShoppingCart, Trash2, ArrowRight, Lock, Zap, ShieldCheck, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useCart } from "@/contexts/cart-context"
import { usePathname } from "next/navigation"
import Link from "next/link"

interface CartDrawerProps {
  children?: React.ReactNode
}

export function CartDrawer({ children }: CartDrawerProps) {
  const { items, totalItems, totalAmount, updateQuantity, removeFromCart, isDrawerOpen, setDrawerOpen } = useCart()
  const pathname = usePathname()

  // Automatically close cart drawer whenever page route changes (e.g. going to /checkout)
  React.useEffect(() => {
    setDrawerOpen(false)
  }, [pathname, setDrawerOpen])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price)
  }

  return (
    <Sheet open={isDrawerOpen} onOpenChange={setDrawerOpen}>
      {children && <SheetTrigger asChild>{children}</SheetTrigger>}
      <SheetContent className="w-full sm:max-w-md p-4 sm:p-6 flex flex-col bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800">
        
        {/* Modern Drawer Header */}
        <SheetHeader className="pb-3 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-3 text-left">
            <div className="h-10 w-10 rounded-2xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0 shadow-xs">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <SheetTitle className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>Your Bag</span>
                {totalItems > 0 && (
                  <span className="text-xs bg-slate-900 text-white dark:bg-violet-600 px-2 py-0.5 rounded-full font-bold">
                    {totalItems} {totalItems === 1 ? "item" : "items"}
                  </span>
                )}
              </SheetTitle>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                <Zap className="h-3 w-3 fill-current" /> Instant delivery to your Email &amp; WhatsApp
              </p>
            </div>
          </div>
        </SheetHeader>

        {/* Drawer Body */}
        <div className="flex flex-col flex-1 overflow-hidden pt-3">
          {items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4 p-6">
                <div className="h-16 w-16 mx-auto rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                  <ShoppingCart className="h-8 w-8 stroke-[1.5]" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">Your bag is empty</h3>
                  <p className="text-xs text-slate-400 max-w-xs">
                    Explore digital templates, software bundles, and video assets to get started.
                  </p>
                </div>
                <Button
                  asChild
                  className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-violet-600 dark:hover:bg-violet-700 rounded-xl font-bold text-xs h-10 px-6 shadow-md"
                >
                  <Link href="/products" onClick={() => setDrawerOpen(false)}>
                    Browse Digital Products →
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Product Items List */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-1 scrollbar-thin">
                {items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex gap-3 p-3 bg-slate-50/80 dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl transition-all"
                  >
                    {/* Thumbnail */}
                    <div className="h-18 w-18 sm:h-20 sm:w-20 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden shrink-0 flex items-center justify-center p-1">
                      <img
                        src={
                          item.product.imageUrl ||
                          `/placeholder.svg?height=80&width=80&query=${encodeURIComponent(item.product.category || "product")}`
                        }
                        alt={item.product.title}
                        className="h-full w-full object-contain"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div className="flex items-start justify-between gap-1.5">
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-2 leading-snug">
                          {item.product.title}
                        </h4>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.productId)}
                          className="text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 p-1 rounded-lg transition-colors shrink-0"
                          title="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Delivery tag */}
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        ⚡ Instant Access Link
                      </span>

                      {/* Price & Stepper */}
                      <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                        <span className="text-sm font-black text-slate-900 dark:text-white">
                          {formatPrice(item.product.price * item.quantity)}
                        </span>

                        {/* Stepper Buttons */}
                        <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 overflow-hidden shadow-2xs">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="h-6 w-6 sm:h-7 sm:w-7 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 sm:w-7 text-center text-xs font-bold text-slate-800 dark:text-slate-200">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="h-6 w-6 sm:h-7 sm:w-7 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Drawer Checkout Footer */}
              <div className="border-t border-slate-200/90 dark:border-slate-800 pt-3.5 space-y-3 mt-auto bg-white dark:bg-slate-950">
                
                {/* Total Row */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium block">Total Payable:</span>
                    <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                      {formatPrice(totalAmount)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900/60 inline-flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" /> Zero Convenience Fee
                    </span>
                  </div>
                </div>

                {/* Big Checkout CTA Button */}
                <Button
                  asChild
                  size="lg"
                  className="w-full h-12 sm:h-13 rounded-2xl font-black text-base text-slate-950 bg-gradient-to-r from-amber-400 via-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-lg shadow-amber-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Link href="/checkout" onClick={() => setDrawerOpen(false)}>
                    <Lock className="h-4.5 w-4.5 text-slate-950" />
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="h-4.5 w-4.5 text-slate-950" />
                  </Link>
                </Button>

                {/* Indian UPI Badges Strip */}
                <div className="flex items-center justify-center gap-1.5 flex-wrap pt-0.5">
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-bold text-slate-700 dark:text-slate-300">
                    GPay
                  </span>
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-bold text-purple-700 dark:text-purple-400">
                    PhonePe
                  </span>
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-bold text-sky-600 dark:text-sky-400">
                    Paytm
                  </span>
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-bold text-slate-800 dark:text-slate-200">
                    BHIM UPI
                  </span>
                </div>

                {/* Continue Shopping Link */}
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors py-1"
                >
                  ← Continue Shopping
                </button>

              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
