export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
    request: NextRequest,
    { params }: { params: { paymentId: string } }
) {
    try {
        const { paymentId } = params

        // Query by paymentId (UTR) - TAMPER PROTECTION: strictly allow only confirmed paid orders
        const results = await executeQuery(
            "SELECT * FROM orders WHERE paymentId = ? AND (status = 'paid' OR status = 'completed') LIMIT 1",
            [paymentId]
        )

        if (!Array.isArray(results) || results.length === 0) {
            return NextResponse.json({ error: "Order not found or payment not completed" }, { status: 404 })
        }

        const o = results[0] as any
        const order = {
            ...o,
            items: o.items ? JSON.parse(o.items) : []
        }

        // Fetch download URLs for each product in the order
        const productIds = order.items.map((item: any) => item.productId)
        if (productIds.length > 0) {
            const placeholders = productIds.map(() => '?').join(',')
            const products = await executeQuery(
                `SELECT id, downloadUrl FROM products WHERE id IN (${placeholders})`,
                productIds
            )

            if (Array.isArray(products)) {
                order.items = order.items.map((item: any) => {
                    const product = products.find((p: any) => p.id === item.productId)
                    return { ...item, downloadUrl: product?.downloadUrl || null }
                })
            }
        }

        return NextResponse.json(order)
    } catch (error: any) {
        console.error("[Order By Payment API Error]:", error)
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
    }
}
