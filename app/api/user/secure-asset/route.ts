export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'
import { getSession, verifyDownloadToken } from '@/lib/session'
import { DigitalAsset } from '@/lib/types'

// GET /api/user/secure-asset?productId=123&assetId=456[&token=jwt]
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const productId = searchParams.get('productId')
        const assetId = searchParams.get('assetId')
        const token = searchParams.get('token')

        if (!productId || !assetId) {
            return new NextResponse('Missing productId or assetId', { status: 400 })
        }

        let isAuthorized = false

        // 1. Check Magic Download Token (for cross-browser / direct email 1-click access without login)
        if (token) {
            const payload = await verifyDownloadToken(token)
            if (payload && payload.productId === productId && payload.assetId === assetId) {
                const tokenOrders = await executeQuery(
                    "SELECT items FROM orders WHERE id = ? AND (status = 'completed' OR status = 'paid') LIMIT 1",
                    [payload.orderId]
                )
                if (Array.isArray(tokenOrders) && tokenOrders.length > 0) {
                    const orderRow: any = tokenOrders[0]
                    try {
                        const items = typeof orderRow.items === 'string' ? JSON.parse(orderRow.items) : orderRow.items
                        if (Array.isArray(items) && items.some((item: any) => item.productId === productId || item.id === productId)) {
                            isAuthorized = true
                        }
                    } catch {}
                }
            }
        }

        // 2. Fallback to Logged-in Session Cookie (for Dashboard users)
        if (!isAuthorized) {
            const auth = await getSession()
            if (!auth) {
                return new NextResponse('Unauthorized: Please log in or use the direct download link from your confirmation email', { status: 401 })
            }

            const isAdmin = auth.role === 'admin'

            // Verify purchase if not admin
            if (!isAdmin) {
                const orders = await executeQuery(
                    "SELECT items FROM orders WHERE userId = ? AND (status = 'completed' OR status = 'paid')",
                    [auth.uid]
                )

                let hasPurchased = false;
                for (const order of orders || []) {
                    try {
                        const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items
                        if (Array.isArray(items) && items.some((item: any) => item.productId === productId || item.id === productId)) {
                            hasPurchased = true;
                            break;
                        }
                    } catch (e) { }
                }

                if (!hasPurchased) {
                    return new NextResponse('Forbidden: You have not purchased this product', { status: 403 })
                }
            }
            isAuthorized = true
        }

        // Get product to find the asset URL
        const products = await executeQuery(
            "SELECT downloadUrl FROM products WHERE id = ? LIMIT 1",
            [productId]
        )

        if (!products || products.length === 0) {
            return new NextResponse('Product not found', { status: 404 })
        }

        const product = products[0]
        let assets: DigitalAsset[] = []
        try {
            const parsed = JSON.parse(product.downloadUrl)
            if (Array.isArray(parsed)) assets = parsed
        } catch {
            if (typeof product.downloadUrl === 'string' && product.downloadUrl.trim().length > 0) {
                assets = [{
                    id: 'legacy',
                    name: 'Download',
                    type: 'file',
                    provider: 'external',
                    url: product.downloadUrl.trim(),
                }]
            }
        }

        const asset = assets.find(a => a.id === assetId)
        if (!asset) {
            return new NextResponse('Asset not found', { status: 404 })
        }

        if (asset.provider === 'external' || asset.type === 'link') {
            return NextResponse.redirect(asset.url)
        }

        // Stream the file securely (proxy)
        try {
            const fileRes = await fetch(asset.url)
            if (!fileRes.ok) {
                throw new Error(`Failed to fetch upstream file: ${fileRes.statusText}`)
            }

            // Copy necessary headers (Content-Type, Content-Length)
            const headers = new Headers()
            const contentType = fileRes.headers.get('content-type')
            const contentLength = fileRes.headers.get('content-length')

            if (contentType) headers.set('Content-Type', contentType)
            if (contentLength) headers.set('Content-Length', contentLength)

            // Determine correct filename and extension
            let baseName = asset.name || 'download'
            let ext = ''
            try {
                const urlPath = new URL(asset.url).pathname
                const match = urlPath.match(/\.([a-zA-Z0-9]+)$/)
                if (match) ext = `.${match[1]}`
            } catch (e) {}

            if (!ext) {
                if (asset.type === 'pdf' || (contentType && contentType.includes('pdf'))) ext = '.pdf'
                else if (asset.type === 'video' || (contentType && contentType.includes('video'))) ext = '.mp4'
            }

            let finalName = baseName
            if (ext && !finalName.toLowerCase().endsWith(ext.toLowerCase())) {
                finalName += ext
            }

            const isInline = searchParams.get('inline') === '1'
            const disposition = isInline ? 'inline' : 'attachment'

            // Force browser download securely (avoiding encodeURIComponent to keep spaces clean)
            const safeFilename = finalName.replace(/"/g, '')
            headers.set('Content-Disposition', `${disposition}; filename="${safeFilename}"`)
            headers.set('Cache-Control', 'private, max-age=0, must-revalidate')
            // Allow iframe/popup embedding from same origin
            headers.set('X-Frame-Options', 'SAMEORIGIN')

            return new NextResponse(fileRes.body, {
                status: 200,
                headers
            })
        } catch (error: any) {
            console.error("Secure asset proxy error:", error)
            return new NextResponse(`Error retrieving asset: ${error.message}`, { status: 502 })
        }

    } catch (error: any) {
        console.error("Secure asset handler error:", error)
        return new NextResponse(error.message, { status: 500 })
    }
}
