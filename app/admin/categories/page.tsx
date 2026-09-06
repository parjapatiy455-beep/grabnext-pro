"use client"
export const runtime = 'edge'

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { fetchCategories, createD1Category } from "@/lib/d1-client"
import { Plus, Loader2, Trash2, Edit, Upload, ImageIcon } from "lucide-react"
import { toast } from "@/hooks/use-toast"

const EMPTY = { name: "", description: "", imageUrl: "", isActive: true }

function CategoryForm({ initial, onSubmit, submitting, mode }: {
  initial: any; onSubmit: (d: any) => void; submitting: boolean; mode: "create" | "edit"
}) {
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
      if (!res.ok) throw new Error(data.error || "Upload failed")
      setForm({ ...form, imageUrl: data.url })
      toast({ title: "✅ Image uploaded!" })
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" })
    } finally { setUploading(false) }
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form) }} className="space-y-4">
      <div>
        <Label>Category Name *</Label>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      </div>
      <div>
        <Label>Description</Label>
        <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>

      {/* Image Upload */}
      <div>
        <Label>Category Image</Label>
        <div className="mt-1 border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center gap-3">
          {form.imageUrl ? (
            <div className="relative h-20 w-20 rounded-lg overflow-hidden">
              <img src={form.imageUrl} alt="preview" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="h-20 w-20 bg-gray-100 rounded-lg flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-gray-300" />
            </div>
          )}
          <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
            {uploading ? "Uploading..." : "Upload Image"}
          </Button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          <Input
            className="text-xs"
            placeholder="Or paste image URL..."
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} id="cat-active" />
        <Label htmlFor="cat-active">Active (visible in store)</Label>
      </div>

      <Button type="submit" className="w-full" disabled={submitting || uploading}>
        {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</> : mode === "create" ? "Create Category" : "Save Changes"}
      </Button>
    </form>
  )
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editCat, setEditCat] = useState<any | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const cats = await fetchCategories()
      setCategories(Array.isArray(cats) ? cats : [])
    } catch {
      toast({ title: "Error loading categories", variant: "destructive" })
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (form: any) => {
    setSubmitting(true)
    try {
      await createD1Category(form.name, form.description, form.imageUrl)
      toast({ title: "✅ Category created!" })
      setIsCreateOpen(false); load()
    } catch (err: any) {
      toast({ title: "Failed to create", description: err.message, variant: "destructive" })
    } finally { setSubmitting(false) }
  }

  const handleUpdate = async (form: any) => {
    if (!editCat) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/categories/${editCat.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast({ title: "✅ Category updated!" })
      setEditCat(null); load()
    } catch (err: any) {
      toast({ title: "Failed to update", description: err.message, variant: "destructive" })
    } finally { setSubmitting(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return
    try {
      await fetch(`/api/categories/${id}`, { method: "DELETE" })
      toast({ title: "Category deleted" }); load()
    } catch { toast({ title: "Failed to delete", variant: "destructive" }) }
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage product categories and their images</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add Category</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Add Category</DialogTitle></DialogHeader>
            <CategoryForm initial={{ ...EMPTY }} onSubmit={handleCreate} submitting={submitting} mode="create" />
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editCat} onOpenChange={(o) => { if (!o) setEditCat(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Category</DialogTitle></DialogHeader>
          {editCat && <CategoryForm initial={{ ...editCat, isActive: Boolean(editCat.isActive) }} onSubmit={handleUpdate} submitting={submitting} mode="edit" />}
        </DialogContent>
      </Dialog>

      <div className="bg-white rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
            ) : categories.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-gray-500">No categories yet. Add your first one!</TableCell></TableRow>
            ) : categories.map((cat) => (
              <TableRow key={cat.id}>
                <TableCell>
                  <div className="h-10 w-10 rounded-lg overflow-hidden bg-gray-50 border flex items-center justify-center">
                    {cat.imageUrl ? (
                      <img src={cat.imageUrl} alt={cat.name} className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-gray-300" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-semibold">{cat.name}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{cat.slug}</TableCell>
                <TableCell className="text-sm max-w-xs">
                  <span className="line-clamp-1">{cat.description}</span>
                </TableCell>
                <TableCell>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cat.isActive !== 0 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {cat.isActive !== 0 ? "Active" : "Hidden"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditCat(cat)}>
                      <Edit className="h-4 w-4 text-blue-500" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(cat.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
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