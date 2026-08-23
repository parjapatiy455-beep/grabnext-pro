export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { runMigrations } from '@/lib/migrations'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        await runMigrations()
        return NextResponse.json({ success: true, message: "Database schema successfully migrated and updated" })
    } catch (error: any) {
        console.error("[v0] Init API Error:", error)
        return NextResponse.json({ error: error?.message || "Unknown error" }, { status: 500 })
    }
}
