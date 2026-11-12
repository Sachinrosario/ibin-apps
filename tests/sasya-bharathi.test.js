// Full feature test of Sasya Bharathi (Version 1 and 2), run before every release.
// usage: node tests/sasya-bharathi.test.js <app folder: sasya-bharathi | sasya-bharathi-2> [desktop|phone] [small]
//   small = test like the small installers: the plant records and pictures are not in the folder and must come from the web copy.
const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const APP = process.argv[2] || 'sasya-bharathi', MODE = process.argv[3] || 'desktop', SMALL = process.argv[4] === 'small', LIVE = process.argv[4] === 'live';
// live = test the published IBIN web pages themselves (https://sachinrosario.github.io/ibin-apps/<app>/)
const ROOT = path.join(__dirname, '..', 'apps');
const V1 = path.join(ROOT, 'sasya-bharathi', 'web');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.csv': 'text/csv' };
const REMOTE_PREFIXES = ['data/d/', 'data/g/', 'img/photos/'];
// local server: /app/... is the app folder; in "small" mode (and always for Version 2) the large folders are missing there
const srv = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split('?')[0]); let f;
  if (u.startsWith('/remote/')) f = path.join(V1, u.slice(8));
  else if (u.startsWith('/app/')) { const rel = u.slice(5) || 'index.html'; if (SMALL && REMOTE_PREFIXES.some(p => rel.startsWith(p))) f = null; else f = path.join(ROOT, APP, 'web', rel); }
  if (!f || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
}).listen(0);
const PORT = () => srv.address().port;
const results = []; let failed = 0;
const ok = (name, cond, extra) => { results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  (' + extra + ')' : ''}`); if (!cond) failed++; };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext(MODE === 'phone' ? { ...devices['iPhone 13'], isMobile: true, hasTouch: true } : { viewport: { width: 1366, height: 768 } });
  const p = await ctx.newPage();
  const errors = [], dialogs = [], bad = [];
  p.on('pageerror', e => errors.push(e.message));
  p.on('dialog', d => { dialogs.push(d.message()); d.dismiss(); });
  p.on('response', r => { const u = r.url(); if (r.status() >= 400 && !(u.includes('/app/') && REMOTE_PREFIXES.some(x => u.includes('/app/' + x)))) bad.push(r.status() + ' ' + u); });
  // the IBIN web copy of Version 1 (where the small installers and Version 2 fetch plant records and pictures) is served from the local Version 1 folder
  const remoteHits = []; if (!LIVE) await p.route('https://sachinrosario.github.io/ibin-apps/sasya-bharathi/**', rt => { const rel = decodeURIComponent(rt.request().url().split('/ibin-apps/sasya-bharathi/')[1].split('?')[0]); const f = path.join(V1, rel); remoteHits.push(rel);
    if (fs.existsSync(f)) rt.fulfill({ path: f, contentType: MIME[path.extname(f)] }); else rt.fulfill({ status: 404, body: '' }); });
  await p.goto(LIVE ? `https://sachinrosario.github.io/ibin-apps/${APP}/?t=${Date.now()}` : `http://localhost:${PORT()}/app/index.html`);
  await p.waitForFunction(() => window.SB && SB.sp && BYID && document.getElementById('busy').style.display === 'none', null, { timeout: 90000 });
  // stage coordinates -> screen coordinates (the stage is scaled to the window)
  const S = await p.evaluate(() => { const r = document.getElementById('stage').getBoundingClientRect(); return { x: r.left, y: r.top, k: r.width / 1366 }; });
  const tap = async (x, y) => { const X = S.x + x * S.k, Y = S.y + y * S.k; if (MODE === 'phone') await p.touchscreen.tap(X, Y); else await p.mouse.click(X, Y); await p.waitForTimeout(150); };
  const idle = () => p.waitForFunction(() => document.getElementById('busy').style.display === 'none', null, { timeout: 60000 });
  const cur = () => p.evaluate(() => CUR);
  const txt = sel => p.evaluate(s => { const e = document.querySelector(s); return e ? e.textContent.trim() : null; }, sel);
  const V2 = await p.evaluate(() => VERSION.startsWith('2'));
  // a visible list row inside a list box at stage position; returns its text
  const pickRow = async (boxSel, i = 0) => { const [scr, k] = boxSel.split('@'); const r = await p.evaluate(([s, k, i]) => { const b = document.querySelectorAll(s + ' .lb')[+k || 0]; if (b) { b.scrollTop = Math.max(0, i * 15 - 30); b.dispatchEvent(new Event('scroll')); } const row = b && b.querySelector(`.row[data-i="${i}"]`); if (!row) return null; const q = row.getBoundingClientRect(); return { x: q.left + 5, y: q.top + 6, t: row.textContent }; }, [scr, k, i]);
    if (!r) return null; if (MODE === 'phone') await p.touchscreen.tap(r.x, r.y); else await p.mouse.click(r.x, r.y); await p.waitForTimeout(150); return r.t; };
  const boxes = scr => p.evaluate(s => [...document.querySelectorAll(`#${s} .lb`)].map(b => b.items.length), scr);
  const cnts = scr => p.evaluate(s => [...document.querySelectorAll(`#${s} .cnt`)].filter(e => e.style.display !== 'none').map(e => e.textContent.trim()), scr);

  // 1 opening, credits, modules
  ok('opening screen shows credit lines', (await txt('#open')).includes('Proprietary right holder - Dr. K.N. Ganeshaiah') && (await txt('#open')).includes('Updated in 2026 by Dr. Sachin A. Rosario'));
  await tap(1193, 744); ok('Credits opens the team screen', await cur() === 'team');
  await tap(715, 740); ok('Credits Back returns to opening', await cur() === 'open');
  await tap(1264, 744); ok('Next opens Data Recovery Modules', await cur() === 'mods');
  await tap(1324, 49); ok('Modules Back returns to opening', await cur() === 'open');
  await tap(1264, 744);
  // 2 political boundary
  await tap(140, 126); await idle(); ok('Political Boundary opens', await cur() === 'pol');
  let c = await cnts('pol'); ok('Entire India counts 316 / 4246 / 27058 with status bracket', c[0] === '316' && c[1] === '4246' && c[2].startsWith('27058') && c[2].includes('(13457,7380,0,6653,3472)'), c.join(' | '));
  let n = await boxes('pol'); ok('four lists filled', n[0] === 316 && n[1] === 4246 && n[2] === 27058 && n[3] === 0, n.join(','));
  const fam = await pickRow('#pol@0', 0); n = await boxes('pol'); ok('clicking a family filters genera and species', fam && n[1] > 0 && n[1] < 4246 && n[2] < 27058, `${fam}: ${n}`);
  await p.evaluate(() => { POL.show(INDIA, 'Plant Richness of Entire India'); });
  const gi = await p.evaluate(() => POL.lg.items.indexOf('Abelmoschus'));
  await pickRow('#pol@1', gi); n = await boxes('pol'); ok('clicking a genus lists its species', n[2] > 0 && n[2] < 50, n.join(','));
  const si = await p.evaluate(() => POL.ls.items.indexOf('Abelmoschus manihot'));
  await pickRow('#pol@2', si); n = await boxes('pol'); ok('clicking a species lists its sub-species / varieties', n[3] > 0, n.join(','));
  const mi = await p.evaluate(() => POL.lf.items.indexOf('MALVACEAE')); await pickRow('#pol@0', mi); await pickRow('#pol@1', await p.evaluate(() => POL.lg.items.indexOf('Abelmoschus'))); await pickRow('#pol@2', await p.evaluate(() => POL.ls.items.indexOf('Abelmoschus manihot')));
  await tap(656 + 75, 40 + 346); await idle(); ok('Family Search opens the family inventory', await cur() === 'det' && (await txt('#dTitle')).includes('MALVACEAE'), await txt('#dTitle'));
  await tap(1288, 20); ok('Back returns to Political', await cur() === 'pol');
  await tap(656 + 245, 40 + 346); await idle(); ok('Genus Search opens the genus inventory', (await txt('#dTitle')).includes('Abelmoschus'), await txt('#dTitle')); await tap(1288, 20);
  await tap(656 + 417, 40 + 346); await idle(); ok('Species Search opens the species inventory', (await txt('#dTitle')).includes('Abelmoschus manihot'), await txt('#dTitle')); await tap(1288, 20);
  await pickRow('#pol@3', 0); await tap(656 + 608, 40 + 346); await idle(); ok('Sub sp & var Search opens that variety', (await txt('#dTitle')).match(/var\.|ssp\.|subsp\./), await txt('#dTitle')); await tap(1288, 20);
  await tap(656 + 83, 40 + 382); n = await boxes('pol'); ok('Refresh restores all lists', n[0] === 316 && n[2] === 27058);
  await tap(656 + 312, 40 + 382); await p.waitForTimeout(300); ok('To List Correct & Synonym Names opens five lists', await p.evaluate(() => document.getElementById('stl').style.display === 'block' && document.querySelectorAll('#stl .lb').length === 5 && [...document.querySelectorAll('#stl .lb')].filter(b => b.items.length > 0).length >= 4));
  await pickRow('#stl@3', 3); await tap(133 + 935, 84 + 560); await idle(); ok('Open on a listed name opens its inventory', await cur() === 'det'); await tap(1288, 20);
  await tap(656 + 312, 40 + 382); await tap(133 + 1035, 84 + 560); ok('Close shuts the name lists', await p.evaluate(() => document.getElementById('stl').style.display === 'none'));
  // every state on the map
  const states = await p.evaluate(() => Object.entries(SB.so).filter(([s]) => s !== 'SouthindiaStates').map(([s, rings]) => { let best = null, A = 0; for (const r of rings) { let a = 0; for (let i = 0; i < r.length; i++) { const [x1, y1] = r[i], [x2, y2] = r[(i + 1) % r.length]; a += x1 * y2 - x2 * y1; } if (Math.abs(a) > A) { A = Math.abs(a); best = r; } }
    // a point inside the largest ring: scan its middle row
    const ys = best.map(p => p[1]); const ym = (Math.min(...ys) + Math.max(...ys)) / 2; const xs = []; for (let i = 0; i < best.length; i++) { const [x1, y1] = best[i], [x2, y2] = best[(i + 1) % best.length]; if ((y1 > ym) !== (y2 > ym)) xs.push(x1 + (ym - y1) * (x2 - x1) / (y2 - y1)); } xs.sort((a, b) => a - b);
    let w = 0, xm = xs[0]; for (let i = 0; i + 1 < xs.length; i += 2) if (xs[i + 1] - xs[i] > w) { w = xs[i + 1] - xs[i]; xm = (xs[i] + xs[i + 1]) / 2; }
    return [s, 8 + (xm - 67.9) * 21.25, 34 + (37.25 - ym) * 23.79]; }));
  let stBad = [];
  for (const [s, x, y] of states) { await tap(x, y); await idle(); const t = await p.evaluate(() => POL.title.textContent); const k = await cnts('pol'); if (t !== 'Plant Richness of ' + s || !(+k[2] > 0)) stBad.push(`${s}->${t} ${k[2]}`); }
  ok(`clicking each of the ${states.length} states shows that state's plants`, stBad.length === 0, stBad.join('; '));
  await tap(879, 25); ok('Home returns to modules', await cur() === 'mods');
  // 3 biotic zones
  await tap(1242, 122); ok('Biotic zone Search opens with no list yet', await cur() === 'bio' && await p.evaluate(() => BIO.lf.style.display === 'none'));
  let zBad = [];
  for (let z = 1; z <= 20; z++) { const c0 = Math.floor((z - 1) / 5), r0 = (z - 1) % 5; await tap(662 + [8, 104, 243, 368][c0] + 30, 503 + 14 + r0 * 16 + 7); await idle(); const t = await p.evaluate(() => BIO.title.textContent); const k = await cnts('bio'); if (!t.includes('biotic zone') || !(+k[2] > 0)) zBad.push(z + ':' + t); }
  ok('each of the 20 legend labels lists that zone', zBad.length === 0, zBad.join('; '));
  let wg = await cnts('bio'); await tap(1256, 520); await idle(); wg = await cnts('bio'); ok('Western Ghats: 300 families, 3732 genera (as in the 2005 program)', wg[0] === '300' && wg[1] === '3732', wg.join('|'));
  const zclick = [[215, 90, 'Tibetan'], [447, 262, 'Sikkim'], [100, 260, 'Thar'], [240, 580, 'Deccan Plateau'], [176, 690, 'western ghats'], [425, 330, 'Lower Gangetic Plain']];
  let zm = []; for (const [x, y, nm] of zclick) { await tap(x, y); await idle(); const t = await p.evaluate(() => BIO.title.textContent); if (!t.endsWith(nm)) zm.push(`${nm}->${t}`); }
  ok('clicking zones on the map selects them', zm.length === 0, zm.join('; '));
  await tap(879, 25);
  // 4 grid
  await tap(142, 408); ok('Gridwise Search opens', await cur() === 'grd');
  await tap(300, 600); await idle(); let gt = await p.evaluate(() => [GRD.title.textContent, document.getElementById('grdSel').style.display]); let gc = await cnts('grd');
  ok('clicking a grid cell marks it and lists its plants', gt[0] === 'GRIDWISE(625 Sq.kms) SEARCH' && gt[1] === 'block' && +gc[2] > 0, gc.join('|'));
  await tap(879, 25);
  // 5 thematic
  await tap(1235, 411); ok('Thematic Maps opens with the family map', await cur() === 'thm' && (await p.evaluate(() => document.getElementById('thmImg').src)).endsWith('map_family.png'));
  await tap(900, 110); ok('Genera radio shows genera per taluk', (await p.evaluate(() => document.getElementById('thmImg').src)).endsWith('map_genus.png'));
  await tap(900, 141); ok('Species radio shows species per taluk', (await p.evaluate(() => document.getElementById('thmImg').src)).endsWith('map_species.png'));
  ok('thematic map pictures load', await p.evaluate(() => document.getElementById('thmImg').naturalWidth > 0));
  await tap(1041, 25);
  // 6 images
  await tap(137, 690); c = await cnts('img'); ok('Images counts 222 / 1266 / 2674 (1636,1393,0,488,271)', c[0] === '222' && c[1] === '1266' && c[2].startsWith('2674') && c[2].includes('(1636,1393,0,488,271)'), c.join('|'));
  await pickRow('#img@2', 0); await tap(1240, 420); await idle(); ok('Images: Species Search opens the Images tab', await cur() === 'det');
  ok('the picture is shown', await p.waitForFunction(() => { const i = document.querySelector('#dBody img[style*="max-width"]'); return i && i.complete && i.naturalWidth > 0; }, null, { timeout: 30000 }).then(() => true).catch(() => false));
  await tap(1288, 20); ok('Back returns to Images', await cur() === 'img'); await tap(1254, 26);
  // 7 textform
  await tap(1235, 690); await idle();
  const sel = (i, v) => p.evaluate(([i, v]) => { const s = document.querySelectorAll('#txt select.cb')[i]; if (typeof v === 'number') s.selectedIndex = v; else s.value = v; s.dispatchEvent(new Event('change')); return s.value; }, [i, v]);
  const lang = await sel(0, 3); const cn = await sel(1, 1); await tap(333, 84); await idle(); c = await cnts('txt'); ok('common-name search lists the plant(s)', +c[2] > 0, `${lang} / ${cn}: ${c.join('|')}`);
  await sel(2, 'Karnataka'); await tap(333, 212); await idle(); c = await cnts('txt'); ok('state search lists the plants of the state', +c[2] > 1000, c.join('|'));
  const d = await sel(3, 1); await tap(333, 212); await idle(); c = await cnts('txt'); ok('district search lists the plants of the district', +c[2] > 0, `${d}: ${c.join('|')}`);
  await sel(4, 'ACANTHACEAE'); await sel(5, 'Barleria'); await sel(6, 'Barleria prionitis'); await tap(333, 396); await idle(); ok('scientific-name search opens the species', (await txt('#dTitle')).includes('Barleria prionitis'), await txt('#dTitle')); await tap(1288, 20);
  await tap(188, 485); ok('Refresh clears the scientific name', (await p.evaluate(() => document.querySelectorAll('#txt select.cb')[4].value)) === '');
  await tap(879, 25);
  // 8 the inventory window, every tab, for a species with every kind of data
  const sp = await p.evaluate(() => SB.sp.find(r => r[7] === 'Abelia triflora')[0]);
  await p.evaluate(i => detail('S', i), sp); await idle();
  ok('Taxonomic Hierarchy shows 6 levels', await p.evaluate(() => [...document.querySelectorAll('#dBody .hval')].map(e => e.textContent).filter(Boolean).length === 6));
  if (V2) ok('Version 2 card: current name, IUCN and DNA', await p.evaluate(() => /Catalogue of Life/.test(document.getElementById('dBody').textContent) && /IUCN/.test(document.getElementById('dBody').textContent) && /GenBank/.test(document.getElementById('dBody').textContent)));
  if (V2) ok('Version 2 title has the current name in brackets', (await txt('#dTitle')).includes('(Zabelia triflora)'), await txt('#dTitle'));
  await tap(252, 65); ok('Maps tab draws the states', await p.evaluate(() => document.querySelectorAll('#dBody svg path').length >= 29));
  await tap(14 + 468, 96 + 48); ok('Statewise Thm. Map colours the states with records', await p.evaluate(() => new Set([...document.querySelectorAll('#dBody svg path')].map(e => e.getAttribute('fill'))).size >= 2));
  await tap(14 + 59, 96 + 48); ok('Region Labels toggles the state numbers', await p.evaluate(() => document.querySelectorAll('#dBody svg text').length) >= 0);
  await tap(451, 65); ok('Images tab shows the picture with pager', await p.waitForFunction(() => { const i = document.querySelector('#dBody img[style*="max-width"]'); return i && i.naturalWidth > 0; }, null, { timeout: 30000 }).then(() => true).catch(() => false));
  await tap(646, 65); ok('Distribution data lists the records', await p.evaluate(() => document.querySelectorAll('#dBody td[data-r]').length > 5));
  await p.evaluate(() => document.querySelector('#dBody td[data-r]').click()); ok('clicking a record lists its floras and habitats', await p.evaluate(() => document.querySelectorAll('#dBody table.fg')[0].querySelectorAll('tr').length > 2));
  await p.evaluate(() => document.querySelectorAll('#dBody input[name=dm]')[1].click()); ok('Biotic and habitat Zone view', await p.evaluate(() => [...document.querySelectorAll('#dBody th')].some(t => t.textContent === 'Biotic Zone')));
  await tap(841, 65); ok('Synonym data shows the names tree', await p.evaluate(() => document.querySelectorAll('#dBody .tree .pm').length > 0));
  await p.evaluate(() => document.querySelector('#dBody .tree .pm').click()); ok('expanding a name shows its floras', await p.evaluate(() => [...document.querySelectorAll('#dBody .tree > div[id]')].some(d => d.style.display === '')));
  await tap(1038, 65); ok('Common Names table', await p.evaluate(() => document.querySelectorAll('#cmt td.nm').length > 0));
  await p.evaluate(() => document.querySelector('#cmt td.nm').click()); ok('clicking a common name lists its floras', await p.evaluate(() => document.querySelector('#dBody .abs[style*="background: rgb(255, 255, 255)"], #dBody div').textContent.length > 0));
  await tap(1231, 65); ok('Flora List shows the floras', await p.evaluate(() => document.querySelectorAll('#dBody .tree .n').length > 3));
  // family inventory (4 tabs) and its distribution
  await p.evaluate(() => detail('F', 'Acanthaceae')); await idle(); ok('family inventory has 4 tabs', await p.evaluate(() => document.querySelectorAll('#dTabs .tab').length === 4));
  await tap(754, 65); ok('family distribution data', await p.evaluate(() => document.querySelectorAll('#dBody td[data-r]').length > 5));
  await tap(1095, 65); ok('family flora list', await p.evaluate(() => document.querySelectorAll('#dBody .tree .n').length > 3));
  await p.evaluate(() => detail('G', 'Barleria')); await idle(); await tap(754, 65); ok('genus distribution data', await p.evaluate(() => document.querySelectorAll('#dBody td[data-r]').length > 5));
  const noimg = await p.evaluate(() => SB.sp.find(r => !SB.im[r[7].toLowerCase()])[0]); await p.evaluate(i => detail('S', i), noimg); await idle();
  ok('species without pictures: Images tab is the "not available" one', await p.evaluate(() => document.querySelectorAll('#dTabs .tab')[2].style.backgroundImage.includes('tab_img_na')));
  // every record file loads (all 400 species and 200 family/genus parts) and 300 random plants open on every tab
  const sh = await p.evaluate(async () => { let bad = []; for (let i = 0; i < SB.ns; i++) { try { await shard('d', i); } catch (e) { bad.push('d' + i); } } for (let i = 0; i < SB.ng; i++) { try { await shard('g', i); } catch (e) { bad.push('g' + i); } } return bad; });
  ok('all 600 plant-record files load', sh.length === 0, sh.slice(0, 10).join(','));
  const rnd = await p.evaluate(async () => { const bad = []; const ids = SB.sp.map(r => r[0]); for (let k = 0; k < 300; k++) { const id = ids[(k * 7919) % ids.length];
      try { await detail('S', id); for (const t of ['tax', 'map', 'dist', 'syn', 'cm', 'fl']) showTab(t); if (DET.imgs.length) showTab('img'); } catch (e) { bad.push(id + ':' + e.message); } }
    for (const f of INDIA.fams.slice(0, 316)) { try { await detail('F', f); for (const t of ['tax', 'map', 'dist', 'fl']) showTab(t); } catch (e) { bad.push(f + ':' + e.message); } } return bad; });
  ok('300 species and all 316 families open on every tab without error', rnd.length === 0, rnd.slice(0, 5).join('; '));
  ok('every picture listed is in the picture folder', await p.evaluate(() => Object.values(SB.im).flat().filter(x => x[0]).length) > 4000);
  // exit
  await p.evaluate(() => go('open')); await tap(1330, 741); await p.waitForTimeout(400); ok('Exit closes the program', await p.evaluate(() => getComputedStyle(document.getElementById('quit')).display === 'flex'));
  if (!LIVE && (SMALL || APP !== 'sasya-bharathi')) ok('plant records and pictures came from the IBIN web copy', remoteHits.some(r => r.startsWith('data/d/')) && remoteHits.some(r => r.startsWith('img/photos/')), remoteHits.length + ' files');
  ok('no script errors', errors.length === 0, errors.slice(0, 5).join(' | '));
  ok('no failed downloads', bad.length === 0, bad.slice(0, 5).join(' | '));
  ok('no unexpected messages', dialogs.length === 0, dialogs.join(' | '));
  console.log(`${APP} ${MODE}${SMALL ? ' small-installer' : LIVE ? ' LIVE web page' : ''}\n` + results.join('\n') + `\n${failed ? failed + ' FAILED' : 'ALL PASSED'} (${results.length} checks)`);
  await b.close(); srv.close(); process.exit(failed ? 1 : 0);
})().catch(e => { console.log(results.join('\n') + '\nCRASH ' + e.stack); process.exit(2); });
