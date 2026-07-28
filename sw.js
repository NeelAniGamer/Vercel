const CACHE_NAME = 'col-cache-v3'
const urlsToCache = ['/', '/col-ui.css', '/col-ui.js', '/col-router.js', '/col-auth.js', '/Icon.png']

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
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache)
            })
          }
          return networkResponse
        })
        .catch(() => {
          // Network failed — fallback to cached response or offline page
          return caches.match('/')
        })

      return cachedResponse || fetchPromise
    })
  )
})
