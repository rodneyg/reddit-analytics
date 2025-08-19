"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Loader2, Download, HelpCircle, Keyboard } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import SubredditHeatmap from "@/components/subreddit-heatmap"
import BestTimesList from "@/components/best-times-list"
import BulkResults from "@/components/bulk-results"
import ComparisonMode from "@/components/comparison-mode"
import { SubredditAutocomplete } from "@/components/subreddit-autocomplete"
import { AnalysisResultsSkeleton } from "@/components/loading-skeletons"
import { parseSubreddits, exportToJSON, exportToCSV, formatTimeRange } from "@/lib/utils"

export default function Home() {
  const [subreddit, setSubreddit] = useState("")
  const [bulkInput, setBulkInput] = useState("")
  const [timeRange, setTimeRange] = useState("30")
  const [loading, setLoading] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number } | null>(null)
  const [results, setResults] = useState<any>(null)
  const [bulkResults, setBulkResults] = useState<any>(null)
  const [comparisonResults, setComparisonResults] = useState<any[]>([])
  const [isComparisonMode, setIsComparisonMode] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [insight, setInsight] = useState<string>("")
  const [isBulkMode, setIsBulkMode] = useState(false)

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
          setInsight("")
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
  }, [loading, isBulkMode, isComparisonMode, subreddit, bulkInput, error])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isBulkMode) {
      await handleBulkSubmit()
    } else {
      await handleSingleSubmit()
    }
  }

  const handleSingleSubmit = async (isRetry = false) => {
    if (!subreddit) return

    setLoading(true)
    setError(null)
    setInsight("")
    setResults(null)
    setBulkResults(null)
    setBulkProgress(null)
    setIsRetrying(false)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 25000) // 25s timeout

    try {
      console.log(`🔍 ${isRetry ? 'Retrying' : 'Starting'} analysis for subreddit:`, subreddit, "over", timeRange, "days")

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
      const finalInsight = aiContent || "No insights returned from AI."
      setInsight(finalInsight)
      
      // Add to comparison mode if enabled
      if (isComparisonMode) {
        const comparisonResult = {
          subreddit,
          timeRange,
          data,
          insights: finalInsight
        }
        setComparisonResults(prev => {
          const existing = prev.findIndex(r => r.subreddit === subreddit && r.timeRange === timeRange)
          if (existing >= 0) {
            const updated = [...prev]
            updated[existing] = comparisonResult
            return updated
          }
          return [...prev, comparisonResult]
        })
      }
    } catch (err: any) {
      const isServerError = err.name === "AbortError" || (err.message && (err.message.includes("Error 500") || err.message.includes("Error 504")))
      
      if (isServerError && !isRetry) {
        console.log("🔄 Server may be cold starting, retrying in 3 seconds...")
        setError("Server is starting up, retrying automatically...")
        setIsRetrying(true)
        clearTimeout(timeout)
        
        setTimeout(async () => {
          setIsRetrying(false)
          await handleSingleSubmit(true)
        }, 3000)
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
    
    const filename = `reddit-analysis-${subreddit}-${timeRange}days-besttimes-${new Date().toISOString().split('T')[0]}.csv`
    exportToCSV(bestTimesData, filename)
  }

  const handleExportHeatmapCSV = () => {
    if (!results) return
    
    // Export heatmap data as CSV
    const heatmapCSVData = results.heatmapData.map((data: any) => ({
      day: data.day,
      hour: data.hour,
      formattedTime: data.formattedTime,
      averageScore: data.z.toFixed(2),
      dayIndex: data.y,
      hourIndex: data.x
    }))
    
    const filename = `reddit-analysis-${subreddit}-${timeRange}days-heatmap-${new Date().toISOString().split('T')[0]}.csv`
    exportToCSV(heatmapCSVData, filename)
  }

  const handleExportInsights = () => {
    if (!insight) return
    
    const insightData = {
      subreddit,
      timeRange: formatTimeRange(timeRange),
      analyzedOn: new Date().toLocaleString(),
      insights: insight
    }
    
    const content = `Reddit Analysis Insights
Subreddit: r/${subreddit}
Time Range: ${formatTimeRange(timeRange)}
Analyzed: ${new Date().toLocaleString()}

${insight}`
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reddit-insights-${subreddit}-${timeRange}days-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleExportSummary = () => {
    if (!results) return
    
    const topTimes = results.bestTimes.slice(0, 3).map((time: any, index: number) => 
      `${index + 1}. ${time.formattedTime} (Score: ${time.score.toFixed(2)})`
    ).join('\n')
    
    const summaryContent = `Reddit Analysis Summary
Subreddit: r/${subreddit}
Time Range: ${formatTimeRange(timeRange)}
Analyzed: ${new Date().toLocaleString()}

TOP POSTING TIMES:
${topTimes}

INSIGHTS:
${insight || 'No insights available'}

Data Points: ${results.heatmapData.length} time slots analyzed
Best Overall Score: ${Math.max(...results.bestTimes.map((t: any) => t.score)).toFixed(2)}
Generated by Reddit Post Time Analyzer`
    
    const blob = new Blob([summaryContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reddit-summary-${subreddit}-${timeRange}days-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleBulkSubmit = async (isRetry = false) => {
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
    setIsRetrying(false)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 60000) // 60s timeout for bulk

    try {
      console.log(`🔍 ${isRetry ? 'Retrying' : 'Starting'} bulk analysis for subreddits:`, subreddits, "over", timeRange, "days")

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
      const isServerError = err.name === "AbortError" || (err.message && (err.message.includes("Error 500") || err.message.includes("Error 504")))
      
      if (isServerError && !isRetry) {
        console.log("🔄 Server may be cold starting, retrying in 3 seconds...")
        setError("Server is starting up, retrying automatically...")
        setIsRetrying(true)
        clearTimeout(timeout)
        setBulkProgress(null)
        
        setTimeout(async () => {
          setIsRetrying(false)
          await handleBulkSubmit(true)
        }, 3000)
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
                <CardTitle className="text-2xl">Reddit Post Time Analyzer</CardTitle>
                <CardDescription>Find the best time to post on your favorite subreddit{isBulkMode ? 's' : ''}</CardDescription>
              </div>
              <Tooltip>
                <TooltipTrigger>
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
                
                <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
                  <Switch
                    id="comparison-mode"
                    checked={isComparisonMode}
                    onCheckedChange={setIsComparisonMode}
                    disabled={isBulkMode}
                  />
                  <Label htmlFor="comparison-mode" className="flex items-center gap-2">
                    Comparison Mode
                    <Tooltip>
                      <TooltipTrigger>
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
                  </Label>
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
                <Tabs defaultValue="30" onValueChange={setTimeRange} className="w-full sm:w-auto">
                  <TabsList className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 w-full h-auto gap-1">
                    <TabsTrigger value="1" className="text-xs sm:text-sm">1 day</TabsTrigger>
                    <TabsTrigger value="3" className="text-xs sm:text-sm">3 days</TabsTrigger>
                    <TabsTrigger value="7" className="text-xs sm:text-sm">7 days</TabsTrigger>
                    <TabsTrigger value="30" className="text-xs sm:text-sm">30 days</TabsTrigger>
                    <TabsTrigger value="90" className="text-xs sm:text-sm">90 days</TabsTrigger>
                  </TabsList>
                </Tabs>
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
                    <p className="font-medium">Analysis Failed</p>
                    <p className="text-sm mt-1">{error}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setError(null)
                      if (isBulkMode) {
                        handleBulkSubmit(true)
                      } else {
                        handleSingleSubmit(true)
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
              <div className="mt-8 space-y-8">
                <div className="text-center">
                  <h2 className="text-2xl font-bold">r/{subreddit}</h2>
                  <p className="text-muted-foreground">Analysis for {formatTimeRange(timeRange)}</p>
                </div>
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Results</h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export Results
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
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
                      {insight && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={handleExportInsights}>
                            💡 Export Insights (TXT)
                          </DropdownMenuItem>
                        </>
                      )}
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

            {/* Bulk Results */}
            {bulkResults && !loading && isBulkMode && (
              <div className="mt-8">
                <BulkResults results={bulkResults} timeRange={timeRange} />
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
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Comparison Mode Active
                </h3>
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
