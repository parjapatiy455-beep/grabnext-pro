"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"

interface WhatsAppToggleProps {
  phoneNumber?: string
  message?: string
}

export function WhatsAppToggle({
  phoneNumber = "917500167987",
  message = "Hi GrabNext, I need help with products!",
}: WhatsAppToggleProps) {
  const pathname = usePathname()
  const [wiggle, setWiggle] = useState(false)

  // Trigger subtle wiggle animation every 4.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setWiggle(true)
      setTimeout(() => setWiggle(false), 1000)
    }, 4500)
    return () => clearInterval(interval)
  }, [])

  // Hide on admin panel or editor pages if desired
  if (pathname?.startsWith("/admin")) {
    return null
  }

  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`

  return (
    <div className="fixed bottom-5 right-5 z-[9999]">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Need Help? Chat on WhatsApp"
        className={`group relative flex items-center gap-3 bg-[#25D366] hover:bg-[#20ba59] text-white px-4 py-3 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 border-2 border-white/30 ${
          wiggle ? "wa-wiggle" : ""
        }`}
      >
        {/* Glowing Pulsing Outer Ring */}
        <span className="absolute -inset-1 rounded-full bg-[#25D366]/40 animate-ping pointer-events-none opacity-75" />

        {/* WhatsApp Icon */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg className="w-7 h-7 fill-current text-white drop-shadow" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
          </svg>
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-emerald-300 rounded-full border-2 border-[#25D366] animate-pulse" />
        </div>

        {/* Text */}
        <div className="flex flex-col text-left">
          <span className="text-xs font-semibold text-white/90 leading-none">Need Help?</span>
          <span className="text-sm font-extrabold text-white tracking-wide leading-tight">Chat on WhatsApp</span>
        </div>
      </a>

      <style jsx global>{`
        @keyframes waWiggle {
          0% { transform: rotate(0deg) scale(1); }
          15% { transform: rotate(-12deg) scale(1.08); }
          30% { transform: rotate(10deg) scale(1.08); }
          45% { transform: rotate(-8deg) scale(1.05); }
          60% { transform: rotate(6deg) scale(1.05); }
          75% { transform: rotate(-3deg) scale(1.02); }
          100% { transform: rotate(0deg) scale(1); }
        }
        .wa-wiggle {
          animation: waWiggle 0.85s ease-in-out;
        }
      `}</style>
    </div>
  )
}
