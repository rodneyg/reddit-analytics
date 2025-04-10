"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2 } from "lucide-react"
import SubredditHeatmap from "@/components/subreddit-heatmap"
import BestTimesList from "@/components/best-times-list"

export default function Home() {
  const [subreddit, setSubreddit] = useState("")
  const [timeRange, setTimeRange] = useState("30")
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subreddit) return

    setLoading(true)
    setError(null)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 25000) // 25s timeout

    try {
      console.log("🔍 Starting analysis for subreddit:", subreddit, "over", timeRange, "days")

      const response = await fetch(`/api/analyze?subreddit=${subreddit}&days=${timeRange}`, {
        signal: controller.signal,
      })

      if (!response.ok) {
        const text = await response.text()
        console.error("❌ Non-200 response:", response.status, text)
        throw new Error(`Error ${response.status}: ${text}`)
      }

      const data = await response.json()
      console.log("✅ Received analysis data:", data)

      setResults(data)
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.error("⏱️ Request timed out.")
        setError("Server took too long to respond. Try again in a few seconds.")
      } else {
        console.error("❗ Error analyzing subreddit:", err)
        setError(err?.message || "Failed to analyze subreddit")
      }
    } finally {
      clearTimeout(timeout)
      setLoading(false)
    }
  }

  return (
    <main className="container mx-auto py-10 px-4">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Reddit Post Time Analyzer</CardTitle>
          <CardDescription>Find the best time to post on your favorite subreddit</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Enter subreddit name (e.g. technology)"
                  value={subreddit}
                  onChange={(e) => setSubreddit(e.target.value)}
                  className="w-full"
                />
              </div>
              <Tabs defaultValue="30" onValueChange={setTimeRange} className="w-full sm:w-auto">
                <TabsList>
                  <TabsTrigger value="7">Past 7 days</TabsTrigger>
                  <TabsTrigger value="30">Past 30 days</TabsTrigger>
                </TabsList>
              </Tabs>
              <Button type="submit" disabled={loading || !subreddit}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing
                  </>
                ) : (
                  "Analyze"
                )}
              </Button>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-md">
              {error}
            </div>
          )}

          {results && !loading && (
            <div className="mt-8 space-y-8">
              <BestTimesList bestTimes={results.bestTimes} />
              <SubredditHeatmap heatmapData={results.heatmapData} />
              {results?.insights && (
                <div className="mt-8 p-6 bg-muted rounded-lg border max-w-3xl mx-auto">
                  <h2 className="text-xl font-semibold mb-2">Strategic Insights</h2>
                  <p className="whitespace-pre-wrap text-muted-foreground">
                    {results.insights}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <footer className="mt-16 w-full border-t pt-6 text-center text-sm text-muted-foreground">
        <p className="mb-2">
          Built by{" "}
          <a
            href="https://rodneygainous.com"
            className="font-medium text-primary underline hover:opacity-80"
          >
            Rodney Gainous Jr
          </a>
        </p>
        <a
          href="https://ko-fi.com/yourkofi"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-4 py-2 bg-[#FF5E5B] text-white text-sm rounded-full hover:opacity-90 transition"
        >
          ☕ Support on Ko-fi
        </a>
      </footer>
    </main>
  )
}