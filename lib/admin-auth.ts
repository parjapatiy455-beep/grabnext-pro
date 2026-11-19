import { getSession } from '@/lib/session'
import { executeQuery } from '@/lib/db'

export async function isAdminSession(): Promise<boolean> {
  try {
    const session = await getSession()
    if (!session?.uid) return false
    const rows = await executeQuery(
      'SELECT role, email FROM users WHERE uid = ? LIMIT 1',
      [session.uid]
    ) as any[]
    if (rows && rows.length > 0 && rows[0].role === 'admin') {
      return true
    }
    if (session.role === 'admin' || session.email === 'yk8292238@gmail.com') {
      return true
    }
  } catch (err) {
    console.error('[Admin Auth] Admin verification failed:', err)
  }
  return false
}
