"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { StoreHeader } from "@/components/store-header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { useCart } from "@/contexts/cart-context"
import { Zap, ShoppingCart, Star, Loader2, Trash2, GripHorizontal } from "lucide-react"
import { LandingSection, FloatingNode } from "@/lib/types"
import type { Product } from "@/lib/types"
import { trackViewContent } from "@/lib/pixel"

// ─── CSS animations (injected once) ─────────────────────────────────────────
const ANIM_CSS = `
@keyframes lp-fadeIn { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: none; } }
@keyframes lp-slideLeft { from { opacity: 0; transform: translateX(-40px); } to { opacity: 1; transform: none; } }
@keyframes lp-slideRight { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: none; } }
@keyframes lp-zoomIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: none; } }
.lp-anim-fadeIn { animation: lp-fadeIn 0.7s ease forwards; }
.lp-anim-slideLeft { animation: lp-slideLeft 0.7s ease forwards; }
.lp-anim-slideRight { animation: lp-slideRight 0.7s ease forwards; }
.lp-anim-zoomIn { animation: lp-zoomIn 0.6s ease forwards; }
.lp-hidden { opacity: 0; }
`

function AnimatedWrapper({ animation, children }: { animation?: string; children: React.ReactNode }) {
    const ref = useRef<HTMLDivElement>(null)
    const [visible, setVisible] = useState(!animation || animation === 'none')

    useEffect(() => {
        if (!animation || animation === 'none') { setVisible(true); return }
        const el = ref.current
        if (!el) return
        const obs = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) { setVisible(true); obs.disconnect() }
        }, { threshold: 0.1 })
        obs.observe(el)
        return () => obs.disconnect()
    }, [animation])

    const cls = animation && animation !== 'none' && visible ? `lp-anim-${animation}` : (!visible ? 'lp-hidden' : '')
    return <div ref={ref} className={cls}>{children}</div>
}

function getSpacingStyles(section: LandingSection) {
    const basePadding = section.paddingY === 'sm' ? '2rem' : section.paddingY === 'lg' ? '6rem' : '3.5rem'
    return {
        paddingTop: section.paddingTop || basePadding,
        paddingBottom: section.paddingBottom || basePadding,
        marginTop: section.marginTop || '0px',
        marginBottom: section.marginBottom || '0px',
        backgroundColor: section.bgColor || 'transparent',
        color: section.textColor || 'inherit',
        fontFamily: section.fontFamily ? `"${section.fontFamily}", sans-serif` : 'inherit',
        position: 'relative' as const
    }
}

// ─── Floating Node Renderer (Drag & Drop) ──────────────────────────────────
function FloatingNodeRenderer({ node, isBuilder, onChange, onDelete }: { node: FloatingNode; isBuilder?: boolean; onChange: (n: FloatingNode) => void; onDelete: () => void }) {
    const [localPos, setLocalPos] = useState({ x: node.x || 0, y: node.y || 0 })
    const isDragging = useRef(false)
    const dragStart = useRef({ x: 0, y: 0, mouseX: 0, mouseY: 0 })

    useEffect(() => { setLocalPos({ x: node.x || 0, y: node.y || 0 }) }, [node.x, node.y])

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isBuilder) return;
        if (!(e.target as HTMLElement).closest('.drag-handle')) return;
        e.stopPropagation();
        e.preventDefault();
        const el = e.currentTarget;
        el.setPointerCapture(e.pointerId);
        isDragging.current = true;
        dragStart.current = { x: localPos.x, y: localPos.y, mouseX: e.clientX, mouseY: e.clientY };
    }

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDragging.current) return;
        const dx = e.clientX - dragStart.current.mouseX;
        const dy = e.clientY - dragStart.current.mouseY;
        setLocalPos({ x: dragStart.current.x + dx, y: dragStart.current.y + dy });
    }

    const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDragging.current) return;
        isDragging.current = false;
        e.currentTarget.releasePointerCapture(e.pointerId);
        if (localPos.x !== (node.x || 0) || localPos.y !== (node.y || 0)) {
            onChange({ ...node, x: localPos.x, y: localPos.y });
        }
    }

    return (
        <div 
            className={`absolute z-[50] ${isBuilder ? 'group/floating outline-none hover:outline-dashed hover:outline-1 hover:outline-indigo-400' : ''}`}
            style={{ left: localPos.x, top: localPos.y, zIndex: node.zIndex || 50 }}
        >
            {isBuilder && (
                <div className="absolute -top-7 left-0 bg-indigo-600 text-white rounded-t px-2 py-1 text-[10px] items-center gap-2 opacity-0 group-hover/floating:opacity-100 transition-opacity flex pointer-events-auto shadow-lg drag-handle cursor-move whitespace-nowrap"
                     onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
                    <GripHorizontal className="h-3 w-3" />
                    <span className="font-bold flex-1">{node.type.toUpperCase()}</span>
                    <button onClick={onDelete} className="hover:text-red-300 ml-2 drag-handle-ignore" title="Delete"><Trash2 className="h-3 w-3" /></button>
                </div>
            )}
            
            <div className="pointer-events-auto relative">
                {node.type === 'text' && (
                    <EditableText tagName="div" value={node.content} onChange={(v: string) => onChange({...node, content: v})} 
                        isBuilder={isBuilder} placeholder="Floating Text" className="text-xl font-bold whitespace-nowrap min-w-[50px] min-h-[30px]" />
                )}
                {node.type === 'image' && (
                    <img src={node.content || 'https://via.placeholder.com/150'} alt="Floating" className="max-w-[200px] h-auto rounded shadow-sm" />
                )}
                {node.type === 'badge' && (
                    <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold px-4 py-1.5 rounded-full shadow-lg text-sm transform -rotate-12 cursor-text border border-white/20">
                        <EditableText tagName="span" value={node.content} onChange={(v: string) => onChange({...node, content: v})} 
                            isBuilder={isBuilder} placeholder="Sale Badge" />
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── Editable Text Component ───────────────────────────────────────────────
function EditableText({ value, onChange, isBuilder, className, tagName: Tag = 'div', placeholder = "Type here..." }: any) {
    const handleBlur = (e: React.FocusEvent<HTMLElement>) => {
        if (isBuilder && onChange) {
            // Use innerHTML to preserve bold/italics etc if they use rich formatting later
            const newVal = e.target.innerHTML;
            if (newVal !== value) onChange(newVal);
        }
    }

    if (!isBuilder) {
        return <Tag className={className} dangerouslySetInnerHTML={{ __html: value }} />
    }

    return (
        <Tag
            className={`${className} outline-none hover:outline-dashed hover:outline-1 hover:outline-indigo-300 focus:outline-indigo-500 rounded transition-all cursor-text empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:pointer-events-none empty:before:block`}
            contentEditable
            suppressContentEditableWarning
            onBlur={handleBlur}
            data-placeholder={placeholder}
            dangerouslySetInnerHTML={{ __html: value || '' }}
        />
    )
}

// ─── Section renderers ────────────────────────────────────────────────────────
function HeroSection({ section, product, isBuilder, onChange }: { section: LandingSection; product: Product; isBuilder?: boolean; onChange?: (s: LandingSection) => void }) {
    const router = useRouter()
    const { addToCart, setDrawerOpen } = useCart()
    const fmt = (p: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(p)
    return (
        <AnimatedWrapper animation={(section as any).animation}>
            <section style={getSpacingStyles(section as LandingSection)} className="px-4">
                <div className={`container mx-auto max-w-5xl flex flex-col ${section.imageUrl ? 'md:flex-row gap-10 items-center' : 'items-center text-center'}`}>
                    <div className={`flex-1 text-${section.align || 'center'}`}>
                        <EditableText tagName="h1" className="text-3xl md:text-5xl font-extrabold leading-tight mb-4" value={section.heading || ''} 
                            onChange={(v: string) => onChange?.({ ...section, heading: v })} isBuilder={isBuilder} placeholder="Headline" />
                        <EditableText tagName="p" className="text-lg md:text-xl mb-8 opacity-90" value={section.subheading || ''} 
                            onChange={(v: string) => onChange?.({ ...section, subheading: v })} isBuilder={isBuilder} placeholder="Subheading text here..." />
                        <div className={`flex flex-col sm:flex-row gap-3 flex-wrap items-center ${section.align === 'center' ? 'justify-center' : 'justify-start'}`}>
                            <span className="text-2xl font-extrabold">{fmt(product.price)}</span>
                            {(product as any).originalPrice && <span className="text-lg opacity-60 line-through">{fmt((product as any).originalPrice)}</span>}
                            <Button size="lg" className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-8"
                                onClick={() => { addToCart(product); setDrawerOpen(true) }}>
                                <ShoppingCart className="h-5 w-5 mr-2" /> Add to Cart
                            </Button>
                            <Button size="lg" className="bg-white hover:bg-gray-100 text-blue-700 font-bold px-8"
                                onClick={() => { addToCart(product); router.push("/checkout") }}>
                                <Zap className="h-5 w-5 mr-2" />
                                <EditableText tagName="span" value={section.buttonText || "Buy Now"} 
                                    onChange={(v: string) => onChange?.({ ...section, buttonText: v })} isBuilder={isBuilder} placeholder="Buy Now" />
                            </Button>
                        </div>
                        <div className={`mt-4 w-full flex ${section.align === 'center' ? 'justify-center' : 'justify-start'} hover:opacity-95 transition-opacity px-1`}>
                            <img 
                                src="/images/upi.webp" 
                                alt="Guaranteed Safe and Secure Payments" 
                                className="w-full h-auto object-contain max-w-[280px] sm:max-w-xs drop-shadow-sm"
                            />
                        </div>
                    </div>
                    {section.imageUrl && (
                        <div className="flex-1 max-w-sm">
                            <img 
                              src={section.imageUrl} 
                              alt={product.title} 
                              fetchPriority="high" 
                              loading="eager" 
                              className="w-full rounded-2xl shadow-2xl object-contain" 
                            />
                        </div>
                    )}
                </div>
            </section>
        </AnimatedWrapper>
    )
}

function FeaturesSection({ section, isBuilder, onChange }: { section: LandingSection; isBuilder?: boolean; onChange?: (s: LandingSection) => void }) {
    const cols = Math.min(section.features?.length || 3, 3)
    return (
        <AnimatedWrapper animation={(section as any).animation}>
            <section style={getSpacingStyles(section as LandingSection)} className="px-4">
                <div className={`container mx-auto max-w-5xl text-${section.align || 'center'}`}>
                    <EditableText tagName="h2" className="text-2xl md:text-4xl font-bold mb-3" value={section.heading || ''} 
                        onChange={(v: string) => onChange?.({ ...section, heading: v })} isBuilder={isBuilder} placeholder="Features Headline" />
                    <EditableText tagName="p" className="text-gray-500 mb-10 text-lg" value={section.subheading || ''} 
                        onChange={(v: string) => onChange?.({ ...section, subheading: v })} isBuilder={isBuilder} placeholder="Subtitle describing features..." />
                    <div className={`grid grid-cols-1 md:grid-cols-${cols} gap-6`}>
                        {(section.features || []).map((f, i) => (
                            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                {f.icon && <div className="text-3xl mb-3">{f.icon}</div>}
                                <EditableText tagName="h3" className="font-bold text-lg mb-2 text-gray-800" value={f.title || ''} 
                                    onChange={(v: string) => { const ne = [...(section.features || [])]; ne[i] = { ...ne[i], title: v }; onChange?.({ ...section, features: ne }) }} isBuilder={isBuilder} placeholder="Feature Title" />
                                <EditableText tagName="p" className="text-gray-500 text-sm leading-relaxed" value={f.description || ''} 
                                    onChange={(v: string) => { const ne = [...(section.features || [])]; ne[i] = { ...ne[i], description: v }; onChange?.({ ...section, features: ne }) }} isBuilder={isBuilder} placeholder="Feature Description" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </AnimatedWrapper>
    )
}

function TextSection({ section, isBuilder, onChange }: { section: LandingSection; isBuilder?: boolean; onChange?: (s: LandingSection) => void }) {
    return (
        <AnimatedWrapper animation={(section as any).animation}>
            <section style={getSpacingStyles(section as LandingSection)} className="px-4">
                <div className={`container mx-auto max-w-3xl text-${section.align || 'center'}`}>
                    <EditableText tagName="h2" className="text-2xl md:text-3xl font-bold mb-6" value={section.heading || ''} 
                        onChange={(v: string) => onChange?.({ ...section, heading: v })} isBuilder={isBuilder} placeholder="Text Block Heading" />
                    <EditableText tagName="div" className="prose max-w-none leading-relaxed" value={section.content || ''} 
                        onChange={(v: string) => onChange?.({ ...section, content: v })} isBuilder={isBuilder} placeholder="Write your rich text story here..." />
                </div>
            </section>
        </AnimatedWrapper>
    )
}

function ImageTextSection({ section, isBuilder, onChange }: { section: LandingSection; isBuilder?: boolean; onChange?: (s: LandingSection) => void }) {
    return (
        <AnimatedWrapper animation={(section as any).animation}>
            <section style={getSpacingStyles(section as LandingSection)} className="px-4">
                <div className="container mx-auto max-w-5xl flex flex-col md:flex-row gap-10 items-center">
                    {section.imageUrl && <div className="flex-1"><img src={section.imageUrl} alt={section.heading || ''} className="w-full rounded-2xl shadow-lg object-contain max-h-80" /></div>}
                    <div className={`flex-1 text-${section.align || 'left'}`}>
                        <EditableText tagName="h2" className="text-2xl md:text-3xl font-bold mb-4" value={section.heading || ''} 
                            onChange={(v: string) => onChange?.({ ...section, heading: v })} isBuilder={isBuilder} placeholder="Image Heading" />
                        <EditableText tagName="div" className="prose max-w-none text-gray-600 leading-relaxed" value={section.content || ''} 
                            onChange={(v: string) => onChange?.({ ...section, content: v })} isBuilder={isBuilder} placeholder="Image side description..." />
                    </div>
                </div>
            </section>
        </AnimatedWrapper>
    )
}

function TestimonialsSection({ section, isBuilder, onChange }: { section: LandingSection; isBuilder?: boolean; onChange?: (s: LandingSection) => void }) {
    return (
        <AnimatedWrapper animation={(section as any).animation}>
            <section style={getSpacingStyles(section as LandingSection)} className="px-4">
                <div className={`container mx-auto max-w-5xl text-${section.align || 'center'}`}>
                    <EditableText tagName="h2" className="text-2xl md:text-4xl font-bold mb-10" value={section.heading || ''} 
                        onChange={(v: string) => onChange?.({ ...section, heading: v })} isBuilder={isBuilder} placeholder="What they say..." />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {(section.testimonials || []).map((t, i) => (
                            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-left">
                                <div className="flex mb-3">{Array.from({ length: t.rating || 5 }).map((_, j) => <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)}</div>
                                <EditableText tagName="p" className="text-gray-600 text-sm leading-relaxed mb-4 italic" value={t.text || ''} 
                                    onChange={(v: string) => { const ne = [...(section.testimonials || [])]; ne[i] = { ...ne[i], text: v }; onChange?.({ ...section, testimonials: ne }) }} isBuilder={isBuilder} placeholder="It's awesome!" />
                                <EditableText tagName="p" className="font-bold text-gray-800 text-sm" value={t.name || ''} 
                                    onChange={(v: string) => { const ne = [...(section.testimonials || [])]; ne[i] = { ...ne[i], name: v }; onChange?.({ ...section, testimonials: ne }) }} isBuilder={isBuilder} placeholder="— Customer Name" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </AnimatedWrapper>
    )
}

function FAQSection({ section, isBuilder, onChange }: { section: LandingSection; isBuilder?: boolean; onChange?: (s: LandingSection) => void }) {
    return (
        <AnimatedWrapper animation={(section as any).animation}>
            <section style={getSpacingStyles(section as LandingSection)} className="px-4">
                <div className={`container mx-auto max-w-3xl text-${section.align || 'center'}`}>
                    <EditableText tagName="h2" className="text-2xl md:text-4xl font-bold mb-8" value={section.heading || ''} 
                        onChange={(v: string) => onChange?.({ ...section, heading: v })} isBuilder={isBuilder} placeholder="FAQ" />
                    <div className="space-y-4 text-left">
                        {(section.faqs || []).map((f, i) => (
                            <details key={i} className="group border border-gray-200 rounded-xl overflow-hidden">
                                <summary className="flex items-center justify-between px-5 py-4 font-semibold cursor-pointer hover:bg-gray-50 list-none">
                                    <EditableText tagName="span" className="flex-1" value={f.question || ''} 
                                        onChange={(v: string) => { const ne = [...(section.faqs || [])]; ne[i] = { ...ne[i], question: v }; onChange?.({ ...section, faqs: ne }) }} isBuilder={isBuilder} placeholder="Question..." />
                                    <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                                </summary>
                                <EditableText tagName="div" className="px-5 pb-4 text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-3" value={f.answer || ''} 
                                    onChange={(v: string) => { const ne = [...(section.faqs || [])]; ne[i] = { ...ne[i], answer: v }; onChange?.({ ...section, faqs: ne }) }} isBuilder={isBuilder} placeholder="Answer..." />
                            </details>
                        ))}
                    </div>
                </div>
            </section>
        </AnimatedWrapper>
    )
}

function CTASection({ section, product, isBuilder, onChange }: { section: LandingSection; product: Product; isBuilder?: boolean; onChange?: (s: LandingSection) => void }) {
    const { addToCart } = useCart()
    const router = useRouter()
    const link = section.buttonLink || '/checkout'
    const isCheckout = link === '/checkout' || link === '#buy'
    return (
        <AnimatedWrapper animation={(section as any).animation}>
            <section style={getSpacingStyles(section as LandingSection)} className={`px-4 text-${section.align || 'center'}`}>
                <div className="container mx-auto max-w-3xl flex flex-col items-center">
                    <EditableText tagName="h2" className="text-2xl md:text-4xl font-extrabold mb-4" value={section.heading || ''} 
                        onChange={(v: string) => onChange?.({ ...section, heading: v })} isBuilder={isBuilder} placeholder="Call to Action Target!" />
                    <EditableText tagName="p" className="text-lg opacity-90 mb-8" value={section.subheading || ''} 
                        onChange={(v: string) => onChange?.({ ...section, subheading: v })} isBuilder={isBuilder} placeholder="Don't miss out on this..." />
                    <Button size="lg" className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-10 py-4 text-lg rounded-xl shadow-lg"
                        onClick={(isCheckout && !isBuilder) ? () => { addToCart(product); router.push("/checkout") } : undefined}
                        asChild={!isCheckout && !isBuilder}>
                        {isCheckout || isBuilder ? <span><Zap className="h-5 w-5 mr-2 inline" /><EditableText tagName="span" value={section.buttonText || "Get Access"} onChange={(v: string) => onChange?.({ ...section, buttonText: v })} isBuilder={isBuilder} placeholder="Get Access" /></span>
                            : <Link href={link}><Zap className="h-5 w-5 mr-2 inline" />{section.buttonText}</Link>}
                    </Button>
                </div>
            </section>
        </AnimatedWrapper>
    )
}

function FormSection({ section, product, isBuilder, onChange }: { section: LandingSection; product: Product; isBuilder?: boolean; onChange?: (s: LandingSection) => void }) {
    const [values, setValues] = useState<Record<string, string>>({})
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const fields = (section as any).formFields || []

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            await fetch('/api/lp/form-submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId: product.id, productTitle: product.title, fields: values }),
            })
            setSubmitted(true)
        } catch { } finally { setSubmitting(false) }
    }

    return (
        <AnimatedWrapper animation={(section as any).animation}>
            <section style={getSpacingStyles(section as LandingSection)} className="px-4">
                <div className={`container mx-auto max-w-lg text-${section.align || 'center'}`}>
                    <EditableText tagName="h2" className="text-2xl md:text-3xl font-bold mb-6" value={section.heading || ''} 
                        onChange={(v: string) => onChange?.({ ...section, heading: v })} isBuilder={isBuilder} placeholder="Form Heading" />
                    {submitted && !isBuilder ? (
                        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
                            <div className="text-4xl mb-3">✅</div>
                            <p className="text-green-800 font-semibold text-lg">Thank you! We'll be in touch soon.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4 text-left pointer-events-auto">
                            {fields.map((f: any, i: number) => (
                                <div key={i}>
                                    <label className="text-sm font-semibold text-gray-700 block mb-1">{f.label}{f.required && <span className="text-red-500 ml-0.5">*</span>}</label>
                                    {f.type === 'textarea' ? (
                                        <textarea required={f.required} placeholder={f.placeholder || ''} value={values[f.label] || ''}
                                            onChange={e => setValues(v => ({ ...v, [f.label]: e.target.value }))}
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px]" />
                                    ) : (
                                        <input type={f.type} required={f.required} placeholder={f.placeholder || ''} value={values[f.label] || ''}
                                            onChange={e => setValues(v => ({ ...v, [f.label]: e.target.value }))}
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                    )}
                                </div>
                            ))}
                            <Button type="submit" disabled={submitting} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-3">
                                {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Submitting...</> : (section as any).formButtonText || 'Submit'}
                            </Button>
                        </form>
                    )}
                </div>
            </section>
        </AnimatedWrapper>
    )
}

export function RenderSection({ section, product, isBuilder, onChange }: { section: LandingSection; product: Product; isBuilder?: boolean; onChange?: (s: LandingSection) => void }) {
    const Inner = () => {
        switch (section.type) {
            case 'hero': return <HeroSection section={section} product={product} isBuilder={isBuilder} onChange={onChange} />
            case 'features': return <FeaturesSection section={section} isBuilder={isBuilder} onChange={onChange} />
            case 'text': return <TextSection section={section} isBuilder={isBuilder} onChange={onChange} />
            case 'image-text': return <ImageTextSection section={section} isBuilder={isBuilder} onChange={onChange} />
            case 'testimonials': return <TestimonialsSection section={section} isBuilder={isBuilder} onChange={onChange} />
            case 'faq': return <FAQSection section={section} isBuilder={isBuilder} onChange={onChange} />
            case 'cta': return <CTASection section={section} product={product} isBuilder={isBuilder} onChange={onChange} />
            case 'form': return <FormSection section={section} product={product} isBuilder={isBuilder} onChange={onChange} />
            default: return null
        }
    }

    return (
        <div className="relative group/section w-full border-transparent">
            <Inner />
            {section.floatingNodes?.map(node => (
                <FloatingNodeRenderer 
                    key={node.id} 
                    node={node} 
                    isBuilder={isBuilder} 
                    onChange={(newNode) => {
                        const nextNodes = section.floatingNodes?.map(n => n.id === node.id ? newNode : n);
                        onChange?.({ ...section, floatingNodes: nextNodes })
                    }} 
                    onDelete={() => {
                        onChange?.({ ...section, floatingNodes: section.floatingNodes?.filter(n => n.id !== node.id) })
                    }} 
                />
            ))}
        </div>
    )
}

function interpolateProductData(value: any, product: Product): any {
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

export function LandingPageView({ product }: { product: Product }) {
    let sections: LandingSection[] = []
    let htmlContent: string | null = null

    try {
        if (product.pageCode) {
            let parsed = JSON.parse(product.pageCode)
            if (typeof parsed === 'string') {
                parsed = JSON.parse(parsed)
            }
            if (parsed && parsed.format === 'html') {
                htmlContent = parsed.html || ""
            } else {
                sections = Array.isArray(parsed) ? parsed : []
            }
        }
    } catch { 
        // If it's pure string HTML
        if (product.pageCode && typeof product.pageCode === 'string' && product.pageCode.includes('<')) {
            htmlContent = product.pageCode
        }
    }

    // Track page view & Meta Pixel ViewContent
    useEffect(() => {
        try {
            trackViewContent({
                content_name: product.title,
                content_ids: [product.id],
                contents: [{ id: product.id, quantity: 1, item_price: product.price }],
                value: product.price,
                currency: 'INR',
            })
        } catch { }

        fetch('/api/lp/analytics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: product.id, productSlug: (product as any).slug, event: 'view' }),
        }).catch(() => { })
    }, [product.id, product.title, product.price])
    if (!htmlContent && sections.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <StoreHeader />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center py-20 text-gray-400">
                        <p className="text-lg font-medium">Landing page has no sections yet.</p>
                        <Link href={`/products/${(product as any).slug || product.id}?type=shop`} className="text-blue-500 underline text-sm mt-2 inline-block">View shop page</Link>
                    </div>
                </div>
                <Footer />
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col">
            <style dangerouslySetInnerHTML={{ __html: ANIM_CSS }} />
            <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Montserrat:wght@400;700;900&family=Anton&display=swap" rel="stylesheet" />
            <StoreHeader />
            <main className="flex-1">
                {htmlContent ? (
                    <div className="w-full lp-preview-container" dangerouslySetInnerHTML={{ __html: interpolateProductData(htmlContent, product) }} />
                ) : (
                    sections.map(section => {
                        const processedSection = interpolateProductData(section, product);
                        return <RenderSection key={section.id} section={processedSection} product={product} />
                    })
                )}
            </main>
            <Footer />
        </div>
    )
}
