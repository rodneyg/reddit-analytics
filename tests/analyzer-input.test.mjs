import assert from "node:assert/strict"
import test from "node:test"
import { normalizeAnalysisDays, normalizeSubreddit } from "../lib/analyzer-input.ts"

test("normalizes community names from plain and r/ inputs", () => {
  assert.equal(normalizeSubreddit("  ELIxir "), "elixir")
  assert.equal(normalizeSubreddit(" /r/Ask_Reddit "), "ask_reddit")
  assert.equal(normalizeSubreddit("r/node"), "node")
})

test("rejects blank, non-text and malformed community names", () => {
  for (const value of [null, 123, [], {}, " ", "r/", "elixir lang", "r/elixir/comments"]) {
    assert.equal(normalizeSubreddit(value), null)
  }
})

test("accepts subreddit names up to 21 characters and rejects longer names", () => {
  assert.equal(normalizeSubreddit("a".repeat(21)), "a".repeat(21))
  assert.equal(normalizeSubreddit("a".repeat(22)), null)
})

test("accepts positive whole-day ranges as strings or numbers", () => {
  for (const days of [1, 3, 7, 30, 90, 120]) {
    assert.equal(normalizeAnalysisDays(days), String(days))
    assert.equal(normalizeAnalysisDays(String(days)), String(days))
  }
  assert.equal(normalizeAnalysisDays(" 07 "), "7")
})

test("rejects invalid day ranges", () => {
  for (const value of [null, true, [], {}, "", 0, -1, 1.5, "1.5", "7 days", "1e2", "9007199254740992"]) {
    assert.equal(normalizeAnalysisDays(value), null)
  }
})
