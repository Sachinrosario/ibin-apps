// Basic check for apps that have no full feature test yet: the opening screen shows (computer and phone screens), with no script errors.
// usage: node tests/smoke.test.js <app folder> [desktop|phone] [small|live]
const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const APP = process.argv[2], MODE = process.argv[3] || 'desktop', LIVE = process.argv[4] === 'live';
const ROOT = path.join(__dirname, '..', 'apps', APP, 'web');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.css': 'text/css', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
const srv = http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]).slice(1) || 'index.html'); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }).listen(0);
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext(MODE === 'phone' ? { ...devices['iPhone 13'] } : { viewport: { width: 1366, height: 768 } }); const p = await ctx.newPage();
  const errors = []; p.on('pageerror', e => errors.push(e.message)); p.on('dialog', d => d.dismiss());
  await p.goto(LIVE ? `https://sachinrosario.github.io/ibin-apps/${APP}/?t=${Date.now()}` : `http://localhost:${srv.address().port}/index.html`); await p.waitForTimeout(5000);
  const shot = await p.screenshot(); const { PNG } = require('pngjs'); const im = PNG.sync.read(shot); let lit = 0, n = 0; for (let i = 0; i < im.data.length; i += 64) { n++; if (im.data[i] + im.data[i + 1] + im.data[i + 2] > 40) lit++; }
  const iw = await p.evaluate(() => innerWidth), vw = await p.evaluate(() => document.documentElement.clientWidth);
  const res = [[`the opening screen shows (${Math.round(100 * lit / n)}% of the screen is drawn)`, lit / n > 0.25], ['the page fits the screen width', iw <= vw + 1], ['no script errors', errors.length === 0, errors.slice(0, 3).join(' | ')]];
  let bad = 0; console.log(`${APP} ${MODE}${LIVE ? ' LIVE' : ''}`); for (const [t, ok, x] of res) { console.log(`${ok ? 'PASS' : 'FAIL'}  ${t}${x ? '  (' + x + ')' : ''}`); if (!ok) bad++; }
  console.log(bad ? bad + ' FAILED' : 'ALL PASSED'); await b.close(); srv.close(); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('CRASH ' + e.stack); process.exit(2); });
