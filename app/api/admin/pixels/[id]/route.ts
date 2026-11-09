export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'
import { getSession } from '@/lib/session'
import { ADMIN_EMAIL } from '@/lib/auth'
import { ensurePixelsTable } from '@/lib/pixels-db'

export const dynamic = 'force-dynamic'

async function verifyAdmin() {
  const session = await getSession()
  if (!session) return { error: 'Not authenticated', status: 401 }

  const current = (await executeQuery('SELECT role, email FROM users WHERE uid = ?', [session.uid])) as any[]
  const user = current?.[0]
  const isAdmin = user?.role === 'admin' || (user?.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase())
  if (!isAdmin) {
    return { error: 'Admin access required', status: 403 }
  }
  return { success: true }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await verifyAdmin()
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

    await ensurePixelsTable()
    const { id } = params
    const body = await request.json()
    const {
      name,
      type,
      pixelId,
      scriptCode,
      placement = 'head',
      triggerPage = 'all',
      testEventCode = '',
      description = '',
      isActive = 1,
    } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Pixel name is required' }, { status: 400 })
    }

    if (type !== 'custom_script' && (!pixelId || !pixelId.trim())) {
      return NextResponse.json({ error: 'Pixel ID is required' }, { status: 400 })
    }

    if (type === 'custom_script' && (!scriptCode || !scriptCode.trim())) {
      return NextResponse.json({ error: 'Script or event code is required' }, { status: 400 })
    }

    const now = Date.now()

    await executeQuery(
      `UPDATE pixels 
       SET name = ?, type = ?, pixelId = ?, scriptCode = ?, placement = ?, triggerPage = ?, testEventCode = ?, description = ?, isActive = ?, updatedAt = ?
       WHERE id = ?`,
      [
        name.trim(),
        type,
        pixelId ? pixelId.trim() : null,
        scriptCode ? scriptCode.trim() : null,
        placement || 'head',
        triggerPage || 'all',
        testEventCode ? testEventCode.trim() : '',
        description ? description.trim() : '',
        isActive ? 1 : 0,
        now,
        id,
      ]
    )

    return NextResponse.json({ success: true, message: 'Pixel updated successfully' })
  } catch (error: any) {
    console.error('[Admin Pixel PUT Error]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await verifyAdmin()
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

    await ensurePixelsTable()
    const { id } = params
    const body = await request.json().catch(() => ({}))
    const now = Date.now()

    let newStatus: number
    if (body.isActive !== undefined) {
      newStatus = body.isActive ? 1 : 0
    } else {
      const rows = (await executeQuery('SELECT isActive FROM pixels WHERE id = ?', [id])) as any[]
      if (!rows || rows.length === 0) {
        return NextResponse.json({ error: 'Pixel not found' }, { status: 404 })
      }
      newStatus = rows[0].isActive ? 0 : 1
    }

    await executeQuery('UPDATE pixels SET isActive = ?, updatedAt = ? WHERE id = ?', [newStatus, now, id])

    return NextResponse.json({
      success: true,
      message: `Pixel ${newStatus === 1 ? 'activated' : 'deactivated'} successfully`,
      isActive: newStatus,
    })
  } catch (error: any) {
    console.error('[Admin Pixel PATCH Error]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await verifyAdmin()
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

    await ensurePixelsTable()
    const { id } = params

    await executeQuery('DELETE FROM pixels WHERE id = ?', [id])

    return NextResponse.json({ success: true, message: 'Pixel deleted successfully' })
  } catch (error: any) {
    console.error('[Admin Pixel DELETE Error]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
