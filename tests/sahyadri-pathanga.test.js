// Full feature test of Sahyadri Pathanga (Version 1), run before every release.
// usage: node tests/pathanga-bharathi.test.js [app folder] [desktop|phone] [small|live]
const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const APP = process.argv[2] || 'sahyadri-pathanga', MODE = process.argv[3] || 'desktop', SMALL = process.argv[4] === 'small', LIVE = process.argv[4] === 'live';
const ROOT = path.join(__dirname, '..', 'apps');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.csv': 'text/csv' };
const REMOTE_PREFIXES = ['img/photos/'];
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
  await p.waitForFunction(() => 1, null, { timeout: 90000 });
  const S = await p.evaluate(() => { const r = document.getElementById('stage').getBoundingClientRect(); return { x: r.left, y: r.top, k: r.width / 1024 }; });
  const tap = async (x, y) => { const X = S.x + x * S.k, Y = S.y + y * S.k; if (MODE === 'phone') await p.touchscreen.tap(X, Y); else await p.mouse.click(X, Y); await p.waitForTimeout(150); };
  const idle = () => p.waitForFunction(() => getComputedStyle(document.getElementById('busy')).display === 'none', null, { timeout: 60000 });
  const cur = () => p.evaluate(() => CUR);
  const txt = sel => p.evaluate(s => { const e = document.querySelector(s); return e ? e.textContent.trim() : null; }, sel);


  await p.evaluate(() => ensureData()); await idle();
  const NSP = await p.evaluate(() => SB.sp.length);
  const E = f => p.evaluate(f);
  const panelOf = id => p.evaluate(i => { const P = built[i].p || built[i]; return { t: P.title.textContent, c: [P.cf.textContent, P.cg.textContent, P.cs.textContent], n: [P.lf.items.length, P.lg.items.length, P.ls.items.length] }; }, id);
  // 1 opening
  { const im = require('pngjs').PNG.sync.read(await p.screenshot()); let lit = 0, n = 0; for (let i = 0; i < im.data.length; i += 64) { n++; if (im.data[i] + im.data[i + 1] + im.data[i + 2] > 40) lit++; }
    ok(`the program is visible on this screen (${Math.round(100 * lit / n)}% drawn)`, lit / n > 0.25 && await p.evaluate(() => innerWidth <= document.documentElement.clientWidth + 1)); }
  const t0 = await txt('#open');
  ok('opening screen shows credit lines', t0.includes('Proprietary right holder - Dr. K.N. Ganeshaiah') && t0.includes('Updated in 2026 by Dr. Sachin A. Rosario'));
  await tap(900, 603); ok('Team does nothing (as in the original)', await cur() === 'open');
  await tap(900, 652); ok('Data opens the Data Recovery Modules', await cur() === 'mods');
  await tap(141, 636); ok('the small butterfly returns to the opening screen', await cur() === 'open');
  await tap(900, 652);
  // 2 political boundary
  await tap(266, 275); await idle(); await p.waitForTimeout(300); ok('Political Boundary opens', await cur() === 'pol');
  await tap(323, 438); await p.waitForTimeout(300);
  { const q = await panelOf('pol'); ok('Karnataka: 5 families, 154 genera, 283 species (as in the original)', q.c.join('/') === '5/154/283' && q.t === 'Butterfly Richness of Western Ghats in Karnataka', q.c.join('/') + ' ' + q.t); }
  ok('the state is shown green on the map', await E(() => document.getElementById('polHi').style.display !== 'none' && document.getElementById('polHi').src.includes('pol_karnataka')));
  for (const [k, st] of [['kerala', 'Kerala'], ['goa', 'Goa'], ['gujarat', 'Gujarat'], ['maharashtra', 'Maharastra'], ['tamilnadu', 'Tamilnadu']]) {
    const [x, y] = { kerala: [310, 606], goa: [240, 438], gujarat: [180, 100], maharashtra: [300, 200], tamilnadu: [400, 606] }[k]; await tap(x, y); await p.waitForTimeout(150);
    const q = await panelOf('pol'); const want = await E(`makeSet(stateIds('${st}')).sps.length`); ok(`state ${st}: ${want} species listed`, q.c[2] == want && want > 0, q.c.join('/')); }
  await p.mouse.dblclick(S.x + 250 * S.k, S.y + 330 * S.k); await p.waitForTimeout(300);
  { const q = await panelOf('pol'); ok('double-click on the map: the whole Western Ghats (all species)', q.c[2] == NSP && q.t === 'Butterfly Richness of Western Ghats', q.c.join('/')); }
  await tap(323, 438);
  // lists: family -> genera -> species, common name
  await tap(560, 120); { const q = await panelOf('pol'); ok('choosing a family narrows the genera and species', q.n[1] < 154 && q.n[2] < 283 && q.n[1] > 0, q.n.join('/')); }
  await E(() => { built.pol.lf.select('NYMPHALIDAE'); built.pol.ls.select('Acraea violae'); }); await p.waitForTimeout(100); ok('choosing a species shows its common name (Tawny coster)', (await E(() => built.pol.cm.textContent)) === 'Tawny coster', await E(() => built.pol.cm.textContent));
  await tap(940, 357); await idle(); ok('Species Search opens the species window', await cur() === 'det' && await E(() => DET.kind === 'S'));
  ok('window title names the species and region', (await txt('#dTitle')).includes('in Karnataka') && (await txt('#dTitle')).startsWith('Digitized Inventory of'));
  const tabsS = ['tax', 'map', 'img', 'dist', 'syn', 'cm', 'src'];
  for (const [i, t] of tabsS.entries()) { await tap(72 + i * 146, 62); await p.waitForTimeout(250); ok(`species window tab: ${t}`, await E(() => DET.tab) === t); }
  await tap(72, 62); ok('Taxonomic Hierarchy shows tribe, sub family and family', (await txt('#dBody')).includes('Family') && (await txt('#dBody')).includes('Sub family'));
  await tap(220, 62); ok('Maps: green range cells and the legend', await E(() => document.querySelectorAll('#dBody svg rect').length > 20) && (await txt('#dBody')).includes('Distribution in range'));
  { const n0 = await E(() => document.querySelectorAll('#dBody svg path').length); await tap(160, 118); await p.waitForTimeout(150); const n1 = await E(() => document.querySelectorAll('#dBody svg path').length); ok('Maps: Cancel State Border removes the state outlines', n1 < n0, n0 + ' -> ' + n1); await tap(160, 118); }
  await tap(365, 62); await p.waitForTimeout(500); ok('Images: a butterfly picture shows with its courtesy line', await p.waitForFunction(() => { const i = document.getElementById('dImg'); return i && i.complete && i.naturalWidth > 0; }, null, { timeout: 30000 }).then(() => true).catch(() => false));
  await tap(510, 62); await p.waitForTimeout(300); ok('Distribution Data lists state, district and taluk', await E(() => document.querySelectorAll('#dBody table.dd tr').length > 5));
  await tap(510, 62); await p.evaluate(() => document.querySelector('[data-m=hab]').click()); await p.waitForTimeout(200); ok('Distribution Data: the habitat and biotic zone view', await E(() => document.querySelector('#dBody table.dd th').textContent === 'Biotic Zone'));
  await tap(655, 62); await p.waitForTimeout(300); ok('Synonym Data shows the synonym names and their sources', await E(() => document.querySelectorAll('#dBody .tree div').length >= 2));
  await tap(800, 62); await p.waitForTimeout(300); ok('Common Names shows language and name', (await txt('#dBody')).includes('LANGUAGE'));
  await tap(950, 62); await p.waitForTimeout(300); ok('Source lists the checklists', await E(() => document.querySelectorAll('#dBody .sr div').length > 3));
  await tap(1000, 31); ok('BACK returns to the political screen', await cur() === 'pol');
  await tap(776, 357); await p.evaluate(() => built.pol.lg.select(built.pol.lg.items[0])); await tap(776, 357); await idle();
  ok('Genus Search opens the genus window with 4 tabs', await cur() === 'det' && await E(() => DET.kind === 'G') && await E(() => document.querySelectorAll('#dTabs .hot').length) === 4);
  for (const [i, t] of ['tax', 'map', 'dist', 'src'].entries()) { await tap(128 + i * 256, 62); await p.waitForTimeout(250); ok(`genus window tab: ${t}`, await E(() => DET.tab) === t); }
  await tap(384, 62); ok('genus Maps shows cells', await E(() => document.querySelectorAll('#dBody svg rect').length > 5));
  await tap(1000, 31);
  await tap(606, 357); await p.evaluate(() => built.pol.lf.select(built.pol.lf.items[0])); await tap(606, 357); await idle();
  ok('Family Search opens the family window', await cur() === 'det' && await E(() => DET.kind === 'F'));
  await tap(1000, 31); await tap(880, 700); ok('Home returns to the modules', await cur() === 'mods');
  // 3 vegetation
  await tap(497, 275); await idle(); ok('Vegetation opens', await cur() === 'veg');
  { let good = 0; const names = await E(() => VEGB.map(v => v[0]));
    for (let i = 0; i < names.length; i++) { const [, l, t] = await E(`VEGB[${i}]`); await tap(Math.round(l * 1.0235) + 40, Math.round(t * 1.0235)); await p.waitForTimeout(120);
      const q = await panelOf('veg'); const want = await E(`makeSet(unpack(SB.hab['${names[i]}'])).sps.length`); if (q.c[2] == want && want > 0 && /regions in Western ghats$/.test(q.t)) good++; else console.log('VEGFAIL', names[i], q.c.join('/'), want, q.t); }
    ok(`all ${names.length} habitat buttons list their butterflies`, good === names.length, good + ' of ' + names.length); }
  await tap(900, 700);
  // 4 gridwise
  await tap(737, 275); await idle(); ok('Gridwise opens', await cur() === 'grid');
  { const [px, py] = await E(() => { const r = SBG.g.find(x => x[0] === 'BU_T18'); return [(r[7] + r[8]) / 30, (r[9] + r[10]) / 30]; });
    const pt = await p.evaluate(([x, y]) => { const i = document.querySelector('#grid img[src*="gridmap"]'); const r = i.getBoundingClientRect(); return [r.left + x * (r.width / i.naturalWidth), r.top + y * (r.height / i.naturalHeight)]; }, [px, py]);
    await E(() => { document.querySelector('#grid div[style*="overflow: scroll"]').scrollLeft = 0; }); await p.mouse.click(pt[0], pt[1]); await p.waitForTimeout(300);
    const q = await panelOf('grid'); ok('clicking a grid cell lists its butterflies (5 families, 53 genera, 79 species as in the original)', q.c.join('/') === '5/53/79' && q.t === 'GRIDWISE(100 Sq.kms) SEARCH', q.c.join('/'));
    ok('the cell shows its longitude, latitude, state, district and taluk', await E(() => document.getElementById('gLon').value === '73.811053' && document.getElementById('gLat').value === '20.571121' && /Maharastra/.test(document.getElementById('gWhere').textContent) && /Nashik/.test(document.getElementById('gWhere').textContent) && /Kalvan/.test(document.getElementById('gWhere').textContent)));
    await E(() => { const r = SBG.g.find(x => x[11] === 'Karnataka'); document.getElementById('gLon').value = String(r[1]); document.getElementById('gLat').value = String(r[2]); }); await tap(642, 489); await p.waitForTimeout(300);
    ok('Enter finds the grid for a longitude and latitude', await E(() => /Karnataka/.test(document.getElementById('gWhere').textContent)), await txt('#gWhere')); }
  await tap(900, 700);
  // 5 thematic maps
  await tap(266, 520); await idle(); ok('Thematic Maps opens', await cur() === 'them');
  for (const [i, f] of ['tm1', 'tm2', 'tm3'].entries()) { await tap(600, 60 + i * 32); await p.waitForTimeout(150); ok(`thematic option ${i + 1} shows its map`, (await E(() => document.getElementById('tmImg').src)).includes(f + '.jpg')); }
  await tap(900, 700);
  // 6 images
  await tap(497, 520); await idle(); ok('Images opens', await cur() === 'imgs');
  { const q = await panelOf('imgs'); ok('only butterflies with pictures are listed (5 families, 111 genera, 170 species as in the original)', q.c.join('/') === '5/111/170', q.c.join('/')); }
  await tap(940, 130); await tap(940, 357); await idle(); ok('Species Search opens the species window', await cur() === 'det');
  await tap(365, 62); await p.waitForTimeout(500); ok('and its pictures show', await p.waitForFunction(() => { const i = document.getElementById('dImg'); return i && i.complete && i.naturalWidth > 0; }, null, { timeout: 30000 }).then(() => true).catch(() => false));
  await tap(1000, 31); await tap(900, 700);
  // 7 text search
  await tap(737, 460); await idle(); ok('Text search opens', await cur() === 'txt');
  { const r = await E(async () => { const s = built.txt.sel; const names = [...s.cname.options].map(o => o.value).filter(Boolean); s.cname.value = names[0]; s.cname.onchange(); document.querySelector('#txt .gbtn').click; return names.length; }); ok(`common names listed for English (${r})`, r > 50); }
  await E(() => { const s = built.txt.sel; s.cname.value = [...s.cname.options][1].value; s.cname.onchange(); }); await tap(359, 61); await p.waitForTimeout(200);
  { const q = await panelOf('txt'); ok('Common Name Search lists the butterflies with that name', q.c[2] > 0 && q.t.includes('common name'), q.t); }
  await E(() => { const s = built.txt.sel; s.st.value = 'Karnataka'; s.st.onchange(); s.dist.value = 'Kodagu'; s.dist.onchange(); }); await tap(359, 172); await p.waitForTimeout(200);
  { const q = await panelOf('txt'); const want = await E(() => makeSet(Object.values(SB.pol.Karnataka.Kodagu).flatMap(unpack)).sps.length); ok(`Political Boundary Search: Kodagu ${want} species`, q.c[2] == want && want > 0, q.c.join('/')); }
  await E(() => { const s = built.txt.sel; s.fam.value = 'LYCAENIDAE'; s.fam.onchange(); s.gen.value = 'Abisara'; s.gen.onchange(); s.spp.value = 'Abisara echerius'; s.spp.onchange(); }); await tap(359, 332); await idle();
  ok('Scientific Name Search opens the species window', await cur() === 'det' && await E(() => DET.name) === 'Abisara echerius');
  await tap(1000, 31);
  { const r = await E(async () => { const s = built.txt.sel; s.hpl.value = s.hpl.options[3].value; s.hpl.onchange(); await new Promise(r => setTimeout(r, 50)); return s.bl.items.length; }); ok('Host Plant: butterflies that use the plant', r > 0, String(r)); }
  { const r = await E(async () => { const s = built.txt.sel; s.bsp.value = s.bsp.options[2].value; s.bsp.onchange(); await new Promise(r => setTimeout(r, 50)); return s.hl.items.length; }); ok('Butterfly: its host plants', r > 0, String(r)); }
  await tap(900, 700);
  // every butterfly, genus and family opens on every tab; every picture exists
  const rnd = await p.evaluate(async () => { const bad = []; const ids = SB.sp.map(r => r[0]);
    for (const id of ids) { try { await detail('S', id); for (const t of ['tax', 'map', 'dist', 'syn', 'cm', 'src', 'img']) showTab(t); } catch (e) { bad.push(id + ':' + e.message); } }
    const al = ALL(); for (const f of al.fams) { try { await detail('F', f); for (const t of ['tax', 'map', 'dist', 'src']) showTab(t); } catch (e) { bad.push(f + ':' + e.message); } }
    for (const g of al.gens) { try { await detail('G', g[0]); for (const t of ['tax', 'map', 'dist', 'src']) showTab(t); } catch (e) { bad.push(g[0] + ':' + e.message); } } return bad; });
  ok(`all ${NSP} butterflies, all families and all genera open on every tab without error`, rnd.length === 0, rnd.slice(0, 5).join('; '));
  if (!SMALL) { const miss = await p.evaluate(async () => { const m = []; const files = [...Object.values(SB.im).flat(), ...Object.values(SB.hpi).flat()].map(x => x[0]); for (const f of files) { const r = await fetch('img/photos/' + encodeURIComponent(f)); if (!r.ok) m.push(f); } return m; }); ok('every listed butterfly and host plant picture is present', miss.length === 0, miss.slice(0, 3).join(',')); }
  // exit
  await p.evaluate(() => go('open')); await tap(900, 700); await p.waitForTimeout(400); ok('Exit closes the program', await p.evaluate(() => getComputedStyle(document.getElementById('quit')).display === 'flex'));
  if (!LIVE && !OPEN_FILE && SMALL) ok('pictures came from the IBIN web copy', remoteHits.some(r => r.startsWith('img/photos/')), remoteHits.length + ' files');
  ok('no script errors', errors.length === 0, errors.slice(0, 5).join(' | '));
  ok('no failed downloads', bad.filter(x => !OPEN_FILE || !x.startsWith('0 ')).length === 0, bad.slice(0, 5).join(' | '));
  ok('no unexpected messages', dialogs.length === 0, dialogs.join(' | '));
  console.log(`${APP} ${MODE}${OPEN_FILE ? ' OFFLINE ZIP ' + OPEN_FILE : SMALL ? ' small-installer' : LIVE ? ' LIVE web page' : ''}\n` + results.join('\n') + `\n${failed ? failed + ' FAILED' : 'ALL PASSED'} (${results.length} checks)`);
  await b.close(); srv.close(); process.exit(failed ? 1 : 0);
})().catch(e => { console.log(results.join('\n') + '\nCRASH ' + e.stack); process.exit(2); });
