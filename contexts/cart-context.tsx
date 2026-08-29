"use client"

import * as React from "react"
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { toast } from "@/hooks/use-toast"
import type { Product, CartItem } from "@/lib/types"

interface CartContextType {
  items: CartItem[]
  totalItems: number
  totalAmount: number
  addToCart: (product: Product, quantity?: number) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  isInCart: (productId: string) => boolean
  isDrawerOpen: boolean
  setDrawerOpen: (open: boolean) => void
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

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("digital-store-cart")
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart))
      } catch (error) {
        console.error("Error loading cart from localStorage:", error)
      }
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
        toast({
          title: "Updated cart",
          description: `${product.title} quantity updated`,
        })
        return prevItems.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + quantity } : item,
        )
      } else {
        toast({
          title: "Added to cart",
          description: `${product.title} has been added to your cart`,
        })
        return [...prevItems, { productId: product.id, product, quantity }]
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

    setItems((prevItems) => prevItems.map((item) => (item.productId === productId ? { ...item, quantity } : item)))
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
      }}
    >
      {children}
    </CartContext.Provider>
  )
}