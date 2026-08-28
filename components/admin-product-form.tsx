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
import { ArrowLeft, Upload, Loader2, X, ImageIcon, Plus, GripVertical, FileText, Video, Link as LinkIcon, File } from "lucide-react"
import { fetchCategories } from "@/lib/d1-client"
import { DigitalAsset } from "@/lib/types"

interface ProductFormProps {
    mode: "create" | "edit"
    productId?: string
}

const EMPTY = {
    title: "", description: "", price: "", originalPrice: "", category: "",
    tags: "", downloadUrl: "", isActive: true, images: [] as string[],
    displayOrder: "0",
}

export function AdminProductForm({ mode, productId }: ProductFormProps) {
    const router = useRouter()
    const fileRef = useRef<HTMLInputElement>(null)
    const [form, setForm] = useState(EMPTY)
    const [categories, setCategories] = useState<any[]>([])
    const [submitting, setSubmitting] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [imageStorageProvider, setImageStorageProvider] = useState<"vercel" | "tdrive">("vercel")
    const [digitalStorageProvider, setDigitalStorageProvider] = useState<"vercel" | "tdrive" | "external">("tdrive")
    const [digitalAssetType, setDigitalAssetType] = useState<DigitalAsset["type"]>("file")
    const [digitalAssetName, setDigitalAssetName] = useState("")
    const [digitalUploading, setDigitalUploading] = useState(false)
    const [digitalAssets, setDigitalAssets] = useState<DigitalAsset[]>([])
    const [loading, setLoading] = useState(mode === "edit")
    const digitalFileRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        fetchCategories().then((cats: any) => setCategories(Array.isArray(cats) ? cats : []))
    }, [])

    useEffect(() => {
        if (mode !== "edit" || !productId) return
        fetch(`/api/products/${productId}`)
            .then(r => r.json())
            .then(p => {
                let parsedAssets: DigitalAsset[] = []
                if (p.downloadUrl) {
                    try { parsedAssets = JSON.parse(p.downloadUrl) }
                    catch { parsedAssets = [{ id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2), name: "Legacy Download", type: "file", provider: "external", url: p.downloadUrl }] }
                }

                setForm({
                    title: p.title || "",
                    description: p.description || "",
                    price: p.price?.toString() || "",
                    originalPrice: p.originalPrice?.toString() || "",
                    category: p.category || "",
                    tags: Array.isArray(p.tags) ? p.tags.join(", ") : "",
                    downloadUrl: p.downloadUrl || "",
                    isActive: p.isActive !== false,
                    images: Array.isArray(p.images) ? p.images : (p.imageUrl ? [p.imageUrl] : []),
                    displayOrder: p.displayOrder ? p.displayOrder.toString() : "0",
                })
                setDigitalAssets(parsedAssets)
                setLoading(false)
            })
    }, [mode, productId])

    const handleUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return
        setUploading(true)
        const uploaded: string[] = []
        for (const file of Array.from(files)) {
            try {
                const fd = new FormData(); fd.append("file", file)
                const endpoint = imageStorageProvider === "vercel" ? "/api/upload" : "/api/upload-tdrive"
                const res = await fetch(endpoint, { method: "POST", body: fd })
                const data = await res.json()
                if (!res.ok) throw new Error(data.error || "Upload failed")
                const imageUrl = imageStorageProvider === "vercel" ? data.url : data.preview_url
                uploaded.push(imageUrl)
            } catch (err: any) {
                toast({ title: `Upload failed: ${file.name}`, description: err.message, variant: "destructive" })
            }
        }
        setForm(f => ({ ...f, images: [...f.images, ...uploaded] }))
        setUploading(false)
        toast({ title: `✅ ${uploaded.length} image(s) uploaded!` })
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
            const body = {
                title: form.title.trim(),
                description: form.description,
                price: Number(form.price),
                originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
                category: form.category || "general",
                tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
                images: form.images,
                imageUrl: form.images[0] || "",
                downloadUrl: JSON.stringify(digitalAssets), // Store assets as JSON
                isActive: form.isActive,
                displayOrder: parseInt(form.displayOrder, 10) || 0,
                pageType: "shop",
            }
            const url = mode === "edit" ? `/api/products/${productId}` : "/api/products"
            const method = mode === "edit" ? "PUT" : "POST"
            const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            toast({ title: mode === "edit" ? "✅ Product updated!" : "✅ Product created!" })
            router.push("/admin/products")
        } catch (err: any) {
            toast({ title: "Failed", description: err.message, variant: "destructive" })
        } finally {
            setSubmitting(false)
        }
    }

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
                            <p className="text-xs text-gray-400">{mode === "edit" ? "Update product details" : "Fill in details to create a new product"}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" asChild><Link href="/admin/products">Cancel</Link></Button>
                        <Button type="submit" form="product-form" disabled={submitting || uploading || digitalUploading}>
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
                                            placeholder="e.g. Samsung Galaxy S24 Ultra 256GB"
                                            className="mt-1.5 text-base min-h-[80px] border-gray-200 focus:ring-primary/20 transition-all"
                                            required
                                        />
                                        {form.title && (
                                            <p className="text-[10px] text-gray-400 mt-1.5 flex items-center gap-1">
                                                <LinkIcon className="h-2.5 w-2.5" /> URL: <span className="text-primary font-medium">/products/{form.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '-')}-xxxxxx</span>
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
                                                placeholder="electronics, gadget, phone" className="mt-1.5 h-11 border-gray-200" />
                                        </div>
                                    </div>
                                </div>
                            </div>
 
                            {/* Digital Assets Section */}
                            <div className="bg-white rounded-2xl p-6 border shadow-sm space-y-5">
                                <div className="flex items-center gap-2 border-b pb-3">
                                    <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">2</div>
                                    <h2 className="font-semibold text-gray-800">Digital Assets</h2>
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
                                                <Input value={digitalAssetName} onChange={e => setDigitalAssetName(e.target.value)} placeholder="e.g. Chapter 1 Video" className="h-10 mt-1.5" />
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
                            {/* Images Card */}
                            <div className="bg-white rounded-2xl p-6 border shadow-sm space-y-5">
                                <div className="flex items-center gap-2 border-b pb-3">
                                    <div className="h-8 w-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center font-bold">3</div>
                                    <h2 className="font-semibold text-gray-800">Media</h2>
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
                                        <div className="col-span-2 h-32 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400 bg-slate-50">
                                            <ImageIcon className="h-8 w-8 stroke-[1.5px]" />
                                            <p className="text-xs font-medium">No images uploaded</p>
                                        </div>
                                    )}
                                </div>
 
                                <div className="space-y-3 pt-2">
                                    <div>
                                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Add by URL</Label>
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
 
                                    <div className="relative flex items-center py-2">
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
 
                            {/* Status Card */}
                            <div className="bg-white rounded-2xl p-6 border shadow-sm space-y-4">
                                <div className="flex items-center gap-2 border-b pb-3">
                                    <div className="h-8 w-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center font-bold">4</div>
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
                                    <p className="text-sm text-gray-400 mt-0.5">Write a compelling story about your product. Use headings and tools for better formatting.</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="min-h-[400px]">
                            <RichTextEditor
                                value={form.description}
                                onChange={val => setForm(f => ({ ...f, description: val }))}
                                placeholder="Describe your product in detail here..."
                                minHeight={400}
                            />
                        </div>
                    </div>
                </div>
            </form>
        </div>
    )
}
