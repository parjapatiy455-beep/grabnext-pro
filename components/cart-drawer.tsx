"use client"

import * as React from "react"

import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { useCart } from "@/contexts/cart-context"
import Link from "next/link"

interface CartDrawerProps {
  children?: React.ReactNode
}

export function CartDrawer({ children }: CartDrawerProps) {
  const { items, totalItems, totalAmount, updateQuantity, removeFromCart, isDrawerOpen, setDrawerOpen } = useCart()

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(price)
  }

  return (
    <Sheet open={isDrawerOpen} onOpenChange={setDrawerOpen}>
      {children && <SheetTrigger asChild>{children}</SheetTrigger>}
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader className="animate-slide-up">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 transition-transform duration-300 hover:scale-110" />
            Shopping Cart
            {totalItems > 0 && (
              <Badge variant="secondary" className="bg-gradient-primary text-white animate-glow">
                {totalItems}
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-full">
          {items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4 animate-fade-in-up">
                <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground animate-float" />
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Your cart is empty</h3>
                  <p className="text-muted-foreground">Add some products to get started</p>
                </div>
                <Button asChild className="bg-gradient-primary hover:bg-gradient-secondary transition-all duration-300 hover:scale-105">
                  <Link href="/products">
                    Browse Products
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-auto py-4 space-y-4">
                {items.map((item, index) => (
                  <div
                    key={item.productId}
                    className="flex gap-4 p-4 border rounded-lg transition-all duration-300 hover:shadow-md hover:scale-[1.02] animate-fade-in-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <img
                      src={
                        item.product.imageUrl ||
                        `/placeholder.svg?height=80&width=80&query=${item.product.category || "/placeholder.svg"} ${item.product.title}`
                      }
                      alt={item.product.title}
                      className="w-20 h-20 object-cover rounded-md transition-transform duration-300 hover:scale-105"
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-sm line-clamp-2 hover:text-primary transition-colors duration-300 whitespace-pre-line">
                          {item.product.title}
                        </h4>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-300 hover:scale-110"
                          onClick={() => removeFromCart(item.productId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-gradient-primary font-semibold">{formatPrice(item.product.price)}</p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 bg-transparent transition-all duration-300 hover:scale-110"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium transition-all duration-300">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 bg-transparent transition-all duration-300 hover:scale-110"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-4 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
                <div className="flex items-center justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span className="text-gradient-primary animate-glow">{formatPrice(totalAmount)}</span>
                </div>
                <div className="space-y-2">
                  <Button
                    asChild
                    className="w-full bg-gradient-primary hover:bg-gradient-secondary transition-all duration-300 hover:scale-105 hover:shadow-lg"
                    size="lg"
                  >
                    <Link href="/checkout">
                      Proceed to Checkout
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full bg-transparent transition-all duration-300 hover:scale-105"
                  >
                    <Link href="/cart">
                      View Cart
                    </Link>
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}