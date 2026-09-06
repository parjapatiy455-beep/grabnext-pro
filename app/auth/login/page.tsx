"use client"
export const runtime = 'edge'

import type React from "react"
import { useState } from "react"
import { signInWithEmail, ADMIN_EMAIL } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"
import { Eye, EyeOff, Loader2, LogIn, ShoppingBag } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { refreshUser } = useAuth()

  const handleRedirect = (userEmail: string | null) => {
    if (userEmail && userEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      router.push("/admin");
    } else {
      router.push("/dashboard");
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const user = await signInWithEmail(email, password)
      await refreshUser()
      handleRedirect(user?.email || null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg mb-4">
              <ShoppingBag className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Grab<span className="text-blue-600">next</span>
            </h1>
            <p className="text-gray-500 text-sm mt-1">Welcome back! Sign in to your account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-400"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-400"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 text-white py-3.5 rounded-xl font-bold shadow-lg hover:shadow-blue-500/40 transition-all duration-200 flex items-center justify-center gap-2 text-base"
            >
              {loading ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> Signing in…</>
              ) : (
                <><LogIn className="h-5 w-5" /> Sign In</>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 text-gray-400 text-sm">New to Grabnext?</span>
            </div>
          </div>

          <Link
            href="/auth/register"
            className="block w-full text-center py-3 rounded-xl border-2 border-blue-600 text-blue-700 font-bold hover:bg-blue-50 transition-all duration-200"
          >
            Create a free account
          </Link>
        </div>

        <p className="text-center text-white/70 text-sm mt-6">
          By signing in, you agree to our{" "}
          <Link href="/terms" className="text-white underline hover:text-blue-200">Terms</Link>{" "}and{" "}
          <Link href="/privacy" className="text-white underline hover:text-blue-200">Privacy Policy</Link>
        </p>
      </div>
    </div>
  )
}
