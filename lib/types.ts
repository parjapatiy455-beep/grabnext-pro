export interface DigitalAsset {
  id: string
  name: string
  type: "pdf" | "video" | "link" | "file"
  provider: "vercel" | "tdrive" | "external"
  url: string
}

export interface FloatingNode {
  id: string
  type: "text" | "image" | "badge"
  content: string
  x: number
  y: number
  zIndex: number
  fontSize?: string
  color?: string
  width?: number
  height?: number
}

// Landing page section types
export type LandingSectionType = "hero" | "features" | "text" | "image-text" | "testimonials" | "faq" | "cta" | "form"

export interface LandingSection {
  id: string
  type: LandingSectionType
  // Hero
  heading?: string
  subheading?: string
  buttonText?: string
  buttonLink?: string
  bgColor?: string
  textColor?: string
  imageUrl?: string
  // Features
  features?: { icon?: string; title: string; description: string }[]
  // Text block
  content?: string
  // Testimonials
  testimonials?: { name: string; text: string; rating?: number }[]
  // FAQ
  faqs?: { question: string; answer: string }[]
  // Layout/style
  align?: "left" | "center" | "right"
  paddingY?: "sm" | "md" | "lg"
  paddingTop?: string
  paddingBottom?: string
  marginTop?: string
  marginBottom?: string
  animation?: "none" | "fadeIn" | "slideLeft" | "slideRight" | "zoomIn"
  // Form fields (for 'form' section type)
  formFields?: { label: string; type: "text" | "email" | "tel" | "textarea"; required: boolean; placeholder?: string }[]
  formButtonText?: string

  // Advanced Typography & Freeform Elements (Phase 4)
  fontFamily?: string
  floatingNodes?: FloatingNode[]
}

export interface Product {
  id: string
  title: string
  description: string
  price: number
  originalPrice?: number
  category: string
  tags: string[]
  imageUrl: string
  downloadUrl: string // Now stores JSON.stringify(DigitalAsset[])
  createdAt: Date
  updatedAt: Date
  isActive: boolean
  salesCount: number
  pageCode?: string   // JSON: LandingSection[]
  pageType?: "shop" | "landing"
  createdBy: string // Admin user ID who created this product
}

export interface CartItem {
  productId: string
  product: Product
  quantity: number
}

export interface Order {
  id: string
  userId: string
  items: CartItem[]
  totalAmount: number
  status: "pending" | "completed" | "refunded"
  paymentId?: string
  createdAt: Date
  updatedAt: Date
}

export interface User {
  uid: string
  email: string
  displayName: string
  role: "user" | "admin"
  createdAt: Date
}

export interface AdminStats {
  totalSales: number
  totalOrders: number
  totalUsers: number
  topProducts: Product[]
  recentOrders: Order[]
}
