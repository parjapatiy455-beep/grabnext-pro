export const runtime = "edge"
export const dynamic = "force-dynamic"

import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { StoreHeader } from "@/components/store-header"
import { Footer } from "@/components/footer"
import { BLOG_POSTS, getBlogPostBySlug } from "@/lib/blog-data"
import { getSiteUrl } from "@/lib/site"
import {
  Calendar,
  Clock,
  User,
  ArrowLeft,
  CheckCircle2,
  ShoppingCart,
  Star,
  Zap,
  HelpCircle,
  Tag,
  BookOpen,
  ShieldCheck,
  Award,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Info
} from "lucide-react"
import {
  BlogReadingProgressBar,
  BlogShareButtons,
  ScrollToTopButton
} from "@/components/blog-article-interactive"

type Props = {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getBlogPostBySlug(params.slug)
  if (!post) {
    return {
      title: "Article Not Found | Grabnext Blog",
      description: "The requested digital products article could not be found.",
    }
  }

  const siteUrl = getSiteUrl()
  const articleUrl = `${siteUrl}/blog/${post.slug}`
  const coverImage = post.coverImage.startsWith("http")
    ? post.coverImage
    : `${siteUrl}${post.coverImage}`

  return {
    title: `${post.metaTitle}`,
    description: post.metaDescription,
    keywords: post.keywords,
    authors: [{ name: post.author.name, url: siteUrl }],
    creator: "Grabnext",
    publisher: "Grabnext",
    category: post.category,
    alternates: {
      canonical: articleUrl,
    },
    openGraph: {
      title: post.metaTitle,
      description: post.metaDescription,
      url: articleUrl,
      siteName: "Grabnext",
      locale: "en_IN",
      type: "article",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt || post.publishedAt,
      authors: [post.author.name],
      tags: post.keywords,
      images: [
        {
          url: coverImage,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.metaTitle,
      description: post.metaDescription,
      images: [coverImage],
      site: "@grabnext",
      creator: "@grabnext",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    other: {
      "article:published_time": post.publishedAt,
      "article:section": post.category,
      "ai:summary": post.excerpt,
      "ai:category": post.category,
      "ai:keywords": post.keywords.join(", ")
    }
  }
}

export default function BlogPostPage({ params }: Props) {
  const post = getBlogPostBySlug(params.slug)
  if (!post) {
    notFound()
  }

  const siteUrl = getSiteUrl()
  const articleUrl = `${siteUrl}/blog/${post.slug}`
  const relatedPosts = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 3)

  const formatPrice = (p: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(p)

  // Calculate discount percentage if original price exists
  const discountPercent = post.featuredProduct?.originalPrice
    ? Math.round(((post.featuredProduct.originalPrice - post.featuredProduct.price) / post.featuredProduct.originalPrice) * 100)
    : 0

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col text-slate-900 dark:text-slate-100 transition-colors">
      {/* ── Reading Progress Bar (Client Component) ── */}
      <BlogReadingProgressBar />
      <ScrollToTopButton />

      {/* ── JSON-LD Structured Data: BlogPosting + Breadcrumbs + FAQPage ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "BlogPosting",
                "@id": `${articleUrl}#article`,
                "isPartOf": {
                  "@type": "WebPage",
                  "@id": articleUrl,
                  "url": articleUrl,
                  "name": post.title
                },
                "headline": post.title,
                "description": post.excerpt,
                "image": post.coverImage,
                "datePublished": post.publishedAt,
                "dateModified": post.updatedAt || post.publishedAt,
                "mainEntityOfPage": articleUrl,
                "author": {
                  "@type": "Person",
                  "name": post.author.name,
                  "jobTitle": post.author.role
                },
                "publisher": {
                  "@type": "Organization",
                  "name": "Grabnext",
                  "logo": {
                    "@type": "ImageObject",
                    "url": `${siteUrl}/logo.webp`
                  }
                },
                "keywords": post.keywords.join(", "),
                "articleSection": post.category,
                "inLanguage": "en-IN"
              },
              {
                "@type": "BreadcrumbList",
                "@id": `${articleUrl}#breadcrumb`,
                "itemListElement": [
                  {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Home",
                    "item": siteUrl
                  },
                  {
                    "@type": "ListItem",
                    "position": 2,
                    "name": "Blog",
                    "item": `${siteUrl}/blog`
                  },
                  {
                    "@type": "ListItem",
                    "position": 3,
                    "name": post.title,
                    "item": articleUrl
                  }
                ]
              },
              {
                "@type": "FAQPage",
                "@id": `${articleUrl}#faq`,
                "mainEntity": post.faq.map((item) => ({
                  "@type": "Question",
                  "name": item.q,
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": item.a
                  }
                }))
              }
            ]
          })
        }}
      />

      <StoreHeader />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl space-y-8">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Link href="/" className="hover:text-purple-600 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-purple-600 transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[200px] sm:max-w-md">
            {post.title}
          </span>
        </nav>

        {/* Back Link */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to all guides
        </Link>

        {/* Header Metadata */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 text-xs font-bold px-3 py-1 rounded-full">
              {post.category}
            </span>
            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Published {post.publishedAt}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {post.readTime}
              </span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
            {post.title}
          </h1>

          <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed border-l-4 border-purple-500 pl-4 italic bg-purple-50/40 dark:bg-slate-900/40 py-2.5 rounded-r-lg">
            {post.excerpt}
          </p>

          {/* Author Byline & Social Share */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                {post.author.name[0]}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">{post.author.name}</p>
                <p className="text-[11px] text-slate-500">{post.author.role}</p>
              </div>
            </div>

            {/* Interactive Share & Copy Buttons */}
            <BlogShareButtons articleUrl={articleUrl} title={post.title} />
          </div>

          {/* E-E-A-T Editorial Trust & Policy Disclosure Box */}
          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px] text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                <strong className="text-slate-800 dark:text-slate-200">Fact-Checked & Reviewed</strong> — All links, files & software tested on active systems.
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 text-[10px]">
              <Info className="h-3 w-3" />
              <span>Commercial Disclosure: Direct digital product downloads with instant UPI delivery.</span>
            </div>
          </div>
        </div>

        {/* Featured Cover Image */}
        <div className="relative aspect-video sm:h-96 w-full rounded-2xl overflow-hidden shadow-sm bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover"
            loading="eager"
          />
        </div>

        {/* Article Body Content */}
        <article
          className="prose prose-slate dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 leading-relaxed space-y-4
            prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-white
            prose-h2:text-xl sm:prose-h2:text-2xl prose-h2:border-b prose-h2:border-slate-200 dark:prose-h2:border-slate-800 prose-h2:pb-2 prose-h2:mt-10
            prose-h3:text-lg sm:prose-h3:text-xl prose-h3:mt-6
            prose-p:text-sm sm:prose-p:text-base prose-p:leading-relaxed
            prose-li:text-sm sm:prose-li:text-base
            prose-strong:text-slate-900 dark:prose-strong:text-white
            prose-table:w-full prose-th:bg-purple-50 dark:prose-th:bg-slate-900"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* ── Featured Product Recommendation Box ── */}
        {post.featuredProduct && (
          <section className="bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-slate-900 dark:via-slate-900 dark:to-purple-950/40 border-2 border-purple-200 dark:border-purple-800/80 rounded-2xl p-6 shadow-md transition-all">
            <div className="flex flex-col sm:flex-row gap-6 items-center">
              <div className="h-44 w-44 shrink-0 rounded-xl overflow-hidden bg-white dark:bg-slate-950 border border-purple-100 dark:border-slate-800 p-2 flex items-center justify-center relative group">
                <img
                  src={post.featuredProduct.imageUrl}
                  alt={post.featuredProduct.title}
                  className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                />
                {discountPercent > 0 && (
                  <span className="absolute top-2 right-2 bg-rose-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-xs">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>

              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-purple-600 text-white">
                    {post.featuredProduct.badge || "Featured Product"}
                  </span>
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    <span>{post.featuredProduct.rating} / 5</span>
                    <span className="text-slate-400 font-normal text-[11px]">(Verified Purchases)</span>
                  </div>
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  {post.featuredProduct.title}
                </h3>

                <div className="space-y-1.5">
                  {post.featuredProduct.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-baseline gap-2 pt-1">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {formatPrice(post.featuredProduct.price)}
                  </span>
                  {post.featuredProduct.originalPrice && (
                    <span className="text-xs text-slate-400 line-through">
                      {formatPrice(post.featuredProduct.originalPrice)}
                    </span>
                  )}
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Zap className="h-3.5 w-3.5 fill-current" />
                    Instant UPI QR / PhonePe / GPay
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-2">
                  <Link
                    href={`/products/${post.featuredProduct.slug}`}
                    className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition-all active:scale-95 text-xs sm:text-sm"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Get Instant Access ({formatPrice(post.featuredProduct.price)}) →
                  </Link>

                  <Link
                    href="/products"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all"
                  >
                    Browse All Digital Store
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── FAQ Section for Google Rich Snippets & Readers ── */}
        {post.faq.length > 0 && (
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <HelpCircle className="h-5 w-5 text-purple-600" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Frequently Asked Questions (FAQ)
              </h2>
            </div>
            <div className="space-y-3">
              {post.faq.map((item, i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {item.q}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Author Profile & Credibility Card (E-E-A-T) ── */}
        <section className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
              {post.author.name[0]}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">About the Author: {post.author.name}</h3>
              <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">{post.author.role}</p>
            </div>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {post.author.name} specializes in digital product architecture, growth strategies, and workflow automation in India. With years of experience vetting digital toolkits and software applications, they share field-tested insights to help creators and businesses maximize efficiency.
          </p>
        </section>

        {/* ── Related Guides ── */}
        {relatedPosts.length > 0 && (
          <section className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-purple-600" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Related Guides & Tutorials
                </h2>
              </div>
              <Link href="/blog" className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1">
                View all <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedPosts.map((rel) => (
                <Link
                  key={rel.slug}
                  href={`/blog/${rel.slug}`}
                  className="group block p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-600 shadow-2xs transition-all"
                >
                  <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 block mb-1">
                    {rel.category}
                  </span>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 line-clamp-2 transition-colors">
                    {rel.title}
                  </h3>
                  <span className="text-[10px] text-slate-400 mt-2 block">
                    {rel.readTime}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  )
}
