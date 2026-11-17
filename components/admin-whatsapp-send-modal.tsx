"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  MessageCircle, X, Copy, Check, ExternalLink,
  Phone, User, Package, AlertCircle
} from "lucide-react"
import { formatWhatsAppPhone } from "@/lib/whatsapp"

interface WhatsAppSendModalProps {
  isOpen: boolean
  onClose: () => void
  orderId: string
  customerName: string
  initialPhone: string
  initialMessage: string
  orderType: "pending" | "paid"
}

export function AdminWhatsAppSendModal({
  isOpen,
  onClose,
  orderId,
  customerName,
  initialPhone,
  initialMessage,
  orderType,
}: WhatsAppSendModalProps) {
  const [phone, setPhone] = useState(initialPhone || "")
  const [message, setMessage] = useState(initialMessage || "")
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const cleanPhone = formatWhatsAppPhone(phone)
  const isPhoneValid = cleanPhone.length >= 10

  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`

  const handleOpenWhatsApp = () => {
    if (!cleanPhone) {
      alert("Please enter a valid phone number.")
      return
    }
    window.open(whatsappUrl, "_blank")
    onClose()
  }

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      alert("Failed to copy to clipboard")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-[#25D366]/10">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-[#25D366] text-white flex items-center justify-center shadow-sm">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
                Send WhatsApp Message
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    orderType === "pending"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {orderType === "pending" ? "10% OFF Recovery" : "Download Delivery"}
                </span>
              </h3>
              <p className="text-xs text-gray-500">Order #{orderId} • {customerName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Phone Field */}
          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center justify-between mb-1.5">
              <span>Customer WhatsApp Number</span>
              {!initialPhone && (
                <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Phone missing from checkout
                </span>
              )}
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="tel"
                placeholder="Enter 10-digit mobile number (e.g. 9876543210)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pl-9 text-sm font-medium border-gray-300 rounded-xl focus:border-[#25D366] focus:ring-[#25D366]"
              />
            </div>
            {cleanPhone && (
              <p className="text-[11px] text-gray-400 mt-1">
                WhatsApp formatted number: <span className="font-mono text-gray-700 font-semibold">+{cleanPhone}</span>
              </p>
            )}
          </div>

          {/* Message Preview & Edit */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                Message Preview (Editable)
              </label>
              <button
                type="button"
                onClick={handleCopyMessage}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" /> Copy Text
                  </>
                )}
              </button>
            </div>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              className="text-xs font-sans p-3 bg-gray-50 border-gray-200 rounded-xl leading-relaxed focus:bg-white"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="text-xs font-semibold rounded-xl"
          >
            Cancel
          </Button>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCopyMessage}
              className="text-xs font-semibold rounded-xl flex items-center gap-1.5 border-gray-300 text-gray-700"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </Button>
            <Button
              type="button"
              onClick={handleOpenWhatsApp}
              disabled={!isPhoneValid}
              className="bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-xs transition-all disabled:opacity-50"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Open in WhatsApp</span>
              <ExternalLink className="h-3 w-3 opacity-80" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
