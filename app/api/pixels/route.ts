export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { getActivePixels } from '@/lib/pixels-db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const pixels = await getActivePixels()
    return NextResponse.json(pixels, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
      },
    })
  } catch (error: any) {
    console.error('[Public Pixels GET Error]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
