"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Loader2, HelpCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import SubredditHeatmap from "@/components/subreddit-heatmap"
import BestTimesList from "@/components/best-times-list"
import BulkResults from "@/components/bulk-results"
import { parseSubreddits } from "@/lib/utils"

export default function Home() {
  const [subreddit, setSubreddit] = useState("")
  const [bulkInput, setBulkInput] = useState("")
  const [timeRange, setTimeRange] = useState("30")
  const [loading, setLoading] = useState(false)
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number } | null>(null)
  const [results, setResults] = useState<any>(null)
  const [bulkResults, setBulkResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [insight, setInsight] = useState<string>("")
  const [isBulkMode, setIsBulkMode] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isBulkMode) {
      await handleBulkSubmit()
    } else {
      await handleSingleSubmit()
    }
  }

  const handleSingleSubmit = async () => {
    if (!subreddit) return

    setLoading(true)
    setError(null)
    setInsight("")
    setResults(null)
    setBulkResults(null)
    setBulkProgress(null)

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

  const handleBulkSubmit = async () => {
    const subreddits = parseSubreddits(bulkInput)
    
    if (subreddits.length === 0) {
      setError("Please enter at least one subreddit")
      return
    }

    if (subreddits.length > 10) {
      setError("Maximum 10 subreddits allowed per request")
      return
    }

    setLoading(true)
    setError(null)
    setResults(null)
    setBulkResults(null)
    setBulkProgress(null)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 60000) // 60s timeout for bulk

    try {
      console.log("🔍 Starting bulk analysis for subreddits:", subreddits, "over", timeRange, "days")

      // Initialize progress and simulate updates
      setBulkProgress({ current: 0, total: subreddits.length })
      
      const progressInterval = setInterval(() => {
        setBulkProgress(prev => {
          if (!prev) return null
          const newCurrent = Math.min(prev.current + 1, prev.total - 1)
          return { current: newCurrent, total: prev.total }
        })
      }, 1000)

      const response = await fetch("/api/bulk-analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subreddits,
          days: timeRange,
        }),
        signal: controller.signal,
      })

      clearInterval(progressInterval)
      setBulkProgress({ current: subreddits.length, total: subreddits.length })

      if (!response.ok) {
        const text = await response.text()
        console.error("❌ Non-200 response:", response.status, text)
        throw new Error(`Error ${response.status}: ${text}`)
      }

      const data = await response.json()
      console.log("✅ Received bulk analysis data:", data)

      setBulkResults(data.results)
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.error("⏱️ Request timed out.")
        setError("Server took too long to respond. Try again in a few seconds.")
      } else {
        console.error("❗ Error analyzing subreddits:", err)
        setError(err?.message || "Failed to analyze subreddits")
      }
    } finally {
      clearTimeout(timeout)
      setLoading(false)
      setBulkProgress(null)
    }
  }

  return (
    <TooltipProvider>
      <main className="container mx-auto py-10 px-4">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Reddit Post Time Analyzer</CardTitle>
            <CardDescription>Find the best time to post on your favorite subreddit{isBulkMode ? 's' : ''}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Mode Toggle */}
              <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
                <Switch
                  id="bulk-mode"
                  checked={isBulkMode}
                  onCheckedChange={setIsBulkMode}
                />
                <Label htmlFor="bulk-mode" className="flex items-center gap-2">
                  Bulk Analysis Mode
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Analyze multiple subreddits at once using various input formats:</p>
                      <ul className="list-disc list-inside mt-1 text-xs">
                        <li>Comma separated: technology, programming, react</li>
                        <li>Line separated</li>
                        <li>Bullet points: • technology • programming</li>
                        <li>Dashes: - technology - programming</li>
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                </Label>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  {isBulkMode ? (
                    <Textarea
                      placeholder="Enter multiple subreddit names using any format:&#10;technology, programming, reactjs&#10;or&#10;• technology&#10;• programming&#10;• reactjs&#10;or&#10;- technology&#10;- programming&#10;- reactjs"
                      value={bulkInput}
                      onChange={(e) => setBulkInput(e.target.value)}
                      className="min-h-[120px] w-full"
                      rows={5}
                    />
                  ) : (
                    <Input
                      placeholder="Enter subreddit name (e.g. technology)"
                      value={subreddit}
                      onChange={(e) => setSubreddit(e.target.value)}
                      className="w-full"
                    />
                  )}
                </div>
                <Tabs defaultValue="30" onValueChange={setTimeRange} className="w-full sm:w-auto">
                  <TabsList>
                    <TabsTrigger value="7">Past 7 days</TabsTrigger>
                    <TabsTrigger value="30">Past 30 days</TabsTrigger>
                  </TabsList>
                </Tabs>
                <Button 
                  type="submit" 
                  disabled={loading || (!isBulkMode && !subreddit) || (isBulkMode && !bulkInput.trim())}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isBulkMode ? "Analyzing..." : "Analyzing"}
                    </>
                  ) : (
                    isBulkMode ? "Analyze All" : "Analyze"
                  )}
                </Button>
              </div>
            </form>

            {error && (
              <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-md">
                {error}
              </div>
            )}

            {/* Bulk Progress */}
            {loading && isBulkMode && bulkProgress && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    Analyzing subreddits ({bulkProgress.current} of {bulkProgress.total})
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {Math.round((bulkProgress.current / bulkProgress.total) * 100)}%
                  </span>
                </div>
                <Progress value={(bulkProgress.current / bulkProgress.total) * 100} className="w-full" />
              </div>
            )}

            {/* Single Results */}
            {results && !loading && !isBulkMode && (
              <div className="mt-8 space-y-8">
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

            {/* Bulk Results */}
            {bulkResults && !loading && isBulkMode && (
              <div className="mt-8">
                <BulkResults results={bulkResults} timeRange={timeRange} />
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
    </TooltipProvider>
  )
}
