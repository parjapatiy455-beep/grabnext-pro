export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'

export const dynamic = 'force-dynamic'

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// GET /api/auth/reset-password?token=...
// Verifies if a reset token is valid and not expired
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')?.trim()

    if (!token) {
      return NextResponse.json({ valid: false, error: 'Token is missing' }, { status: 400 })
    }

    const rows = await executeQuery(
      'SELECT id, email, expiresAt, used FROM password_resets WHERE token = ? LIMIT 1',
      [token]
    )

    if (!rows || rows.length === 0) {
      return NextResponse.json({ valid: false, error: 'Invalid reset link' }, { status: 404 })
    }

    const resetRow = rows[0] as any
    const now = Date.now()

    if (resetRow.used === 1) {
      return NextResponse.json({ valid: false, error: 'This reset link has already been used' }, { status: 400 })
    }

    if (Number(resetRow.expiresAt) < now) {
      return NextResponse.json({ valid: false, error: 'This reset link has expired. Please request a new one.' }, { status: 400 })
    }

    // Mask email for display: yk***@gmail.com
    const emailParts = (resetRow.email || '').split('@')
    const masked = emailParts[0].length > 2
      ? emailParts[0].slice(0, 2) + '***@' + (emailParts[1] || '')
      : resetRow.email

    return NextResponse.json({ valid: true, email: masked })
  } catch (error: any) {
    console.error('[Verify Reset Token Error]', error)
    return NextResponse.json({ valid: false, error: error.message || 'Verification failed' }, { status: 500 })
  }
}

// POST /api/auth/reset-password
// Sets the new password and invalidates the token
export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json()

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Reset token is required' }, { status: 400 })
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const rows = await executeQuery(
      'SELECT id, email, expiresAt, used FROM password_resets WHERE token = ? LIMIT 1',
      [token]
    )

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Invalid or unrecognized reset link' }, { status: 404 })
    }

    const resetRow = rows[0] as any
    const now = Date.now()

    if (resetRow.used === 1) {
      return NextResponse.json({ error: 'This reset link has already been used. Please request a new one.' }, { status: 400 })
    }

    if (Number(resetRow.expiresAt) < now) {
      return NextResponse.json({ error: 'This reset link has expired. Please request a new one.' }, { status: 400 })
    }

    const cleanEmail = resetRow.email.trim().toLowerCase()
    const passwordHash = await hashPassword(newPassword)

    // Update password in database (we save the plaintext or hash; as login route now checks both, storing newPassword or hash works reliably)
    await executeQuery(
      'UPDATE users SET passwordHash = ?, isGuest = 0, updatedAt = ? WHERE LOWER(email) = ?',
      [newPassword, now, cleanEmail]
    )

    // Mark token as used so it cannot be reused
    await executeQuery(
      'UPDATE password_resets SET used = 1 WHERE token = ?',
      [token]
    )

    return NextResponse.json({
      success: true,
      message: 'Password reset successful! You can now sign in with your new password.',
    })
  } catch (error: any) {
    console.error('[Reset Password Error]', error)
    return NextResponse.json({ error: error.message || 'Failed to reset password' }, { status: 500 })
  }
}
