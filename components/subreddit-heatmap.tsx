"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Chart, ChartTooltip, ChartTooltipContent, ChartTooltipItem } from "@/components/ui/chart"
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { useState, useEffect } from "react"
import { getUserTimezone, convertUtcToLocal, formatTimeWithTimezone, getTimezoneAbbreviation } from "@/lib/utils"

interface HeatmapDataPoint {
  x: number // hour (0-23)
  y: number // day (0-6)
  z: number // score
  day: string
  hour: number
  formattedTime: string
}

interface SubredditHeatmapProps {
  heatmapData: HeatmapDataPoint[]
}

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export default function SubredditHeatmap({ heatmapData }: SubredditHeatmapProps) {
  const [activeTooltip, setActiveTooltip] = useState<HeatmapDataPoint | null>(null)
  const [userTimezone, setUserTimezone] = useState<string>('UTC')
  const [timezoneAbbr, setTimezoneAbbr] = useState<string>('UTC')

  useEffect(() => {
    const timezone = getUserTimezone()
    const abbr = getTimezoneAbbreviation(timezone)
    setUserTimezone(timezone)
    setTimezoneAbbr(abbr)
  }, [])

  // Return null if no data is provided
  if (!heatmapData || heatmapData.length === 0) {
    return <Card><CardContent>No data available for heatmap</CardContent></Card>
  }

  // Calculate min and max scores for color scaling
  const scores = heatmapData.map((d) => d.z)
  const minScore = Math.min(...scores)
  const maxScore = Math.max(...scores)

  // Color scale function: light blue (low) to dark blue (high)
  const getColor = (score: number) => {
    const normalizedScore = maxScore === minScore ? 0.5 : (score - minScore) / (maxScore - minScore)
    return `rgb(${Math.round(220 - normalizedScore * 170)}, ${Math.round(240 - normalizedScore * 100)}, ${Math.round(255 - normalizedScore * 50)})`
  }

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

  const formatTooltipTime = (data: HeatmapDataPoint) => {
    // Convert UTC time to local time
    const localTime = convertUtcToLocal(data.y, data.x, userTimezone)
    const localDay = dayNames[localTime.day]
    const localFormatted = formatTimeWithTimezone(localDay, localTime.hour, userTimezone, false)
    const utcFormatted = formatTimeWithTimezone(data.day, data.hour, 'UTC', false)
    
    return `${utcFormatted} UTC (${localFormatted} ${timezoneAbbr})`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subreddit Engagement Heatmap</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 0, left: 0 }}>
              <XAxis
                type="number"
                dataKey="x"
                name="Hour"
                domain={[0, 23]}
                ticks={[0, 3, 6, 9, 12, 15, 18, 21, 23]}
                tick={{ fontSize: 12 }}
                label={{ value: "Hour of Day (UTC)", position: "insideBottom", offset: -15, fontSize: 14 }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Day"
                domain={[0, 6]}
                ticks={[0, 1, 2, 3, 4, 5, 6]}
                tickFormatter={(value) => days[value]}
                tick={{ fontSize: 12 }}
                label={{ value: "Day of Week", angle: -90, position: "insideLeft", offset: 10, fontSize: 14 }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as HeatmapDataPoint
                    return (
                      <ChartTooltip>
                        <ChartTooltipContent>
                          <ChartTooltipItem label="Time" value={formatTooltipTime(data)} />
                          <ChartTooltipItem label="Avg. Score" value={data.z.toFixed(1)} />
                        </ChartTooltipContent>
                      </ChartTooltip>
                    )
                  }
                  return null
                }}
              />
              <Scatter
                data={heatmapData}
                shape="square"
                fill="#8884d8" // Default fill, overridden by Cell
              >
                {heatmapData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getColor(entry.z)}
                    width={15} // Fixed size for squares
                    height={15}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 text-sm text-muted-foreground">
          Times shown in UTC. Hover over points to see your local time ({timezoneAbbr}).
        </div>
      </CardContent>
    </Card>
  )
}