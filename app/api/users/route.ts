export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'
import { getSession } from '@/lib/session'
import { runMigrations } from '@/lib/migrations'

export const dynamic = 'force-dynamic'

// GET all users (admin only)
export async function GET(request: NextRequest) {
    try {
        const session = await getSession()
        if (!session) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }

        // Only admins can list users
        const current = await executeQuery('SELECT role FROM users WHERE uid = ?', [session.uid]) as any[]
        if (!current || current.length === 0 || current[0].role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
        }

        let users: any[]
        try {
            users = await executeQuery(
                'SELECT uid, email, displayName, role, phone, address, city, state, country, isGuest, createdAt, updatedAt FROM users ORDER BY createdAt DESC'
            ) as any[]
        } catch (dbError: any) {
            if (dbError.message?.includes('no such column')) {
                console.log('[Users API] Missing column detected. Triggering database migration upgrade...');
                await runMigrations()
                // Retry query
                users = await executeQuery(
                    'SELECT uid, email, displayName, role, phone, address, city, state, country, isGuest, createdAt, updatedAt FROM users ORDER BY createdAt DESC'
                ) as any[]
            } else {
                throw dbError
            }
        }

        return NextResponse.json(Array.isArray(users) ? users : [])
    } catch (error: any) {
        console.error('[v0] Users API Error:', error)
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

        // Prevent self-demotion
        if (uid === session.uid) {
            return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 })
        }

        await executeQuery('UPDATE users SET role = ?, updatedAt = ? WHERE uid = ?', [role, Date.now(), uid])
        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('[v0] Update User Role Error:', error)
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
        console.error('[v0] Delete User Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
