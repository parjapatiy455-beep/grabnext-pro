export const runtime = 'edge'
export const dynamic = 'force-dynamic'

import { getHomePageData } from "@/lib/home-data"
import { HomePageClient } from "@/components/home-page-client"

export default async function HomePage() {
  const { products, categories, banners } = await getHomePageData()

  return (
    <HomePageClient
      initialProducts={products}
      initialCategories={categories}
      initialBanners={banners}
    />
  )
}
