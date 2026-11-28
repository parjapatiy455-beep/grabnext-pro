"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { RichTextEditor } from "@/components/rich-text-editor"
import { toast } from "@/hooks/use-toast"
import { 
    ArrowLeft, Upload, Loader2, X, ImageIcon, Plus, 
    FileText, Video, Link as LinkIcon, File, Play, 
    ShieldCheck, CheckCircle2, ExternalLink
} from "lucide-react"
import { fetchCategories, clearProductsCache } from "@/lib/d1-client"
import { DigitalAsset } from "@/lib/types"
import { convertToWebP } from "@/lib/image-optimizer"
import { getVideoInfo, isValidVideoUrl } from "@/lib/video-utils"

interface ProductFormProps {
    mode: "create" | "edit"
    productId?: string
}

const sanitizeSlugInput = (raw: string) =>
    raw
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-")

const EMPTY = {
    title: "", 
    slug: "",
    description: "", 
    price: "", 
    originalPrice: "", 
    category: "",
    tags: "", 
    downloadUrl: "", 
    isActive: true, 
    images: [] as string[],
    videoUrl: "",
    proofImages: [] as string[],
    displayOrder: "0",
    enableDiscountPopup: false,
    discountPopupType: "percentage" as "percentage" | "fixed",
    discountPopupPercent: "50",
    discountPopupAmount: "50",
    discountPopupCoupon: "SAVE50",
    discountPopupTimerMinutes: "10",
    discountPopupDelaySeconds: "30",
    discountPopupHeadline: "",
    metaPixelId: "",
}

export function AdminProductForm({ mode, productId }: ProductFormProps) {
    const router = useRouter()
    const fileRef = useRef<HTMLInputElement>(null)
    const proofFileRef = useRef<HTMLInputElement>(null)
    const [form, setForm] = useState(EMPTY)
    const [categories, setCategories] = useState<any[]>([])
    const [submitting, setSubmitting] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [proofUploading, setProofUploading] = useState(false)
    const [imageStorageProvider, setImageStorageProvider] = useState<"vercel" | "tdrive">("vercel")
    const [digitalStorageProvider, setDigitalStorageProvider] = useState<"vercel" | "tdrive" | "external">("tdrive")
    const [digitalAssetType, setDigitalAssetType] = useState<DigitalAsset["type"]>("file")
    const [digitalAssetName, setDigitalAssetName] = useState("")
    const [digitalUploading, setDigitalUploading] = useState(false)
    const [digitalAssets, setDigitalAssets] = useState<DigitalAsset[]>([])
    const [loading, setLoading] = useState(mode === "edit")
    const [originalSlug, setOriginalSlug] = useState("")
    const [proofUrlInput, setProofUrlInput] = useState("")
    const [availablePixels, setAvailablePixels] = useState<Array<{ id: string; name: string; pixelId: string }>>([])
    const digitalFileRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        fetchCategories().then((cats: any) => setCategories(Array.isArray(cats) ? cats : []))
        fetch("/api/pixels")
            .then(r => r.json())
            .then((list: any) => {
                if (Array.isArray(list)) {
                    const fbList = list
                        .filter((item: any) => item.type === "facebook" && item.pixelId)
                        .map((item: any) => ({
                            id: item.id,
                            name: item.name,
                            pixelId: String(item.pixelId).trim(),
                        }))
                    setAvailablePixels(fbList)
                }
            })
            .catch(() => {})
    }, [])

    useEffect(() => {
        if (mode !== "edit" || !productId) return
        fetch(`/api/products/${productId}?admin=1`, { cache: 'no-store' })
            .then(r => r.json())
            .then(p => {
                let parsedAssets: DigitalAsset[] = []
                if (p.downloadUrl) {
                    try { parsedAssets = JSON.parse(p.downloadUrl) }
                    catch { parsedAssets = [{ id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2), name: "Legacy Download", type: "file", provider: "external", url: p.downloadUrl }] }
                }

                setForm({
                    title: p.title || "",
                    slug: p.slug || "",
                    description: p.description || "",
                    price: p.price?.toString() || "",
                    originalPrice: p.originalPrice?.toString() || "",
                    category: p.category || "",
                    tags: Array.isArray(p.tags) ? p.tags.join(", ") : "",
                    downloadUrl: p.downloadUrl || "",
                    isActive: p.isActive !== false,
                    images: Array.isArray(p.images) ? p.images : (p.imageUrl ? [p.imageUrl] : []),
                    videoUrl: p.videoUrl || "",
                    proofImages: Array.isArray(p.proofImages) ? p.proofImages : [],
                    displayOrder: p.displayOrder ? p.displayOrder.toString() : "0",
                    enableDiscountPopup: Boolean(p.enableDiscountPopup),
                    discountPopupType: (p.discountPopupType || "percentage") as "percentage" | "fixed",
                    discountPopupPercent: p.discountPopupPercent ? p.discountPopupPercent.toString() : "50",
                    discountPopupAmount: p.discountPopupAmount ? p.discountPopupAmount.toString() : "50",
                    discountPopupCoupon: p.discountPopupCoupon || "SAVE50",
                    discountPopupTimerMinutes: p.discountPopupTimerMinutes ? p.discountPopupTimerMinutes.toString() : "10",
                    discountPopupDelaySeconds: p.discountPopupDelaySeconds ? p.discountPopupDelaySeconds.toString() : "30",
                    discountPopupHeadline: p.discountPopupHeadline || "",
                    metaPixelId: p.metaPixelId || "",
                })
                setOriginalSlug(p.slug || "")
                setDigitalAssets(parsedAssets)
                setLoading(false)
            })
    }, [mode, productId])

    const handleUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return
        setUploading(true)
        const uploaded: string[] = []
        for (const rawFile of Array.from(files)) {
            try {
                // Automatically convert PNG/JPG to WebP for fast website load
                const file = await convertToWebP(rawFile, { maxWidth: 1200, maxHeight: 1200, quality: 0.85 })
                const fd = new FormData(); fd.append("file", file)
                const endpoint = imageStorageProvider === "vercel" ? "/api/upload" : "/api/upload-tdrive"
                const res = await fetch(endpoint, { method: "POST", body: fd })
                const data = await res.json()
                if (!res.ok) throw new Error(data.error || "Upload failed")
                const imageUrl = imageStorageProvider === "vercel" ? data.url : data.preview_url
                uploaded.push(imageUrl)
            } catch (err: any) {
                toast({ title: `Upload failed: ${rawFile.name}`, description: err.message, variant: "destructive" })
            }
        }
        setForm(f => ({ ...f, images: [...f.images, ...uploaded] }))
        setUploading(false)
        toast({ title: `✅ ${uploaded.length} image(s) optimized & uploaded as WebP!` })
    }

    const handleProofUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return
        setProofUploading(true)
        const uploaded: string[] = []
        for (const rawFile of Array.from(files)) {
            try {
                const file = await convertToWebP(rawFile, { maxWidth: 1200, maxHeight: 1200, quality: 0.85 })
                const fd = new FormData(); fd.append("file", file)
                const endpoint = imageStorageProvider === "vercel" ? "/api/upload" : "/api/upload-tdrive"
                const res = await fetch(endpoint, { method: "POST", body: fd })
                const data = await res.json()
                if (!res.ok) throw new Error(data.error || "Upload failed")
                const imageUrl = imageStorageProvider === "vercel" ? data.url : data.preview_url
                uploaded.push(imageUrl)
            } catch (err: any) {
                toast({ title: `Proof upload failed: ${rawFile.name}`, description: err.message, variant: "destructive" })
            }
        }
        setForm(f => ({ ...f, proofImages: [...f.proofImages, ...uploaded] }))
        setProofUploading(false)
        toast({ title: `✅ ${uploaded.length} proof screenshot(s) uploaded!` })
    }

    const handleAddProofUrl = () => {
        const val = proofUrlInput.trim()
        if (!val) return
        setForm(f => ({ ...f, proofImages: [...f.proofImages, val] }))
        setProofUrlInput("")
        toast({ title: "✅ Screenshot URL added!" })
    }

    const removeProofImage = (idx: number) => {
        setForm(f => ({ ...f, proofImages: f.proofImages.filter((_, i) => i !== idx) }))
    }

    const insertProofIntoDescription = (url: string) => {
        const snippet = `<figure class="my-4 text-center"><img src="${url}" alt="Customer Proof Screenshot" class="rounded-xl shadow-md max-w-full h-auto mx-auto border border-gray-200" /><figcaption class="text-xs text-gray-500 mt-1">Verified Customer Proof</figcaption></figure><p><br></p>`
        setForm(f => ({ ...f, description: (f.description || "") + snippet }))
        toast({ title: "✅ Screenshot inserted into description editor!" })
    }

    const handleDigitalUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return
        if (!digitalAssetName.trim()) {
            toast({ title: "Asset name required", description: "Please enter a name for the digital asset before uploading.", variant: "destructive" })
            return
        }
        setDigitalUploading(true)
        try {
            const formData = new FormData()
            formData.append("file", files[0])
            const endpoint = digitalStorageProvider === "vercel" ? "/api/upload" : "/api/upload-tdrive"
            const res = await fetch(endpoint, { method: "POST", body: formData })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Upload failed")

            const downloadUrl = digitalStorageProvider === "vercel" ? data.url : data.download_url

            const newAsset: DigitalAsset = {
                id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
                name: digitalAssetName.trim(),
                type: digitalAssetType,
                provider: digitalStorageProvider as any,
                url: downloadUrl
            }

            setDigitalAssets(prev => [...prev, newAsset])
            setDigitalAssetName("")
            if (digitalFileRef.current) digitalFileRef.current.value = ""
            toast({ title: `✅ ${digitalAssetType.toUpperCase()} asset added via ${digitalStorageProvider === "tdrive" ? "T-Drive" : "Vercel"}!` })
        } catch (err: any) {
            toast({ title: "Upload failed", description: err.message, variant: "destructive" })
        } finally {
            setDigitalUploading(false)
        }
    }

    const addExternalDigitalLink = () => {
        if (!digitalAssetName.trim() || !form.downloadUrl.trim()) return
        const newAsset: DigitalAsset = {
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
            name: digitalAssetName.trim(),
            type: digitalAssetType,
            provider: "external",
            url: form.downloadUrl.trim()
        }
        setDigitalAssets(prev => [...prev, newAsset])
        setDigitalAssetName("")
        setForm(f => ({ ...f, downloadUrl: "" }))
        toast({ title: "✅ External asset link added!" })
    }

    const removeDigitalAsset = (id: string) => {
        setDigitalAssets(prev => prev.filter(a => a.id !== id))
    }

    const removeImage = (idx: number) => setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }))

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.title.trim()) { toast({ title: "Title is required", variant: "destructive" }); return }
        if (!form.price || isNaN(Number(form.price))) { toast({ title: "Valid price required", variant: "destructive" }); return }

        setSubmitting(true)
        try {
            const cleanSlug = sanitizeSlugInput(form.slug || "").replace(/^-+|-+$/g, "")
            const body: Record<string, any> = {
                title: form.title.trim(),
                ...(cleanSlug ? { slug: cleanSlug } : {}),
                description: form.description,
                price: Number(form.price),
                originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
                category: form.category || "general",
                tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
                images: form.images,
                imageUrl: form.images[0] || "",
                videoUrl: form.videoUrl.trim() || null,
                proofImages: form.proofImages,
                downloadUrl: JSON.stringify(digitalAssets),
                isActive: form.isActive,
                displayOrder: parseInt(form.displayOrder, 10) || 0,
                pageType: "shop",
                enableDiscountPopup: form.enableDiscountPopup,
                discountPopupType: form.discountPopupType,
                discountPopupPercent: parseInt(form.discountPopupPercent, 10) || 50,
                discountPopupAmount: parseFloat(form.discountPopupAmount) || 0,
                discountPopupCoupon: (form.discountPopupCoupon || (form.discountPopupType === 'fixed' ? 'FLAT' : 'SAVE50')).trim().toUpperCase(),
                discountPopupTimerMinutes: parseInt(form.discountPopupTimerMinutes, 10) || 10,
                discountPopupDelaySeconds: parseInt(form.discountPopupDelaySeconds, 10) || 30,
                discountPopupHeadline: form.discountPopupHeadline?.trim() || null,
                metaPixelId: form.metaPixelId.trim() || null,
            }
            const url = mode === "edit" ? `/api/products/${productId}` : "/api/products"
            const method = mode === "edit" ? "PUT" : "POST"
            const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            clearProductsCache()
            toast({ title: mode === "edit" ? "✅ Product updated!" : "✅ Product created!" })
            router.push("/admin/products")
        } catch (err: any) {
            toast({ title: "Failed", description: err.message, variant: "destructive" })
        } finally {
            setSubmitting(false)
        }
    }

    const videoInfo = form.videoUrl ? getVideoInfo(form.videoUrl) : null

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Page Header */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/admin/products"><ArrowLeft className="h-5 w-5" /></Link>
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold">{mode === "edit" ? "Edit Product" : "Add New Product"}</h1>
                            <p className="text-xs text-gray-400">{mode === "edit" ? "Update product details & media" : "Fill in details to create a new product"}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" asChild><Link href="/admin/products">Cancel</Link></Button>
                        <Button type="submit" form="product-form" disabled={submitting || uploading || digitalUploading || proofUploading}>
                            {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</> : mode === "edit" ? "Save Changes" : "Create Product"}
                        </Button>
                    </div>
                </div>
            </div>

            <form id="product-form" onSubmit={handleSubmit} className="max-w-[1400px] mx-auto px-6 py-6 pb-20">
                <div className="space-y-6">
                    {/* Top Section: Info & Sidebar */}
                    <div className="grid lg:grid-cols-3 gap-6 items-start">
                        {/* Info Column */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Basic Info Card */}
                            <div className="bg-white rounded-2xl p-6 border shadow-sm space-y-5">
                                <div className="flex items-center gap-2 border-b pb-3">
                                    <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">1</div>
                                    <h2 className="font-semibold text-gray-800">Basic Information</h2>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <Label>Product Title *</Label>
                                        <Textarea
                                            value={form.title}
                                            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                            placeholder="e.g. Video Editing Mega Pack 2026 with Transitions & LUTs"
                                            className="mt-1.5 text-base min-h-[80px] border-gray-200 focus:ring-primary/20 transition-all"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between gap-2">
                                            <Label>Product Slug (URL)</Label>
                                            <div className="flex items-center gap-2">
                                                {mode === "edit" && originalSlug && form.slug !== originalSlug && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setForm(f => ({ ...f, slug: originalSlug }))}
                                                        className="text-[11px] font-medium text-slate-500 hover:text-slate-800 underline"
                                                    >
                                                        Reset to original
                                                    </button>
                                                )}
                                                {form.title && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const generated = sanitizeSlugInput(form.title).replace(/^-+|-+$/g, "")
                                                            if (generated) setForm(f => ({ ...f, slug: generated }))
                                                        }}
                                                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-700"
                                                    >
                                                        Generate from Title
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="mt-1.5 flex items-center rounded-md border border-gray-200 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-primary/20">
                                            <span className="px-3 py-2.5 text-xs font-mono text-gray-500 bg-slate-50 border-r border-gray-200 shrink-0 select-none">
                                                /products/
                                            </span>
                                            <Input
                                                value={form.slug}
                                                onChange={e => setForm(f => ({ ...f, slug: sanitizeSlugInput(e.target.value) }))}
                                                onBlur={() => setForm(f => ({ ...f, slug: sanitizeSlugInput(f.slug).replace(/^-+|-+$/g, "") }))}
                                                placeholder={mode === "create" ? "auto-generated-from-title (optional custom slug)" : "product-url-slug"}
                                                className="border-0 focus-visible:ring-0 h-10 text-sm font-mono"
                                            />
                                        </div>
                                        <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1 flex-wrap">
                                            <LinkIcon className="h-3 w-3 shrink-0" />
                                            <span>Live URL:</span>
                                            <span className="text-primary font-mono font-medium break-all">
                                                /products/{form.slug || (form.title ? `${sanitizeSlugInput(form.title).replace(/^-+|-+$/g, "")}-xxxxxx` : "your-product-slug")}
                                            </span>
                                        </p>
                                        {mode === "edit" && originalSlug && form.slug && form.slug !== originalSlug && (
                                            <p className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5 mt-1.5">
                                                Old link <span className="font-mono font-semibold">/products/{originalSlug}</span> will keep working automatically so running ads won&apos;t break.
                                            </p>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Selling Price (₹) *</Label>
                                            <div className="relative mt-1.5">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                                                <Input type="number" min="0" step="0.01" value={form.price}
                                                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                                                    placeholder="999" className="pl-7 h-11 border-gray-200" required />
                                            </div>
                                        </div>
                                        <div>
                                            <Label>Original Price (₹) <span className="text-gray-400 text-[10px] font-normal">(optional)</span></Label>
                                            <div className="relative mt-1.5">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                                                <Input type="number" min="0" step="0.01" value={form.originalPrice}
                                                    onChange={e => setForm(f => ({ ...f, originalPrice: e.target.value }))}
                                                    placeholder="1499" className="pl-7 h-11 border-gray-200" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <Label>Category *</Label>
                                            <select
                                                value={form.category}
                                                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                                                className="mt-1.5 h-11 w-full border border-gray-200 rounded-md px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                            >
                                                <option value="">-- Select Category --</option>
                                                {categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
                                                <option value="general">General</option>
                                            </select>
                                        </div>
                                        <div>
                                            <Label>Display Position <span className="text-gray-400 text-[10px] font-normal">(1 = top)</span></Label>
                                            <Input type="number" min="0" value={form.displayOrder} onChange={e => setForm(f => ({ ...f, displayOrder: e.target.value }))}
                                                placeholder="1, 2, 3..." className="mt-1.5 h-11 border-gray-200" />
                                        </div>
                                        <div>
                                            <Label>Tags <span className="text-gray-400 text-[10px] font-normal">(comma separated)</span></Label>
                                            <Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                                                placeholder="presets, editing, luts" className="mt-1.5 h-11 border-gray-200" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Customer Proof & Trust Screenshots Card */}
                            <div className="bg-white rounded-2xl p-6 border shadow-sm space-y-5">
                                <div className="flex items-center justify-between border-b pb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                                            <ShieldCheck className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <h2 className="font-semibold text-gray-800">Customer Proof & Trust Screenshots</h2>
                                            <p className="text-xs text-gray-400">WhatsApp chats, payment receipts, earnings proofs, or positive review screenshots</p>
                                        </div>
                                    </div>
                                    <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">
                                        {form.proofImages.length} Proofs Added
                                    </span>
                                </div>

                                {/* Proof Screenshots Grid */}
                                {form.proofImages.length > 0 && (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        {form.proofImages.map((proofUrl, idx) => (
                                            <div key={idx} className="relative group rounded-xl overflow-hidden border border-gray-200 bg-white aspect-[3/4] shadow-sm flex flex-col">
                                                <div className="flex-1 overflow-hidden relative">
                                                    <img src={proofUrl} alt={`Proof ${idx + 1}`} className="w-full h-full object-cover object-top" />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeProofImage(idx)}
                                                        className="absolute top-1.5 right-1.5 h-6 w-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition"
                                                        title="Remove screenshot"
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => insertProofIntoDescription(proofUrl)}
                                                    className="w-full py-1 text-[10px] bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 font-semibold transition border-t text-center"
                                                >
                                                    Insert in Text ↵
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Proof Upload Controls */}
                                <div className="space-y-3">
                                    <div className="grid sm:grid-cols-2 gap-3">
                                        {/* Upload from device */}
                                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                                            <Label className="text-xs font-semibold text-slate-600">Upload Screenshots from Device</Label>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="w-full h-10 border-dashed border-2 hover:bg-white text-xs"
                                                onClick={() => proofFileRef.current?.click()}
                                                disabled={proofUploading}
                                            >
                                                {proofUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2 text-emerald-600" />}
                                                {proofUploading ? "Optimizing & Uploading..." : "Choose Screenshots (Multi-select)"}
                                            </Button>
                                            <input
                                                ref={proofFileRef}
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                className="hidden"
                                                onChange={e => handleProofUpload(e.target.files)}
                                            />
                                            <p className="text-[10px] text-gray-400 text-center">Auto-converted to lightweight WebP</p>
                                        </div>

                                        {/* Add by URL */}
                                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                                            <Label className="text-xs font-semibold text-slate-600">Or Paste Screenshot URL</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="https://..."
                                                    value={proofUrlInput}
                                                    onChange={e => setProofUrlInput(e.target.value)}
                                                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAddProofUrl() } }}
                                                    className="h-10 text-xs bg-white"
                                                />
                                                <Button type="button" onClick={handleAddProofUrl} disabled={!proofUrlInput.trim()} className="h-10 px-3">
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <p className="text-[10px] text-gray-400 text-center">Direct link to hosted screenshot</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Digital Assets Section */}
                            <div className="bg-white rounded-2xl p-6 border shadow-sm space-y-5">
                                <div className="flex items-center gap-2 border-b pb-3">
                                    <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">2</div>
                                    <h2 className="font-semibold text-gray-800">Digital Assets (Downloads)</h2>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-4">
                                    {digitalAssets.length > 0 && (
                                        <div className="grid gap-2">
                                            {digitalAssets.map(asset => (
                                                <div key={asset.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded bg-slate-50 flex items-center justify-center">
                                                            {asset.type === 'pdf' ? <FileText className="h-4 w-4 text-red-500" /> :
                                                                asset.type === 'video' ? <Video className="h-4 w-4 text-blue-500" /> :
                                                                    asset.type === 'link' ? <LinkIcon className="h-4 w-4 text-green-500" /> :
                                                                        <File className="h-4 w-4 text-gray-500" />}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-semibold text-slate-800">{asset.name}</div>
                                                            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">{asset.provider} • {asset.type}</div>
                                                        </div>
                                                    </div>
                                                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => removeDigitalAsset(asset.id)}>
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Asset Name *</Label>
                                                <Input value={digitalAssetName} onChange={e => setDigitalAssetName(e.target.value)} placeholder="e.g. Masterclass Video Zip" className="h-10 mt-1.5" />
                                            </div>
                                            <div>
                                                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Asset Type</Label>
                                                <select
                                                    value={digitalAssetType}
                                                    onChange={e => setDigitalAssetType(e.target.value as any)}
                                                    className="w-full h-10 mt-1.5 border border-gray-200 rounded-md px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                >
                                                    <option value="file">Generic File</option>
                                                    <option value="pdf">PDF Document</option>
                                                    <option value="video">Video</option>
                                                    <option value="link">External Link</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                <span>Source Provider</span>
                                                <select
                                                    value={digitalStorageProvider}
                                                    onChange={e => setDigitalStorageProvider(e.target.value as any)}
                                                    className="border border-gray-200 rounded px-2 py-1 text-[10px] bg-slate-50"
                                                >
                                                    <option value="tdrive">T-Drive (Secure)</option>
                                                    <option value="vercel">Vercel Blob</option>
                                                    <option value="external">External Link</option>
                                                </select>
                                            </Label>

                                            {digitalStorageProvider === 'external' ? (
                                                <div className="flex gap-2">
                                                    <Input value={form.downloadUrl} onChange={e => setForm(f => ({ ...f, downloadUrl: e.target.value }))}
                                                        placeholder="https://..." type="url" className="flex-1 h-10" />
                                                    <Button type="button" onClick={addExternalDigitalLink} disabled={!digitalAssetName || !form.downloadUrl} className="h-10 px-6">
                                                        Add Link
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <Button type="button" variant="outline" className="w-full h-11 border-dashed border-2 hover:bg-slate-50 transition-all" onClick={() => {
                                                        if (!digitalAssetName.trim()) {
                                                            toast({ title: "Name required", description: "Enter a name first", variant: "destructive" })
                                                        } else {
                                                            digitalFileRef.current?.click()
                                                        }
                                                    }} disabled={digitalUploading}>
                                                        {digitalUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                                                        {digitalUploading ? "Uploading..." : `Click to upload to ${digitalStorageProvider === 'tdrive' ? 'T-Drive' : 'Vercel'}`}
                                                    </Button>
                                                    <input ref={digitalFileRef} type="file" className="hidden" onChange={e => handleDigitalUpload(e.target.files)} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar Column */}
                        <div className="space-y-6">
                            {/* Product Images Card */}
                            <div className="bg-white rounded-2xl p-6 border shadow-sm space-y-5">
                                <div className="flex items-center gap-2 border-b pb-3">
                                    <div className="h-8 w-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center font-bold">3</div>
                                    <h2 className="font-semibold text-gray-800">Product Images</h2>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    {form.images.map((url, i) => (
                                        <div key={i} className="relative group rounded-xl overflow-hidden border border-gray-100 aspect-square bg-slate-50 transition-all hover:ring-2 hover:ring-primary/20">
                                            <img src={url} alt={`Image ${i + 1}`} className="w-full h-full object-contain p-2" />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all" />
                                            {i === 0 && (
                                                <div className="absolute top-2 left-2 bg-primary text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-sm uppercase tracking-wider">Main</div>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => removeImage(i)}
                                                className="absolute top-2 right-2 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all shadow-md"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                    {form.images.length === 0 && (
                                        <div className="col-span-2 h-28 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400 bg-slate-50">
                                            <ImageIcon className="h-8 w-8 stroke-[1.5px]" />
                                            <p className="text-xs font-medium">No images uploaded</p>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3 pt-2">
                                    <div>
                                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Add Image by URL</Label>
                                        <div className="flex gap-2 mt-1.5">
                                            <Input
                                                placeholder="https://..."
                                                id="img-url-input"
                                                className="h-10 text-xs border-gray-200"
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        e.preventDefault()
                                                        const val = (e.target as HTMLInputElement).value.trim()
                                                        if (val) { setForm(f => ({ ...f, images: [...f.images, val] })); (e.target as HTMLInputElement).value = "" }
                                                    }
                                                }}
                                            />
                                            <Button type="button" variant="outline" className="h-10 px-3 border-gray-200" onClick={() => {
                                                const inp = document.getElementById("img-url-input") as HTMLInputElement
                                                if (inp?.value.trim()) { setForm(f => ({ ...f, images: [...f.images, inp.value.trim()] })); inp.value = "" }
                                            }}>
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="relative flex items-center py-1">
                                        <div className="flex-grow border-t border-slate-100"></div>
                                        <span className="flex-shrink mx-4 text-[10px] text-slate-300 font-bold uppercase tracking-widest text-center">or upload</span>
                                        <div className="flex-grow border-t border-slate-100"></div>
                                    </div>

                                    <div className="space-y-2">
                                        <select
                                            value={imageStorageProvider}
                                            onChange={e => setImageStorageProvider(e.target.value as any)}
                                            className="w-full border border-gray-200 rounded-md px-3 py-1.5 text-xs bg-slate-50"
                                        >
                                            <option value="vercel">Vercel Blob Storage</option>
                                            <option value="tdrive">T-Drive API Storage</option>
                                        </select>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            className="w-full h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 border-none transition-all"
                                            onClick={() => fileRef.current?.click()}
                                            disabled={uploading}
                                        >
                                            {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                                            {uploading ? "Uploading..." : "Upload from Device"}
                                        </Button>
                                        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
                                            onChange={e => handleUpload(e.target.files)} />
                                    </div>
                                </div>
                            </div>

                            {/* Product Video Card */}
                            <div className="bg-white rounded-2xl p-6 border shadow-sm space-y-4">
                                <div className="flex items-center justify-between border-b pb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold">
                                            <Video className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <h2 className="font-semibold text-gray-800">Product Video</h2>
                                            <p className="text-[11px] text-gray-400">Shows alongside photos on product page</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <Label className="text-xs font-semibold text-slate-600">Video Link (YouTube, Vimeo, Drive, MP4)</Label>
                                        <div className="relative mt-1.5">
                                            <Input
                                                type="url"
                                                value={form.videoUrl}
                                                onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value }))}
                                                placeholder="https://www.youtube.com/watch?v=... or .mp4"
                                                className="h-10 text-xs pr-8"
                                            />
                                            {form.videoUrl && (
                                                <button
                                                    type="button"
                                                    onClick={() => setForm(f => ({ ...f, videoUrl: "" }))}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-1">
                                            Supports YouTube, Shorts, Vimeo, Loom, Google Drive, or direct MP4 link.
                                        </p>
                                    </div>

                                    {/* Video Preview */}
                                    {videoInfo && (
                                        <div className="space-y-2 pt-1">
                                            <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                                                <span className="flex items-center gap-1.5 capitalize text-red-600">
                                                    <Play className="h-3 w-3 fill-current" /> {videoInfo.type} Video Active
                                                </span>
                                                <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">Ready</span>
                                            </div>
                                            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border shadow-sm">
                                                {videoInfo.type === 'direct' ? (
                                                    <video src={videoInfo.embedUrl} controls className="w-full h-full object-contain" />
                                                ) : (
                                                    <iframe
                                                        src={videoInfo.embedUrl}
                                                        className="w-full h-full border-0"
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                        allowFullScreen
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Urgency Countdown Timer & Discount Popup Card */}
                            <div className="bg-gradient-to-br from-amber-50/70 via-orange-50/40 to-purple-50/40 rounded-2xl p-6 border border-amber-200/80 shadow-sm space-y-4">
                                <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold shadow-sm">
                                            ⚡
                                        </div>
                                        <div>
                                            <h2 className="font-semibold text-gray-900 text-sm">Urgency Timer & Discount Popup</h2>
                                            <p className="text-[11px] text-gray-500">Live countdown urgency on product page + optional timed discount popup</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-medium text-slate-600">Discount Popup:</span>
                                        <Switch
                                            checked={form.enableDiscountPopup}
                                            onCheckedChange={(checked) => setForm((f) => ({ ...f, enableDiscountPopup: checked }))}
                                        />
                                    </div>
                                </div>

                                {/* Common Urgency Timer settings (active both with and without popup) */}
                                <div className="space-y-3 pt-1 text-xs">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <Label className="text-[11px] font-semibold text-slate-700">Urgency Timer (Minutes)</Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                max="180"
                                                value={form.discountPopupTimerMinutes}
                                                onChange={(e) => setForm((f) => ({ ...f, discountPopupTimerMinutes: e.target.value }))}
                                                placeholder="10"
                                                className="h-9 mt-1 text-xs bg-white border-amber-200"
                                            />
                                            <p className="text-[10px] text-gray-500 mt-1">Har user visit & page refresh par timer automatic reset hoga.</p>
                                        </div>
                                        <div>
                                            <Label className="text-[11px] font-semibold text-slate-700">Custom Headline (Optional)</Label>
                                            <Input
                                                value={form.discountPopupHeadline}
                                                onChange={(e) => setForm((f) => ({ ...f, discountPopupHeadline: e.target.value }))}
                                                placeholder={form.enableDiscountPopup ? "Special Deal: Flat 50% Off" : "Special Price Ending Soon — Price Will Increase!"}
                                                className="h-9 mt-1 text-xs bg-white border-amber-200 truncate"
                                            />
                                            <p className="text-[10px] text-gray-500 mt-1">Product page timer banner par ye headline show hogi.</p>
                                        </div>
                                    </div>

                                    {form.enableDiscountPopup ? (
                                        <div className="space-y-3 pt-2 border-t border-amber-200/50">
                                            <div className="p-2.5 bg-amber-100/70 border border-amber-300 rounded-xl text-amber-900 text-[11px]">
                                                <p className="font-semibold">🔥 Timed Discount Popup Active!</p>
                                                <p className="mt-0.5 text-amber-800">
                                                    User ke page visit karne ke <strong>{form.discountPopupDelaySeconds || "30"} second</strong> baad screen par flash popup aayega offering <strong>{form.discountPopupType === "fixed" ? `Flat ₹${form.discountPopupAmount || 0} OFF` : `${form.discountPopupPercent || 50}% OFF`}</strong>.
                                                </p>
                                            </div>

                                            {/* Discount Type Selector: Percentage vs Fixed Amount */}
                                            <div>
                                                <Label className="text-[11px] font-semibold text-slate-700">Discount Calculation Mode</Label>
                                                <div className="grid grid-cols-2 gap-2 mt-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setForm((f) => ({ ...f, discountPopupType: "percentage" }))}
                                                        className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                                            form.discountPopupType === "percentage"
                                                                ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                                                                : "bg-white text-slate-700 border-amber-200 hover:bg-amber-50"
                                                        }`}
                                                    >
                                                        <span>Percentage (% OFF)</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setForm((f) => ({ ...f, discountPopupType: "fixed" }))}
                                                        className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                                            form.discountPopupType === "fixed"
                                                                ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                                                                : "bg-white text-slate-700 border-amber-200 hover:bg-amber-50"
                                                        }`}
                                                    >
                                                        <span>Fixed Amount (₹ OFF)</span>
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                <div>
                                                    <Label className="text-[11px] font-semibold text-slate-700">Popup Delay (Seconds)</Label>
                                                    <Input
                                                        type="number"
                                                        min="3"
                                                        max="300"
                                                        value={form.discountPopupDelaySeconds}
                                                        onChange={(e) => setForm((f) => ({ ...f, discountPopupDelaySeconds: e.target.value }))}
                                                        placeholder="30"
                                                        className="h-9 mt-1 text-xs bg-white border-amber-200"
                                                    />
                                                    <p className="text-[10px] text-gray-500 mt-1">Kitne sec baad popup open hoga.</p>
                                                </div>
                                                <div>
                                                    <Label className="text-[11px] font-semibold text-slate-700">Coupon Code</Label>
                                                    <Input
                                                        value={form.discountPopupCoupon}
                                                        onChange={(e) => setForm((f) => ({ ...f, discountPopupCoupon: e.target.value.toUpperCase() }))}
                                                        placeholder={form.discountPopupType === "fixed" ? "FLAT50" : "SAVE50"}
                                                        className="h-9 mt-1 text-xs font-mono font-bold uppercase bg-white border-amber-200"
                                                    />
                                                    <p className="text-[10px] text-gray-500 mt-1">Claim karne par auto-apply hoga.</p>
                                                </div>
                                                {form.discountPopupType === "fixed" ? (
                                                    <div>
                                                        <Label className="text-[11px] font-semibold text-slate-700">Discount Amount (₹)</Label>
                                                        <div className="relative mt-1">
                                                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                                                            <Input
                                                                type="number"
                                                                min="1"
                                                                value={form.discountPopupAmount}
                                                                onChange={(e) => setForm((f) => ({ ...f, discountPopupAmount: e.target.value }))}
                                                                placeholder="50"
                                                                className="h-9 text-xs bg-white border-amber-200 pl-6"
                                                            />
                                                        </div>
                                                        <p className="text-[10px] text-gray-500 mt-1">Direct itne rupaye kam honge.</p>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <Label className="text-[11px] font-semibold text-slate-700">Discount %</Label>
                                                        <div className="relative mt-1">
                                                            <Input
                                                                type="number"
                                                                min="5"
                                                                max="95"
                                                                value={form.discountPopupPercent}
                                                                onChange={(e) => setForm((f) => ({ ...f, discountPopupPercent: e.target.value }))}
                                                                placeholder="50"
                                                                className="h-9 text-xs bg-white border-amber-200 pr-6"
                                                            />
                                                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                                                        </div>
                                                        <p className="text-[10px] text-gray-500 mt-1">Selling price par chhoot %.</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Live Calculation Preview */}
                                            {(() => {
                                                const sellingPrice = parseFloat(form.price) || 0
                                                if (sellingPrice <= 0) return null
                                                const previewDiscount = form.discountPopupType === "fixed"
                                                    ? Math.min(sellingPrice, parseFloat(form.discountPopupAmount) || 0)
                                                    : Math.round(sellingPrice * ((parseFloat(form.discountPopupPercent) || 50) / 100))
                                                const previewPayPrice = Math.max(1, sellingPrice - previewDiscount)
                                                return (
                                                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 text-xs flex flex-wrap items-center justify-between gap-2">
                                                        <div>
                                                            <span className="font-semibold text-emerald-800">Popup Offer Preview:</span>
                                                            <span className="text-slate-600 ml-1.5">Original: ₹{sellingPrice}</span>
                                                            <span className="text-red-500 font-bold ml-1.5">(-₹{previewDiscount})</span>
                                                        </div>
                                                        <div className="font-black text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-300">
                                                            Customer Pays: ₹{previewPayPrice}
                                                        </div>
                                                    </div>
                                                )
                                            })()}
                                        </div>
                                    ) : (
                                        <div className="p-2.5 bg-orange-50 border border-orange-200/80 rounded-xl text-[11px] text-orange-950">
                                            <p className="font-semibold text-orange-900">⚡ Always-On Urgency Banner Active (No Popup / No Coupon)</p>
                                            <p className="mt-0.5 text-orange-800">
                                                Popup OFF hai. Product page par bina kisi popup aur bina kisi coupon ke <strong>Urgency Countdown Timer</strong> hamesha chalega: <em>&ldquo;Special Price Ending Soon — Price Will Increase!&rdquo;</em> with original price & selling price.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Meta Pixel & Ad Account Isolation Card */}
                            <div className="bg-white rounded-2xl p-6 border shadow-sm space-y-4">
                                <div className="flex items-center gap-2 border-b pb-3">
                                    <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">4</div>
                                    <div>
                                        <h2 className="font-semibold text-gray-800 text-sm">Meta Pixel / Ad Account</h2>
                                        <p className="text-[11px] text-gray-400">Multi-Account Isolation (No Cross-Data)</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <Label className="text-xs font-semibold text-slate-700">Dedicated Meta Pixel for this Product</Label>
                                        <div className="mt-1.5 space-y-2">
                                            {availablePixels.length > 0 && (
                                                <select
                                                    value={form.metaPixelId}
                                                    onChange={(e) => setForm((f) => ({ ...f, metaPixelId: e.target.value }))}
                                                    className="w-full h-9 border border-gray-200 rounded-md px-3 text-xs bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                >
                                                    <option value="">Auto-Detect / Store Default Pixel</option>
                                                    {availablePixels.map((p) => (
                                                        <option key={p.id} value={p.pixelId}>
                                                            {p.name} ({p.pixelId})
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                            <Input
                                                value={form.metaPixelId}
                                                onChange={(e) => setForm((f) => ({ ...f, metaPixelId: e.target.value.trim() }))}
                                                placeholder="Or enter Pixel ID manually e.g. 2624044841356190"
                                                className="h-9 text-xs font-mono"
                                            />
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-1.5">
                                            Is product par aane wale visitors aur purchase ka event <strong>sirf isi Pixel ID</strong> ko jayega. Dusre ad accounts ke pixels par zero fake/cross events bhejenge!
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Status Card */}
                            <div className="bg-white rounded-2xl p-6 border shadow-sm space-y-4">
                                <div className="flex items-center gap-2 border-b pb-3">
                                    <div className="h-8 w-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center font-bold">5</div>
                                    <h2 className="font-semibold text-gray-800">Publishing</h2>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-semibold text-slate-800">Visibility</p>
                                        <p className="text-[10px] text-slate-400 font-medium">Show in store instantly</p>
                                    </div>
                                    <Switch
                                        checked={form.isActive}
                                        onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))}
                                    />
                                </div>
                                <div className={`flex items-center justify-center gap-2 text-xs font-bold py-3 rounded-xl transition-all ${form.isActive ? "bg-green-50 text-green-700 border border-green-100" : "bg-slate-100 text-slate-400 border border-slate-200"}`}>
                                    <div className={`h-2 w-2 rounded-full ${form.isActive ? "bg-green-500 animate-pulse" : "bg-slate-300"}`} />
                                    {form.isActive ? "PUBLISHED & LIVE" : "SAVED AS DRAFT"}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Section: Full Width Description */}
                    <div className="bg-white rounded-2xl p-8 border shadow-sm space-y-6">
                        <div className="flex items-center justify-between border-b pb-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg">
                                    <FileText className="h-6 w-6" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-xl text-gray-900 tracking-tight">Full Product Description</h2>
                                    <p className="text-sm text-gray-400 mt-0.5">
                                        Write manually in Visual Editor or switch to HTML Code mode to paste &amp; use custom HTML directly.
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="min-h-[400px]">
                            <RichTextEditor
                                value={form.description}
                                onChange={val => setForm(f => ({ ...f, description: val }))}
                                placeholder="Describe your product in detail here. You can click 'Add Screenshot' in the toolbar or paste screenshots with Ctrl+V..."
                                minHeight={400}
                            />
                        </div>
                    </div>
                </div>
            </form>
        </div>
    )
}
