import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy } from "lucide-react"

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
  if (!bestTimes || bestTimes.length === 0) {
    return null
  }

  const medals = [
    { color: "text-yellow-500", label: "Best Time" },
    { color: "text-gray-400", label: "Second Best" },
    { color: "text-amber-600", label: "Third Best" },
  ]

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
                <div className="text-2xl font-bold">{time.formattedTime}</div>
                <div className="text-sm text-muted-foreground">Avg. Score: {time.score.toFixed(1)}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
