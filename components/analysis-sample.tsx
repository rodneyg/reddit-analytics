export interface AnalysisSample {
  postCount: number
  oldestCreatedUtc: number
  newestCreatedUtc: number
  truncated: boolean
}

const utcDateTime = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
})

export default function AnalysisSampleSummary({ sample }: { sample?: AnalysisSample }) {
  if (!sample) return null

  const span = utcDateTime.formatRange(
    new Date(sample.oldestCreatedUtc * 1000),
    new Date(sample.newestCreatedUtc * 1000),
  )
  return (
    <p className="mt-1 text-sm text-muted-foreground">
      {sample.postCount} {sample.postCount === 1 ? "post" : "posts"} sampled · {span} UTC
      {sample.truncated ? ". Reddit’s listing was cut short." : "."}
    </p>
  )
}
