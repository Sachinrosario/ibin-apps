// Offline support: keeps the app, data and every picture or recitation that has been opened.
const CACHE = 'vrk3-v1';
const CORE = ['./', 'index.html', 'data/media-base.js', 'data/vrk3.js', 'data/map.js', 'manifest.webmanifest', 'img/ui/icon.png',
  'fonts/arimo-latin-400-normal.woff2', 'fonts/arimo-latin-700-normal.woff2', 'fonts/tinos-latin-400-normal.woff2', 'fonts/noto-sans-devanagari-400.woff2', 'fonts/noto-sans-devanagari-700.woff2', 'fonts/noto-sans-kannada-400.woff2'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())));
// All IBIN apps share one website, so only this app's own older copies are removed (never another app's offline copy).
const PREFIX = CACHE.replace(/-v\d+$/, '-v');
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k.startsWith(PREFIX)).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.includes('__alive') || e.request.headers.has('range')) return;
  e.respondWith(caches.match(e.request).then(hit => {
    const net = fetch(e.request).then(r => { if (r.ok) caches.open(CACHE).then(c => c.put(e.request, r.clone())); return r; }).catch(() => hit);
    return hit && /\.(webp|png|jpg|woff2|mp3)$/.test(u.pathname) ? hit : net.then(r => r || hit);
  }));
});
