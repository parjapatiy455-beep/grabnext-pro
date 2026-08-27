"use client"

import React, { useRef, useState } from "react"

interface TiltCardProps {
  children: React.ReactNode
  className?: string
  perspective?: number
  scale?: number
  glare?: boolean
}

export function TiltCard({
  children,
  className = "",
  perspective = 1000,
  scale = 1.02,
  glare = true,
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [style, setStyle] = useState<React.CSSProperties>({
    transform: `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`,
    transition: "transform 0.5s cubic-bezier(0.03, 0.98, 0.52, 0.99)",
  })

  const [glareStyle, setGlareStyle] = useState<React.CSSProperties>({
    opacity: 0,
    transform: "translate(-50%, -50%)",
  })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const centerX = rect.width / 2
    const centerY = rect.height / 2

    const rotateX = ((y - centerY) / centerY) * -10
    const rotateY = ((x - centerX) / centerX) * 10

    setStyle({
      transform: `perspective(${perspective}px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(${scale}, ${scale}, ${scale})`,
      transition: "transform 0.1s ease-out",
    })

    if (glare) {
      setGlareStyle({
        opacity: 0.35,
        left: `${x}px`,
        top: `${y}px`,
        transform: "translate(-50%, -50%)",
        transition: "opacity 0.2s ease-out",
      })
    }
  }

  const handleMouseLeave = () => {
    setStyle({
      transform: `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`,
      transition: "transform 0.5s cubic-bezier(0.03, 0.98, 0.52, 0.99)",
    })
    if (glare) {
      setGlareStyle((prev) => ({
        ...prev,
        opacity: 0,
        transition: "opacity 0.5s ease-out",
      }))
    }
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden ${className}`}
      style={style}
    >
      {children}

      {glare && (
        <div
          className="pointer-events-none absolute h-48 w-48 rounded-full bg-gradient-to-r from-white/40 to-transparent blur-xl"
          style={glareStyle}
        />
      )}
    </div>
  )
}
