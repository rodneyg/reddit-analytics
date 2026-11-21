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

test('RootLayout preserves the analyzer metadata', () => {
  assert.deepEqual(exports.metadata, {
    title: 'Reddit Post Time Analyzer',
    description: 'Find the best time to post on your favorite subreddit.',
    generator: 'v0.dev',
  })
})
