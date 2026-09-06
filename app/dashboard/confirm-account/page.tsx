export const runtime = 'edge'
"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { confirmGuestPassword } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { StoreHeader } from "@/components/store-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ShieldCheck, Eye, EyeOff, Loader2, CheckCircle2, ArrowRight } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"

export default function ConfirmAccountPage() {
    const { user, refreshUser } = useAuth()
    const router = useRouter()
    const [newPassword, setNewPassword] = useState("")
    const [confirmPwd, setConfirmPwd] = useState("")
    const [showPwd, setShowPwd] = useState(false)
    const [loading, setLoading] = useState(false)
    const [done, setDone] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (newPassword !== confirmPwd) {
            toast({ title: "Passwords don't match", variant: "destructive" })
            return
        }
        if (newPassword.length < 6) {
            toast({ title: "Password must be at least 6 characters", variant: "destructive" })
            return
        }
        setLoading(true)
        try {
            await confirmGuestPassword(newPassword)
            await refreshUser()
            setDone(true)
            toast({ title: "✅ Password set! Your account is now permanent." })
            setTimeout(() => router.push("/dashboard"), 2500)
        } catch (err: any) {
            toast({ title: err.message || "Failed to set password", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    if (!user) {
        return (
            <div className="min-h-screen">
                <StoreHeader />
                <div className="flex items-center justify-center py-24 text-center">
                    <div>
                        <p className="text-muted-foreground mb-4">Please log in to access this page.</p>
                        <Button asChild><Link href="/auth/login">Login</Link></Button>
                    </div>
                </div>
            </div>
        )
    }

    if (done) {
        return (
            <div className="min-h-screen bg-gray-50">
                <StoreHeader />
                <div className="flex items-center justify-center py-24">
                    <div className="text-center">
                        <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Account Confirmed!</h2>
                        <p className="text-muted-foreground">Your password has been set. Redirecting to dashboard…</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <StoreHeader />
            <div className="container mx-auto px-4 py-16 flex justify-center">
                <Card className="w-full max-w-md shadow-xl border-0">
                    <CardHeader className="text-center pb-4">
                        <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mb-4 shadow-lg">
                            <ShieldCheck className="h-8 w-8 text-white" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Confirm Your Account</CardTitle>
                        <CardDescription className="text-base">
                            Set a permanent password for <strong>{user.email}</strong> to secure your orders and account.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 text-sm text-amber-800">
                            <strong>🔑 Why is this needed?</strong> Your account was automatically created during checkout. Setting a password lets you access your orders anytime.
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-1.5">
                                <Label htmlFor="newPassword">New Password</Label>
                                <div className="relative">
                                    <Input
                                        id="newPassword"
                                        type={showPwd ? "text" : "password"}
                                        placeholder="Min. 6 characters"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="pr-10"
                                        required
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        onClick={() => setShowPwd(!showPwd)}
                                    >
                                        {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="confirmPwd">Confirm Password</Label>
                                <Input
                                    id="confirmPwd"
                                    type={showPwd ? "text" : "password"}
                                    placeholder="Re-enter your password"
                                    value={confirmPwd}
                                    onChange={(e) => setConfirmPwd(e.target.value)}
                                    required
                                />
                                {confirmPwd && newPassword !== confirmPwd && (
                                    <p className="text-xs text-red-500">Passwords don't match</p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold py-3 text-base shadow-md"
                                disabled={loading}
                            >
                                {loading ? (
                                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Setting Password...</>
                                ) : (
                                    <><ShieldCheck className="h-4 w-4 mr-2" />Confirm Account <ArrowRight className="h-4 w-4 ml-2" /></>
                                )}
                            </Button>
                        </form>

                        <p className="text-center text-sm text-muted-foreground mt-4">
                            <Link href="/dashboard" className="underline hover:text-primary">Skip for now</Link>
                            {" "}(not recommended)
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
