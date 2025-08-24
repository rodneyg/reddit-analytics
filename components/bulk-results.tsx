import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CheckCircle, XCircle, AlertCircle, Download } from "lucide-react"
import BestTimesList from "./best-times-list"
import SubredditHeatmap from "./subreddit-heatmap"
import { exportToJSON, exportToCSV } from "@/lib/utils"

interface BulkResult {
  subreddit: string
  data?: any
  error?: string
}

interface BulkResultsProps {
  results: BulkResult[]
  timeRange: string
}

export default function BulkResults({ results, timeRange }: BulkResultsProps) {
  const successCount = results.filter(r => r.data && !r.error).length
  const errorCount = results.filter(r => r.error).length
  const successfulResults = results.filter(r => r.data && !r.error)

  const handleExportJSON = () => {
    if (successfulResults.length === 0) return
    
    const exportData = {
      type: 'bulk-analysis',
      timeRange: `${timeRange} days`,
      exportDate: new Date().toISOString(),
      subreddits: successfulResults.map(result => ({
        subreddit: result.subreddit,
        bestTimes: result.data.bestTimes,
        heatmapData: result.data.heatmapData
      })),
      summary: {
        totalSubreddits: results.length,
        successfulAnalyses: successCount,
        failedAnalyses: errorCount
      }
    }
    
    const filename = `reddit-bulk-analysis-${timeRange}days-${new Date().toISOString().split('T')[0]}.json`
    exportToJSON(exportData, filename)
  }

  const handleExportBestTimesCSV = () => {
    if (successfulResults.length === 0) return
    
    // Consolidate best times from all successful results
    const consolidatedBestTimes: any[] = []
    successfulResults.forEach(result => {
      result.data.bestTimes.forEach((time: any, index: number) => {
        consolidatedBestTimes.push({
          subreddit: result.subreddit,
          rank: index + 1,
          day: time.day,
          hour: time.hour,
          formattedTime: time.formattedTime,
          averageScore: time.score.toFixed(2)
        })
      })
    })
    
    const filename = `reddit-bulk-analysis-besttimes-${timeRange}days-${new Date().toISOString().split('T')[0]}.csv`
    exportToCSV(consolidatedBestTimes, filename)
  }

  const handleExportHeatmapCSV = () => {
    if (successfulResults.length === 0) return
    
    // Consolidate heatmap data from all successful results
    const consolidatedHeatmapData: any[] = []
    successfulResults.forEach(result => {
      result.data.heatmapData.forEach((data: any) => {
        consolidatedHeatmapData.push({
          subreddit: result.subreddit,
          day: data.day,
          hour: data.hour,
          formattedTime: data.formattedTime,
          averageScore: data.z.toFixed(2),
          dayIndex: data.y,
          hourIndex: data.x
        })
      })
    })
    
    const filename = `reddit-bulk-analysis-heatmap-${timeRange}days-${new Date().toISOString().split('T')[0]}.csv`
    exportToCSV(consolidatedHeatmapData, filename)
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <CardTitle>Bulk Analysis Results</CardTitle>
              <Badge variant="outline" className="ml-2">
                {results.length} subreddit{results.length > 1 ? 's' : ''}
              </Badge>
            </div>
            {successfulResults.length > 0 && (
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
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleExportBestTimesCSV}>
                    Export Best Times (CSV)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportHeatmapCSV}>
                    Export Heatmap Data (CSV)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              {successCount} successful
            </div>
            {errorCount > 0 && (
              <div className="flex items-center gap-2 text-red-600">
                <XCircle className="h-4 w-4" />
                {errorCount} failed
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Tabs */}
      <Tabs defaultValue={results.find(r => r.data)?.subreddit || results[0]?.subreddit} className="w-full">
        <TabsList className="w-full flex flex-wrap gap-1 h-auto p-1">
          {results.map((result) => (
            <TabsTrigger
              key={result.subreddit}
              value={result.subreddit}
              className="flex items-center gap-2 text-sm"
            >
              {result.error ? (
                <XCircle className="h-3 w-3 text-red-500" />
              ) : (
                <CheckCircle className="h-3 w-3 text-green-500" />
              )}
              r/{result.subreddit}
            </TabsTrigger>
          ))}
        </TabsList>

        {results.map((result) => (
          <TabsContent key={result.subreddit} value={result.subreddit} className="mt-6">
            {result.error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Failed to analyze r/{result.subreddit}: {result.error}
                </AlertDescription>
              </Alert>
            ) : result.data ? (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-2xl font-bold">r/{result.subreddit}</h2>
                  <p className="text-muted-foreground">Analysis for past {timeRange} days</p>
                </div>
                <BestTimesList bestTimes={result.data.bestTimes} />
                <SubredditHeatmap heatmapData={result.data.heatmapData} />
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No data available for r/{result.subreddit}
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}