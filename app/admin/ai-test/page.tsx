"use client"
export const runtime = 'edge'

import { useState } from "react"
import {
    Bot, Zap, CheckCircle2, XCircle, Loader2, Send,
    Activity, Clock, Cpu, MessageSquare, RefreshCw, Sparkles
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface TestResult {
    ok: boolean
    model: string
    latency: number
    reply?: string
    error?: string
    usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number } | null
}

interface TestResponse {
    nvidia?: TestResult
}

export default function AITestPage() {
    const [loading, setLoading] = useState(false)
    const [results, setResults] = useState<TestResponse | null>(null)
    const [customMsg, setCustomMsg] = useState("Kya tum GrabNext ke liye kaam karoge? Ek product suggest karo.")
    const [lastTested, setLastTested] = useState<string | null>(null)

    const runTest = async () => {
        setLoading(true)
        setResults(null)
        try {
            const res = await fetch("/api/ai/test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: customMsg.trim() || "Hello! Are you working?" }),
            })
            const data = await res.json()
            setResults(data)
            setLastTested(new Date().toLocaleTimeString("en-IN"))
        } catch (e: any) {
            setResults({
                nvidia: { ok: false, model: "minimaxai/minimax-m1-40k", latency: 0, error: e.message },
            })
        } finally {
            setLoading(false)
        }
    }

    const nvidia = results?.nvidia

    return (
        <div className="p-6 lg:p-8">
            <div className="max-w-3xl mx-auto space-y-6">

                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <Activity className="h-6 w-6 text-green-600" />
                                AI Model Tester
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Check if NVIDIA MiniMax AI is live and responding correctly.
                            </p>
                        </div>
                        {lastTested && (
                            <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full">
                                Last tested: {lastTested}
                            </span>
                        )}
                    </div>

                    {/* Model Info Card */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 text-white shadow-xl">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="h-10 w-10 rounded-xl bg-green-500/20 border border-green-400/30 flex items-center justify-center">
                                <Sparkles className="h-5 w-5 text-green-400" />
                            </div>
                            <div>
                                <p className="font-bold text-white">NVIDIA MiniMax M1</p>
                                <p className="text-xs text-slate-400">minimaxai/minimax-m1-40k</p>
                            </div>
                            <span className="ml-auto text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/30 px-2.5 py-1 rounded-full uppercase tracking-wider">
                                Primary Model
                            </span>
                        </div>
                        <div className="grid grid-cols-3 gap-3 mt-4">
                            {[
                                { label: "Provider", value: "NVIDIA Integrate" },
                                { label: "Context", value: "40K tokens" },
                                { label: "Format", value: "OpenAI-compatible" },
                            ].map(({ label, value }) => (
                                <div key={label} className="bg-white/5 rounded-xl p-3 border border-white/10">
                                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">{label}</p>
                                    <p className="text-sm font-semibold text-white mt-0.5">{value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Test Message Input */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <MessageSquare className="h-4 w-4 inline mr-1.5 text-gray-400" />
                            Test Message
                        </label>
                        <div className="flex gap-2">
                            <input
                                value={customMsg}
                                onChange={e => setCustomMsg(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && !loading && runTest()}
                                placeholder="Type your test message here..."
                                className="flex-1 text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 transition-all"
                            />
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                            {[
                                "Are you working?",
                                "Mujhe ek product suggest karo",
                                "What products do you have?",
                                "Hello! Test ping.",
                            ].map(q => (
                                <button
                                    key={q}
                                    onClick={() => setCustomMsg(q)}
                                    className="text-[11px] px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-gray-600 hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-all"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Run Test Button */}
                    <Button
                        onClick={runTest}
                        disabled={loading}
                        className="w-full h-12 text-base font-bold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl shadow-lg shadow-green-200 transition-all"
                    >
                        {loading ? (
                            <><Loader2 className="h-5 w-5 animate-spin mr-2" />Testing NVIDIA AI...</>
                        ) : (
                            <><Send className="h-5 w-5 mr-2" />Run Test</>
                        )}
                    </Button>

                    {/* Loading state */}
                    {loading && (
                        <div className="bg-white rounded-2xl border border-gray-200 p-8 flex flex-col items-center gap-3 shadow-sm">
                            <div className="relative">
                                <div className="h-12 w-12 rounded-full border-4 border-green-100 border-t-green-500 animate-spin" />
                                <Sparkles className="h-5 w-5 text-green-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                            </div>
                            <p className="text-sm font-semibold text-gray-700">Pinging NVIDIA MiniMax...</p>
                            <p className="text-xs text-gray-400">Sending request to integrate.api.nvidia.com</p>
                        </div>
                    )}

                    {/* Results */}
                    {!loading && nvidia && (
                        <div className={`rounded-2xl border-2 overflow-hidden shadow-sm ${nvidia.ok ? "border-green-200" : "border-red-200"}`}>
                            {/* Status bar */}
                            <div className={`px-5 py-4 flex items-center gap-3 ${nvidia.ok ? "bg-green-50" : "bg-red-50"}`}>
                                {nvidia.ok
                                    ? <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0" />
                                    : <XCircle className="h-6 w-6 text-red-500 shrink-0" />
                                }
                                <div className="flex-1">
                                    <p className={`font-bold text-sm ${nvidia.ok ? "text-green-800" : "text-red-700"}`}>
                                        {nvidia.ok ? "✅ NVIDIA AI is LIVE and working!" : "❌ NVIDIA AI is NOT responding"}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">{nvidia.model}</p>
                                </div>
                                {nvidia.latency > 0 && (
                                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${nvidia.latency < 3000 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                                        <Clock className="h-3 w-3 inline mr-1" />
                                        {nvidia.latency}ms
                                    </span>
                                )}
                            </div>

                            <div className="bg-white p-5 space-y-4">
                                {/* Stats row */}
                                {nvidia.ok && (
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                            <p className="text-[10px] text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                                <Clock className="h-3 w-3" /> Latency
                                            </p>
                                            <p className={`text-lg font-bold mt-0.5 ${nvidia.latency < 2000 ? "text-green-600" : "text-yellow-600"}`}>
                                                {nvidia.latency}ms
                                            </p>
                                            <p className="text-[10px] text-gray-400">
                                                {nvidia.latency < 2000 ? "⚡ Fast" : nvidia.latency < 5000 ? "✅ Good" : "⚠️ Slow"}
                                            </p>
                                        </div>
                                        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                            <p className="text-[10px] text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                                <Cpu className="h-3 w-3" /> Tokens Used
                                            </p>
                                            <p className="text-lg font-bold mt-0.5 text-gray-800">
                                                {nvidia.usage?.total_tokens ?? "—"}
                                            </p>
                                            {nvidia.usage && (
                                                <p className="text-[10px] text-gray-400">
                                                    {nvidia.usage.prompt_tokens}p + {nvidia.usage.completion_tokens}c
                                                </p>
                                            )}
                                        </div>
                                        <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                                            <p className="text-[10px] text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                                <Activity className="h-3 w-3" /> Status
                                            </p>
                                            <p className="text-lg font-bold mt-0.5 text-green-600">Online</p>
                                            <p className="text-[10px] text-green-500">API reachable</p>
                                        </div>
                                    </div>
                                )}

                                {/* AI Reply */}
                                {nvidia.reply && (
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
                                            <Bot className="h-3.5 w-3.5 inline mr-1" />
                                            AI Reply
                                        </p>
                                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                                                {nvidia.reply}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Error */}
                                {nvidia.error && (
                                    <div>
                                        <p className="text-xs font-semibold text-red-500 mb-2 uppercase tracking-wider">Error Details</p>
                                        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                            <p className="text-sm text-red-700 font-mono break-all">{nvidia.error}</p>
                                        </div>
                                        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                            <p className="text-xs text-amber-800 font-semibold mb-1">Possible reasons:</p>
                                            <ul className="text-xs text-amber-700 space-y-0.5 list-disc ml-4">
                                                <li>NVIDIA API key expired or quota exceeded</li>
                                                <li>Model name changed or unavailable</li>
                                                <li>Network timeout (edge runtime limit)</li>
                                                <li>Rate limit hit — wait 1 minute and retry</li>
                                            </ul>
                                        </div>
                                    </div>
                                )}

                                {/* Re-test button */}
                                <button
                                    onClick={runTest}
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-all"
                                >
                                    <RefreshCw className="h-4 w-4" /> Run Again
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Info box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <p className="text-xs font-semibold text-blue-700 mb-1">ℹ️ How the chatbot works</p>
                        <p className="text-xs text-blue-600 leading-relaxed">
                            <strong>Primary:</strong> NVIDIA MiniMax M1-40K → <strong>Fallback:</strong> Gemini (from AI Settings) → <strong>Final:</strong> Offline message.
                            If NVIDIA is working here, your chatbot will use it automatically.
                        </p>
                    </div>

                </div>
        </div>
    )
}
