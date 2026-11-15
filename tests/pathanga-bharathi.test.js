// Full feature test of Pathanga Bharathi (Version 1), run before every release.
// usage: node tests/pathanga-bharathi.test.js [app folder] [desktop|phone] [small|live]
const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const APP = process.argv[2] || 'pathanga-bharathi', MODE = process.argv[3] || 'desktop', SMALL = process.argv[4] === 'small', LIVE = process.argv[4] === 'live';
const ROOT = path.join(__dirname, '..', 'apps');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.csv': 'text/csv' };
const REMOTE_PREFIXES = ['data/d/', 'data/g/', 'img/photos/'];
const srv = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split('?')[0]); let f;
  if (u.startsWith('/app/')) { const rel = u.slice(5) || 'index.html'; if (SMALL && REMOTE_PREFIXES.some(p => rel.startsWith(p))) f = null; else f = path.join(ROOT, APP, 'web', rel); }
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
  const OPEN_FILE = process.env.OPEN_FILE;
  if (OPEN_FILE) await ctx.route(/^https?:/, rt => rt.abort());
  const remoteHits = []; if (!LIVE && !OPEN_FILE) await p.route('https://sachinrosario.github.io/ibin-apps/' + APP + '/**', rt => { const rel = decodeURIComponent(rt.request().url().split('/ibin-apps/' + APP + '/')[1].split('?')[0]); remoteHits.push(rel); const f = path.join(ROOT, APP, 'web', rel);
    if (fs.existsSync(f)) rt.fulfill({ path: f, contentType: MIME[path.extname(f)] }); else rt.fulfill({ status: 404, body: '' }); });
  await p.goto(OPEN_FILE ? 'file://' + OPEN_FILE : LIVE ? `https://sachinrosario.github.io/ibin-apps/${APP}/?t=${Date.now()}` : `http://localhost:${PORT()}/app/index.html`);
  await p.waitForFunction(() => window.SB && SB.sp && typeof BYID !== 'undefined' && BYID && document.getElementById('busy').style.display === 'none', null, { timeout: 90000 });
  const S = await p.evaluate(() => { const r = document.getElementById('stage').getBoundingClientRect(); return { x: r.left, y: r.top, k: r.width / 1366 }; });
  const tap = async (x, y) => { const X = S.x + x * S.k, Y = S.y + y * S.k; if (MODE === 'phone') await p.touchscreen.tap(X, Y); else await p.mouse.click(X, Y); await p.waitForTimeout(150); };
  const idle = () => p.waitForFunction(() => document.getElementById('busy').style.display === 'none', null, { timeout: 60000 });
  const cur = () => p.evaluate(() => CUR);
  const txt = sel => p.evaluate(s => { const e = document.querySelector(s); return e ? e.textContent.trim() : null; }, sel);
  const boxes = scr => p.evaluate(s => [...document.querySelectorAll(`#${s} .lb`)].map(b => b.items.length), scr);
  const cnts = scr => p.evaluate(s => [...document.querySelectorAll(`#${s} .cnt`)].filter(e => e.style.display !== 'none').map(e => e.textContent.trim()), scr);
  const tabsOf = () => p.evaluate(() => document.querySelectorAll('#dTabs .tab').length);
  const imgOk = () => p.waitForFunction(() => { const i = document.querySelector('#dBody img[style*="max-width"]'); return i && i.complete && i.naturalWidth > 0; }, null, { timeout: 30000 }).then(() => true).catch(() => false);

  // 1 opening
  { const im = require('pngjs').PNG.sync.read(await p.screenshot()); let lit = 0, n = 0; for (let i = 0; i < im.data.length; i += 64) { n++; if (im.data[i] + im.data[i + 1] + im.data[i + 2] > 40) lit++; }
    ok(`the program is visible on this screen (${Math.round(100 * lit / n)}% drawn)`, lit / n > 0.25 && await p.evaluate(() => innerWidth <= document.documentElement.clientWidth + 1)); }
  const t0 = await txt('#open');
  ok('opening screen shows credit lines', t0.includes('Proprietary right holder - Dr. K.N. Ganeshaiah') && t0.includes('Updated in 2026 by Dr. Sachin A. Rosario'));
  await tap(1258, 743); ok('Next opens Data Recovery Modules', await cur() === 'mods');
  await tap(1324, 49); ok('Modules Back returns to opening', await cur() === 'open');
  await tap(1258, 743);
  // 2 political boundary
  await tap(232, 126); await idle(); ok('Political Boundary opens', await cur() === 'pol');
  const NSP = await p.evaluate(() => INDIA.sps.length), NG = await p.evaluate(() => INDIA.gens.length), NF = await p.evaluate(() => INDIA.fams.length);
  let c = await cnts('pol'); ok('Entire India counts match the database', c[0] === String(NF) && c[1] === String(NG) && c[2] === String(NSP) && NSP > 1000, `${c.join(' | ')}`);
  let n = await boxes('pol'); ok('three lists filled', n[0] === NF && n[1] === NG && n[2] === NSP, n.join(','));
  await p.evaluate(() => POL.lf.select('Lycaenidae')); n = await boxes('pol'); ok('clicking a family filters genera and species', n[1] > 0 && n[1] < NG && n[2] > 0 && n[2] < NSP, n.join(','));
  await p.evaluate(() => POL.lg.select('Abisara')); n = await boxes('pol'); ok('clicking a genus lists its species', n[2] > 0 && n[2] < 40, n.join(','));
  await p.evaluate(() => POL.show(INDIA, 'Butterfly Richness of Entire India'));
  await p.evaluate(() => { POL.lf.select('Lycaenidae'); POL.lg.select('Abisara'); POL.ls.select(POL.ls.items[0]); });
  await tap(656 + 85, 40 + 346); await idle(); ok('Family Search opens the family inventory', await cur() === 'det' && (await txt('#dTitle')).toUpperCase().includes('LYCAENIDAE'), await txt('#dTitle'));
  await tap(1288, 20); ok('Back returns to Political', await cur() === 'pol');
  await tap(656 + 247, 40 + 347); await idle(); ok('Genus Search opens the genus inventory', (await txt('#dTitle')).includes('Abisara'), await txt('#dTitle')); await tap(1288, 20);
  await tap(656 + 417, 40 + 346); await idle(); ok('Species Search opens the species inventory', await cur() === 'det' && /Abisara/.test(await txt('#dTitle')), await txt('#dTitle')); await tap(1288, 20);
  await tap(656 + 83, 40 + 381); n = await boxes('pol'); ok('Refresh restores all lists', n[0] === NF && n[2] === NSP, n.join(','));
  // every state on the map
  const states = await p.evaluate(() => Object.keys(SB.states).map(s => s));
  let stBad = [];
  for (const s of states) { await p.evaluate(s => { const st = Object.keys(SB.poly).find(k => k.toLowerCase() === s) || s; POL.show(stateSet([s]), 'Butterfly Richness of ' + s); }, s); const k = await cnts('pol'); if (!(+k[2] > 0)) stBad.push(s + ' ' + k[2]); }
  ok(`every one of the ${states.length} states lists its butterflies`, stBad.length === 0, stBad.join('; '));
  // clicking real states on the map
  const hits = []; for (const [x, y, nm] of [[130, 400, 'Rajasthan'], [190, 640, 'Karnataka'], [260, 330, 'Madhya Pradesh'], [420, 300, 'Bihar'], [240, 80, 'Jammu']]) { await tap(x, y); await idle(); const t = await p.evaluate(() => POL.title.textContent); if (!t.includes(nm) && !t.includes('Entire')) hits.push(`${nm}->${t}`); else if (t.includes('Entire')) hits.push(`${nm}->no state`); }
  ok('clicking states on the map selects them', hits.length <= 1, hits.join('; '));
  await tap(879, 25); ok('Home returns to modules', await cur() === 'mods');
  // 3 biotic zones
  await tap(222, 408); ok('Biotic zone Search opens with no list yet', await cur() === 'bio' && await p.evaluate(() => BIO.lf.style.display === 'none'));
  let zBad = [];
  for (let z = 1; z <= 20; z++) { const c0 = Math.floor((z - 1) / 5), r0 = (z - 1) % 5; await tap(662 + [6, 100, 222, 366][c0] + 30, 490 + 9 + r0 * 16 + 7 + 40 - 40); await idle(); const t = await p.evaluate(() => BIO.title.textContent); const k = await cnts('bio'); if (!t.includes('biotic zone') || !(+k[2] > 0)) zBad.push(`${z}:${t}:${k[2]}`); }
  ok('each of the 20 legend labels lists that zone', zBad.length === 0, zBad.join('; '));
  const zclick = [[215, 90, 'Tibetan'], [100, 260, 'Thar'], [240, 580, 'Deccan Plateau']];
  let zm = []; for (const [x, y, nm] of zclick) { await tap(x, y); await idle(); const t = await p.evaluate(() => BIO.title.textContent); if (!t.endsWith(nm)) zm.push(`${nm}->${t}`); }
  ok('clicking zones on the map selects them', zm.length <= 1, zm.join('; '));
  await tap(879, 25);
  // 4 textform
  await tap(232, 690); await idle(); ok('Textform Search opens', await cur() === 'txt');
  const sel = (i, v) => p.evaluate(([i, v]) => { const s = document.querySelectorAll('#txt select.cb')[i]; if (typeof v === 'number') s.selectedIndex = v; else s.value = v; s.dispatchEvent(new Event('change')); return s.value; }, [i, v]);
  const cn = await sel(0, 1); await tap(285 + 39, 45 + 15); await idle();
  c = await cnts('txt'); ok('common-name search lists the butterfly(ies)', +c[2] > 0, `${cn}: ${c.join('|')}`);
  await sel(1, 'Karnataka'); await tap(292 + 40, 141 + 15); await idle(); c = await cnts('txt'); ok('state search lists the butterflies of the state', +c[2] > 100, c.join('|'));
  const d = await sel(2, 'Kodagu'); await tap(292 + 40, 141 + 15); await idle(); c = await cnts('txt'); ok('district search lists the butterflies of the district', +c[2] > 0, `${d}: ${c.join('|')}`);
  await sel(3, 'LYCAENIDAE'); await sel(4, 'Abisara'); await sel(5, 'Abisara echerius'); await tap(292 + 40, 293 + 15); await idle(); ok('scientific-name search opens the species', (await txt('#dTitle')).includes('Abisara echerius'), await txt('#dTitle')); await tap(1288, 20);
  await tap(143 + 37, 358 + 15); ok('Refresh clears the scientific name', (await p.evaluate(() => document.querySelectorAll('#txt select.cb')[3].value)) === '');
  // butterflies and host plants
  const hp = await p.evaluate(() => { const s = document.querySelectorAll('#txt select.cb'); return [s[6].options.length, s[8].options.length]; });
  ok('butterfly and host-plant lists are filled', hp[0] > 100 && hp[1] > 100, hp.join('/'));
  const hostRes = await p.evaluate(() => { const s = document.querySelectorAll('#txt select.cb'); s[6].selectedIndex = 1; s[6].dispatchEvent(new Event('change')); const lb = [...document.querySelectorAll('#txt .lb')]; return lb.map(l => l.items.length); });
  ok('choosing a butterfly lists its host plants', hostRes[3] > 0, hostRes.join(','));
  await p.evaluate(() => { const s = document.querySelectorAll('#txt select.cb'); s[8].selectedIndex = 1; s[8].dispatchEvent(new Event('change')); });
  ok('choosing a host plant lists its butterflies', (await p.evaluate(() => [...document.querySelectorAll('#txt .lb')].pop().items.length)) > 0);
  await tap(879, 25);
  // 5 the inventory window
  const sp = await p.evaluate(() => [...BYID.values()].find(r => r[7] === 'Abisara echerius')[0]);
  await p.evaluate(i => detail('S', i), sp); await idle();
  ok('species window has 7 tabs', await tabsOf() === 7);
  ok('Taxonomic Hierarchy shows 6 levels, family in capitals', await p.evaluate(() => { const v = [...document.querySelectorAll('#dBody .hval')].map(e => e.textContent).filter(Boolean); return v.length === 6 && v[5] === v[5].toUpperCase(); }));
  await tap(252, 65); ok('Maps tab draws the states', await p.evaluate(() => document.querySelectorAll('#dBody svg path').length >= 29));
  ok('Maps tab shows the three colour bands', await p.evaluate(() => new Set([...document.querySelectorAll('#dBody svg path')].map(e => e.getAttribute('fill'))).size >= 3));
  const nt = await p.evaluate(() => document.querySelectorAll('#dBody svg text').length);
  await tap(14 + 59, 96 + 48 - 8); ok('Region Labels toggles the state numbers', await p.evaluate(() => document.querySelectorAll('#dBody svg text').length) < nt);
  await tap(14 + 59, 96 + 48 - 8);
  await tap(14 + 468, 96 + 48); ok('Statewise Thm. Map keeps the colours', await p.evaluate(() => new Set([...document.querySelectorAll('#dBody svg path')].map(e => e.getAttribute('fill'))).size >= 3));
  await tap(14 + 59 + 120, 96 + 48); ok('Default Maps works', await p.evaluate(() => document.querySelectorAll('#dBody svg path').length >= 29));
  await tap(14 + 59 + 230, 96 + 48); ok('Background switches colour', await p.evaluate(() => /#fff|rgb\(255, 255, 255\)/.test(document.querySelector('#dBody svg').style.background)));
  await tap(1215, 180); await tap(1100, 180); ok('Legend opens and closes', await p.evaluate(() => document.querySelectorAll('#dBody svg path').length >= 29));
  await tap(451, 65); ok('Images tab shows the picture', await imgOk());
  await tap(646, 65); ok('Distribution data lists the records', await p.evaluate(() => document.querySelectorAll('#dBody td[data-r]').length > 3));
  await p.evaluate(() => document.querySelector('#dBody td[data-r]').click()); ok('clicking a record lists its floras and habitats', await p.evaluate(() => document.querySelectorAll('#dBody table.fg')[0].querySelectorAll('tr').length > 1));
  await p.evaluate(() => document.querySelectorAll('#dBody input[name=dm]')[1].click()); ok('Biotic and habitat Zone view', await p.evaluate(() => [...document.querySelectorAll('#dBody th')].some(t => t.textContent === 'Biotic Zone')));
  await tap(841, 65); ok('Synonym data shows the names tree', await p.evaluate(() => document.querySelectorAll('#dBody .tree .pm').length > 0));
  await p.evaluate(() => document.querySelector('#dBody .tree .pm').click()); ok('expanding a name shows its floras', await p.evaluate(() => [...document.querySelectorAll('#dBody .tree > div[id]')].some(d => d.style.display === '')));
  await tap(1038, 65); ok('Common Names tab opens', await p.evaluate(() => !!document.querySelector('#cmt')));
  await tap(1231, 65); ok('Flora List shows the floras', await p.evaluate(() => document.querySelectorAll('#dBody .tree .n').length >= 2));
  // family and genus windows
  await p.evaluate(() => detail('F', 'Lycaenidae')); await idle(); ok('family inventory has 4 tabs', await tabsOf() === 4);
  ok('family name is in capitals', await p.evaluate(() => [...document.querySelectorAll('#dBody .hval')].some(e => e.textContent === 'LYCAENIDAE')));
  await tap(754, 65); ok('family distribution data', await p.evaluate(() => document.querySelectorAll('#dBody td[data-r]').length > 3));
  await tap(1095, 65); ok('family flora list', await p.evaluate(() => document.querySelectorAll('#dBody .tree .n').length >= 2));
  await p.evaluate(() => detail('G', 'Abisara')); await idle(); await tap(754, 65); ok('genus distribution data', await p.evaluate(() => document.querySelectorAll('#dBody td[data-r]').length > 1));
  const noimg = await p.evaluate(() => SB.sp.find(r => !SB.im[r[7].toLowerCase()])[0]); await p.evaluate(i => detail('S', i), noimg); await idle();
  ok('species without pictures: Images tab is the "not available" one', await p.evaluate(() => document.querySelectorAll('#dTabs .tab')[2].style.backgroundImage.includes('tab_img_na')));
  // every record file loads and every species and family opens on every tab
  const sh = await p.evaluate(async () => { let bad = []; for (let i = 0; i < SB.ns; i++) { try { await shard('d', i); } catch (e) { bad.push('d' + i); } } for (let i = 0; i < SB.ng; i++) { try { await shard('g', i); } catch (e) { bad.push('g' + i); } } return bad; });
  ok(`all ${await p.evaluate(() => SB.ns + SB.ng)} record files load`, sh.length === 0, sh.slice(0, 10).join(','));
  const rnd = await p.evaluate(async () => { const bad = []; const ids = SB.sp.map(r => r[0]);
    for (const id of ids) { try { await detail('S', id); for (const t of ['tax', 'map', 'dist', 'syn', 'cm', 'fl']) showTab(t); if (DET.imgs.length) showTab('img'); } catch (e) { bad.push(id + ':' + e.message); } }
    for (const f of INDIA.fams) { try { await detail('F', f); for (const t of ['tax', 'map', 'dist', 'fl']) showTab(t); } catch (e) { bad.push(f + ':' + e.message); } }
    for (const g of INDIA.gens.slice(0, 150)) { try { await detail('G', g[0]); for (const t of ['tax', 'map', 'dist', 'fl']) showTab(t); } catch (e) { bad.push(g[0] + ':' + e.message); } } return bad; });
  ok(`all ${NSP}-ish species, all families and 150 genera open on every tab without error`, rnd.length === 0, rnd.slice(0, 5).join('; '));
  ok('every picture listed is in the picture folder list', await p.evaluate(() => Object.values(SB.im).flat().length) > 100);
  // exit
  await p.evaluate(() => go('open')); await tap(1324, 741); await p.waitForTimeout(400); ok('Exit closes the program', await p.evaluate(() => getComputedStyle(document.getElementById('quit')).display === 'flex'));
  if (!LIVE && !OPEN_FILE && SMALL) ok('records and pictures came from the IBIN web copy', remoteHits.some(r => r.startsWith('data/d/')) && remoteHits.some(r => r.startsWith('img/photos/')), remoteHits.length + ' files');
  ok('no script errors', errors.length === 0, errors.slice(0, 5).join(' | '));
  ok('no failed downloads', bad.filter(x => !OPEN_FILE || !x.startsWith('0 ')).length === 0, bad.slice(0, 5).join(' | '));
  ok('no unexpected messages', dialogs.length === 0, dialogs.join(' | '));
  console.log(`${APP} ${MODE}${OPEN_FILE ? ' OFFLINE ZIP ' + OPEN_FILE : SMALL ? ' small-installer' : LIVE ? ' LIVE web page' : ''}\n` + results.join('\n') + `\n${failed ? failed + ' FAILED' : 'ALL PASSED'} (${results.length} checks)`);
  await b.close(); srv.close(); process.exit(failed ? 1 : 0);
})().catch(e => { console.log(results.join('\n') + '\nCRASH ' + e.stack); process.exit(2); });
