const CACHE_NAME = 'col-cache-v10'
const SW_VERSION = '2026-09-25'
const OFFLINE_FALLBACK = '/home.html'
const urlsToCache = [
  '/home.html',
  '/col-ui.css',
  '/col-mobile.css',
  '/Traffic/traffic-mobile.css',
  '/col-ui.js',
  '/col-router.js',
  '/col-auth.js',
  '/Icon.png'
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

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME)
      const cached = await cache.match(request)
      const networkPromise = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.ok && networkResponse.type === 'basic') {
          event.waitUntil(cache.put(request, networkResponse.clone()))
        }
        return networkResponse
      })

      event.waitUntil(networkPromise.then(() => undefined).catch(() => undefined))

      if (cached) {return cached}

      try {
        return await networkPromise
      } catch (error) {
        if (request.mode === 'navigate') {
          const fallback = await cache.match(OFFLINE_FALLBACK)
          if (fallback) {return fallback}
        }
        return new Response('Offline', {
          status: 503,
          statusText: 'Offline',
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        })
      }
    })()
  )
})
