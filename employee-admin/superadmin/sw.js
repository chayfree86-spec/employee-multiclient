const CACHE_NAME = 'employee-superadmin-v4';
const APP_SHELL = [
  '/employee-admin/superadmin/index.html',
  '/employee-admin/superadmin/manifest.webmanifest',
  '/employee-admin/assets/fonts/mulish/Mulish-400.ttf',
  '/employee-admin/assets/fonts/mulish/Mulish-500.ttf',
  '/employee-admin/assets/fonts/mulish/Mulish-600.ttf',
  '/employee-admin/assets/fonts/mulish/Mulish-700.ttf',
  '/public/images/logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.method !== 'GET') return;
  if (new URL(request.url).pathname.startsWith('/api/')) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match('/employee-admin/superadmin/index.html')))
  );
});
