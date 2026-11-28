export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'
import { encrypt } from '@/lib/session'
import { cookies } from 'next/headers'
import { sendGuestAccountEmail } from '@/lib/brevo'

export const dynamic = 'force-dynamic'

function generatePassword(length = 12): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
    const bytes = new Uint8Array(length)
    crypto.getRandomValues(bytes)
    let password = ''
    for (let i = 0; i < length; i++) {
        password += chars.charAt(bytes[i] % chars.length)
    }
    return password
}

async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// POST /api/auth/guest-register
// Creates a new guest account for first-time checkout emails; never auto-logs into existing accounts
export async function POST(request: NextRequest) {
    try {
        const { email, displayName, phone } = await request.json()
        const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''

        if (!cleanEmail || !cleanEmail.includes('@')) {
            return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
        }

        // Check if any account (registered or guest) already exists for this email (case-insensitive)
        const existing = await executeQuery(
            'SELECT uid, email, displayName, isGuest FROM users WHERE LOWER(email) = ? LIMIT 1',
            [cleanEmail]
        )

        if (existing && existing.length > 0) {
            return NextResponse.json({
                error: 'An account with this email already exists. Please sign in or reset your password to access previous orders.'
            }, { status: 403 })
        }

        // Create new guest account
        const uid = crypto.randomUUID()
        const temporaryPassword = generatePassword(12)
        const passwordHash = await hashPassword(temporaryPassword)
        const now = Date.now()
        const name = (typeof displayName === 'string' && displayName.trim()) ? displayName.trim() : cleanEmail.split('@')[0]

        try {
            await executeQuery(
                `INSERT INTO users (uid, email, passwordHash, displayName, role, phone, isGuest, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, 'user', ?, 1, ?, ?)`,
                [uid, cleanEmail, passwordHash, name, phone || '', now, now]
            )
        } catch (dbError: any) {
            console.error('[Guest DB Error]', dbError)
            return NextResponse.json({ error: `Database Save Failed: ${dbError.message}` }, { status: 500 })
        }

        // Auto-login ONLY for this brand-new guest account
        const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        const session = await encrypt({
            uid,
            email: cleanEmail,
            role: 'user',
            expires
        })
        cookies().set('session', session, {
            expires,
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            path: '/',
        })

        // Send Account Confirmation & Password Email via Brevo
        const emailRes = await sendGuestAccountEmail({
            toEmail: cleanEmail,
            toName: name,
            temporaryPassword,
        })

        if (!emailRes.success) {
            console.error(`[Guest Account Email Failure] to ${cleanEmail}:`, emailRes.error)
        } else {
            console.log(`[Guest Account Email Sent] Message ID: ${emailRes.messageId} to ${cleanEmail}`)
        }

        const emailNotice = emailRes.success
            ? `Account login details have been emailed to ${cleanEmail}.`
            : `Please set a permanent password from your dashboard to secure your account.`

        return NextResponse.json({
            user: { uid, email: cleanEmail, displayName: name, isGuest: true },
            isExisting: false,
            emailSent: emailRes.success,
            emailError: emailRes.success ? null : emailRes.error,
            message: `Welcome to Grabnext! A guest account has been created for you. ${emailNotice}`
        }, { status: 201 })
    } catch (error: any) {
        console.error('[Guest Register Error]', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
