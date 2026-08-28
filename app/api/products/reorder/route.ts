export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'

export const dynamic = 'force-dynamic'

// POST /api/products/reorder
// Accepts: { items: [{ id: string, displayOrder: number }] } or { orderedIds: string[] }
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const now = Date.now()

    let updates: { id: string; displayOrder: number }[] = []

    if (Array.isArray(data.items)) {
      updates = data.items.map((item: any) => ({
        id: String(item.id),
        displayOrder: typeof item.displayOrder === 'number' ? item.displayOrder : (parseInt(item.displayOrder, 10) || 0)
      }))
    } else if (Array.isArray(data.orderedIds)) {
      updates = data.orderedIds.map((id: string, index: number) => ({
        id: String(id),
        displayOrder: index + 1
      }))
    } else {
      return NextResponse.json({ error: 'Invalid payload. Expected items array or orderedIds array.' }, { status: 400 })
    }

    // Ensure column exists
    await executeQuery('ALTER TABLE products ADD COLUMN displayOrder INTEGER DEFAULT 0').catch(() => {})

    // Execute updates in parallel for fast batch saving
    await Promise.all(
      updates.map(({ id, displayOrder }) =>
        executeQuery('UPDATE products SET displayOrder = ?, updatedAt = ? WHERE id = ?', [displayOrder, now, id])
      )
    )

    return NextResponse.json({ success: true, updatedCount: updates.length })
  } catch (error: any) {
    console.error('[Products Reorder Error]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
