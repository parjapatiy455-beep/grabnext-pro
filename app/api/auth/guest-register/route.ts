export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'
import { encrypt } from '@/lib/session'
import { cookies } from 'next/headers'
import { sendGuestAccountEmail } from '@/lib/brevo'

export const dynamic = 'force-dynamic'

function generatePassword(length = 10): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
    let password = ''
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length))
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
// Creates a guest account and auto-logs-in the user via session cookie
export async function POST(request: NextRequest) {
    try {
        const { email, displayName, phone } = await request.json()

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 })
        }

        // Check if user already exists
        const existing = await executeQuery(
            'SELECT uid, email, displayName, isGuest FROM users WHERE email = ? LIMIT 1',
            [email]
        )

        if (existing && existing.length > 0) {
            const existingUser = existing[0] as any

            // SECURITY CHECK: If it's a real user (not a guest), we MUST NOT auto-login without a password.
            // They must use the regular login page.
            if (existingUser.isGuest !== 1 && existingUser.isGuest !== true) {
                return NextResponse.json({
                    error: 'An account with this email already exists and is not a guest account. Please log in to continue.'
                }, { status: 403 })
            }

            // If it IS a guest account, auto-login them safely and return info
            const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            const session = await encrypt({
                uid: existingUser.uid,
                email: existingUser.email,
                role: 'user',
                expires
            })
            cookies().set('session', session, { expires, httpOnly: true })

            return NextResponse.json({
                user: {
                    uid: existingUser.uid,
                    email: existingUser.email,
                    displayName: existingUser.displayName,
                    isGuest: true
                },
                isExisting: true,
                temporaryPassword: null,
                message: 'Welcome back! We found your guest account and logged you in.'
            })
        }

        // Create new guest account
        const uid = crypto.randomUUID()
        const temporaryPassword = generatePassword(10)
        // Switch to plain text to match existing login/register logic
        const passwordHash = temporaryPassword
        const now = Date.now()
        const name = displayName || email.split('@')[0]

        try {
            await executeQuery(
                `INSERT INTO users (uid, email, passwordHash, displayName, role, phone, isGuest, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, 'user', ?, 1, ?, ?)`,
                [uid, email, passwordHash, name, phone || '', now, now]
            )
        } catch (dbError: any) {
            console.error('[Guest DB Error]', dbError)
            return NextResponse.json({ error: `Database Save Failed: ${dbError.message}` }, { status: 500 })
        }

        // Auto-login: set session cookie
        const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        const session = await encrypt({
            uid,
            email,
            role: 'user',
            expires
        })
        cookies().set('session', session, { expires, httpOnly: true })

        // Send Account Confirmation & Password Email via Brevo
        await sendGuestAccountEmail({
            toEmail: email,
            toName: name,
            temporaryPassword,
        }).catch(err => console.error('[Guest Account Email Error]', err))

        return NextResponse.json({
            user: { uid, email, displayName: name, isGuest: true },
            isExisting: false,
            temporaryPassword,
            message: `Welcome to Grabnext! A guest account has been created for you. Account login details have been emailed to ${email}.`
        }, { status: 201 })
    } catch (error: any) {
        console.error('[Guest Register Error]', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
