import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { stopEscapePropagation } from "../lib/escape-dismissal.ts"

test("the menu and suggestion list stop Escape before the page listener", () => {
  const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8")
  const autocomplete = readFileSync(new URL("../components/subreddit-autocomplete.tsx", import.meta.url), "utf8")

  assert.match(page, /<DropdownMenuContent[^>]*onKeyDown=\{stopEscapePropagation\}/)
  assert.match(autocomplete, /<div[^>]*onKeyDown=\{handleKeyDown\}>/)
  assert.match(autocomplete, /if \(stopEscapePropagation\(e\)\)\s*\{\s*setOpen\(false\)/)
})

test("Escape is stopped by an open child menu before reaching the page reset", () => {
  let pageReset = false
  let stopped = false
  const event = {
    key: "Escape",
    stopPropagation() { stopped = true },
  }

  const handled = stopEscapePropagation(event)
  if (!stopped) pageReset = true

  assert.equal(handled, true)
  assert.equal(stopped, true)
  assert.equal(pageReset, false)
})

test("other keys keep bubbling to the page", () => {
  let stopped = false
  const handled = stopEscapePropagation({
    key: "Enter",
    stopPropagation() { stopped = true },
  })

  assert.equal(handled, false)
  assert.equal(stopped, false)
})
