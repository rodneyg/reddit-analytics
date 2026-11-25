import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import { runInThisContext } from 'node:vm'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const { Analytics } = require('@vercel/analytics/next')
const source = readFileSync(new URL('../app/layout.tsx', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS },
})
const exports = {}
const loadLayout = runInThisContext(`(function (exports, require) { ${outputText}\n})`)
// Node does not load CSS. Next.js handles the stylesheet in the production build.
loadLayout(exports, (id) => id === './globals.css' ? undefined : require(id))

test('RootLayout renders its children and one Analytics component', () => {
  const children = 'Analyzer content'
  const html = exports.default({ children })
  const body = html.props.children
  assert.equal(html.type, 'html')
  assert.equal(body.type, 'body')
  assert.deepEqual(body.props.children.map((child) => child?.type ?? child), [
    children,
    Analytics,
  ])
})

test('RootLayout sets canonical, Open Graph and Twitter metadata', () => {
  const m = exports.metadata
  assert.equal(m.title, 'Reddit Post Time Analyzer')
  assert.equal(m.description, 'Find the best time to post on your favorite subreddit.')
  assert.equal(m.metadataBase.href, 'https://reddit-analytics-nu.vercel.app/')
  assert.equal(m.alternates.canonical, '/')
  assert.equal(m.openGraph.title, m.title)
  assert.equal(m.openGraph.type, 'website')
  assert.equal(m.twitter.card, 'summary_large_image')
})

function load(file) {
  const out = ts.transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText
  const e = {}
  runInThisContext(`(function (exports) { ${out}\n})`)(e)
  return e.default
}

test('robots.txt allows the site, blocks /api and names the sitemap', () => {
  const r = load('../app/robots.ts')()
  assert.equal(r.rules.allow, '/')
  assert.equal(r.rules.disallow, '/api/')
  assert.equal(r.sitemap, 'https://reddit-analytics-nu.vercel.app/sitemap.xml')
})

test('sitemap lists the home page', () => {
  const s = load('../app/sitemap.ts')()
  assert.deepEqual(s.map((x) => x.url), ['https://reddit-analytics-nu.vercel.app/'])
})
