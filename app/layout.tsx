import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import './globals.css'

const SITE_URL = 'https://reddit-analytics-nu.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Reddit Post Time Analyzer',
  description: 'Find the best time to post on your favorite subreddit.',
  generator: 'v0.dev',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'Reddit Post Time Analyzer',
    title: 'Reddit Post Time Analyzer',
    description: 'Find the best time to post on your favorite subreddit.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Reddit Post Time Analyzer',
    description: 'Find the best time to post on your favorite subreddit.',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
