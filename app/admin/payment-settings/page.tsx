"use client"
export const runtime = 'edge'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { Loader2, CreditCard, Zap, CheckCircle2, Settings, Mail, Key, ShieldCheck, Eye, EyeOff, Copy, Check } from "lucide-react"

const GATEWAYS = [
    {
        id: "xpay",
        name: "XPay",
        description: "XPay UPI Payment Gateway — simple, fast, UPI-based payments",
        logo: "⚡",
        color: "from-blue-500 to-cyan-500",
        features: ["UPI Payments", "Instant Settlement", "Low Fees"],
        envKeys: ["Configurable below in Admin Panel", "XPAY_API_KEY"],
    },
    {
        id: "razorpay",
        name: "Razorpay",
        description: "Razorpay — India's leading payment gateway with cards, UPI, netbanking",
        logo: "💳",
        color: "from-blue-700 to-indigo-600",
        features: ["Cards", "UPI", "Net Banking", "Wallets", "EMI"],
        envKeys: ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"],
    },
]

export default function PaymentSettingsPage() {
    const [activeGateway, setActiveGateway] = useState<string>("xpay")
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [pendingGateway, setPendingGateway] = useState<string | null>(null)

    // XPay Gateway Settings States
    const [xpayApiKey, setXpayApiKey] = useState("")
    const [savingXPay, setSavingXPay] = useState(false)
    const [showXPayKey, setShowXPayKey] = useState(false)
    const [copiedXPay, setCopiedXPay] = useState(false)

    // Brevo Email Settings States
    const [brevoApiKey, setBrevoApiKey] = useState("")
    const [brevoSenderEmail, setBrevoSenderEmail] = useState("")
    const [brevoSenderName, setBrevoSenderName] = useState("Grabnext")
    const [savingBrevo, setSavingBrevo] = useState(false)

    useEffect(() => {
        fetch("/api/settings")
            .then((r) => r.json())
            .then((data) => {
                setActiveGateway(data.payment_gateway || "xpay")
                if (data.xpay_api_key) setXpayApiKey(data.xpay_api_key)
                if (data.brevo_api_key) setBrevoApiKey(data.brevo_api_key)
                if (data.brevo_sender_email) setBrevoSenderEmail(data.brevo_sender_email)
                if (data.brevo_sender_name) setBrevoSenderName(data.brevo_sender_name)
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

    const handleSaveGateway = async (gatewayId: string) => {
        setSaving(true)
        setPendingGateway(gatewayId)
        try {
            const res = await fetch("/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ payment_gateway: gatewayId }),
            })
            if (!res.ok) throw new Error("Failed to save")
            setActiveGateway(gatewayId)
            toast({ title: `✅ Payment gateway switched to ${GATEWAYS.find(g => g.id === gatewayId)?.name}` })
        } catch {
            toast({ title: "Failed to save settings", variant: "destructive" })
        } finally {
            setSaving(false)
            setPendingGateway(null)
        }
    }

    const handleSaveXPay = async (e: React.FormEvent) => {
        e.preventDefault()
        setSavingXPay(true)
        try {
            const res = await fetch("/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    xpay_api_key: xpayApiKey.trim(),
                }),
            })
            if (!res.ok) throw new Error("Failed to save XPay API key")
            toast({
                title: "🎉 XPay API Key Saved!",
                description: "Payment gateway API key updated successfully in database settings.",
            })
        } catch (err: any) {
            toast({
                title: "Failed to save XPay API key",
                description: err.message,
                variant: "destructive",
            })
        } finally {
            setSavingXPay(false)
        }
    }

    const handleCopyKey = () => {
        if (!xpayApiKey) return
        navigator.clipboard.writeText(xpayApiKey)
        setCopiedXPay(true)
        setTimeout(() => setCopiedXPay(false), 2000)
        toast({ title: "Copied to clipboard!" })
    }

    const handleSaveBrevo = async (e: React.FormEvent) => {
        e.preventDefault()
        setSavingBrevo(true)
        try {
            const res = await fetch("/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    brevo_api_key: brevoApiKey.trim(),
                    brevo_sender_email: brevoSenderEmail.trim(),
                    brevo_sender_name: brevoSenderName.trim() || "Grabnext",
                }),
            })
            if (!res.ok) throw new Error("Failed to save Brevo settings")
            toast({ title: "🎉 Brevo Email Credentials Saved!", description: "Backup settings saved to database successfully." })
        } catch (err: any) {
            toast({ title: "Failed to save email settings", description: err.message, variant: "destructive" })
        } finally {
            setSavingBrevo(false)
        }
    }

    return (
        <div className="p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Settings className="h-8 w-8 text-primary" />
                        Settings & Gateway Configuration
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Manage payment gateways and Brevo transactional email credentials.
                    </p>
                </div>

                {/* Current Active Banner */}
                {!loading && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                        <span className="text-green-800 font-medium">
                            Currently active gateway: <strong>{GATEWAYS.find(g => g.id === activeGateway)?.name || activeGateway}</strong>
                        </span>
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                        {GATEWAYS.map((gateway) => {
                            const isActive = activeGateway === gateway.id
                            const isSaving = saving && pendingGateway === gateway.id
                            return (
                                <Card
                                    key={gateway.id}
                                    className={`relative overflow-hidden transition-all duration-300 cursor-pointer border-2 ${isActive
                                            ? "border-primary shadow-lg shadow-primary/10"
                                            : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                                        }`}
                                    onClick={() => !isActive && handleSaveGateway(gateway.id)}
                                >
                                    {/* Top gradient bar */}
                                    <div className={`h-1.5 w-full bg-gradient-to-r ${gateway.color}`} />

                                    {isActive && (
                                        <div className="absolute top-4 right-4">
                                            <Badge className="bg-green-500 text-white text-xs">Active</Badge>
                                        </div>
                                    )}

                                    <CardHeader className="pb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gateway.color} flex items-center justify-center text-2xl`}>
                                                {gateway.logo}
                                            </div>
                                            <div>
                                                <CardTitle className="text-xl">{gateway.name}</CardTitle>
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-4">
                                        <CardDescription className="text-sm text-gray-600">
                                            {gateway.description}
                                        </CardDescription>

                                        {/* Features */}
                                        <div className="flex flex-wrap gap-1.5">
                                            {gateway.features.map((f) => (
                                                <span key={f} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                                                    {f}
                                                </span>
                                            ))}
                                        </div>

                                        {/* Env keys reminder */}
                                        <div className="text-xs text-gray-400 bg-gray-50 rounded-lg p-2 font-mono">
                                            Required env: {gateway.envKeys.join(", ")}
                                        </div>

                                        <Button
                                            className={`w-full ${isActive ? "bg-green-500 hover:bg-green-600 text-white" : ""}`}
                                            variant={isActive ? "default" : "outline"}
                                            disabled={isActive || saving}
                                            onClick={(e) => { e.stopPropagation(); handleSaveGateway(gateway.id) }}
                                        >
                                            {isSaving ? (
                                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Activating...</>
                                            ) : isActive ? (
                                                <><CheckCircle2 className="h-4 w-4 mr-2" />Currently Active</>
                                            ) : (
                                                <><CreditCard className="h-4 w-4 mr-2" />Switch to {gateway.name}</>
                                            )}
                                        </Button>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                )}

                {/* XPay Payment Gateway Configuration Card */}
                <Card className="border-cyan-200/80 shadow-sm bg-gradient-to-br from-white to-cyan-50/20">
                    <CardHeader>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <CardTitle className="text-xl flex items-center gap-2 text-slate-900">
                                <Zap className="h-5 w-5 text-cyan-500 fill-cyan-500" />
                                XPay Payment Gateway Configuration
                            </CardTitle>
                            <Badge
                                variant="outline"
                                className={
                                    xpayApiKey
                                        ? "bg-cyan-50 text-cyan-700 border-cyan-300 font-mono text-xs"
                                        : "bg-gray-100 text-gray-600 border-gray-300 font-mono text-xs"
                                }
                            >
                                {xpayApiKey ? "● Key Configured" : "Default / Unset"}
                            </Badge>
                        </div>
                        <CardDescription>
                            Configure your live XPay API Key for UPI payments. Any update saved here will immediately apply across checkout and customer dashboard.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSaveXPay} className="space-y-4">
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="xpayKey" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                        <Key className="h-3.5 w-3.5 text-cyan-600" />
                                        XPay Merchant API Key
                                    </Label>
                                    <span className="text-xs text-slate-500 font-mono">
                                        e.g. xp_live_...
                                    </span>
                                </div>
                                <div className="relative flex items-center">
                                    <Input
                                        id="xpayKey"
                                        type={showXPayKey ? "text" : "password"}
                                        placeholder="xp_live_xxxxxxxxxxxxxxxxxxxxxxxx"
                                        value={xpayApiKey}
                                        onChange={(e) => setXpayApiKey(e.target.value)}
                                        className="pr-20 font-mono text-sm border-slate-300 focus-visible:ring-cyan-500"
                                        required
                                    />
                                    <div className="absolute right-2 flex items-center gap-1 text-slate-400">
                                        {xpayApiKey && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 w-7 p-0 hover:text-slate-700"
                                                onClick={handleCopyKey}
                                                title="Copy API key"
                                            >
                                                {copiedXPay ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                                            </Button>
                                        )}
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0 hover:text-slate-700"
                                            onClick={() => setShowXPayKey(!showXPayKey)}
                                            title={showXPayKey ? "Hide API key" : "Show API key"}
                                        >
                                            {showXPayKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2">
                                <span className="text-xs text-slate-500 flex items-center gap-1.5">
                                    <ShieldCheck className="h-4 w-4 text-green-600 shrink-0" />
                                    Database mein save hote hi website checkout par bina redeploy kiye nayi key lag jayegi.
                                </span>
                                <Button
                                    type="submit"
                                    disabled={savingXPay}
                                    size="sm"
                                    className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-sm"
                                >
                                    {savingXPay && <Loader2 className="h-4 w-4 animate-spin" />}
                                    Save XPay API Key
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Brevo Email Configuration Card (Admin Panel Backup Settings) */}
                <Card className="border-blue-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2 text-slate-900">
                            <Mail className="h-5 w-5 text-blue-600" /> Brevo Email Service Settings (Admin Backup)
                        </CardTitle>
                        <CardDescription>
                            Configure your Brevo API key and Sender details directly from the Admin Panel. These will be used if environment variables are not present.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSaveBrevo} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="brevoKey" className="text-xs font-semibold">Brevo API Key (xkeysib-...)</Label>
                                    <Input
                                        id="brevoKey"
                                        type="password"
                                        placeholder="xkeysib-xxxxxxxxxxxxxxxxxxxx"
                                        value={brevoApiKey}
                                        onChange={(e) => setBrevoApiKey(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="brevoEmail" className="text-xs font-semibold">Verified Sender Email</Label>
                                    <Input
                                        id="brevoEmail"
                                        type="email"
                                        placeholder="support@yourdomain.com"
                                        value={brevoSenderEmail}
                                        onChange={(e) => setBrevoSenderEmail(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="brevoName" className="text-xs font-semibold">Sender Store Name</Label>
                                    <Input
                                        id="brevoName"
                                        type="text"
                                        placeholder="Grabnext"
                                        value={brevoSenderName}
                                        onChange={(e) => setBrevoSenderName(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-between items-center pt-2">
                                <span className="text-xs text-slate-500">
                                    💡 Credentials hierarchy: Environment Variable (if set) ➔ Database Setting (backup).
                                </span>
                                <Button type="submit" disabled={savingBrevo} size="sm" className="gap-2">
                                    {savingBrevo && <Loader2 className="h-4 w-4 animate-spin" />}
                                    Save Brevo Credentials
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
