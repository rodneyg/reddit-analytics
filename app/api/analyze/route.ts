import { type NextRequest, NextResponse } from "next/server"
import { getRedditAccessToken } from "@/lib/reddit"

const CACHE_TTL = 24 * 60 * 60 * 1000
const cache = new Map()

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const subreddit = searchParams.get("subreddit")
  const days = searchParams.get("days") || "30"

  if (!subreddit) {
    return NextResponse.json({ error: "Subreddit is required" }, { status: 400 })
  }

  const cacheKey = `${subreddit}-${days}`
  const cachedData = cache.get(cacheKey)

  if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
    return NextResponse.json(cachedData.data)
  }

  try {
    const response = await fetch(`https://reddit-analyzer-backend.onrender.com/analyze?subreddit=${subreddit}&days=${days}&limit=100`)

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`)
    }

    const data = await response.json()
    cache.set(cacheKey, {
      timestamp: Date.now(),
      data,
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error forwarding to backend:", error)
    return NextResponse.json({ error: "Failed to analyze subreddit" }, { status: 500 })
  }
}


function processRedditData(posts: any[]) {
  const dayHourBins: Record<string, { total: number; count: number }> = {}

  posts.forEach((post) => {
    const createdUtc = post.created_utc
    const date = new Date(createdUtc * 1000)
    const day = date.getUTCDay()
    const hour = date.getUTCHours()
    const engagement = (post.score || 0) + (post.num_comments || 0)
    const key = `${day}-${hour}`

    if (!dayHourBins[key]) {
      dayHourBins[key] = { total: 0, count: 0 }
    }

    dayHourBins[key].total += engagement
    dayHourBins[key].count += 1
  })

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  const heatmapData: any[] = []
  const timeScores: any[] = []

  Object.entries(dayHourBins).forEach(([key, value]) => {
    const [day, hour] = key.split("-").map(Number)
    const avgScore = value.total / value.count
    const formattedHour = hour % 12 || 12
    const amPm = hour < 12 ? "AM" : "PM"
    const formattedTime = `${dayNames[day]} ${formattedHour}${amPm}`

    heatmapData.push({
      x: hour,
      y: day,
      z: avgScore,
      day: dayNames[day],
      hour,
      formattedTime,
    })

    timeScores.push({
      day: dayNames[day],
      hour,
      score: avgScore,
      formattedTime,
    })
  })

  const bestTimes = timeScores.sort((a, b) => b.score - a.score).slice(0, 3)

  return { heatmapData, bestTimes }
}

async function generateInsight(subreddit: string, days: number, heatmap: any[], bestTimes: any[]) {
  const topSlots = bestTimes.map(t => `- ${t.formattedTime}: ${t.score.toFixed(2)} avg score`).join("\n")
  const heatmapSummary = heatmap
    .sort((a, b) => b.z - a.z)
    .slice(0, 50)
    .map(d => `${d.formattedTime}: ${d.z.toFixed(2)}`)
    .join("\n")

  const prompt = `
Analyze Reddit posting patterns for the subreddit r/${subreddit} over the past ${days} days.

Data:
Top 3 time windows:
${topSlots}

Engagement by time (z = avg score):
${heatmapSummary}

Based on this data, provide a concise, strategic summary of the best times and patterns to post. Avoid generic advice.
`

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    }),
  })

  const json = await response.json()
  return json.choices?.[0]?.message?.content || "No insight generated."
}