export const runtime = 'edge'
import { StoreHeader } from "@/components/store-header"
import { Footer } from "@/components/footer"
import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Terms of Service | Grabnext",
    description: "Read Grabnext's Terms of Service and understand your rights and responsibilities when using our platform.",
}

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <StoreHeader />
            <main className="container mx-auto px-4 py-12 max-w-4xl">
                <div className="bg-white rounded-2xl shadow-sm p-8 lg:p-12">
                    <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
                    <p className="text-muted-foreground mb-8">Last updated: March 2026</p>

                    <div className="space-y-8">
                        <section>
                            <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
                            <p className="text-gray-600 leading-relaxed">By accessing and using Grabnext, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3">2. Use of the Platform</h2>
                            <p className="text-gray-600 leading-relaxed">Grabnext is an e-commerce platform for digital and physical products. You agree to:</p>
                            <ul className="list-disc pl-6 text-gray-600 space-y-1 mt-2">
                                <li>Provide accurate and complete information when creating an account</li>
                                <li>Maintain the security of your account credentials</li>
                                <li>Use the platform only for lawful purposes</li>
                                <li>Not reproduce, redistribute, or resell purchased digital products</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3">3. Purchases and Payments</h2>
                            <p className="text-gray-600 leading-relaxed">All prices are displayed in Indian Rupees (₹) and are inclusive of applicable taxes. We accept payments via UPI through our secure XPay gateway. By completing a purchase, you agree to pay the full amount shown.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3">4. Digital Products</h2>
                            <p className="text-gray-600 leading-relaxed">Digital products are delivered electronically. Once a digital product has been downloaded or accessed, it is non-refundable unless the file is corrupt or not as described. Please see our Refund Policy for details.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3">5. Intellectual Property</h2>
                            <p className="text-gray-600 leading-relaxed">All content on Grabnext, including but not limited to text, graphics, logos, and software, is the property of Grabnext or its content suppliers and is protected by intellectual property laws.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3">6. Limitation of Liability</h2>
                            <p className="text-gray-600 leading-relaxed">Grabnext shall not be liable for any indirect, incidental, or consequential damages arising from use of our platform. Our total liability shall not exceed the amount paid for the specific product giving rise to the claim.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3">7. Changes to Terms</h2>
                            <p className="text-gray-600 leading-relaxed">We reserve the right to modify these Terms at any time. We will notify users of significant changes via email or platform notifications. Continued use after changes constitutes acceptance.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3">8. Contact</h2>
                            <p className="text-gray-600 leading-relaxed">For questions about these Terms, contact us at <a href="mailto:legal@grabnext.com" className="text-primary hover:underline">legal@grabnext.com</a>.</p>
                        </section>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}
