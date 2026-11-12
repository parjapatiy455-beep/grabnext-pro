export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'
import { getSession } from '@/lib/session'
import { ADMIN_EMAIL } from '@/lib/auth'
import { ensurePixelsTable, getAllPixels } from '@/lib/pixels-db'

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

export async function GET() {
  try {
    const auth = await verifyAdmin()
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const pixels = await getAllPixels()
    return NextResponse.json(pixels)
  } catch (error: any) {
    console.error('[Admin Pixels GET Error]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdmin()
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

    await ensurePixelsTable()

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
      isPrimary = false,
    } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Pixel name is required' }, { status: 400 })
    }

    if (!type) {
      return NextResponse.json({ error: 'Pixel type is required' }, { status: 400 })
    }

    if (type !== 'custom_script' && (!pixelId || !pixelId.trim())) {
      return NextResponse.json({ error: 'Pixel ID is required for this type' }, { status: 400 })
    }

    if (type === 'custom_script' && (!scriptCode || !scriptCode.trim())) {
      return NextResponse.json({ error: 'Script or event code is required' }, { status: 400 })
    }

    const id = `pix_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    const now = Date.now()
    const primaryFlag = type === 'facebook' && Boolean(isPrimary) ? 1 : 0
    const activeFlag = primaryFlag === 1 ? 1 : (isActive ? 1 : 0)

    if (primaryFlag === 1) {
      await executeQuery(`UPDATE pixels SET isPrimary = 0 WHERE type = 'facebook'`)
    }

    await executeQuery(
      `INSERT INTO pixels (id, name, type, pixelId, scriptCode, placement, triggerPage, testEventCode, description, isActive, isPrimary, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        name.trim(),
        type,
        pixelId ? pixelId.trim() : null,
        scriptCode ? scriptCode.trim() : null,
        placement || 'head',
        triggerPage || 'all',
        testEventCode ? testEventCode.trim() : '',
        description ? description.trim() : '',
        activeFlag,
        primaryFlag,
        now,
        now,
      ]
    )

    return NextResponse.json({
      success: true,
      message: 'Pixel created successfully',
      pixel: {
        id,
        name: name.trim(),
        type,
        pixelId: pixelId ? pixelId.trim() : null,
        scriptCode: scriptCode ? scriptCode.trim() : null,
        placement,
        triggerPage,
        testEventCode: testEventCode ? testEventCode.trim() : '',
        description: description ? description.trim() : '',
        isActive: activeFlag,
        isPrimary: primaryFlag,
        createdAt: now,
        updatedAt: now,
      },
    })
  } catch (error: any) {
    console.error('[Admin Pixels POST Error]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
