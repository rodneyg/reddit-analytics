import { type NextRequest, NextResponse } from "next/server"

const CACHE_TTL = 24 * 60 * 60 * 1000
const cache = new Map()

// Individual request timeout (20 seconds)
const INDIVIDUAL_REQUEST_TIMEOUT = 20000

async function analyzeSubreddit(subreddit: string, days: string): Promise<{ subreddit: string; data?: any; error?: string }> {
  const cleanSubreddit = subreddit.trim().toLowerCase()
  if (!cleanSubreddit) {
    return { subreddit: cleanSubreddit, error: "Invalid subreddit name" }
  }

  const cacheKey = `${cleanSubreddit}-${days}`
  const cachedData = cache.get(cacheKey)

  try {
    let data
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
      data = cachedData.data
    } else {
      // Create AbortController for individual request timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), INDIVIDUAL_REQUEST_TIMEOUT)

      try {
        const response = await fetch(`https://reddit-analyzer-backend.onrender.com/analyze?subreddit=${cleanSubreddit}&days=${days}&limit=100`, {
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        if (!response.ok) {
          throw new Error(`Backend error: ${response.status}`)
        }

        data = await response.json()
        cache.set(cacheKey, {
          timestamp: Date.now(),
          data,
        })
      } catch (error) {
        clearTimeout(timeoutId)
        throw error
      }
    }

    return {
      subreddit: cleanSubreddit,
      data
    }
  } catch (error) {
    console.error(`Error analyzing subreddit ${cleanSubreddit}:`, error)
    return {
      subreddit: cleanSubreddit,
      error: error instanceof Error ? error.message : "Failed to analyze subreddit"
    }
  }
}

async function processInBatches<T>(items: T[], batchSize: number, processor: (item: T) => Promise<any>): Promise<any[]> {
  const results = []
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchResults = await Promise.all(batch.map(processor))
    results.push(...batchResults)
    
    // Small delay between batches to avoid overwhelming the backend
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }
  
  return results
}

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

    // Process subreddits in parallel batches of 3 to balance speed and backend load
    const results = await processInBatches(
      subreddits,
      3, // Process 3 subreddits at a time
      (subreddit) => analyzeSubreddit(subreddit, days)
    )

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Error in bulk analysis:", error)
    return NextResponse.json({ error: "Failed to process bulk analysis" }, { status: 500 })
  }
}