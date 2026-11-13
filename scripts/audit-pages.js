/**
 * Audit the public site for factual and reference accuracy.
 *
 * Reports, for every page:
 *   - head metadata (title, description, canonical, robots, OG/Twitter, JSON-LD)
 *   - the <h1> text
 *   - every internal link and asset reference, resolved against the built tree
 *
 * Dev-only: scripts/ is excluded from the deploy artifact.
 *
 * Usage: node scripts/audit-pages.js
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const DIST = path.join(ROOT, 'dist')
const PAGE_ROOTS = ['.', 'Traffic', 'Terra3D', 'cast']
const SKIP_DIRS = [
  'node_modules',
  'dist',
  'Models',
  'Models And SFX',
  'src',
  '.git',
  '.agents',
  '.opencode',
  'supabase',
  'skills',
  'scripts',
  'docs',
  'react-src',
  'traffic-ts'
]

function walk(dir, out) {
  if (!dir || !fs.existsSync(dir)) return out
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (SKIP_DIRS.includes(entry.name)) continue
      walk(full, out)
    } else if (entry.name.endsWith('.html')) {
      out.push(full)
    }
  }
  return out
}

function metaTags(html, key, value) {
  const tags = html.match(/<meta\b[^>]*>/gi) || []
  const re = new RegExp('\\b' + key + '\\s*=\\s*["\']' + value + '["\']', 'i')
  return tags
    .filter((t) => re.test(t))
    .map((t) => {
      const m = t.match(/\bcontent\s*=\s*(["'])([\s\S]*?)\1/i)
      return m ? m[2] : ''
    })
    .filter(Boolean)
}

function capture(html, re) {
  return Array.from(html.matchAll(re)).map((m) => m[1].trim())
}

function textOf(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&mdash;/g, '—')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/\s+/g, ' ')
    .trim()
}

function existsInDist(relPath) {
  const candidates = [path.join(DIST, relPath), path.join(DIST, relPath + '.html'), path.join(DIST, relPath, 'index.html')]
  for (const c of candidates) {
    try {
      if (fs.existsSync(c) && fs.statSync(c).isFile()) return true
    } catch (e) {
      /* ignore */
    }
  }
  return false
}

function resolveRef(pageFile, url) {
  const clean = url.split('#')[0].split('?')[0]
  if (!clean) return { ok: true }
  if (/^(https?:|mailto:|tel:|data:|javascript:|\/\/)/i.test(clean)) return { ok: true }
  // Template-literal and placeholder URLs are resolved at runtime, not on disk.
  if (clean.includes('${') || clean === 'about:blank') return { ok: true }
  // The site root is served through cleanUrls + the `/` → `/home` rewrite.
  if (clean === '/') return { ok: true }
  if (clean.startsWith('/')) return { ok: existsInDist(clean.replace(/^\/+/, '')), resolved: clean }
  const abs = path.resolve(path.dirname(pageFile), clean)
  const rel = path.relative(ROOT, abs).replace(/\\/g, '/')
  return { ok: existsInDist(rel), resolved: rel }
}

const files = []
for (const p of PAGE_ROOTS) walk(path.resolve(ROOT, p), files)

const unique = Array.from(new Set(files)).sort()
const problems = []
const notes = []
const rows = []

for (const file of unique) {
  const html = fs.readFileSync(file, 'utf8')
  const rel = path.relative(ROOT, file).replace(/\\/g, '/')
  // The Twilio domain-verification file is intentionally a bare token, not a page.
  if (/^[0-9a-f]{32}\.html$/.test(rel)) continue
  // Pages excluded from the deploy are not part of the shipped site.
  const distRel = path.relative(ROOT, path.join(DIST, rel)).replace(/\\/g, '/')
  if (!existsInDist(distRel)) continue
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i) ? html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)[1] : html
  const body = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i) ? html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)[1] : html

  const titles = capture(head, /<title\b[^>]*>([\s\S]*?)<\/title>/gi)
  const descriptions = metaTags(head, 'name', 'description')
  const canonicals = capture(head, /<link\b(?=[^>]*\brel\s*=\s*["']canonical["'])[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/gi)
  const robots = metaTags(head, 'name', 'robots').join(' ').toLowerCase()
  const ogTitle = metaTags(head, 'property', 'og:title')
  const ogDesc = metaTags(head, 'property', 'og:description')
  const ogUrl = metaTags(head, 'property', 'og:url')
  const ogImage = metaTags(head, 'property', 'og:image')
  const twCard = metaTags(head, 'name', 'twitter:card')
  const twTitle = metaTags(head, 'name', 'twitter:title')
  const twDesc = metaTags(head, 'name', 'twitter:description')
  const twImage = metaTags(head, 'name', 'twitter:image')
  const h1s = capture(body, /<h1\b[^>]*>([\s\S]*?)<\/h1>/gi).map(textOf)
  const jsonLd = capture(head, /<script\b(?=[^>]*\btype\s*=\s*["']application\/ld\+json["'])[^>]*>([\s\S]*?)<\/script>/gi)
  const langMatch = html.match(/<html\b[^>]*\blang\s*=\s*["']([^"']+)["']/i)
  const lang = langMatch ? langMatch[1] : ''

  rows.push({
    page: rel,
    titleLen: (titles[0] || '').length,
    descLen: (descriptions[0] || '').length,
    h1: h1s.length,
    ld: jsonLd.length,
    og: ogTitle.length + ogDesc.length + ogUrl.length + ogImage.length,
    tw: twCard.length + twTitle.length + twDesc.length + twImage.length
  })

  if (titles.length !== 1) problems.push(rel + ': ' + titles.length + ' <title> tags')
  if (descriptions.length !== 1) problems.push(rel + ': ' + descriptions.length + ' meta descriptions')
  if (canonicals.length !== 1) problems.push(rel + ': ' + canonicals.length + ' canonical links')
  if (!lang) problems.push(rel + ': no <html lang>')
  if (h1s.length !== 1) notes.push(rel + ': ' + h1s.length + ' <h1> elements')
  if (!jsonLd.length) notes.push(rel + ': no JSON-LD')
  if (ogTitle.length + ogDesc.length + ogUrl.length + ogImage.length !== 4) problems.push(rel + ': incomplete Open Graph set')
  if (twCard.length + twTitle.length + twDesc.length + twImage.length !== 4) problems.push(rel + ': incomplete Twitter card set')
  if (robots && robots.indexOf('noindex') === -1) notes.push(rel + ': indexable (' + robots + ')')

  const refs = Array.from(html.matchAll(/(?:^|[\s"'=(])(?:src|href)\s*=\s*["']([^"']+)["']/gi)).map((m) => m[1])
  const seen = {}
  for (const ref of refs) {
    if (seen[ref]) continue
    seen[ref] = true
    const r = resolveRef(file, ref)
    if (!r.ok) problems.push(rel + ': missing reference "' + ref + '"')
  }
}

console.log('Audited ' + unique.length + ' HTML pages\n')
console.log('page'.padEnd(44) + 'title desc  h1 ld og tw')
for (const r of rows) {
  console.log(
    r.page.padEnd(44) +
      String(r.titleLen).padEnd(5) +
      String(r.descLen).padEnd(5) +
      String(r.h1).padEnd(3) +
      String(r.ld).padEnd(3) +
      String(r.og).padEnd(3) +
      String(r.tw)
  )
}

console.log('\n' + problems.length + ' problem(s):')
for (const p of problems) console.log('  - ' + p)
console.log('\n' + notes.length + ' note(s):')
for (const n of notes) console.log('  - ' + n)
