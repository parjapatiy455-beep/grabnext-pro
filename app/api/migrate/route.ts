export const runtime = 'edge'
import { NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'

export async function GET() {
    const results = []
    const queries = [
        "ALTER TABLE products ADD COLUMN pageType TEXT DEFAULT 'shop';",
        "ALTER TABLE products ADD COLUMN pageCode TEXT;",
        "ALTER TABLE products ADD COLUMN originalPrice REAL;",
        "ALTER TABLE products ADD COLUMN slug TEXT;",
        "ALTER TABLE products ADD COLUMN images TEXT;",
        "ALTER TABLE products ADD COLUMN displayOrder INTEGER DEFAULT 0;",
        
        // Also create missing tables just in case
        `CREATE TABLE IF NOT EXISTS lp_analytics (
            id TEXT PRIMARY KEY,
            productId TEXT NOT NULL,
            productSlug TEXT,
            event TEXT NOT NULL,
            data TEXT,
            ip TEXT,
            createdAt INTEGER
        );`,
        `CREATE TABLE IF NOT EXISTS lp_form_submissions (
            id TEXT PRIMARY KEY,
            productId TEXT NOT NULL,
            productTitle TEXT,
            fields TEXT NOT NULL,
            ip TEXT,
            createdAt INTEGER
        );`
    ]

    for (const sql of queries) {
        try {
            await executeQuery(sql)
            results.push({ sql, status: 'success' })
        } catch (e: any) {
            // Ignore duplicate column errors, log others
            if (e.message && e.message.includes('duplicate column name')) {
                results.push({ sql, status: 'already exists' })
            } else {
                results.push({ sql, status: 'error', error: e.message })
            }
        }
    }

    return NextResponse.json({ success: true, results })
}
