import { Metadata } from "next"
import Link from "next/link"
import { StoreHeader } from "@/components/store-header"
import { Footer } from "@/components/footer"
import { BLOG_POSTS, getAllBlogCategories } from "@/lib/blog-data"
import { getSiteUrl } from "@/lib/site"
import { Calendar, Clock, ArrowRight, BookOpen, Sparkles, Tag, ShieldCheck, Zap } from "lucide-react"

export const runtime = "edge"
export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl()
  const pageUrl = `${siteUrl}/blog`

  return {
    title: "Digital Products Blog & Guides – Software, Video Editing & AI Tools | Grabnext",
    description: "Read in-depth guides on digital products in India: video editing assets, Canva templates, WhatsApp CRM software, Claude AI skills, and online marketing tools with instant UPI delivery.",
    keywords: [
      "digital products blog india",
      "buy digital products online",
      "video editing assets guide",
      "canva templates tutorial",
      "whatsapp marketing software guide",
      "claude ai skills prompt bundle",
      "cheap software downloads india",
      "grabnext blog"
    ],
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: "Digital Products Guides & Tutorials | Grabnext Blog",
      description: "Discover actionable guides, asset comparisons, and marketing tutorials for creators, freelancers, and businesses in India.",
      url: pageUrl,
      siteName: "Grabnext",
      type: "website",
      images: [
        {
          url: `${siteUrl}/logo.webp`,
          width: 512,
          height: 512,
          alt: "Grabnext Digital Products Blog",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Digital Products Guides & Tutorials | Grabnext Blog",
      description: "Discover actionable guides, asset comparisons, and marketing tutorials for creators, freelancers, and businesses in India.",
      images: [`${siteUrl}/logo.webp`],
    },
  }
}

export default function BlogIndexPage() {
  const siteUrl = getSiteUrl()
  const categories = getAllBlogCategories()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col text-slate-900 dark:text-slate-100 transition-colors">
      {/* Blog Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Blog",
            "name": "Grabnext Digital Products Blog",
            "description": "Guides, tutorials, and product recommendations for digital assets, software, and creator tools in India.",
            "url": `${siteUrl}/blog`,
            "publisher": {
              "@type": "Organization",
              "name": "Grabnext",
              "logo": {
                "@type": "ImageObject",
                "url": `${siteUrl}/logo.webp`
              }
            },
            "blogPost": BLOG_POSTS.map((post) => ({
              "@type": "BlogPosting",
              "headline": post.title,
              "description": post.excerpt,
              "url": `${siteUrl}/blog/${post.slug}`,
              "datePublished": post.publishedAt,
              "image": post.coverImage,
              "author": {
                "@type": "Person",
                "name": post.author.name
              }
            }))
          })
        }}
      />

      <StoreHeader />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl space-y-10">
        {/* Header Hero Section */}
        <div className="text-center space-y-3 py-6 bg-gradient-to-b from-purple-50/50 to-transparent dark:from-slate-900/40 rounded-3xl p-6 border border-purple-100/50 dark:border-slate-800">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Digital Products Knowledge Hub</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Digital Products, Software & Growth <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500">Guides</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            In-depth guides, asset breakdowns, and business strategies to help you save time, boost marketing ROI, and leverage top digital products in India.
          </p>

          {/* Quick Categories Bar */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-3">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <Tag className="h-3 w-3" /> Topics:
            </span>
            {categories.map((cat) => (
              <span
                key={cat}
                className="text-xs px-3 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-700 dark:text-slate-300 shadow-2xs"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>

        {/* Featured Post (First Article) */}
        {BLOG_POSTS.length > 0 && (
          <div className="relative group overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center p-6 md:p-8">
              <div className="relative h-64 md:h-80 w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-950">
                <img
                  src={BLOG_POSTS[0].coverImage}
                  alt={BLOG_POSTS[0].title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="eager"
                />
                <span className="absolute top-3 left-3 bg-purple-600 text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-sm">
                  {BLOG_POSTS[0].category}
                </span>
              </div>
              <div className="flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {BLOG_POSTS[0].publishedAt}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {BLOG_POSTS[0].readTime}
                    </span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors leading-tight">
                    <Link href={`/blog/${BLOG_POSTS[0].slug}`}>
                      {BLOG_POSTS[0].title}
                    </Link>
                  </h2>
                  <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed line-clamp-3">
                    {BLOG_POSTS[0].excerpt}
                  </p>
                </div>
                <div className="pt-2">
                  <Link
                    href={`/blog/${BLOG_POSTS[0].slug}`}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 group-hover:translate-x-1 transition-all"
                  >
                    Read Full Article <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* All Blog Posts Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-purple-600" />
              Latest Articles & Guides
            </h2>
            <span className="text-xs text-slate-500">{BLOG_POSTS.length} Guides Available</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {BLOG_POSTS.slice(1).map((post) => (
              <article
                key={post.slug}
                className="group flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs hover:shadow-md transition-all duration-300 hover:border-purple-300 dark:hover:border-purple-600"
              >
                {/* Cover Image */}
                <div className="relative h-48 w-full bg-slate-100 dark:bg-slate-950 overflow-hidden">
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <span className="absolute top-2.5 left-2.5 bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    {post.category}
                  </span>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {post.publishedAt}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {post.readTime}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base leading-snug group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2">
                      <Link href={`/blog/${post.slug}`}>
                        {post.title}
                      </Link>
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500 font-medium">By {post.author.name}</span>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1 hover:underline"
                    >
                      Read <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Bottom Banner to Browse Store Products */}
        <section className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-8 text-center space-y-4 shadow-lg border border-purple-500/20">
          <span className="inline-block bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full">
            🔥 Instant Downloads
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white">
            Ready to Accelerate Your Projects with Verified Digital Products?
          </h2>
          <p className="text-sm text-indigo-200 max-w-xl mx-auto leading-relaxed">
            Browse our full catalog of software source codes, video editing assets, Canva marketing templates, and masterclasses starting from just ₹49.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/products"
              className="bg-white text-slate-950 font-bold px-6 py-2.5 rounded-full hover:bg-slate-100 transition-all shadow-md text-sm"
            >
              Browse All Digital Products →
            </Link>
            <Link
              href="/categories"
              className="border border-indigo-300/40 text-white font-semibold px-6 py-2.5 rounded-full hover:bg-white/10 transition-all text-sm"
            >
              View Categories
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs text-indigo-300">
            <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-amber-400" /> Instant UPI Delivery</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> 100% Virus-Free Verified</span>
            <span className="flex items-center gap-1.5">⚡ Lifetime Cloud Access</span>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
