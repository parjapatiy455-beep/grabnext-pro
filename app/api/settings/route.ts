export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'

import { getRequestContext } from '@cloudflare/next-on-pages'

import { DEFAULT_PENDING_TEMPLATE, DEFAULT_PAID_TEMPLATE } from '@/lib/whatsapp'

export const dynamic = 'force-dynamic'

function getEnv(key: string): string | undefined {
    try {
        const ctx = getRequestContext()
        return (ctx?.env as any)?.[key] ?? process.env[key]
    } catch {
        return process.env[key]
    }
}

// Ensure settings table exists
async function ensureTable() {
    await executeQuery(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updatedAt INTEGER
    )
  `)
}

export async function GET() {
    try {
        await ensureTable()
        const rows = await executeQuery('SELECT key, value FROM settings')
        const settings: Record<string, string> = {}
        if (Array.isArray(rows)) {
            for (const r of rows) settings[r.key] = r.value
        }
        // Defaults
        if (!settings.payment_gateway) settings.payment_gateway = 'xpay'
        if (!settings.xpay_api_key) {
            settings.xpay_api_key = getEnv('XPAY_API_KEY') || getEnv('NEXT_PUBLIC_XPAY_API_KEY') || 'xp_live_wtm5vj64kseuylg9cfmsl9'
        }
        if (!settings.whatsapp_pending_template) {
            settings.whatsapp_pending_template = DEFAULT_PENDING_TEMPLATE
        }
        if (!settings.whatsapp_paid_template) {
            settings.whatsapp_paid_template = DEFAULT_PAID_TEMPLATE
        }
        if (!settings.whatsapp_recovery_discount_percent) {
            settings.whatsapp_recovery_discount_percent = '10'
        }
        return NextResponse.json(settings, {
            headers: { 'Cache-Control': 'no-store' }
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        await ensureTable()
        const data = await request.json()
        const now = Date.now()
        for (const [key, value] of Object.entries(data)) {
            await executeQuery(
                'INSERT INTO settings (key, value, updatedAt) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = excluded.updatedAt',
                [key, String(value), now]
            )
        }
        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
