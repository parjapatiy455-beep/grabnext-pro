"use client"
export const runtime = 'edge'

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, KeyRound, Loader2, Mail, ShieldCheck } from "lucide-react"
import { StoreHeader } from "@/components/store-header"
import { Footer } from "@/components/footer"
import { Logo } from "@/components/logo"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to process password reset request.")
      }

      setSuccess(true)
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fdfaf6] dark:bg-slate-950 flex flex-col text-slate-900 dark:text-slate-100 transition-colors">
      <StoreHeader />

      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-16">
        <div className="relative w-full max-w-md">
          {/* Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none p-6 sm:p-10 transition-colors">
            
            {/* Logo */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="mb-3 scale-110">
                <Logo />
              </div>

              {!success ? (
                <>
                  <div className="h-12 w-12 rounded-2xl bg-violet-100 dark:bg-violet-950/80 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 flex items-center justify-center mb-3 mt-1 shadow-xs">
                    <KeyRound className="h-6 w-6" />
                  </div>
                  <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    Forgot Password?
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1 max-w-xs">
                    Enter your registered email address and we'll send you a secure link to reset your password.
                  </p>
                </>
              ) : (
                <>
                  <div className="h-14 w-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mb-3 mt-1 shadow-xs">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                  <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    Check Your Email
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-1 max-w-xs">
                    We've sent a password reset link to <strong className="text-slate-900 dark:text-white font-black">{email}</strong>.
                  </p>
                </>
              )}
            </div>

            {!success ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-750 dark:text-slate-300" htmlFor="email">
                    Registered Email Address
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 pl-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all text-slate-900 dark:text-white placeholder:text-slate-400 text-sm"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </div>
                </div>

                {/* Error Box */}
                {error && (
                  <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs px-3.5 py-2.5 rounded-xl">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-60 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-violet-500/25 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 text-sm mt-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Sending Reset Link…</span>
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      <span>Send Reset Link</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                  ⏱️ <strong>Note:</strong> The password reset link is valid for <strong>1 hour</strong>. Please check your inbox (and spam / promotions folder).
                </div>

                <button
                  type="button"
                  onClick={() => setSuccess(false)}
                  className="w-full text-center py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-xs"
                >
                  Didn't receive email? Try again
                </button>
              </div>
            )}

            {/* Back to Login Link */}
            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Sign In</span>
              </Link>
            </div>

            {/* Security Badge */}
            <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>256-Bit SSL Encrypted & Protected</span>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
