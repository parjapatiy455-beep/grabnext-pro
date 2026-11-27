"use client"

import * as React from "react"
import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from "react"
import { toast } from "@/hooks/use-toast"
import type { Product, CartItem } from "@/lib/types"

const CART_STORAGE_KEY = "digital-store-cart"
const CART_TTL_MS = 30 * 60 * 1000 // 30 minutes expiry for uncompleted carts

interface StoredCartPayload {
  items: CartItem[]
  updatedAt: number
}

function readValidCartFromStorage(): { items: CartItem[]; expired: boolean } {
  if (typeof window === "undefined") return { items: [], expired: false }
  const raw = localStorage.getItem(CART_STORAGE_KEY)
  if (!raw) return { items: [], expired: false }

  try {
    const parsed = JSON.parse(raw)

    // New timestamped format: { items, updatedAt }
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && Array.isArray(parsed.items)) {
      const updatedAt = Number(parsed.updatedAt) || 0
      if (!updatedAt || Date.now() - updatedAt > CART_TTL_MS) {
        localStorage.removeItem(CART_STORAGE_KEY)
        return { items: [], expired: true }
      }
      const normalized = parsed.items.map((item: CartItem) => ({ ...item, quantity: 1 }))
      return { items: normalized, expired: false }
    }

    // Legacy array format without timestamp: clear stale un-timestamped carts
    if (Array.isArray(parsed)) {
      localStorage.removeItem(CART_STORAGE_KEY)
      return { items: [], expired: true }
    }
  } catch (error) {
    console.error("Error loading cart from localStorage:", error)
  }

  return { items: [], expired: false }
}

function writeCartToStorage(items: CartItem[]) {
  if (typeof window === "undefined") return
  try {
    if (items.length === 0) {
      localStorage.removeItem(CART_STORAGE_KEY)
    } else {
      const payload: StoredCartPayload = {
        items,
        updatedAt: Date.now(),
      }
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(payload))
    }
  } catch (error) {
    console.error("Error saving cart to localStorage:", error)
  }
}

interface CartContextType {
  items: CartItem[]
  totalItems: number
  totalAmount: number
  addToCart: (product: Product, quantity?: number, openDrawer?: boolean) => void
  replaceCart: (product: Product, quantity?: number, openDrawer?: boolean) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: (silent?: boolean) => void
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
  replaceCart: () => { },
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
  const hasHydratedRef = useRef<boolean>(false)

  const refreshCartPrices = async (force = false) => {
    const { items: storedItems } = readValidCartFromStorage()
    const hasItems = items.length > 0 || storedItems.length > 0
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

  // Load cart from localStorage on mount (respecting 30-min TTL) and sync fresh prices
  useEffect(() => {
    const { items: loadedItems } = readValidCartFromStorage()
    if (loadedItems.length > 0) {
      setItems(loadedItems)
      hasHydratedRef.current = true
      refreshCartPrices(true)
    } else {
      hasHydratedRef.current = true
    }
  }, [])

  // Save cart to localStorage whenever items change (after initial hydration)
  useEffect(() => {
    if (!hasHydratedRef.current) return
    writeCartToStorage(items)
  }, [items])

  const addToCart = (product: Product, _quantity = 1, openDrawer = true) => {
    // Before adding, check if existing stored cart has expired (> 30 min)
    const { expired } = readValidCartFromStorage()
    setItems((prevItems) => {
      const baseItems = expired ? [] : prevItems
      const existingItem = baseItems.find((item) => item.productId === product.id)

      if (existingItem) {
        return baseItems.map((item) =>
          item.productId === product.id ? { ...item, product, quantity: 1 } : item,
        )
      }
      return [...baseItems, { productId: product.id, product, quantity: 1 }]
    })
    if (openDrawer) {
      setDrawerOpen(true)
    }
  }

  // Replace entire cart with a single product (used by "Buy Now" so old uncompleted items do not mix in checkout)
  const replaceCart = (product: Product, _quantity = 1, openDrawer = false) => {
    const nextItems: CartItem[] = [{ productId: product.id, product, quantity: 1 }]
    setItems(nextItems)
    writeCartToStorage(nextItems)
    setDrawerOpen(openDrawer)
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

  const clearCart = (silent = false) => {
    setItems([])
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(CART_STORAGE_KEY)
      } catch {}
    }
    if (silent !== true) {
      toast({
        title: "Cart cleared",
        description: "All items have been removed from your cart",
      })
    }
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
        replaceCart,
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
