"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Clipboard, Link as LinkIcon } from "lucide-react"
import SubredditHeatmap from "@/components/subreddit-heatmap"
import BestTimesList from "@/components/best-times-list"

export default function Home() {
  const [subreddit, setSubreddit] = useState("")
  const [timeRange, setTimeRange] = useState("30")
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subreddit) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/analyze?subreddit=${subreddit}&days=${timeRange}`)

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()
      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze subreddit")
    } finally {
      setLoading(false)
    }
  }

  // Auto-load from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sub = params.get("subreddit")
    const days = params.get("days")
    if (sub) {
      setSubreddit(sub)
      if (days) setTimeRange(days)
      setTimeout(() => {
        handleSubmit(new Event("submit") as any)
      }, 100)
    }
  }, [])

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

          {error && <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-md">{error}</div>}

          {results && !loading && (
            <div className="mt-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Analyzed:{" "}
                  <a
                    href={`https://reddit.com/r/${subreddit}`}
                    target="_blank"
                    className="underline hover:text-primary"
                  >
                    r/{subreddit}
                  </a>
                </p>
                <p className="text-xs text-muted-foreground sm:text-right">All times shown in UTC</p>
              </div>

              <BestTimesList bestTimes={results.bestTimes} />
              <SubredditHeatmap heatmapData={results.heatmapData} />

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const url = `${window.location.origin}/?subreddit=${subreddit}&days=${timeRange}`
                  navigator.clipboard.writeText(url)
                  setLinkCopied(true)
                  setTimeout(() => setLinkCopied(false), 2000)
                }}
              >
                <LinkIcon className="w-4 h-4 mr-2" />
                {linkCopied ? "Link copied!" : "Copy Shareable Link"}
              </Button>
            </div>
          )}

          {results?.insights && (
            <div className="mt-8 p-6 bg-muted rounded-lg border max-w-3xl mx-auto relative">
              <h2 className="text-xl font-semibold mb-2">Strategic Insights</h2>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(results.insights)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                }}
                className="absolute top-4 right-4 h-8 px-3 text-xs"
                variant="secondary"
              >
                <Clipboard className="w-4 h-4 mr-1" />
                {copied ? "Copied" : "Copy"}
              </Button>
              <p className="whitespace-pre-wrap text-muted-foreground">{results.insights}</p>
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