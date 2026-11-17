"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  MessageSquare, X, Check, RotateCcw, Sparkles,
  ExternalLink, Copy, HelpCircle, Save, Loader2, CheckCircle2
} from "lucide-react"
import { DEFAULT_PENDING_TEMPLATE, DEFAULT_PAID_TEMPLATE } from "@/lib/whatsapp"

interface WhatsAppTemplatesModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AdminWhatsAppTemplatesModal({ isOpen, onClose }: WhatsAppTemplatesModalProps) {
  const [activeTab, setActiveTab] = useState<"pending" | "paid">("pending")
  const [pendingTemplate, setPendingTemplate] = useState(DEFAULT_PENDING_TEMPLATE)
  const [paidTemplate, setPaidTemplate] = useState(DEFAULT_PAID_TEMPLATE)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [copiedTag, setCopiedTag] = useState<string | null>(null)

  const pendingTextareaRef = useRef<HTMLTextAreaElement>(null)
  const paidTextareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const fetchTemplates = async () => {
      setLoading(true)
      try {
        const res = await fetch("/api/settings", { cache: "no-store" })
        if (res.ok) {
          const data = await res.json()
          if (data.whatsapp_pending_template) {
            setPendingTemplate(data.whatsapp_pending_template)
          }
          if (data.whatsapp_paid_template) {
            setPaidTemplate(data.whatsapp_paid_template)
          }
        }
      } catch (err) {
        console.error("Failed to fetch WhatsApp templates", err)
      } finally {
        setLoading(false)
      }
    }
    fetchTemplates()
  }, [isOpen])

  if (!isOpen) return null

  const handleInsertTag = (tag: string) => {
    const isPending = activeTab === "pending"
    const ref = isPending ? pendingTextareaRef.current : paidTextareaRef.current
    const currentVal = isPending ? pendingTemplate : paidTemplate
    const setter = isPending ? setPendingTemplate : setPaidTemplate

    if (!ref) {
      setter(currentVal + " " + tag)
      return
    }

    const start = ref.selectionStart || currentVal.length
    const end = ref.selectionEnd || currentVal.length
    const updated = currentVal.substring(0, start) + tag + currentVal.substring(end)
    setter(updated)

    setTimeout(() => {
      ref.focus()
      ref.setSelectionRange(start + tag.length, start + tag.length)
    }, 50)

    setCopiedTag(tag)
    setTimeout(() => setCopiedTag(null), 1500)
  }

  const handleResetToDefault = () => {
    if (activeTab === "pending") {
      if (confirm("Reset Pending Follow-up template to default?")) {
        setPendingTemplate(DEFAULT_PENDING_TEMPLATE)
      }
    } else {
      if (confirm("Reset Paid Thank You & Downloads template to default?")) {
        setPaidTemplate(DEFAULT_PAID_TEMPLATE)
      }
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          whatsapp_pending_template: pendingTemplate,
          whatsapp_paid_template: paidTemplate,
        }),
      })

      if (res.ok) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 2500)
      } else {
        alert("Failed to save templates. Please try again.")
      }
    } catch (err: any) {
      alert("Error: " + err.message)
    } finally {
      setSaving(false)
    }
  }

  // Sample data for real-time preview
  const sampleData = {
    name: "Rahul Sharma",
    order_id: "ORD-98214",
    products: "Complete Web Dev Bundle 2026, AI SaaS Masterclass",
    original_amount: "₹499",
    amount: activeTab === "pending" ? "₹449" : "₹499",
    discount: "10%",
    recovery_link: "https://grabnext.pages.dev/checkout?orderId=ORD-98214&token=signed_token&recover=1",
    download_links: "https://grabnext.pages.dev/checkout/success?orderId=ORD-98214",
    site_name: "GrabNext",
  }

  const getPreviewText = () => {
    const raw = activeTab === "pending" ? pendingTemplate : paidTemplate
    return raw
      .replace(/{{name}}/g, sampleData.name)
      .replace(/{{order_id}}/g, sampleData.order_id)
      .replace(/{{products}}/g, sampleData.products)
      .replace(/{{original_amount}}/g, sampleData.original_amount)
      .replace(/{{amount}}/g, sampleData.amount)
      .replace(/{{discount}}/g, sampleData.discount)
      .replace(/{{recovery_link}}/g, sampleData.recovery_link)
      .replace(/{{download_links}}/g, sampleData.download_links)
      .replace(/{{access_link}}/g, sampleData.download_links)
      .replace(/{{site_name}}/g, sampleData.site_name)
  }

  const pendingTags = [
    { tag: "{{name}}", label: "Customer Name" },
    { tag: "{{order_id}}", label: "Order ID" },
    { tag: "{{products}}", label: "Product Title(s)" },
    { tag: "{{amount}}", label: "10% Discounted Price" },
    { tag: "{{original_amount}}", label: "Original Price" },
    { tag: "{{discount}}", label: "10%" },
    { tag: "{{recovery_link}}", label: "1-Click Recovery Link" },
    { tag: "{{site_name}}", label: "Store Name" },
  ]

  const paidTags = [
    { tag: "{{name}}", label: "Customer Name" },
    { tag: "{{order_id}}", label: "Order ID" },
    { tag: "{{products}}", label: "Product Title(s)" },
    { tag: "{{amount}}", label: "Paid Amount" },
    { tag: "{{download_links}}", label: "Download / Access URL" },
    { tag: "{{site_name}}", label: "Store Name" },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 via-teal-50 to-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-200">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                WhatsApp Message Templates
                <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                  Direct Follow-up & Delivery
                </span>
              </h2>
              <p className="text-xs text-gray-500">
                Configure templates for incomplete order follow-ups (with 10% discount) and completed order delivery.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-gray-200 bg-gray-50/70 px-6 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("pending")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold rounded-t-xl transition-all border-t border-x ${
              activeTab === "pending"
                ? "bg-white text-emerald-700 border-gray-200 shadow-xs -mb-[1px] pb-3"
                : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100/60"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-amber-500"></span>
            🕒 Pending Order Follow-up (10% OFF)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("paid")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold rounded-t-xl transition-all border-t border-x ${
              activeTab === "paid"
                ? "bg-white text-emerald-700 border-gray-200 shadow-xs -mb-[1px] pb-3"
                : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100/60"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            ✅ Paid Order Thank You & Downloads
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mb-2" />
              <p className="text-xs">Loading templates from database...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Template Editor */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <p className="text-xs font-semibold text-slate-700">
                    {activeTab === "pending"
                      ? "⚡ Triggered for pending / abandoned checkouts. Injects customer name, products, and a 1-click recovery link with an extra 10% discount."
                      : "🎉 Triggered for completed / paid orders. Sends instant thank you message with direct product access & download links."}
                  </p>
                </div>

                {/* Tag Pills */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Click to Insert Variables:
                    </span>
                    {copiedTag && (
                      <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 animate-in fade-in">
                        <Check className="h-3 w-3" /> Added {copiedTag}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(activeTab === "pending" ? pendingTags : paidTags).map((t) => (
                      <button
                        key={t.tag}
                        type="button"
                        onClick={() => handleInsertTag(t.tag)}
                        className="text-xs font-mono bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 hover:border-emerald-400 px-2 py-1 rounded-md transition-all shadow-2xs hover:scale-105 active:scale-95 flex items-center gap-1"
                        title={`Click to insert ${t.tag} (${t.label})`}
                      >
                        <span className="font-bold">{t.tag}</span>
                        <span className="text-[10px] text-gray-500 font-sans">({t.label})</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Editor Textarea */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                      Message Content (WhatsApp Markdown Supported: *bold*, _italic_)
                    </label>
                    <button
                      type="button"
                      onClick={handleResetToDefault}
                      className="text-[11px] font-semibold text-gray-500 hover:text-emerald-700 flex items-center gap-1 transition-colors"
                    >
                      <RotateCcw className="h-3 w-3" /> Reset to Recommended
                    </button>
                  </div>
                  {activeTab === "pending" ? (
                    <Textarea
                      ref={pendingTextareaRef}
                      value={pendingTemplate}
                      onChange={(e) => setPendingTemplate(e.target.value)}
                      rows={12}
                      className="font-sans text-sm p-3.5 bg-white border-gray-300 rounded-xl leading-relaxed focus:border-emerald-500 focus:ring-emerald-500"
                      placeholder="Write your WhatsApp message template..."
                    />
                  ) : (
                    <Textarea
                      ref={paidTextareaRef}
                      value={paidTemplate}
                      onChange={(e) => setPaidTemplate(e.target.value)}
                      rows={12}
                      className="font-sans text-sm p-3.5 bg-white border-gray-300 rounded-xl leading-relaxed focus:border-emerald-500 focus:ring-emerald-500"
                      placeholder="Write your WhatsApp message template..."
                    />
                  )}
                  <p className="text-[11px] text-gray-400 mt-1.5">
                    Tip: Use emoji and keep it friendly. The links generated will work on any mobile browser or WhatsApp Web.
                  </p>
                </div>
              </div>

              {/* Right Column: WhatsApp Live Preview */}
              <div className="lg:col-span-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    Live WhatsApp Preview
                  </span>
                  <span className="text-[10px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                    Sample Data
                  </span>
                </div>

                {/* WhatsApp Phone Mockup Bubble */}
                <div className="bg-[#EFEAE2] p-4 rounded-2xl border border-gray-200 shadow-inner min-h-[340px] flex flex-col justify-end">
                  <div className="bg-white rounded-xl rounded-tr-none p-3.5 shadow-sm text-xs text-gray-800 space-y-2 border border-black/5 relative max-w-[95%] ml-auto">
                    <div className="whitespace-pre-wrap leading-relaxed break-words font-sans">
                      {getPreviewText()}
                    </div>
                    <div className="text-[10px] text-gray-400 text-right flex items-center justify-end gap-1 mt-1">
                      <span>Just now</span>
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-900 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-600" /> WhatsApp Direct Link
                  </p>
                  <p className="text-[11px] text-emerald-800 leading-snug">
                    When you click the WhatsApp button on an order, it automatically opens WhatsApp with this customized message pre-filled for that specific customer and their products.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="text-xs font-semibold rounded-xl"
          >
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            {saveSuccess && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-in fade-in">
                <Check className="h-4 w-4" /> Templates Saved Successfully!
              </span>
            )}
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving || loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-all"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  <span>Save Templates</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
