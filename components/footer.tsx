import Link from "next/link"
import { Logo } from "@/components/logo"

export function Footer() {
    const currentYear = new Date().getFullYear()

    return (
        <footer className="bg-gray-900 text-gray-300 mt-16">
            {/* Main Footer */}
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
                    {/* Brand */}
                    <div className="col-span-2 md:col-span-1">
                        <div className="mb-4">
                            <Logo textClassName="text-white group-hover:text-gray-200" />
                        </div>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            India's digital marketplace for software, templates, courses, and more.
                        </p>
                        <div className="flex gap-3 mt-4">
                            <a href="#" aria-label="Twitter" className="h-8 w-8 rounded-lg bg-gray-800 flex items-center justify-center hover:bg-primary transition-colors text-xs font-bold">𝕏</a>
                            <a href="#" aria-label="Instagram" className="h-8 w-8 rounded-lg bg-gray-800 flex items-center justify-center hover:bg-primary transition-colors text-xs">📷</a>
                            <a href="#" aria-label="WhatsApp" className="h-8 w-8 rounded-lg bg-gray-800 flex items-center justify-center hover:bg-primary transition-colors text-xs">💬</a>
                        </div>
                    </div>

                    {/* Shop */}
                    <div>
                        <h3 className="font-semibold text-white mb-4">Shop</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="/products" className="hover:text-white transition-colors">All Products</Link></li>
                            <li><Link href="/categories" className="hover:text-white transition-colors">Categories</Link></li>
                            <li><Link href="/products?sort=popular" className="hover:text-white transition-colors">Best Sellers</Link></li>
                            <li><Link href="/products?sort=newest" className="hover:text-white transition-colors">New Arrivals</Link></li>
                        </ul>
                    </div>

                    {/* Landing Pages & Masterclasses */}
                    <div>
                        <h3 className="font-semibold text-white mb-4">Landing Pages & Programs</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="/masterclass" className="hover:text-amber-400 text-amber-300 font-medium transition-colors flex items-center gap-1">
                                    <span>🔥 Masterclass (₹49)</span>
                                </Link>
                            </li>
                            <li><Link href="/claude-skills" className="hover:text-white transition-colors">Claude Skills Bundle</Link></li>
                            <li><Link href="/editing" className="hover:text-white transition-colors">Video Editing Pack</Link></li>
                            <li><Link href="/software" className="hover:text-white transition-colors">Software Bundles</Link></li>
                            <li><Link href="/products" className="hover:text-white transition-colors">Special Offers</Link></li>
                        </ul>
                    </div>

                    {/* Account */}
                    <div>
                        <h3 className="font-semibold text-white mb-4">Account</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="/dashboard" className="hover:text-white transition-colors">My Dashboard</Link></li>
                            <li><Link href="/dashboard?tab=orders" className="hover:text-white transition-colors">My Orders</Link></li>
                            <li><Link href="/dashboard?tab=downloads" className="hover:text-white transition-colors">Downloads</Link></li>
                            <li><Link href="/auth/login" className="hover:text-white transition-colors">Sign In</Link></li>
                        </ul>
                    </div>

                    {/* Help */}
                    <div>
                        <h3 className="font-semibold text-white mb-4">Help & Info</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
                            <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                            <li><Link href="/refund" className="hover:text-white transition-colors">Refund Policy</Link></li>
                            <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-gray-800">
                <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-gray-500">
                    <p>© {currentYear} Grabnext. All rights reserved.</p>
                    <div className="flex gap-4">
                        <Link href="/privacy" className="hover:text-gray-300 transition-colors">Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-gray-300 transition-colors">Terms of Service</Link>
                        <Link href="/refund" className="hover:text-gray-300 transition-colors">Refund Policy</Link>
                    </div>
                    <p>Payments secured by XPay 🔒</p>
                </div>
            </div>
        </footer>
    )
}
