"use client"

import { StoreHeader } from "@/components/store-header"
import { Footer } from "@/components/footer"
import { HeroPro } from "@/components/landing-pro/hero-pro"
import { ServicesSection } from "@/components/landing-pro/services-section"
import { ProductsSection } from "@/components/landing-pro/products-section"
import { HowItWorks } from "@/components/landing-pro/how-it-works"
import { StatsTrust } from "@/components/landing-pro/stats-trust"
import { CTASection } from "@/components/landing-pro/cta-section"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col text-slate-900 dark:text-slate-100 transition-colors font-sans selection:bg-indigo-500 selection:text-white">
      {/* Global Navigation Header */}
      <StoreHeader />

      <main className="flex-1">
        {/* 1. 3D WebGL Hero Section with Interactive Particles & Glass Badges */}
        <HeroPro />

        {/* 2. "What is GrabNext?" & Core Services Showcase */}
        <ServicesSection />

        {/* 3. Products Showcase with 3D Tilt Cards & Category Filters */}
        <ProductsSection />

        {/* 4. 3-Step "How It Works" Animated Timeline */}
        <HowItWorks />

        {/* 5. Live Stats Counter & Customer Testimonials */}
        <StatsTrust />

        {/* 6. Ultra Pro CTA Banner */}
        <CTASection />
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  )
}