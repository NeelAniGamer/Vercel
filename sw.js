const CACHE_NAME = 'col-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/col-ui.css',
  '/col-ui.js',
  '/col-router.js',
  '/col-auth.js',
  '/icon.webp'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
