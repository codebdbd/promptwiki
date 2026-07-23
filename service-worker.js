const CACHE_NAME = 'prompt-dictionary-v6';
const ASSETS_TO_CACHE = [
  'index.html',
  'css/styles.css',
  'js/app.js',
  'js/terms-data.js',
  'manifest.webmanifest',
  'assets/icons/favicon.svg',
  'assets/img/dark.svg',
  'assets/img/light.svg',
  'assets/img/info.svg',
  'assets/img/logo_dark.svg',
  'assets/img/logo_light.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
