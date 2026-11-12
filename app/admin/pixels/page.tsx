"use client"
export const runtime = 'edge'

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/hooks/use-toast"
import {
  Target,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Check,
  Code2,
  CheckCircle2,
  Layers,
  Sparkles,
  Search,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Star,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface PixelItem {
  id: string
  name: string
  type: 'facebook' | 'google_analytics' | 'tiktok' | 'custom_script'
  pixelId?: string | null
  scriptCode?: string | null
  placement: 'head' | 'body'
  triggerPage: 'all' | 'checkout' | 'success' | 'landing'
  testEventCode?: string | null
  description?: string | null
  isActive: number
  isPrimary?: number
  createdAt: number
  updatedAt: number
}

const defaultFormData = {
  name: "",
  type: "facebook" as PixelItem['type'],
  pixelId: "",
  scriptCode: "",
  placement: "head" as 'head' | 'body',
  triggerPage: "all" as 'all' | 'checkout' | 'success' | 'landing',
  testEventCode: "",
  description: "",
  isActive: true,
  isPrimary: false,
}

export default function PixelsAdminPage() {
  const [pixels, setPixels] = useState<PixelItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Dialog State
  const [isOpen, setIsOpen] = useState(false)
  const [editingPixel, setEditingPixel] = useState<PixelItem | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState(defaultFormData)

  // Delete Alert State
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadPixels = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/pixels', { cache: 'no-store' })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Failed to load pixels')
      }
      const data = await res.json()
      setPixels(Array.isArray(data) ? data : [])
    } catch (error: any) {
      console.error(error)
      toast({
        title: "Error loading pixels",
        description: error.message || "Failed to load tracking pixels",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPixels()
  }, [])

  // Open modal for Create
  const handleOpenCreate = (presetType?: PixelItem['type']) => {
    setEditingPixel(null)
    setForm({
      ...defaultFormData,
      type: presetType || "facebook",
      name:
        presetType === "facebook"
          ? "Meta Pixel"
          : presetType === "google_analytics"
          ? "Google Analytics 4 Tag"
          : presetType === "tiktok"
          ? "TikTok Pixel"
          : presetType === "custom_script"
          ? "Custom Event Code"
          : "",
    })
    setIsOpen(true)
  }

  // Open modal for Edit
  const handleOpenEdit = (pixel: PixelItem) => {
    setEditingPixel(pixel)
    setForm({
      name: pixel.name,
      type: pixel.type,
      pixelId: pixel.pixelId || "",
      scriptCode: pixel.scriptCode || "",
      placement: pixel.placement || "head",
      triggerPage: pixel.triggerPage || "all",
      testEventCode: pixel.testEventCode || "",
      description: pixel.description || "",
      isActive: Boolean(pixel.isActive),
      isPrimary: Boolean(pixel.isPrimary),
    })
    setIsOpen(true)
  }

  // Submit Create or Edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      return toast({ title: "Name is required", variant: "destructive" })
    }
    if (form.type !== 'custom_script' && !form.pixelId.trim()) {
      return toast({ title: "Pixel / Measurement ID is required", variant: "destructive" })
    }
    if (form.type === 'custom_script' && !form.scriptCode.trim()) {
      return toast({ title: "Script code is required", variant: "destructive" })
    }

    setSubmitting(true)
    try {
      const url = editingPixel ? `/api/admin/pixels/${editingPixel.id}` : '/api/admin/pixels'
      const method = editingPixel ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save pixel')
      }

      toast({
        title: editingPixel ? "Pixel Updated" : "Pixel Added",
        description: `${form.name} is now ${form.isActive ? 'active & tracking live' : 'saved (inactive)'}.`,
      })

      setIsOpen(false)
      loadPixels()
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message || "An error occurred while saving the pixel",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Quick Toggle Active Status
  const handleToggleActive = async (pixel: PixelItem) => {
    const nextStatus = pixel.isActive === 1 ? 0 : 1
    // Optimistic UI update
    setPixels((prev) =>
      prev.map((p) => (p.id === pixel.id ? { ...p, isActive: nextStatus } : p))
    )

    try {
      const res = await fetch(`/api/admin/pixels/${pixel.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextStatus }),
      })
      if (!res.ok) {
        throw new Error('Failed to update status')
      }
      toast({
        title: nextStatus === 1 ? "Pixel Activated" : "Pixel Deactivated",
        description: `${pixel.name} is now ${nextStatus === 1 ? 'tracking live' : 'paused'}.`,
      })
    } catch (err: any) {
      // Revert on failure
      setPixels((prev) =>
        prev.map((p) => (p.id === pixel.id ? { ...p, isActive: pixel.isActive } : p))
      )
      toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  }

  // Quick Set Primary / Default Fallback Meta Pixel
  const handleSetPrimary = async (pixel: PixelItem) => {
    if (pixel.type !== 'facebook') return
    const prevPixels = pixels
    setPixels((prev) =>
      prev.map((p) =>
        p.type === 'facebook'
          ? { ...p, isPrimary: p.id === pixel.id ? 1 : 0, isActive: p.id === pixel.id ? 1 : p.isActive }
          : p
      )
    )

    try {
      const res = await fetch(`/api/admin/pixels/${pixel.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setPrimary: true }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Failed to set primary pixel')
      }
      toast({
        title: "Primary Fallback Pixel Updated",
        description: `${pixel.name} (${pixel.pixelId}) ab default fallback pixel hai jab URL me ?pixel= na ho.`,
      })
    } catch (err: any) {
      setPixels(prevPixels)
      toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  }

  // Delete Pixel
  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/pixels/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete pixel')

      toast({ title: "Pixel Deleted", description: "The tracking pixel has been removed." })
      setPixels((prev) => prev.filter((p) => p.id !== deleteId))
      setDeleteId(null)
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setDeleting(false)
    }
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast({ title: "Copied to Clipboard", description: text })
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Stats calculation
  const totalCount = pixels.length
  const activeCount = pixels.filter((p) => p.isActive === 1).length
  const fbCount = pixels.filter((p) => p.type === 'facebook').length
  const gaCount = pixels.filter((p) => p.type === 'google_analytics').length
  const customCount = pixels.filter((p) => p.type === 'custom_script').length
  const primaryFbPixel =
    pixels.find((p) => p.type === 'facebook' && p.isActive === 1 && p.isPrimary === 1) ||
    pixels.find((p) => p.type === 'facebook' && p.isActive === 1)

  // Filtered list
  const filteredPixels = pixels.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.pixelId && p.pixelId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesType = activeTab === 'all' || p.type === activeTab
    return matchesSearch && matchesType
  })

  const getTypeBadge = (type: PixelItem['type']) => {
    switch (type) {
      case 'facebook':
        return <Badge className="bg-blue-600 hover:bg-blue-700 text-white font-medium">Meta (Facebook)</Badge>
      case 'google_analytics':
        return <Badge className="bg-amber-600 hover:bg-amber-700 text-white font-medium">Google Analytics / Ads</Badge>
      case 'tiktok':
        return <Badge className="bg-slate-900 hover:bg-black text-white font-medium">TikTok</Badge>
      case 'custom_script':
        return <Badge className="bg-purple-600 hover:bg-purple-700 text-white font-medium">Custom Script</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  const getTriggerBadge = (trigger: PixelItem['triggerPage']) => {
    switch (trigger) {
      case 'all':
        return <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">All Pages</span>
      case 'checkout':
        return <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">Checkout Only</span>
      case 'success':
        return <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">Order Success (Purchase)</span>
      case 'landing':
        return <span className="text-xs font-semibold px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200">Landing Pages</span>
      default:
        return <span className="text-xs">{trigger}</span>
    }
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Target className="h-6 w-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Pixels & Event Tracking</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Manage Meta Pixels, Google Tags, TikTok Pixels, and custom event codes in real-time. Changes apply instantly without redeploying.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadPixels} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => handleOpenCreate('facebook')} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Add Pixel / Code
          </Button>
        </div>
      </div>

      {/* Info notice bar */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-100 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white p-2 rounded-lg shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              ⚡ Real-Time Tracking Engine Active
            </p>
            <p className="text-xs text-slate-600">
              URL me <code className="bg-slate-200/70 px-1 rounded">?pixel=</code> hone par sirf wahi pixel fire hota hai. Bina parameter ke events{' '}
              <span className="font-semibold text-slate-800">
                {primaryFbPixel
                  ? `${primaryFbPixel.name} (${primaryFbPixel.pixelId})`
                  : 'kisi bhi active Meta pixel (pehle Primary set karein)'}
              </span>{' '}
              par fallback karte hain.
            </p>
          </div>
        </div>

        {/* Quick Add Presets */}
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          <span className="text-xs font-medium text-slate-500 mr-1">Quick Add:</span>
          <Button size="sm" variant="secondary" className="h-7 text-xs bg-white hover:bg-slate-100" onClick={() => handleOpenCreate('facebook')}>
            + Meta
          </Button>
          <Button size="sm" variant="secondary" className="h-7 text-xs bg-white hover:bg-slate-100" onClick={() => handleOpenCreate('google_analytics')}>
            + GA4 / Ads
          </Button>
          <Button size="sm" variant="secondary" className="h-7 text-xs bg-white hover:bg-slate-100" onClick={() => handleOpenCreate('tiktok')}>
            + TikTok
          </Button>
          <Button size="sm" variant="secondary" className="h-7 text-xs bg-white hover:bg-slate-100" onClick={() => handleOpenCreate('custom_script')}>
            + Custom Code
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Trackers</CardTitle>
            <Layers className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Configured in database</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Live & Active</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{activeCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Actively firing on site</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Meta (FB) Pixels</CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{fbCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Browser + CAPI sync</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">GA4 / Custom</CardTitle>
            <Code2 className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{gaCount + customCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Analytics & custom snippets</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <CardTitle className="text-lg">Configured Pixels & Tracking Codes</CardTitle>
              <CardDescription>Click the toggle switch to enable or disable any pixel in real time.</CardDescription>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search pixels..."
                className="pl-9 h-9 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Platform Tabs Filter */}
          <div className="pt-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-slate-100 p-1">
                <TabsTrigger value="all" className="text-xs">All ({totalCount})</TabsTrigger>
                <TabsTrigger value="facebook" className="text-xs">Meta ({fbCount})</TabsTrigger>
                <TabsTrigger value="google_analytics" className="text-xs">Google ({gaCount})</TabsTrigger>
                <TabsTrigger value="custom_script" className="text-xs">Custom Code ({customCount})</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm font-medium">Loading pixels from database...</p>
            </div>
          ) : filteredPixels.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground space-y-3">
              <div className="p-3 bg-slate-100 rounded-full w-fit mx-auto text-slate-400">
                <Target className="h-8 w-8" />
              </div>
              <p className="font-semibold text-slate-800 text-base">No pixels found</p>
              <p className="text-xs max-w-sm mx-auto text-slate-500">
                {searchQuery
                  ? "No pixels match your search query."
                  : "Add your first Meta Pixel, Google Tag, or Custom Event Code to start tracking conversions."}
              </p>
              <Button onClick={() => handleOpenCreate('facebook')} size="sm" className="mt-2">
                <Plus className="h-4 w-4 mr-1.5" />
                Add Your First Pixel
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/75">
                    <TableHead className="w-[80px]">Status</TableHead>
                    <TableHead>Platform & Name</TableHead>
                    <TableHead>Pixel ID / Code Snippet</TableHead>
                    <TableHead>Trigger & Placement</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPixels.map((pixel) => (
                    <TableRow key={pixel.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Active Status Switch */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={pixel.isActive === 1}
                            onCheckedChange={() => handleToggleActive(pixel)}
                          />
                        </div>
                      </TableCell>

                      {/* Platform & Name */}
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {getTypeBadge(pixel.type)}
                            <span className="font-semibold text-sm text-slate-900">{pixel.name}</span>
                            {pixel.type === 'facebook' && pixel.isPrimary === 1 && (
                              <Badge className="bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-100 text-[11px] font-semibold gap-1">
                                <Star className="h-3 w-3 fill-amber-500 text-amber-600" />
                                Primary (Fallback)
                              </Badge>
                            )}
                          </div>
                          {pixel.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">{pixel.description}</p>
                          )}
                          {pixel.testEventCode && (
                            <p className="text-[11px] text-amber-700 font-mono bg-amber-50 px-1.5 py-0.5 rounded w-fit border border-amber-200">
                              Test Code: {pixel.testEventCode}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      {/* Pixel ID or Code */}
                      <TableCell>
                        {pixel.type !== 'custom_script' && pixel.pixelId ? (
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded border border-slate-200 text-slate-800 font-medium">
                              {pixel.pixelId}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-slate-400 hover:text-slate-700"
                              onClick={() => handleCopy(pixel.pixelId!, pixel.id)}
                            >
                              {copiedId === pixel.id ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                            </Button>
                          </div>
                        ) : (
                          <div className="max-w-[260px]">
                            <p className="font-mono text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded border border-slate-200 line-clamp-2">
                              {pixel.scriptCode?.substring(0, 120)}...
                            </p>
                          </div>
                        )}
                      </TableCell>

                      {/* Trigger & Placement */}
                      <TableCell>
                        <div className="flex flex-col gap-1 items-start">
                          {getTriggerBadge(pixel.triggerPage)}
                          <span className="text-[11px] text-slate-500 font-medium">
                            Position: <span className="font-mono">&lt;{pixel.placement}&gt;</span>
                          </span>
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {pixel.type === 'facebook' && pixel.isPrimary !== 1 && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-xs text-amber-700 border-amber-200 hover:bg-amber-50 hover:text-amber-800 gap-1"
                              onClick={() => handleSetPrimary(pixel)}
                              title="Set as default fallback pixel when ?pixel= is absent"
                            >
                              <Star className="h-3.5 w-3.5" />
                              Set Primary
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-600 hover:text-primary hover:bg-primary/10"
                            onClick={() => handleOpenEdit(pixel)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => setDeleteId(pixel.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Dialog: Add / Edit Pixel */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Target className="h-5 w-5 text-primary" />
              {editingPixel ? "Edit Tracking Pixel" : "Add New Tracking Pixel / Script"}
            </DialogTitle>
            <DialogDescription>
              Configure tracking ID or custom event code. The tracking tag activates automatically.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* Platform Type */}
            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Platform / Type
              </label>
              <Select
                value={form.type}
                onValueChange={(val: any) => setForm({ ...form, type: val })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select Platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="facebook">Meta (Facebook) Pixel</SelectItem>
                  <SelectItem value="google_analytics">Google Analytics 4 / Google Ads</SelectItem>
                  <SelectItem value="tiktok">TikTok Pixel</SelectItem>
                  <SelectItem value="custom_script">Custom Script / Event Code / HTML</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Pixel Name */}
            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Label / Pixel Name *
              </label>
              <Input
                placeholder="e.g. Primary Meta Pixel or Google Ads Tag"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1"
                required
              />
            </div>

            {/* Pixel ID for Standard Types */}
            {form.type !== 'custom_script' ? (
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  {form.type === 'facebook'
                    ? "Meta Pixel ID *"
                    : form.type === 'google_analytics'
                    ? "Measurement / Tag ID (G-xxxx or AW-xxxx) *"
                    : "TikTok Pixel ID *"}
                </label>
                <Input
                  placeholder={
                    form.type === 'facebook'
                      ? "e.g. 16-digit Meta Pixel ID"
                      : form.type === 'google_analytics'
                      ? "G-C3HYF0VYC0 or AW-123456789"
                      : "CXXXXXXXXXXXXXXX"
                  }
                  value={form.pixelId}
                  onChange={(e) => setForm({ ...form, pixelId: e.target.value })}
                  className="mt-1 font-mono text-sm"
                  required
                />
              </div>
            ) : (
              /* Custom Script / Event Code Textarea */
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Script / HTML / Event Code *
                </label>
                <Textarea
                  placeholder={`<script>\n  // Your custom pixel or event snippet here\n  fbq('trackCustom', 'CustomDiscountEvent');\n</script>`}
                  value={form.scriptCode}
                  onChange={(e) => setForm({ ...form, scriptCode: e.target.value })}
                  rows={6}
                  className="mt-1 font-mono text-xs"
                  required
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Supports &lt;script&gt; tags, plain JS code, and noscript fallbacks.
                </p>
              </div>
            )}

            {/* Optional Test Event Code for Meta */}
            {form.type === 'facebook' && (
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Meta Test Event Code (Optional)
                </label>
                <Input
                  placeholder="e.g. TEST12345 (From Meta Events Manager)"
                  value={form.testEventCode}
                  onChange={(e) => setForm({ ...form, testEventCode: e.target.value })}
                  className="mt-1 font-mono text-xs"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Use this when testing real-time browser & CAPI events inside Meta Events Manager.
                </p>
              </div>
            )}

            {/* Grid for Placement & Trigger Page */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Trigger on Page
                </label>
                <Select
                  value={form.triggerPage}
                  onValueChange={(val: any) => setForm({ ...form, triggerPage: val })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Pages (Global)</SelectItem>
                    <SelectItem value="checkout">Checkout Page (/checkout)</SelectItem>
                    <SelectItem value="success">Order Success / Thank You (/checkout/success)</SelectItem>
                    <SelectItem value="landing">Landing Pages (/lp/* & /products/*)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Code Placement
                </label>
                <Select
                  value={form.placement}
                  onValueChange={(val: any) => setForm({ ...form, placement: val })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="head">&lt;head&gt; (Recommended)</SelectItem>
                    <SelectItem value="body">&lt;body&gt; (Bottom of page)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description / Notes */}
            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Notes / Description (Optional)
              </label>
              <Input
                placeholder="e.g. Agency client pixel, retargeting campaign, or specific product promo"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="mt-1 text-sm"
              />
            </div>

            {/* Primary Fallback switch (Meta only) */}
            {form.type === 'facebook' && (
              <div className="flex items-center justify-between p-3 bg-amber-50/70 rounded-lg border border-amber-200">
                <div>
                  <p className="text-sm font-semibold text-amber-900 flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-amber-500 text-amber-600" />
                    Set as Primary / Default Fallback Pixel
                  </p>
                  <p className="text-xs text-amber-800/80">
                    Jab URL me ?pixel= parameter na ho, tab saare events is pixel par fallback honge.
                  </p>
                </div>
                <Switch
                  checked={form.isPrimary}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, isPrimary: checked, isActive: checked ? true : form.isActive })
                  }
                />
              </div>
            )}

            {/* Active switch */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
              <div>
                <p className="text-sm font-semibold text-slate-800">Activate Immediately</p>
                <p className="text-xs text-muted-foreground">Start firing events for this pixel right away</p>
              </div>
              <Switch
                checked={form.isActive}
                onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : editingPixel ? "Update Pixel" : "Save Pixel"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={Boolean(deleteId)} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete this tracking pixel from the database. It will immediately stop tracking site visitors.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? "Deleting..." : "Delete Pixel"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
