export const runtime = 'edge'
"use client"

import { useState } from "react"
import { StoreHeader } from "@/components/store-header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Mail, Phone, MessageSquare, Send, CheckCircle2, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { trackLead } from "@/lib/pixel"

export default function ContactPage() {
    const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" })
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        // Simulate submission (replace with actual API call)
        await new Promise(r => setTimeout(r, 1500))
        setSubmitted(true)
        setSubmitting(false)
        trackLead(
            { content_name: "Contact Form" },
            {
                email: form.email,
                firstName: form.name.split(' ')[0],
                lastName: form.name.split(' ').slice(1).join(' ')
            }
        )
        toast({ title: "✅ Message sent! We'll get back to you within 24 hours." })
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <StoreHeader />

            <main className="container mx-auto px-4 py-12 max-w-5xl">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold mb-3">Contact Us</h1>
                    <p className="text-muted-foreground">We'd love to hear from you. Our team is here to help.</p>
                </div>

                <div className="grid lg:grid-cols-5 gap-8">
                    {/* Contact Info */}
                    <div className="lg:col-span-2 space-y-5">
                        <div className="bg-white rounded-2xl shadow-sm p-6">
                            <h2 className="font-bold text-lg mb-5">Get in touch</h2>
                            <div className="space-y-5">
                                <div className="flex gap-4 items-start">
                                    <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                                        <Mail className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">Email</p>
                                        <a href="mailto:support@grabnext.com" className="text-sm text-primary hover:underline">
                                            support@grabnext.com
                                        </a>
                                        <p className="text-xs text-muted-foreground mt-0.5">We reply within 24 hours</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start">
                                    <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                                        <Phone className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">Phone / WhatsApp</p>
                                        <a href="tel:+919999999999" className="text-sm text-primary hover:underline">
                                            +91 99999 99999
                                        </a>
                                        <p className="text-xs text-muted-foreground mt-0.5">Mon–Sat, 10am–7pm IST</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start">
                                    <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                                        <MessageSquare className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">Live Chat</p>
                                        <p className="text-sm text-muted-foreground">Available on our platform</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">Average response: 5 min</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-primary/5 rounded-2xl p-6">
                            <h3 className="font-bold mb-2">Business Hours</h3>
                            <div className="space-y-1 text-sm text-gray-600">
                                <div className="flex justify-between"><span>Monday – Friday</span><span>9am – 8pm IST</span></div>
                                <div className="flex justify-between"><span>Saturday</span><span>10am – 6pm IST</span></div>
                                <div className="flex justify-between"><span>Sunday</span><span>12pm – 4pm IST</span></div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-2xl shadow-sm p-8">
                            {submitted ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                                    <h3 className="text-xl font-bold mb-2">Message Sent!</h3>
                                    <p className="text-muted-foreground mb-6">Thank you for reaching out. We'll get back to you within 24 hours.</p>
                                    <Button variant="outline" onClick={() => { setSubmitted(false); setForm({ name: "", email: "", subject: "", message: "" }) }}>
                                        Send Another Message
                                    </Button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="name">Your Name *</Label>
                                            <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Doe" required />
                                        </div>
                                        <div>
                                            <Label htmlFor="email">Email Address *</Label>
                                            <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@example.com" required />
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="subject">Subject *</Label>
                                        <Input id="subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="How can we help you?" required />
                                    </div>
                                    <div>
                                        <Label htmlFor="message">Message *</Label>
                                        <Textarea
                                            id="message"
                                            rows={6}
                                            value={form.message}
                                            onChange={(e) => setForm({ ...form, message: e.target.value })}
                                            placeholder="Describe your issue or question in detail..."
                                            required
                                        />
                                    </div>
                                    <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                                        {submitting ? (
                                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending...</>
                                        ) : (
                                            <><Send className="h-4 w-4 mr-2" />Send Message</>
                                        )}
                                    </Button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
