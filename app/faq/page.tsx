export const runtime = 'edge'
"use client"

import { useState } from "react"
import { StoreHeader } from "@/components/store-header"
import { Footer } from "@/components/footer"
import { ChevronDown } from "lucide-react"

const faqs = [
    {
        category: "Orders & Payments",
        items: [
            {
                q: "How do I place an order?",
                a: "Browse products, add them to your cart, then proceed to checkout. You can pay via UPI using our secure XPay gateway. You don't need to create an account beforehand — we'll create one for you automatically."
            },
            {
                q: "What payment methods are accepted?",
                a: "We accept all UPI-based payments through XPay, including Google Pay, PhonePe, Paytm, and direct UPI ID transfers."
            },
            {
                q: "Is my payment information secure?",
                a: "Yes. We use the XPay payment gateway which is fully SSL-encrypted. We never store your card or UPI credentials on our servers."
            },
            {
                q: "Can I order without creating an account?",
                a: "Absolutely! You can checkout as a guest. We'll automatically create an account with your email and send you a temporary password so you can track your orders later."
            },
        ]
    },
    {
        category: "Digital Products",
        items: [
            {
                q: "How do I download my purchased products?",
                a: "After a successful payment, you'll receive access to download links. You can also find all your purchases in My Account → Downloads."
            },
            {
                q: "How many times can I download a product?",
                a: "You can download your purchased digital products unlimited times. The links are stored permanently in your account."
            },
            {
                q: "What formats are digital products in?",
                a: "Product formats vary. Software may be delivered as ZIP archives, templates as PDF or editable files, and courses as video links. Each product page specifies the format."
            },
        ]
    },
    {
        category: "Returns & Refunds",
        items: [
            {
                q: "Can I get a refund on digital products?",
                a: "Refunds are available within 7 days if the file is corrupted, wrong, or not as described. See our full Refund Policy for details."
            },
            {
                q: "How long does a refund take?",
                a: "Approved refunds are processed within 5-7 business days and credited to your original UPI method."
            },
        ]
    },
    {
        category: "Account & Security",
        items: [
            {
                q: "How do I reset my password?",
                a: "Go to the Sign In page and click 'Forgot Password'. Enter your email address and we'll send you a reset link."
            },
            {
                q: "Can I change my email address?",
                a: "For security reasons, email addresses cannot be changed. If you need to update your email, please contact our support team."
            },
        ]
    }
]

function FAQItem({ item }: { item: { q: string; a: string } }) {
    const [open, setOpen] = useState(false)
    return (
        <div className="border-b border-gray-100 last:border-0">
            <button
                type="button"
                className="w-full flex items-center justify-between py-4 text-left font-medium text-gray-900 hover:text-primary transition-colors"
                onClick={() => setOpen(!open)}
            >
                <span>{item.q}</span>
                <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform shrink-0 ml-4 ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div className="pb-4 text-gray-600 leading-relaxed text-sm">{item.a}</div>
            )}
        </div>
    )
}

export default function FAQPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <StoreHeader />
            <main className="container mx-auto px-4 py-12 max-w-3xl">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold mb-3">Frequently Asked Questions</h1>
                    <p className="text-muted-foreground">Find answers to common questions about ordering, payments, and more.</p>
                </div>

                <div className="space-y-6">
                    {faqs.map((section) => (
                        <div key={section.category} className="bg-white rounded-2xl shadow-sm p-6">
                            <h2 className="text-lg font-bold text-primary mb-2">{section.category}</h2>
                            <div>
                                {section.items.map((item) => (
                                    <FAQItem key={item.q} item={item} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-10 bg-primary/5 rounded-2xl p-8 text-center">
                    <h3 className="text-xl font-semibold mb-2">Still have questions?</h3>
                    <p className="text-muted-foreground mb-4">Our support team is ready to help you.</p>
                    <a
                        href="mailto:support@grabnext.com"
                        className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                    >
                        Contact Support
                    </a>
                </div>
            </main>
            <Footer />
        </div>
    )
}
