import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import BestTimesList from "@/components/best-times-list"
import SubredditHeatmap from "@/components/subreddit-heatmap"
import { formatTimeRange } from "@/lib/utils"

interface ComparisonResult {
  subreddit: string
  timeRange: string
  data: {
    bestTimes: any[]
    heatmapData: any[]
  }
  insights?: string
}

interface ComparisonModeProps {
  results: ComparisonResult[]
}

export default function ComparisonMode({ results }: ComparisonModeProps) {
  if (results.length === 0) return null

  // Calculate comparison metrics
  const bestOverallTime = results.reduce((best, result) => {
    const topTime = result.data.bestTimes[0]
    if (!best || topTime.score > best.score) {
      return { ...topTime, subreddit: result.subreddit }
    }
    return best
  }, null as any)

  const avgScores = results.map(result => ({
    subreddit: result.subreddit,
    avgScore: result.data.bestTimes.slice(0, 3).reduce((sum, time) => sum + time.score, 0) / 3
  })).sort((a, b) => b.avgScore - a.avgScore)

  return (
    <div className="mt-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Comparison Overview
            <Badge variant="outline">
              {results.length} subreddit{results.length > 1 ? 's' : ''}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">Best Overall Posting Time</h3>
              {bestOverallTime && (
                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">r/{bestOverallTime.subreddit}</p>
                      <p className="text-sm text-muted-foreground">{bestOverallTime.formattedTime}</p>
                    </div>
                    <Badge variant="secondary">
                      {bestOverallTime.score.toFixed(2)} score
                    </Badge>
                  </div>
                </div>
              )}
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">Average Performance Ranking</h3>
              <div className="space-y-2">
                {avgScores.map((item, index) => (
                  <div key={item.subreddit} className="flex items-center justify-between p-2 rounded border">
                    <div className="flex items-center gap-2">
                      <Badge variant={index === 0 ? "default" : "outline"} className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                        {index + 1}
                      </Badge>
                      <span className="font-medium">r/{item.subreddit}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {item.avgScore.toFixed(2)} avg
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue={results[0]?.subreddit} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
          {results.slice(0, 4).map((result) => (
            <TabsTrigger 
              key={result.subreddit} 
              value={result.subreddit}
              className="text-xs sm:text-sm"
            >
              r/{result.subreddit}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {results.map((result) => (
          <TabsContent key={result.subreddit} value={result.subreddit} className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold">r/{result.subreddit}</h2>
              <p className="text-muted-foreground">
                Analysis for {formatTimeRange(result.timeRange)}
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BestTimesList bestTimes={result.data.bestTimes} />
              <div className="lg:col-span-1">
                <SubredditHeatmap heatmapData={result.data.heatmapData} />
              </div>
            </div>
            
            {result.insights && (
              <div className="mt-6 p-6 bg-muted rounded-lg border">
                <h3 className="text-lg font-semibold mb-2">Strategic Insights</h3>
                <p className="whitespace-pre-wrap text-muted-foreground">{result.insights}</p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}