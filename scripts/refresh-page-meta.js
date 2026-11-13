/**
 * Refreshes page metadata.
 *
 * Several pages were shipped with partial head tags (no description, no Open
 * Graph set, no JSON-LD). This script inserts only the tags a page is missing,
 * using the table below as the single source of truth, so every page ends up
 * with a complete and internally consistent head.
 *
 * It is idempotent: re-running it never duplicates a tag.
 *
 * Dev-only: scripts/ is excluded from the deploy artifact.
 *
 * Usage: node scripts/refresh-page-meta.js [--check]
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const ORIGIN = 'https://advancedlogiclabs.dpdns.org'
const CHECK_ONLY = process.argv.includes('--check')

/**
 * route      – canonical path on the live site
 * title      – <title> (only written if the page has none)
 * desc       – meta description (only written if the page has none)
 * ogImage    – absolute Open Graph image path
 * robots     – 'noindex' for internal pages, 'index' otherwise
 * jsonLd     – optional structured-data object appended to the page's head
 */
const PAGES = {
  '404.html': {
    route: '/404',
    desc: 'That page could not be found. Return to the Class Of Learners studio hub to explore 16 free, local-first interactive learning apps.',
    ogImage: '/og/home.jpg',
    robots: 'noindex'
  },
  'admin.html': {
    route: '/admin',
    desc: 'Internal admin command center for Class Of Learners — manage dynamic QR codes, published apps, and site status.',
    ogImage: '/og/home.jpg',
    robots: 'noindex'
  },
  'dashboard.html': {
    route: '/dashboard',
    desc: 'Your Class Of Learners dashboard — progress, certificates, achievements, and synced simulator state.',
    ogImage: '/og/home.jpg',
    robots: 'noindex'
  },
  'engine.html': {
    route: '/solar',
    desc: 'The interactive solar system engine — Keplerian orbital mechanics, live telemetry, and planetary-scale rendering.',
    ogImage: '/og/solar.jpg',
    robots: 'noindex'
  },
  'feedback.html': {
    route: '/feedback',
    desc: 'Share feedback, report an issue, or reach the Class Of Learners team in Mumbai.',
    ogImage: '/og/home.jpg',
    robots: 'noindex'
  },
  'verify.html': {
    route: '/verify',
    desc: 'Verify a Class Of Learners certificate and pull achievement records straight from the Supabase backend.',
    ogImage: '/og/home.jpg',
    robots: 'noindex'
  },
  'q.html': {
    route: '/q',
    desc: 'Resolving a Class Of Learners short link.',
    ogImage: '/og/home.jpg',
    robots: 'noindex'
  },
  'qr.html': {
    route: '/qr',
    desc: 'QR Command Center — create, manage, and track dynamic QR codes with live scan analytics.',
    ogImage: '/og/qr.jpg',
    robots: 'noindex'
  },
  'rpg.html': {
    route: '/rpg',
    desc: 'Quest Master — a browser action RPG with procedural dungeons, real-time combat, loot, and an original WebAudio chiptune score.',
    ogImage: '/og/home.jpg',
    robots: 'noindex'
  },
  'ati-lite.html': {
    route: '/ati-lite',
    desc: 'ATI Engine v3.2 — a lightweight, offline-first touch-typing and code-syntax drill.',
    ogImage: '/og/home.jpg',
    robots: 'noindex'
  },
  'ati-demo.html': {
    route: '/ati-demo',
    desc: 'ATI Velocity Studio — practice touch typing, Python and JavaScript code, and timed runs with live speed scores.',
    ogImage: '/og/home.jpg',
    robots: 'noindex'
  },
  'glass-demo.html': {
    route: '/glass-demo',
    desc: 'Liquid Glass component demo — the studio’s shared frosted-glass design system for technical interfaces.',
    ogImage: '/og/home.jpg',
    robots: 'noindex'
  },
  'Database_Logic.html': {
    route: '/Database_Logic',
    desc: 'An interactive 50-module civic engineering database with Motor Vehicles Act jurisprudence, RTO challan calculations, and relational query modelling.',
    ogImage: '/og/home.jpg',
    robots: 'noindex',
    jsonLd: {
      '@type': 'SoftwareApplication',
      name: 'Database Logic & Query Engine',
      url: ORIGIN + '/Database_Logic',
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Web, Windows, Linux, Android',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
      description: 'An interactive guide through 50 modules of Indian civic law and traffic regulations under the Motor Vehicles Act, with a live RTO challan simulator.'
    }
  },
  'civiclogic.html': {
    route: '/civiclogic',
    desc: 'CivicLogic — a 50-module civic engineering database with Motor Vehicles Act jurisprudence, RTO challan calculations, and IRC standards for Mumbai road users.',
    ogImage: '/og/home.jpg',
    robots: 'index',
    jsonLd: {
      '@type': 'SoftwareApplication',
      name: 'CivicLogic: Mumbai Statutory Knowledge Base',
      url: ORIGIN + '/civiclogic',
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Web, Windows, Linux, Android',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
      description: 'A 50-module interactive civic engineering database with a live RTO challan simulator and deep Motor Vehicles Act jurisprudence.'
    }
  },
  'cereal.html': {
    route: '/cereal',
    desc: 'Cereal records lectures and meetings, then turns them into transcripts, bullet points, and calendar tasks with Gemini Flash.',
    ogImage: '/og/home.jpg',
    robots: 'index'
  },
  'Traffic/GamePage.html': {
    route: '/Traffic/GamePage',
    desc: 'The React-mode build of the Mumbai Traffic Driving Simulator.',
    ogImage: '/og/traffic.jpg',
    robots: 'noindex'
  },
  'Traffic/TrafficDashboard.html': {
    route: '/Traffic/TrafficDashboard',
    desc: 'Traffic Academy dashboard — learner progress, module completion, and certificate status.',
    ogImage: '/og/traffic.jpg',
    robots: 'noindex'
  },
  'Traffic/TrafficSetup.html': {
    route: '/Traffic/TrafficSetup',
    desc: 'Traffic Academy driver setup — create your learner profile before starting the Mumbai driving academy.',
    ogImage: '/og/traffic.jpg',
    robots: 'noindex'
  },
  'Traffic/index.html': {
    route: '/Traffic',
    desc: 'Mumbai Traffic Hero — a 3D driving simulator and rules academy for Indian road users.',
    ogImage: '/og/traffic.jpg',
    robots: 'noindex'
  },
  'Traffic/lod_test.html': {
    route: '/Traffic/lod_test',
    desc: 'Internal level-of-detail diagnostic for the Traffic simulator renderer.',
    ogImage: '/og/traffic.jpg',
    robots: 'noindex'
  },
  'Traffic/traffic-messenger.html': {
    route: '/Traffic/traffic-messenger',
    desc: 'Traffic Academy messenger — in-app messaging for learners and mentors.',
    ogImage: '/og/traffic.jpg',
    robots: 'noindex'
  },
  'cast/CastFlow.html': {
    route: '/cast/CastFlow',
    desc: 'CastFlow — stream your laptop display to an Android TV, tablet, or secondary monitor over local Wi-Fi.',
    ogImage: '/og/castflow.jpg',
    robots: 'noindex'
  },
  'cast/viewer-standalone.html': {
    route: '/cast/viewer-standalone',
    desc: 'Standalone CastFlow receiver — the viewer that runs on the receiving display.',
    ogImage: '/og/castflow.jpg',
    robots: 'noindex'
  }
}

function has(html, pattern) {
  return pattern.test(html)
}

function buildTags(spec, html) {
  const canonical = ORIGIN + spec.route
  const title = (html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || ''
  const pageTitle = title.trim() || `${spec.route}`
  const tags = []

  if (!has(html, /<link\b(?=[^>]*\brel\s*=\s*["']canonical["'])/i)) {
    tags.push(`    <link rel="canonical" href="${canonical}" />`)
  }
  if (!has(html, /<meta\b[^>]*\bname\s*=\s*["']description["']/i)) {
    tags.push(`    <meta name="description" content="${spec.desc}" />`)
  }
  if (!has(html, /<meta\b[^>]*\bname\s*=\s*["']robots["']/i)) {
    tags.push(`    <meta name="robots" content="${spec.robots}, nofollow" />`)
  }
  if (!has(html, /<meta\b[^>]*\bproperty\s*=\s*["']og:title["']/i)) {
    tags.push(`    <meta property="og:title" content="${pageTitle}" />`)
    tags.push(`    <meta property="og:description" content="${spec.desc}" />`)
    tags.push(`    <meta property="og:url" content="${canonical}" />`)
    tags.push(`    <meta property="og:type" content="website" />`)
    tags.push(`    <meta property="og:image" content="${ORIGIN}${spec.ogImage}" />`)
    tags.push(`    <meta property="og:image:width" content="1200" />`)
    tags.push(`    <meta property="og:image:height" content="630" />`)
  }
  if (!has(html, /<meta\b[^>]*\bname\s*=\s*["']twitter:card["']/i)) {
    tags.push(`    <meta name="twitter:card" content="summary_large_image" />`)
    tags.push(`    <meta name="twitter:title" content="${pageTitle}" />`)
    tags.push(`    <meta name="twitter:description" content="${spec.desc}" />`)
    tags.push(`    <meta name="twitter:image" content="${ORIGIN}${spec.ogImage}" />`)
  }
  if (spec.jsonLd && !has(html, /application\/ld\+json/i)) {
    const payload = Object.assign(
      {
        '@context': 'https://schema.org',
        '@id': canonical + '#app'
      },
      spec.jsonLd
    )
    tags.push('    <script type="application/ld+json">' + JSON.stringify(payload, null, 6).split('\n').join('\n    ') + '</script>')
  }
  return tags
}

let changed = 0
const missing = []

for (const [rel, spec] of Object.entries(PAGES)) {
  const file = path.join(ROOT, rel)
  if (!fs.existsSync(file)) {
    console.warn('skip (not found): ' + rel)
    continue
  }
  const html = fs.readFileSync(file, 'utf8')
  const tags = buildTags(spec, html)

  if (!tags.length) {
    console.log('ok       ' + rel)
    continue
  }
  if (CHECK_ONLY) {
    missing.push(rel + ' -> ' + tags.length + ' tag(s) missing')
    continue
  }

  const headClose = html.search(/<\/head>/i)
  if (headClose === -1) {
    console.warn('skip (no </head>): ' + rel)
    continue
  }
  const updated = html.slice(0, headClose) + '\n' + tags.join('\n') + '\n  ' + html.slice(headClose)
  fs.writeFileSync(file, updated, 'utf8')
  changed++
  console.log('updated  ' + rel + '  (+' + tags.length + ' tags)')
}

if (CHECK_ONLY) {
  console.log('\n' + missing.length + ' page(s) with missing metadata:')
  for (const m of missing) console.log('  - ' + m)
} else {
  console.log('\n' + changed + ' page(s) updated.')
}
