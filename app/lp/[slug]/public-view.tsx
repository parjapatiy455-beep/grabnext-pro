"use client"

import { useEffect } from 'react'
import { useCart, CartProvider } from '@/contexts/cart-context'
import { RenderSection } from '@/app/products/[id]/landing-page-view'
import { trackViewContent, trackAddToCart } from '@/lib/pixel'

interface Props {
    sections: any[]
    product: any
}

function interpolateProductData(value: any, product: any): any {
    if (typeof value === 'string') {
        const fmt = (p: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(p);
        const priceStr = fmt(product.price);
        const origPriceVal = (product as any).originalPrice || product.price * 2;
        const origPriceStr = fmt(origPriceVal);
        
        return value
            .replace(/\{\{price\}\}/g, priceStr)
            .replace(/\{price\}/g, priceStr)
            .replace(/\{\{originalPrice\}\}/g, origPriceStr)
            .replace(/\{originalPrice\}/g, origPriceStr)
            .replace(/\{\{title\}\}/g, product.title)
            .replace(/\{title\}/g, product.title);
    }
    if (Array.isArray(value)) {
        return value.map(item => interpolateProductData(item, product));
    }
    if (value && typeof value === 'object') {
        const result: any = {};
        for (const key in value) {
            result[key] = interpolateProductData(value[key], product);
        }
        return result;
    }
    return value;
}

export default function LandingPagePublicView({ sections, product }: Props) {
    const { addToCart, setDrawerOpen } = useCart()

    // Track Meta Pixel ViewContent when landing page product is loaded
    useEffect(() => {
        if (product && product.id && product.id !== 'lp-dummy') {
            try {
                trackViewContent({
                    content_name: product.title || "Landing Page Offer",
                    content_ids: [product.id],
                    contents: [{ id: product.id, quantity: 1, item_price: product.price || 0 }],
                    value: product.price || 0,
                    currency: "INR",
                })
            } catch (e) {
                console.error("ViewContent tracking error", e)
            }
        }
    }, [product])

    useEffect(() => {
        if (typeof sections !== 'string') return

        const handleBuyClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            if (target && (target.id === 'lp-buy-button' || target.closest('#lp-buy-button'))) {
                e.preventDefault()
                try {
                    trackAddToCart({
                        content_name: product?.title || "Landing Page Offer",
                        content_ids: [product?.id || "product"],
                        contents: [{ id: product?.id || "product", quantity: 1, item_price: product?.price || 0 }],
                        value: product?.price || 0,
                        currency: "INR",
                    })
                } catch (e) {
                    console.error("AddToCart tracking error", e)
                }
                addToCart(product)
                setDrawerOpen(true)
            }
        }

        document.addEventListener('click', handleBuyClick)
        return () => document.removeEventListener('click', handleBuyClick)
    }, [sections, addToCart, product, setDrawerOpen])

    if (!sections || (Array.isArray(sections) && sections.length === 0)) {
        return (
            <div className="flex items-center justify-center py-24 text-gray-400">
                <p className="text-lg">This landing page has no content yet.</p>
            </div>
        )
    }

    if (typeof sections === 'string') {
        return (
            <div className="w-full lp-preview-container" dangerouslySetInnerHTML={{ __html: interpolateProductData(sections, product) }} />
        )
    }

    return (
        <>
            {sections.map((sec: any) => {
                const processedSec = interpolateProductData(sec, product);
                return <RenderSection key={sec.id} section={processedSec} product={product} />
            })}
        </>
    )
}

// Wrapper to provide Cart Context
export function LandingPagePublicWrapper(props: Props) {
    return (
        <CartProvider>
            <LandingPagePublicView {...props} />
        </CartProvider>
    )
}
