export const runtime = 'edge'
import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'

export const dynamic = 'force-dynamic'

async function getSettings() {
    try {
        const rows = await executeQuery('SELECT key, value FROM settings')
        const s: Record<string, string> = {}
        if (Array.isArray(rows)) for (const r of rows) s[r.key] = r.value
        return s
    } catch { return {} }
}

function extractJSON(text: string) {
    try {
        const clean = text.replace(/```json/g, '').replace(/```/g, '').trim()
        return JSON.parse(clean)
    } catch {
        return []
    }
}

const SYSTEM_PROMPT = `You are an expert frontend developer, landing page designer, and copywriter.
When asked to create a landing page, return ONLY raw, valid HTML code using Tailwind CSS classes for styling.
Do NOT use any markdown formatting, do not wrap the output in \`\`\`html tags, and do not provide any explanations.
Just output the raw HTML string.

Requirements:
1. Use semantic HTML5 tags (header, section, footer, main, article).
2. Use modern, premium Tailwind CSS utility classes (e.g., vibrant gradients, beautiful typography, flex/grid layouts, proper padding/margins, drop shadows, rounded corners).
3. Always include a clear Call to Action (CTA).
4. If you need to include a "Buy Now" or "Add to Cart" button for a product, you MUST give it the exact ID "lp-buy-button". Example: <button id="lp-buy-button" class="bg-blue-600 text-white font-bold py-3 px-8 rounded-full hover:bg-blue-700 shadow-lg">Buy Now</button>
5. If you need images, use high-quality Unsplash source URLs (e.g., https://images.unsplash.com/photo-...).
6. Ensure the design is fully responsive (use sm:, md:, lg: prefixes).
7. Do not include <html>, <head>, or <body> tags. Just return the content that will go INSIDE the main container.`

async function callNvidia(apiKey: string, model: string, systemPrompt: string, userPrompt: string) {
    const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
            model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.8,
            max_tokens: 3000,
            stream: false,
        })
    })
    return res
}

async function callGemini(apiKey: string, model: string, systemPrompt: string, userPrompt: string, jsonMode = true) {
    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemPrompt }] },
                contents: [{ parts: [{ text: userPrompt }] }],
                generationConfig: {
                    temperature: 0.8,
                    ...(jsonMode ? { responseMimeType: 'application/json' } : {})
                }
            })
        }
    )
    return res
}

function extractHTML(text: string): string {
    return text.replace(/```html\n?/gi, '').replace(/```\n?/g, '').trim()
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { mode, prompt, productTitle, productPrice, productDescription, productImage, htmlContent, apiKey: bodyApiKey, model: bodyModel } = body

        const settings = await getSettings()
        const nvidiaKey = settings.nvidia_api_key?.trim()
        const nvidiaModel = settings.nvidia_model?.trim() || 'minimaxai/minimax-m1-40k'
        const geminiKey = bodyApiKey || settings.gemini_api_key?.trim()
        const geminiModel = bodyModel || settings.gemini_model?.trim() || 'gemini-2.5-flash'

        // ── TEST MODE ──────────────────────────────────────────────────────────
        if (mode === 'test') {
            if (!geminiKey) return NextResponse.json({ error: 'Gemini API key not configured.' }, { status: 400 })
            const testRes = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`,
                { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: 'Say ok.' }] }] }) }
            )
            if (!testRes.ok) { const err = await testRes.json(); return NextResponse.json({ error: err?.error?.message }, { status: 400 }) }
            return NextResponse.json({ ok: true })
        }

        // ── BANNER IMAGE MODE ──────────────────────────────────────────────────
        if (mode === 'banner-image') {
            const imagePrompt = prompt || `professional product banner for ${productTitle || 'a product'}, marketing photography, studio lighting, clean background, high quality`
            const encodedPrompt = encodeURIComponent(imagePrompt)
            const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1200&height=500&nologo=true&seed=${Date.now()}`
            return NextResponse.json({ imageUrl })
        }

        let userPrompt = ''
        if (mode === 'full') {
            userPrompt = `Create a complete, high-converting sales funnel landing page for:
Product: ${productTitle || 'Product'}
Price: ${productPrice ? `₹${productPrice}` : 'Premium'}
Description: ${productDescription || ''}
Product Image URL: ${productImage || ''}
Extra Instructions: ${prompt || 'Make it professional, modern, and conversion-focused'}

Make sure to include a hero section, features, testimonials, and a strong CTA with the "lp-buy-button" ID. If a Product Image URL is provided, you MUST use it prominently in the hero section.`

        } else if (mode === 'edit') {
            userPrompt = `Edit the following landing page HTML based on the user's instructions.
Current HTML:
${htmlContent || ''}

Instructions: ${prompt}
Product: ${productTitle || 'Product'}

Return the fully updated HTML.`

        } else if (mode === 'copy') {
            const copyRes = await callGemini(geminiKey || '', geminiModel, 'You are a copywriter.', `Generate 3 headline + CTA pairs for: ${productTitle}. Return JSON: [{headline, subheadline, cta}]`, false)
            if (!copyRes.ok) return NextResponse.json({ error: 'AI error' }, { status: 500 })
            const copyData = await copyRes.json()
            const text = copyData.candidates?.[0]?.content?.parts?.[0]?.text || '[]'
            return NextResponse.json({ suggestions: extractJSON(text) })
        }

        // ── Call AI: NVIDIA first, Gemini fallback ─────────────────────────────
        let rawText = ''

        if (nvidiaKey) {
            try {
                const nvidiaRes = await callNvidia(nvidiaKey, nvidiaModel, SYSTEM_PROMPT, userPrompt)
                if (nvidiaRes.ok) {
                    const nvidiaData = await nvidiaRes.json()
                    rawText = nvidiaData?.choices?.[0]?.message?.content || ''
                } else {
                    console.warn('[LP Gen] NVIDIA failed:', nvidiaRes.status)
                }
            } catch (e) {
                console.warn('[LP Gen] NVIDIA error:', e)
            }
        }

        if (!rawText && geminiKey) {
            const geminiRes = await callGemini(geminiKey, geminiModel, SYSTEM_PROMPT, userPrompt, false)
            if (!geminiRes.ok) {
                const err = await geminiRes.json()
                return NextResponse.json({ error: err?.error?.message || 'Gemini error' }, { status: 500 })
            }
            const geminiData = await geminiRes.json()
            rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '[]'
        }

        if (!rawText) {
            return NextResponse.json({ error: 'No AI configured. Add NVIDIA or Gemini key in AI Settings.' }, { status: 400 })
        }

        const html = extractHTML(rawText)
        return NextResponse.json({ html })

    } catch (error: any) {
        console.error('[LP Gen Error]', error)
        return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
    }
}
