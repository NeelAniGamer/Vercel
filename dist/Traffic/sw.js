/* Traffic Hero Service Worker — offline caching
 * Strategy:
 *   - App shell + assets: cache-first (they're versioned by Vite hashes)
 *   - Navigation requests: network-first, fall back to cached index.html (offline play)
 *   - Models/textures: cache-first with runtime caching (large, immutable)
 */

const CACHE_NAME = 'traffic-cache-v1';
const RUNTIME_CACHE = 'traffic-runtime-v1';

// Precached at install (app shell)
const PRECACHE_URLS = [
  '/',
  '/index.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME && k !== RUNTIME_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Skip cross-origin requests we can't control (CDN fonts etc. use browser cache)
  if (url.origin !== self.location.origin) return;

  // Navigation: network-first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy));
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Hashed build assets + models + textures: cache-first with runtime fill
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok || response.type === 'opaque') {
          const isAsset =
            url.pathname.startsWith('/assets/') ||
            url.pathname.startsWith('/Models/') ||
            url.pathname.startsWith('/textures/');
          if (isAsset) {
            const copy = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          }
        }
        return response;
      });
    })
  );
});