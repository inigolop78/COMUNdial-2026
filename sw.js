// v1781438296
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  // Always fetch from network, never cache
  e.respondWith(fetch(e.request.url + (e.request.url.includes('?') ? '&' : '?') + '_=1781438296'));
});
