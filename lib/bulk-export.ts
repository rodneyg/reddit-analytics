interface PostingTime {
  day: string
  formattedTime: string
}

export interface BulkResult {
  subreddit: string
  data?: {
    bestTimes?: (PostingTime & { hour: number; score: number })[]
    heatmapData?: (PostingTime & { x: number; y: number; z: number })[]
  }
  error?: string
}

export function getSuccessfulResults(results: BulkResult[]) {
  return results.flatMap(({ subreddit, data, error }) =>
    data && !error ? [{ subreddit, bestTimes: data.bestTimes, heatmapData: data.heatmapData }] : [],
  )
}

type SuccessfulResults = ReturnType<typeof getSuccessfulResults>

export function getBestTimesRows(results: SuccessfulResults) {
  return results.flatMap(({ subreddit, bestTimes }) =>
    (bestTimes ?? []).map(({ day, hour, formattedTime, score }, index) => ({
      subreddit,
      rank: index + 1,
      day,
      hour,
      formattedTime,
      averageScore: score.toFixed(2),
    })),
  )
}

export function getHeatmapRows(results: SuccessfulResults) {
  return results.flatMap(({ subreddit, heatmapData }) =>
    (heatmapData ?? []).map(({ day, formattedTime, x, y, z }) => ({
      subreddit,
      day,
      hour: x,
      formattedTime,
      averageScore: z.toFixed(2),
      dayIndex: y,
      hourIndex: x,
    })),
  )
}
