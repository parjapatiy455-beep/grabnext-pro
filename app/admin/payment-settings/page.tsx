"use client"
export const runtime = 'edge'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { Loader2, CreditCard, Zap, CheckCircle2, Settings, Mail, Key, ShieldCheck } from "lucide-react"

const GATEWAYS = [
    {
        id: "xpay",
        name: "XPay",
        description: "XPay UPI Payment Gateway — simple, fast, UPI-based payments",
        logo: "⚡",
        color: "from-blue-500 to-cyan-500",
        features: ["UPI Payments", "Instant Settlement", "Low Fees"],
        envKeys: ["Already configured in code"],
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
