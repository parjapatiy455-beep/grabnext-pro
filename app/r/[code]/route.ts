export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { resolveShortLink } from '@/lib/short-link'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const code = params?.code?.trim()
    if (!code) {
      return NextResponse.redirect(new URL('/', request.url), 302)
    }

    const targetUrl = await resolveShortLink(code)
    if (targetUrl) {
      const redirectUrl = targetUrl.startsWith('http://') || targetUrl.startsWith('https://')
        ? new URL(targetUrl)
        : new URL(targetUrl, request.url)

      return NextResponse.redirect(redirectUrl, 307)
    }

    // If short link expired or not found, redirect to checkout
    return NextResponse.redirect(new URL('/checkout?recovered=expired', request.url), 302)
  } catch (error: any) {
    console.error('[Short Link Redirect Error]:', error)
    return NextResponse.redirect(new URL('/', request.url), 302)
  }
}
