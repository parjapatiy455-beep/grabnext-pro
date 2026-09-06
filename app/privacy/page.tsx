export const runtime = 'edge'
import { StoreHeader } from "@/components/store-header"
import { Footer } from "@/components/footer"
import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Privacy Policy | Grabnext",
    description: "Read Grabnext's Privacy Policy to understand how we collect, use, and protect your personal information.",
}

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <StoreHeader />
            <main className="container mx-auto px-4 py-12 max-w-4xl">
                <div className="bg-white rounded-2xl shadow-sm p-8 lg:p-12">
                    <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
                    <p className="text-muted-foreground mb-8">Last updated: March 2026</p>

                    <div className="prose prose-gray max-w-none space-y-8">
                        <section>
                            <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
                            <p className="text-gray-600 leading-relaxed">We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us for support. This includes:</p>
                            <ul className="list-disc pl-6 text-gray-600 space-y-1 mt-2">
                                <li>Name, email address, and phone number</li>
                                <li>Billing and shipping address</li>
                                <li>Payment information (processed securely via XPay — we never store card details)</li>
                                <li>Order history and purchase records</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
                            <p className="text-gray-600 leading-relaxed">We use the information we collect to:</p>
                            <ul className="list-disc pl-6 text-gray-600 space-y-1 mt-2">
                                <li>Process and fulfill your orders</li>
                                <li>Send order confirmations and updates</li>
                                <li>Respond to customer service requests</li>
                                <li>Improve our platform and services</li>
                                <li>Send promotional communications (with your consent)</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3">3. Information Sharing</h2>
                            <p className="text-gray-600 leading-relaxed">We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:</p>
                            <ul className="list-disc pl-6 text-gray-600 space-y-1 mt-2">
                                <li>With payment processors to complete transactions</li>
                                <li>When required by law or to protect our rights</li>
                                <li>With your explicit consent</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3">4. Data Security</h2>
                            <p className="text-gray-600 leading-relaxed">We implement industry-standard security measures to protect your personal information. All data transmissions are encrypted using SSL/TLS technology. However, no method of transmission over the Internet is 100% secure.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3">5. Cookies</h2>
                            <p className="text-gray-600 leading-relaxed">We use cookies to enhance your shopping experience, remember your cart, and analyze site traffic. You can control cookie settings through your browser preferences.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3">6. Your Rights</h2>
                            <p className="text-gray-600 leading-relaxed">You have the right to access, correct, or delete your personal information. To exercise these rights, contact us at support@grabnext.com.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3">7. Contact Us</h2>
                            <p className="text-gray-600 leading-relaxed">If you have questions about this Privacy Policy, please contact us at <a href="mailto:support@grabnext.com" className="text-primary hover:underline">support@grabnext.com</a>.</p>
                        </section>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}
