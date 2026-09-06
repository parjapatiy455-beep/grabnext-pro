"use client"
export const runtime = 'edge'

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { Mail, Send, Sparkles, Check, AlertCircle, Loader2, Tag, ShoppingBag, Eye, Users, RefreshCw, Smartphone, Laptop } from "lucide-react"

// Pre-defined campaign templates
const PRESETS = [
  {
    id: "mega_sale",
    name: "🎉 Mega Sale Offer (50% OFF)",
    subject: "🔥 MEGA SALE: Get up to 50% OFF on all Digital Bundles!",
    headline: "MEGA SALE IS LIVE — FLAT 50% OFF!",
    subheading: "Claim exclusive discounts on software source code, video editing packs, courses & Canva templates.",
    couponCode: "SAVE50",
    discountBadge: "SPECIAL 50% OFF",
    ctaText: "⚡ Claim 50% OFF Offer Now",
  },
  {
    id: "flash_coupon",
    name: "🎟️ Exclusive Flash Deal Coupon",
    subject: "🎟️ Flash Offer: Extra Discount Coupon Code inside!",
    headline: "FLASH DEAL ALERT: Extra Savings Unlocked",
    subheading: "Use our special promotional coupon code at checkout before midnight tonight.",
    couponCode: "FLASH40",
    discountBadge: "FLAT 40% OFF",
    ctaText: "🎟️ Apply Coupon & Shop",
  },
  {
    id: "new_launch",
    name: "📦 New Product Launch Alert",
    subject: "🚀 Just Released: New Source Code & Creative Assets!",
    headline: "NEW DIGITAL ASSETS & SOFTWARE RELEASED",
    subheading: "Explore our latest high-demand digital downloads with instant UPI delivery.",
    couponCode: "NEWLAUNCH",
    discountBadge: "NEW ARRIVALS",
    ctaText: "📦 Explore New Products",
  },
  {
    id: "custom",
    name: "✍️ Custom Campaign",
    subject: "✨ Special Announcement from Grabnext",
    headline: "EXCLUSIVE DIGITAL STORE PROMOTION",
    subheading: "Special offer tailored just for our valued customers.",
    couponCode: "",
    discountBadge: "PROMO DEAL",
    ctaText: "⚡ View Offer",
  },
]

export default function BulkEmailAdminPage() {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [testing, setTesting] = useState(false)

  // System stats & items
  const [stats, setStats] = useState({
    totalUsers: 0,
    registeredUsers: 0,
    guestUsers: 0,
    isBrevoConfigured: false,
    senderEmail: "",
    senderName: "Grabnext",
  })
  const [productsList, setProductsList] = useState<any[]>([])
  const [couponsList, setCouponsList] = useState<any[]>([])

  // Form State
  const [targetAudience, setTargetAudience] = useState<string>("all")
  const [isPrimaryMode, setIsPrimaryMode] = useState<boolean>(true)
  const [subject, setSubject] = useState(PRESETS[0].subject)
  const [headline, setHeadline] = useState(PRESETS[0].headline)
  const [subheading, setSubheading] = useState(PRESETS[0].subheading)
  const [couponCode, setCouponCode] = useState(PRESETS[0].couponCode)
  const [discountBadge, setDiscountBadge] = useState(PRESETS[0].discountBadge)
  const [ctaText, setCtaText] = useState(PRESETS[0].ctaText)
  const [ctaUrl, setCtaUrl] = useState("")
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [testEmail, setTestEmail] = useState("")

  // Preview Mode State
  const [previewTab, setPreviewTab] = useState<"desktop" | "mobile">("desktop")

  const loadResources = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/bulk-email", { cache: "no-store" })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || "Failed to load campaign data")
      }
      const data = await res.json()
      setStats({
        totalUsers: data.totalUsers || 0,
        registeredUsers: data.registeredUsers || 0,
        guestUsers: data.guestUsers || 0,
        isBrevoConfigured: Boolean(data.isBrevoConfigured),
        senderEmail: data.senderEmail || "",
        senderName: data.senderName || "Grabnext",
      })
      setProductsList(Array.isArray(data.products) ? data.products : [])
      setCouponsList(Array.isArray(data.coupons) ? data.coupons : [])
      if (data.senderEmail && !testEmail) {
        setTestEmail(data.senderEmail)
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadResources()
  }, [])

  const applyPreset = (presetId: string) => {
    const preset = PRESETS.find((p) => p.id === presetId)
    if (!preset) return
    setSubject(preset.subject)
    setHeadline(preset.headline)
    setSubheading(preset.subheading)
    setCouponCode(preset.couponCode)
    setDiscountBadge(preset.discountBadge)
    setCtaText(preset.ctaText)
    toast({ title: `Preset Applied: ${preset.name}` })
  }

  const toggleProductSelection = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    )
  }

  // Handle Sending Test Email
  const handleSendTestEmail = async () => {
    if (!testEmail || !testEmail.includes("@")) {
      return toast({ title: "Validation Error", description: "Valid test email address is required", variant: "destructive" })
    }
    if (!subject.trim() || !headline.trim()) {
      return toast({ title: "Validation Error", description: "Subject and Headline are required", variant: "destructive" })
    }

    setTesting(true)
    try {
      const res = await fetch("/api/admin/bulk-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isTestMode: true,
          testEmail: testEmail.trim(),
          isPrimaryMode,
          subject,
          headline,
          subheading,
          couponCode,
          discountBadge,
          productIds: selectedProductIds,
          ctaText,
          ctaUrl,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to send test email")

      toast({ title: "✅ Test Email Sent!", description: data.message })
    } catch (err: any) {
      toast({ title: "Test Email Error", description: err.message, variant: "destructive" })
    } finally {
      setTesting(false)
    }
  }

  // Handle Bulk Email Campaign Dispatch
  const handleDispatchBulkCampaign = async () => {
    if (!subject.trim() || !headline.trim()) {
      return toast({ title: "Validation Error", description: "Subject and Headline are required", variant: "destructive" })
    }

    const targetedCount =
      targetAudience === "registered"
        ? stats.registeredUsers
        : targetAudience === "guest"
        ? stats.guestUsers
        : stats.totalUsers

    if (targetedCount === 0) {
      return toast({ title: "No Recipients", description: "Selected audience has 0 users", variant: "destructive" })
    }

    if (
      !confirm(
        `🚨 Are you sure you want to send this bulk offer email to ALL ${targetedCount} users?\n\nMode: ${isPrimaryMode ? "Primary Inbox (High Priority)" : "Promotional"}\nSubject: "${subject}"`
      )
    ) {
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/admin/bulk-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isTestMode: false,
          targetAudience,
          isPrimaryMode,
          subject,
          headline,
          subheading,
          couponCode,
          discountBadge,
          productIds: selectedProductIds,
          ctaText,
          ctaUrl,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to dispatch bulk campaign")

      toast({
        title: "🎉 Bulk Campaign Completed!",
        description: data.message,
      })
    } catch (err: any) {
      toast({ title: "Campaign Error", description: err.message, variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const targetedCount =
    targetAudience === "registered"
      ? stats.registeredUsers
      : targetAudience === "guest"
      ? stats.guestUsers
      : stats.totalUsers

  // Get objects of selected products for preview
  const featuredProductsObjects = productsList.filter((p) => selectedProductIds.includes(p.id))

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Bulk Offer Email Marketing</h1>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 font-bold">
              ⚡ Live Service
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Create and send promotional offer emails to all registered and guest users with ready-made templates & product showcases.
          </p>
        </div>

        <Button onClick={loadResources} variant="outline" size="sm" className="w-fit gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh Data
        </Button>
      </div>

      {/* Warning if Brevo not configured */}
      {!stats.isBrevoConfigured && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-bold text-sm">Brevo Email API Key Missing</h4>
            <p className="text-xs mt-0.5 text-red-700">
              Please set <code className="bg-red-100 px-1 py-0.5 rounded font-mono">BREVO_API_KEY</code> and <code className="bg-red-100 px-1 py-0.5 rounded font-mono">BREVO_SENDER_EMAIL</code> in Payment/API settings or <code className="bg-red-100 px-1 py-0.5 rounded font-mono">.env</code> file before dispatching bulk emails.
            </p>
          </div>
        </div>
      )}

      {/* Target Audience Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setTargetAudience("all")}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            targetAudience === "all"
              ? "bg-blue-50/80 border-blue-500 shadow-sm ring-2 ring-blue-500/20"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">All Database Users</span>
            <Users className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{loading ? "..." : stats.totalUsers}</div>
          <p className="text-[11px] text-slate-500 mt-1">Both registered & guest checkout users</p>
        </div>

        <div
          onClick={() => setTargetAudience("registered")}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            targetAudience === "registered"
              ? "bg-emerald-50/80 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Registered Accounts</span>
            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-[10px]">Members</Badge>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{loading ? "..." : stats.registeredUsers}</div>
          <p className="text-[11px] text-slate-500 mt-1">Users who created permanent accounts</p>
        </div>

        <div
          onClick={() => setTargetAudience("guest")}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            targetAudience === "guest"
              ? "bg-amber-50/80 border-amber-500 shadow-sm ring-2 ring-amber-500/20"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Guest Checkout Users</span>
            <Badge variant="secondary" className="text-[10px]">Guests</Badge>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{loading ? "..." : stats.guestUsers}</div>
          <p className="text-[11px] text-slate-500 mt-1">Users created automatically via guest checkout</p>
        </div>
      </div>

      {/* Deliverability Mode Selector */}
      <Card className="border shadow-sm bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-extrabold flex items-center justify-between text-white">
            <span className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-emerald-400" />
              Gmail Inbox Placement Optimization
            </span>
            <Badge className={isPrimaryMode ? "bg-emerald-500 text-white font-bold" : "bg-amber-500 text-white font-bold"}>
              {isPrimaryMode ? "🎯 Primary Inbox Mode Active" : "🎨 Rich Promotional Mode Active"}
            </Badge>
          </CardTitle>
          <CardDescription className="text-xs text-indigo-200">
            Control how Gmail classifies your email (Primary Inbox with Notifications vs Promotions Tab).
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            onClick={() => setIsPrimaryMode(true)}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              isPrimaryMode
                ? "bg-white text-slate-900 border-emerald-400 shadow-md ring-2 ring-emerald-400"
                : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800"
            }`}
          >
            <div className="flex items-center justify-between font-bold text-xs">
              <span className="text-emerald-700">🎯 Primary Inbox Mode (Recommended)</span>
              {isPrimaryMode && <Check className="h-4 w-4 text-emerald-600" />}
            </div>
            <p className="text-[11px] mt-1 leading-snug opacity-90 text-slate-600">
              Sends clean conversational update letter. <strong>Highest Primary Inbox placement + Mobile Notifications!</strong>
            </p>
          </div>

          <div
            onClick={() => setIsPrimaryMode(false)}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              !isPrimaryMode
                ? "bg-white text-slate-900 border-amber-400 shadow-md ring-2 ring-amber-400"
                : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800"
            }`}
          >
            <div className="flex items-center justify-between font-bold text-xs">
              <span className="text-amber-700">🎨 Rich Graphical Banner</span>
              {!isPrimaryMode && <Check className="h-4 w-4 text-amber-600" />}
            </div>
            <p className="text-[11px] mt-1 leading-snug opacity-90 text-slate-600">
              Rich dark gradient banner design. Looks graphic-heavy but Gmail usually routes it to <strong>Promotions Tab</strong>.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Main Form & Live Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Preset Selector */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Select Campaign Template / Preset
              </CardTitle>
              <CardDescription className="text-xs">Pick a ready-made offer template to quickly fill campaign details.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {PRESETS.map((p) => (
                  <Button
                    key={p.id}
                    type="button"
                    variant="outline"
                    onClick={() => applyPreset(p.id)}
                    className="justify-start text-xs font-semibold h-auto py-2.5 px-3 border-slate-200 hover:border-primary hover:bg-slate-50 text-slate-800"
                  >
                    {p.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Campaign Details Form */}
          <Card className="border shadow-sm space-y-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold">Offer Email Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Email Subject Line *</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. 🔥 MEGA SALE: Flat 50% OFF on all Digital Products!"
                  className="font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Banner Headline *</Label>
                <Input
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. MEGA FESTIVE SALE IS LIVE!"
                  className="font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Announcement / Subheading Text</Label>
                <Textarea
                  value={subheading}
                  onChange={(e) => setSubheading(e.target.value)}
                  placeholder="e.g. Get instant UPI download access to best-selling software, Canva templates & editing bundles."
                  rows={2}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Coupon Code (Optional)</span>
                    {couponsList.length > 0 && (
                      <span className="text-[10px] text-blue-600 cursor-pointer" onClick={() => setCouponCode(couponsList[0]?.code)}>
                        Use: {couponsList[0]?.code}
                      </span>
                    )}
                  </Label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-2.5 h-4 w-4 text-amber-500" />
                    <Input
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="e.g. SAVE50"
                      className="pl-9 font-mono font-bold text-amber-700 uppercase"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Discount Badge Text</Label>
                  <Input
                    value={discountBadge}
                    onChange={(e) => setDiscountBadge(e.target.value)}
                    placeholder="e.g. SPECIAL 50% OFF"
                  />
                </div>
              </div>

              {/* Product Selector */}
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <ShoppingBag className="h-4 w-4 text-blue-600" /> Feature Products in Email (Optional)
                  </Label>
                  <span className="text-xs text-muted-foreground font-medium">
                    {selectedProductIds.length} product(s) selected
                  </span>
                </div>

                {productsList.length === 0 ? (
                  <p className="text-xs text-slate-400">No active products found.</p>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-1.5 border rounded-lg p-2 bg-slate-50">
                    {productsList.map((p) => {
                      const isSelected = selectedProductIds.includes(p.id)
                      return (
                        <div
                          key={p.id}
                          onClick={() => toggleProductSelection(p.id)}
                          className={`flex items-center justify-between p-2 rounded-md cursor-pointer text-xs transition-colors ${
                            isSelected ? "bg-blue-100 border border-blue-300 font-semibold text-blue-900" : "bg-white hover:bg-slate-100 border border-slate-200"
                          }`}
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <div className={`h-4 w-4 rounded border flex items-center justify-center ${isSelected ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300"}`}>
                              {isSelected && <Check className="h-3 w-3" />}
                            </div>
                            <span className="truncate max-w-[240px]">{p.title}</span>
                          </div>
                          <span className="font-bold shrink-0">₹{p.price}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* CTA Buttons Config */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">CTA Button Text</Label>
                  <Input value={ctaText} onChange={(e) => setCtaText(e.target.value)} placeholder="⚡ Claim Offer Now" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Custom Link URL (Default: Store)</Label>
                  <Input value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} placeholder="https://grabnext.in/products" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test & Action Controls */}
          <Card className="border shadow-sm bg-slate-900 text-white">
            <CardContent className="p-5 space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs font-bold text-slate-300">Send Test Email to Verify</Label>
                  <Input
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="your-email@example.com"
                    className="bg-slate-800 border-slate-700 text-white text-xs h-9"
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleSendTestEmail}
                  disabled={testing}
                  variant="secondary"
                  className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold self-end h-9 text-xs gap-1.5 shrink-0"
                >
                  {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
                  Send Test Email
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
                <div>
                  <h4 className="text-sm font-bold text-white">Ready to Dispatch Bulk Campaign?</h4>
                  <p className="text-xs text-slate-400">
                    Will send to <strong className="text-amber-400">{targetedCount}</strong> users ({targetAudience.toUpperCase()}).
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={handleDispatchBulkCampaign}
                  disabled={submitting || targetedCount === 0}
                  className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold px-6 py-2.5 rounded-xl shadow-lg hover:shadow-xl text-sm gap-2 shrink-0"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Dispatch Bulk Campaign ({targetedCount})
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Live Email Preview Pane (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm flex items-center gap-1.5 text-slate-800">
              <Eye className="h-4 w-4 text-blue-600" /> Live HTML Email Preview
            </h3>
            <div className="flex items-center gap-1 bg-slate-200 p-0.5 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setPreviewTab("desktop")}
                className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 transition-all ${
                  previewTab === "desktop" ? "bg-white shadow text-slate-900" : "text-slate-600"
                }`}
              >
                <Laptop className="h-3.5 w-3.5" /> Desktop
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab("mobile")}
                className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 transition-all ${
                  previewTab === "mobile" ? "bg-white shadow text-slate-900" : "text-slate-600"
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" /> Mobile
              </button>
            </div>
          </div>

          {/* Rendered Email Mockup */}
          <div className={`mx-auto transition-all duration-300 ${previewTab === "mobile" ? "max-w-[340px]" : "w-full"}`}>
            <div className="bg-slate-100 p-3 rounded-2xl border shadow-inner overflow-hidden">
              <div className="bg-white rounded-xl overflow-hidden shadow border text-slate-900 text-xs">
                {/* Accent Line */}
                <div className={`h-1 ${isPrimaryMode ? "bg-blue-600" : "bg-gradient-to-r from-amber-500 via-red-500 to-indigo-600"}`} />

                {/* Header with Logo */}
                <div className="bg-white p-3 border-b border-slate-200 flex items-center justify-between">
                  <div className="font-black text-lg text-slate-900 italic tracking-tight">Grabnext</div>
                  <Badge variant={isPrimaryMode ? "default" : "secondary"} className="text-[9px]">
                    {isPrimaryMode ? "🎯 Gmail Primary Mode" : "🎨 Promotional Mode"}
                  </Badge>
                </div>

                {/* Content Box */}
                <div className="p-4 space-y-3">
                  {isPrimaryMode ? (
                    <>
                      {/* Primary Inbox Mode Layout */}
                      <p className="text-slate-900 text-xs font-semibold">
                        Hi <strong>Valued Customer</strong>,
                      </p>

                      <p className="text-slate-800 text-[11px] leading-relaxed font-medium">
                        {headline || "EXCLUSIVE ANNOUNCEMENT"}
                      </p>

                      {subheading && (
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          {subheading}
                        </p>
                      )}

                      {/* Clean Access Code Box */}
                      {couponCode && (
                        <div className="bg-blue-50 border-l-4 border-blue-600 p-2.5 rounded text-xs space-y-0.5">
                          <span className="text-[10px] text-blue-900 font-medium">🔑 Your Access Code:</span>
                          <div className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded w-fit text-xs border">
                            {couponCode.toUpperCase()}
                          </div>
                        </div>
                      )}

                      {/* Featured Products List */}
                      {featuredProductsObjects.length > 0 && (
                        <div className="bg-slate-50 border p-2.5 rounded-lg space-y-1.5">
                          <div className="font-bold text-[11px] text-slate-900">Featured Products for You:</div>
                          <ul className="list-disc pl-4 text-[11px] text-slate-700 space-y-1">
                            {featuredProductsObjects.map((prod) => (
                              <li key={prod.id}>
                                <strong>{prod.title}</strong> — <span className="text-blue-600 font-bold">₹{prod.price}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Clean Blue CTA Button */}
                      <div className="pt-1">
                        <div className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-4 rounded-lg inline-block shadow-sm">
                          {ctaText || "⚡ Claim Offer Now"}
                        </div>
                      </div>

                      {/* WhatsApp Support Box */}
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-center space-y-0.5">
                        <div className="text-[10px] font-bold text-emerald-800">💬 Need Help? Contact us on WhatsApp!</div>
                        <div className="bg-emerald-600 text-white font-bold text-[10px] py-0.5 px-2.5 rounded-full inline-block">
                          🟢 WhatsApp Support (+91 7500167987)
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-500 pt-2 border-t">
                        Best regards,<br />
                        <strong>Support Team @ Grabnext</strong>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Promotional Mode Layout */}
                      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-4 rounded-xl text-center text-white space-y-1.5 shadow-sm">
                        {discountBadge && (
                          <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full inline-block uppercase tracking-wider">
                            🔥 {discountBadge}
                          </span>
                        )}
                        <div className="font-black text-sm md:text-base leading-tight text-white">{headline || "HEADER TITLE"}</div>
                        {subheading && <div className="text-[11px] text-indigo-200 leading-snug">{subheading}</div>}
                      </div>

                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        Hi <strong>Valued Customer</strong>,<br />
                        We have an exclusive offer just for you! Explore our best-selling digital products & tools.
                      </p>

                      {/* Coupon Box */}
                      {couponCode && (
                        <div className="bg-amber-50 border-2 border-dashed border-amber-400 p-3 rounded-xl text-center space-y-1">
                          <span className="bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                            🎟️ Exclusive Coupon
                          </span>
                          <div className="font-mono text-lg font-black text-amber-800 tracking-widest">{couponCode.toUpperCase()}</div>
                          <p className="text-[10px] text-amber-700 font-medium">Apply code at checkout for discount!</p>
                        </div>
                      )}

                      {/* Featured Products */}
                      {featuredProductsObjects.length > 0 && (
                        <div className="space-y-2 pt-2 border-t">
                          <div className="font-bold text-[11px] text-slate-800">🔥 Featured Offer Products:</div>
                          {featuredProductsObjects.map((prod) => (
                            <div key={prod.id} className="bg-slate-50 border p-2 rounded-lg flex items-center justify-between gap-2">
                              <img
                                src={prod.imageUrl || "/logo.png"}
                                alt={prod.title}
                                className="w-10 h-10 object-cover rounded border bg-white shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-[11px] truncate">{prod.title}</div>
                                <div className="font-extrabold text-blue-600 text-[11px]">₹{prod.price}</div>
                              </div>
                              <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded shrink-0">🛒 Buy</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* CTA Button */}
                      <div className="text-center pt-2">
                        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-black py-2.5 px-4 rounded-lg shadow inline-block">
                          {ctaText || "⚡ Claim Offer Now"}
                        </div>
                      </div>

                      {/* WhatsApp Support Box */}
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-center space-y-1">
                        <div className="text-[10px] font-bold text-emerald-800">💬 Need Help? Chat on WhatsApp!</div>
                        <div className="bg-emerald-500 text-white font-extrabold text-[10px] py-1 px-3 rounded-full inline-block">
                          🟢 Chat on WhatsApp (+91 7500167987)
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Footer */}
                <div className="bg-slate-50 p-2.5 text-center border-t text-[10px] text-slate-400 space-y-0.5">
                  <div>© {new Date().getFullYear()} Grabnext. All rights reserved.</div>
                  <div className="text-[9px] text-slate-300">
                    {isPrimaryMode ? "Transactional Account Update" : "Registered Promotional Email"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
