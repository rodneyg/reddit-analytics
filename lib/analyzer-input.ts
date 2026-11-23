export function normalizeSubreddit(value: unknown): string | null {
  if (typeof value !== "string") return null

  const name = value.trim().toLowerCase().replace(/^\/?r\//, "")
  return /^[a-z0-9_]+$/.test(name) ? name : null
}

export function normalizeAnalysisDays(value: unknown): string | null {
  if (typeof value !== "number" && typeof value !== "string") return null

  const text = String(value).trim()
  if (!/^\d+$/.test(text)) return null

  const days = Number(text)
  return Number.isSafeInteger(days) && days > 0 ? String(days) : null
}
