const CACHE_NAME = 'col-cache-v8'
const SW_VERSION = '2026-09-19'
const urlsToCache = ['/home.html', '/col-ui.css', '/col-mobile.css', '/Traffic/traffic-mobile.css', '/col-ui.js', '/col-router.js', '/col-auth.js', '/Icon.png']

async function cacheResources() {
  const cache = await caches.open(CACHE_NAME)
  const results = await Promise.allSettled(
    urlsToCache.map(async (url) => {
      try {
        // Use no-cors for cross-origin resources that may fail opaque fetch
        const fetchOpts = { cache: 'no-cache' }
        if (url.startsWith('http')) fetchOpts.mode = 'no-cors'
        const response = await fetch(url, fetchOpts).catch(function(err) {
          // fetch() itself rejected (network error, not HTTP error)
          return { url: url, success: false, error: err.message, _fetchFailed: true }
        })
        // If fetch rejected above, skip
        if (response._fetchFailed) {
          console.warn('[SW] Network error caching ' + url + ': ' + response.error)
          return response
        }
        if (!response.ok) throw new Error('HTTP ' + response.status + ': ' + url)
        await cache.put(url, response)
        return { url, success: true }
      } catch (err) {
        console.warn('[SW] Failed to cache ' + url + ': ' + err.message)
        return { url, success: false, error: err.message }
      }
    })
  )
  const failed = results.filter((r) => r.status === 'fulfilled' && !r.value.success)
  if (failed.length > 0) {
    console.warn('[SW] ' + failed.length + ' resource(s) failed to cache (SW still activates)')
  }
}

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(cacheResources())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)))
    })
  )
  self.clients.claim()
  console.log('[SW] Activated version ' + SW_VERSION + ' (cache ' + CACHE_NAME + ')')
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  // Non-GET or cross-origin: pass through untouched
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return
  // Range requests (audio/video seeking) must not be intercepted
  if (req.headers.has('range')) return

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(req)
      const fetchPromise = fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            // Response is consumed by cache.put() -> respond with a clone
            cache.put(req, networkResponse.clone())
          }
          return networkResponse
        })
        .catch(() => cached || caches.match('/home.html'))

      // Stale-while-revalidate: instant cached response, network updates in background
      return cached || fetchPromise
    })
  )
})
