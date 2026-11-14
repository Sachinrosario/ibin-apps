// Full feature test of the Mapping programs (Western Ghats, Eastern Ghats; Version 1 and 2), run before every release.
// usage: node tests/mapping.test.js <app folder> [desktop|phone] [small|live]
//   small = like the small installers;  live = test the published page itself;
//   OPEN_FILE=<.../Open Kit.html> = test an extracted offline zip with no internet
const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const APP = process.argv[2] || 'eastern-ghats-mapping', MODE = process.argv[3] || 'desktop', LIVE = process.argv[4] === 'live', OPEN_FILE = process.env.OPEN_FILE;
const ROOT = path.join(__dirname, '..', 'apps');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.css': 'text/css', '.webmanifest': 'application/manifest+json' };
const srv = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split('?')[0]); let f = null;
  if (u.startsWith('/app/')) f = path.join(ROOT, APP, 'web', u.slice(5) || 'index.html');
  if (!f || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
}).listen(0);
const results = []; let failed = 0;
const ok = (name, cond, extra) => { results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  (' + extra + ')' : ''}`); if (!cond) failed++; };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext(MODE === 'phone' ? { ...devices['iPhone 13'], isMobile: true, hasTouch: true } : { viewport: { width: 1366, height: 768 } });
  const p = await ctx.newPage();
  const errors = [], bad = [];
  p.on('pageerror', e => errors.push(e.message));
  p.on('dialog', d => d.dismiss());
  // the optional Pictures pack (pack/...) is not part of the web copy: its probes may fail
  p.on('response', r => { const u = r.url(); if (r.status() >= 400 && !/\/pack\//.test(u)) bad.push(r.status() + ' ' + u); });
  if (OPEN_FILE) await ctx.route(/^https?:/, rt => rt.abort());
  await p.goto(OPEN_FILE ? 'file://' + OPEN_FILE : LIVE ? `https://sachinrosario.github.io/ibin-apps/${APP}/?t=${Date.now()}` : `http://localhost:${srv.address().port}/app/index.html`);
  await p.waitForFunction(() => window.AM_CORE && window.AM_MAP && window.AM_DETAIL && typeof show === 'function', null, { timeout: 120000 });
  await p.waitForTimeout(500);
  const tap = async sel => { const h = await p.$(sel); if (!h) { ok('control exists: ' + sel, false); return false; } try { if (MODE === 'phone') await h.tap({ timeout: 8000 }); else await h.click({ timeout: 8000 }); } catch (e) { ok('control can be pressed: ' + sel, false, e.message.split('\n')[0]); return false; } await p.waitForTimeout(300); return true; };
  const on = id => p.evaluate(id => document.getElementById(id).classList.contains('on'), id);
  const REGION = await p.evaluate(() => /Eastern/.test(document.title) ? 'Eastern' : /Western/.test(document.title) ? 'Western' : 'Andaman');
  const V2 = await p.evaluate(() => /\b2\b|Version 2/.test(document.title) || (window.AM_CORE.version || '').startsWith('2'));
  // the screen must really show on this screen size (on phones the page once went blank)
  { const im = require('pngjs').PNG.sync.read(await p.screenshot()); let lit = 0, n = 0; for (let i = 0; i < im.data.length; i += 64) { n++; if (im.data[i] + im.data[i + 1] + im.data[i + 2] > 40) lit++; }
    ok(`the program is visible on this screen (${Math.round(100 * lit / n)}% drawn)`, lit / n > 0.25 && await p.evaluate(() => innerWidth <= document.documentElement.clientWidth + 1)); }
  ok(`opening screen: ${REGION} title and the splash map`, await p.evaluate(R => document.querySelector('#splash .t1').textContent.includes(R) && document.querySelector('#splash .bgi').naturalWidth > 0, REGION));
  ok('credit lines and version are on the program', await p.evaluate(() => /Proprietary right holder:? -? ?Dr\. K\.N\. Ganeshaiah/.test(document.body.innerHTML) && /Updated in 2026 by Dr\. Sachin A\. Rosario/.test(document.body.innerHTML) && /Version \d/.test(document.getElementById('ftVer').textContent)));
  await tap('#spCred'); ok('Credits shows the team and the team photograph', await on('credits') && await p.evaluate(() => [...document.querySelectorAll('#credits img')].every(i => i.complete && i.naturalWidth > 0) && document.getElementById('creditsTxt').textContent.length > 200));
  await tap('#crBack'); ok('Back returns to the opening screen', await on('splash'));
  await tap('#spNext'); ok('Next opens Data Recovery Modules', await on('mods'));

  // ---- Textform search: genus + species
  await tap('#mTxt'); ok('Textform Search opens', await on('txt'));
  const sp = await p.evaluate(() => { const C = window.AM_CORE; const ids = new Set(Object.keys(window.AM_MAP.sg)); const r = C.sp.find(r => r[7] && r[6] && ids.has(String(r[0])) && window.AM_DETAIL.d[r[0]] && window.AM_DETAIL.d[r[0]][0].length && window.AM_DETAIL.d[r[0]][1].length) || C.sp.find(r => r[7] && ids.has(String(r[0]))); return { id: r[0], genus: r[1], name: r[2], fl: !!r[6] }; });
  await p.selectOption('#cGenus', sp.genus); await p.waitForTimeout(200);
  await p.selectOption('#cSpecies', sp.name); await tap('#tSearch');
  const n1 = await p.evaluate(() => document.getElementById('tList').children.length);
  ok('search by genus and species lists the species', n1 >= 1, sp.name);
  await tap('#tList > div:first-child');
  await tap('#tMore'); ok('More details opens the Digitized Inventory', await on('det') && await p.evaluate((n) => document.getElementById('dTitle').textContent.includes(n), sp.name), await p.evaluate(() => document.getElementById('dTitle').textContent));
  if (REGION !== 'Andaman') ok(`title says "in ${REGION} Ghat"`, await p.evaluate(R => document.getElementById('dTitle').textContent.endsWith('in ' + R + ' Ghat'), REGION));

  // ---- every tab of the Digitized Inventory
  for (const [k, name] of [['tax', 'Taxonomic Hierarchy'], ['map', 'Distribution map'], ['img', 'Images'], ['fl', 'Fliers'], ['dis', 'Distribution data'], ['syn', 'Synonym data'], ['com', 'Common Names']]) {
    await tap(`#det .bar img[data-p="${k}"]`); await p.waitForTimeout(k === 'map' ? 1200 : 600);
    const st = await p.evaluate(k => { const e = document.getElementById('p_' + k); const imgs = [...e.querySelectorAll('img')]; const cv = e.querySelector('canvas'); let ink = 0;
      if (cv) { const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; const c0 = d.slice(0, 3).join(); for (let i = 0; i < d.length; i += 400) if (d.slice(i, i + 3).join() !== c0) ink++; }
      return { on: e.classList.contains('on'), txt: e.textContent.trim().length, imgs: imgs.map(i => [i.src.split('/').slice(-2).join('/'), i.complete && i.naturalWidth > 0]), ink }; }, k);
    if (k === 'img' || k === 'fl') {
      await p.waitForFunction(k => [...document.querySelectorAll('#p_' + k + ' img')].every(i => i.complete), k, { timeout: 15000 }).catch(() => {});
      const im = await p.evaluate(k => [...document.querySelectorAll('#p_' + k + ' img')].map(i => [i.src.split('/').slice(-2).join('/'), i.naturalWidth > 0]), k);
      ok(`${name}: shows ${k === 'fl' ? 'the first slide of the flier' : 'the picture'}`, st.on && im.length > 0 && im.every(x => x[1]), JSON.stringify(im).slice(0, 140));
    } else if (k === 'map') ok(`${name}: the map is drawn`, st.on && st.ink > 50, 'coloured points ' + st.ink);
    else ok(`${name}: page has content`, st.on && st.txt > 20, st.txt + ' characters');
  }
  if (V2) {
    await tap('#det .bar img[data-p="tax"]');
    ok('Version 2: taxonomy has today\'s name, IUCN status and DNA barcodes', await p.evaluate(() => { const t = document.getElementById('p_tax').textContent; return /Catalogue of Life/.test(t) && /IUCN/.test(t) && /(rbcL|barcode)/i.test(t); }));
  }
  await tap('#dBack'); ok('Back returns to the search', await on('txt'));

  // ---- Textform search: habit, and language + common name
  await p.selectOption('#cHabit', { index: 1 }); await tap('#tSearch');
  ok('search by habit lists species', await p.evaluate(() => document.getElementById('tList').children.length > 10), await p.evaluate(() => document.getElementById('tCount').textContent));
  const cm = await p.evaluate(() => { const D = window.AM_DETAIL; for (const [id, v] of Object.entries(D.d)) if (v[0].length) return [D.langs[v[0][0][0]], v[0][0][1]]; });
  await p.selectOption('#cLang', cm[0]); await p.waitForTimeout(200);
  await p.selectOption('#cName', cm[1]).catch(() => {}); await tap('#tSearch');
  ok('search by language and common name lists the species', await p.evaluate(() => document.getElementById('tList').children.length >= 1), cm.join(' / '));
  await tap('#tBack'); ok('Back returns to the modules', await on('mods'));

  // ---- Gridwise search: select a grid on the map, list its species, open one
  await tap('#mGrid'); ok('Gridwise Search opens with the map', await on('grd') && await p.evaluate(() => { const d = document.getElementById('mapcv').getContext('2d').getImageData(0, 0, 640, 640).data; let k = 0; for (let i = 0; i < d.length; i += 400) if (d[i] + d[i + 1] + d[i + 2] < 700) k++; return k > 100; }));
  const gpt = await p.evaluate(() => { let best = -1, n = 0; for (const [sid, gs] of Object.entries(window.AM_MAP.sg)) for (const [g] of gs) {} const cnt = new Map(); for (const gs of Object.values(window.AM_MAP.sg)) for (const [g] of gs) cnt.set(g, (cnt.get(g) || 0) + 1);
    for (const [g, c] of cnt) if (c > n) { n = c; best = g; } const [x, y] = ctr(best), [a, bb] = proj(x, y), r = cv.getBoundingClientRect(), k = r.width / cv.width; return { x: r.left + a * k, y: r.top + bb * k, g: best, n }; });
  if (MODE === 'phone') await p.touchscreen.tap(gpt.x, gpt.y); else await p.mouse.click(gpt.x, gpt.y);
  await p.waitForTimeout(500);
  const gl = await p.evaluate(() => document.getElementById('gList').children.length);
  ok('clicking a grid lists the species recorded in it', gl > 0, `grid ${gpt.g}: ${gl} species (${gpt.n} in the data)`);
  if (gl) { await tap('#gList > div:first-child'); await tap('#gMore'); ok('More details opens the species from the grid', await on('det')); await tap('#dBack'); ok('Back returns to the map', await on('grd')); }
  await tap('.tool[data-t="info"]'); if (MODE === 'phone') await p.touchscreen.tap(gpt.x, gpt.y); else await p.mouse.click(gpt.x, gpt.y); await p.waitForTimeout(300);
  ok('Info tool shows the grid details', await p.evaluate(() => document.getElementById('gInfo').style.display === 'block' && document.getElementById('gInfo').textContent.length > 20));
  const v0 = await p.evaluate(() => view.x1 - view.x0); await tap('.tool[data-t="zin"]');
  ok('Zoom In tool zooms the map', await p.evaluate(v0 => view.x1 - view.x0 < v0, v0));
  await tap('.tool[data-t="all"]'); ok('Entire layer shows the whole map', await p.evaluate(() => Math.abs((view.x1 - view.x0) - (B.x1 - B.x0)) < 1e-6));
  for (const id of await p.evaluate(() => [...document.querySelectorAll('.lyr input')].filter(i => !i.checked).map(i => i.id))) await tap('#' + id);
  ok('every map layer can be switched on without errors', errors.length === 0);
  await tap('#gBack');

  // ---- Thematic maps: each map and its legend
  await tap('#mThe'); ok('Thematic Maps opens', await on('grd') && await p.evaluate(() => gmode === 'the'));
  const opts = await p.evaluate(() => [...document.querySelectorAll('#gOpts input')].map(i => i.value));
  let good = 0; for (const v of opts) { await tap(`#gOpts input[value="${v}"]`); if (await p.evaluate(() => document.getElementById('gLeg').textContent.length > 10)) good++; }
  ok(`all ${opts.length} thematic maps draw with a legend`, good === opts.length && opts.length >= (REGION === 'Andaman' ? 6 : 9), `${good}/${opts.length}`);
  await tap('#gExit'); ok('Exit says thank you', await p.evaluate(() => document.getElementById('msg').style.display === 'block' && /Thank you/.test(document.getElementById('msgT').textContent)));

  ok('no script errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  ok('no missing files', bad.length === 0, bad.slice(0, 4).join(' | '));
  console.log(`${APP} – ${MODE}${LIVE ? ' – live' : OPEN_FILE ? ' – offline zip' : ''}`); results.forEach(r => console.log(r));
  console.log(failed ? `${failed} FAILED` : `all ${results.length} checks passed`);
  await b.close(); srv.close(); process.exit(failed ? 1 : 0);
})().catch(e => { results.forEach(r => console.log(r)); console.error(e); process.exit(2); });
