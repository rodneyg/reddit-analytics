import type { MetadataRoute } from 'next'

const SITE_URL = 'https://reddit-analytics-nu.vercel.app'

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${SITE_URL}/`, changeFrequency: 'monthly', priority: 1 }]
}
