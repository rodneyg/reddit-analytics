import assert from "node:assert/strict"
import test from "node:test"
import { convertUtcToLocal } from "../lib/utils.ts"

test("converts each weekday using the current week in a northern zone", () => {
  const referenceDate = new Date("2026-03-04T12:00:00Z")

  assert.deepEqual(convertUtcToLocal(6, 8, "America/New_York", referenceDate), { day: 6, hour: 3 })
  assert.deepEqual(convertUtcToLocal(0, 8, "America/New_York", referenceDate), { day: 0, hour: 4 })
})

test("converts each weekday using the current week in a southern zone", () => {
  const referenceDate = new Date("2026-04-02T12:00:00Z")

  assert.deepEqual(convertUtcToLocal(6, 8, "Australia/Sydney", referenceDate), { day: 6, hour: 19 })
  assert.deepEqual(convertUtcToLocal(0, 8, "Australia/Sydney", referenceDate), { day: 0, hour: 18 })
})
