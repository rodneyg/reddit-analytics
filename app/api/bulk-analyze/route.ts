import { type NextRequest, NextResponse } from "next/server"

const CACHE_TTL = 24 * 60 * 60 * 1000
const cache = new Map()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { subreddits, days = "30" } = body

    if (!subreddits || !Array.isArray(subreddits) || subreddits.length === 0) {
      return NextResponse.json({ error: "Subreddits array is required" }, { status: 400 })
    }

    if (subreddits.length > 10) {
      return NextResponse.json({ error: "Maximum 10 subreddits allowed per request" }, { status: 400 })
    }

    const results: Array<{ subreddit: string; data?: any; error?: string }> = []

    // Process each subreddit
    for (const subreddit of subreddits) {
      const cleanSubreddit = subreddit.trim().toLowerCase()
      if (!cleanSubreddit) {
        continue
      }

      const cacheKey = `${cleanSubreddit}-${days}`
      const cachedData = cache.get(cacheKey)

      try {
        let data
        if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
          data = cachedData.data
        } else {
          const response = await fetch(`https://reddit-analyzer-backend.onrender.com/analyze?subreddit=${cleanSubreddit}&days=${days}&limit=100`)
          
          if (!response.ok) {
            throw new Error(`Backend error: ${response.status}`)
          }

          data = await response.json()
          cache.set(cacheKey, {
            timestamp: Date.now(),
            data,
          })
        }

        results.push({
          subreddit: cleanSubreddit,
          data
        })
      } catch (error) {
        console.error(`Error analyzing subreddit ${cleanSubreddit}:`, error)
        results.push({
          subreddit: cleanSubreddit,
          error: error instanceof Error ? error.message : "Failed to analyze subreddit"
        })
      }

      // Add small delay to avoid overwhelming the backend
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Error in bulk analysis:", error)
    return NextResponse.json({ error: "Failed to process bulk analysis" }, { status: 500 })
  }
}