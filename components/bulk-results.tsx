import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle } from "lucide-react"
import BestTimesList from "./best-times-list"
import SubredditHeatmap from "./subreddit-heatmap"

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

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Bulk Analysis Results
            <Badge variant="outline" className="ml-2">
              {results.length} subreddit{results.length > 1 ? 's' : ''}
            </Badge>
          </CardTitle>
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