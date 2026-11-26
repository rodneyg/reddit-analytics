import assert from "node:assert/strict"
import { registerHooks } from "node:module"
import test from "node:test"

const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      return nextResolve(new URL(`../${specifier.slice(2)}.ts`, import.meta.url).href, context)
    }
    return nextResolve(specifier === "next/server" ? "next/server.js" : specifier, context)
  },
})

const { POST } = await import("../app/api/bulk-analyze/route.ts").finally(() => hooks.deregister())

async function analyze(subreddits, days = "7") {
  const response = await POST(new Request("http://localhost/api/bulk-analyze", {
    method: "POST",
    body: JSON.stringify({ subreddits, days }),
  }))
  assert.equal(response.status, 200)
  return (await response.json()).results
}

test("fetches each normalized subreddit once and preserves bulk row order", async (t) => {
  const fetch = t.mock.method(globalThis, "fetch", async (url) => {
    const name = new URL(url).searchParams.get("subreddit")
    return Response.json({ name })
  })

  assert.deepEqual(await analyze(["technology", "programming", "r/Technology"]), [
    { subreddit: "technology", data: { name: "technology" } },
    { subreddit: "programming", data: { name: "programming" } },
    { subreddit: "technology", data: { name: "technology" } },
  ])
  assert.equal(fetch.mock.callCount(), 2)
  await analyze(["r/Technology"])
  assert.equal(fetch.mock.callCount(), 2)
  await analyze(["technology"], "30")
  assert.equal(fetch.mock.callCount(), 3)
})

test("shares a no-posts result within the batch and retries on a later request", async (t) => {
  const fetch = t.mock.method(globalThis, "fetch", async () => new Response(null, { status: 404 }))

  const rows = await analyze(["elixir", "r/Elixir"])
  assert.equal(rows.length, 2)
  assert.match(rows[0].error, /No posts found/)
  assert.deepEqual(rows[0], rows[1])
  assert.equal(fetch.mock.callCount(), 1)

  fetch.mock.mockImplementation(async () => Response.json({ ready: true }))
  assert.deepEqual(await analyze(["elixir"]), [
    { subreddit: "elixir", data: { ready: true } },
  ])
  assert.equal(fetch.mock.callCount(), 2)
})
