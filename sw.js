// KILL ALL CACHES
self.addEventListener('install', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
    .then(() => self.skipWaiting())
  );
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
    .then(() => self.registration.unregister())
    .then(() => self.clients.matchAll()).then(clients => {
      clients.forEach(client => client.navigate(client.url));
    })
  );
});
self.addEventListener('fetch', e => {
  e.respondWith(fetch(e.request, {cache: 'no-store'}));
});
