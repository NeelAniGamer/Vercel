const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')
const distRoot = path.join(projectRoot, 'dist')
const origin = 'https://advancedlogiclabs.dpdns.org'
const errors = []
const warnings = []

const nonIndexableRoutes = new Set([
  '/admin',
  '/Database_Logic',
  '/ati-demo',
  '/dashboard',
  '/engine',
  '/feedback',
  '/q',
  '/qr',
  '/rpg',
  '/sitemap',
  '/Traffic/GamePage',
  '/Traffic/TrafficDashboard',
  '/Traffic/TrafficSetup',
  '/verify'
])

function addError(message) {
  errors.push(message)
}

function addWarning(message) {
  warnings.push(message)
}

function captureAll(html, pattern) {
  return Array.from(html.matchAll(pattern)).map((match) => match[1].trim())
}

function captureMetaContent(html, attribute, value) {
  const tags = html.match(/<meta\b[^>]*>/gi) || []
  const namePattern = new RegExp(`\\b${attribute}\\s*=\\s*["']${value}["']`, 'i')
  return tags.filter((tag) => namePattern.test(tag)).map((tag) => {
    const content = tag.match(/\bcontent\s*=\s*(["'])([\s\S]*?)\1/i)
    return content?.[2]?.trim() || ''
  }).filter(Boolean)
}

function canonicalPattern() {
  return /<link\b(?=[^>]*\brel\s*=\s*["']canonical["'])(?=[^>]*\bhref\s*=\s*["']([^"']+)["'])[^>]*>/gi
}

function normalizeRoute(value) {
  const pathname = new URL(value, `${origin}/`).pathname
  if (pathname === '/' || /\/$/.test(pathname)) return pathname
  return pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '') || '/'
}

function routeToFile(route) {
  if (route === '/') return path.join(distRoot, 'home.html')
  const relative = route.replace(/^\/+/, '')
  const direct = path.join(distRoot, relative)
  if (fs.existsSync(direct) && fs.statSync(direct).isFile()) return direct
  if (fs.existsSync(`${direct}.html`)) return `${direct}.html`
  if (fs.existsSync(path.join(direct, 'index.html'))) return path.join(direct, 'index.html')
  return null
}

function productionAssetExists(value) {
  if (!value?.startsWith(`${origin}/`)) return false
  const assetPath = new URL(value).pathname.replace(/^\/+/, '')
  return fs.existsSync(path.join(distRoot, assetPath))
}

if (!fs.existsSync(distRoot)) {
  addError('dist/ does not exist. Run npm run build first.')
} else {
  const robotsPath = path.join(distRoot, 'robots.txt')
  const sitemapPath = path.join(distRoot, 'sitemap.xml')
  const llmsPath = path.join(distRoot, 'llms.txt')
  if (!fs.existsSync(llmsPath) || !fs.readFileSync(llmsPath, 'utf8').trim()) addError('dist/llms.txt is missing or empty.')
  if (!fs.existsSync(robotsPath)) addError('dist/robots.txt is missing.')
  else if (!fs.readFileSync(robotsPath, 'utf8').includes(`Sitemap: ${origin}/sitemap.xml`)) {
    addError('robots.txt must advertise the production XML sitemap.')
  }

  if (!fs.existsSync(sitemapPath)) {
    addError('dist/sitemap.xml is missing.')
  } else {
    const sitemap = fs.readFileSync(sitemapPath, 'utf8')
    const entries = Array.from(sitemap.matchAll(/<url>([\s\S]*?)<\/url>/gi)).map((match) => match[1])
    const routes = entries.map((entry) => {
      const location = entry.match(/<loc>\s*([^<]+?)\s*<\/loc>/i)
      return location ? normalizeRoute(location[1].trim()) : null
    })

    if (routes.length < 2) addError('sitemap.xml must contain the public indexable pages.')
    if (routes.some((route) => !route)) addError('Every sitemap entry must include a valid <loc>.')

    const seenRoutes = new Set()
    const seenTitles = new Map()
    const seenDescriptions = new Map()

    entries.forEach((entry, index) => {
      const route = routes[index]
      if (!route) return
      const loc = entry.match(/<loc>\s*([^<]+?)\s*<\/loc>/i)?.[1]?.trim()
      const lastmod = entry.match(/<lastmod>\s*([^<]+?)\s*<\/lastmod>/i)?.[1]?.trim()
      const label = route === '/' ? 'home' : route

      if (seenRoutes.has(route)) addError(`sitemap.xml lists ${route} more than once.`)
      seenRoutes.add(route)
      if (nonIndexableRoutes.has(route)) addError(`sitemap.xml advertises non-indexable route ${route}.`)
      if (loc && new URL(loc).origin !== origin) addError(`${label} sitemap URL uses the wrong origin: ${loc}`)
      if (lastmod && !/^\d{4}-\d{2}-\d{2}$/.test(lastmod)) addError(`${label} has an invalid sitemap lastmod.`)
      if (lastmod && lastmod > '2026-09-25') addError(`${label} has a future sitemap lastmod: ${lastmod}`)

      const htmlFile = routeToFile(route)
      if (!htmlFile || !fs.existsSync(htmlFile)) {
        addError(`Sitemap route ${route} does not map to a built HTML file.`)
        return
      }

      const html = fs.readFileSync(htmlFile, 'utf8')
      const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] || html
      const titles = captureAll(head, /<title\b[^>]*>([\s\S]*?)<\/title>/gi).map(decodeHtml)
      const descriptions = captureMetaContent(head, 'name', 'description').map(decodeHtml)
      const canonicals = captureAll(head, canonicalPattern())
      const robots = captureMetaContent(head, 'name', 'robots').map(decodeHtml).join(' ').toLowerCase()
      const ogTitles = captureMetaContent(head, 'property', 'og:title').map(decodeHtml)
      const ogDescriptions = captureMetaContent(head, 'property', 'og:description').map(decodeHtml)
      const ogUrls = captureMetaContent(head, 'property', 'og:url')
      const ogTypes = captureMetaContent(head, 'property', 'og:type')
      const ogImages = captureMetaContent(head, 'property', 'og:image')
      const twitterCards = captureMetaContent(head, 'name', 'twitter:card')
      const twitterTitles = captureMetaContent(head, 'name', 'twitter:title').map(decodeHtml)
      const twitterDescriptions = captureMetaContent(head, 'name', 'twitter:description').map(decodeHtml)
      const twitterImages = captureMetaContent(head, 'name', 'twitter:image')
      const jsonLdBlocks = captureAll(head, /<script\b(?=[^>]*\btype\s*=\s*["']application\/ld\+json["'])[^>]*>([\s\S]*?)<\/script>/gi)

      for (const block of jsonLdBlocks) {
        try { JSON.parse(block) } catch (error) { addError(`${label} has invalid JSON-LD: ${error.message}`) }
      }

      if (titles.length !== 1) addError(`${label} must have exactly one title.`)
      else {
        const title = titles[0]
        if (title.length < 15 || title.length > 60) addError(`${label} title must be 15-60 characters: ${title.length}.`)
        if (seenTitles.has(title)) addError(`${label} duplicates the title from ${seenTitles.get(title)}.`)
        seenTitles.set(title, label)
      }

      if (descriptions.length !== 1) addError(`${label} must have exactly one meta description.`)
      else {
        const description = descriptions[0]
        if (description.length < 70 || description.length > 165) addError(`${label} description must be 70-165 characters: ${description.length}.`)
        if (seenDescriptions.has(description)) addError(`${label} duplicates the description from ${seenDescriptions.get(description)}.`)
        seenDescriptions.set(description, label)
      }

      const expectedCanonical = route === '/' ? `${origin}/` : `${origin}${route}`
      if (canonicals.length !== 1) addError(`${label} must have exactly one canonical URL.`)
      else if (canonicals[0] !== expectedCanonical) addError(`${label} canonical must be ${expectedCanonical}, found ${canonicals[0]}.`)

      if (robots.includes('noindex')) addError(`${label} is listed in sitemap.xml but has a noindex directive.`)
      if (!/<html\b[^>]*\blang\s*=\s*["'][a-z]{2}(?:-[A-Z]{2})?["']/i.test(html)) addError(`${label} must declare a document language.`)
      if (captureMetaContent(head, 'name', 'viewport').length !== 1) {
        addError(`${label} must have one responsive viewport meta tag.`)
      }
      if (ogTitles.length !== 1 || ogDescriptions.length !== 1 || ogUrls.length !== 1 || ogTypes.length !== 1 || ogImages.length !== 1) {
        addError(`${label} needs one complete Open Graph title, description, URL, type, and image tag.`)
      } else if (ogUrls[0] !== expectedCanonical) addError(`${label} og:url must match its canonical URL.`)
      if (ogImages[0] && !productionAssetExists(ogImages[0])) addError(`${label} og:image must be an existing absolute production URL.`)
      if (twitterCards.length !== 1 || twitterTitles.length !== 1 || twitterDescriptions.length !== 1 || twitterImages.length !== 1) {
        addError(`${label} needs one complete Twitter card title, description, and image tag.`)
      }
      if (twitterImages[0] && !productionAssetExists(twitterImages[0])) addError(`${label} twitter:image must be an existing absolute production URL.`)
      if (!/<h1\b/i.test(html)) addWarning(`${label} has no static H1 heading.`)
      if (!/application\/ld\+json/i.test(html)) addWarning(`${label} has no JSON-LD structured data.`)
    })
  }
}

function decodeHtml(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

if (warnings.length > 0) {
  console.warn(`SEO check warnings (${warnings.length}):`)
  for (const warning of warnings) console.warn(`  - ${warning}`)
}

if (errors.length > 0) {
  console.error(`SEO check failed (${errors.length} error(s)):`)
  for (const error of errors) console.error(`  - ${error}`)
  process.exit(1)
}

console.log('SEO check passed.')
