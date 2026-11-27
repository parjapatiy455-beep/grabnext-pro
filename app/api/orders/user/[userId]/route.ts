import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'
import { getSession } from '@/lib/session'
import { isAdminSession } from '@/lib/admin-auth'

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const admin = await isAdminSession()
    const session = admin ? null : await getSession()

    if (!admin && !session?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!admin && session?.uid !== params.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const results = await executeQuery(
      "SELECT * FROM orders WHERE userId = ? ORDER BY createdAt DESC",
      [params.userId]
    )

    const orders = results.map((o: any) => {
      let parsedItems: any[] = []
      try {
        parsedItems = o.items ? JSON.parse(o.items) : []
      } catch {
        parsedItems = []
      }
      const isPaid = o.status === 'paid' || o.status === 'completed'
      if (!admin && !isPaid) {
        parsedItems = parsedItems.map((it: any) => {
          const { downloadUrl, ...rest } = it
          return rest
        })
      }
      return {
        ...o,
        items: parsedItems
      }
    })

    return NextResponse.json(orders, {
      headers: { 'Cache-Control': 'private, no-store' }
    })
  } catch (error: any) {
    console.error("[v0] User Orders API Error:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}
