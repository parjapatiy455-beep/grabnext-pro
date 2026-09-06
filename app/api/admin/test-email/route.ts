export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { sendTestBrevoEmail, getBrevoSettings } from '@/lib/brevo'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid recipient email address is required' }, { status: 400 })
    }

    const settings = await getBrevoSettings()
    if (!settings.apiKey) {
      return NextResponse.json(
        { error: 'BREVO_API_KEY is not configured. Please set it in .env or settings table.' },
        { status: 400 }
      )
    }

    const result = await sendTestBrevoEmail(email)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: `Test email sent to ${email}`, messageId: result.messageId })
  } catch (error: any) {
    console.error('[Test Email API Error]', error)
    return NextResponse.json({ error: error.message || 'Failed to send test email' }, { status: 500 })
  }
}
