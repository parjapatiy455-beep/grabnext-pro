import type { NextRequest } from "next/server"

const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export async function rateLimit(request: NextRequest, limit = 500, windowMs = 15 * 60 * 1000) {
  const ip =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    (request as any).ip ||
    "unknown"

  const now = Date.now()
  const effectiveLimit = ip === "unknown" ? limit * 2 : limit
  const userLimit = rateLimitMap.get(ip)

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
    return { success: true, remaining: effectiveLimit - 1 }
  }

  if (userLimit.count >= effectiveLimit) {
    return { success: false, remaining: 0 }
  }

  userLimit.count++
  return { success: true, remaining: effectiveLimit - userLimit.count }
}
