export const runtime = 'edge'
"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { Ticket, Plus, Trash2, Shield, Loader2, Percent, IndianRupee, Calendar, CheckCircle2, XCircle } from "lucide-react"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"

export default function CouponsAdminPage() {
    const [coupons, setCoupons] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    
    const [form, setForm] = useState({
        code: "",
        type: "percentage", // percentage or fixed
        value: "",
        isActive: true
    })

    const loadCoupons = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/coupons', { cache: 'no-store' })
            if (!res.ok) {
                const d = await res.json().catch(() => ({}))
                throw new Error(d.error || 'Failed to load coupons')
            }
            const data = await res.json()
            setCoupons(Array.isArray(data) ? data : [])
        } catch (error: any) {
            console.error(error)
            toast({ title: "Error", description: error.message || "Failed to load coupons", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { loadCoupons() }, [])

    const handleCreateCoupon = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.code.trim() || !form.value) {
            return toast({ title: "Validation Error", description: "All fields are required", variant: "destructive" })
        }

        setSubmitting(true)
        try {
            const res = await fetch('/api/admin/coupons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: form.code,
                    type: form.type,
                    value: Number(form.value),
                    isActive: form.isActive
                })
            })

            const data = await res.json()
            if (!res.ok) {
                throw new Error(data.error || 'Failed to create coupon')
            }

            toast({ title: "✅ Coupon created!", description: `Coupon ${form.code.toUpperCase()} is now active.` })
            setIsCreateOpen(false)
            setForm({ code: "", type: "percentage", value: "", isActive: true })
            loadCoupons()
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" })
        } finally {
            setSubmitting(false)
        }
    }

    const handleToggleStatus = async (code: string, currentStatus: boolean | number) => {
        const nextStatus = !currentStatus
        try {
            const res = await fetch('/api/admin/coupons', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, isActive: nextStatus })
            })

            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error(data.error || 'Failed to toggle status')
            }

            toast({ title: "Status Updated", description: `Coupon ${code} status changed.` })
            setCoupons(prev => prev.map(c => c.code === code ? { ...c, isActive: nextStatus ? 1 : 0 } : c))
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" })
        }
    }

    const handleDeleteCoupon = async (code: string) => {
        if (!confirm(`Are you sure you want to delete coupon ${code}? This action cannot be undone.`)) return
        try {
            const res = await fetch('/api/admin/coupons', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code })
            })

            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error(data.error || 'Failed to delete coupon')
            }

            toast({ title: "Coupon Deleted", description: `Coupon ${code} was removed.` })
            setCoupons(prev => prev.filter(c => c.code !== code))
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" })
        }
    }

    const totalCount = coupons.length
    const activeCount = coupons.filter(c => c.isActive === 1 || c.isActive === true).length
    const inactiveCount = totalCount - activeCount

    return (
        <div className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Coupons & Discount Codes</h1>
                    <p className="text-sm text-muted-foreground mt-1">Create, delete, and manage promo codes for checkout discount validation.</p>
                </div>
                
                {/* Create Coupon Dialog Trigger */}
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="w-fit">
                            <Plus className="mr-2 h-4 w-4" /> Add Discount Code
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md rounded-2xl p-6">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                <Ticket className="h-5 w-5 text-primary" />
                                Create Coupon Code
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Setup code settings for checkout validation.
                            </DialogDescription>
                        </DialogHeader>
                        
                        <form onSubmit={handleCreateCoupon} className="space-y-4 mt-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700 block">Coupon Code *</label>
                                <Input
                                    placeholder="e.g. SAVE50"
                                    value={form.code}
                                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                                    required
                                    className="uppercase font-mono font-bold"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-gray-700 block">Discount Type *</label>
                                    <select
                                        value={form.type}
                                        onChange={(e) => setForm({ ...form, type: e.target.value })}
                                        className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    >
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed">Fixed Amount (₹)</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-gray-700 block">Discount Value *</label>
                                    <Input
                                        type="number"
                                        placeholder={form.type === 'percentage' ? "e.g. 50" : "e.g. 100"}
                                        value={form.value}
                                        onChange={(e) => setForm({ ...form, value: e.target.value })}
                                        required
                                        min="1"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <input
                                    type="checkbox"
                                    id="coupon-active"
                                    checked={form.isActive}
                                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <label htmlFor="coupon-active" className="text-sm font-semibold text-gray-700 cursor-pointer select-none">
                                    Active immediately (shown/usable on checkout)
                                </label>
                            </div>

                            <div className="flex gap-2.5 pt-3 justify-end">
                                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={submitting} className="min-w-[100px]">
                                    {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    Create Code
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Quick stats grid */}
            <div className="grid gap-4 sm:grid-cols-3">
                <Card className="shadow-sm hover:shadow transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Coupon Codes</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                            <Ticket className="h-4 w-4 text-blue-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">{loading ? "..." : totalCount}</div>
                        <p className="text-[10px] text-muted-foreground mt-1">All discount codes created</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm hover:shadow transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active Coupons</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">{loading ? "..." : activeCount}</div>
                        <p className="text-[10px] text-muted-foreground mt-1">Codes usable by shoppers right now</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm hover:shadow transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Inactive Coupons</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-slate-50 dark:bg-slate-900/20 flex items-center justify-center">
                            <XCircle className="h-4 w-4 text-slate-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">{loading ? "..." : inactiveCount}</div>
                        <p className="text-[10px] text-muted-foreground mt-1">Codes disabled or expired</p>
                    </CardContent>
                </Card>
            </div>

            {/* List Table Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50/70 dark:bg-slate-800/40">
                        <TableRow>
                            <TableHead className="font-bold text-gray-800 dark:text-gray-200">Coupon Code</TableHead>
                            <TableHead className="font-bold text-gray-800 dark:text-gray-200">Discount Type</TableHead>
                            <TableHead className="font-bold text-gray-800 dark:text-gray-200">Discount Value</TableHead>
                            <TableHead className="font-bold text-gray-800 dark:text-gray-200">Status</TableHead>
                            <TableHead className="font-bold text-gray-800 dark:text-gray-200">Created At</TableHead>
                            <TableHead className="font-bold text-gray-855 dark:text-gray-200 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-12">
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground text-sm">
                                        <span className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                                        Loading coupons database...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : coupons.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm italic">
                                    No coupons created yet. Click "Add Discount Code" to create one.
                                </TableCell>
                            </TableRow>
                        ) : (
                            coupons.map((coupon) => {
                                const isActive = coupon.isActive === 1 || coupon.isActive === true
                                return (
                                    <TableRow key={coupon.code} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                        {/* Code */}
                                        <TableCell className="font-mono font-bold text-sm tracking-wide text-slate-900 dark:text-white uppercase select-all">
                                            {coupon.code}
                                        </TableCell>

                                        {/* Type */}
                                        <TableCell>
                                            {coupon.type === 'percentage' ? (
                                                <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30 font-semibold px-2 py-0.5 text-xs rounded">
                                                    <Percent className="h-3 w-3 mr-1 inline shrink-0" /> Percentage
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-sky-50 text-sky-700 hover:bg-sky-50 border-sky-200 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900/30 font-semibold px-2 py-0.5 text-xs rounded">
                                                    <IndianRupee className="h-3 w-3 mr-1 inline shrink-0" /> Fixed Amount
                                                </Badge>
                                            )}
                                        </TableCell>

                                        {/* Value */}
                                        <TableCell className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                                            {coupon.type === 'percentage' ? `${coupon.value}%` : `₹${coupon.value}`}
                                        </TableCell>

                                        {/* Status */}
                                        <TableCell>
                                            <button 
                                                onClick={() => handleToggleStatus(coupon.code, coupon.isActive)}
                                                className="cursor-pointer"
                                                title="Click to toggle status"
                                            >
                                                {isActive ? (
                                                    <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-2.5 py-0.5 text-xs border border-emerald-600/10">
                                                        Active
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-slate-400 hover:bg-slate-500 text-white font-semibold px-2.5 py-0.5 text-xs border border-slate-500/10">
                                                        Inactive
                                                    </Badge>
                                                )}
                                            </button>
                                        </TableCell>

                                        {/* Date Created */}
                                        <TableCell className="text-xs text-muted-foreground font-medium">
                                            {coupon.createdAt ? (
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                                    {format(new Date(coupon.createdAt), "MMM d, yyyy")}
                                                </span>
                                            ) : "—"}
                                        </TableCell>

                                        {/* Delete Action */}
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-500 hover:text-red-650"
                                                title="Delete Coupon"
                                                onClick={() => handleDeleteCoupon(coupon.code)}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
