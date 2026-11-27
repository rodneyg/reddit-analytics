import assert from "node:assert/strict"
import test from "node:test"
import { getBestTimesRows, getHeatmapRows, getSuccessfulResults } from "../lib/bulk-export.ts"

const time = { day: "Monday", formattedTime: "Monday 9AM UTC" }
const bestTime = { ...time, hour: 9, score: 4.125, postCount: 3 }
const heatmapPoint = { ...time, x: 9, y: 1, z: 2.5, postCount: 3 }
const results = [
  { subreddit: "reactjs", data: { bestTimes: [bestTime, bestTime], heatmapData: [heatmapPoint] } },
  { subreddit: "missing", error: "Unavailable", data: { bestTimes: [bestTime] } },
  { subreddit: "typescript", data: { bestTimes: [bestTime], heatmapData: [heatmapPoint] } },
  { subreddit: "empty" },
]

test("includes every successful subreddit with its original analysis data", () => {
  assert.deepEqual(getSuccessfulResults(results), [
    { subreddit: "reactjs", ...results[0].data },
    { subreddit: "typescript", ...results[2].data },
  ])
})

test("labels CSV rows by subreddit and restarts best time ranks per subreddit", () => {
  const successful = getSuccessfulResults(results)
  assert.deepEqual(getBestTimesRows(successful), [
    { subreddit: "reactjs", rank: 1, ...time, hour: 9, averageScore: "4.13", postCount: 3 },
    { subreddit: "reactjs", rank: 2, ...time, hour: 9, averageScore: "4.13", postCount: 3 },
    { subreddit: "typescript", rank: 1, ...time, hour: 9, averageScore: "4.13", postCount: 3 },
  ])
  assert.deepEqual(getHeatmapRows(successful), [
    { subreddit: "reactjs", ...time, hour: 9, averageScore: "2.50", dayIndex: 1, hourIndex: 9, postCount: 3 },
    { subreddit: "typescript", ...time, hour: 9, averageScore: "2.50", dayIndex: 1, hourIndex: 9, postCount: 3 },
  ])
})

test("omits failures and tolerates an analysis with an empty or missing dataset", () => {
  assert.deepEqual(getSuccessfulResults([{ subreddit: "missing", error: "Unavailable" }]), [])
  const successful = getSuccessfulResults([{ subreddit: "reactjs", data: { bestTimes: [] } }])
  assert.deepEqual(getBestTimesRows(successful), [])
  assert.deepEqual(getHeatmapRows(successful), [])
})

test("keeps old backend exports usable when slot post counts are missing", () => {
  const legacy = getSuccessfulResults([{
    subreddit: "legacy",
    data: { bestTimes: [{ ...time, hour: 9, score: 2 }], heatmapData: [{ ...time, x: 9, y: 1, z: 2 }] },
  }])
  assert.deepEqual(getBestTimesRows(legacy), [{ subreddit: "legacy", rank: 1, ...time, hour: 9, averageScore: "2.00" }])
  assert.deepEqual(getHeatmapRows(legacy), [{ subreddit: "legacy", ...time, hour: 9, averageScore: "2.00", dayIndex: 1, hourIndex: 9 }])
})
