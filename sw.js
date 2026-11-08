const CACHE_NAME = 'col-cache-v15'
const SW_VERSION = '2026-11-06-v4'
const OFFLINE_FALLBACK = '/home'
const urlsToCache = [
  '/home',
  '/col-ui.css',
  '/col-mobile.css',
  '/mobile-perf.css',
  '/liquid-glass.css',
  '/Traffic/traffic-mobile.css',
  '/col-ui.js',
  '/col-router.js',
  '/col-auth.js',
  '/Icon.png',
  '/bmc-button.svg'
]

const cacheableDestinations = new Set([
  'document',
  'script',
  'style',
  'image',
  'font',
  'manifest',
  'worker',
  'audio',
  'video',
  'track',
  'iframe'
])

function isPrivateOrDynamicPath(pathname) {
  return (
    pathname === '/config.json' ||
    pathname === '/q' ||
    pathname === '/q.html' ||
    pathname.endsWith('/config.json') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_vercel/') ||
    pathname.startsWith('/auth/') ||
    pathname.includes('/rest/v1/')
  )
}

function shouldHandleRequest(request) {
  if (request.method !== 'GET') {return false}
  if (request.headers.has('range')) {return false}

  const url = new URL(request.url)
  // Never intercept local dev — including the Python prod server on :8585,
  // LAN IPs, IPv6 loopback, and file:// so dev never gets the prod SW.
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '::1' || url.protocol === 'file:') { return false }
  if (url.port === '3000' || url.port === '5173' || url.port === '8585') { return false }
  if (/^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(url.hostname)) { return false }
  if (url.origin !== self.location.origin) {return false}
  if (isPrivateOrDynamicPath(url.pathname)) {return false}

  return request.mode === 'navigate' || cacheableDestinations.has(request.destination)
}

async function cacheResources() {
  const cache = await caches.open(CACHE_NAME)
  const results = await Promise.allSettled(
    urlsToCache.map(async (url) => {
      try {
        const response = await fetch(url, { cache: 'no-cache' })
        if (!response.ok) {throw new Error('HTTP ' + response.status + ': ' + url)}
        await cache.put(url, response)
        return { url, success: true }
      } catch (err) {
        console.warn('[SW] Failed to cache ' + url + ': ' + err.message)
        return { url, success: false, error: err.message }
      }
    })
  )

  const failed = results.filter((result) => result.status === 'fulfilled' && !result.value.success)
  if (failed.length > 0) {
    console.warn('[SW] ' + failed.length + ' resource(s) failed to cache (SW still activates)')
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(cacheResources().then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => Promise.all(cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))))
      .then(() => self.clients.claim())
  )
  console.log('[SW] Activated version ' + SW_VERSION + ' (cache ' + CACHE_NAME + ')')
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (!shouldHandleRequest(request)) {return}

  // Start network work synchronously so background revalidation can be
  // registered with waitUntil during dispatch (not inside the async body,
  // where it throws "extended lifetime not supported").
  const networkPromise = fetch(request).catch((e) => { throw e; });
  event.waitUntil(networkPromise.then(() => undefined).catch(() => undefined));

  // Stale-while-revalidate: serve cache immediately when present so
  // ?v= cache-busters (e.g. col-ui.css?v=…) never 404 offline.
  const cachedPromise = caches.open(CACHE_NAME).then((cache) => cache.match(request, { ignoreSearch: true }));

  event.respondWith(
    (async () => {
      const [cache, cached, networkResult] = await Promise.all([
        caches.open(CACHE_NAME),
        cachedPromise,
        networkPromise.then((r) => ({ ok: true, r }), (e) => ({ ok: false, e }))
      ]);

      // Network-first for core scripts and navigation to ensure deployments are live immediately
      const isCoreUpdate = request.mode === 'navigate' || request.url.includes('col-ui.js') || request.url.includes('col-ui.css') || request.url.includes('col-auth.js') || request.url.includes('bmc-button.svg') || request.url.includes('qr-dynamic.js');
      if (isCoreUpdate && networkResult.ok && networkResult.r && networkResult.r.ok && networkResult.r.type === 'basic') {
        // Clone before consume — Put needs its own copy.
        await cache.put(request, networkResult.r.clone());
        return networkResult.r;
      }
      if (cached) {
        if (networkResult.ok && networkResult.r && networkResult.r.ok && networkResult.r.type === 'basic') {
          await cache.put(request, networkResult.r.clone());
        }
        return cached;
      }
      if (networkResult.ok) return networkResult.r;
      if (request.mode === 'navigate') {
        const fallback = await cache.match(OFFLINE_FALLBACK, { ignoreSearch: true }) || await cache.match('/home.html', { ignoreSearch: true });
        if (fallback) return fallback;
      }
      return new Response('Offline', {
        status: 503,
        statusText: 'Offline',
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    })()
  )
})
