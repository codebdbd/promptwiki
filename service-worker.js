const CACHE_NAME = 'prompt-dictionary-v4';
const ASSETS_TO_CACHE = [
  'index.html',
  'prompt_engineering_dictionary.html',
  'styles.css',
  'app.js',
  'terms-data.js',
  'manifest.webmanifest',
  'favicon.svg',
  'img/dark.svg',
  'img/light.svg',
  'img/info.svg',
  'img/logo_dark.svg',
  'img/logo_light.svg'
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
