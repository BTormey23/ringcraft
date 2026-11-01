/* RingCraft service worker — network-first so app updates arrive immediately;
   cached copies serve only when offline. Cross-origin requests (GitHub API,
   raw.githubusercontent, Google Fonts) are never intercepted. */
const CACHE = 'ringcraft-v16';
const SHELL = ['./', './index.html', './app.html', './rider.html', './manifest.webmanifest', './app.webmanifest', './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.allSettled(SHELL.map(u => c.add(u)))).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  const key = url.pathname; // normalize: cache-busting queries map to one entry
  e.respondWith(
    fetch(e.request).then(r => {
      if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(key, copy)).catch(() => {}); }
      return r;
    }).catch(() => caches.match(key).then(hit => hit || Promise.reject(new Error('offline, uncached'))))
  );
});
