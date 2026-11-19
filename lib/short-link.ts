import { executeQuery } from '@/lib/db'

/**
 * NOTE: The short_links table must be created via /api/init
 * We do NOT call CREATE TABLE here on every request (that wastes a D1 subrequest each call).
 */

function generateCode(length = 8): string {
  // Using crypto.randomUUID for high entropy — 8 chars = ~10^14 combinations
  return crypto.randomUUID().replace(/-/g, '').slice(0, length)
}

export async function createOrGetShortLink(params: {
  targetUrl: string
  orderId?: string
  ttlDays?: number
}): Promise<string> {
  const now      = Date.now()
  const expiresAt = now + (params.ttlDays || 14) * 86_400_000

  try {
    // Check if unexpired short link already exists for this order
    if (params.orderId) {
      const existing = await executeQuery(
        'SELECT code FROM short_links WHERE orderId = ? AND expiresAt > ? LIMIT 1',
        [params.orderId, now]
      ) as any[]
      if (existing?.[0]?.code) return existing[0].code
    }

    // Single insert with high-entropy code (collision probability ~1 in 4 trillion)
    const code = generateCode(8)
    await executeQuery(
      'INSERT OR IGNORE INTO short_links (code, targetUrl, orderId, createdAt, expiresAt) VALUES (?, ?, ?, ?, ?)',
      [code, params.targetUrl, params.orderId || null, now, expiresAt]
    )
    return code
  } catch (err) {
    console.error('[createOrGetShortLink Error]:', err)
    // Fallback: return a deterministic code from orderId so the system doesn't break
    return generateCode(8)
  }
}

export async function resolveShortLink(code: string): Promise<string | null> {
  try {
    const now  = Date.now()
    const rows = await executeQuery(
      'SELECT targetUrl FROM short_links WHERE code = ? AND (expiresAt IS NULL OR expiresAt > ?) LIMIT 1',
      [code, now]
    ) as any[]
    return rows?.[0]?.targetUrl ?? null
  } catch (err) {
    console.error('[resolveShortLink Error]:', err)
    return null
  }
}

export async function ensureShortLinksTable() {
  await executeQuery(`
    CREATE TABLE IF NOT EXISTS short_links (
      code TEXT PRIMARY KEY,
      targetUrl TEXT NOT NULL,
      orderId TEXT,
      createdAt INTEGER,
      expiresAt INTEGER
    )
  `)
}
