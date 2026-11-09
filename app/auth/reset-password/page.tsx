"use client"
export const runtime = 'edge'

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { CheckCircle2, Eye, EyeOff, KeyRound, Loader2, Lock, ShieldAlert, ShieldCheck } from "lucide-react"
import { StoreHeader } from "@/components/store-header"
import { Footer } from "@/components/footer"
import { Logo } from "@/components/logo"

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams?.get("token") || ""

  const [checking, setChecking] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [maskedEmail, setMaskedEmail] = useState("")
  const [tokenError, setTokenError] = useState("")

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  // Verify token on mount
  useEffect(() => {
    if (!token) {
      setChecking(false)
      setTokenValid(false)
      setTokenError("No reset token provided. Please use the link sent to your email.")
      return
    }

    fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.valid) {
          setTokenValid(true)
          setMaskedEmail(data.email || "")
        } else {
          setTokenValid(false)
          setTokenError(data.error || "This password reset link is invalid or has expired.")
        }
      })
      .catch(() => {
        setTokenValid(false)
        setTokenError("Failed to verify reset link. Please check your internet connection.")
      })
      .finally(() => {
        setChecking(false)
      })
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please re-enter carefully.")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password.")
      }

      setSuccess(true)
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative w-full max-w-md">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none p-6 sm:p-10 transition-colors">
        
        {/* Logo */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="mb-3 scale-110">
            <Logo />
          </div>

          {checking ? (
            <div className="py-8 flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
              <p className="text-xs font-bold text-slate-500">Verifying secure reset link…</p>
            </div>
          ) : !tokenValid ? (
            <>
              <div className="h-14 w-14 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 flex items-center justify-center mb-3 mt-1 shadow-xs">
                <ShieldAlert className="h-7 w-7" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Invalid or Expired Link
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1 max-w-xs">
                {tokenError || "This password reset link is invalid or has already expired."}
              </p>
            </>
          ) : !success ? (
            <>
              <div className="h-12 w-12 rounded-2xl bg-violet-100 dark:bg-violet-950/80 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 flex items-center justify-center mb-3 mt-1 shadow-xs">
                <KeyRound className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Create New Password
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1 max-w-xs">
                {maskedEmail ? `For account ${maskedEmail}` : "Choose a secure password for your Grabnext account."}
              </p>
            </>
          ) : (
            <>
              <div className="h-14 w-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mb-3 mt-1 shadow-xs">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Password Reset Complete!
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-1 max-w-xs">
                Your password has been successfully updated. You can now sign in with your new credentials.
              </p>
            </>
          )}
        </div>

        {/* Content States */}
        {!checking && !tokenValid ? (
          <div className="space-y-4">
            <Button asChild className="w-full bg-violet-600 hover:bg-violet-700 text-white font-black py-3 rounded-xl text-xs">
              <Link href="/auth/forgot-password">Request New Reset Link</Link>
            </Button>
            <div className="text-center pt-2">
              <Link href="/auth/login" className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:underline">
                Back to Sign In
              </Link>
            </div>
          </div>
        ) : !checking && !success ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-750 dark:text-slate-300" htmlFor="newPassword">
                New Password
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 6 characters"
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all text-slate-900 dark:text-white placeholder:text-slate-400 text-sm"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-750 dark:text-slate-300" htmlFor="confirmPassword">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Repeat new password"
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all text-slate-900 dark:text-white placeholder:text-slate-400 text-sm"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={6}
                  required
                />
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
                  <span>Updating Password…</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </form>
        ) : !checking && success ? (
          <div className="space-y-4">
            <Link
              href="/auth/login"
              className="block w-full text-center py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black text-sm shadow-lg shadow-violet-500/25 hover:from-violet-700 hover:to-indigo-700 transition-all"
            >
              Sign In to Your Account →
            </Link>
          </div>
        ) : null}

        {/* Security Badge */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>256-Bit SSL Encrypted & Secure</span>
        </div>
      </div>
    </div>
  )
}

function Button({ asChild, className, children, ...props }: any) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#fdfaf6] dark:bg-slate-950 flex flex-col text-slate-900 dark:text-slate-100 transition-colors">
      <StoreHeader />

      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-16">
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
            <p className="text-xs font-bold text-slate-500">Loading…</p>
          </div>
        }>
          <ResetPasswordContent />
        </Suspense>
      </main>

      <Footer />
    </div>
  )
}
