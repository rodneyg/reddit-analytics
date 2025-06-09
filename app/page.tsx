"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Loader2, Download } from "lucide-react"
import SubredditHeatmap from "@/components/subreddit-heatmap"
import BestTimesList from "@/components/best-times-list"
import { exportToJSON, exportToCSV } from "@/lib/utils"

export default function Home() {
  const [subreddit, setSubreddit] = useState("")
  const [timeRange, setTimeRange] = useState("30")
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [insight, setInsight] = useState<string>("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subreddit) return

    setLoading(true)
    setError(null)
    setInsight("")

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

      const prompt = `Analyze Reddit posting patterns for r/${subreddit} over the past ${timeRange} days. Top times: ${data.bestTimes
        .map((t: any) => `${t.formattedTime} (${t.score.toFixed(2)})`) 
        .join(", ")}`

      const gptRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        }),
      })

      if (!gptRes.ok) {
        const errorText = await gptRes.text()
        console.error("❌ GPT error:", gptRes.status, errorText)
        setInsight("No insights returned from AI.")
        return
      }

      const gptJson = await gptRes.json()
      const aiContent = gptJson.choices?.[0]?.message?.content?.trim()
      console.log("🧠 Insight generated:", aiContent)
      setInsight(aiContent || "No insights returned from AI.")
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

  const handleExportJSON = () => {
    if (!results) return
    
    const exportData = {
      subreddit,
      timeRange: `${timeRange} days`,
      exportDate: new Date().toISOString(),
      bestTimes: results.bestTimes,
      heatmapData: results.heatmapData,
      insights: insight
    }
    
    const filename = `reddit-analysis-${subreddit}-${timeRange}days-${new Date().toISOString().split('T')[0]}.json`
    exportToJSON(exportData, filename)
  }

  const handleExportCSV = () => {
    if (!results) return
    
    // Export best times as CSV
    const bestTimesData = results.bestTimes.map((time: any, index: number) => ({
      rank: index + 1,
      day: time.day,
      hour: time.hour,
      formattedTime: time.formattedTime,
      averageScore: time.score.toFixed(2)
    }))
    
    const filename = `reddit-analysis-${subreddit}-${timeRange}days-${new Date().toISOString().split('T')[0]}.csv`
    exportToCSV(bestTimesData, filename)
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
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Analysis Results</h2>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export Results
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleExportJSON}>
                      Export as JSON
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportCSV}>
                      Export as CSV
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <BestTimesList bestTimes={results.bestTimes} />
              <SubredditHeatmap heatmapData={results.heatmapData} />
              {insight && (
                <div className="mt-8 p-6 bg-muted rounded-lg border max-w-3xl mx-auto">
                  <h2 className="text-xl font-semibold mb-2">Strategic Insights</h2>
                  <p className="whitespace-pre-wrap text-muted-foreground">{insight}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <footer className="mt-16 w-full border-t pt-6 text-center text-sm text-muted-foreground">
        <p className="mb-2">
          Built by {" "}
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
