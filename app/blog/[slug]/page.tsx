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
  Share2,
  CheckCircle2,
  ShoppingCart,
  Star,
  Zap,
  HelpCircle,
  Tag,
  BookOpen
} from "lucide-react"

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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col text-slate-900 dark:text-slate-100 transition-colors">
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
                {post.publishedAt}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {post.readTime}
              </span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white leading-tight">
            {post.title}
          </h1>

          <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed border-l-4 border-purple-500 pl-4 italic bg-purple-50/40 dark:bg-slate-900/40 py-2 rounded-r-lg">
            {post.excerpt}
          </p>

          {/* Author Byline */}
          <div className="flex items-center justify-between pt-2 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-sm">
                {post.author.name[0]}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">{post.author.name}</p>
                <p className="text-[11px] text-slate-500">{post.author.role}</p>
              </div>
            </div>

            {/* Social Share Button (WhatsApp) */}
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${post.title} - Read more on Grabnext: ${articleUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-full shadow-xs transition-all"
            >
              <Share2 className="h-3.5 w-3.5" /> Share on WhatsApp
            </a>
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
        <div
          className="prose prose-slate dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 leading-relaxed space-y-4
            prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-white
            prose-h2:text-xl sm:prose-h2:text-2xl prose-h2:border-b prose-h2:border-slate-200 dark:prose-h2:border-slate-800 prose-h2:pb-2 prose-h2:mt-8
            prose-h3:text-lg sm:prose-h3:text-xl prose-h3:mt-6
            prose-p:text-sm sm:prose-p:text-base prose-p:leading-relaxed
            prose-li:text-sm sm:prose-li:text-base
            prose-strong:text-slate-900 dark:prose-strong:text-white"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* ── Featured Product Recommendation Box ── */}
        {post.featuredProduct && (
          <section className="bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-slate-900 dark:via-slate-900 dark:to-purple-950/40 border-2 border-purple-200 dark:border-purple-800/80 rounded-2xl p-6 shadow-md transition-all">
            <div className="flex flex-col sm:flex-row gap-6 items-center">
              <div className="h-44 w-44 shrink-0 rounded-xl overflow-hidden bg-white dark:bg-slate-950 border border-purple-100 dark:border-slate-800 p-2 flex items-center justify-center">
                <img
                  src={post.featuredProduct.imageUrl}
                  alt={post.featuredProduct.title}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-purple-600 text-white">
                    {post.featuredProduct.badge || "Featured Product"}
                  </span>
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    <span>{post.featuredProduct.rating} / 5</span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {post.featuredProduct.title}
                </h3>

                <div className="space-y-1">
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
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    Instant UPI Delivery
                  </span>
                </div>

                <div className="pt-2">
                  <Link
                    href={`/products/${post.featuredProduct.slug}`}
                    className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition-all active:scale-95 text-xs sm:text-sm"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Get Instant Access & Download →
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── FAQ Section for Google Rich Snippets ── */}
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

        {/* ── Related Guides ── */}
        {relatedPosts.length > 0 && (
          <section className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-purple-600" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Related Guides & Articles
              </h2>
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
