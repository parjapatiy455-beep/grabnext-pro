"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { Shield, ShieldOff, Trash2, Users, Search, MapPin, Phone, Calendar, Mail, User, Info, FileText } from "lucide-react"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

export default function UsersAdminPage() {
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [roleFilter, setRoleFilter] = useState("all")
    const [typeFilter, setTypeFilter] = useState("all")
    const [selectedUser, setSelectedUser] = useState<any | null>(null)

    const loadUsers = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/users', { cache: 'no-store' })
            if (!res.ok) {
                const d = await res.json().catch(() => ({}))
                throw new Error(d.error || 'Failed to load users')
            }
            const data = await res.json()
            setUsers(Array.isArray(data) ? data : [])
        } catch (error: any) {
            console.error(error)
            toast({ title: "Error", description: error.message || "Failed to load users", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { loadUsers() }, [])

    const handleToggleRole = async (uid: string, currentRole: string) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin'
        try {
            const res = await fetch('/api/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid, role: newRole })
            })
            if (!res.ok) {
                const d = await res.json().catch(() => ({}))
                throw new Error(d.error || 'Failed to update role')
            }
            toast({ title: "Success", description: `User role is now ${newRole}` })
            
            // Update local state without reloading everything immediately
            setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role: newRole } : u))
            if (selectedUser && selectedUser.uid === uid) {
                setSelectedUser((prev: any) => prev ? { ...prev, role: newRole } : null)
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" })
        }
    }

    const handleDelete = async (uid: string, email: string) => {
        if (!confirm(`Delete user ${email}? This cannot be undone.`)) return
        try {
            const res = await fetch('/api/users', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid })
            })
            if (!res.ok) {
                const d = await res.json().catch(() => ({}))
                throw new Error(d.error || 'Failed to delete user')
            }
            toast({ title: "User deleted", description: `${email} has been removed` })
            setUsers(prev => prev.filter(u => u.uid !== uid))
            if (selectedUser && selectedUser.uid === uid) {
                setSelectedUser(null)
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" })
        }
    }

    // Stats calculations
    const totalCount = users.length
    const adminCount = users.filter(u => u.role === 'admin').length
    const guestCount = users.filter(u => u.isGuest === 1 || u.isGuest === true).length
    const registeredCount = totalCount - guestCount

    // Dynamic Client Filtering
    const filteredUsers = users.filter(user => {
        const query = searchQuery.toLowerCase().trim()
        const matchesSearch = 
            !query ||
            user.email?.toLowerCase().includes(query) ||
            user.displayName?.toLowerCase().includes(query) ||
            user.phone?.toLowerCase().includes(query) ||
            user.city?.toLowerCase().includes(query) ||
            user.state?.toLowerCase().includes(query) ||
            user.country?.toLowerCase().includes(query)

        const matchesRole = roleFilter === "all" || user.role === roleFilter
        const matchesType = typeFilter === "all" || 
            (typeFilter === "guest" && (user.isGuest === 1 || user.isGuest === true)) ||
            (typeFilter === "registered" && (user.isGuest !== 1 && user.isGuest !== true))

        return matchesSearch && matchesRole && matchesType
    })

    const getUserInitials = (name: string) => {
        if (!name) return "?"
        return name
            .split(" ")
            .map(part => part[0])
            .slice(0, 2)
            .join("")
            .toUpperCase()
    }

    return (
        <div className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Users Management</h1>
                    <p className="text-sm text-muted-foreground mt-1">View details, search, filter, and manage registered members and guest accounts.</p>
                </div>
                <Button onClick={loadUsers} variant="outline" size="sm" className="w-fit self-end">
                    Refresh List
                </Button>
            </div>

            {/* Quick stats grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="shadow-sm hover:shadow transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Accounts</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                            <Users className="h-4 w-4 text-blue-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">{loading ? "..." : totalCount}</div>
                        <p className="text-[10px] text-muted-foreground mt-1">All database user profiles</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm hover:shadow transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Registered Users</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                            <User className="h-4 w-4 text-purple-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">{loading ? "..." : registeredCount}</div>
                        <p className="text-[10px] text-muted-foreground mt-1">Regular email/password members</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm hover:shadow transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Guest Checkouts</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                            <Users className="h-4 w-4 text-amber-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">{loading ? "..." : guestCount}</div>
                        <p className="text-[10px] text-muted-foreground mt-1">Created automatically during purchase</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm hover:shadow transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Admins</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                            <Shield className="h-4 w-4 text-orange-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">{loading ? "..." : adminCount}</div>
                        <p className="text-[10px] text-muted-foreground mt-1">Full control administrators</p>
                    </CardContent>
                </Card>
            </div>

            {/* Controls Bar: Search & Filters */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border flex flex-col md:flex-row gap-4 items-center">
                <div className="relative w-full md:flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search by Name, Email, Phone, or City/Country..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-10 w-full"
                    />
                </div>
                <div className="flex flex-wrap gap-3 w-full md:w-auto shrink-0">
                    <div className="flex flex-col gap-1 w-full sm:w-[150px]">
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-gray-700 dark:text-gray-200 outline-none"
                        >
                            <option value="all">All Account Types</option>
                            <option value="registered">Registered Only</option>
                            <option value="guest">Guests Only</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1 w-full sm:w-[150px]">
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-gray-700 dark:text-gray-200 outline-none"
                        >
                            <option value="all">All Roles</option>
                            <option value="user">User Role</option>
                            <option value="admin">Admin Role</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50/70 dark:bg-slate-800/40">
                        <TableRow>
                            <TableHead className="font-bold text-gray-800 dark:text-gray-200">User Details</TableHead>
                            <TableHead className="font-bold text-gray-800 dark:text-gray-200">Phone</TableHead>
                            <TableHead className="font-bold text-gray-800 dark:text-gray-200">Type</TableHead>
                            <TableHead className="font-bold text-gray-800 dark:text-gray-200">Role</TableHead>
                            <TableHead className="font-bold text-gray-800 dark:text-gray-200">Location</TableHead>
                            <TableHead className="font-bold text-gray-800 dark:text-gray-200">Joined</TableHead>
                            <TableHead className="font-bold text-gray-855 dark:text-gray-200 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-12">
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground text-sm">
                                        <span className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                                        Loading users database...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-sm italic">
                                    No users match your search and filter criteria.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((user) => {
                                const isGuest = user.isGuest === 1 || user.isGuest === true
                                return (
                                    <TableRow key={user.uid} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                        {/* Name & Email Details */}
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 text-xs shrink-0 select-none shadow-inner">
                                                    {getUserInitials(user.displayName)}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-semibold text-gray-900 dark:text-white truncate max-w-[180px] text-sm">
                                                        {user.displayName || "No Name"}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground truncate max-w-[200px] flex items-center gap-1">
                                                        <Mail className="h-3 w-3 shrink-0" />
                                                        {user.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        
                                        {/* Phone details */}
                                        <TableCell className="text-sm font-medium">
                                            {user.phone ? (
                                                <span className="flex items-center gap-1">
                                                    <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                                                    {user.phone}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground italic text-xs">—</span>
                                            )}
                                        </TableCell>

                                        {/* Account Type (Guest / Registered) */}
                                        <TableCell>
                                            {isGuest ? (
                                                <Badge variant="outline" className="bg-amber-50 text-amber-700 hover:bg-amber-50 border-amber-250 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30 font-semibold px-2 py-0.5 text-[11px] rounded-md">
                                                    Guest
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-purple-50 text-purple-700 hover:bg-purple-50 border-purple-250 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30 font-semibold px-2 py-0.5 text-[11px] rounded-md">
                                                    Member
                                                </Badge>
                                            )}
                                        </TableCell>

                                        {/* System Role Badge */}
                                        <TableCell>
                                            <Badge 
                                                variant="outline"
                                                className={`font-semibold px-2 py-0.5 text-[11px] rounded-md ${
                                                    user.role === 'admin' 
                                                        ? 'bg-rose-50 text-rose-700 border-rose-250 dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-900/30' 
                                                        : 'bg-slate-50 text-slate-700 border-slate-250 dark:bg-slate-800/40 dark:text-slate-400'
                                                }`}
                                            >
                                                {user.role}
                                            </Badge>
                                        </TableCell>

                                        {/* Location details */}
                                        <TableCell className="text-sm">
                                            {user.city || user.country ? (
                                                <span className="flex items-center gap-1 text-xs truncate max-w-[150px]" title={`${user.address || ""}, ${user.city || ""}, ${user.state || ""}, ${user.country || ""}`}>
                                                    <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                                                    {user.city}{user.country ? `, ${user.country}` : ""}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground italic text-xs">—</span>
                                            )}
                                        </TableCell>

                                        {/* Date Joined */}
                                        <TableCell className="text-xs text-muted-foreground font-medium">
                                            {user.createdAt ? (
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
                                                    {format(new Date(user.createdAt), "MMM d, yyyy")}
                                                </span>
                                            ) : "—"}
                                        </TableCell>

                                        {/* Actions */}
                                        <TableCell className="text-right space-x-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-500 hover:text-sky-600"
                                                title="View Full Profile Details"
                                                onClick={() => setSelectedUser(user)}
                                            >
                                                <Info className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-500"
                                                title={user.role === 'admin' ? 'Revoke Admin' : 'Grant Admin'}
                                                onClick={() => handleToggleRole(user.uid, user.role)}
                                            >
                                                {user.role === 'admin'
                                                    ? <ShieldOff className="h-4 w-4 text-orange-500" />
                                                    : <Shield className="h-4 w-4 text-green-600" />
                                                }
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-500 hover:text-red-600"
                                                title="Delete User Account"
                                                onClick={() => handleDelete(user.uid, user.email)}
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

            {/* Profile View Details Dialog */}
            <Dialog open={!!selectedUser} onOpenChange={(open) => { if (!open) setSelectedUser(null) }}>
                {selectedUser && (
                    <DialogContent className="max-w-md rounded-2xl p-6">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                <User className="h-5 w-5 text-primary" />
                                User Profile Details
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Full user registration details and database parameters.
                            </DialogDescription>
                        </DialogHeader>

                        {/* Detailed Card Layout */}
                        <div className="mt-4 space-y-4">
                            {/* Avatar Header Details */}
                            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg select-none">
                                    {getUserInitials(selectedUser.displayName)}
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-extrabold text-slate-900 dark:text-white text-base truncate">{selectedUser.displayName || "No Name"}</h4>
                                    <p className="text-xs text-muted-foreground truncate">{selectedUser.email}</p>
                                    <div className="flex gap-1.5 mt-1.5">
                                        <Badge variant="outline" className={`text-[10px] px-2 font-semibold ${selectedUser.isGuest === 1 || selectedUser.isGuest === true ? "bg-amber-50 text-amber-700 dark:bg-amber-950/20" : "bg-purple-50 text-purple-700 dark:bg-purple-950/20"}`}>
                                            {selectedUser.isGuest === 1 || selectedUser.isGuest === true ? "Guest Checkout" : "Registered Member"}
                                        </Badge>
                                        <Badge variant="outline" className={`text-[10px] px-2 font-semibold ${selectedUser.role === 'admin' ? "bg-rose-50 text-rose-700" : "bg-slate-50 text-slate-700"}`}>
                                            {selectedUser.role}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            {/* Info Rows */}
                            <div className="space-y-3 px-1 text-sm">
                                <div className="grid grid-cols-3 py-1 border-b border-slate-50 dark:border-slate-800">
                                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                        <Phone className="h-3.5 w-3.5 text-slate-455" /> Phone:
                                    </span>
                                    <span className="col-span-2 font-semibold text-slate-800 dark:text-slate-200">
                                        {selectedUser.phone || <span className="text-muted-foreground italic font-normal">—</span>}
                                    </span>
                                </div>
                                
                                <div className="grid grid-cols-3 py-1 border-b border-slate-50 dark:border-slate-800">
                                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                        <MapPin className="h-3.5 w-3.5 text-slate-455" /> Location:
                                    </span>
                                    <span className="col-span-2 font-semibold text-slate-800 dark:text-slate-200">
                                        {selectedUser.city || selectedUser.state || selectedUser.country ? (
                                            <>
                                                {selectedUser.city && `${selectedUser.city}`}
                                                {selectedUser.state && `, ${selectedUser.state}`}
                                                {selectedUser.country && `, ${selectedUser.country}`}
                                            </>
                                        ) : (
                                            <span className="text-muted-foreground italic font-normal">—</span>
                                        )}
                                    </span>
                                </div>

                                <div className="grid grid-cols-3 py-1 border-b border-slate-50 dark:border-slate-800">
                                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                        <MapPin className="h-3.5 w-3.5 text-slate-455" /> Address:
                                    </span>
                                    <span className="col-span-2 font-medium text-slate-700 dark:text-slate-300 leading-relaxed text-xs">
                                        {selectedUser.address || <span className="text-muted-foreground italic font-normal">—</span>}
                                    </span>
                                </div>

                                <div className="grid grid-cols-3 py-1 border-b border-slate-50 dark:border-slate-800">
                                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                        <Calendar className="h-3.5 w-3.5 text-slate-455" /> Registered:
                                    </span>
                                    <span className="col-span-2 font-semibold text-slate-800 dark:text-slate-200">
                                        {selectedUser.createdAt ? format(new Date(selectedUser.createdAt), "MMMM d, yyyy · hh:mm a") : "—"}
                                    </span>
                                </div>

                                <div className="grid grid-cols-3 py-1 border-b border-slate-50 dark:border-slate-800">
                                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                        <FileText className="h-3.5 w-3.5 text-slate-455" /> User ID:
                                    </span>
                                    <span className="col-span-2 font-mono text-[11px] text-slate-550 select-all truncate break-all" title={selectedUser.uid}>
                                        {selectedUser.uid}
                                    </span>
                                </div>
                            </div>

                            {/* Actions area inside dialog */}
                            <div className="flex gap-2.5 pt-2 justify-end">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => handleToggleRole(selectedUser.uid, selectedUser.role)}
                                    className="flex items-center gap-1 h-9 text-xs"
                                >
                                    {selectedUser.role === 'admin' ? (
                                        <><ShieldOff className="h-3.5 w-3.5 mr-0.5 text-orange-500" /> Remove Admin</>
                                    ) : (
                                        <><Shield className="h-3.5 w-3.5 mr-0.5 text-green-600" /> Make Admin</>
                                    )}
                                </Button>
                                <Button 
                                    variant="destructive" 
                                    size="sm" 
                                    onClick={() => {
                                        handleDelete(selectedUser.uid, selectedUser.email)
                                    }}
                                    className="flex items-center gap-1 h-9 text-xs"
                                >
                                    <Trash2 className="h-3.5 w-3.5 mr-0.5" /> Delete User
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                )}
            </Dialog>
        </div>
    )
}
