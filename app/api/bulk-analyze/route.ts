import { type NextRequest, NextResponse } from "next/server"
import { analyzerDeadline, AnalyzerNoPostsError, AnalyzerWakingError, fetchAnalysis } from "@/lib/analyzer-backend"
import { normalizeAnalysisDays, normalizeSubreddit } from "@/lib/analyzer-input"

export const maxDuration = 60

const CACHE_TTL = 24 * 60 * 60 * 1000
const cache = new Map()

async function analyzeSubreddit(cleanSubreddit: string, days: string, signal: AbortSignal): Promise<{ subreddit: string; data?: any; error?: string }> {
  const cacheKey = `${cleanSubreddit}-${days}`
  const cachedData = cache.get(cacheKey)

  try {
    let data
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
      data = cachedData.data
    } else {
      data = await fetchAnalysis(cleanSubreddit, days, signal)
      cache.set(cacheKey, {
        timestamp: Date.now(),
        data,
      })
    }

    return {
      subreddit: cleanSubreddit,
      data
    }
  } catch (error) {
    if (error instanceof AnalyzerWakingError) throw error

    if (!(error instanceof AnalyzerNoPostsError)) {
      console.error(`Error analyzing subreddit ${cleanSubreddit}:`, error)
    }
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
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 })
  }

  if (!body || typeof body !== "object" || !("subreddits" in body)) {
    return NextResponse.json({ error: "Subreddits array is required" }, { status: 400 })
  }

  const { subreddits } = body
  if (!Array.isArray(subreddits) || subreddits.length === 0) {
    return NextResponse.json({ error: "Subreddits array is required" }, { status: 400 })
  }
  if (subreddits.length > 10) {
    return NextResponse.json({ error: "Maximum 10 subreddits allowed per request" }, { status: 400 })
  }

  const days = normalizeAnalysisDays("days" in body ? body.days : "30")
  if (!days) {
    return NextResponse.json({ error: "Days must be a positive whole number" }, { status: 400 })
  }

  try {
    // Share the timeout and lookups across batches in this request.
    const signal = analyzerDeadline()
    const analyses = new Map<string, ReturnType<typeof analyzeSubreddit>>()

    const results = await processInBatches(subreddits, 3, async (subreddit) => {
      const name = normalizeSubreddit(subreddit)
      if (!name) {
        const label = typeof subreddit === "string" ? subreddit.trim().toLowerCase() : ""
        return { subreddit: label, error: "Invalid subreddit name" }
      }

      let analysis = analyses.get(name)
      if (!analysis) {
        analysis = analyzeSubreddit(name, days, signal)
        analyses.set(name, analysis)
      }
      return analysis
    })

    return NextResponse.json({ results })
  } catch (error) {
    if (error instanceof AnalyzerWakingError) {
      return NextResponse.json({ error: error.message }, { status: 503 })
    }

    console.error("Error in bulk analysis:", error)
    return NextResponse.json({ error: "Failed to process bulk analysis" }, { status: 500 })
  }
}
