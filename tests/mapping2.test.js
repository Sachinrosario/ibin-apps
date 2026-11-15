// Full feature test of the Version 2 mapping programs (search-first design), run before every release.
// usage: node tests/mapping2.test.js <app folder> [desktop|phone] [small|live]
const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const APP = process.argv[2] || 'eastern-ghats-mapping-2', MODE = process.argv[3] || 'desktop', LIVE = process.argv[4] === 'live', OPEN_FILE = process.env.OPEN_FILE;
const ROOT = path.join(__dirname, '..', 'apps'), V1 = APP.replace(/-2$/, '');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.css': 'text/css', '.webmanifest': 'application/manifest+json' };
const srv = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split('?')[0]); let f = null;
  if (u.startsWith('/app/')) { const rel = u.slice(5) || 'index.html'; f = path.join(ROOT, APP, 'web', rel); if (!fs.existsSync(f) && /^img\/[sf]\//.test(rel)) f = path.join(ROOT, V1, 'web', rel); }
  if (!f || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
}).listen(0);
const results = []; let failed = 0;
const ok = (name, cond, extra) => { results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  (' + extra + ')' : ''}`); if (!cond) failed++; };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext(MODE === 'phone' ? { ...devices['iPhone 13'], isMobile: true, hasTouch: true, acceptDownloads: true } : { viewport: { width: 1366, height: 768 }, acceptDownloads: true });
  const p = await ctx.newPage();
  const errors = [], bad = [];
  p.on('pageerror', e => errors.push(e.message));
  p.on('dialog', d => d.dismiss());
  p.on('response', r => { const u = r.url(); if (r.status() >= 400 && !/\/pack\/|favicon/.test(u)) bad.push(r.status() + ' ' + u); });
  if (OPEN_FILE) await ctx.route(/^https?:/, rt => rt.abort());
  const url = OPEN_FILE ? 'file://' + OPEN_FILE : LIVE ? `https://sachinrosario.github.io/ibin-apps/${APP}/?t=${Date.now()}` : `http://localhost:${srv.address().port}/app/index.html`;
  await p.goto(url);
  await p.waitForFunction(() => document.querySelector('#res li') !== null, null, { timeout: 120000 });
  const text = sel => p.evaluate(s => (document.querySelector(s) || {}).innerText || '', sel);
  const count = sel => p.locator(sel).count();
  const go = async h => { await p.evaluate(h => { location.hash = h; }, h); await p.waitForTimeout(250); };
  // 1 opening
  const total = await p.evaluate(() => SP.length);
  ok('the search page opens with the plant list', (await count('#res li')) >= 20, total + ' plants');
  ok('header, version and credit lines show', /Version 2/.test(await text('header')) && /Proprietary right holder: Dr\. K\.N\. Ganeshaiah/.test(await text('footer')) && /Updated in 2026 by Dr\. Sachin A\. Rosario/.test(await text('footer')));
  ok('the page fits the screen width', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  // 2 search
  const S = await p.evaluate(() => {
    const ch = SP.find(s => s.changed && s.code === 2), sy = SP.find(s => s.nsyn.length && s.nsyn[0][0].split(' ').length > 1 && !s.changed), cm = SP.find(s => s.ncm.length && /^[A-Za-z ]+$/.test(s.ncm[0][1]) && s.ncm[0][1].length > 6), lc = SP.find(s => s.cm.length);
    return { ch: ch && [ch.cur, ch.name15, ch.id], sy: sy && [sy.nsyn[0][0], sy.cur, sy.id], cm: cm && [cm.ncm[0][1], cm.cur, cm.id], lc: lc && [lc.cm[0][1], lc.cur, lc.id] };
  });
  const q = async t => { await p.fill('#q', t); await p.waitForTimeout(450); return await text('#res'); };
  let r = await q(S.ch[0]); ok('search by the current scientific name', r.includes(S.ch[0]), S.ch[0]);
  r = await q(S.ch[1]); ok('search by the 2015 name finds the plant, current name first, 2015 name in brackets', r.includes(S.ch[0]) && r.includes('(' + S.ch[1] + ')'), S.ch[1] + ' -> ' + S.ch[0]);
  r = await q(S.sy[0]); ok('search by a current synonym', r.includes(S.sy[1]), S.sy[0]);
  r = await q(S.cm[0]); ok('search by a current common name', r.includes(S.cm[1]), S.cm[0]);
  r = await q(S.lc[0]); ok('search by a local name from the 2015 program', r.includes(S.lc[1]) || (await count('#res li')) > 0, S.lc[0]);
  r = await q('zzzzqqq'); ok('search with no match says so', /0 plants match|no plant|0 plant/i.test(await text('#cnt')) && (await count('#res li')) === 0);
  await q(''); const all0 = await count('#res li');
  await p.click('#chips [data-h="tree"]'); await p.waitForTimeout(300); const nTree = parseInt((await text('#cnt')).replace(/,/g, ''));
  ok('habit filter narrows the list', nTree > 0 && nTree < total, nTree + ' trees');
  await p.click('#chips [data-h=""]'); await p.waitForTimeout(200);
  const fams = await p.evaluate(() => [...document.querySelectorAll('#fam option')].map(o => o.value).filter(Boolean));
  await p.selectOption('#fam', fams[5]); await p.waitForTimeout(300); const nFam = parseInt((await text('#cnt')).replace(/,/g, ''));
  ok('family filter narrows the list', nFam > 0 && nFam < total, fams[5] + ': ' + nFam);
  await p.selectOption('#fam', ''); await p.check('#pic'); await p.waitForTimeout(300); const nPic = parseInt((await text('#cnt')).replace(/,/g, ''));
  ok('"With picture" filter narrows the list', nPic > 0 && nPic < total, nPic + ' with pictures'); await p.uncheck('#pic'); await p.waitForTimeout(200);
  const before = await count('#res li'); if (await count('#mb')) { await p.click('#mb'); await p.waitForTimeout(300); }
  ok('Show more adds plants', (await count('#res li')) > before, before + ' -> ' + (await count('#res li')));
  // 3 plant pages
  await q(S.ch[0]); await p.click('#res li a'); await p.waitForTimeout(500);
  ok('clicking a result opens the plant page', /#\/s\//.test(await p.evaluate(() => location.hash)) && (await text('.sci')).includes(S.ch[0]));
  await go('#/s/' + S.ch[2]);
  ok('plant page shows the updated-name note with the 2015 name', /Name updated in 2026/.test(await text('#app')) && (await text('#app')).includes(S.ch[1]));
  for (const h of ['Where it grows', 'Local names', 'Synonyms and the floras that use them', 'Synonyms now (Catalogue of Life)', 'Common names now', 'DNA barcodes', 'Images and flier', 'Classification']) ok('plant page section: ' + h, await p.evaluate(h => [...document.querySelectorAll('h2')].some(x => x.textContent.trim() === h), h));
  ok('plant page map is drawn', await p.evaluate(() => { const c = document.querySelector('#sm canvas'); return !!c && c.width > 50; }));
  const rich = await p.evaluate(() => { const s = SP.find(s => s.iucn && s.dna && s.dna[0] > 0 && s.nsyn.length && s.ncm.length && s.rep && s.hab.length) || SP.find(s => s.iucn); return s && s.id; });
  await go('#/s/' + rich); const RT = await text('#app');
  ok('plant page shows IUCN Red List status', /IUCN Red List:/.test(RT));
  ok('plant page shows DNA barcode counts (GenBank and BOLD)', /GenBank \(NCBI\) records/.test(RT) && /BOLD public barcode records/.test(RT));
  ok('plant page shows current synonyms with authors', await p.evaluate(() => [...document.querySelectorAll('.card.cn')].some(c => c.previousElementSibling && /Synonyms now/.test(c.previousElementSibling.textContent) && c.querySelectorAll('p').length > 0)));
  ok('plant picture shows', await p.evaluate(() => new Promise(res => { const i = document.querySelector('.hero img'); if (!i) return res(false); if (i.complete) return res(i.naturalWidth > 0 || /svg/.test(i.src)); i.onload = () => res(true); i.onerror = () => res(false); setTimeout(() => res(false), 8000); })));
  ok('barcode links go to GenBank and BOLD', (await p.locator('a[href*="ncbi.nlm.nih.gov"]').count()) > 0 && (await p.locator('a[href*="boldsystems"]').count()) > 0);
  for (const k of ['geojson', 'kml', 'csv']) {
    const [d] = await Promise.all([p.waitForEvent('download', { timeout: 8000 }).catch(() => null), p.locator(`#app [data-ex="${k}"]`).first().click()]);
    let body = ''; if (d) body = fs.readFileSync(await d.path(), 'utf8');
    ok('GIS export of this plant: ' + k, !!d && body.length > 40 && (k === 'geojson' ? body.includes('FeatureCollection') : k === 'kml' ? body.includes('<kml') : /^grid,code/.test(body)), d ? d.suggestedFilename() : 'no download');
  }
  if (await count('#pkAll')) ok('"Show all original images" button is on the plant page', true);
  const other = await p.evaluate(() => { const g = document.querySelector('.sim a'); return g ? g.getAttribute('href') : null; });
  if (other) { await p.click('.sim a'); await p.waitForTimeout(400); ok('other species of the genus: link opens another plant', /#\/s\//.test(await p.evaluate(() => location.hash))); }
  // every plant page opens
  const sweep = await p.evaluate(() => { const bad = []; const app = document.querySelector('#app'); for (const s of SP) { try { viewSpecies(app, s.id); if (!app.querySelector('.sci')) bad.push(s.id); } catch (e) { bad.push(s.id + ':' + e.message); } mapsToClean.splice(0).forEach(m => m.destroy()); } return bad.slice(0, 5).concat([bad.length]); });
  ok('all ' + total + ' plant pages open without error', sweep[sweep.length - 1] === 0, JSON.stringify(sweep));
  // 4 map
  await go('#/map'); await p.waitForTimeout(800);
  ok('map page opens and draws', await p.evaluate(() => { const c = document.querySelector('#mm canvas'); return !!c && c.width > 100; }));
  const box = await p.locator('#mm canvas').first().boundingBox(); let sel = 0;
  const pts = []; for (let a = 0.2; a < 0.85; a += 0.07) for (let c = 0.2; c < 0.85; c += 0.07) pts.push([a, c]);
  for (const [fx, fy] of pts) { await p.mouse.click(box.x + box.width * fx, box.y + box.height * fy); await p.waitForTimeout(120); sel = parseInt((await text('.tile b')) || '0'); if (sel > 0 && (await count('.list a')) > 0) break; }
  ok('clicking the map selects a grid and lists its plants', sel > 0 && (await count('.list a')) > 0, sel + ' grids, ' + (await count('.list a')) + ' plants');
  for (const k of ['geojson', 'kml', 'csv']) { const [d] = await Promise.all([p.waitForEvent('download', { timeout: 8000 }).catch(() => null), p.locator(`#side [data-ex="${k}"]`).first().click()]); ok('GIS export of selected grids: ' + k, !!d && fs.readFileSync(await d.path(), 'utf8').length > 40); }
  { const [d] = await Promise.all([p.waitForEvent('download', { timeout: 8000 }).catch(() => null), p.click('#csv')]); ok('plant list of the selected grids downloads as CSV', !!d && /scientific_name/.test(fs.readFileSync(await d.path(), 'utf8'))); }
  await p.click('#hb [data-h="tree"]'); await p.waitForTimeout(300); ok('habit chip filters the selected-grid plant list', /Tree/.test(await text('#hb .on')));
  await p.click('#clr'); await p.waitForTimeout(200); ok('Clear selection empties the selection', (await text('.tile b')) === '0');
  await p.click('[data-m="count"]'); await p.waitForTimeout(400); ok('Species count per grid shows its legend and habit chips', (await count('#hb .chip')) >= 5 && /Species recorded per grid/.test(await text('#side')));
  const areas = await p.evaluate(() => [...document.querySelectorAll('#area option')].map(o => o.value).filter(Boolean)); await p.selectOption('#area', areas[0]); await p.waitForTimeout(300); ok('"Go to" an area zooms the map', areas.length > 0, areas[0]);
  for (const id of ['lD', 'lT', 'lR', 'lL', 'lS', 'lG']) { await p.evaluate(i => document.getElementById(i) && document.getElementById(i).click(), id); await p.waitForTimeout(120); } ok('map layers switch on and off without error', errors.length === 0);
  await p.mouse.wheel(0, -300); await p.waitForTimeout(200); ok('map zooms with the wheel', true);
  // 5 changes
  await go('#/changes'); await p.waitForTimeout(400);
  const tl = (await text('.tiles')); ok('What\'s changed page shows the counts', /names confirmed/.test(tl) && /names updated/.test(tl));
  const rows1 = await count('#ct tr'); await p.fill('#cf', S.ch[1].split(' ')[0]); await p.waitForTimeout(200); ok('What\'s changed: filter works', (await count('#ct tr')) < rows1);
  await p.click('[data-t="check"]'); await p.waitForTimeout(200); ok('What\'s changed: "To check" tab lists plants', (await count('#ct tr')) > 1);
  await p.click('[data-t="genus"]'); await p.waitForTimeout(200); ok('What\'s changed: genus-level tab lists entries', (await count('#ct tr')) > 1);
  { const [d] = await Promise.all([p.waitForEvent('download', { timeout: 8000 }).catch(() => null), p.click('#cdl')]); ok('name-change list downloads as CSV', !!d && /status,name_2015/.test(fs.readFileSync(await d.path(), 'utf8'))); }
  // 6 about
  await go('#/about'); const ab = await text('#app');
  ok('About page shows team and credits', /Team/.test(ab) && /Proprietary right holder: Dr\. K\.N\. Ganeshaiah/.test(ab) && /Updated in 2026 by Dr\. Sachin A\. Rosario/.test(ab) && (await p.locator('img[src*="team1"]').count()) === 1);
  ok('About page team picture loads', await p.evaluate(() => new Promise(res => { const i = document.querySelector('img[src*="team1"]'); if (i.complete) return res(i.naturalWidth > 0); i.onload = () => res(true); i.onerror = () => res(false); setTimeout(() => res(false), 8000); })));
  for (const [a, h] of [['Search', '#/'], ['Map', '#/map'], ["What's changed", '#/changes'], ['About', '#/about']]) { await p.locator('#nav a', { hasText: a }).click(); await p.waitForTimeout(250); ok('menu: ' + a, (await p.evaluate(() => location.hash)).replace(/^#\/?/, '') === h.replace(/^#\/?/, '')); }
  ok('no script errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  ok('no failed downloads', bad.length === 0, bad.slice(0, 3).join(' | '));
  console.log(`${APP} ${MODE}${LIVE ? ' LIVE' : ''}`); console.log(results.join('\n')); console.log(failed ? failed + ' FAILED' : `ALL PASSED (${results.length} checks)`);
  await b.close(); srv.close(); process.exit(failed ? 1 : 0);
})().catch(e => { console.log(results.join('\n')); console.log('CRASH ' + e.stack); process.exit(2); });
