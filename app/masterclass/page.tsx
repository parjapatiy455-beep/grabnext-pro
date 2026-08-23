"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { StoreHeader } from "@/components/store-header"
import { Footer } from "@/components/footer"
import { useCart } from "@/contexts/cart-context"
import { toast } from "@/hooks/use-toast"
import type { Product } from "@/lib/types"
import {
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  ShoppingBag,
  Globe,
  TrendingUp,
  Award,
  ShieldCheck,
  Gift,
  Users,
  ChevronDown,
  ChevronUp,
  Star,
  ArrowRight,
  Flame,
  Check,
  Lock,
  PlayCircle,
  HelpCircle
} from "lucide-react"

// Product payload for masterclass
const MASTERCLASS_PRODUCT: Product = {
  id: "masterclass-digital-products-49",
  title: "Digital Product Selling Masterclass (Live Workshop + Recording)",
  description: "Comprehensive step-by-step masterclass on digital product sourcing, website creation, and Facebook ads marketing.",
  price: 49,
  originalPrice: 2999,
  category: "masterclass",
  imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80",
  tags: ["masterclass", "digital-products", "facebook-ads", "website-building", "online-business"],
  downloadUrl: "",
  createdBy: "admin",
  isActive: true,
  salesCount: 1840,
  createdAt: new Date(),
  updatedAt: new Date()
}

export default function MasterclassPage() {
  const router = useRouter()
  const { addToCart } = useCart()
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  // Countdown timer state (starts at 14m 45s)
  const [timeLeft, setTimeLeft] = useState({ minutes: 14, seconds: 45 })

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 }
        } else if (prev.minutes > 0) {
          return { minutes: prev.minutes - 1, seconds: 59 }
        } else {
          return { minutes: 15, seconds: 0 } // Reset timer continuously
        }
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleEnroll = () => {
    addToCart(MASTERCLASS_PRODUCT, 1)
    toast({
      title: "🎉 Masterclass Added to Cart!",
      description: "Redirecting to checkout for instant enrollment @ ₹49 only...",
    })
    router.push("/checkout")
  }

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950">
      <StoreHeader />

      {/* Top Banner Alert Bar */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 text-slate-950 py-2 px-4 text-center font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg">
        <Flame className="w-4 h-4 animate-bounce text-slate-950" />
        <span>SPECIAL LIMITED TIME OFFER: Enroll in the Masterclass Today for Only <strong>₹49</strong> (Original Price ₹2,999)</span>
        <Flame className="w-4 h-4 animate-bounce text-slate-950" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800/60">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-amber-500/10 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[300px] h-[300px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10 max-w-6xl">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            
            {/* Live Masterclass Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs sm:text-sm font-semibold mb-6 shadow-inner">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
              <span>LIVE 3-HOUR INTENSIVE MASTERCLASS & WORKSHOP</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15] mb-6">
              Learn How To Earn <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200">₹1,00,000/Month</span> Selling Digital Products From Scratch!
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-xl text-slate-300 max-w-3xl mb-8 leading-relaxed font-normal">
              Complete Hindi Blueprint: Discover how to <strong>Buy/Source Digital Products</strong>, <strong>Build Your E-commerce Website</strong> in 30 minutes, and <strong>Run High-Profitable Facebook & Instagram Ads</strong> — No Coding or Prior Experience Needed!
            </p>

            {/* Countdown & Seats Bar */}
            <div className="w-full max-w-xl bg-slate-900/90 border border-amber-500/30 rounded-2xl p-5 mb-8 backdrop-blur-md shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-amber-400 animate-pulse" />
                <div className="text-left">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Offer Expires In</p>
                  <p className="text-xl font-bold font-mono text-amber-400">
                    {String(timeLeft.minutes).padStart(2, '0')}m : {String(timeLeft.seconds).padStart(2, '0')}s
                  </p>
                </div>
              </div>
              <div className="h-8 w-px bg-slate-800 hidden sm:block" />
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-emerald-400" />
                <div className="text-left">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Limited Seats Left</p>
                  <p className="text-lg font-bold text-emerald-400">Only 7 Seats Remaining</p>
                </div>
              </div>
            </div>

            {/* Pricing CTA Area */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md mb-6">
              <button
                onClick={handleEnroll}
                className="w-full py-4 px-8 rounded-xl font-bold text-lg text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.4)] transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3 group"
              >
                <span>Enroll Now @ Only ₹49</span>
                <ArrowRight className="w-5 h-5 text-slate-950 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <p className="text-xs text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Instant Access After Payment • 100% Satisfaction Guarantee</span>
            </p>

            {/* Highlights Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 w-full max-w-4xl text-left">
              {[
                { title: "No Coding Needed", desc: "Drag & drop website builder setup" },
                { title: "High Profit Margin", desc: "90% - 95% profit on every sale" },
                { title: "Instant Delivery", desc: "Automated digital product delivery" },
                { title: "Low Ad Budget", desc: "Start Facebook Ads at just ₹100/day" }
              ].map((item, i) => (
                <div key={i} className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl backdrop-blur-sm">
                  <CheckCircle2 className="w-5 h-5 text-amber-400 mb-2" />
                  <h4 className="font-bold text-sm text-white mb-1">{item.title}</h4>
                  <p className="text-xs text-slate-400 leading-snug">{item.desc}</p>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* Key Pillars Section - What You Will Learn */}
      <section className="py-20 bg-slate-900 border-b border-slate-800">
        <div className="container mx-auto px-4 max-w-6xl">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-amber-400 tracking-wider uppercase bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              Masterclass Curriculum
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-4 mb-4">
              What You Will Learn In This 3-Step Masterclass
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Everything you need to launch, market, and scale your digital product business from 0 to 6 figures.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Pillar 1 */}
            <div className="bg-slate-950 border border-amber-500/20 rounded-2xl p-6 relative hover:border-amber-500/40 transition-all shadow-xl group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6 group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Pillar #1</span>
              <h3 className="text-xl font-bold text-white mt-1 mb-3">Digital Product Buying & Sourcing</h3>
              <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                Learn where and how to acquire high-demand digital products, software, PLR ebooks, graphics, and video editing bundles with full Master Resell Rights (MRR).
              </p>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Top trusted PLR & Digital asset supplier platforms</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Identifying trending & high-converting product niches</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Acquiring lifetime resell rights for 95% profit margins</span>
                </li>
              </ul>
            </div>

            {/* Pillar 2 */}
            <div className="bg-slate-950 border border-amber-500/20 rounded-2xl p-6 relative hover:border-amber-500/40 transition-all shadow-xl group">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                <Globe className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Pillar #2</span>
              <h3 className="text-xl font-bold text-white mt-1 mb-3">Website & E-commerce Store Setup</h3>
              <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                Build your own high-converting sales landing page and automated e-commerce store step-by-step in 30 minutes without writing a single line of code.
              </p>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>No-code store setup & landing page design</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Integrating Payment Gateways (Razorpay/XPay/UPI)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Automated instant download delivery to buyers</span>
                </li>
              </ul>
            </div>

            {/* Pillar 3 */}
            <div className="bg-slate-950 border border-amber-500/20 rounded-2xl p-6 relative hover:border-amber-500/40 transition-all shadow-xl group">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Pillar #3</span>
              <h3 className="text-xl font-bold text-white mt-1 mb-3">Facebook & Instagram Ads Mastery</h3>
              <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                Master Meta advertising to get targeted buyers every single day. Learn how to launch ads starting with just ₹100/day and scale up profitably.
              </p>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Setting up Facebook Business Manager & Meta Pixel</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Writing winning ad copy & creating viral video/image ads</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Targeting high-intent buyers & scaling budget safely</span>
                </li>
              </ul>
            </div>

          </div>

        </div>
      </section>

      {/* Free Bonuses Stack Section */}
      <section className="py-20 bg-slate-950 border-b border-slate-800 relative">
        <div className="container mx-auto px-4 max-w-5xl">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-emerald-400 tracking-wider uppercase bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Exclusive Registration Bonuses
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-4 mb-4">
              Get ₹15,000+ Worth Free Bonuses Included Today!
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              When you enroll in the Masterclass for ₹49 today, you get all these premium tools & assets for FREE!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {[
              {
                title: "Bonus #1: 10,000+ Ready-To-Sell Digital Products Pack",
                value: "₹4,999",
                desc: "Get instant access to thousands of ebooks, Canva templates, video editing presets, and software tools to start selling immediately.",
                icon: Gift,
                color: "text-amber-400"
              },
              {
                title: "Bonus #2: High-Converting Facebook Ad Templates",
                value: "₹3,999",
                desc: "Proven ad copy scripts and Canva graphic templates designed to drive maximum clicks and sales on Facebook & Instagram.",
                icon: Sparkles,
                color: "text-blue-400"
              },
              {
                title: "Bonus #3: Pre-Built E-commerce Landing Page Template",
                value: "₹4,499",
                desc: "Plug-and-play sales page template that you can import instantly to launch your digital store in minutes.",
                icon: Globe,
                color: "text-indigo-400"
              },
              {
                title: "Bonus #4: VIP Student Community & Mentorship Access",
                value: "Priceless",
                desc: "Join our private Telegram / WhatsApp group for ongoing support, Q&A sessions, and updates on trending digital products.",
                icon: Users,
                color: "text-emerald-400"
              }
            ].map((bonus, idx) => (
              <div key={idx} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex gap-4 items-start shadow-lg">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl shrink-0 text-amber-400">
                  <bonus.icon className={`w-6 h-6 ${bonus.color}`} />
                </div>
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="font-bold text-white text-base">{bonus.title}</h4>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 shrink-0">
                      FREE (Valued {bonus.value})
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{bonus.desc}</p>
                </div>
              </div>
            ))}

          </div>

          <div className="text-center mt-12">
            <button
              onClick={handleEnroll}
              className="py-4 px-10 rounded-xl font-bold text-lg text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.35)] transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              Claim Bonuses & Enroll @ ₹49 Now
            </button>
          </div>

        </div>
      </section>

      {/* Target Audience Section */}
      <section className="py-20 bg-slate-900 border-b border-slate-800">
        <div className="container mx-auto px-4 max-w-5xl">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Who Is This Masterclass For?
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              If you fall into any of these categories, this masterclass is 100% crafted for you.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Students & Jobseekers",
                desc: "Looking to build a reliable side income stream online with low investment."
              },
              {
                title: "Freelancers & Marketers",
                desc: "Wanting to package digital assets and sell recurring products."
              },
              {
                title: "E-commerce Sellers",
                desc: "Transitioning from physical products to 90%+ profit margin digital items."
              },
              {
                title: "Content Creators",
                desc: "Wanting to monetize their audience with digital guides, courses, or presets."
              }
            ].map((card, i) => (
              <div key={i} className="bg-slate-950 border border-slate-800 rounded-xl p-5 text-left">
                <CheckCircle2 className="w-6 h-6 text-amber-400 mb-3" />
                <h4 className="font-bold text-white text-base mb-2">{card.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Main Pricing Box Section */}
      <section className="py-20 bg-slate-950 relative overflow-hidden" id="enroll">
        <div className="container mx-auto px-4 max-w-3xl relative z-10">
          
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-500/40 rounded-3xl p-8 sm:p-12 shadow-[0_0_50px_rgba(245,158,11,0.2)] text-center relative">
            
            {/* Top Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 font-extrabold text-xs uppercase px-4 py-1.5 rounded-full shadow-lg">
              SPECIAL 84% OFF DISCOUNT
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
              Join Digital Product Selling Masterclass
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mb-6">
              Complete 3-Hour Workshop + Recordings + ₹15,000+ Bonuses
            </p>

            {/* Price Display */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <span className="text-slate-500 text-xl sm:text-2xl line-through font-semibold">₹2,999</span>
              <span className="text-4xl sm:text-6xl font-extrabold text-amber-400">₹49</span>
              <span className="text-xs font-bold bg-amber-500/20 text-amber-400 px-2.5 py-1 rounded-md border border-amber-500/30">
                ONLY TODAY
              </span>
            </div>

            {/* Checklist */}
            <div className="text-left max-w-md mx-auto space-y-3 mb-8 text-xs sm:text-sm text-slate-300">
              {[
                "Step-by-Step Digital Product Buying & Sourcing Guide",
                "No-Code Website & E-commerce Store Creation Blueprint",
                "Facebook & Instagram Ads Mastery (₹100/day Budget Strategy)",
                "Lifetime Access to Masterclass Recording",
                "Free 10,000+ Digital Products Resell Bundle (Worth ₹4,999)",
                "Facebook Ad Copies & Website Templates (Worth ₹8,498)",
                "VIP Telegram / WhatsApp Support Group Access"
              ].map((feat, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            {/* Big CTA Button */}
            <button
              onClick={handleEnroll}
              className="w-full py-4 px-8 rounded-xl font-extrabold text-lg sm:text-xl text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.4)] transition-all transform hover:-translate-y-0.5 mb-4"
            >
              ENROLL NOW FOR ₹49 ONLY 🚀
            </button>

            <div className="flex items-center justify-center gap-6 text-xs text-slate-400">
              <span className="flex items-center gap-1"><Lock className="w-3.5 h-3.5 text-emerald-400" /> Safe & Secure Checkout</span>
              <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Instant Access</span>
            </div>

          </div>

        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="py-20 bg-slate-900 border-t border-slate-800">
        <div className="container mx-auto px-4 max-w-3xl">
          
          <div className="text-center mb-12">
            <HelpCircle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Frequently Asked Questions (FAQs)
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "What is covered in this masterclass?",
                a: "This masterclass teaches you 3 core pillars: 1) How to buy and source digital products with resell rights, 2) How to build your e-commerce store without coding, and 3) How to run profitable Facebook & Instagram Ads to get buyers."
              },
              {
                q: "Do I need any technical or coding knowledge?",
                a: "No! Absolutely no coding or technical experience is required. Everything is explained step-by-step in simple Hindi using beginner-friendly drag-and-drop tools."
              },
              {
                q: "Will I get recordings of the masterclass?",
                a: "Yes! You will get lifetime access to the masterclass video recordings and downloadable materials right after enrollment."
              },
              {
                q: "How much ad budget do I need to start Facebook Ads?",
                a: "You can start testing Facebook and Instagram ads with a budget as low as ₹100 to ₹200 per day. We teach you how to target high-intent buyers profitably."
              },
              {
                q: "How do I get the ₹15,000+ worth of free bonuses?",
                a: "As soon as you complete your ₹49 payment, you will instantly receive access links to all digital product bundles, templates, and the VIP Telegram community."
              }
            ].map((faq, i) => (
              <div key={i} className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleFaq(i)}
                  className="w-full p-5 text-left font-bold text-white flex justify-between items-center gap-4 hover:bg-slate-900/50 transition-colors"
                >
                  <span className="text-sm sm:text-base">{faq.q}</span>
                  {openFaq === i ? (
                    <ChevronUp className="w-5 h-5 text-amber-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                  )}
                </button>
                {openFaq === i && (
                  <div className="p-5 pt-0 text-slate-400 text-xs sm:text-sm border-t border-slate-800/60 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Sticky Mobile/Desktop Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 border-t border-amber-500/30 p-3 backdrop-blur-md shadow-2xl">
        <div className="container mx-auto px-4 max-w-4xl flex items-center justify-between gap-4">
          <div className="hidden sm:block">
            <p className="text-xs text-amber-400 font-semibold">Masterclass Special Discount Offer</p>
            <p className="text-sm font-extrabold text-white">Enroll Today for Only <span className="text-amber-400">₹49</span> <span className="line-through text-slate-500 text-xs font-normal">₹2,999</span></p>
          </div>
          <button
            onClick={handleEnroll}
            className="w-full sm:w-auto py-3 px-8 rounded-xl font-bold text-sm sm:text-base text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all"
          >
            Enroll @ ₹49 Now 🚀
          </button>
        </div>
      </div>

      <Footer />
    </div>
  )
}
