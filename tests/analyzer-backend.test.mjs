import assert from "node:assert/strict"
import test from "node:test"
import { AnalyzerNoPostsError, AnalyzerWakingError, fetchAnalysis } from "../lib/analyzer-backend.ts"

test("treats the backend's no-posts response as a distinct empty result", async (t) => {
  t.mock.method(globalThis, "fetch", async () => Response.json({ error: "No posts found" }, { status: 404 }))
  await assert.rejects(
    fetchAnalysis("empty", "7", new AbortController().signal),
    AnalyzerNoPostsError,
  )
})

test("keeps cold starts and unexpected server failures distinct", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", async () => new Response(null, { status: 503 }))
  const signal = new AbortController().signal
  await assert.rejects(fetchAnalysis("elixir", "7", signal), AnalyzerWakingError)
  fetchMock.mock.mockImplementation(async () => new Response(null, { status: 500 }))
  await assert.rejects(fetchAnalysis("elixir", "7", signal), { message: "Backend error: 500" })
})
