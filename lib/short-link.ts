import { executeQuery } from '@/lib/db'

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

function generateRandomCode(length = 6): string {
  // Clean URL-safe alphanumeric characters
  const chars = '23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function createOrGetShortLink(params: {
  targetUrl: string
  orderId?: string
  ttlDays?: number
}): Promise<string> {
  try {
    await ensureShortLinksTable()

    const ttl = (params.ttlDays || 14) * 24 * 60 * 60 * 1000
    const now = Date.now()
    const expiresAt = now + ttl

    // Check if an unexpired short link for this exact order and target already exists
    if (params.orderId) {
      const existing = (await executeQuery(
        'SELECT code FROM short_links WHERE orderId = ? AND targetUrl = ? AND (expiresAt IS NULL OR expiresAt > ?) LIMIT 1',
        [params.orderId, params.targetUrl, now]
      )) as any[]
      if (existing && existing.length > 0 && existing[0].code) {
        return existing[0].code
      }
    }

    // Generate unique short code
    let attempts = 0
    while (attempts < 5) {
      const code = generateRandomCode(6)
      try {
        await executeQuery(
          'INSERT INTO short_links (code, targetUrl, orderId, createdAt, expiresAt) VALUES (?, ?, ?, ?, ?)',
          [code, params.targetUrl, params.orderId || null, now, expiresAt]
        )
        return code
      } catch {
        attempts++
      }
    }

    // Fallback code
    const fallbackCode = `${generateRandomCode(4)}${Date.now().toString(36).slice(-3)}`
    await executeQuery(
      'INSERT INTO short_links (code, targetUrl, orderId, createdAt, expiresAt) VALUES (?, ?, ?, ?, ?)',
      [fallbackCode, params.targetUrl, params.orderId || null, now, expiresAt]
    )
    return fallbackCode
  } catch (err) {
    console.error('[createOrGetShortLink Error]:', err)
    // If DB fails, return fallback code or throw
    return generateRandomCode(6)
  }
}

export async function resolveShortLink(code: string): Promise<string | null> {
  try {
    await ensureShortLinksTable()
    const now = Date.now()
    const rows = (await executeQuery(
      'SELECT targetUrl FROM short_links WHERE code = ? AND (expiresAt IS NULL OR expiresAt > ?) LIMIT 1',
      [code, now]
    )) as any[]

    if (rows && rows.length > 0 && rows[0].targetUrl) {
      return rows[0].targetUrl
    }
    return null
  } catch (err) {
    console.error('[resolveShortLink Error]:', err)
    return null
  }
}
