"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCart } from "@/contexts/cart-context"
import { ChevronDown, MessageSquare, ShieldCheck, CheckCircle2, Play, Volume2, VolumeX, Clock, Lock, Shield, Zap, Sparkles } from "lucide-react"

// Fallback product info in case API fetch takes time or isn't loaded yet
const FALLBACK_PRODUCT = {
  id: "mega-video-editing-bundle-the-ultimate-toolkit-for-creators-cf1b23",
  title: "Video Editing Assets Bundle",
  price: 199,
  category: "digital",
  tags: ["digital", "bundle"],
  imageUrl: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/hero1.webp",
  downloadUrl: "[]",
  isActive: true,
  salesCount: 100,
  createdBy: "admin"
}

// WhatsApp link
const WHATSAPP_LINK = "https://wa.me/917500167987?text=Hi%20GrabNext,%20I%20have%2520a%2520query%2520regarding%2520the%2520Video%2520Editing%2520Bundle"

// Mock Indian purchase popups (Herd Effect)
const BUYER_NAMES = ["Rohit", "Karan", "Anil", "Vishal", "Manish", "Deepak", "Suresh", "Tarun", "Aditya", "Ramesh", "Karthik", "Arjun", "Chetan", "Shibin", "Altaf", "Naman", "Priya", "Pooja", "Soumya", "Kirti"]
const BUYER_CITIES = ["Chennai", "Bengaluru", "Hyderabad", "Mumbai", "Delhi", "Kolkata", "Jaipur", "Lucknow", "Bhopal", "Srinagar", "Pune", "Ahmedabad", "Coimbatore", "Kochi", "Visakhapatnam", "Vijayawada", "Mysuru", "Chandigarh", "Patna", "Surat"]

interface NotificationState {
  name: string
  city: string
  visible: boolean
}

export function EditingLandingPageClient() {
  const router = useRouter()
  const { addToCart, clearCart } = useCart()
  const [product, setProduct] = useState<any>(null)

  const [activeFaq, setActiveFaq] = useState<number | null>(null)
  const [notification, setNotification] = useState<NotificationState>({
    name: "Rohit",
    city: "Delhi",
    visible: false
  })
  
  // Video player controls
  const [isMuted, setIsMuted] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const handlePlayWithSound = () => {
    if (videoRef.current) {
      videoRef.current.muted = false
      setIsMuted(false)
      videoRef.current.play().then(() => {
        setHasInteracted(true)
      }).catch(err => {
        console.log("Play with sound prevented by browser:", err)
      })
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !videoRef.current.muted
      videoRef.current.muted = newMuted
      setIsMuted(newMuted)
      if (!newMuted) {
        setHasInteracted(true)
        videoRef.current.play().catch(() => {})
      }
    }
  }

  // Attempt unmuted play on load, fallback to muted autoplay if browser restricts
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = false
      videoRef.current.play().then(() => {
        setIsMuted(false)
        setHasInteracted(true)
      }).catch(() => {
        if (videoRef.current) {
          videoRef.current.muted = true
          setIsMuted(true)
          videoRef.current.play().catch(() => {})
        }
      })
    }
  }, [])

  // Offer Urgency Countdown Timer (15 mins)
  const [timeLeft, setTimeLeft] = useState({ minutes: 14, seconds: 59 })
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 }
        if (prev.minutes > 0) return { minutes: prev.minutes - 1, seconds: 59 }
        return { minutes: 14, seconds: 59 }
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Prefetch product by slug on mount & track Meta Pixel / Google Ads ViewContent
  useEffect(() => {
    fetch("/api/products/mega-video-editing-bundle-the-ultimate-toolkit-for-creators-cf1b23")
      .then(res => res.json())
      .then(data => {
        if (data && data.id) {
          // Ensure price is 199 for campaign consistency
          setProduct({ ...data, price: 199 })
        }
      })
      .catch(err => console.error("Prefetch product failed", err))
  }, [])

  // Track Meta Pixel ViewContent & Google Ads view_item on mount / product change
  useEffect(() => {
    const targetProduct = product || FALLBACK_PRODUCT
    try {
      import("@/lib/pixel").then(({ trackViewContent }) => {
        trackViewContent({
          content_name: targetProduct.title,
          content_ids: [targetProduct.id],
          contents: [{ id: targetProduct.id, quantity: 1, item_price: 199 }],
          value: 199,
          currency: "INR"
        })
      })

      // Google Ads / Analytics GTAG Event
      if (typeof window !== "undefined" && (window as any).gtag) {
        ;(window as any).gtag("event", "view_item", {
          currency: "INR",
          value: 199,
          items: [{ item_id: targetProduct.id, item_name: targetProduct.title, price: 199 }]
        })
      }
    } catch (err) {
      console.error("Pixel ViewContent tracking error:", err)
    }
  }, [product])

  // Handle direct checkout (add to cart & redirect)
  const handlePurchase = (e: React.MouseEvent) => {
    e.preventDefault()
    const targetProduct = product || FALLBACK_PRODUCT
    const purchaseProduct = { ...targetProduct, price: 199 }
    clearCart()
    addToCart(purchaseProduct)
    
    // Track Meta Pixel AddToCart event
    try {
      import("@/lib/pixel").then(({ trackAddToCart }) => {
        trackAddToCart({
          content_name: purchaseProduct.title,
          content_ids: [purchaseProduct.id],
          contents: [{ id: purchaseProduct.id, quantity: 1, item_price: 199 }],
          value: 199,
          currency: "INR"
        })
      })

      // Track Google Ads / GTAG add_to_cart & begin_checkout events
      if (typeof window !== "undefined" && (window as any).gtag) {
        ;(window as any).gtag("event", "add_to_cart", {
          currency: "INR",
          value: 199,
          items: [{ item_id: purchaseProduct.id, item_name: purchaseProduct.title, price: 199 }]
        })
        ;(window as any).gtag("event", "begin_checkout", {
          currency: "INR",
          value: 199,
          items: [{ item_id: purchaseProduct.id, item_name: purchaseProduct.title, price: 199 }]
        })
      }
    } catch (err) {
      console.error("Pixel tracking error:", err)
    }

    router.push("/checkout")
  }

  // Carousel of buyer notifications
  useEffect(() => {
    const showNextNotification = () => {
      const randomName = BUYER_NAMES[Math.floor(Math.random() * BUYER_NAMES.length)]
      const randomCity = BUYER_CITIES[Math.floor(Math.random() * BUYER_CITIES.length)]
      
      setNotification({
        name: randomName,
        city: randomCity,
        visible: true
      })

      // Hide after 4 seconds
      setTimeout(() => {
        setNotification(prev => ({ ...prev, visible: false }))
      }, 4000)
    }

    // Start displaying after 5 seconds, repeat every 12 seconds
    const initialTimeout = setTimeout(showNextNotification, 5000)
    const interval = setInterval(showNextNotification, 12000)

    return () => {
      clearTimeout(initialTimeout)
      clearInterval(interval)
    }
  }, [])

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index)
  }

  // Feature cards data
  const featureCards = [
    { title: "2000+ FX Presets", img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/7.webp" },
    { title: "3000+ Sound Effects", img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/22.webp" },
    { title: "1000+ Royalty Free Music", img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/29.webp" },
    { title: "200+ Cinematic Luts", img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/21.webp" },
    { title: "Wedding Invitation Pack", img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/14.webp" },
    { title: "Wedding Title Pack", img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/18.webp" },
    { title: "Glitch Effects", img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/4.webp" },
    { title: "4K Cinematic Film Grain", img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/8.webp" },
    { title: "Fire Spark Overlays", img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/10.webp" },
    { title: "10,000+ Fonts Collection", img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/9.webp" },
    { title: "Rain Overlays", img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/11-1.webp" },
    { title: "Smoke Overlays", img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/12.webp" },
    { title: "Dust & Snow Overlays", img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/13.webp" },
    { title: "Youtube Essential Pack", img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/6.webp" },
    { title: "Lens & Bokeh Overlays", img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/15.webp" },
    { title: "Light Leak Overlays", img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/16.webp" },
    { title: "Logo Animation Pack", img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/17.webp" },
    { title: "800+ Transitions Pack", img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/1.webp" },
    { title: "100+ After Effects Plugins", img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/19.webp" },
    { title: "100+ Backgrounds", img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/20.webp" },
    { title: "Video Editing Course", img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/5.webp" },
    { title: "Camera Rig Overlays", img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/3.webp" },
    { title: "200+ Animated Emoji", img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/23.webp" },
    { title: "100+ Callout Graphics", img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/24.webp" },
    { title: "1500+ Lower Third Pack", img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/25.webp" },
    { title: "500+ Stock Videos", img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/26.webp" },
    { title: "Motion Graphic Pack", img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/27.webp" },
    { title: "Animated Title Pack", img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/28.webp" },
  ]

  // FAQs data
  const faqs = [
    { q: "What is included in the Video Editing Bundle?", a: "The bundle includes over 70 GB of assets, such as 800+ transitions, 2,000+ FX presets, 10,000+ fonts, 3,000+ sound effects, a comprehensive video editing course, and many more." },
    { q: "How do I access the assets after purchase?", a: "After purchasing, you will get instant access to the Google Drive, download all the assets, extract them and start using it." },
    { q: "What payment methods do you support?", a: "We support all major payment methods, including PhonePe, Google Pay, Paytm, UPI, credit cards, and debit cards. All transactions are processed securely to ensure your safety." },
    { q: "What should I do if my payment fails?", a: "If your payment fails, please try again. If the issue continues, try again with a different payment method." },
    { q: "I have purchased the bundle; now how can I use the assets?", a: "Once you get access to Google Drive, download the folders to your laptop or PC. Extract the files using WinRAR or 7-Zip, or a similar tool, and then import them into your video editing software to start using them." },
    { q: "Can I use these assets for commercial projects?", a: "Yes, the assets are royalty-free and can be used for personal and commercial projects." },
    { q: "Do I need any prior experience in video editing?", a: "No, the bundle is designed for both beginners and experienced editors. The included tutorials will help you get started." },
    { q: "Is this bundle compatible with all video editing software?", a: "Most of the assets in the bundle are compatible with all major video editing software. However, some elements are specifically designed for Adobe software like Premiere Pro and After Effects. If your software supports standard formats like MOGRT, LUTs, CUBE, overlays, and sound effects, you should have no issues using them." },
    { q: "I got access, but I missed the link. Where can I find it?", a: "You would have received the email with the access as soon as your order is complete. Kindly check your Inbox. If you still don't find it, just share your details with our WhatsApp support team and request the link: https://wa.me/917500167987" },
    { q: "What should I do if I ever need assistance?", a: "If you encounter any issues, you can contact customer support on support@idigitalcampus.com (or) WhatsApp: https://wa.me/917500167987" },
  ]

  return (
    <div className="bg-[#0b0c15] text-slate-100 font-sans min-h-screen selection:bg-violet-600 selection:text-white overflow-x-hidden">
      
      {/* Dynamic Keyframe Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes glowBtn {
          0% { box-shadow: 0 0 5px rgba(124, 58, 237, 0.4), 0 0 10px rgba(124, 58, 237, 0.2); }
          100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.8), 0 0 35px rgba(139, 92, 246, 0.5); }
        }
        .neon-pulse-btn {
          animation: glowBtn 1.5s infinite alternate ease-in-out;
        }
        .text-neon-glow {
          text-shadow: 0 0 10px rgba(167, 139, 250, 0.4);
        }
        .text-cyan-glow {
          text-shadow: 0 0 10px rgba(34, 211, 238, 0.4);
        }
      `}} />

      {/* TOP ANNOUNCEMENT BANNER WITH COUNTDOWN */}
      <div className="bg-gradient-to-r from-violet-950 via-indigo-900 to-violet-950 border-b border-violet-850/50 py-2.5 text-center px-4 relative z-30">
        <a 
          onClick={handlePurchase}
          href="/checkout"
          className="text-xs sm:text-sm font-semibold tracking-wide hover:underline inline-flex flex-wrap items-center justify-center gap-2 group text-violet-200"
        >
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>Get Lifetime Access now at just <del className="text-slate-450 mr-1">₹2,999</del> <strong className="text-white text-base">₹199</strong>. Offer Ends In:</span>
          <span className="inline-flex items-center gap-1 font-mono font-bold bg-violet-900/80 px-2 py-0.5 rounded text-amber-300 border border-violet-700/50 text-xs">
            <Clock className="h-3 w-3 animate-pulse" />
            {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
          </span>
          <span className="group-hover:translate-x-1 inline-block transition-transform text-xs font-bold text-emerald-400">HURRY UP! ⚡</span>
        </a>
      </div>

      {/* HERO SECTION */}
      <section className="relative pt-12 pb-20 px-4 md:px-8 max-w-6xl mx-auto text-center z-20">
        {/* Glow Effects in Background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] md:w-[600px] h-[350px] md:h-[600px] bg-violet-650/10 rounded-full blur-[100px] -z-10" />
        <div className="absolute top-1/3 left-1/4 w-[250px] h-[250px] bg-cyan-600/5 rounded-full blur-[80px] -z-10" />

        <div className="space-y-6">
          <p className="text-violet-400 font-extrabold uppercase tracking-widest text-xs md:text-sm flex items-center justify-center gap-1.5">
            <Sparkles className="h-4 w-4 text-amber-400 animate-spin" /> 🔥 Ultimate Creator Cheat-Code
          </p>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight max-w-5xl mx-auto">
            Stop Spending Hours Editing From Scratch & <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent text-cyan-glow">Cut Your Editing Time By 90%!</span>
            <span className="block mt-4 bg-gradient-to-r from-violet-400 via-fuchsia-300 to-cyan-400 bg-clip-text text-transparent text-neon-glow text-2xl md:text-4xl lg:text-5xl">
              Introducing: GrabNext World&apos;s Biggest Video Editing Bundle!
            </span>
          </h1>

          <p className="text-slate-400 text-sm md:text-lg max-w-3xl mx-auto leading-relaxed font-light">
            Get over <strong className="text-white font-bold">70 GB</strong> of video editing assets: transitions, overlays, fonts, LUTs, FX, and premade templates. Compatible with Premiere Pro, After Effects, DaVinci, Filmora etc. Plus a complete masterclass to get you started!
          </p>

          {/* Value Tags */}
          <div className="flex flex-wrap justify-center gap-3 pt-2 text-xs md:text-sm">
            <span className="px-4 py-2 rounded-full bg-slate-900/80 border border-slate-800 text-slate-350 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-violet-400" /> Lifetime Access
            </span>
            <span className="px-4 py-2 rounded-full bg-slate-900/80 border border-slate-800 text-slate-350 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-400" /> One-time Payment
            </span>
            <span className="px-4 py-2 rounded-full bg-slate-900/80 border border-slate-800 text-slate-350 flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-emerald-400" /> Instant Digital Download
            </span>
          </div>

          {/* MAIN HERO CTA BUTTON */}
          <div className="pt-6 pb-4">
            <a 
              onClick={handlePurchase}
              href="/checkout"
              className="neon-pulse-btn inline-flex items-center gap-3 px-8 py-4 sm:px-10 sm:py-5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-base sm:text-lg rounded-xl transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-violet-550/30 group"
            >
              <svg aria-hidden="true" className="h-5 w-5 fill-current text-white animate-bounce" viewBox="0 0 320 512" xmlns="http://www.w3.org/2000/svg">
                <path d="M302.189 329.126H196.105l55.831 135.993c3.889 9.428-.555 19.999-9.444 23.999l-49.165 21.427c-9.165 4-19.443-.571-23.332-9.714l-53.053-129.136-86.664 89.138C18.729 472.71 0 463.554 0 447.977V18.299C0 1.899 19.921-6.096 30.277 5.443l284.412 292.542c11.472 11.179 3.007 31.141-12.5 31.141z"></path>
              </svg>
              <span>⚡ GET EVERYTHING AT JUST ₹199</span>
            </a>
            
            {/* TRUST BADGES UNDER HERO BUTTON */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-slate-400 text-xs mt-4">
              <span className="flex items-center gap-1"><ShieldCheck className="h-4 w-4 text-emerald-400" /> Instant UPI Access</span>
              <span className="flex items-center gap-1"><Lock className="h-4 w-4 text-indigo-400" /> 256-Bit SSL Encrypted</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-violet-400" /> 100% Verified Assets</span>
            </div>

            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mt-3">
              *Price will change back to ₹2,999 once the offer ends
            </p>
          </div>
        </div>

        {/* DEMO / VIDEO PREVIEW & BANNER IMAGES */}
        <div className="mt-12 max-w-4xl mx-auto rounded-2xl overflow-hidden bg-slate-900/60 border border-slate-800 shadow-2xl p-2 md:p-3 relative group">
          <div className="flex items-center justify-between px-3 pb-3 border-b border-slate-850 text-slate-500 text-xs">
            <span className="flex items-center gap-1.5 font-semibold text-slate-400">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-ping"></span> DEMO_PREVIEW.MP4
            </span>
            <button 
              onClick={toggleMute} 
              className="hover:text-white px-2.5 py-1 bg-violet-900/60 border border-violet-700/50 rounded-lg flex items-center gap-1.5 text-xs text-violet-200 transition-colors"
              title={isMuted ? "Unmute Sound" : "Mute Sound"}
            >
              {isMuted ? (
                <>
                  <VolumeX className="h-4 w-4 text-amber-400" />
                  <span className="text-[11px] font-bold text-amber-300">CLICK TO UNMUTE AUDIO 🔊</span>
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4 text-emerald-400 animate-pulse" />
                  <span className="text-[11px] font-bold text-emerald-400">AUDIO ON 🎵</span>
                </>
              )}
            </button>
          </div>

          <div className="aspect-video w-full relative bg-black overflow-hidden group">
            <video 
              ref={videoRef}
              className="w-full h-full object-cover cursor-pointer" 
              src="https://wbveb.idigitalcampus.com/wp-content/uploads/2025/05/Video-Editing-Bundle-Demo-1280x720-1.mp4" 
              autoPlay 
              loop 
              muted={isMuted} 
              playsInline
              controls
              onClick={handlePlayWithSound}
            />

            {/* "CLICK HERE TO PLAY (WITH SOUND)" OVERLAY BUTTON */}
            {(!hasInteracted || isMuted) && (
              <div 
                onClick={handlePlayWithSound}
                className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px] flex flex-col items-center justify-center cursor-pointer z-10 p-4 transition-all duration-300 hover:bg-slate-950/30"
              >
                <div className="neon-pulse-btn bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-600 text-white font-black px-6 py-3.5 sm:px-8 sm:py-4 rounded-2xl shadow-2xl flex items-center gap-3 transform hover:scale-105 transition-all border border-violet-400/50">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white/20 flex items-center justify-center shrink-0 animate-bounce">
                    <Play className="h-5 w-5 sm:h-6 sm:w-6 fill-white text-white ml-0.5" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-sm sm:text-lg font-black tracking-wide uppercase text-white leading-tight">
                      🔊 CLICK HERE TO PLAY (WITH SOUND)
                    </span>
                    <span className="text-[10px] sm:text-xs text-violet-200 font-semibold leading-tight mt-0.5">
                      Tap to play demo preview with full audio ⚡
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* HERO HERO BANNER IMAGES (Mobile vs Desktop) */}
        <div className="mt-16 max-w-5xl mx-auto rounded-2xl overflow-hidden border border-slate-800/80 shadow-2xl">
          {/* Desktop Image */}
          <img 
            src="https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/hero1.webp" 
            alt="GrabNext Video Editing Assets Package Mockup" 
            className="hidden md:block w-full h-auto object-cover hover:scale-[1.01] transition-transform duration-700" 
          />
          {/* Mobile Image */}
          <img 
            src="https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/Videoeditingheromobile-1-1.webp" 
            alt="GrabNext Video Editing Assets Mobile Package Mockup" 
            className="block md:hidden w-full h-auto object-cover" 
          />
        </div>
      </section>

      {/* THE CREATOR PROBLEM STATEMENT */}
      <section className="bg-slate-950 py-20 px-4 border-y border-slate-900 relative">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-xl md:text-3xl font-extrabold text-white leading-relaxed max-w-3xl mx-auto">
            We understand video editing can be <span className="text-rose-450 border-b-2 border-rose-900/50">time-consuming</span>, taking away <strong className="text-white">valuable moments</strong> that could be spent with <strong className="text-violet-400">your loved ones</strong>.
          </h2>
          <p className="text-slate-400 text-sm md:text-lg leading-relaxed font-light max-w-3xl mx-auto">
            That’s why we spent a year creating this <strong className="text-white font-medium">drag-and-drop template collection</strong> so you can focus on creativity, not the tedious work. Whether you&apos;re a <strong className="text-cyan-400">beginner or a pro</strong>, this bundle has <strong className="text-white">everything you need</strong> to edit effortlessly.
          </p>

          <div className="pt-8">
            <h3 className="text-xs uppercase tracking-widest font-black text-slate-500 mb-6">
              🎯 Especially Designed For:
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-4xl mx-auto text-sm">
              {[
                "Video Editors",
                "Videographers",
                "Content Creators",
                "Film Students",
                "Marketing Agencies",
                "Freelancers",
                "Businesses",
                "Event Organizers"
              ].map((role, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-900/50 border border-slate-850 hover:border-violet-800/60 transition-all duration-300 hover:scale-[1.02] flex items-center gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-900/50 text-violet-300 text-xs font-bold">
                    ✓
                  </span>
                  <span className="text-slate-200 font-semibold">{role}</span>
                </div>
              ))}
            </div>
            
            <p className="text-xs text-slate-500 font-medium mt-6 uppercase tracking-wider">
              ...AND EVERYONE WHO IS INTERESTED!
            </p>
          </div>

          <div className="pt-10">
            <a 
              onClick={handlePurchase}
              href="/checkout"
              className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 font-extrabold text-sm border-b border-violet-500/30 hover:border-violet-400 pb-1 transition-all"
            >
              ⚡ Speed Up Your Editing Workflow Today →
            </a>
          </div>
        </div>
      </section>

      {/* EVERYTHING YOU'LL GET INSIDE SECTION */}
      <section className="py-20 px-4 md:px-8 max-w-6xl mx-auto relative">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-neon-glow">
            Everything You&apos;ll Get Inside:
          </h2>
          <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto">
            A comprehensive, high-quality collection of resources worth over ₹34,999, curated for ultimate speed and professionalism.
          </p>
        </div>

        {/* 28 FEATURE CARDS GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {featureCards.map((card, idx) => (
            <div 
              key={idx} 
              className="group bg-slate-900/40 border border-slate-850 rounded-2xl overflow-hidden hover:border-violet-650/40 hover:shadow-lg hover:shadow-violet-950/20 transition-all duration-500 flex flex-col"
            >
              <div className="aspect-square w-full overflow-hidden bg-slate-950 relative">
                <img 
                  src={card.img} 
                  alt={card.title} 
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-60" />
              </div>
              <div className="p-4 flex-1 flex items-center justify-between gap-2 border-t border-slate-850/60 bg-slate-900/20">
                <h3 className="font-bold text-xs sm:text-sm text-slate-200 group-hover:text-white transition-colors line-clamp-2">
                  {card.title}
                </h3>
                <span className="text-[10px] bg-violet-950/80 text-violet-300 border border-violet-850 px-2 py-0.5 rounded-full shrink-0 font-bold">
                  70GB+
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* SECTION CTA */}
        <div className="mt-16 text-center">
          <a 
            onClick={handlePurchase}
            href="/checkout"
            className="neon-pulse-btn inline-flex items-center gap-3 px-8 py-4 sm:px-10 sm:py-5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-base sm:text-lg rounded-xl transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 shadow-lg group"
          >
            <svg aria-hidden="true" className="h-5 w-5 fill-current text-white animate-bounce" viewBox="0 0 320 512" xmlns="http://www.w3.org/2000/svg">
              <path d="M302.189 329.126H196.105l55.831 135.993c3.889 9.428-.555 19.999-9.444 23.999l-49.165 21.427c-9.165 4-19.443-.571-23.332-9.714l-53.053-129.136-86.664 89.138C18.729 472.71 0 463.554 0 447.977V18.299C0 1.899 19.921-6.096 30.277 5.443l284.412 292.542c11.472 11.179 3.007 31.141-12.5 31.141z"></path>
            </svg>
            <span>⚡ GET INSTANT DOWNLOAD ACCESS FOR ₹199</span>
          </a>
        </div>
      </section>

      {/* JOB MARKET & EARNING QUOTE SECTION */}
      <section className="bg-slate-950 py-24 px-4 border-y border-slate-900 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] bg-indigo-600/5 rounded-full blur-[80px] -z-10" />
        
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <p className="text-xs uppercase tracking-widest font-black text-cyan-400 text-cyan-glow">
            🚀 High Earning Career Potential
          </p>
          <h2 className="text-xl md:text-3xl font-extrabold text-slate-100 leading-relaxed">
            With the growing demand for quality video content, especially on platforms like YouTube, OTT services, digital marketing, and e-learning, the job market for video editors is expanding rapidly, promising a prosperous future and substantial earning potential.
          </h2>
          
          <div className="p-6 md:p-8 rounded-2xl bg-[#111222] border border-violet-900/35 max-w-2xl mx-auto shadow-xl">
            <p className="text-base md:text-xl font-bold text-violet-300 italic">
              &ldquo;An editor earns around ₹560,000 per annum on average, while top-tier editors can earn as much as ₹2,500,000.&rdquo;
            </p>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF / REVIEWS SECTION */}
      <section className="py-20 px-4 md:px-8 max-w-6xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white">
            What our Customers have to say
          </h2>
          <div className="flex flex-col items-center gap-2">
            <p className="text-yellow-450 font-bold text-base sm:text-lg flex items-center gap-1.5">
              ⭐⭐⭐⭐⭐ Rated 9.6 out of 10
            </p>
            <p className="text-slate-400 text-xs sm:text-sm font-semibold uppercase tracking-wider">
              (10,526+ Verified Customers / 99.4% Average Ratings 🔥)
            </p>
          </div>
        </div>

        {/* 6 WHATSAPP SCREENSHOTS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/v1.webp",
            "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/v2.webp",
            "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/v3.webp",
            "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/v4.webp",
            "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/v5.webp",
            "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/v6.webp",
          ].map((url, idx) => (
            <div 
              key={idx} 
              className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 hover:border-violet-800/40 hover:scale-[1.01] transition-all duration-300 shadow-xl"
            >
              <img 
                src={url} 
                alt={`GrabNext Customer Review WhatsApp Screenshot ${idx + 1}`} 
                loading="lazy"
                className="w-full h-auto object-contain" 
              />
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <a 
            onClick={handlePurchase}
            href="/checkout"
            className="neon-pulse-btn inline-flex items-center gap-3 px-8 py-4 sm:px-10 sm:py-5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-base sm:text-lg rounded-xl transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 shadow-lg group"
          >
            <svg aria-hidden="true" className="h-5 w-5 fill-current text-white animate-bounce" viewBox="0 0 320 512" xmlns="http://www.w3.org/2000/svg">
              <path d="M302.189 329.126H196.105l55.831 135.993c3.889 9.428-.555 19.999-9.444 23.999l-49.165 21.427c-9.165 4-19.443-.571-23.332-9.714l-53.053-129.136-86.664 89.138C18.729 472.71 0 463.554 0 447.977V18.299C0 1.899 19.921-6.096 30.277 5.443l284.412 292.542c11.472 11.179 3.007 31.141-12.5 31.141z"></path>
            </svg>
            <span>⚡ CLAIM YOUR LIFETIME ACCESS AT ₹199</span>
          </a>
        </div>
      </section>

      {/* HOW TO ACCESS SECTION */}
      <section className="bg-slate-950 py-20 px-4 border-y border-slate-900 relative">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-3">
            <h2 className="text-3xl md:text-5xl font-black text-white">
              Here&apos;s how you&apos;re going to Access everything
            </h2>
            <p className="text-violet-400 font-extrabold uppercase tracking-widest text-sm text-neon-glow">
              👉 IN 3 SIMPLE CLICKS!!
            </p>
          </div>

          {/* 3 CLICKS STEPS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl flex flex-col items-center text-center space-y-4">
              <div className="w-full aspect-square rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                <img 
                  src="https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/1n1.webp" 
                  alt="Step 1: Click Button" 
                  loading="lazy"
                  className="w-full h-full object-cover" 
                />
              </div>
              <span className="px-3 py-1 bg-violet-900/50 text-violet-300 font-black rounded-lg text-xs tracking-wider">STEP 01</span>
              <h3 className="font-bold text-slate-200">Click &ldquo;Get Everything at ₹199&rdquo; Button</h3>
              <p className="text-xs text-slate-450 leading-relaxed">
                You will be redirected to the GrabNext secure product details checkout page.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl flex flex-col items-center text-center space-y-4">
              <div className="w-full aspect-square rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                <img 
                  src="https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/1n2.webp" 
                  alt="Step 2: Buy Now" 
                  loading="lazy"
                  className="w-full h-full object-cover" 
                />
              </div>
              <span className="px-3 py-1 bg-violet-900/50 text-violet-300 font-black rounded-lg text-xs tracking-wider">STEP 02</span>
              <h3 className="font-bold text-slate-200">Click on &ldquo;Buy Now&rdquo; Button</h3>
              <p className="text-xs text-slate-450 leading-relaxed">
                Fill in your details (name, email, phone) and complete the instant UPI or Card payment.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl flex flex-col items-center text-center space-y-4">
              <div className="w-full aspect-square rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                <img 
                  src="https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/1n3.webp" 
                  alt="Step 3: Instant Access" 
                  loading="lazy"
                  className="w-full h-full object-cover" 
                />
              </div>
              <span className="px-3 py-1 bg-violet-900/50 text-violet-300 font-black rounded-lg text-xs tracking-wider">STEP 03</span>
              <h3 className="font-bold text-slate-200">Download the Access PDF</h3>
              <p className="text-xs text-slate-450 leading-relaxed">
                You will instantly receive an email invoice containing a secure PDF. Inside, find the direct link to the Google Drive folder with all 70 GB+ files!
              </p>
            </div>
          </div>

          <div className="text-center max-w-2xl mx-auto pt-6 space-y-8">
            <p className="text-slate-400 text-sm font-light leading-relaxed">
              Your purchase includes <strong className="text-white">lifetime access</strong> to the product. You can access the provided link at any time to begin using the assets.
            </p>
            
            <div>
              <a 
                onClick={handlePurchase}
                href="/checkout"
                className="neon-pulse-btn inline-flex items-center gap-3 px-8 py-4 sm:px-10 sm:py-5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-base sm:text-lg rounded-xl transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 shadow-lg group"
              >
                <svg aria-hidden="true" className="h-5 w-5 fill-current text-white animate-bounce" viewBox="0 0 320 512" xmlns="http://www.w3.org/2000/svg">
                  <path d="M302.189 329.126H196.105l55.831 135.993c3.889 9.428-.555 19.999-9.444 23.999l-49.165 21.427c-9.165 4-19.443-.571-23.332-9.714l-53.053-129.136-86.664 89.138C18.729 472.71 0 463.554 0 447.977V18.299C0 1.899 19.921-6.096 30.277 5.443l284.412 292.542c11.472 11.179 3.007 31.141-12.5 31.141z"></path>
                </svg>
                <span>⚡ DOWNLOAD INSTANTLY FOR JUST ₹199</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* SATISFACTION PRIORITY */}
      <section className="py-20 px-4 md:px-8 max-w-4xl mx-auto text-center space-y-6">
        <div className="flex justify-center">
          <img 
            src="https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/100.webp" 
            alt="100% Satisfaction Guarantee badge" 
            loading="lazy"
            className="h-32 w-32 object-contain" 
          />
        </div>
        <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
          Your Satisfaction is our No.1 Priority!
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
          GrabNext is committed to providing outstanding value and premium support. We ensure that our video assets, presets, and courses meet the highest standards of professional quality.
        </p>
      </section>

      {/* FAQ SECTION (ACCORDION) */}
      <section className="bg-slate-950 py-20 px-4 border-t border-slate-900 relative">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl md:text-5xl font-black text-white">
              Got Questions? We got Answers!!!
            </h2>
            <p className="text-slate-400 text-sm">
              Everything you need to know about the World&apos;s Biggest Video Editing Bundle.
            </p>
          </div>

          <div className="space-y-4 max-w-3xl mx-auto">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx
              return (
                <div 
                  key={idx} 
                  className="rounded-xl border border-slate-850 bg-[#111220]/60 overflow-hidden transition-all duration-300"
                >
                  <button 
                    onClick={() => toggleFaq(idx)}
                    className="w-full px-6 py-4 flex items-center justify-between gap-4 text-left font-semibold text-slate-100 hover:text-white transition-colors"
                  >
                    <span className="text-sm sm:text-base">{faq.q}</span>
                    <ChevronDown className={`h-4 w-4 shrink-0 text-slate-450 transition-transform duration-300 ${isOpen ? "rotate-180 text-violet-400" : ""}`} />
                  </button>
                  
                  <div 
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${
                      isOpen ? "max-h-96 border-t border-slate-850/50" : "max-h-0"
                    }`}
                  >
                    <div className="p-6 text-xs sm:text-sm text-slate-400 leading-relaxed font-light">
                      {faq.a}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* BRANDING FOOTER */}
      <footer className="bg-[#08090f] py-16 px-4 md:px-8 border-t border-slate-900 relative z-20">
        <div className="max-w-6xl mx-auto flex flex-col items-center space-y-8">
          {/* Logo & Brand */}
          <div className="flex flex-col items-center space-y-3">
            <div className="relative">
              <img 
                src="/logo.png" 
                alt="GrabNext Logo" 
                className="h-10 w-auto object-contain dark:brightness-110" 
              />
            </div>
            <p className="text-slate-500 text-xs font-semibold tracking-widest uppercase">
              GRABNEXT DIGITAL STORE
            </p>
          </div>

          {/* Footer Links */}
          <div className="flex flex-wrap justify-center gap-6 text-xs font-semibold text-slate-400">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <span className="text-slate-800">|</span>
            <Link href="/terms" className="hover:text-white transition-colors">Terms &amp; Conditions</Link>
            <span className="text-slate-800">|</span>
            <Link href="/refund" className="hover:text-white transition-colors">Refund and Cancellation Policy</Link>
            <span className="text-slate-800">|</span>
            <Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link>
          </div>

          {/* Facebook/Meta Disclaimer */}
          <div className="max-w-4xl text-center">
            <p className="text-[10px] text-slate-600 leading-relaxed font-light">
              This site is not affiliated with, endorsed by, or associated with Facebook&trade; or Facebook&trade; Inc. in any way. FACEBOOK&trade; is a trademark of FACEBOOK&trade;, Inc. As required by law, we cannot and do not make any guarantees about your ability to achieve results or earn money with the ideas, information, tools, or strategies provided. Our goal is to offer valuable content, direction, and strategies that have proven effective for us and our students, and which we believe can help you advance. For more information, including our terms, privacy policies, and disclaimers, please refer to the provided links. Transparency is of utmost importance to us, and we uphold a high standard of integrity for both ourselves and our users. Thank you for visiting. We hope this training and content bring you significant value and results.
            </p>
            <p className="text-[10px] text-slate-650 mt-4 font-semibold">
              &copy; {new Date().getFullYear()} GrabNext. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* FLOATING MOBILE CTA BUTTON (Stays fixed at bottom for mobile) */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-slate-950/80 backdrop-blur-md border-t border-slate-900 p-3 z-45 flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-[9px] text-violet-400 font-bold uppercase tracking-widest leading-none">Limited Offer</span>
          <span className="text-sm font-black text-white leading-tight">₹199 <del className="text-[10px] font-semibold text-slate-500 ml-1">₹2,999</del></span>
        </div>
        <a 
          onClick={handlePurchase}
          href="/checkout"
          className="flex-1 py-3 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-black rounded-lg text-center shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5"
        >
          <span>⚡ GET INSTANT DOWNLOAD</span>
        </a>
      </div>

      {/* FLOATING WHATSAPP BUTTON */}
      <a 
        href={WHATSAPP_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-16 md:bottom-6 right-6 h-12 w-12 md:h-14 md:w-14 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-2xl hover:bg-emerald-450 hover:scale-105 transition-all duration-300 z-50 group cursor-pointer"
        title="Contact WhatsApp Support"
      >
        <MessageSquare className="h-6 w-6 fill-current text-white" />
        <span className="absolute right-14 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
          Need Help? Chat Us!
        </span>
      </a>

      {/* HERD EFFECT PURCHASING POPUP (Dynamic popup notification) */}
      <div 
        className={`fixed bottom-20 md:bottom-6 left-6 max-w-[280px] bg-slate-900/90 dark:bg-slate-950/95 backdrop-blur-md border border-slate-800 p-3.5 rounded-xl shadow-2xl transition-all duration-500 z-50 flex gap-3 items-center ${
          notification.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <div className="h-10 w-10 shrink-0 rounded-lg overflow-hidden bg-slate-950 border border-slate-850">
          <img 
            src="https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/Videoeditingheromobile-1-1.webp" 
            alt="Purchase Notification Thumbnail" 
            className="h-full w-full object-cover" 
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-slate-350 leading-tight">
            <strong className="text-white font-bold">{notification.name}</strong> from <strong className="text-violet-400 font-semibold">{notification.city}</strong>
          </p>
          <p className="text-[10px] text-slate-450 mt-0.5 leading-none">
            purchased <span className="text-cyan-400 font-medium">Video Editing Bundle!</span> ⚡
          </p>
          <span className="text-[8px] text-slate-600 block mt-1">
            Just now
          </span>
        </div>
      </div>

    </div>
  )
}
