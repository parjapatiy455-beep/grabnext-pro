"use client"
export const runtime = 'edge'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { Loader2, CreditCard, Zap, CheckCircle2, Settings } from "lucide-react"

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

    useEffect(() => {
        fetch("/api/settings")
            .then((r) => r.json())
            .then((data) => {
                setActiveGateway(data.payment_gateway || "xpay")
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

    const handleSave = async (gatewayId: string) => {
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

    return (
        <div className="p-8">
            <div className="max-w-4xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <Settings className="h-8 w-8 text-primary" />
                            Payment Gateway
                        </h1>
                        <p className="text-gray-500 mt-1">
                            Choose which payment gateway customers use at checkout. Changes take effect immediately.
                        </p>
                    </div>

                    {/* Current Active Banner */}
                    {!loading && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                            <span className="text-green-800 font-medium">
                                Currently active: <strong>{GATEWAYS.find(g => g.id === activeGateway)?.name || activeGateway}</strong>
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
                                        onClick={() => !isActive && handleSave(gateway.id)}
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
                                                onClick={(e) => { e.stopPropagation(); handleSave(gateway.id) }}
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

                    {/* Info card */}
                    <Card className="mt-6 border-amber-200 bg-amber-50">
                        <CardContent className="pt-5">
                            <div className="flex gap-3">
                                <span className="text-2xl">⚠️</span>
                                <div className="text-sm text-amber-800 space-y-1">
                                    <p className="font-semibold">Before switching to Razorpay:</p>
                                    <ul className="list-disc ml-4 space-y-0.5 text-amber-700">
                                        <li>Add <code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_RAZORPAY_KEY_ID</code> in Vercel/Cloudflare env vars</li>
                                        <li>Add <code className="bg-amber-100 px-1 rounded">RAZORPAY_KEY_SECRET</code> in env vars (used server-side for order verification)</li>
                                        <li>Redeploy after adding env vars</li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
        </div>
    )
}
