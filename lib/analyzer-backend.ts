export const ANALYZER_WAKING_MESSAGE = "Analyzer is waking up, try again in a few seconds"

export class AnalyzerWakingError extends Error {
  constructor() {
    super(ANALYZER_WAKING_MESSAGE)
  }
}

export class AnalyzerNoPostsError extends Error {
  constructor() {
    super("No posts found for this subreddit. Check the spelling or try a longer date range.")
  }
}

export function analyzerDeadline() {
  // Leave time to return JSON before Vercel ends the invocation at 60 seconds.
  return AbortSignal.timeout(50_000)
}

export async function fetchAnalysis(subreddit: string, days: string, signal: AbortSignal) {
  const params = new URLSearchParams({ subreddit, days, limit: "100" })

  try {
    const response = await fetch(`https://reddit-analyzer-backend.onrender.com/analyze?${params}`, { signal })

    if (response.status === 404) {
      throw new AnalyzerNoPostsError()
    }
    if ([502, 503, 504].includes(response.status)) {
      throw new AnalyzerWakingError()
    }
    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    if (signal.aborted) {
      throw new AnalyzerWakingError()
    }
    throw error
  }
}
