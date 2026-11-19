export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'
import { getSession } from '@/lib/session'
import { runMigrations } from '@/lib/migrations'

export const dynamic = 'force-dynamic'

// GET all users (admin only) — paginated
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const current = await executeQuery('SELECT role FROM users WHERE uid = ?', [session.uid]) as any[]
    if (!current || current.length === 0 || current[0].role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const url = new URL(request.url)
    const page   = Math.max(1, parseInt(url.searchParams.get('page')  || '1', 10))
    const limit  = Math.min(500, Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10)))
    const offset = (page - 1) * limit
    const search = url.searchParams.get('search') || ''
    const role   = url.searchParams.get('role')   || 'all'
    const type   = url.searchParams.get('type')   || 'all'

    const conditions: string[] = []
    const params: any[] = []

    if (search.trim()) {
      conditions.push('(email LIKE ? OR displayName LIKE ? OR phone LIKE ? OR city LIKE ? OR country LIKE ?)')
      const q = `%${search.trim().slice(0, 50)}%`
      params.push(q, q, q, q, q)
    }

    if (role && role !== 'all') {
      conditions.push('role = ?')
      params.push(role)
    }

    if (type === 'guest') {
      conditions.push('(isGuest = 1 OR isGuest = true OR isGuest = "1")')
    } else if (type === 'registered') {
      conditions.push('(isGuest IS NULL OR isGuest = 0 OR isGuest = false OR isGuest = "0")')
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Total count for pagination
    let totalCount = 0
    try {
      const cnt = await executeQuery(
        `SELECT COUNT(*) as cnt FROM users ${whereClause}`, params
      ) as any[]
      totalCount = cnt?.[0]?.cnt ?? 0
    } catch {}

    let users: any[]
    try {
      users = await executeQuery(
        `SELECT uid, email, displayName, role, phone, city, state, country, isGuest, createdAt
         FROM users ${whereClause}
         ORDER BY createdAt DESC
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      ) as any[]
    } catch (dbError: any) {
      if (dbError.message?.includes('no such column')) {
        console.log('[Users API] Missing column detected. Running migration...')
        await runMigrations()
        users = await executeQuery(
          `SELECT uid, email, displayName, role, phone, isGuest, createdAt
           FROM users ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
          [limit, offset]
        ) as any[]
      } else {
        throw dbError
      }
    }

    const userList = Array.isArray(users) ? users : []

    // If client requested pagination explicitly, return with pagination metadata
    if (url.searchParams.has('page') || url.searchParams.has('limit') || url.searchParams.has('paginated')) {
      return NextResponse.json({
        users: userList,
        pagination: {
          page, limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasMore: page * limit < totalCount,
        }
      })
    }

    // Default backward compatible response: direct array (capped at limit)
    return NextResponse.json(userList)
  } catch (error: any) {
    console.error('[Users API] GET Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH: Update user role (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const current = await executeQuery('SELECT role FROM users WHERE uid = ?', [session.uid]) as any[]
    if (!current || current.length === 0 || current[0].role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { uid, role } = await request.json()
    if (!uid || !role) return NextResponse.json({ error: 'uid and role required' }, { status: 400 })

    if (uid === session.uid) {
      return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 })
    }

    await executeQuery('UPDATE users SET role = ?, updatedAt = ? WHERE uid = ?', [role, Date.now(), uid])
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Users API] PATCH Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE: Delete a user (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const current = await executeQuery('SELECT role FROM users WHERE uid = ?', [session.uid]) as any[]
    if (!current || current.length === 0 || current[0].role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { uid } = await request.json()
    if (!uid) return NextResponse.json({ error: 'uid required' }, { status: 400 })
    if (uid === session.uid) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })
    }

    await executeQuery('DELETE FROM users WHERE uid = ?', [uid])
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Users API] DELETE Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
