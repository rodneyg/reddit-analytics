import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy } from "lucide-react"
import { getUserTimezone, convertUtcToLocal, formatTimeWithTimezone, getTimezoneAbbreviation } from "@/lib/utils"
import { useEffect, useState } from "react"

interface BestTime {
  day: string
  hour: number
  score: number
  formattedTime: string
}

interface BestTimesListProps {
  bestTimes: BestTime[]
}

export default function BestTimesList({ bestTimes }: BestTimesListProps) {
  const [userTimezone, setUserTimezone] = useState<string>('UTC')
  const [timezoneAbbr, setTimezoneAbbr] = useState<string>('UTC')

  useEffect(() => {
    const timezone = getUserTimezone()
    const abbr = getTimezoneAbbreviation(timezone)
    setUserTimezone(timezone)
    setTimezoneAbbr(abbr)
  }, [])

  if (!bestTimes || bestTimes.length === 0) {
    return null
  }

  const medals = [
    { color: "text-yellow-500", label: "Best Time" },
    { color: "text-gray-400", label: "Second Best" },
    { color: "text-amber-600", label: "Third Best" },
  ]

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

  const formatBestTime = (time: BestTime) => {
    // Convert UTC time to local time
    const localTime = convertUtcToLocal(dayNames.indexOf(time.day), time.hour, userTimezone)
    const localDay = dayNames[localTime.day]
    const localFormatted = formatTimeWithTimezone(localDay, localTime.hour, userTimezone, false)
    const utcFormatted = formatTimeWithTimezone(time.day, time.hour, 'UTC', false)
    
    return `${utcFormatted} UTC (${localFormatted} ${timezoneAbbr})`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Best Times to Post</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-3">
          {bestTimes.slice(0, 3).map((time, index) => (
            <Card key={index} className="overflow-hidden">
              <div className={`p-2 ${medals[index].color} bg-opacity-10 flex items-center gap-2`}>
                <Trophy className={`h-4 w-4 ${medals[index].color}`} />
                <span className="font-medium">{medals[index].label}</span>
              </div>
              <CardContent className="p-4">
                <div className="text-lg font-bold leading-tight">{formatBestTime(time)}</div>
                <div className="text-sm text-muted-foreground mt-2">Avg. Score: {time.score.toFixed(1)}</div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            ⚠️ All times shown in UTC first, then converted to your local time ({timezoneAbbr}). 
            Reddit data is collected in UTC timezone.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
