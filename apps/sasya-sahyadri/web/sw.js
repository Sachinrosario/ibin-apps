// Offline support: keeps the app, data and every picture that has been viewed.
const CACHE = 'ssy1-v1';
const CORE = ['./', 'index.html', 'data/ssy.js', 'data/ssymap.js', 'manifest.webmanifest', 'img/ui/icon.png'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.includes('__alive')) return;
  e.respondWith(caches.match(e.request).then(hit => {
    const net = fetch(e.request).then(r => { if (r.ok) caches.open(CACHE).then(c => c.put(e.request, r.clone())); return r; }).catch(() => hit);
    return hit && /\.(webp|png|jpg|woff2)$/.test(u.pathname) ? hit : net.then(r => r || hit);
  }));
});
