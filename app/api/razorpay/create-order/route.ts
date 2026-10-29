export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { getRequestContext } from '@cloudflare/next-on-pages'
import { executeQuery } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const orderId = body.orderId || body.receipt

        if (!orderId) {
            return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
        }

        // TAMPER PROTECTION: Always load order amount directly from database
        const orders: any[] = await executeQuery(
            'SELECT id, totalAmount, status, userName, userEmail FROM orders WHERE id = ? LIMIT 1',
            [orderId]
        )

        if (!orders || orders.length === 0) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        const dbOrder = orders[0]
        if (dbOrder.status === 'paid' || dbOrder.status === 'completed') {
            return NextResponse.json({ error: 'Order is already paid' }, { status: 400 })
        }

        const serverAmount = Number(dbOrder.totalAmount)
        if (isNaN(serverAmount) || serverAmount <= 0) {
            return NextResponse.json({ error: 'Order amount is 0, no payment required' }, { status: 400 })
        }

        const amountInPaise = Math.round(serverAmount * 100)

        let keyId: string | undefined
        let keySecret: string | undefined
        try {
            const ctx = getRequestContext()
            keyId = (ctx?.env as any)?.NEXT_PUBLIC_RAZORPAY_KEY_ID
            keySecret = (ctx?.env as any)?.RAZORPAY_KEY_SECRET
        } catch { }
        if (!keyId) keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
        if (!keySecret) keySecret = process.env.RAZORPAY_KEY_SECRET

        if (!keyId || !keySecret) {
            return NextResponse.json({ error: 'Razorpay keys not configured' }, { status: 500 })
        }

        // Create Razorpay order via official API
        const auth = btoa(`${keyId}:${keySecret}`)
        const res = await fetch('https://api.razorpay.com/v1/orders', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: amountInPaise,
                currency: 'INR',
                receipt: orderId,
                notes: {
                    orderId: dbOrder.id,
                    userEmail: dbOrder.userEmail || ''
                }
            }),
        })

        if (!res.ok) {
            const err = await res.text()
            console.error('[Razorpay Order Creation Failed]:', err)
            return NextResponse.json({ error: `Razorpay error: ${err}` }, { status: 500 })
        }

        const rzpOrder = await res.json()
        return NextResponse.json({
            orderId: rzpOrder.id,
            keyId,
            amount: amountInPaise,
            currency: 'INR'
        })
    } catch (error: any) {
        console.error('[Razorpay create-order Exception]:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
