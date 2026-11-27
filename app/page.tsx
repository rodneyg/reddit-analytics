"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Camera, Loader2, Download, HelpCircle, Keyboard } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import SubredditHeatmap from "@/components/subreddit-heatmap"
import BestTimesList from "@/components/best-times-list"
import BulkResults from "@/components/bulk-results"
import ComparisonMode from "@/components/comparison-mode"
import { SubredditAutocomplete } from "@/components/subreddit-autocomplete"
import { AnalysisResultsSkeleton } from "@/components/loading-skeletons"
import { normalizeSubreddit } from "@/lib/analyzer-input"
import { stopEscapePropagation } from "@/lib/escape-dismissal"
import AnalysisSampleSummary, { type AnalysisSample } from "@/components/analysis-sample"
import type { BulkResult } from "@/lib/bulk-export"
import { parseSubreddits, exportToJSON, exportToCSV, formatTimeRange, captureScreenshot } from "@/lib/utils"

const timeRanges = ["1", "3", "7", "30", "90"]

interface SingleAnalysis {
  subreddit: string
  timeRange: string
  data: {
    bestTimes: React.ComponentProps<typeof BestTimesList>["bestTimes"]
    heatmapData: React.ComponentProps<typeof SubredditHeatmap>["heatmapData"]
    sample?: AnalysisSample
  }
  insights: string
}

interface BulkAnalysis {
  timeRange: string
  results: BulkResult[]
}

export default function Home() {
  const [subreddit, setSubreddit] = useState("")
  const [bulkInput, setBulkInput] = useState("")
  const [timeRange, setTimeRange] = useState("30")
  const [loading, setLoading] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number } | null>(null)
  const [results, setResults] = useState<SingleAnalysis | null>(null)
  const [bulkResults, setBulkResults] = useState<BulkAnalysis | null>(null)
  const [comparisonResults, setComparisonResults] = useState<SingleAnalysis[]>([])
  const [isComparisonMode, setIsComparisonMode] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isBulkMode, setIsBulkMode] = useState(false)

  // Ref for the results section to capture in screenshot
  const resultsRef = useRef<HTMLDivElement>(null)

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter to submit
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        if (!loading && ((isBulkMode && bulkInput.trim()) || (!isBulkMode && subreddit.trim()))) {
          if (isBulkMode) {
            handleBulkSubmit()
          } else {
            handleSingleSubmit()
          }
        }
      }
      
      // Escape to clear error or reset form
      if (e.key === 'Escape') {
        if (error) {
          setError(null)
        } else if (!loading) {
          setSubreddit("")
          setBulkInput("")
          setResults(null)
          setBulkResults(null)
          setComparisonResults([])
        }
      }
      
      // Alt + B to toggle bulk mode
      if (e.altKey && e.key === 'b') {
        e.preventDefault()
        setIsBulkMode(prev => !prev)
      }
      
      // Alt + C to toggle comparison mode
      if (e.altKey && e.key === 'c') {
        e.preventDefault()
        setIsComparisonMode(prev => !prev)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [loading, isBulkMode, isComparisonMode, subreddit, bulkInput, timeRange, error])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isBulkMode) {
      await handleBulkSubmit()
    } else {
      await handleSingleSubmit()
    }
  }

  const handleSingleSubmit = async (retryAttempt = 0) => {
    if (!subreddit) return

    setLoading(true)
    setError(null)
    setResults(null)
    setBulkResults(null)
    setBulkProgress(null)
    setIsRetrying(retryAttempt > 0)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 65_000) // Let the API return its own timeout response.

    try {
      console.log(`🔍 ${retryAttempt > 0 ? 'Retrying' : 'Starting'} analysis for subreddit:`, subreddit, "over", timeRange, "days")

      const params = new URLSearchParams({ subreddit, days: timeRange })
      const response = await fetch(`/api/analyze?${params}`, {
        signal: controller.signal,
      })

      if (!response.ok) {
        if ([400, 404, 503].includes(response.status) && response.headers.get("content-type")?.includes("application/json")) {
          const { error } = await response.clone().json().catch(() => ({}))
          if (typeof error === "string" && error) {
            setError(error)
            return
          }
        }

        const text = await response.text()
        console.error("❌ Non-200 response:", response.status, text)
        throw new Error(`Error ${response.status}: ${text}`)
      }

      const data: SingleAnalysis["data"] = await response.json()
      console.log("✅ Received analysis data:", data)

      const topTime = data.bestTimes[0]
      const lowestSlot = data.heatmapData.reduce(
        (lowest: { formattedTime: string; z: number } | undefined, slot: { formattedTime: string; z: number }) =>
          !lowest || slot.z < lowest.z ? slot : lowest,
        undefined,
      )
      const finalInsight = topTime
        ? [
            `Try posting around ${topTime.formattedTime} UTC. It had the highest average engagement score (${topTime.score.toFixed(2)}) in this sample.`,
            lowestSlot && lowestSlot.z < topTime.score
              ? `The lowest-scoring observed time was ${lowestSlot.formattedTime} UTC (${lowestSlot.z.toFixed(2)}).`
              : "",
            `Only ${data.heatmapData.length} time slots had posts to measure. Compare results across several posts before changing your schedule.`,
          ].filter(Boolean).join("\n\n")
        : "There were no posting times to compare in this date range."
      const analysis = {
        subreddit: normalizeSubreddit(subreddit) ?? subreddit,
        timeRange,
        data,
        insights: finalInsight,
      }
      setResults(analysis)

      if (isComparisonMode) {
        setComparisonResults(prev => {
          const existing = prev.findIndex(r => r.subreddit === analysis.subreddit && r.timeRange === analysis.timeRange)
          if (existing >= 0) {
            const updated = [...prev]
            updated[existing] = analysis
            return updated
          }
          return [...prev, analysis]
        })
      }
    } catch (err: any) {
      const maxRetries = 2
      const isServerError = err.name === "AbortError" || (err.message && (err.message.includes("Error 500") || err.message.includes("Error 504") || err.message.includes("Error 502") || err.message.includes("Error 503")))
      
      if (isServerError && retryAttempt < maxRetries) {
        const delayTime = (retryAttempt + 1) * 5000 // 5s, 10s delays
        console.log(`🔄 Server error, retrying in ${delayTime/1000} seconds... (attempt ${retryAttempt + 1}/${maxRetries})`)
        setError(`Server is starting up, retrying automatically in ${delayTime/1000} seconds... (attempt ${retryAttempt + 1}/${maxRetries})`)
        setIsRetrying(true)
        clearTimeout(timeout)
        
        setTimeout(async () => {
          setIsRetrying(false)
          await handleSingleSubmit(retryAttempt + 1)
        }, delayTime)
        return
      }
      
      if (err.name === "AbortError") {
        console.error("⏱️ Request timed out.")
        setError("Request timed out. The analysis is taking longer than expected. Please try again or use a shorter time range.")
      } else if (err.message?.includes("Error 404")) {
        setError("Subreddit not found. Please check the spelling and try again.")
      } else if (err.message?.includes("Error 429")) {
        setError("Too many requests. Please wait a moment before trying again.")
      } else if (err.message?.includes("Error 500") || err.message?.includes("Error 502") || err.message?.includes("Error 503")) {
        setError("Server is temporarily unavailable. Please try again in a few moments.")
      } else {
        console.error("❗ Error analyzing subreddit:", err)
        setError(err?.message || "Failed to analyze subreddit. Please check your connection and try again.")
      }
      
      clearTimeout(timeout)
      setLoading(false)
    } finally {
      clearTimeout(timeout)
      setLoading(false)
    }
  }

  const handleExportJSON = () => {
    if (!results) return
    
    const exportData = {
      subreddit: results.subreddit,
      timeRange: `${results.timeRange} days`,
      exportDate: new Date().toISOString(),
      bestTimes: results.data.bestTimes,
      heatmapData: results.data.heatmapData,
      insights: results.insights
    }
    
    const filename = `reddit-analysis-${results.subreddit}-${results.timeRange}days-${new Date().toISOString().split('T')[0]}.json`
    exportToJSON(exportData, filename)
  }

  const handleExportCSV = () => {
    if (!results) return
    
    // Export best times as CSV
    const bestTimesData = results.data.bestTimes.map((time, index) => ({
      rank: index + 1,
      day: time.day,
      hour: time.hour,
      formattedTime: time.formattedTime,
      averageScore: time.score.toFixed(2),
      ...(time.postCount !== undefined ? { postCount: time.postCount } : {})
    }))
    
    const filename = `reddit-analysis-${results.subreddit}-${results.timeRange}days-besttimes-${new Date().toISOString().split('T')[0]}.csv`
    exportToCSV(bestTimesData, filename)
  }

  const handleExportHeatmapCSV = () => {
    if (!results) return
    
    // Export heatmap data as CSV
    const heatmapCSVData = results.data.heatmapData.map((data) => ({
      day: data.day,
      hour: data.x,
      formattedTime: data.formattedTime,
      averageScore: data.z.toFixed(2),
      ...(data.postCount !== undefined ? { postCount: data.postCount } : {}),
      dayIndex: data.y,
      hourIndex: data.x
    }))
    
    const filename = `reddit-analysis-${results.subreddit}-${results.timeRange}days-heatmap-${new Date().toISOString().split('T')[0]}.csv`
    exportToCSV(heatmapCSVData, filename)
  }

  const handleSaveImage = async () => {
    if (!results || !resultsRef.current) return

    try {
      const filename = `reddit-analysis-${results.subreddit}-${results.timeRange}days-screenshot-${new Date().toISOString().split('T')[0]}.png`
      await captureScreenshot(resultsRef.current, filename)
    } catch (error) {
      console.error('Error capturing screenshot:', error)
    }
  }

  const handleExportInsights = () => {
    if (!results?.insights) return

    const content = `Reddit Analysis Insights
Subreddit: r/${results.subreddit}
Time Range: ${formatTimeRange(results.timeRange)}
Analyzed: ${new Date().toLocaleString()}

${results.insights}`
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reddit-insights-${results.subreddit}-${results.timeRange}days-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleExportSummary = () => {
    if (!results) return
    
    const topTimes = results.data.bestTimes.slice(0, 3).map((time, index) =>
      `${index + 1}. ${time.formattedTime} (Score: ${time.score.toFixed(2)}${time.postCount !== undefined ? `, Posts: ${time.postCount}${time.postCount === 1 ? ", this slot rests on one post" : ""}` : ""})`
    ).join('\n')
    
    const summaryContent = `Reddit Analysis Summary
Subreddit: r/${results.subreddit}
Time Range: ${formatTimeRange(results.timeRange)}
Analyzed: ${new Date().toLocaleString()}

TOP POSTING TIMES:
${topTimes}

INSIGHTS:
${results.insights || 'No insights available'}

Data Points: ${results.data.heatmapData.length} time slots analyzed
Best Overall Score: ${Math.max(...results.data.bestTimes.map((t) => t.score)).toFixed(2)}
Generated by Reddit Post Time Analyzer`
    
    const blob = new Blob([summaryContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reddit-summary-${results.subreddit}-${results.timeRange}days-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleBulkSubmit = async (retryAttempt = 0) => {
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
    setIsRetrying(retryAttempt > 0)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 65_000)
    let progressInterval: ReturnType<typeof setInterval> | undefined

    try {
      console.log(`🔍 ${retryAttempt > 0 ? 'Retrying' : 'Starting'} bulk analysis for subreddits:`, subreddits, "over", timeRange, "days")

      // Initialize progress and simulate updates
      setBulkProgress({ current: 0, total: subreddits.length })
      
      progressInterval = setInterval(() => {
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
        if ([400, 503].includes(response.status) && response.headers.get("content-type")?.includes("application/json")) {
          const { error } = await response.clone().json().catch(() => ({}))
          if (typeof error === "string" && error) {
            setError(error)
            return
          }
        }

        const text = await response.text()
        console.error("❌ Non-200 response:", response.status, text)
        throw new Error(`Error ${response.status}: ${text}`)
      }

      const data = await response.json()
      console.log("✅ Received bulk analysis data:", data)

      setBulkResults({ timeRange, results: data.results })
    } catch (err: any) {
      const maxRetries = 2
      const isServerError = err.name === "AbortError" || (err.message && (err.message.includes("Error 500") || err.message.includes("Error 504") || err.message.includes("Error 502") || err.message.includes("Error 503")))
      
      if (isServerError && retryAttempt < maxRetries) {
        const delayTime = (retryAttempt + 1) * 5000 // 5s, 10s delays
        console.log(`🔄 Server error, retrying bulk analysis in ${delayTime/1000} seconds... (attempt ${retryAttempt + 1}/${maxRetries})`)
        setError(`Server is starting up, retrying automatically in ${delayTime/1000} seconds... (attempt ${retryAttempt + 1}/${maxRetries})`)
        setIsRetrying(true)
        clearTimeout(timeout)
        setBulkProgress(null)
        
        setTimeout(async () => {
          setIsRetrying(false)
          await handleBulkSubmit(retryAttempt + 1)
        }, delayTime)
        return
      }
      
      if (err.name === "AbortError") {
        console.error("⏱️ Request timed out.")
        setError("Bulk analysis timed out. This can happen with large requests. Try reducing the number of subreddits or use a shorter time range.")
      } else if (err.message?.includes("Maximum 10 subreddits")) {
        setError("Too many subreddits. Please limit your request to 10 subreddits at most.")
      } else {
        console.error("❗ Error analyzing subreddits:", err)
        setError(err?.message || "Failed to analyze subreddits. Please check your connection and try again.")
      }
      
      clearTimeout(timeout)
      setLoading(false)
      setBulkProgress(null)
    } finally {
      clearInterval(progressInterval)
      clearTimeout(timeout)
      setLoading(false)
      setBulkProgress(null)
    }
  }

  return (
    <TooltipProvider>
      <main className="container mx-auto py-6 px-4 max-w-6xl">
        <Card className="w-full shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold leading-none tracking-tight">Reddit Post Time Analyzer</h1>
                <CardDescription>Find the best time to post on your favorite subreddit{isBulkMode ? 's' : ''}</CardDescription>
              </div>
              <Tooltip>
                <TooltipTrigger type="button" aria-label="Keyboard shortcuts">
                  <Keyboard className="h-5 w-5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <div className="space-y-1 text-xs">
                    <div><kbd className="px-1 py-0.5 text-xs font-mono bg-muted rounded">Ctrl+Enter</kbd> Submit analysis</div>
                    <div><kbd className="px-1 py-0.5 text-xs font-mono bg-muted rounded">Esc</kbd> Clear error or reset</div>
                    <div><kbd className="px-1 py-0.5 text-xs font-mono bg-muted rounded">Alt+B</kbd> Toggle bulk mode</div>
                    <div><kbd className="px-1 py-0.5 text-xs font-mono bg-muted rounded">Alt+C</kbd> Toggle comparison</div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Mode Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
                  <Switch
                    id="bulk-mode"
                    checked={isBulkMode}
                    onCheckedChange={(checked) => {
                      setIsBulkMode(checked)
                      if (checked) {
                        setIsComparisonMode(false)
                      }
                    }}
                  />
                  <Label htmlFor="bulk-mode">Bulk Analysis Mode</Label>
                  <Tooltip>
                    <TooltipTrigger type="button" aria-label="Bulk analysis input formats">
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
                </div>
                
                <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
                  <Switch
                    id="comparison-mode"
                    checked={isComparisonMode}
                    onCheckedChange={setIsComparisonMode}
                    disabled={isBulkMode}
                  />
                  <Label htmlFor="comparison-mode">Comparison Mode</Label>
                  <Tooltip>
                    <TooltipTrigger type="button" aria-label="How comparison mode works">
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Compare multiple subreddit analyses side-by-side:</p>
                      <ul className="list-disc list-inside mt-1 text-xs">
                        <li>Run analyses on different subreddits</li>
                        <li>View comparison metrics and rankings</li>
                        <li>Switch between results in tabs</li>
                        <li>Automatically disabled in bulk mode</li>
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                </div>
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
                    <SubredditAutocomplete
                      value={subreddit}
                      onValueChange={setSubreddit}
                      placeholder="Enter subreddit name (e.g. technology)"
                      className="w-full"
                    />
                  )}
                </div>
                <fieldset className="w-full min-w-0 sm:w-auto">
                  <legend className="sr-only">Analysis time range</legend>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1 rounded-md bg-muted p-1">
                    {timeRanges.map((days) => (
                      <label key={days} className="cursor-pointer">
                        <input
                          type="radio"
                          name="analysis-time-range"
                          value={days}
                          checked={timeRange === days}
                          onChange={() => setTimeRange(days)}
                          className="peer sr-only"
                        />
                        <span className="flex justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-xs font-medium text-foreground sm:text-sm peer-checked:bg-background peer-checked:shadow-sm peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2">
                          {days} {days === "1" ? "day" : "days"}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <Button 
                  type="submit" 
                  disabled={loading || (!isBulkMode && !subreddit) || (isBulkMode && !bulkInput.trim())}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isRetrying ? "Retrying..." : (isBulkMode ? "Analyzing..." : "Analyzing")}
                    </>
                  ) : (
                    isBulkMode ? "Analyze All" : "Analyze"
                  )}
                </Button>
              </div>
            </form>

            {error && (
              <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-md">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p role="alert" className="text-sm font-medium">{error}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setError(null)
                      if (isBulkMode) {
                        handleBulkSubmit(0)
                      } else {
                        handleSingleSubmit(0)
                      }
                    }}
                    disabled={loading}
                    className="shrink-0"
                  >
                    {loading ? "Retrying..." : "Retry"}
                  </Button>
                </div>
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

            {/* Single Analysis Loading */}
            {loading && !isBulkMode && (
              <AnalysisResultsSkeleton />
            )}

            {/* Single Results */}
            {results && !loading && !isBulkMode && (
              <div ref={resultsRef} className="mt-8 space-y-8">
                <div className="text-center">
                  <h2 className="text-2xl font-bold">r/{results.subreddit}</h2>
                  <p className="text-muted-foreground">Analysis for {formatTimeRange(results.timeRange)}</p>
                  <AnalysisSampleSummary sample={results.data.sample} />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold">Results</h3>
                  <div className="flex flex-wrap gap-2" data-html2canvas-ignore>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Export Results
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56" onKeyDown={stopEscapePropagation}>
                        <DropdownMenuItem onClick={handleExportSummary}>
                          📄 Export Summary Report
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleExportJSON}>
                          📊 Export Full Data (JSON)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleExportCSV}>
                          📈 Export Best Times (CSV)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleExportHeatmapCSV}>
                          🔥 Export Heatmap Data (CSV)
                        </DropdownMenuItem>
                        {results.insights && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleExportInsights}>
                              💡 Export Insights (TXT)
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button type="button" variant="outline" size="sm" onClick={handleSaveImage}>
                      <Camera aria-hidden="true" />
                      Save image
                    </Button>
                  </div>
                </div>
                <BestTimesList bestTimes={results.data.bestTimes} />
                <SubredditHeatmap heatmapData={results.data.heatmapData} />
                {results.insights && (
                  <div className="mt-8 p-6 bg-muted rounded-lg border max-w-3xl mx-auto">
                    <h2 className="text-xl font-semibold mb-2">Strategic Insights</h2>
                    <p className="whitespace-pre-wrap text-muted-foreground">{results.insights}</p>
                  </div>
                )}
              </div>
            )}

            {/* Bulk Results */}
            {bulkResults && !loading && isBulkMode && (
              <div className="mt-8">
                <BulkResults results={bulkResults.results} timeRange={bulkResults.timeRange} />
              </div>
            )}

            {/* Comparison Results */}
            {comparisonResults.length > 0 && isComparisonMode && !loading && !isBulkMode && (
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      📊 {comparisonResults.length} analyses in comparison
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setComparisonResults([])}
                    className="text-destructive hover:text-destructive"
                  >
                    Clear Comparison
                  </Button>
                </div>
                <ComparisonMode results={comparisonResults} />
              </div>
            )}

            {/* Comparison Mode Status */}
            {isComparisonMode && comparisonResults.length === 0 && !isBulkMode && (
              <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800 text-center">
                <h2 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Comparison Mode Active
                </h2>
                <p className="text-blue-700 dark:text-blue-200 text-sm">
                  Run individual analyses on different subreddits to compare them side-by-side.
                  Results will be automatically added to the comparison view.
                </p>
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
            href="https://ko-fi.com/rg2official"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-4 py-2 bg-[#FF5E5B] text-[#1a1a1a] text-sm rounded-full hover:opacity-90 transition"
          >
            ☕ Support on Ko-fi
          </a>
        </footer>
      </main>
    </TooltipProvider>
  )
}
