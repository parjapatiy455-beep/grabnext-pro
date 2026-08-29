/**
 * lib/hash.ts
 *
 * Secure hashing utilities for Meta Conversions API (CAPI) Advanced Matching.
 * Meta requires user data (email, phone, names) to be:
 * 1. Trimmed of leading/trailing whitespace
 * 2. Lowercased
 * 3. Hashed using SHA-256 (hexadecimal representation)
 */

/**
 * Normalizes and hashes a string using SHA-256 via Web Crypto API.
 * Works in both browser and server (Next.js Edge/Node) environments.
 * @param value The string to hash (e.g. email, phone)
 * @returns The SHA-256 hex string, or undefined if value is empty
 */
export async function hashData(value: string | undefined | null): Promise<string | undefined> {
  if (!value) return undefined

  const normalized = value.trim().toLowerCase()
  if (!normalized) return undefined

  try {
    const encoder = new TextEncoder()
    const data = encoder.encode(normalized)
    
    // Check if crypto.subtle is available (it is in browsers on HTTPS and modern Node/Edge)
    if (typeof crypto !== "undefined" && crypto.subtle) {
      const hashBuffer = await crypto.subtle.digest("SHA-256", data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
      return hashHex
    }
    
    // Fallback for Node.js environments where Web Crypto isn't globally exposed but 'crypto' module is available
    if (typeof process !== "undefined" && process.versions && process.versions.node) {
      const req = eval('require')
      const cryptoModule = req("crypto")
      return cryptoModule.createHash("sha256").update(normalized).digest("hex")
    }
    
    console.warn("[Meta Pixel] Hashing not supported in this environment.")
    return undefined
  } catch (err) {
    console.error("[Meta Pixel] Hashing failed:", err)
    return undefined
  }
}
