// Full feature test of Andaman Mapping 2, run before every release.
// usage: node tests/andaman-mapping-2.test.js <app folder> [desktop|phone] [small|live]
const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const APP = process.argv[2] || 'andaman-mapping-2', MODE = process.argv[3] || 'desktop', LIVE = process.argv[4] === 'live';
const ROOT = path.join(__dirname, '..', 'apps');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.webmanifest': 'application/manifest+json' };
const srv = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split('?')[0]); let f = null;
  if (u.startsWith('/app/')) f = path.join(ROOT, APP, 'web', u.slice(5) || 'index.html');
  // like the website, the species pictures come from Version 1's folder (img/SHARED_MEDIA_FROM)
  if (f && !fs.existsSync(f) && /\/img\/(s|f)\//.test(f)) f = f.replace(APP, 'andaman-mapping');
  if (!f || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
}).listen(0);
const results = []; let failed = 0;
const ok = (name, cond, extra) => { if (process.env.V) console.log((cond?"PASS ":"FAIL ")+name); results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  (' + extra + ')' : ''}`); if (!cond) failed++; };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext(MODE === 'phone' ? { ...devices['iPhone 13'], isMobile: true, hasTouch: true, acceptDownloads: true } : { viewport: { width: 1366, height: 768 }, acceptDownloads: true });
  const p = await ctx.newPage();
  const errors = [], bad = [];
  p.on('pageerror', e => errors.push(e.message));
  p.on('dialog', d => d.dismiss());
  p.on('response', r => { const u = r.url(); if (r.status() >= 400 && !/\/pack\/|__alive/.test(u)) bad.push(r.status() + ' ' + u); });
  const base = LIVE ? `https://sachinrosario.github.io/ibin-apps/${APP}/` : `http://localhost:${srv.address().port}/app/index.html`;
  const go = async h => { await p.evaluate(h => { location.hash = h; }, h); await p.waitForTimeout(300); };
  const text = async s => (await p.locator(s).first().innerText()).trim();
  const count = s => p.locator(s).count();
  try {
    await p.goto(base + (LIVE ? '?t=' + Date.now() : ''));
    await p.waitForFunction(() => window.AM_CORE && window.AM_MAP && typeof SP !== 'undefined', null, { timeout: 120000 });
    await p.waitForTimeout(800);
    const total = await p.evaluate(() => SP.length);
    ok('the search page opens with the plant list', (await count('#res li')) >= 20, total + ' plants');
    ok('header, version and credit lines show', /Proprietary right holder: Dr\. K\.N\. Ganeshaiah/.test(await text('footer')) && /Updated in 2026 by Dr\. Sachin A\. Rosario/.test(await text('footer')) && /Andaman Mapping/.test(await p.title()));
    ok('the page fits the screen width', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    // search
    const S = await p.evaluate(() => { const ch = SP.find(s => s.changed && s.code === 2), sy = SP.find(s => s.syn.length), cm = SP.find(s => s.cm.length); return { ch: [ch.cur, ch.name15], sy: sy.syn[0][0], cm: cm.cm[0][1] }; });
    const q = async t => { await p.fill('#q', t); await p.waitForTimeout(450); return count('#res li'); };
    ok('search by the current scientific name', (await q('Terminalia')) > 0);
    ok('search by the 2015 name finds the updated plant', (await q(S.ch[1])) > 0 && /\(/.test(await text('#res li')), S.ch[1] + ' -> ' + S.ch[0]);
    ok('search by a synonym', (await q(S.sy)) > 0, S.sy);
    ok('search by a local name', (await q(S.cm)) > 0, S.cm);
    ok('search by family', (await q('Papilionaceae')) > 0);
    ok('search with no match shows no plants', (await q('zzzqqq')) === 0);
    await q('');
    for (const h of ['tree', 'herb', 'shrub', 'epiphyte', 'regeneration']) { await p.click(`#chips [data-h="${h}"]`); await p.waitForTimeout(250); const n = +(await text('#cnt')).replace(/[^\d]/g, ''); ok('habit filter: ' + h, n > 0 && n < total, n + ''); }
    await p.click('#chips [data-h=""]');
    await p.selectOption('#fam', { index: 5 }); await p.waitForTimeout(250);
    ok('family filter narrows the list', +(await text('#cnt')).replace(/[^\d]/g, '') < total);
    await p.selectOption('#fam', { index: 0 });
    await p.check('#pic'); await p.waitForTimeout(250);
    ok('"With picture" filter narrows the list', +(await text('#cnt')).replace(/[^\d]/g, '') < total);
    await p.uncheck('#pic'); await p.waitForTimeout(250);
    const n0 = await count('#res li'); await p.click('#mb'); await p.waitForTimeout(250);
    ok('Show more adds plants', (await count('#res li')) > n0, n0 + ' -> ' + (await count('#res li')));
    // plant pages
    await q(''); await p.locator('#res li a').first().click(); await p.waitForTimeout(800);
    ok('clicking a result opens the plant page', /#\/s\//.test(p.url()));
    ok('plant page shows the map', (await count('#sm')) > 0);
    for (const t of ['GeoJSON', 'KML', 'CSV']) { const [d] = await Promise.all([p.waitForEvent('download', { timeout: 8000 }).catch(() => null), p.getByRole('button', { name: t }).first().click()]); ok('GIS export of a plant: ' + t, !!d, d && d.suggestedFilename()); }
    await go('#/s/31115'); await p.waitForTimeout(500);
    ok('the "show all original images" button is on a plant page that has pictures', (await count('#pkAll')) > 0);
    const ids = await p.evaluate(() => SP.map(s => s.id)); let fail = [];
    for (const id of ids.filter((_, i) => i % 4 === 0)) { await p.evaluate(id => { location.hash = '#/s/' + id; }, id); await p.waitForTimeout(30); if (!(await p.evaluate(() => document.querySelector('#app').innerText.length > 150))) fail.push(id); }
    ok('every 4th of the ' + ids.length + ' plant pages opens', !fail.length, fail.slice(0, 5).join(','));
    // map
    await go('#/map'); await p.waitForTimeout(1200);
    ok('the map page opens', (await count('#mm')) > 0);
    const areas = await p.locator('#area option').allInnerTexts();
    ok('island names in the "Go to" list are written in full', !areas.some(a => /^(Barren hot spri|Batti Maly|East I|Spike I|Paget I|Reef I|West I|Land fall|Interview|Neil)$/.test(a)), areas.length + ' areas');
    await p.selectOption('#area', 'Interview'); await p.waitForTimeout(800);
    const box = await p.locator('#mm').boundingBox(); let sel = 0;
    for (const [x, y] of [[.5, .5], [.45, .5], [.55, .5], [.5, .45], [.5, .55], [.4, .4], [.6, .6]]) { await p.mouse.click(box.x + box.width * x, box.y + box.height * y); await p.waitForTimeout(250); sel = +((await text('#side')).match(/(\d+)\s*\n?\s*grids? selected/) || [0, 0])[1]; if (sel) break; }
    ok('clicking the map selects grids and lists plants', sel > 0 && /species/.test(await text('#side')), sel + ' grids');
    const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 8000 }).catch(() => null), p.click('#csv')]);
    ok('CSV export of the selected grids', !!dl && /\.csv$/.test(dl.suggestedFilename()));
    await p.click('#clr'); await p.waitForTimeout(250);
    ok('Clear selection empties the selection', /0\s*\n?\s*grids selected/.test(await text('#side')));
    // other pages
    await go('#/changes'); ok('"What\'s changed" page opens with the lists', (await text('#app')).length > 3000);
    await go('#/about'); ok('About page opens', /Ganeshaiah/.test(await text('#app')));
    ok('no page errors', !errors.length, errors.slice(0, 2).join(' | '));
    ok('no failed downloads', !bad.length, bad.slice(0, 3).join(' | '));
  } catch (e) { results.push('CRASH ' + e.message.split('\n')[0]); failed++; }
  console.log(results.join('\n')); console.log(failed ? `\n${failed} FAILED` : `\nALL PASSED (${results.length} checks)`);
  await b.close(); srv.close(); process.exit(failed ? 1 : 0);
})();
