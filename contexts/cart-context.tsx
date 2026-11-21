"use client"

import * as React from "react"
import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from "react"
import { toast } from "@/hooks/use-toast"
import type { Product, CartItem } from "@/lib/types"

interface CartContextType {
  items: CartItem[]
  totalItems: number
  totalAmount: number
  addToCart: (product: Product, quantity?: number, openDrawer?: boolean) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  isInCart: (productId: string) => boolean
  isDrawerOpen: boolean
  setDrawerOpen: (open: boolean) => void
  refreshCartPrices: (force?: boolean) => Promise<void>
}

const CartContext = createContext<CartContextType>({
  items: [],
  totalItems: 0,
  totalAmount: 0,
  addToCart: () => { },
  removeFromCart: () => { },
  updateQuantity: () => { },
  clearCart: () => { },
  isInCart: () => false,
  isDrawerOpen: false,
  setDrawerOpen: () => { },
  refreshCartPrices: async (_force?: boolean) => { },
})

export const useCart = () => {
  return useContext(CartContext)
}

interface CartProviderProps {
  children?: ReactNode
}

export const CartProvider = ({ children }: CartProviderProps) => {
  const [items, setItems] = useState<CartItem[]>([])
  const [isDrawerOpen, setDrawerOpen] = useState(false)
  const lastRefreshTimeRef = useRef<number>(0)

  const refreshCartPrices = async (force = false) => {
    // Zero-overhead guard: Only fetch if cart actually has items
    const savedCart = typeof window !== "undefined" ? localStorage.getItem("digital-store-cart") : null
    let hasItems = items.length > 0
    if (!hasItems && savedCart) {
      try {
        const parsed = JSON.parse(savedCart)
        if (Array.isArray(parsed) && parsed.length > 0) hasItems = true
      } catch {}
    }
    if (!hasItems) return

    // Throttle guard: Prevent spamming server within 30 seconds unless explicitly forced
    const now = Date.now()
    if (!force && now - lastRefreshTimeRef.current < 30000) {
      return
    }
    lastRefreshTimeRef.current = now

    try {
      const res = await fetch("/api/products?all=1")
      if (!res.ok) return
      const freshProducts: any[] = await res.json()
      if (!Array.isArray(freshProducts) || freshProducts.length === 0) return

      const productMap = new Map<string, any>()
      for (const p of freshProducts) {
        if (p.id) {
          productMap.set(p.id, p)
          productMap.set(String(p.id).toLowerCase(), p)
        }
        if (p.slug) {
          productMap.set(p.slug, p)
          productMap.set(String(p.slug).toLowerCase(), p)
        }
      }

      setItems((prevItems) => {
        if (prevItems.length === 0) return prevItems
        let hasChanges = false
        const updated = prevItems.map((item) => {
          const fresh = productMap.get(item.productId) || (item.product?.id ? productMap.get(item.product.id) : null)
          if (!fresh) return item

          const freshPrice = Number(fresh.price) || 0
          const freshOriginalPrice = fresh.originalPrice ? Number(fresh.originalPrice) : null

          if (
            item.product.price !== freshPrice ||
            item.product.title !== fresh.title ||
            item.product.originalPrice !== freshOriginalPrice ||
            item.product.imageUrl !== fresh.imageUrl
          ) {
            hasChanges = true
            return {
              ...item,
              product: {
                ...item.product,
                title: fresh.title || item.product.title,
                price: freshPrice,
                originalPrice: freshOriginalPrice,
                imageUrl: fresh.imageUrl || item.product.imageUrl,
                isActive: fresh.isActive,
                metaPixelId: fresh.metaPixelId,
              },
            }
          }
          return item
        })
        return hasChanges ? updated : prevItems
      })
    } catch (err) {
      console.warn("[CartContext] Failed to refresh prices:", err)
    }
  }

  // Load cart from localStorage on mount and sync with fresh database prices only if cart has items
  useEffect(() => {
    const savedCart = localStorage.getItem("digital-store-cart")
    let hasItems = false
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart)
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Normalize existing carts to max quantity 1
          setItems(parsed.map((item: CartItem) => ({ ...item, quantity: 1 })))
          hasItems = true
        }
      } catch (error) {
        console.error("Error loading cart from localStorage:", error)
      }
    }
    if (hasItems) {
      refreshCartPrices(true)
    }
  }, [])

  // Save cart to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem("digital-store-cart", JSON.stringify(items))
  }, [items])

  const addToCart = (product: Product, quantity = 1, openDrawer = true) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.productId === product.id)

      if (existingItem) {
        // Digital downloads store: quantity is capped at 1 per product
        return prevItems.map((item) =>
          item.productId === product.id ? { ...item, quantity: 1 } : item,
        )
      } else {
        // Add new item with maximum quantity of 1
        return [...prevItems, { productId: product.id, product, quantity: 1 }]
      }
    })
    if (openDrawer) {
      setDrawerOpen(true)
    }
  }

  const removeFromCart = (productId: string) => {
    setItems((prevItems) => {
      const item = prevItems.find((item) => item.productId === productId)
      if (item) {
        toast({
          title: "Removed from cart",
          description: `${item.product.title} has been removed from your cart`,
        })
      }
      return prevItems.filter((item) => item.productId !== productId)
    })
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }

    // Digital store: max quantity is 1
    const cappedQuantity = Math.min(1, Math.max(1, quantity))
    setItems((prevItems) => prevItems.map((item) => (item.productId === productId ? { ...item, quantity: cappedQuantity } : item)))
  }

  const clearCart = () => {
    setItems([])
    toast({
      title: "Cart cleared",
      description: "All items have been removed from your cart",
    })
  }

  const isInCart = (productId: string) => {
    return items.some((item) => item.productId === productId)
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalAmount = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        totalAmount,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isInCart,
        isDrawerOpen,
        setDrawerOpen,
        refreshCartPrices,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}