export const runtime = 'edge'
"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/hooks/use-toast"
import { Plus, Trash2, Edit, Upload, Loader2, ImageIcon, GripVertical } from "lucide-react"

const EMPTY = { title: "", subtitle: "", imageUrl: "", linkUrl: "/products", buttonText: "Shop Now", bgColor: "#1e40af", isActive: true, sortOrder: 0 }

function BannerForm({ initial, onSubmit, submitting, mode }: { initial: any; onSubmit: (d: any) => void; submitting: boolean; mode: "create" | "edit" }) {
    const [form, setForm] = useState(initial)
    const [uploading, setUploading] = useState(false)
    const fileRef = useRef<HTMLInputElement>(null)

    useEffect(() => setForm(initial), [initial])

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return
        setUploading(true)
        try {
            const fd = new FormData(); fd.append("file", file)
            const res = await fetch("/api/upload", { method: "POST", body: fd })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setForm({ ...form, imageUrl: data.url })
        } catch (err: any) {
            toast({ title: "Upload failed", description: err.message, variant: "destructive" })
        } finally { setUploading(false) }
    }

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(form) }} className="space-y-4">
            <div>
                <Label>Banner Title *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div>
                <Label>Subtitle</Label>
                <Input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="Short description under title" />
            </div>

            {/* Image upload */}
            <div>
                <Label>Banner Image</Label>
                <div className="mt-1 border-2 border-dashed border-gray-200 rounded-xl p-4">
                    {form.imageUrl && (
                        <div className="relative h-28 w-full mb-3 rounded-lg overflow-hidden">
                            <img src={form.imageUrl} alt="preview" className="w-full h-full object-cover" />
                        </div>
                    )}
                    <div className="flex gap-2 flex-wrap">
                        <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                            {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
                            {uploading ? "Uploading..." : "Upload Image"}
                        </Button>
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                    <Input className="mt-2 text-xs" placeholder="Or paste image URL..." value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <Label>Link URL</Label>
                    <Input value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} placeholder="/products" />
                </div>
                <div>
                    <Label>Button Text</Label>
                    <Input value={form.buttonText} onChange={(e) => setForm({ ...form, buttonText: e.target.value })} placeholder="Shop Now" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <Label>Background Color</Label>
                    <div className="flex gap-2 items-center">
                        <input type="color" value={form.bgColor} onChange={(e) => setForm({ ...form, bgColor: e.target.value })} className="h-9 w-12 rounded border cursor-pointer" />
                        <Input value={form.bgColor} onChange={(e) => setForm({ ...form, bgColor: e.target.value })} className="font-mono text-sm" />
                    </div>
                </div>
                <div>
                    <Label>Sort Order</Label>
                    <Input type="number" min="0" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} />
                </div>
            </div>

            <div className="flex items-center gap-3">
                <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} id="banner-active" />
                <Label htmlFor="banner-active">Active (shown on homepage)</Label>
            </div>

            <Button type="submit" className="w-full" disabled={submitting || uploading}>
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</> : mode === "create" ? "Create Banner" : "Save Changes"}
            </Button>
        </form>
    )
}

export default function BannersPage() {
    const [banners, setBanners] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [editBanner, setEditBanner] = useState<any | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const load = async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/banners?all=1")
            const data = await res.json()
            setBanners(Array.isArray(data) ? data : [])
        } catch { toast({ title: "Failed to load banners", variant: "destructive" }) }
        finally { setLoading(false) }
    }

    useEffect(() => { load() }, [])

    const handleCreate = async (form: any) => {
        setSubmitting(true)
        try {
            const res = await fetch("/api/banners", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
            if (!res.ok) throw new Error((await res.json()).error)
            toast({ title: "✅ Banner created!" }); setIsCreateOpen(false); load()
        } catch (err: any) { toast({ title: "Failed", description: err.message, variant: "destructive" }) }
        finally { setSubmitting(false) }
    }

    const handleUpdate = async (form: any) => {
        if (!editBanner) return
        setSubmitting(true)
        try {
            const res = await fetch(`/api/banners/${editBanner.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
            if (!res.ok) throw new Error((await res.json()).error)
            toast({ title: "✅ Banner updated!" }); setEditBanner(null); load()
        } catch (err: any) { toast({ title: "Failed", description: err.message, variant: "destructive" }) }
        finally { setSubmitting(false) }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this banner?")) return
        try {
            await fetch(`/api/banners/${id}`, { method: "DELETE" })
            toast({ title: "Banner deleted" }); load()
        } catch { toast({ title: "Failed to delete", variant: "destructive" }) }
    }

    const toggleActive = async (banner: any) => {
        try {
            await fetch(`/api/banners/${banner.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...banner, isActive: !banner.isActive }),
            })
            load()
        } catch { toast({ title: "Failed to toggle", variant: "destructive" }) }
    }

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Banners</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage homepage promotional banners</p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" />Add Banner</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                        <DialogHeader><DialogTitle>Create Banner</DialogTitle></DialogHeader>
                        <BannerForm initial={{ ...EMPTY }} onSubmit={handleCreate} submitting={submitting} mode="create" />
                    </DialogContent>
                </Dialog>
            </div>

            <Dialog open={!!editBanner} onOpenChange={(o) => { if (!o) setEditBanner(null) }}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>Edit Banner</DialogTitle></DialogHeader>
                    {editBanner && (
                        <BannerForm
                            initial={{ ...editBanner, isActive: Boolean(editBanner.isActive) }}
                            onSubmit={handleUpdate}
                            submitting={submitting}
                            mode="edit"
                        />
                    )}
                </DialogContent>
            </Dialog>

            <div className="bg-white rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-8"></TableHead>
                            <TableHead>Preview</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Link</TableHead>
                            <TableHead>Order</TableHead>
                            <TableHead>Active</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={7} className="text-center py-10"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                        ) : banners.length === 0 ? (
                            <TableRow><TableCell colSpan={7} className="text-center py-10 text-gray-500">No banners yet — add your first one!</TableCell></TableRow>
                        ) : banners.map((b) => (
                            <TableRow key={b.id}>
                                <TableCell><GripVertical className="h-4 w-4 text-gray-300" /></TableCell>
                                <TableCell>
                                    <div className="relative h-12 w-24 rounded overflow-hidden" style={{ background: b.bgColor || "#1e40af" }}>
                                        {b.imageUrl && <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover opacity-80" />}
                                        <span className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-bold px-1 text-center leading-tight">
                                            {b.title}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div>
                                        <p className="font-medium text-sm">{b.title}</p>
                                        {b.subtitle && <p className="text-xs text-muted-foreground line-clamp-1">{b.subtitle}</p>}
                                    </div>
                                </TableCell>
                                <TableCell className="text-sm text-blue-600">{b.linkUrl}</TableCell>
                                <TableCell className="text-sm">{b.sortOrder}</TableCell>
                                <TableCell>
                                    <Switch checked={Boolean(b.isActive)} onCheckedChange={() => toggleActive(b)} />
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <Button variant="ghost" size="icon" onClick={() => setEditBanner(b)}><Edit className="h-4 w-4 text-blue-500" /></Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(b.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
