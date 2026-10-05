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
                            <h2 className="text-xl font-semibold mb-3">5. Cookies and Web Beacons</h2>
                            <p className="text-gray-600 leading-relaxed">We use cookies to enhance your shopping experience, remember your cart, and analyze site traffic. You can choose to disable or selectively turn off our cookies or third-party cookies in your browser settings.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3">6. Google AdSense and Third-Party Advertising</h2>
                            <p className="text-gray-600 leading-relaxed">
                                Google, as a third-party vendor, uses cookies to serve ads on Grabnext. Google's use of advertising cookies enables it and its partners to serve ads to our users based on their visit to our site and/or other sites on the Internet.
                            </p>
                            <ul className="list-disc pl-6 text-gray-600 space-y-1 mt-2">
                                <li>Third party vendors, including Google, use cookies to serve ads based on a user's prior visits to your website or other websites.</li>
                                <li>Google's use of advertising cookies enables it and its partners to serve ads to your users based on their visit to your sites and/or other sites on the Internet.</li>
                                <li>Users may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Ads Settings</a> or by visiting <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.aboutads.info</a>.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3">7. Affiliate & Commercial Disclosure</h2>
                            <p className="text-gray-600 leading-relaxed">
                                Grabnext operates as an online marketplace and informational guide for digital assets, software, and tools. Some links featured in our articles and product recommendations are direct digital product offers or affiliate links. We only recommend curated products and assets that have been vetted for quality and performance.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3">8. Your Rights</h2>
                            <p className="text-gray-600 leading-relaxed">You have the right to access, correct, or delete your personal information. To exercise these rights, contact us at <a href="mailto:support@grabnext.com" className="text-primary hover:underline">support@grabnext.com</a>.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3">9. Contact Us</h2>
                            <p className="text-gray-600 leading-relaxed">If you have questions about this Privacy Policy, please contact us at <a href="mailto:support@grabnext.com" className="text-primary hover:underline">support@grabnext.com</a> or via WhatsApp at <a href="https://wa.me/917500167987" className="text-primary hover:underline">+91 75001 67987</a>.</p>
                        </section>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}
