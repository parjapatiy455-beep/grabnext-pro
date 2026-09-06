export const runtime = 'edge'
import { StoreHeader } from "@/components/store-header"
import { Footer } from "@/components/footer"
import { CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Refund & Return Policy | Grabnext",
    description: "Learn about Grabnext's refund and return policy for digital and physical products.",
}

export default function RefundPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <StoreHeader />
            <main className="container mx-auto px-4 py-12 max-w-4xl">
                <div className="bg-white rounded-2xl shadow-sm p-8 lg:p-12">
                    <h1 className="text-3xl font-bold mb-2">Refund & Return Policy</h1>
                    <p className="text-muted-foreground mb-8">Last updated: March 2026</p>

                    {/* Quick summary cards */}
                    <div className="grid md:grid-cols-3 gap-4 mb-10">
                        <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl border border-green-100">
                            <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                            <div>
                                <p className="font-semibold text-green-800">Eligible</p>
                                <p className="text-xs text-green-600">Corrupted files, wrong item</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
                            <XCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                            <div>
                                <p className="font-semibold text-red-800">Not Eligible</p>
                                <p className="text-xs text-red-600">Already downloaded & working</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <Clock className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                            <div>
                                <p className="font-semibold text-blue-800">Time Limit</p>
                                <p className="text-xs text-blue-600">Within 7 days of purchase</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <section>
                            <h2 className="text-xl font-semibold mb-3">Digital Products</h2>
                            <p className="text-gray-600 leading-relaxed mb-3">Due to the nature of digital products, all sales are generally final. However, we offer refunds in the following cases:</p>
                            <ul className="list-disc pl-6 text-gray-600 space-y-2">
                                <li><strong>Corrupted files:</strong> The downloaded file is damaged or cannot be opened</li>
                                <li><strong>Wrong product:</strong> You received a different product than what you ordered</li>
                                <li><strong>Not as described:</strong> The product significantly differs from its listing description</li>
                                <li><strong>Duplicate charge:</strong> You were charged twice for the same order</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3">Physical Products</h2>
                            <p className="text-gray-600 leading-relaxed">Physical products can be returned within 7 days of delivery if they are:</p>
                            <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-2">
                                <li>Defective or damaged on arrival</li>
                                <li>Not matching the product description</li>
                                <li>Wrong size or color (exchange, not refund)</li>
                            </ul>
                            <p className="text-gray-600 leading-relaxed mt-3">Return shipping costs are covered by Grabnext for eligible returns.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3">How to Request a Refund</h2>
                            <ol className="list-decimal pl-6 text-gray-600 space-y-2">
                                <li>Email us at <a href="mailto:support@grabnext.com" className="text-primary hover:underline">support@grabnext.com</a> within 7 days of purchase</li>
                                <li>Include your Order ID and the reason for the refund request</li>
                                <li>Attach screenshots or evidence of the issue (for digital products)</li>
                                <li>Our team will review and respond within 2 business days</li>
                            </ol>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3">Refund Processing</h2>
                            <p className="text-gray-600 leading-relaxed">Approved refunds are processed within 5-7 business days. The amount will be credited to your original payment method. UPI refunds typically appear within 1-3 business days after processing.</p>
                        </section>

                        <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex gap-3">
                            <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-orange-700">Refunds are not available for products that have been downloaded and are working as described, or for accounts that have violated our Terms of Service.</p>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}
