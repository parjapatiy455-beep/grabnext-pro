import { StoreHeader } from "@/components/store-header"
import { Footer } from "@/components/footer"
import { ShoppingBag, Shield, Zap, Users } from "lucide-react"
import type { Metadata } from "next"
import { getSiteUrl } from "@/lib/site"

export async function generateMetadata(): Promise<Metadata> {
    const siteUrl = getSiteUrl()
    const pageUrl = `${siteUrl}/about`

    return {
        title: "About Us | Grabnext - India's Trusted Digital Marketplace",
        description: "Learn about Grabnext — India's premier digital marketplace for software source code, design templates, video editing assets, and online masterclass courses.",
        keywords: [
            "about grabnext",
            "digital marketplace india",
            "buy software templates india",
            "instant digital downloads india",
            "grabnext company"
        ],
        alternates: {
            canonical: pageUrl,
        },
        openGraph: {
            title: "About Us | Grabnext Digital Store",
            description: "India's premier digital marketplace for software, templates, courses, and digital assets.",
            url: pageUrl,
            siteName: "Grabnext",
            type: "website",
        }
    }
}

const stats = [
    { label: "Products", value: "500+" },
    { label: "Happy Customers", value: "10,000+" },
    { label: "Categories", value: "20+" },
    { label: "Secured Payments", value: "₹50L+" },
]

const values = [
    {
        icon: ShoppingBag,
        title: "Wide Selection",
        description: "From software and templates to digital courses and e-books — we carry everything you need.",
        color: "bg-blue-50 text-blue-600",
    },
    {
        icon: Shield,
        title: "Secure & Trusted",
        description: "Every transaction is protected by SSL encryption and our secure XPay payment gateway.",
        color: "bg-green-50 text-green-600",
    },
    {
        icon: Zap,
        title: "Instant Delivery",
        description: "Digital products are available for download immediately after payment confirmation.",
        color: "bg-yellow-50 text-yellow-600",
    },
    {
        icon: Users,
        title: "Customer First",
        description: "Our support team is always ready to help you with any questions or concerns.",
        color: "bg-purple-50 text-purple-600",
    },
]

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <StoreHeader />

            {/* Hero */}
            <section className="bg-gradient-to-br from-blue-600 to-purple-700 text-white py-20">
                <div className="container mx-auto px-4 text-center max-w-3xl">
                    <h1 className="text-4xl lg:text-5xl font-bold mb-4">About Grabnext</h1>
                    <p className="text-lg text-blue-100 leading-relaxed">
                        India's growing digital marketplace — bringing you the best software, templates, courses, and digital products at unbeatable prices.
                    </p>
                </div>
            </section>

            {/* Stats */}
            <section className="bg-white border-b">
                <div className="container mx-auto px-4 py-10 max-w-4xl">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                        {stats.map((stat) => (
                            <div key={stat.label}>
                                <div className="text-3xl font-bold text-primary">{stat.value}</div>
                                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Story */}
            <section className="container mx-auto px-4 py-16 max-w-4xl">
                <div className="bg-white rounded-2xl shadow-sm p-8 lg:p-12">
                    <h2 className="text-2xl font-bold mb-4">Our Story</h2>
                    <div className="space-y-4 text-gray-600 leading-relaxed">
                        <p>
                            Grabnext was founded with a simple mission: to make high-quality digital products accessible to everyone in India. We noticed that many creators and businesses struggled to find affordable, reliable digital tools and resources.
                        </p>
                        <p>
                            We built Grabnext as a curated marketplace where individuals and businesses can discover and purchase software, templates, educational courses, and digital resources — all in one place, with instant delivery and transparent pricing.
                        </p>
                        <p>
                            Today, we serve thousands of customers across India, helping students, freelancers, small businesses, and enterprises access the digital tools they need to grow and succeed.
                        </p>
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="container mx-auto px-4 pb-16 max-w-4xl">
                <h2 className="text-2xl font-bold text-center mb-8">Why Choose Grabnext?</h2>
                <div className="grid md:grid-cols-2 gap-6">
                    {values.map(({ icon: Icon, title, description, color }) => (
                        <div key={title} className="bg-white rounded-2xl shadow-sm p-6 flex gap-4">
                            <div className={`h-12 w-12 rounded-xl ${color} flex items-center justify-center shrink-0`}>
                                <Icon className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <Footer />
        </div>
    )
}
