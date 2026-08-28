"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { fetchProducts, createD1Product, updateD1Product, deleteD1Product, fetchCategories, reorderD1Products } from "@/lib/d1-client"
import { Plus, Search, Trash2, Edit, Loader2, Upload, ImageIcon, FileText, Video, Link as LinkIcon, File, X, ArrowUp, ArrowDown, ArrowUpDown, Save, Check } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import type { Product, DigitalAsset } from "@/lib/types"
import Image from "next/image"

const EMPTY_FORM = {
  title: "",
  description: "",
  price: "",
  originalPrice: "",
  category: "",
  imageUrl: "",
  downloadUrl: "",
  tags: "",
  isActive: true,
  displayOrder: "0",
}

type FormData = typeof EMPTY_FORM & { isActive: boolean }

function ProductForm({
  initial,
  categories,
  onSubmit,
  submitting,
  mode,
}: {
  initial: FormData
  categories: any[]
  onSubmit: (data: FormData) => void
  submitting: boolean
  mode: "create" | "edit"
}) {
  const [form, setForm] = useState<FormData>(initial)
  const [uploading, setUploading] = useState(false)
  const [digitalUploading, setDigitalUploading] = useState(false)
  const [imageStorageProvider, setImageStorageProvider] = useState<"vercel" | "tdrive">("vercel")
  const [digitalStorageProvider, setDigitalStorageProvider] = useState<"vercel" | "tdrive" | "external">("tdrive")
  const [digitalAssetType, setDigitalAssetType] = useState<DigitalAsset["type"]>("file")
  const [digitalAssetName, setDigitalAssetName] = useState("")
  const [digitalAssets, setDigitalAssets] = useState<DigitalAsset[]>([])
  const [preview, setPreview] = useState(initial.imageUrl || "")
  const fileRef = useRef<HTMLInputElement>(null)
  const digitalFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setForm(initial);
    setPreview(initial.imageUrl || "")

    let parsedAssets: DigitalAsset[] = []
    if (initial.downloadUrl) {
      try { parsedAssets = JSON.parse(initial.downloadUrl) }
      catch { parsedAssets = [{ id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2), name: "Legacy Download", type: "file", provider: "external", url: initial.downloadUrl }] }
    }
    setDigitalAssets(parsedAssets)
  }, [initial])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const endpoint = imageStorageProvider === "vercel" ? "/api/upload" : "/api/upload-tdrive"
      const res = await fetch(endpoint, { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload failed")

      const imageUrl = imageStorageProvider === "vercel" ? data.url : data.preview_url

      setForm({ ...form, imageUrl: imageUrl })
      setPreview(imageUrl)
      toast({ title: "✅ Image uploaded!" })
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" })
    } finally {
      setUploading(false)
    }
  }

  const handleDigitalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!digitalAssetName.trim()) {
      toast({ title: "Asset name required", description: "Please enter a name for the digital asset before uploading.", variant: "destructive" })
      return
    }
    setDigitalUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const endpoint = digitalStorageProvider === "vercel" ? "/api/upload" : "/api/upload-tdrive"
      const res = await fetch(endpoint, { method: "POST", body: fd })
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

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit({ ...form, downloadUrl: JSON.stringify(digitalAssets) }) }}
      className="space-y-4 max-h-[70vh] overflow-y-auto pr-1"
    >
      {/* Image Upload */}
      <div>
        <Label>Product Image</Label>
        <div className="mt-1 border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center gap-3">
          {preview ? (
            <div className="relative w-32 h-32">
              <Image src={preview} alt="preview" fill className="object-contain rounded-lg" />
            </div>
          ) : (
            <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
              <ImageIcon className="h-10 w-10 text-gray-300" />
            </div>
          )}
          <div className="flex gap-2 items-center">
            <Select value={imageStorageProvider} onValueChange={(v: "vercel" | "tdrive") => setImageStorageProvider(v)}>
              <SelectTrigger className="w-32 h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="vercel">Vercel Blob</SelectItem>
                <SelectItem value="tdrive">T-Drive API</SelectItem>
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
              {uploading ? "Uploading..." : "Upload Image"}
            </Button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          <Input
            className="text-xs"
            placeholder="Or paste image URL..."
            value={form.imageUrl}
            onChange={(e) => { setForm({ ...form, imageUrl: e.target.value }); setPreview(e.target.value) }}
          />
        </div>
      </div>

      <div>
        <Label>Title *</Label>
        <Textarea value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required rows={2} />
      </div>

      <div>
        <Label>Description</Label>
        <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Price (₹) *</Label>
          <Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
        </div>
        <div>
          <Label>Original Price (₹)</Label>
          <Input type="number" min="0" step="0.01" value={form.originalPrice} onChange={(e) => setForm({ ...form, originalPrice: e.target.value })} placeholder="For discount display" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label>Category *</Label>
          <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>
              ))}
              <SelectItem value="software">Software</SelectItem>
              <SelectItem value="template">Template</SelectItem>
              <SelectItem value="course">Course</SelectItem>
              <SelectItem value="ebook">E-Book</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Position (1 = top)</Label>
          <Input type="number" min="0" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: e.target.value })} placeholder="1, 2, 3..." />
        </div>
        <div>
          <Label>Tags (comma separated)</Label>
          <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="e.g. popular, new, sale" />
        </div>
      </div>

      {/* Digital Assets Section */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
        <div>
          <h3 className="font-semibold text-sm">Digital Assets ({digitalAssets.length})</h3>
        </div>

        {digitalAssets.length > 0 && (
          <div className="space-y-2">
            {digitalAssets.map(asset => (
              <div key={asset.id} className="flex items-center justify-between p-2 bg-white border rounded">
                <div className="flex items-center gap-2">
                  {asset.type === 'pdf' ? <FileText className="h-4 w-4 text-red-500" /> :
                    asset.type === 'video' ? <Video className="h-4 w-4 text-blue-500" /> :
                      asset.type === 'link' ? <LinkIcon className="h-4 w-4 text-green-500" /> :
                        <File className="h-4 w-4 text-gray-500" />}
                  <span className="text-sm font-medium line-clamp-1 max-w-[120px]">{asset.name}</span>
                  <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 uppercase">{asset.provider}</span>
                </div>
                <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-red-500 shrink-0" onClick={() => removeDigitalAsset(asset.id)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-3">
          <div className="grid grid-cols-2 gap-3 mt-1.5">
            <div>
              <Label className="text-xs">Asset Name *</Label>
              <Input value={digitalAssetName} onChange={e => setDigitalAssetName(e.target.value)} placeholder="e.g. Chapter 1" className="h-8 text-xs mt-1" />
            </div>
            <div>
              <Label className="text-xs">Asset Type</Label>
              <Select value={digitalAssetType} onValueChange={(v: any) => setDigitalAssetType(v)}>
                <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="file">Generic File</SelectItem>
                  <SelectItem value="pdf">PDF Document</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="link">External Link</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="flex justify-between items-center text-xs mb-1">
              <span>Source</span>
              <Select value={digitalStorageProvider} onValueChange={(v: any) => setDigitalStorageProvider(v)}>
                <SelectTrigger className="w-[120px] h-7 text-[10px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tdrive">T-Drive (Secure)</SelectItem>
                  <SelectItem value="vercel">Vercel Blob</SelectItem>
                  <SelectItem value="external">External URL</SelectItem>
                </SelectContent>
              </Select>
            </Label>

            {digitalStorageProvider === 'external' ? (
              <div className="flex gap-2">
                <Input value={form.downloadUrl} onChange={e => setForm({ ...form, downloadUrl: e.target.value })}
                  placeholder="https://..." type="url" className="flex-1 h-8 text-xs" />
                <Button type="button" size="sm" className="h-8 text-xs" onClick={addExternalDigitalLink} disabled={!digitalAssetName || !form.downloadUrl}>
                  Add
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="w-full text-xs h-8" onClick={() => {
                  if (!digitalAssetName.trim()) {
                    toast({ title: "Name required", description: "Enter a name first", variant: "destructive" })
                  } else {
                    digitalFileRef.current?.click()
                  }
                }} disabled={digitalUploading}>
                  {digitalUploading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Upload className="h-3 w-3 mr-1" />}
                  {digitalUploading ? "Uploading..." : `Upload to ${digitalStorageProvider === 'tdrive' ? 'T-Drive' : 'Vercel'}`}
                </Button>
                <input ref={digitalFileRef} type="file" className="hidden" onChange={handleDigitalUpload} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} id="isActive" />
        <Label htmlFor="isActive">Active (visible in store)</Label>
      </div>

      <Button type="submit" className="w-full" disabled={submitting || uploading || digitalUploading}>
        {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</> : mode === "create" ? "Create Product" : "Save Changes"}
      </Button>
    </form>
  )
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [savingOrder, setSavingOrder] = useState(false)
  const [isOrderChanged, setIsOrderChanged] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const [prods, cats] = await Promise.all([fetchProducts(), fetchCategories()])
      setProducts(prods)
      setCategories(cats)
      setIsOrderChanged(false)
    } catch {
      toast({ title: "Error loading data", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= products.length) return
    const newProds = [...products]
    const temp = newProds[index]
    newProds[index] = newProds[targetIndex]
    newProds[targetIndex] = temp
    newProds.forEach((p, idx) => {
      p.displayOrder = idx + 1
    })
    setProducts(newProds)
    setIsOrderChanged(true)
  }

  const handleOrderChange = (id: string, newOrderVal: number) => {
    setProducts((prev) => {
      const updated = prev.map((p) => (p.id === id ? { ...p, displayOrder: newOrderVal } : p))
      return updated.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
    })
    setIsOrderChanged(true)
  }

  const saveOrder = async () => {
    setSavingOrder(true)
    try {
      const items = products.map((p, idx) => ({
        id: p.id,
        displayOrder: typeof p.displayOrder === "number" && p.displayOrder > 0 ? p.displayOrder : idx + 1,
      }))
      await reorderD1Products({ items })
      toast({ title: "✅ Product arrangement saved!" })
      setIsOrderChanged(false)
      loadData()
    } catch (err: any) {
      toast({ title: "Failed to save order", description: err.message, variant: "destructive" })
    } finally {
      setSavingOrder(false)
    }
  }

  const handleCreate = async (form: FormData) => {
    setSubmitting(true)
    try {
      await createD1Product({
        ...form,
        price: parseFloat(form.price),
        originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : null,
        tags: form.tags.split(",").map((t: string) => t.trim()).filter(Boolean),
        isActive: form.isActive,
        displayOrder: parseInt(form.displayOrder, 10) || 0,
      })
      toast({ title: "✅ Product created!" })
      setIsCreateOpen(false)
      loadData()
    } catch (err: any) {
      toast({ title: "Failed to create product", description: err.message, variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async (form: FormData) => {
    if (!editProduct) return
    setSubmitting(true)
    try {
      await updateD1Product(editProduct.id, {
        ...form,
        price: parseFloat(form.price),
        originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : null,
        tags: form.tags.split(",").map((t: string) => t.trim()).filter(Boolean),
        isActive: form.isActive,
        displayOrder: parseInt(form.displayOrder, 10) || 0,
      })
      toast({ title: "✅ Product updated!" })
      setEditProduct(null)
      loadData()
    } catch (err: any) {
      toast({ title: "Failed to update product", description: err.message, variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product? This cannot be undone.")) return
    try {
      await deleteD1Product(id)
      toast({ title: "Product deleted" })
      loadData()
    } catch {
      toast({ title: "Failed to delete product", variant: "destructive" })
    }
  }

  const filtered = products.filter(
    (p) =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const editFormInitial = editProduct
    ? {
      title: editProduct.title,
      description: editProduct.description || "",
      price: String(editProduct.price),
      originalPrice: (editProduct as any).originalPrice ? String((editProduct as any).originalPrice) : "",
      category: editProduct.category,
      imageUrl: editProduct.imageUrl || "",
      downloadUrl: editProduct.downloadUrl || "",
      tags: Array.isArray(editProduct.tags) ? editProduct.tags.join(", ") : "",
      isActive: editProduct.isActive,
      displayOrder: editProduct.displayOrder ? String(editProduct.displayOrder) : "0",
    }
    : EMPTY_FORM as FormData

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Products Arrangement</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {products.length} total products. Rearrange products using ▲ ▼ or position inputs to set which appear first on website.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isOrderChanged && (
            <Button onClick={saveOrder} disabled={savingOrder} className="bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse">
              {savingOrder ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Product Order
            </Button>
          )}
          <Button asChild>
            <Link href="/admin/products/new"><Plus className="mr-2 h-4 w-4" />Add Product</Link>
          </Button>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editProduct} onOpenChange={(open) => { if (!open) setEditProduct(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Product</DialogTitle></DialogHeader>
          <ProductForm
            initial={editFormInitial}
            categories={categories}
            onSubmit={handleUpdate}
            submitting={submitting}
            mode="edit"
          />
        </DialogContent>
      </Dialog>

      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 bg-white p-2 rounded-md border max-w-sm w-full">
          <Search className="h-4 w-4 text-gray-500" />
          <Input
            className="border-0 focus-visible:ring-0 h-8"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {isOrderChanged && (
          <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-md border border-amber-200 flex items-center gap-1.5">
            <ArrowUpDown className="h-3.5 w-3.5" /> Order changed! Don't forget to click "Save Product Order".
          </span>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-44">Order / Position</TableHead>
              <TableHead>Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-10"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-10 text-gray-500">No products found</TableCell></TableRow>
            ) : (
              filtered.map((product, index) => (
                <TableRow key={product.id} className="hover:bg-slate-50/80 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-1 rounded min-w-[32px] text-center">
                        #{product.displayOrder || (index + 1)}
                      </span>
                      <div className="flex flex-col gap-0.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 p-0 hover:bg-slate-200"
                          disabled={index === 0}
                          onClick={() => handleMove(index, 'up')}
                          title="Move Up"
                        >
                          <ArrowUp className="h-3 w-3 text-slate-700" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 p-0 hover:bg-slate-200"
                          disabled={index === filtered.length - 1}
                          onClick={() => handleMove(index, 'down')}
                          title="Move Down"
                        >
                          <ArrowDown className="h-3 w-3 text-slate-700" />
                        </Button>
                      </div>
                      <Input
                        type="number"
                        min="1"
                        className="w-14 h-7 text-xs px-1 text-center"
                        value={product.displayOrder || (index + 1)}
                        onChange={(e) => handleOrderChange(product.id, parseInt(e.target.value, 10) || 1)}
                        title="Directly enter position number"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="relative h-10 w-10 rounded overflow-hidden bg-gray-50 border">
                      <Image
                        src={product.imageUrl || "/placeholder.svg"}
                        alt={product.title}
                        fill
                        className="object-contain"
                        sizes="40px"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium max-w-xs">
                    <span className="line-clamp-2 whitespace-pre-line">{product.title}</span>
                  </TableCell>
                  <TableCell className="capitalize">{product.category}</TableCell>
                  <TableCell>₹{product.price.toLocaleString("en-IN")}</TableCell>
                  <TableCell>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${product.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {product.isActive ? "Active" : "Hidden"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/admin/products/${product.id}/edit`}>
                          <Edit className="h-4 w-4 text-blue-500" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}