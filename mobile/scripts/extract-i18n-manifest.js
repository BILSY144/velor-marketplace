const ts = require('typescript')
const fs = require('fs')
const path = require('path')

const ROOT = 'src'
const out = new Set()
const HAS_LETTER = /[A-Za-z]/

function keep(s) {
  const t = s.trim()
  if (t.length < 2 || !HAS_LETTER.test(t)) return
  out.add(t.slice(0, 600))
}

const PROP_NAMES = new Set(['title','sub','label','placeholder','text','kicker','back','ph','l','r'])

function walk(node, sf) {
  if (ts.isJsxText(node)) keep(node.getText(sf))
  // string literals inside JSX expressions/attributes: {'...'} or attr="..."
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    const p = node.parent
    if (p && (ts.isJsxExpression(p) || ts.isJsxAttribute(p))) keep(node.text)
    // conditional/binary branches rendered in JSX: cond ? 'a' : 'b'
    if (p && (ts.isConditionalExpression(p) || ts.isBinaryExpression(p))) keep(node.text)
    // object props like { title: '...', sub: '...' }
    if (p && ts.isPropertyAssignment(p) && PROP_NAMES.has(p.name.getText(sf))) keep(node.text)
  }
  // template literal static heads/spans (the engine translates trimmed segments)
  if (ts.isTemplateExpression(node)) {
    keep(node.head.text)
    node.templateSpans.forEach((s) => keep(s.literal.text))
  }
  ts.forEachChild(node, (c) => walk(c, sf))
}

function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) return files(p)
    return /\.(tsx|ts)$/.test(e.name) && !/i18n-manifest|i18n\.ts$/.test(e.name) ? [p] : []
  })
}

// App.tsx too
const all = ['App.tsx', ...files(ROOT)]
for (const f of all) {
  const src = fs.readFileSync(f, 'utf8')
  const sf = ts.createSourceFile(f, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  walk(sf, sf)
}

const list = [...out].sort((a, b) => a.localeCompare(b))
const body = list.map((s) => ' ' + JSON.stringify(s) + ',').join('\n')
const header = `// AUTO-GENERATED string manifest (2026-07-19): every display string the app
// renders, AST-extracted from source (JSX text nodes, display props, prose
// literals). Used by prefetchAll() in i18n.ts to pull a language's ENTIRE
// dictionary in parallel the moment it is picked -- and at startup for the
// stored language -- so screens paint translated instantly instead of
// translating batch-by-batch as the user browses. Over-inclusion is
// harmless (it only warms the shared server cache); regenerate when screens
// gain new copy (extraction script: scripts/extract-i18n-manifest.js).
export const I18N_MANIFEST: string[] = [
${body}
]
`
fs.writeFileSync('src/i18n-manifest.ts', header)
console.log('strings:', list.length)
