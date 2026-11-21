import { getSession } from '@/lib/session'
import { executeQuery } from '@/lib/db'

export async function isAdminSession(): Promise<boolean> {
  try {
    const session = await getSession()
    if (!session?.uid) return false

    const configuredAdminEmail = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'yk8292238@gmail.com').toLowerCase().trim()

    if (
      session.role === 'admin' ||
      (session.email && (
        session.email.toLowerCase().trim() === 'yk8292238@gmail.com' ||
        session.email.toLowerCase().trim() === configuredAdminEmail
      ))
    ) {
      return true
    }

    const rows = await executeQuery(
      'SELECT role, email FROM users WHERE uid = ? LIMIT 1',
      [session.uid]
    ) as any[]

    if (rows && rows.length > 0) {
      const u = rows[0]
      if (u.role === 'admin') return true
      if (u.email && (
        u.email.toLowerCase().trim() === 'yk8292238@gmail.com' ||
        u.email.toLowerCase().trim() === configuredAdminEmail
      )) {
        return true
      }
    }
  } catch (err) {
    console.error('[Admin Auth] Admin verification failed:', err)
  }
  return false
}
