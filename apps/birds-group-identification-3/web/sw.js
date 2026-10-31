// Offline support: keeps the app, data and every picture that has been viewed.
const CACHE = 'bi3-v1';
const CORE = ['./', 'index.html', 'model.js', 'data/birds3.js', 'data/accuracy.js', 'manifest.webmanifest', 'img/ui/icon.png',
  'fonts/kalam-latin-700-normal.woff2', 'fonts/atkinson-hyperlegible-latin-400-normal.woff2', 'fonts/atkinson-hyperlegible-latin-700-normal.woff2', 'fonts/atkinson-hyperlegible-latin-400-italic.woff2'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())));
// All IBIN apps share one website, so only this app's own older copies are removed (never another app's offline copy).
const PREFIX = CACHE.replace(/-v\d+$/, '-v');
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k.startsWith(PREFIX)).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.includes('__alive')) return;
  e.respondWith(caches.match(e.request).then(hit => {
    const net = fetch(e.request).then(r => { if (r.ok) caches.open(CACHE).then(c => c.put(e.request, r.clone())); return r; }).catch(() => hit);
    return hit && /\.(webp|png|svg|jpg|woff2)$/.test(u.pathname) ? hit : net.then(r => r || hit);
  }));
});
