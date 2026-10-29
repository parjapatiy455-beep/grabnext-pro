import { loadStripe } from "@stripe/stripe-js"

// Stripe configuration
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export const getStripe = () => stripePromise

// Razorpay configuration
declare global {
  interface Window {
    Razorpay: any
  }
}

export const loadRazorpay = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  handler: (response: any) => void
  prefill: {
    name: string
    email: string
    contact: string
  }
  theme: {
    color: string
  }
}

export const createRazorpayOrder = async (orderId: string) => {
  try {
    const response = await fetch("/api/razorpay/create-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ orderId }),
    })

    if (!response.ok) {
      throw new Error("Failed to create Razorpay order")
    }

    return await response.json()
  } catch (error) {
    console.error("Error creating Razorpay order:", error)
    throw error
  }
}

export const verifyRazorpayPayment = async (paymentData: {
  orderId: string
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}) => {
  try {
    const response = await fetch("/api/razorpay/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paymentData),
    })

    if (!response.ok) {
      throw new Error("Payment verification failed")
    }

    return await response.json()
  } catch (error) {
    console.error("Error verifying payment:", error)
    throw error
  }
}

export const createStripeCheckoutSession = async (items: any[], customerEmail: string) => {
  try {
    const response = await fetch("/api/payments/stripe/create-checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ items, customerEmail }),
    })

    if (!response.ok) {
      throw new Error("Failed to create Stripe checkout session")
    }

    return await response.json()
  } catch (error) {
    console.error("Error creating Stripe checkout session:", error)
    throw error
  }
}
