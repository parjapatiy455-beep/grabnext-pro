"use client"
export const runtime = 'edge'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { Mail, Send, CheckCircle2, AlertCircle, Loader2, Key, ShieldCheck, ShoppingBag, RefreshCw, Terminal, ExternalLink } from "lucide-react"

export default function EmailTestPage() {
  const [recipientEmail, setRecipientEmail] = useState("")
  const [loadingType, setLoadingType] = useState<string | null>(null)
  const [status, setStatus] = useState<{
    configured: boolean
    hasApiKey: boolean
    senderEmail: string | null
    senderName: string
    appUrl: string
  } | null>(null)
  const [checkingStatus, setCheckingStatus] = useState(true)

  // Settings state
  const [apiKeyInput, setApiKeyInput] = useState("")
  const [senderEmailInput, setSenderEmailInput] = useState("")
  const [senderNameInput, setSenderNameInput] = useState("Grabnext")
  const [savingSettings, setSavingSettings] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // Log console
  const [logs, setLogs] = useState<Array<{ time: string; text: string; type: "info" | "success" | "error" }>>([])

  const addLog = (text: string, type: "info" | "success" | "error" = "info") => {
    const time = new Date().toLocaleTimeString()
    setLogs((prev) => [{ time, text, type }, ...prev])
  }

  const checkBrevoStatus = async () => {
    setCheckingStatus(true)
    try {
      const res = await fetch("/api/admin/test-email")
      const data = await res.json()
      setStatus(data)
      if (data.senderEmail) setSenderEmailInput(data.senderEmail)
      if (data.senderName) setSenderNameInput(data.senderName)
      addLog(`Status checked: Brevo is ${data.configured ? 'Configured ✅' : 'Not Fully Configured ⚠️'}`, data.configured ? 'success' : 'info')
    } catch (err: any) {
      addLog(`Failed to fetch status: ${err.message}`, 'error')
    } finally {
      setCheckingStatus(false)
    }
  }

  useEffect(() => {
    checkBrevoStatus()
  }, [])

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingSettings(true)
    try {
      const payload: Record<string, string> = {}
      if (apiKeyInput.trim()) payload.brevo_api_key = apiKeyInput.trim()
      if (senderEmailInput.trim()) payload.brevo_sender_email = senderEmailInput.trim()
      if (senderNameInput.trim()) payload.brevo_sender_name = senderNameInput.trim()

      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error("Failed to save settings to database")

      toast({ title: "Settings Saved!", description: "Brevo configuration has been updated." })
      addLog("Updated Brevo settings in database", "success")
      setApiKeyInput("")
      await checkBrevoStatus()
    } catch (err: any) {
      toast({ title: "Error saving settings", description: err.message, variant: "destructive" })
      addLog(`Failed to save settings: ${err.message}`, "error")
    } finally {
      setSavingSettings(false)
    }
  }

  const handleSendTestEmail = async (type: "test" | "success" | "failed" | "guest") => {
    if (!recipientEmail || !recipientEmail.includes("@")) {
      toast({ title: "Invalid Email Address", description: "Please enter a valid recipient email address.", variant: "destructive" })
      return
    }

    setLoadingType(type)
    addLog(`Sending ${type.toUpperCase()} email to ${recipientEmail}...`, "info")

    try {
      const res = await fetch("/api/admin/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: recipientEmail.trim(), type }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to send email")
      }

      toast({ title: "🎉 Email Sent Successfully!", description: data.message || "Check your inbox/spam folder." })
      addLog(`Success! Message ID: ${data.messageId}`, "success")
    } catch (err: any) {
      toast({ title: "❌ Email Delivery Failed", description: err.message, variant: "destructive" })
      addLog(`Error: ${err.message}`, "error")
    } finally {
      setLoadingType(null)
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Mail className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Brevo Email Service Tester</h1>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Test transactional emails for purchase confirmations with download links and order failure alerts.
          </p>
        </div>

        <Button onClick={checkBrevoStatus} disabled={checkingStatus} variant="outline" size="sm" className="gap-2 shrink-0">
          <RefreshCw className={`h-4 w-4 ${checkingStatus ? "animate-spin" : ""}`} />
          Refresh Status
        </Button>
      </div>

      {/* System Status Banner */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-600" /> Brevo Configuration Status
            </CardTitle>
            {checkingStatus ? (
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            ) : status?.configured ? (
              <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 px-3 py-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Active & Ready
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1 px-3 py-1">
                <AlertCircle className="h-3.5 w-3.5" /> Action Needed
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-3 bg-slate-50 border rounded-lg">
            <p className="text-xs text-slate-500 font-medium">Brevo API Key</p>
            <p className="font-semibold text-slate-800 mt-1 flex items-center gap-1.5">
              <Key className="h-4 w-4 text-slate-400" />
              {status?.hasApiKey ? "•••••••••••• (Set)" : "Not Configured"}
            </p>
          </div>
          <div className="p-3 bg-slate-50 border rounded-lg">
            <p className="text-xs text-slate-500 font-medium">Sender Email Address</p>
            <p className="font-semibold text-slate-800 mt-1 truncate">
              {status?.senderEmail || "Not Configured"}
            </p>
          </div>
          <div className="p-3 bg-slate-50 border rounded-lg">
            <p className="text-xs text-slate-500 font-medium">Sender Store Name</p>
            <p className="font-semibold text-slate-800 mt-1">
              {status?.senderName || "Grabnext"}
            </p>
          </div>
        </CardContent>
        <CardFooter className="bg-slate-50 border-t py-3 px-6 flex justify-between items-center text-xs text-slate-500">
          <span>You can configure credentials via <code className="bg-slate-200 px-1 py-0.5 rounded">.env</code> or directly below.</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="text-primary hover:text-primary/90 hover:bg-primary/10 text-xs"
          >
            {showSettings ? "Hide Settings Panel" : "⚙️ Edit Credentials"}
          </Button>
        </CardFooter>
      </Card>

      {/* Quick Settings Panel (Optional Edit) */}
      {showSettings && (
        <Card className="border-blue-200 bg-blue-50/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-md text-blue-900 flex items-center gap-2">
              <Key className="h-4 w-4" /> Edit Brevo Credentials in Database
            </CardTitle>
            <CardDescription className="text-xs">
              Save your Brevo API Key and verified Sender Email to the database. These will override or fallback for your store.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveSettings} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="apiKey" className="text-xs font-semibold">Brevo API Key (xkeysib-...)</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="xkeysib-xxxxxxxxxxxxxxxxxxxx"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    className="bg-white mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="senderEmail" className="text-xs font-semibold">Verified Sender Email</Label>
                  <Input
                    id="senderEmail"
                    type="email"
                    placeholder="support@yourdomain.com"
                    value={senderEmailInput}
                    onChange={(e) => setSenderEmailInput(e.target.value)}
                    className="bg-white mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="senderName" className="text-xs font-semibold">Sender Store Name</Label>
                  <Input
                    id="senderName"
                    type="text"
                    placeholder="Grabnext"
                    value={senderNameInput}
                    onChange={(e) => setSenderNameInput(e.target.value)}
                    className="bg-white mt-1"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowSettings(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={savingSettings} className="gap-2">
                  {savingSettings && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save Credentials
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Email Tester Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Test Controls */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Send Test Email</CardTitle>
              <CardDescription>
                Enter recipient email address and select the type of email to send.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="recipient" className="text-sm font-semibold">Recipient Email Address</Label>
                <div className="flex gap-2 mt-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="recipient"
                      type="email"
                      placeholder="yourname@gmail.com"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Select Test Action</Label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Button 1: Simple Test */}
                  <Button
                    onClick={() => handleSendTestEmail("test")}
                    disabled={loadingType !== null}
                    variant="outline"
                    className="h-auto py-3 px-4 flex flex-col items-start gap-1 text-left border-blue-200 hover:bg-blue-50"
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-blue-700">
                      {loadingType === "test" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      Basic Test Email
                    </div>
                    <span className="text-[11px] text-slate-500 font-normal">
                      Simple ping to verify Brevo connectivity.
                    </span>
                  </Button>

                  {/* Button 2: Purchase Success Receipt */}
                  <Button
                    onClick={() => handleSendTestEmail("success")}
                    disabled={loadingType !== null}
                    variant="outline"
                    className="h-auto py-3 px-4 flex flex-col items-start gap-1 text-left border-emerald-200 hover:bg-emerald-50"
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-emerald-700">
                      {loadingType === "success" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingBag className="h-4 w-4" />}
                      Purchase Confirmation
                    </div>
                    <span className="text-[11px] text-slate-500 font-normal">
                      Full email receipt with Product Download Links.
                    </span>
                  </Button>

                  {/* Button 3: Payment Failed Alert */}
                  <Button
                    onClick={() => handleSendTestEmail("failed")}
                    disabled={loadingType !== null}
                    variant="outline"
                    className="h-auto py-3 px-4 flex flex-col items-start gap-1 text-left border-amber-200 hover:bg-amber-50"
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-amber-700">
                      {loadingType === "failed" ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertCircle className="h-4 w-4" />}
                      Payment Failed Alert
                    </div>
                    <span className="text-[11px] text-slate-500 font-normal">
                      Failed order alert with Retry Checkout link.
                    </span>
                  </Button>

                  {/* Button 4: Guest Account & Password Email */}
                  <Button
                    onClick={() => handleSendTestEmail("guest")}
                    disabled={loadingType !== null}
                    variant="outline"
                    className="h-auto py-3 px-4 flex flex-col items-start gap-1 text-left border-purple-200 hover:bg-purple-50"
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-purple-700">
                      {loadingType === "guest" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
                      Guest Account & Password
                    </div>
                    <span className="text-[11px] text-slate-500 font-normal">
                      Account confirmation with Login details.
                    </span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Setup Guide Card */}
          <Card className="bg-slate-900 text-white shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-md flex items-center justify-between text-slate-100">
                <span>📖 Brevo Quick Setup Checklist</span>
                <a
                  href="https://www.brevo.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-400 hover:underline flex items-center gap-1 font-normal"
                >
                  Open Brevo.com <ExternalLink className="h-3 w-3" />
                </a>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-300 space-y-2">
              <p>1. Sign up on <strong>Brevo.com</strong> and navigate to <strong>Senders & IP</strong> to verify your sender email address.</p>
              <p>2. Go to <strong>SMTP & API</strong> -&gt; <strong>API Keys</strong> and generate a new API key (starts with <code>xkeysib-...</code>).</p>
              <p>3. Enter the API Key and Verified Email in your project&apos;s <code>.env</code> file or save them in the settings panel above.</p>
            </CardContent>
          </Card>
        </div>

        {/* Live Output Console */}
        <div className="lg:col-span-1">
          <Card className="h-full border-slate-300 shadow-sm flex flex-col">
            <CardHeader className="pb-3 border-b bg-slate-50">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-slate-600" /> Live Response Console
                </span>
                {logs.length > 0 && (
                  <button onClick={() => setLogs([])} className="text-[11px] text-slate-400 hover:text-slate-600">
                    Clear Logs
                  </button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-4 bg-slate-950 text-slate-200 font-mono text-xs overflow-y-auto max-h-[420px] rounded-b-lg">
              {logs.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-600 text-center py-12">
                  No execution logs yet. Click a test button to trigger an email!
                </div>
              ) : (
                <div className="space-y-2">
                  {logs.map((log, i) => (
                    <div key={i} className="border-b border-slate-900 pb-1.5">
                      <span className="text-slate-500 mr-2">[{log.time}]</span>
                      <span
                        className={
                          log.type === "success"
                            ? "text-emerald-400 font-semibold"
                            : log.type === "error"
                            ? "text-red-400 font-semibold"
                            : "text-blue-300"
                        }
                      >
                        {log.text}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
