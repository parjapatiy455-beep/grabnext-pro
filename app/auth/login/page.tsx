"use client"
export const runtime = 'edge'

import type React from "react"
import { useState } from "react"
import { signInWithEmail, ADMIN_EMAIL } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"
import { Eye, EyeOff, Loader2, LogIn, Lock, ShieldCheck } from "lucide-react"
import { StoreHeader } from "@/components/store-header"
import { Footer } from "@/components/footer"
import { Logo } from "@/components/logo"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { refreshUser } = useAuth()

  const handleRedirect = (userEmail: string | null) => {
    let nextUrl = ""
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      nextUrl = params.get("redirect") || ""
    }
    if (nextUrl) {
      router.push(nextUrl)
      return
    }
    if (userEmail && userEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      router.push("/admin")
    } else {
      router.push("/dashboard")
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const user = await signInWithEmail(email, password)
      
      // Store credentials in Google Password Manager / Browser Credential Store if supported
      if (typeof window !== "undefined" && (window as any).PasswordCredential) {
        try {
          const cred = new (window as any).PasswordCredential({
            id: email,
            password: password,
            name: user?.displayName || email,
          })
          if (navigator.credentials && navigator.credentials.store) {
            navigator.credentials.store(cred).catch(() => {})
          }
        } catch {}
      }

      await refreshUser()
      handleRedirect(user?.email || null)
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please check your credentials.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fdfaf6] dark:bg-slate-950 flex flex-col text-slate-900 dark:text-slate-100 transition-colors">
      <StoreHeader />

      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="relative w-full max-w-md">
          
          {/* Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none p-6 sm:p-10 transition-colors">
            
            {/* Logo & Headline */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="mb-3 scale-110">
                <Logo />
              </div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                Welcome Back
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
                Sign in to access your digital orders & instant downloads
              </p>
            </div>

            {/* Login Form with standard browser autofill attributes */}
            <form
              method="POST"
              action="#"
              autoComplete="on"
              onSubmit={handleLogin}
              className="space-y-4"
            >
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-750 dark:text-slate-300" htmlFor="email">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username email"
                  autoCapitalize="none"
                  spellCheck="false"
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all text-slate-900 dark:text-white placeholder:text-slate-400 text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-750 dark:text-slate-300" htmlFor="password">
                    Password
                  </label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all text-slate-900 dark:text-white placeholder:text-slate-400 text-sm"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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

              {/* Error Alert */}
              {error && (
                <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs px-3.5 py-2.5 rounded-xl">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-60 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-violet-500/25 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 text-sm mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Signing in…</span>
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    <span>Sign In to Grabnext</span>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 text-xs font-medium">
                  New to Grabnext?
                </span>
              </div>
            </div>

            {/* Create Account Link */}
            <Link
              href="/auth/register"
              className="block w-full text-center py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-850 dark:text-slate-200 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 text-xs sm:text-sm active:scale-[0.99]"
            >
              Create a free account
            </Link>

            {/* Security Badge */}
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>256-Bit SSL Encrypted & Protected Login</span>
            </div>
          </div>

          <p className="text-center text-slate-500 dark:text-slate-400 text-xs mt-5">
            By signing in, you agree to our{" "}
            <Link href="/terms" className="text-violet-600 dark:text-violet-400 underline hover:text-violet-700">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-violet-600 dark:text-violet-400 underline hover:text-violet-700">
              Privacy Policy
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}
