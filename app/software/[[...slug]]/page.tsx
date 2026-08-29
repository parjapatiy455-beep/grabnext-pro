"use client";
export const runtime = 'edge'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from "react";
import { PRODUCT_BUY_URL, INCLUDED_SOFTWARE, TESTIMONIALS, FAQS, FEATURES } from "../data";
import { useCart } from "@/contexts/cart-context";
import { useRouter } from "next/navigation";
import { trackAddToCart } from "@/lib/pixel";
import { toast } from "@/hooks/use-toast";
import { X, Gift, Tag, Copy, Check } from "lucide-react";

/* ── Animated CTA Button (matches Elementor .btn class) ── */
const BTN_STYLE: React.CSSProperties = {
  backgroundImage: "linear-gradient(130deg, #FFC800 0%, #afff3d 100%)",
  backgroundSize: "200% 200%",
  borderRadius: "10px",
  boxShadow: "0px 8px 10px 0px rgba(0,0,0,0.5)",
  color: "#000",
  fontFamily: "Poppins, sans-serif",
  fontWeight: 850,
  textTransform: "uppercase" as const,
  display: "inline-block",
  textDecoration: "none",
  textAlign: "center" as const,
  cursor: "pointer",
  border: "none",
  transition: "transform 0.15s, box-shadow 0.2s",
};

const VIDEO_BUNDLE_ITEMS = [
  {
    name: "800+ Transitions Pack",
    worth: "₹1,999",
    desc: "Smooth, professional transitions including camera zooms, glides, splits, and motion pans.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/1.webp"
  },
  {
    name: "100+ After Effects Plugins",
    worth: "₹2,499",
    desc: "Speed up your workflow with ready-made plugins and presets to generate complex effects quickly.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/19.webp"
  },
  {
    name: "200+ Animated Emoji Pack",
    worth: "₹999",
    desc: "3D animotions, expressive animated icons, and emojis to instantly boost user engagement.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/23.webp"
  },
  {
    name: "2000+ FX Presets Pack",
    worth: "₹2,999",
    desc: "A giant suite of Adobe Premiere, After Effects, and DaVinci Resolve template presets.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/7.webp"
  },
  {
    name: "3000+ Sound Effects (SFX)",
    worth: "₹1,499",
    desc: "Cinematic risers, impacts, swooshes, nature sounds, typing keys, and transition audios.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/22.webp"
  },
  {
    name: "1000+ Royalty Free Music",
    worth: "₹1,299",
    desc: "Premium background tracks, loops, and instrumental melodies spanning multiple genres.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/29.webp"
  },
  {
    name: "200+ Cinematic LUTs",
    worth: "₹999",
    desc: "Hollywood-grade color lookup tables for professional cinematic grading in one click.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/21.webp"
  },
  {
    name: "70+ Wedding Video Invitation Templates",
    worth: "₹2,999",
    desc: "Beautiful video invitation templates for high-end digital invites and save-the-dates.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/14.webp"
  },
  {
    name: "Wedding Title Animation Pack",
    worth: "₹999",
    desc: "Calligraphy, floral titles, and elegant typography animations for wedding memories.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/18.webp"
  },
  {
    name: "4K Cinematic Film Grain",
    worth: "₹1,499",
    desc: "Add classic film grain textures, dust, scratches, and organic film look overlays.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/8.webp"
  },
  {
    name: "Glitch Transitions & Effects Pack",
    worth: "₹999",
    desc: "Digital glitch elements, error sweeps, and digital video distortions.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/4.webp"
  },
  {
    name: "Light Leak Overlays Pack",
    worth: "₹999",
    desc: "Realistic flares, light leaks, burn frames, and colorful retro glow sweeps.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/16.webp"
  },
  {
    name: "10,000+ Fonts Collection",
    worth: "₹1,999",
    desc: "Massive text typography library with localized, script, display, and modern fonts.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/9.webp"
  },
  {
    name: "Rain Overlays Pack",
    worth: "₹999",
    desc: "High-definition looping rain fall overlays, splash overlays, and wet atmospheric effects.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/11-1.webp"
  },
  {
    name: "Smoke Overlays Pack",
    worth: "₹999",
    desc: "Moody slow-motion looping smoke trails, mist, and cloud effects.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/12.webp"
  },
  {
    name: "Dust & Snow Particle Overlays",
    worth: "₹1,499",
    desc: "Organic dust specks, atmospheric lint particles, and realistic snowfall loops.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/13.webp"
  },
  {
    name: "YouTube Creator Essential Pack",
    worth: "₹2,499",
    desc: "Subscribers bar, bell icons, likes, info sliders, end screen links, and graphics.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/6.webp"
  },
  {
    name: "Lens & Bokeh Overlays",
    worth: "₹1,299",
    desc: "Organic glass flares, warm sun flares, and colorful bokeh circles.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/15.webp"
  },
  {
    name: "Logo Animation Pack",
    worth: "₹1,999",
    desc: "Professional templates for business intros. Plug your logo in and render.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/17.webp"
  },
  {
    name: "100+ Video Backgrounds",
    worth: "₹999",
    desc: "3D animation patterns, grids, lines, abstracts, and studio loops.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/20.webp"
  },
  {
    name: "Full Video Editing Masterclass",
    worth: "₹4,999",
    desc: "Premium video training from basics to advanced keyframing and tracking.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/5.webp"
  },
  {
    name: "Camera Rig View Overlays",
    worth: "₹999",
    desc: "Camera lens indicators, record lights, gridlines, and DSLR status screens.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/3.webp"
  },
  {
    name: "100+ Callout Graphics",
    worth: "₹999",
    desc: "Arrow lines, text pointer boxes, target indicators, and focus badges.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/24.webp"
  },
  {
    name: "1500+ Lower Third Pack",
    worth: "₹1,499",
    desc: "Clean minimal texts, social media handles, guest names, and branding ribbons.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/25.webp"
  },
  {
    name: "500+ High Quality Stock Videos",
    worth: "₹1,999",
    desc: "Royalty free footage, cinematic nature, business office, and city landscape loops.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/26.webp"
  },
  {
    name: "Motion Graphic Pack",
    worth: "₹2,499",
    desc: "Shape overlays, comic sparks, pop bursts, hand-drawn lines, and animation accents.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/27.webp"
  },
  {
    name: "Animated Title Pack",
    worth: "₹999",
    desc: "Stunning text layouts, kinetic typography, slide-ins, and modern header intros.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/28.webp"
  },
  {
    name: "1500+ Motivational Reels",
    worth: "₹3,999",
    desc: "Ready-to-upload HD viral videos for Instagram, TikTok, and YouTube Shorts.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/2-1.webp"
  },
  {
    name: "Premium E-books Bundle",
    worth: "₹1,999",
    desc: "In-depth PDF guides on digital marketing, copywriting, freelancing, and monetization.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/4-1.webp"
  },
  {
    name: "ChatGPT Prompts Collection",
    worth: "₹999",
    desc: "Pro prompts for writing email copies, scriptwriting, and automating workflows.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/3-1.webp"
  },
  {
    name: "Instagram Growth Masterclass",
    worth: "₹2,999",
    desc: "Exclusive video courses on Instagram virality, reel algorithms, and organic sales.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/8-1.webp"
  },
  {
    name: "Fire Spark Overlays",
    worth: "₹999",
    desc: "Cinematic embers, flame sparks, slow motion sparks, and burning particle overlays.",
    img: "https://wbveb.idigitalcampus.com/wp-content/uploads/2025/02/10.webp"
  }
];

function CountdownTimer() {
  const [t, setT] = useState({ h: 5, m: 59, s: 59 });
  useEffect(() => {
    const id = setInterval(() => setT(p => {
      if (p.s > 0) return { ...p, s: p.s - 1 };
      if (p.m > 0) return { ...p, m: p.m - 1, s: 59 };
      if (p.h > 0) return { h: p.h - 1, m: 59, s: 59 };
      return { h: 5, m: 59, s: 59 };
    }), 1000);
    return () => clearInterval(id);
  }, []);
  const p2 = (n: number) => String(n).padStart(2, "0");
  return (
    <div className="flex justify-center gap-2 my-4">
      {[["HRS", p2(t.h)], ["MIN", p2(t.m)], ["SEC", p2(t.s)]].map(([l, v]) => (
        <div key={l} className="bg-red-650 text-white rounded-lg px-3.5 py-2 min-w-[70px] text-center shadow-lg border border-red-500">
          <div className="text-3xl font-black font-mono leading-none">{v}</div>
          <div className="text-[10px] font-bold opacity-90 mt-1">{l}</div>
        </div>
      ))}
    </div>
  );
}

function StarRating({ n }: { n: number }) {
  return <div className="flex gap-0.5 justify-center mb-2">{Array(n).fill(0).map((_, i) => <span key={i} className="text-yellow-400 text-lg">★</span>)}</div>;
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border rounded-2xl overflow-hidden mb-4 bg-white shadow-sm transition-all duration-200 ${open ? "border-green-400 ring-2 ring-green-50/50" : "border-gray-200 hover:border-gray-300"}`}>
      <button onClick={() => setOpen(!open)} className="w-full text-left px-6 py-4.5 font-extrabold text-gray-800 flex justify-between items-center hover:bg-gray-50/50" style={{ fontFamily: "Poppins, sans-serif" }}>
        <span className={`text-[15px] sm:text-base transition-colors ${open ? "text-green-700" : "text-gray-800"}`}>{q}</span>
        <span className={`text-2xl ml-4 shrink-0 font-bold transition-all duration-200 ${open ? "text-green-600 rotate-180" : "text-gray-400"}`}>{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="px-6 pb-5 text-gray-600 text-sm leading-relaxed border-t border-gray-50 pt-4 bg-slate-50/50 font-medium">
          {a}
        </div>
      )}
    </div>
  );
}

/* Product image card */
function ProductCard({ name, img, value, bg = "white" }: { name: string; img?: string; value?: string; bg?: string }) {
  const [imageError, setImageError] = useState(false);

  // Helper to extract brand initials and colors dynamically matching Adobe's branding
  const getInitialsAndColors = (appName: string) => {
    const clean = appName.replace("Adobe ", "").replace(" Studio", "").replace(" Pro", "").trim();
    let initials = "";
    const parts = clean.split(" ");
    
    if (parts.length >= 2) {
      initials = parts[0][0] + (parts[1][0] || "");
    } else if (clean.length >= 2) {
      initials = clean.substring(0, 2);
    } else {
      initials = clean;
    }
    // E.g., Ps, Ai, Pr, Ae, Ch, Ic, etc.
    initials = initials.charAt(0).toUpperCase() + initials.slice(1).toLowerCase();

    // Default dark slate background
    let bgGradient = "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)";
    let textColor = "#ffffff";
    let borderColor = "#ffffff20";

    const nameLower = appName.toLowerCase();
    if (nameLower.includes("photoshop")) {
      bgGradient = "linear-gradient(135deg, #001c3a 0%, #002d5c 100%)";
      textColor = "#31a8ff";
      borderColor = "#31a8ff50";
      initials = "Ps";
    } else if (nameLower.includes("illustrator")) {
      bgGradient = "linear-gradient(135deg, #331b00 0%, #542d00 100%)";
      textColor = "#ff9a00";
      borderColor = "#ff9a0050";
      initials = "Ai";
    } else if (nameLower.includes("premiere")) {
      bgGradient = "linear-gradient(135deg, #220033 0%, #3e005c 100%)";
      textColor = "#ea77ff";
      borderColor = "#ea77ff50";
      initials = "Pr";
    } else if (nameLower.includes("after effects")) {
      bgGradient = "linear-gradient(135deg, #1d0033 0%, #32005c 100%)";
      textColor = "#d291ff";
      borderColor = "#d291ff50";
      initials = "Ae";
    } else if (nameLower.includes("acrobat")) {
      bgGradient = "linear-gradient(135deg, #380000 0%, #5c0000 100%)";
      textColor = "#ff4d4d";
      borderColor = "#ff4d4d50";
      initials = "Ac";
    } else if (nameLower.includes("indesign")) {
      bgGradient = "linear-gradient(135deg, #330018 0%, #540028 100%)";
      textColor = "#ff55b8";
      borderColor = "#ff55b850";
      initials = "Id";
    } else if (nameLower.includes("lightroom")) {
      bgGradient = "linear-gradient(135deg, #002b33 0%, #004754 100%)";
      textColor = "#3be2ff";
      borderColor = "#3be2ff50";
      initials = "Lr";
    } else if (nameLower.includes("xd")) {
      bgGradient = "linear-gradient(135deg, #330026 0%, #54003f 100%)";
      textColor = "#ff61d5";
      borderColor = "#ff61d550";
      initials = "Xd";
    } else if (nameLower.includes("audition")) {
      bgGradient = "linear-gradient(135deg, #003328 0%, #005442 100%)";
      textColor = "#00e5ba";
      borderColor = "#00e5ba50";
      initials = "Au";
    } else if (nameLower.includes("animate")) {
      bgGradient = "linear-gradient(135deg, #3d0500 0%, #5c0800 100%)";
      textColor = "#ff4f38";
      borderColor = "#ff4f3850";
      initials = "An";
    } else if (nameLower.includes("dreamweaver")) {
      bgGradient = "linear-gradient(135deg, #2b3300 0%, #455400 100%)";
      textColor = "#d4ff00";
      borderColor = "#d4ff0050";
      initials = "Dw";
    } else if (nameLower.includes("media encoder")) {
      bgGradient = "linear-gradient(135deg, #1c002b 0%, #2f0047 100%)";
      textColor = "#bc6eff";
      borderColor = "#bc6eff50";
      initials = "Me";
    } else if (nameLower.includes("character animator")) {
      bgGradient = "linear-gradient(135deg, #0b1a3d 0%, #112d69 100%)";
      textColor = "#5eb3ff";
      borderColor = "#5eb3ff50";
      initials = "Ch";
    } else if (nameLower.includes("incopy")) {
      bgGradient = "linear-gradient(135deg, #380720 0%, #5c0d35 100%)";
      textColor = "#ff57b2";
      borderColor = "#ff57b250";
      initials = "Ic";
    } else if (nameLower.includes("substance")) {
      bgGradient = "linear-gradient(135deg, #0b221e 0%, #153f38 100%)";
      textColor = "#3be5c4";
      borderColor = "#3be5c450";
      initials = "Sa";
    } else if (nameLower.includes("bridge")) {
      bgGradient = "linear-gradient(135deg, #332400 0%, #543b00 100%)";
      textColor = "#ffbe1a";
      borderColor = "#ffbe1a50";
      initials = "Br";
    } else if (nameLower.includes("resolve")) {
      bgGradient = "linear-gradient(135deg, #0a0f1d 0%, #111a2e 100%)";
      textColor = "#3b82f6";
      borderColor = "#3b82f640";
      initials = "Dr";
    } else if (nameLower.includes("elements")) {
      bgGradient = "linear-gradient(135deg, #1c002b 0%, #2f0047 100%)";
      textColor = "#bc6eff";
      borderColor = "#bc6eff40";
      initials = "El";
    } else if (nameLower.includes("winrar")) {
      bgGradient = "linear-gradient(135deg, #1b3d1b 0%, #2e692e 100%)";
      textColor = "#a3ffa3";
      borderColor = "#a3ffa340";
      initials = "Wr";
    } else if (nameLower.includes("vhs")) {
      bgGradient = "linear-gradient(135deg, #1a1a1a 0%, #333333 100%)";
      textColor = "#ffffff";
      borderColor = "#ffffff30";
      initials = "Vs";
    }

    return { initials, bgGradient, textColor, borderColor };
  };

  const { initials, bgGradient, textColor, borderColor } = getInitialsAndColors(name);

  return (
    <div className="flex flex-col items-center text-center rounded-xl overflow-hidden border border-gray-150 transition-transform duration-200 hover:-translate-y-0.5" style={{ background: bg, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -1px rgba(0,0,0,0.04)", padding: 8 }}>
      <div className="w-full aspect-square relative overflow-hidden rounded-lg bg-gray-50 flex items-center justify-center">
        {img && !imageError ? (
          <img 
            src={img} 
            alt={name} 
            className="w-full h-full object-contain p-2" 
            onError={() => setImageError(true)} 
          />
        ) : (
          <div 
            className="w-16 h-16 rounded-xl flex items-center justify-center border font-black text-2xl tracking-tight select-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"
            style={{ 
              background: bgGradient, 
              color: textColor, 
              borderColor: borderColor
            }}
          >
            {initials}
          </div>
        )}
      </div>
      <p className="text-gray-900 font-extrabold mt-2 text-xs sm:text-sm leading-tight px-1" style={{ fontFamily: "Poppins, sans-serif" }}>{name}</p>
      {value && <span className="text-[11px] text-green-600 font-extrabold mt-1">Worth {value}</span>}
    </div>
  );
}

export default function SoftwareFunnelPage({ params }: { params?: { slug?: string[] } }) {
  const [products, setProducts] = useState<any[]>([]);
  const [banner, setBanner] = useState<any>(null);
  const [adobeProduct, setAdobeProduct] = useState<any>(null);

  // Popup countdown timer logic
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 mins in seconds
  const [showPopup, setShowPopup] = useState(false);
  const [matchedProduct, setMatchedProduct] = useState<any>(null);
  const [isPopupHovered, setIsPopupHovered] = useState(false);
  
  const [isBonusClaimed, setIsBonusClaimed] = useState(false);

  // Promo modal & SAVE50 coupon code state
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [copiedCoupon, setCopiedCoupon] = useState(false);

  // 30-second timer for 50% OFF promo modal popup (same as /editing page)
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPromoModal(true);
    }, 30000);
    return () => clearTimeout(timer);
  }, []);

  const handleCopyCoupon = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText("SAVE50");
    }
    try {
      sessionStorage.setItem("copiedCouponCode", "SAVE50");
    } catch {}
    setCopiedCoupon(true);
    setTimeout(() => {
      setCopiedCoupon(false);
      setShowPromoModal(false);
    }, 1800);
  };

  const router = useRouter();
  const { addToCart, clearCart } = useCart();

  useEffect(() => {
    const productSlug = params?.slug?.[0];
    // Fetch products
    fetch("/api/products?all=1").then(r => r.json()).then(d => {
      const list = Array.isArray(d) ? d : (d.products || []);
      const found = list.find((p: any) => p.title && p.title.toLowerCase().includes("adobe all"));
      if (found) {
        setAdobeProduct(found);
      }
      setProducts(list.filter((p: any) => p.title && !p.title.toLowerCase().includes("adobe all")));

      // Dynamic slug matching for free bonus popup
      if (productSlug) {
        const matched = list.find((p: any) => p.slug === productSlug || p.id === productSlug);
        if (matched) {
          setMatchedProduct(matched);
        }
      }
    }).catch(() => {});

    // Fetch banners
    fetch("/api/banners").then(r => r.json()).then(d => {
      if (Array.isArray(d) && d.length > 0) {
        setBanner(d[0]); // Use first active banner
      }
    }).catch(() => {});
  }, [params]);

  // Initialize claims from localStorage
  useEffect(() => {
    if (matchedProduct) {
      const claimed = localStorage.getItem(`claimed_bonus_${matchedProduct.id}`);
      if (claimed === 'true') {
        setIsBonusClaimed(true);
      }
    }
  }, [matchedProduct]);

  // Open dynamic popup after exactly 30 seconds if a matched product is found and has not been claimed yet
  useEffect(() => {
    if (!matchedProduct || isBonusClaimed) return;
    const delayTimer = setTimeout(() => {
      setShowPopup(true);
    }, 30000);
    return () => clearTimeout(delayTimer);
  }, [matchedProduct, isBonusClaimed]);

  useEffect(() => {
    if (!showPopup) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [showPopup]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleBuyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Find the Adobe product or fallback to a structured one
    const targetProduct = adobeProduct || {
      id: "adobe-all-premium-software-bundle-2026-for-windows-mac-420947", // Fallback ID
      title: "Adobe All Premium Software Bundle 2026",
      price: 249,
      category: "software",
      imageUrl: "/hero-bundle.png",
      downloadUrl: "[]",
      isActive: true,
      tags: ["adobe", "bundle", "lifetime"]
    };

    // Track AddToCart event in Meta Pixel
    trackAddToCart({
      content_name: targetProduct.title,
      content_ids: [targetProduct.id],
      contents: [{ id: targetProduct.id, quantity: 1, item_price: targetProduct.price }],
      value: targetProduct.price,
    });

    // Clear cart and add Adobe product
    clearCart();
    addToCart(targetProduct);
    
    // Redirect to checkout
    router.push("/checkout");
  };

  const handleClaimClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    const targetProduct = adobeProduct || {
      id: "adobe-all-premium-software-bundle-2026-for-windows-mac-420947",
      title: "Adobe All Premium Software Bundle 2026",
      price: 249,
      category: "software",
      imageUrl: "/hero-bundle.png",
      downloadUrl: "[]",
      isActive: true,
      tags: ["adobe", "bundle", "lifetime"]
    };

    // Make the matched product free inside the cart
    const freeProduct = {
      ...matchedProduct,
      price: 0,
      title: `${matchedProduct.title} (FREE Bonus)`
    };

    // Add both items to the cart
    clearCart();
    addToCart(targetProduct);
    addToCart(freeProduct);

    // Track AddToCart event with both products for Facebook matching
    trackAddToCart({
      content_name: `${targetProduct.title} + ${freeProduct.title}`,
      content_ids: [targetProduct.id, freeProduct.id],
      contents: [
        { id: targetProduct.id, quantity: 1, item_price: targetProduct.price },
        { id: freeProduct.id, quantity: 1, item_price: 0 }
      ],
      value: targetProduct.price,
    });

    // Notify user they claimed it successfully
    toast({
      title: "🎁 Free Bonus Claimed!",
      description: `"${matchedProduct.title}" has been added to your order for free. Continue reading the landing page below!`,
    });

    // Mark as claimed in state & localStorage
    setIsBonusClaimed(true);
    localStorage.setItem(`claimed_bonus_${matchedProduct.id}`, 'true');

    // Close the popup modal but keep user on landing page
    setShowPopup(false);
  };

  return (
    <>
      <div style={{ fontFamily: "Poppins, sans-serif" }}>

        {/* ── 1. TOP URGENCY BAR (High visibility green positive alert) ── */}
        <div style={{ backgroundColor: "#05FF00" }} className="text-black text-center py-2.5 px-4 font-black text-sm sm:text-base sticky top-0 z-50 shadow-md">
          🔥 Adobe All Premium Software Bundle 2026! &nbsp;|&nbsp; Launch Sale: <strong>90% OFF</strong> &nbsp;|&nbsp;
          <a href="/checkout" onClick={handleBuyClick} className="underline font-black hover:opacity-80 transition-opacity ml-1">Grab Now for ₹{adobeProduct ? adobeProduct.price : 249} Only →</a>
        </div>

        {/* ── 2. HERO (Premium Dark Blue Theme) ── */}
        <section className="bg-[#00114E] text-white text-center py-16 px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/40" />
          {/* Glowing bright orbs */}
          <div className="absolute" style={{ width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(175,255,61,0.2) 0%, rgba(255,255,255,0) 70%)", top: -200, left: -100, pointerEvents: "none" }} />
          <div className="absolute" style={{ width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(5,255,0,0.15) 0%, rgba(255,255,255,0) 70%)", bottom: -200, right: -100, pointerEvents: "none" }} />
          <div className="relative z-10 max-w-5xl mx-auto">
            <span className="bg-green-600 text-white text-xs sm:text-sm font-black px-4.5 py-2 rounded-full uppercase tracking-wider shadow-md mb-5 inline-block">
              ⚡ Pre-Activated (Lifetime Access) Included
            </span>
            <h1 className="leading-tight text-white mb-6 font-black" style={{ fontSize: "clamp(28px,4.8vw,48px)" }}>
              Stop Paying Expensive Monthly Subscriptions! Get The <span className="text-[#FFA800]">Ultimate Creative Software Bundle</span> With{" "}
              <span className="bg-white text-black shadow-[6px_6px_0_0_#05FF00] px-2.5 rounded-sm inline-block">&nbsp;Adobe All Premium 2026!&nbsp;</span>
            </h1>
            <p className="font-extrabold underline mb-8" style={{ fontSize: "clamp(15px,2.4vw,26px)", color: "#00FFFF" }}>
              All 20+ Premium Creative Apps — Windows & Mac — Pre-Activated for Lifetime!
            </p>
            {/* Adobe Bundle Image */}
            <div className="mx-auto mb-10 rounded-2xl overflow-hidden shadow-2xl" style={{ maxWidth: 1000 }}>
               <img 
                 src="/hero-bundle.png" 
                 alt="All Adobe Software Bundle" 
                 fetchPriority="high" 
                 loading="eager" 
                 className="w-full h-auto" 
               />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <button onClick={handleBuyClick} className="hover:-translate-y-0.5 active:translate-y-0 hover:shadow-[0px_10px_25px_rgba(5,255,0,0.4)] transition-all duration-200" style={{ ...BTN_STYLE, fontSize: "clamp(18px,2.8vw,32px)", padding: "16px 48px", width: "min(90%,580px)" }}>
                🚀 Get Instant Access At Just ₹{adobeProduct ? adobeProduct.price : 249}/- 🚀
              </button>
            </div>
            <p className="text-white/70 text-xs sm:text-sm mt-5 font-bold flex items-center justify-center flex-wrap gap-x-4 gap-y-1.5">
              <span>✅ Instant Email Delivery</span>
              <span>•</span>
              <span>✅ Pre-Activated (Pre-patched)</span>
              <span>•</span>
              <span>✅ Windows & Mac Support</span>
              <span>•</span>
              <span>✅ Lifetime Access</span>
            </p>
          </div>
        </section>

        {/* ── 3. TRUST STATS (Alternating White background) ── */}
        <section className="bg-white py-10 px-4 border-b border-gray-150">
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
            {[["3,929+", "Happy Customers"], ["20+", "Creative Software Tools"], ["24x7", "WhatsApp Support"], ["₹" + (adobeProduct ? adobeProduct.price : 249), "One-Time Price"]].map(([n, l]) => (
              <div key={l} className="text-center py-5 px-3 bg-gray-50 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-2xl md:text-3xl font-black text-[#00114E]">{n}</div>
                <div className="text-gray-700 text-xs sm:text-sm font-extrabold mt-1">{l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 4. WHAT YOU GET (Adobe CC Bundle 2026 Grid) ── */}
        <section className="bg-white py-14 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-center font-extrabold text-[#00114E] text-lg sm:text-xl mb-1.5" style={{ fontFamily: "Poppins, sans-serif" }}>Here's What All You'll Get…</h2>
            <h3 className="text-center font-black text-3xl md:text-4xl text-gray-900 mb-8" style={{ fontFamily: "Poppins, sans-serif" }}>Adobe CC Bundle 2026</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {INCLUDED_SOFTWARE.map((s: any) => (
                <ProductCard key={s.name} name={s.name} img={s.logo} bg="white" />
              ))}
            </div>
            <div className="flex justify-center mt-12">
              <button onClick={handleBuyClick} className="hover:-translate-y-0.5 hover:shadow-[0px_10px_20px_rgba(0,0,0,0.3)] transition-all duration-200" style={{ ...BTN_STYLE, fontSize: "clamp(16px,2.5vw,28px)", padding: "14px 44px", width: "min(85%,520px)" }}>
                🚀 Get Instant Access At Just ₹{adobeProduct ? adobeProduct.price : 249}/- 🚀
              </button>
            </div>
          </div>
        </section>

        {/* ── 10. PRICING / BUY (High Converting White Theme) ── */}
        <section id="buy" className="bg-white py-16 px-4 border-t border-gray-150 text-center">
          <div className="max-w-4xl mx-auto flex flex-col items-center">
            
            {/* Main Headline */}
            <h2 className="font-black text-gray-900 leading-tight mb-3" style={{ fontSize: "clamp(26px,4.5vw,42px)", fontFamily: "Poppins, sans-serif" }}>
              Download, Install And Thanks Me Later As You'll Find It <span className="text-[#FF0000] block sm:inline">Value For Time And Money</span>
            </h2>
            
            {/* Sub-headline */}
            <p className="text-gray-600 text-sm sm:text-base font-extrabold mb-8 max-w-3xl" style={{ fontFamily: "Poppins, sans-serif" }}>
              Get Lifetime Access To Done-For-You Premium Adobe CC Bundle & 8 Mega Bonuses With High-Speed Direct Downloads
            </p>

            {/* Offer Tier Details */}
            <div className="flex flex-col items-center gap-1.5 mb-6 text-gray-900" style={{ fontFamily: "Poppins, sans-serif" }}>
              <div className="text-lg sm:text-xl font-black uppercase tracking-wide text-gray-900">
                Launch Offer : <span className="text-green-600">90% OFF</span>
              </div>
              <div className="text-base sm:text-lg font-bold text-gray-400 line-through">
                General Price : ₹{adobeProduct?.originalPrice ? adobeProduct.originalPrice.toLocaleString('en-IN') : "24,651"}/-
              </div>
              <div className="text-base sm:text-lg font-bold text-red-500 line-through">
                Offer Price : ₹{adobeProduct?.originalPrice ? Math.round(adobeProduct.originalPrice * 0.16).toLocaleString('en-IN') : "3,999"}/-
              </div>
              <div className="font-black text-[#22c55e] tracking-tight mt-2 animate-pulse" style={{ fontSize: "clamp(38px,7vw,60px)", lineHeight: 1.1 }}>
                Today Only : ₹{adobeProduct ? adobeProduct.price : 249}/-
              </div>
            </div>

            {/* Dashed Rating Badge */}
            <div className="inline-flex items-center gap-2 border border-dashed border-gray-300 rounded-xl px-4 py-2 bg-gray-50 mb-4 shadow-sm">
              <span className="text-yellow-400 text-sm sm:text-base flex select-none">⭐⭐⭐⭐⭐</span>
              <span className="text-gray-700 font-extrabold text-xs sm:text-sm">Rating: 4.9 | 3426 Reviews</span>
            </div>

            {/* Special SAVE50 Coupon Box */}
            <div className="w-full max-w-md my-4 p-4 bg-amber-500/10 border-2 border-dashed border-amber-400/60 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm mx-auto">
              <div className="flex items-center gap-2.5 text-left">
                <Tag className="h-5 w-5 text-amber-500 shrink-0" />
                <div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Special Coupon Code (50% OFF)</span>
                  <span className="text-xl font-mono font-black text-amber-600 tracking-wider">SAVE50</span>
                </div>
              </div>
              <button
                onClick={handleCopyCoupon}
                className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shrink-0 ${
                  copiedCoupon
                    ? "bg-emerald-500 text-white shadow-md"
                    : "bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 shadow-sm hover:scale-105"
                }`}
              >
                {copiedCoupon ? (
                  <>
                    <Check className="h-4 w-4" /> Code Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" /> Copy Coupon Code
                  </>
                )}
              </button>
            </div>

            {/* Giant Green CTA Button */}
            <button 
              onClick={handleBuyClick} 
              className="w-full max-w-xl bg-[#00c853] hover:bg-[#00b24a] text-white font-black text-lg sm:text-2xl py-4 px-6 rounded-2xl shadow-[0_8px_25px_rgba(0,200,83,0.35)] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 text-center uppercase tracking-wide animate-shake-cta"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Yes, I Want The Adobe All Premium Bundle
            </button>

            {/* Urgency */}
            <p className="text-gray-500 text-xs sm:text-sm font-extrabold mt-4 flex items-center justify-center gap-1">
              ⏰ Limited Time Offer Price Will Increase Soon
            </p>

            {/* Payment Logos Row */}
            <div className="flex flex-wrap items-center justify-center gap-5 mt-6 opacity-80 hover:opacity-100 transition-opacity">
              {/* WhatsApp Pay Icon */}
              <div className="flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm">
                <svg className="w-4 h-4 fill-[#25D366]" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.248 8.477 3.517 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.5-5.781-1.455L0 24zm6.335-1.662c1.596.947 3.551 1.448 5.616 1.449h.006c5.824 0 10.563-4.73 10.566-10.546a10.5 10.5 0 00-3.102-7.466 10.547 10.547 0 00-7.481-3.095c-5.824 0-10.564 4.73-10.567 10.546a10.43 10.43 0 001.488 5.168l-.974 3.559 3.644-.956z"/></svg>
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">WhatsApp</span>
              </div>
              {/* BHIM Pay Icon */}
              <div className="flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm">
                <span className="text-[10px] font-black text-gray-700 tracking-wider">BHIM</span>
                <span className="w-1.5 h-3.5 bg-orange-500 transform rotate-12 inline-block rounded-xs"></span>
                <span className="w-1.5 h-3.5 bg-green-500 transform rotate-12 inline-block rounded-xs"></span>
              </div>
              {/* Google Pay Icon */}
              <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm">
                <span className="text-[10px] font-black text-gray-600 tracking-wider flex items-center gap-1">
                  <span className="text-blue-500">G</span>
                  <span className="text-red-500">P</span>
                  <span className="text-yellow-500">a</span>
                  <span className="text-green-500">y</span>
                </span>
              </div>
              {/* PhonePe Icon */}
              <div className="flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm">
                <span className="w-3.5 h-3.5 bg-purple-600 rounded flex items-center justify-center text-white text-[8px] font-black">₹</span>
                <span className="text-[10px] font-black text-purple-700 tracking-wider">PhonePe</span>
              </div>
              {/* Amazon Pay Icon */}
              <div className="flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm">
                <span className="text-[10px] font-black text-gray-800 tracking-wider">amazon</span>
                <span className="text-[10px] font-black text-amber-500 tracking-wider">pay</span>
              </div>
              {/* Paytm Icon */}
              <div className="flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm">
                <span className="text-[10px] font-black text-blue-600 tracking-wider">paytm</span>
              </div>
            </div>

          </div>
        </section>

        {/* ── 11. GUARANTEE (Selective green details) ── */}
        <section className="bg-white py-12 px-4 border-b border-gray-150">
          <div className="max-w-2xl mx-auto text-center">
            <div className="text-6xl mb-4">🛡️</div>
            <h2 className="font-black text-2xl text-gray-800 mb-3">100% Installation Support Guaranteed</h2>
            <p className="text-gray-600 leading-relaxed font-bold text-sm sm:text-base">
              If you face any issues during installation or the software doesn't work as described, our expert support team will help you resolve it — for free. <span className="text-green-600">Your satisfaction is our No.1 priority.</span> We've helped 3,929+ customers successfully!
            </p>
          </div>
        </section>

        {/* ── 5. ALL SOFTWARE INCLUDED (Checklist with green highlights) ── */}
        <section className="py-14 px-4 bg-gray-55 border-y border-gray-200">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-center font-black text-2xl md:text-3xl text-gray-950 mb-2">Everything Included in One Bundle</h2>
            <p className="text-center text-gray-600 mb-8 text-sm sm:text-base font-medium">All 20+ creative tools and software programs — no monthly fees ever</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {INCLUDED_SOFTWARE.map((s: any) => (
                <div key={s.name} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-200 hover:border-green-400 transition-colors">
                  <img src={s.logo} alt={s.name} className="w-8 h-8 object-contain" />
                  <span className="font-extrabold text-gray-800 text-sm sm:text-base">{s.name}</span>
                  <span className="ml-auto text-green-700 font-extrabold text-xs sm:text-sm bg-green-50 px-3 py-1.5 rounded-full border border-green-200 flex items-center gap-1">
                    <span className="text-green-600">✓</span> Included
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 6. SPECIAL LAUNCH OFFER BONUSES (Clean Blue & White Theme) ── */}
        <section className="bg-slate-50 py-16 px-4 text-slate-800 border-y border-slate-200/80">
          <div className="max-w-6xl mx-auto relative z-10">
            {/* Main Header */}
            <div className="text-center mb-14">
              <span className="bg-[#00114E] text-white px-5 py-2.5 rounded-full text-xs sm:text-sm font-black uppercase tracking-wider shadow-sm">
                🎁 Special Launch Offer Bonuses
              </span>
              <h2 className="font-black mt-5 text-[#00114E]" style={{ fontSize: "clamp(26px,4vw,44px)", fontFamily: "Poppins, sans-serif", lineHeight: 1.25 }}>
                Get the Ultimate Graphic Designing & Video Editing Bundles For <span className="bg-[#0052FF] text-white px-4 py-1 rounded-xl inline-block shadow-md uppercase tracking-wider font-extrabold text-[0.85em] ml-2">100% FREE!</span>
              </h2>
              <p className="text-slate-600 max-w-3xl mx-auto mt-5 text-base sm:text-lg font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
                Get lifetime access to over <span className="text-[#0052FF] font-black">₹34,999</span> worth of premium editing presets, vector files, video courses, and templates included at no extra cost when you buy the Adobe CC Bundle today.
              </p>
            </div>

            {/* Spotlight Bonus 1: Graphic Designing Bundle (800+ GB Plan) - Premium White Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-10 mb-10 shadow-xl relative overflow-hidden text-slate-800">
              <div className="absolute top-0 right-0 bg-[#0052FF] text-white font-black px-6 py-2 rounded-bl-2xl text-xs uppercase tracking-wider z-10 border-l border-b border-slate-200">
                Bonus #1 Included
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">
                {/* Left: Box Mockup */}
                <div className="md:col-span-5 flex flex-col items-center">
                  <div className="relative group max-w-[310px] w-full">
                    <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl blur opacity-15 group-hover:opacity-25 transition duration-500"></div>
                    <div className="relative bg-white rounded-2xl overflow-hidden shadow-md border border-slate-200">
                      <img src="/images/graphic-bundle-675gb.png" alt="800+ GB Graphic Bundle Box Mockup" className="w-full h-auto object-cover transform hover:scale-102 transition-transform duration-300" />
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 mt-3 font-extrabold uppercase tracking-wider text-center">
                    800+ GB Plan Graphic Designing Bundle
                  </span>
                </div>

                {/* Right: Asset List */}
                <div className="md:col-span-7">
                  <h3 className="text-2xl sm:text-3xl font-black text-[#00114E] mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
                    Ultimate Graphic Designing Bundle (800+ GB Plan)
                  </h3>
                  
                  {/* Single Column List with Blue Tick Marks */}
                  <div className="grid grid-cols-1 gap-3.5 mb-6">
                    {[
                      "8,000+ Lightroom Presets",
                      "20+ Free Video Courses",
                      "500+ Resume / CV Templates",
                      "1,000+ PSD Graphic Data & PSD Cards",
                      "300+ Social Media Premium Templates",
                      "CorelDraw (CDR) Pack (Visiting Cards, letterheads)",
                      "Visiting Cards, Letterheads, Logos, etc.",
                      "Wedding Collection & Wedding Album Templates",
                      "HD Icons & Motion Graphics",
                      "Banners: Real Estate, Grocery, Education, Dental, Lubricant Oil & 100+ Restaurant Banners",
                      "Sales Scripts Pack (Email, LinkedIn, Instagram DM, Pitching Scripts)",
                      "Social Media Calendar, Digital V-Cards & Clip Art"
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3 text-sm sm:text-base text-slate-700 leading-relaxed">
                        <span className="text-[#0052FF] font-black shrink-0 text-lg">✓</span>
                        <span className="font-bold">{item}</span>
                      </div>
                    ))}
                  </div>

                  {/* Access Instructions */}
                  <div className="bg-blue-50/65 border border-blue-150 rounded-2xl p-4 flex gap-3 text-blue-950 shadow-sm">
                    <span className="text-2xl shrink-0">📍</span>
                    <div>
                      <p className="text-xs font-black uppercase text-blue-800 tracking-wider mb-1">
                        How You Will Access This:
                      </p>
                      <p className="text-xs sm:text-sm leading-relaxed text-blue-900/90 font-bold">
                        Payment complete hote hi Graphic Designing Bundle ka direct download link aapke <strong className="text-blue-800 font-black">Email Invoice</strong> par instant send ho jayega. Apne invoice me <strong className="text-blue-700 font-black">"Click here to Download Graphic Designing Bundle"</strong> button par click karke aap ise single click me download kar sakte hain.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Spotlight Bonus 2: Video Editing Bundle - Clean High-Contrast White Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-10 mb-10 shadow-xl relative overflow-hidden text-slate-800">
              <div className="absolute top-0 right-0 bg-[#0052FF] text-white font-black px-6 py-2 rounded-bl-2xl text-xs uppercase tracking-wider z-10 border-l border-b border-slate-200">
                Bonus #2 Included
              </div>
              
              <div className="text-center md:text-left mb-8">
                <span className="text-xs font-black text-[#0052FF] uppercase tracking-wider block mb-1">
                  Premium Bonus Addition
                </span>
                <h3 className="text-3xl font-black text-[#00114E]" style={{ fontFamily: "Poppins, sans-serif" }}>
                  Mega Video Editing Assets & Courses Bundle
                </h3>
                <p className="text-slate-600 text-sm sm:text-base mt-2 max-w-3xl font-semibold">
                  Stop looking for assets online. Get lifetime access to this ultimate toolkit featuring premium transitions, LUTs, FX presets, overlays, templates, SFX, and full masterclass courses!
                </p>
              </div>

              {/* Detailed Grid Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
                {VIDEO_BUNDLE_ITEMS.map((item) => (
                  <div key={item.name} className="bg-white border border-slate-250 rounded-2xl overflow-hidden flex flex-col shadow-sm hover:shadow-lg hover:border-[#0052FF] hover:-translate-y-0.5 transition-all duration-300">
                    <div className="w-full aspect-video bg-slate-100 overflow-hidden relative border-b border-slate-150">
                      <img src={item.img} alt={item.name} className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300" onError={(e) => { (e.target as HTMLImageElement).src = "https://grabnext.pages.dev/api/placeholder?w=400&h=250&text=" + encodeURIComponent(item.name); }} />
                      <div className="absolute top-2 right-2 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                        Worth {item.worth}
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-extrabold text-slate-800 text-base sm:text-[17px] leading-snug mb-1">{item.name}</h4>
                        <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-semibold">{item.desc}</p>
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs font-semibold">
                        <span className="text-[#0052FF] font-extrabold">✓ Included FREE</span>
                        <span className="text-slate-400 line-through font-bold">{item.worth}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Access Instructions for Video Bundle */}
              <div className="bg-blue-50/65 border border-blue-150 rounded-2xl p-4 flex gap-3 text-blue-950 shadow-sm">
                <span className="text-2xl shrink-0">📍</span>
                <div>
                  <p className="text-xs font-black uppercase text-blue-800 tracking-wider mb-1">
                    How You Will Access This:
                  </p>
                  <p className="text-xs sm:text-sm leading-relaxed text-blue-900/90 font-bold">
                    Video Editing Bundle ka direct high-speed download link post-checkout PDF invoice ke andar embedded hai. Payment complete karne ke baad aap ek single click me pure collection ko direct high-speed server se instant download kar sakte hain.
                  </p>
                </div>
              </div>
            </div>

            {/* 11 Mega Creative Collections - Clean White Background Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-10 mb-14 shadow-xl relative overflow-hidden text-slate-800">
              
              <div className="text-center mb-10 relative z-10">
                <h3 className="text-2xl sm:text-3xl font-black text-[#00114E]" style={{ fontFamily: "Poppins, sans-serif" }}>
                  11 Mega Creative Collections Included
                </h3>
                <p className="text-slate-500 text-sm sm:text-base mt-2 font-bold max-w-2xl mx-auto">
                  Get high-speed direct access to 11 ready-to-use creative asset libraries, premium templates, and graphics collections worth thousands to scale your design speed instantly!
                </p>
              </div>
              
              {/* Two Column Layout list with Blue Checkmarks and Images */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto relative z-10">
                {[
                  { num: "01", name: "Photoshop Collection", desc: "Premium brushes, actions, overlays, shapes, and tools.", img: "https://images.unsplash.com/photo-1572044162444-ad60f128bdea?w=400&q=80" },
                  { num: "02", name: "Corel Draw Collection", desc: "Vector CDR files, designs, visiting cards, and letterheads.", img: "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400&q=80" },
                  { num: "03", name: "Logos", desc: "10,000+ high-quality customizable logo templates.", img: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80" },
                  { num: "04", name: "Fonts", desc: "5,000+ premium localized and corporate font families.", img: "https://images.unsplash.com/photo-1541364983171-a8ba01e95cfc?w=400&q=80" },
                  { num: "05", name: "Mockups", desc: "T-shirts, packaging, apparel, and branding templates.", img: "https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=400&q=80" },
                  { num: "06", name: "PNG Images Collection", desc: "High-definition transparent assets for quick compositing.", img: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80" },
                  { num: "07", name: "Adobe Illustrator Collection", desc: "AI files, vectors, background patterns, and assets.", img: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&q=80" },
                  { num: "08", name: "Adobe Premiere Collection", desc: "Transitions, title cards, overlays, and color LUTs.", img: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400&q=80" },
                  { num: "09", name: "Adobe After Effects Collection", desc: "Video templates, intro animations, and sound effects.", img: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&q=80" },
                  { num: "10", name: "Adobe InDesign Collection", desc: "Books, magazines, resumes, and brochures layouts.", img: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80" },
                  { num: "11", name: "PowerPoint Collection", desc: "Slide decks, pitch templates, and business presentations.", img: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&q=80" }
                ].map((col) => (
                  <div key={col.num} className="bg-white border border-slate-200/90 rounded-2xl p-4 hover:border-[#0052FF] hover:shadow-md transition-all shadow-sm flex items-center gap-4 group">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-xl overflow-hidden border border-slate-150 group-hover:border-[#0052FF] transition-colors relative shadow-sm">
                      <img src={col.img} alt={col.name} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-black/[0.04] group-hover:bg-transparent transition-colors"></div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-extrabold text-slate-900 text-base sm:text-[17px] mb-1 flex items-center gap-2" style={{ fontFamily: "Poppins, sans-serif" }}>
                        <span className="text-[#0052FF] font-black text-lg">✓</span>
                        {col.name}
                      </h4>
                      <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-semibold">
                        {col.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>



            <div className="flex justify-center mt-12">
              <button onClick={handleBuyClick} className="animate-[animatedgradient_3s_ease_infinite_alternate] hover:-translate-y-0.5 hover:shadow-[0px_8px_15px_rgba(255,200,0,0.4)] transition-all duration-200" style={{ ...BTN_STYLE, fontSize: "clamp(16px,2.5vw,28px)", padding: "14px 44px", width: "min(85%,520px)" }}>
                🚀 Get All Bonuses FREE — Only ₹{adobeProduct ? adobeProduct.price : 249}/- 🚀
              </button>
            </div>
          </div>
        </section>

        {/* ── 7. WHY CHOOSE GRABNEXT ── */}
        <section className="bg-white py-14 px-4 border-t border-gray-150">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-center font-black text-3xl md:text-4xl text-[#00114E] mb-2">Why Choose Grabnext?</h2>
            <p className="text-center text-gray-500 mb-8 font-medium">India's most trusted digital software store — 3,929+ satisfied customers</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {FEATURES.map(f => (
                <div key={f.title} className="text-center p-5 bg-white rounded-2xl border border-gray-150 shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-4xl mb-3">{f.icon}</div>
                  <div className="font-extrabold text-gray-800 text-sm mb-1">{f.title}</div>
                  <div className="text-gray-500 text-xs leading-relaxed">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 8. COMPARISON TABLE (Green highlights for victory) ── */}
        <section className="py-14 px-4 bg-gray-50 border-t border-gray-200">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-center font-black text-3xl text-gray-900 mb-8">Grabnext vs. Adobe Subscription</h2>
            <div className="w-full max-w-2xl mx-auto overflow-x-auto rounded-2xl shadow-xl border border-gray-200">
              <table className="w-full border-collapse" style={{ display: "table" }}>
                <thead>
                  <tr className="bg-[#00114E] text-white">
                    <th className="py-4 px-4 text-left font-extrabold text-xs sm:text-sm">Feature</th>
                    <th className="py-4 px-4 text-center font-black text-[#05FF00] text-xs sm:text-sm bg-[#000f45]">Grabnext Bundle</th>
                    <th className="py-4 px-4 text-center font-extrabold text-red-300 text-xs sm:text-sm">Adobe Official</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {[
                    ["Price", `₹${adobeProduct ? adobeProduct.price : 249} Once`, "₹5,500/mo"],
                    ["All 20+ Apps & Packs", "✅ Yes", "✅ Yes"],
                    ["Pre-Activated", "✅ Instant", "❌ Sub Required"],
                    ["Lifetime Access", "✅ Lifetime", "❌ Monthly Fee"],
                    ["Windows & Mac", "✅ Both", "✅ Both"],
                    ["M1/M2/M3/M4 Support", "✅ Yes", "✅ Yes"],
                    ["Instant Download", "✅ Instant", "⏳ Slow Install"],
                    ["Total Cost/Year", `₹${adobeProduct ? adobeProduct.price : 249} (Total)`, "₹66,000+/yr"],
                  ].map(([feat, g, a], i) => (
                    <tr key={feat} className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"} border-t border-gray-150 hover:bg-green-50/10 transition-colors`}>
                      <td className="py-3 px-4 text-gray-800 font-extrabold text-xs sm:text-sm">{feat}</td>
                      <td className="py-3 px-4 text-center text-green-700 font-black text-xs sm:text-sm bg-green-50/30 border-x border-green-100">{g}</td>
                      <td className="py-3 px-4 text-center text-red-500 font-bold text-xs sm:text-sm">{a}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── 9. TESTIMONIALS (Moved below comparison) ── */}
        <section className="bg-white py-14 px-4 border-t border-gray-150">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-center font-black text-3xl md:text-4xl text-[#00114E] mb-8">⭐ What Our Customers Say</h2>
            <div className="grid md:grid-cols-2 gap-5">
              {TESTIMONIALS.map(t => (
                <div key={t.name} className="rounded-2xl p-6 border border-gray-150 shadow-md bg-gray-50 hover:shadow-lg transition-all">
                  <StarRating n={t.stars} />
                  <p className="text-gray-700 italic text-sm leading-relaxed mb-4 font-medium">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#00114E] flex items-center justify-center text-white font-black">{t.name[0]}</div>
                    <div>
                      <div className="font-extrabold text-gray-800 text-sm">{t.name}</div>
                      <div className="text-gray-500 text-xs font-bold">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 12. FAQ ── */}
        <section className="bg-gray-50 py-14 px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-center font-black text-3xl text-gray-900 mb-8" style={{ fontFamily: "Poppins, sans-serif" }}>
              <span className="text-green-600">Frequently</span> Asked Questions
            </h2>
            {FAQS.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} />)}
          </div>
        </section>

        {/* ── 13. PRE-FOOTER CTA ── */}
        <section className="bg-[#00114E] text-white text-center py-16 px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-black mb-4" style={{ fontSize: "clamp(22px,4vw,38px)" }}>Don't Miss This Limited Time Offer!</h2>
            <p className="text-[#00FFFF] mb-6 text-lg sm:text-xl font-bold">Join 3,929+ professionals who already own the ultimate Adobe bundle.</p>
            <button onClick={handleBuyClick} className="inline-block animate-[animatedgradient_3s_ease_infinite_alternate] hover:-translate-y-0.5 hover:shadow-[0px_8px_15px_rgba(255,200,0,0.5)] transition-all duration-200" style={{ ...BTN_STYLE, fontSize: "clamp(16px,3vw,30px)", padding: "14px 44px" }}>
              🚀 GET INSTANT ACCESS — ONLY ₹{adobeProduct ? adobeProduct.price : 249}/- 🚀
            </button>
            <p className="text-white/60 text-xs sm:text-sm mt-4 font-bold">⚡ Instant Access &nbsp;|&nbsp; ✅ Pre-Activated &nbsp;|&nbsp; 🍎 Mac & 🪟 Windows</p>
          </div>
        </section>

        {/* ── 14. FOOTER ── */}
        <footer className="bg-gray-900 text-gray-400 text-center py-8 px-4 text-xs">
          <div className="max-w-3xl mx-auto">
            <p className="mb-3 opacity-60">Disclaimer: Results may vary. This is a digital product. Please ensure your system meets the minimum requirements before purchasing. All trademarks belong to their respective owners.</p>
            <div className="flex flex-wrap justify-center gap-4 mb-3 text-gray-500 font-extrabold">
              <a href="/privacy" className="hover:text-white">Privacy Policy</a>
              <a href="/terms" className="hover:text-white">Terms of Service</a>
              <a href="/refund" className="hover:text-white">Refund Policy</a>
              <a href="/contact" className="hover:text-white">Contact Us</a>
            </div>
            <p>© {new Date().getFullYear()} Grabnext. All rights reserved. | Payments secured by XPay 🔒</p>
          </div>
        </footer>

        {/* ── 15. CONVERSION WIDGETS & PLUGINS ── */}
        <StickyCheckoutBar 
          onBuy={handleBuyClick} 
          price={adobeProduct ? adobeProduct.price : 249} 
          originalPrice={adobeProduct ? (adobeProduct.originalPrice || 2499) : 2499}
        />
        <WhatsAppWidget />

        {/* Floating Side Claimed Bonus Widget */}
        {isBonusClaimed && matchedProduct && (
          <div className="fixed bottom-24 left-6 z-[98] max-w-[280px] sm:max-w-xs bg-slate-950/95 border border-slate-800 rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.8)] backdrop-blur-sm text-left flex gap-3 items-start animate-slide-up">
            {/* Product Thumbnail */}
            <div className="w-12 h-12 bg-white/5 rounded-xl border border-white/10 shrink-0 flex items-center justify-center overflow-hidden p-1">
              <img src={matchedProduct.imageUrl || "/placeholder.svg"} alt={matchedProduct.title} className="max-w-full max-h-full object-contain" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[#05FF00] text-xs">🎁</span>
                <span className="text-[10px] font-black text-green-400 uppercase tracking-wider">Free Bonus Claimed!</span>
              </div>
              <h4 className="font-extrabold text-xs text-white truncate mb-1" title={matchedProduct.title}>
                {matchedProduct.title}
              </h4>
              <p className="text-slate-400 text-[10px] leading-normal font-semibold mb-2">
                To claim this offer, buy our premium bundle.
              </p>
              <button 
                onClick={handleBuyClick}
                className="w-full bg-[#00c853] hover:bg-[#00b24a] text-white text-[10px] font-black py-1.5 px-3 rounded-lg uppercase tracking-wider text-center transition-colors"
              >
                Complete Order →
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Free Bonus Popup Modal */}
        {showPopup && matchedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out_forwards]">
            <div 
              className="flex items-stretch gap-0 relative max-w-3xl w-full justify-center transition-all duration-300"
              onMouseEnter={() => setIsPopupHovered(true)}
              onMouseLeave={() => setIsPopupHovered(false)}
            >
              {/* Main Popup Card */}
              <div className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-sm w-full border border-slate-100 flex flex-col text-center relative p-6 sm:p-7.5 animate-[scaleIn_0.3s_cubic-bezier(0.34,1.56,0.64,1)_forwards] z-20 transition-all duration-300">
                
                {/* Close Button */}
                <button 
                  onClick={() => setShowPopup(false)} 
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-655 transition-colors w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center font-bold text-sm"
                  aria-label="Close"
                >
                  ✕
                </button>

                {/* Red Bold FREE Title */}
                <div className="text-4xl font-black text-red-500 tracking-tight leading-none mb-1">FREE</div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Exclusive Premium Bonus</div>

                {/* Product Preview Image Box */}
                <div className="w-full aspect-video sm:aspect-[4/3] max-h-40 rounded-2xl bg-gray-50 flex items-center justify-center p-2 mb-4 border border-slate-150 relative shadow-sm">
                  <img 
                    src={matchedProduct.imageUrl || "/placeholder.svg"} 
                    alt={matchedProduct.title} 
                    className="max-w-full max-h-full object-contain"
                  />
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded shadow">
                    WORTH ₹{matchedProduct.price || 499}
                  </div>
                </div>

                {/* Headline */}
                <h2 className="text-[17px] font-black text-slate-900 leading-snug mb-1" style={{ fontFamily: "Poppins, sans-serif" }}>
                  {matchedProduct.title}
                </h2>

                {/* Product Short Description */}
                {matchedProduct.description && (
                  <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 max-w-sm mx-auto mb-4 font-semibold">
                    {matchedProduct.description.replace(/<[^>]*>/g, '')}
                  </p>
                )}

                {/* Countdown Timer */}
                <div className="flex items-center justify-center gap-1.5 bg-red-50 border border-red-100 rounded-full px-3.5 py-1 text-xs font-black text-red-600 mb-5 w-fit mx-auto">
                  <span>⏰ Offer Expires In:</span>
                  <span className="font-mono text-sm">{formatTime(timeLeft)}</span>
                </div>

                {/* Claim Button */}
                <button 
                  onClick={handleClaimClick} 
                  className="w-full bg-[#00c853] hover:bg-[#00b24a] text-white font-black text-base py-3 px-6 rounded-2xl shadow-[0_5px_15px_rgba(0,200,83,0.25)] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 text-center uppercase tracking-wide animate-shake-cta"
                >
                  Claim My Free Bonus
                </button>

                <button 
                  onClick={() => setShowPopup(false)} 
                  className="text-xs text-gray-400 hover:text-gray-655 font-extrabold mt-3.5 uppercase tracking-wider underline transition-colors"
                >
                  No, I don't want this free bonus
                </button>

              </div>

              {/* Side Hover Bar / Drawer showing the full description */}
              {matchedProduct.description && (
                <div 
                  className={`hidden sm:flex flex-col bg-slate-950 text-white rounded-r-3xl border-y border-r border-slate-800 p-6 w-80 text-left shadow-2xl transition-all duration-500 ease-in-out z-10 ${
                    isPopupHovered 
                      ? "translate-x-0 opacity-100 max-w-xs pointer-events-auto" 
                      : "-translate-x-12 opacity-0 max-w-0 pointer-events-none"
                  }`}
                  style={{
                    marginLeft: "-16px",
                    transitionProperty: "transform, opacity, max-width",
                  }}
                >
                  <div className="flex flex-col h-full justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[#05FF00] font-black text-lg">✨</span>
                        <h3 className="font-black text-sm uppercase tracking-wider text-slate-200" style={{ fontFamily: "Poppins, sans-serif" }}>
                          Full Product Details
                        </h3>
                      </div>
                      <div 
                        className="popup-desc-container text-slate-300 text-xs sm:text-[13px] leading-relaxed overflow-y-auto max-h-[320px] pr-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent font-medium"
                        dangerouslySetInnerHTML={{ __html: matchedProduct.description }}
                      />
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col gap-1 text-[11px] text-slate-400 font-semibold">
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className="text-green-500 font-extrabold">Pre-Activated</span>
                      </div>
                      <div className="flex justify-between">
                        <span>License:</span>
                        <span className="text-slate-300">Lifetime Access</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* 50% OFF Secret Promo Modal (same as /editing landing page) */}
        {showPromoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center relative shadow-2xl overflow-hidden">
              {/* Glowing background accent */}
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-yellow-500/20 rounded-full blur-3xl pointer-events-none" />

              {/* Close Button */}
              <button
                onClick={() => setShowPromoModal(false)}
                className="absolute top-4 right-4 h-8 w-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors z-10"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Header Badge */}
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">
                <Gift className="h-3.5 w-3.5" /> Special Exclusive Gift
              </div>

              {/* Main Headline */}
              <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                Wait! Get <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500">50% EXTRA OFF</span>
              </h3>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                Use this secret coupon code to get 50% discount instantly at checkout!
              </p>

              {/* Coupon Box */}
              <div className="my-5 p-4 bg-slate-950/80 border-2 border-dashed border-amber-400/60 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-inner">
                <div className="flex items-center gap-2.5 text-left w-full sm:w-auto">
                  <Tag className="h-5 w-5 text-amber-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Coupon Code</span>
                    <span className="text-xl font-mono font-black text-amber-300 tracking-wider">SAVE50</span>
                  </div>
                </div>
                <button
                  onClick={handleCopyCoupon}
                  className={`w-full sm:w-auto px-5 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shrink-0 ${
                    copiedCoupon
                      ? "bg-emerald-500 text-white shadow-lg scale-105"
                      : "bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 shadow-md hover:scale-105"
                  }`}
                >
                  {copiedCoupon ? (
                    <>
                      <Check className="h-4 w-4" /> Code Copied & Saved!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" /> Copy Coupon Code
                    </>
                  )}
                </button>
              </div>

              {copiedCoupon ? (
                <p className="text-xs text-emerald-400 font-semibold mb-3 animate-pulse">
                  ✓ 50% OFF coupon code saved! It will automatically apply when you decide to buy.
                </p>
              ) : (
                <p className="text-[11px] text-slate-400 mb-3">
                  Click "Copy Coupon Code" to save 50% discount for when you're ready to order.
                </p>
              )}

              {/* Action Buttons */}
              <div className="pt-1">
                <button
                  onClick={() => setShowPromoModal(false)}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700"
                >
                  Continue Browsing Page
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CSS Animations for sticky bar, shaking button, and pulsing WhatsApp widget */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes slideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
          .animate-slide-up {
            animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          @keyframes pulseGlow {
            0%, 100% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.5); }
            50% { box-shadow: 0 0 0 10px rgba(37, 211, 102, 0); }
          }
          .animate-pulse-glow {
            animation: pulseGlow 2s infinite;
          }
          @keyframes shakeCTA {
            0%, 100% { transform: scale(1); }
            10%, 20% { transform: scale(0.96) rotate(-1deg); }
            30%, 50%, 70%, 90% { transform: scale(1.04) rotate(1.5deg); }
            40%, 60%, 80% { transform: scale(1.04) rotate(-1.5deg); }
          }
          .animate-shake-cta {
            animation: shakeCTA 2.5s infinite ease-in-out;
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.93); }
            to { opacity: 1; transform: scale(1); }
          }
          .popup-desc-container::-webkit-scrollbar {
            width: 4px;
          }
          .popup-desc-container::-webkit-scrollbar-track {
            background: transparent;
          }
          .popup-desc-container::-webkit-scrollbar-thumb {
            background: #334155;
            border-radius: 2px;
          }
          .popup-desc-container::-webkit-scrollbar-thumb:hover {
            background: #475569;
          }
          .popup-desc-container p {
            margin-bottom: 0.5rem;
          }
          .popup-desc-container ul {
            list-style-type: disc;
            padding-left: 1rem;
            margin-bottom: 0.5rem;
          }
          .popup-desc-container li {
            margin-bottom: 0.25rem;
          }
          .popup-desc-container strong {
            color: #fff;
            font-weight: 700;
          }
        ` }} />
      </div>
    </>
  );
}

/* Helper Component: Sticky Bottom Checkout Bar */
function StickyCheckoutBar({ onBuy, price, originalPrice }: { onBuy: (e: React.MouseEvent) => void; price: number; originalPrice: number | null }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 600) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#00114E]/95 backdrop-blur-md border-t border-white/10 py-3.5 px-4 z-[99] shadow-[0_-8px_30px_rgba(0,0,0,0.45)] animate-slide-up">
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
          <p className="text-white text-xs sm:text-sm md:text-base font-black tracking-wide leading-tight">
            ⚡ Adobe CC Premium 2026 + Bonuses
          </p>
          <div className="flex items-center gap-2">
            <span className="text-white/40 line-through text-[11px] sm:text-xs font-bold">₹{(originalPrice || 2499).toLocaleString('en-IN')}</span>
            <span className="text-[#05FF00] font-black text-sm sm:text-lg">₹{price}</span>
            <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">90% OFF</span>
          </div>
        </div>
        <button 
          onClick={onBuy}
          className="bg-gradient-to-r from-[#FFC800] to-[#afff3d] text-black font-black uppercase text-xs sm:text-sm px-4 sm:px-8 py-2.5 sm:py-3.5 rounded-xl shadow-[0_4px_15px_rgba(255,200,0,0.35)] hover:scale-105 active:scale-95 transition-all duration-150 shrink-0 whitespace-nowrap animate-shake-cta"
        >
          Buy Now 🚀
        </button>
      </div>
    </div>
  );
}

/* Helper Component: Floating WhatsApp Support Widget */
function WhatsAppWidget() {
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    // Show tooltip after 3 seconds to capture user attention
    const timer = setTimeout(() => setShowTooltip(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed bottom-20 right-6 z-[98] flex flex-col items-end">
      {showTooltip && (
        <div className="bg-white text-gray-800 text-[11px] sm:text-xs font-bold py-1.5 px-3 rounded-xl shadow-lg border border-gray-150 mb-2 relative animate-slide-up shrink-0 max-w-[200px] text-right flex items-center gap-1.5">
          <span>Need help? Chat with us!</span>
          <button onClick={() => setShowTooltip(false)} className="text-gray-400 hover:text-gray-600 font-extrabold text-[10px] ml-1">✕</button>
          <div className="absolute right-4 bottom-[-6px] w-3 h-3 bg-white rotate-45 border-r border-b border-gray-100" />
        </div>
      )}
      <a
        href="https://wa.me/917500167987?text=Hi%20Grabnext!%20I'm%20on%20the%20Adobe%20CC%20Bundle%20page%20and%20want%20to%20purchase.%20Can%20you%20help%20me%3F"
        target="_blank"
        rel="noopener noreferrer"
        className="w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center text-white shadow-xl hover:scale-110 transition-transform duration-200 animate-pulse-glow relative border border-[#25D366]/20"
      >
        <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413" />
        </svg>
        <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
        </span>
      </a>
    </div>
  );
}

