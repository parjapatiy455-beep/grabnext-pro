export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'
import { sendPasswordResetEmail, getBrevoSettings } from '@/lib/brevo'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 })
    }

    const cleanEmail = email.trim().toLowerCase()

    // Ensure password_resets table exists
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expiresAt INTEGER NOT NULL,
        used INTEGER DEFAULT 0,
        createdAt INTEGER NOT NULL
      );
    `).catch(() => {})

    // Check if user exists in the database
    const users = await executeQuery('SELECT uid, email, displayName FROM users WHERE LOWER(email) = ?', [cleanEmail])
    if (!users || users.length === 0) {
      // Standard security: don't reveal whether email exists, return success message
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email address, a password reset link has been sent.',
      })
    }

    const user = users[0] as any

    // Invalidate previous unused reset tokens for this user
    await executeQuery(
      'UPDATE password_resets SET used = 1 WHERE LOWER(email) = ? AND used = 0',
      [cleanEmail]
    ).catch(() => {})

    // Generate secure 64-character token
    const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '')
    const id = crypto.randomUUID()
    const now = Date.now()
    const expiresAt = now + 60 * 60 * 1000 // 1 hour validity

    await executeQuery(
      'INSERT INTO password_resets (id, email, token, expiresAt, used, createdAt) VALUES (?, ?, ?, ?, 0, ?)',
      [id, cleanEmail, token, expiresAt, now]
    )

    const { appUrl } = await getBrevoSettings()
    const resetUrl = `${appUrl}/auth/reset-password?token=${token}`

    // Send email via Brevo
    const emailResult = await sendPasswordResetEmail({
      toEmail: user.email,
      toName: user.displayName || user.email.split('@')[0],
      resetUrl,
    })

    if (!emailResult.success) {
      console.warn('[Forgot Password] Brevo Email dispatch:', emailResult.error)
      return NextResponse.json({
        success: true,
        message: 'Password reset link has been sent to your email address.',
      })
    }

    return NextResponse.json({
      success: true,
      message: 'A password reset link has been sent to your email address.',
    })
  } catch (error: any) {
    console.error('[Forgot Password Error]', error)
    return NextResponse.json({ error: error.message || 'Failed to process request' }, { status: 500 })
  }
}
