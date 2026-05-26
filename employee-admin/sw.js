const CACHE_NAME = 'employee-admin-v12';
const APP_SHELL = [
  '/employee-admin/attendance.html',
  '/employee-admin/index.html',
  '/employee-admin/staff.html',
  '/employee-admin/salary.html',
  '/employee-admin/reports.html',
  '/employee-admin/settings.html',
  '/employee-admin/manifest.webmanifest',
  '/employee-admin/style.min.css?v=20260526-3',
  '/employee-admin/assets/fonts/mulish/Mulish-400.ttf',
  '/employee-admin/assets/fonts/mulish/Mulish-500.ttf',
  '/employee-admin/assets/fonts/mulish/Mulish-600.ttf',
  '/employee-admin/assets/fonts/mulish/Mulish-700.ttf',
  '/employee-admin/assets/fontawesome/css/all.min.css',
  '/employee-admin/assets/fontawesome/webfonts/fa-solid-900.woff2',
  '/employee-admin/assets/fontawesome/webfonts/fa-regular-400.woff2',
  '/employee-admin/assets/fontawesome/webfonts/fa-brands-400.woff2',
  '/employee-admin/env.js?v=20260427-1',
  '/employee-admin/js/min/storage.js?v=20260525-3',
  '/employee-admin/js/min/api.js?v=20260526-3',
  '/employee-admin/js/min/theme.js?v=20260313-1',
  '/employee-admin/js/min/auth.js?v=20260525-11',
  '/employee-admin/js/min/main.js?v=20260525-13',
  '/public/images/pwa-icon.png'
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
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith('employee-admin-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;
  if (
    url.pathname.startsWith('/api/')
    || url.pathname.startsWith('/employee-api/')
    || url.pathname.startsWith('/index.php/api/')
    || url.search.includes('route=/api/')
  ) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request).then((cached) => {
        if (cached) return cached;
        if (request.mode === 'navigate') {
          return caches.match('/employee-admin/attendance.html');
        }
        return null;
      }))
  );
});
