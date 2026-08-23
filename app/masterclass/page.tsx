"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Logo } from "@/components/logo"
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
  HelpCircle,
  Download,
  DollarSign,
  Target,
  BarChart3,
  CheckSquare
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
      
      {/* 1. Top Urgency Banner (Gold-Amber Theme) */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 py-2.5 px-4 text-center font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md">
        <Flame className="w-4 h-4 animate-bounce text-slate-950 shrink-0" />
        <span>SPECIAL LIMITED TIME OFFER: Join the Live Masterclass Today for Only <strong>₹49</strong> <span className="line-through opacity-75">₹2,999</span> (84% OFF)</span>
        <Flame className="w-4 h-4 animate-bounce text-slate-950 shrink-0" />
      </div>

      {/* 2. Minimal Landing Page Header (No Store Navigation Distractions) */}
      <header className="py-4 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-4 max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo textClassName="text-white text-lg sm:text-xl" />
            <span className="text-xs bg-amber-500/20 text-amber-400 font-bold px-2.5 py-0.5 rounded border border-amber-500/30">
              MASTERCLASS
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-xs text-amber-400 font-semibold bg-slate-900 border border-amber-500/20 px-3 py-1.5 rounded-lg">
              <Clock className="w-3.5 h-3.5 animate-pulse text-amber-400" />
              <span>Offer Ends In: {String(timeLeft.minutes).padStart(2, '0')}m {String(timeLeft.seconds).padStart(2, '0')}s</span>
            </div>

            <button
              onClick={handleEnroll}
              className="py-2 px-4 sm:px-6 rounded-lg text-xs sm:text-sm font-extrabold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-md transition-transform active:scale-95"
            >
              Enroll @ ₹49
            </button>
          </div>
        </div>
      </header>

      {/* 3. Hero Section (Deep Indigo/Cosmic Theme) */}
      <section className="relative pt-12 pb-20 overflow-hidden bg-gradient-to-b from-slate-950 via-indigo-950/60 to-slate-950 border-b border-indigo-500/20">
        {/* Glow Orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[320px] bg-amber-500/15 blur-[140px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[350px] h-[350px] bg-cyan-500/15 blur-[120px] rounded-full pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10 max-w-5xl text-center">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-400 text-xs sm:text-sm font-bold mb-6 shadow-inner">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <span>LIVE 3-HOUR INTENSIVE WORKSHOP & RECORDING</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15] mb-6">
            Learn How To Build A Profitable <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200">₹1,00,000/Month</span> Digital Product Business!
          </h1>

          {/* Subheadline */}
          <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto mb-8 leading-relaxed font-normal">
            Complete Step-by-Step Blueprint in Hindi: Discover how to <strong>Buy Digital Products</strong>, <strong>Build Your Own Sales Store</strong> in 30 minutes, and <strong>Run High-Profit Facebook Ads</strong> from scratch!
          </p>

          {/* Real-time Urgency Card */}
          <div className="max-w-xl mx-auto bg-slate-900/90 border border-amber-500/40 rounded-2xl p-5 mb-8 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/15 border border-amber-500/30 rounded-xl text-amber-400">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <div className="text-left">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Offer Expires In</p>
                <p className="text-xl font-black font-mono text-amber-400">
                  {String(timeLeft.minutes).padStart(2, '0')}m : {String(timeLeft.seconds).padStart(2, '0')}s
                </p>
              </div>
            </div>
            <div className="h-8 w-px bg-slate-800 hidden sm:block" />
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-400">
                <Users className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Seats Left At ₹49</p>
                <p className="text-lg font-black text-emerald-400">Only 7 Seats Remaining</p>
              </div>
            </div>
          </div>

          {/* Primary CTA Area */}
          <div className="flex flex-col items-center justify-center gap-3 w-full max-w-md mx-auto mb-6">
            <button
              onClick={handleEnroll}
              className="w-full py-4 px-8 rounded-xl font-black text-lg text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.45)] transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3 group"
            >
              <span>Enroll Now @ Only ₹49</span>
              <ArrowRight className="w-5 h-5 text-slate-950 group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
              <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Instant Access</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Lock className="w-4 h-4 text-emerald-400" /> 100% Value Guaranteed</span>
            </div>
          </div>

          {/* Key Benefit Highlights Box */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 text-left">
            {[
              { title: "1. Digital Product Buying", desc: "How & where to buy products with resell rights" },
              { title: "2. Website Building", desc: "Create your automated store without coding" },
              { title: "3. Facebook Ads Setup", desc: "Run high-ROI ads starting at ₹100/day" },
              { title: "4. ₹15,000+ Free Bonuses", desc: "Get ready-to-sell digital asset bundles" }
            ].map((item, i) => (
              <div key={i} className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-md">
                <CheckCircle2 className="w-5 h-5 text-amber-400 mb-2" />
                <h4 className="font-bold text-sm text-white mb-1">{item.title}</h4>
                <p className="text-xs text-slate-400 leading-snug">{item.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 4. COLORFUL SECTION: Detailed Step-by-Step Curriculum (Point-by-Point Color Themes) */}
      <section className="py-20 bg-slate-950 border-b border-slate-800">
        <div className="container mx-auto px-4 max-w-5xl">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-amber-400 tracking-wider uppercase bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              3 COLOR-CODED CORE MODULES
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-4 mb-4">
              Masterclass Mein Aap Kya Kya Seekhenge?
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Har ek module alag color-coded section mein bataya gaya hai taaki aapko har step crystal-clear samajh aaye:
            </p>
          </div>

          <div className="space-y-8">
            
            {/* Step 1: Buying / Sourcing - GOLDEN AMBER COLOR THEME */}
            <div className="bg-gradient-to-br from-amber-950/80 via-slate-900 to-amber-950/40 border-2 border-amber-500/50 rounded-2xl p-6 sm:p-8 shadow-[0_0_40px_rgba(245,158,11,0.15)] relative">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 font-black text-2xl shadow-lg">
                  01
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="text-xs font-black px-3 py-1 rounded-full bg-amber-500 text-slate-950 uppercase tracking-wider">
                      STEP 1: SOURCING
                    </span>
                    <span className="text-xs text-amber-300 font-semibold">95% Profit Margin Business</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-amber-300 mb-3">
                    Digital Products Buy & Source Kaise Karein?
                  </h3>
                  <p className="text-slate-200 text-sm sm:text-base leading-relaxed mb-4">
                    Pehle step mein aap seekhenge ki high-converting digital products (software, ebooks, Canva templates, video presets) kahan se aur kaise khareedein jinhe aap aage **100% Profit** par baar-baar bech sakte hain.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-200 bg-slate-950/70 p-4 rounded-xl border border-amber-500/30">
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span><strong>PLR & MRR License:</strong> Reselling rights wale products kaise lein.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span><strong>Trending Products Niche:</strong> Konsa product sabse zyada bikta hai.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span><strong>Low Sourcing Cost:</strong> ₹100-₹200 mein hazaron products ki sourcing list.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span><strong>Zero Copyright Risk:</strong> Completely legal & safe resell setup.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Website Building - ROYAL ELECTRIC BLUE COLOR THEME */}
            <div className="bg-gradient-to-br from-blue-950/80 via-slate-900 to-cyan-950/40 border-2 border-cyan-500/50 rounded-2xl p-6 sm:p-8 shadow-[0_0_40px_rgba(6,182,212,0.15)] relative">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="w-14 h-14 rounded-2xl bg-cyan-400 text-slate-950 flex items-center justify-center shrink-0 font-black text-2xl shadow-lg">
                  02
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="text-xs font-black px-3 py-1 rounded-full bg-cyan-400 text-slate-950 uppercase tracking-wider">
                      STEP 2: STORE SETUP
                    </span>
                    <span className="text-xs text-cyan-300 font-semibold">No Coding Needed</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-cyan-300 mb-3">
                    E-commerce Website & Sales Page Kaise Banayein?
                  </h3>
                  <p className="text-slate-200 text-sm sm:text-base leading-relaxed mb-4">
                    Bina kisi coding ke sirf 30 minutes mein ek professional e-commerce store aur sales landing page setup karna seekhein. Payment aate hi buyer ko automatic download link mil jayega.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-200 bg-slate-950/70 p-4 rounded-xl border border-cyan-500/30">
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span><strong>No-Code Store Creation:</strong> Drag & Drop karke website tayar karein.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span><strong>UPI & Payment Gateway:</strong> Razorpay / XPay / QR Payment integration.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span><strong>Auto Digital Delivery:</strong> Customer ko instant download milne ka system.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span><strong>Mobile Responsive:</strong> Har phone par fast load hone wala design.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Facebook Ads - NEON PURPLE/VIOLET COLOR THEME */}
            <div className="bg-gradient-to-br from-purple-950/80 via-slate-900 to-indigo-950/40 border-2 border-purple-500/50 rounded-2xl p-6 sm:p-8 shadow-[0_0_40px_rgba(168,85,247,0.15)] relative">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="w-14 h-14 rounded-2xl bg-purple-500 text-white flex items-center justify-center shrink-0 font-black text-2xl shadow-lg">
                  03
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="text-xs font-black px-3 py-1 rounded-full bg-purple-500 text-white uppercase tracking-wider">
                      STEP 3: META ADS
                    </span>
                    <span className="text-xs text-purple-300 font-semibold">Start @ ₹100/Day Budget</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-purple-300 mb-3">
                    Facebook & Instagram Ads Se Daily Sales Kaise Layein?
                  </h3>
                  <p className="text-slate-200 text-sm sm:text-base leading-relaxed mb-4">
                    Meta Ads (Facebook & Instagram Ads) chala kar daily high-paying customers attract karein. Seekhein ₹100/day ke chote budget se shuru karke daily 20-50 orders kaise laayein.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-200 bg-slate-950/70 p-4 rounded-xl border border-purple-500/30">
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                      <span><strong>Meta Pixel Setup:</strong> Conversion tracking & audience mapping.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                      <span><strong>High-ROI Targeting:</strong> Sahi khareedne wale logon tak ad pahanchayein.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                      <span><strong>Winning Ad Creatives:</strong> Bikanewali video & image ads tayar karna.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                      <span><strong>Low Cost Scaling:</strong> Kam kharche mein zyada revenue generate karna.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div className="text-center mt-12">
            <button
              onClick={handleEnroll}
              className="py-4 px-10 rounded-xl font-black text-lg text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.35)] transition-all transform hover:-translate-y-0.5"
            >
              Enroll In Masterclass Now @ ₹49 Only 🚀
            </button>
          </div>

        </div>
      </section>

      {/* 5. COLORFUL SECTION: Free Bonus Stack (EMERALD TEAL THEME) */}
      <section className="py-20 bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 border-y border-emerald-500/40 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
        <div className="container mx-auto px-4 max-w-5xl">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-emerald-400 tracking-wider uppercase bg-emerald-500/20 px-3.5 py-1.5 rounded-full border border-emerald-500/40">
              FREE REGISTRATION BONUSES
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-4 mb-4">
              ₹15,000+ Ke Free Bonuses Included Today!
            </h2>
            <p className="text-slate-300 text-sm sm:text-base">
              ₹49 mein masterclass ke sath aapko ye saare ready-to-use digital assets completely FREE milenge:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: "Bonus 1: 10,000+ Digital Products Resell Bundle",
                value: "₹4,999",
                desc: "Software, Canva templates, Video presets, & eBooks jinhe aap instantly apni website par bechna shuru kar sakte hain.",
                icon: Gift
              },
              {
                title: "Bonus 2: High-Converting Facebook Ad Copies",
                value: "₹3,999",
                desc: "Pre-written ad scripts aur graphic templates jo Facebook ads par 5x sales lane ke liye tested hain.",
                icon: Sparkles
              },
              {
                title: "Bonus 3: Readymade E-commerce Website Template",
                value: "₹4,499",
                desc: "Plug-and-play sales page template jise aap 1-click mein import karke apni store tayar kar sakte hain.",
                icon: Globe
              },
              {
                title: "Bonus 4: Private VIP Support Community",
                value: "Priceless",
                desc: "Private Telegram / WhatsApp group access jahan aap apne doubts pooch sakte hain aur ongoing support pa sakte hain.",
                icon: Users
              }
            ].map((bonus, idx) => (
              <div key={idx} className="bg-slate-950/80 border border-emerald-500/30 rounded-2xl p-6 flex gap-4 items-start shadow-xl">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl shrink-0 text-emerald-400">
                  <bonus.icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="font-bold text-white text-base">{bonus.title}</h4>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500 text-slate-950 shrink-0">
                      FREE ({bonus.value})
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{bonus.desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 6. COLORFUL SECTION: Target Audience (SAPPHIRE VIOLET THEME) */}
      <section className="py-20 bg-gradient-to-b from-slate-900 via-indigo-950/80 to-slate-950 border-b border-indigo-500/30">
        <div className="container mx-auto px-4 max-w-5xl">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
              Who Is This Masterclass For?
            </h2>
            <p className="text-slate-300 text-sm sm:text-base">
              Agar aap inme se kisi bhi category mein aate hain, toh ye masterclass aapke liye best hai:
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
              <div key={i} className="bg-slate-950/80 border border-indigo-500/30 rounded-xl p-5 text-left shadow-lg">
                <CheckCircle2 className="w-6 h-6 text-indigo-400 mb-3" />
                <h4 className="font-bold text-white text-base mb-2">{card.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 7. COLORFUL SECTION: Pricing Offer Box (SUNSET GOLD CRIMSON THEME) */}
      <section className="py-20 bg-slate-950 relative overflow-hidden" id="enroll">
        <div className="container mx-auto px-4 max-w-2xl relative z-10">
          
          <div className="bg-gradient-to-br from-amber-950 via-slate-950 to-orange-950 border-2 border-amber-400 rounded-3xl p-8 sm:p-10 shadow-[0_0_60px_rgba(245,158,11,0.3)] text-center relative">
            
            <div className="inline-block bg-amber-400 text-slate-950 font-black text-xs uppercase px-4 py-1.5 rounded-full mb-6 shadow-md">
              LIMITED TIME 84% OFF DISCOUNT
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-white mb-2">
              Masterclass Enrollment Pass
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mb-6">
              Complete 3-Hour Workshop + Recordings + All ₹15,000 Bonuses
            </p>

            <div className="flex items-center justify-center gap-4 mb-6">
              <span className="text-slate-500 text-xl sm:text-2xl line-through font-semibold">₹2,999</span>
              <span className="text-4xl sm:text-6xl font-black text-amber-400">₹49</span>
              <span className="text-xs font-bold bg-amber-500/20 text-amber-400 px-3 py-1 rounded border border-amber-500/30">
                TODAY ONLY
              </span>
            </div>

            <div className="text-left max-w-md mx-auto space-y-3 mb-8 text-xs sm:text-sm text-slate-200 bg-slate-950/80 p-5 rounded-xl border border-amber-500/30">
              {[
                "Complete Masterclass Live Session & Recording Access",
                "Digital Products Sourcing & Buying Blueprint",
                "30-Minute No-Code Store & Website Setup Guide",
                "Facebook & Instagram Ads Mastery (₹100/day Strategy)",
                "10,000+ Ready-To-Sell Digital Product Resell Assets",
                "Pre-written Ad Copies & Store Templates",
                "Private Telegram VIP Support Community Access"
              ].map((point, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{point}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleEnroll}
              className="w-full py-4 px-8 rounded-xl font-black text-lg sm:text-xl text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.45)] transition-all transform hover:-translate-y-0.5 mb-4"
            >
              ENROLL NOW FOR ₹49 ONLY 🚀
            </button>

            <p className="text-xs text-slate-400 flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Instant Download Access • 100% Satisfaction Guaranteed</span>
            </p>

          </div>

        </div>
      </section>

      {/* 8. Clear FAQ Section */}
      <section className="py-20 bg-slate-900 border-t border-slate-800">
        <div className="container mx-auto px-4 max-w-3xl">
          
          <div className="text-center mb-12">
            <HelpCircle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Aapke Sawal aur Unke Jawab (FAQs)
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "Kya ye masterclass beginners ke liye hai?",
                a: "Haan! Agar aapko koi pehle se experience ya coding nahi aati hai, tab bhi aap is masterclass se sab kuch step-by-step seekh sakte hain."
              },
              {
                q: "Kya mujhe masterclass ki recording milegi?",
                a: "Haan! Payment complete hote hi aapko masterclass ki lifetime recording aur sabhi bonuses ka instant access mil jayega."
              },
              {
                q: "Digital products resell karne mein copyright risk hai kya?",
                a: "Bilkul nahi! Is masterclass mein hum sirf valid PLR aur Master Resell Rights (MRR) wale products sourcing ka tarika sikhate hain jo 100% legal hai."
              },
              {
                q: "Facebook Ads ke liye kitna budget chahiye?",
                a: "Aap daily sirf ₹100 se ₹200 ka budget laga kar ads test kar sakte hain. Hum aapko kam budget mein maximum ROI nikalna sikhate hain."
              },
              {
                q: "₹15,000 ke free bonuses kaise milenge?",
                a: "₹49 ki payment hoti hi aapko dashboard aur email par instant 10,000+ digital products bundle, ad templates, aur VIP Telegram group ka link mil jayega."
              }
            ].map((faq, i) => (
              <div key={i} className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleFaq(i)}
                  className="w-full p-5 text-left font-bold text-white flex justify-between items-center gap-4 hover:bg-slate-800/60 transition-colors"
                >
                  <span className="text-sm sm:text-base">{faq.q}</span>
                  {openFaq === i ? (
                    <ChevronUp className="w-5 h-5 text-amber-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                  )}
                </button>
                {openFaq === i && (
                  <div className="p-5 pt-0 text-slate-300 text-xs sm:text-sm border-t border-slate-800/60 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 9. Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 border-t border-amber-500/30 p-3 backdrop-blur-md shadow-2xl">
        <div className="container mx-auto px-4 max-w-4xl flex items-center justify-between gap-4">
          <div className="hidden sm:block">
            <p className="text-xs text-amber-400 font-bold">Special Masterclass Offer</p>
            <p className="text-sm font-extrabold text-white">Enroll Today for Only <span className="text-amber-400 font-mono text-base">₹49</span> <span className="line-through text-slate-500 text-xs font-normal">₹2,999</span></p>
          </div>
          <button
            onClick={handleEnroll}
            className="w-full sm:w-auto py-3 px-8 rounded-xl font-black text-sm sm:text-base text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all"
          >
            Enroll @ ₹49 Now 🚀
          </button>
        </div>
      </div>

      <Footer />
    </div>
  )
}
