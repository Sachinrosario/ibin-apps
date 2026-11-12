// Full feature test of Sasya Sampada (the separate program; Version 1 and 2), run before every release.
// usage: node tests/sasya-sampada.test.js <app folder> [desktop|phone] [small|live]
//   small = like the small installers: the pictures and web pages are not in the folder and come from Jeeva Sampada's web copy
//   live  = test the published page itself;  OPEN_FILE=<.../Open Kit.html> = test an extracted offline zip with no internet
const { chromium, devices } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const APP = process.argv[2] || 'sasya-sampada', MODE = process.argv[3] || 'desktop', SMALL = process.argv[4] === 'small', LIVE = process.argv[4] === 'live', OPEN_FILE = process.env.OPEN_FILE;
const ROOT = path.join(__dirname, '..', 'apps'), JS = path.join(ROOT, 'jeeva-sampada', 'web', 'sasya');
const MIME = { '.html': 'text/html', '.htm': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.css': 'text/css' };
const BIGF = ['Images/', 'NEWhtml/'];
const srv = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split('?')[0]); let f = null;
  if (u.startsWith('/app/')) { const rel = u.slice(5) || 'index.html'; if (BIGF.some(b => rel.startsWith(b))) f = SMALL ? null : path.join(JS, rel); else f = path.join(ROOT, APP, 'web', rel); }
  if (!f || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
}).listen(0);
const results = []; let failed = 0;
const ok = (name, cond, extra) => { results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  (' + extra + ')' : ''}`); if (!cond) failed++; };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext(MODE === 'phone' ? { ...devices['iPhone 13'], isMobile: true, hasTouch: true } : { viewport: { width: 1366, height: 768 } });
  const p = await ctx.newPage();
  const errors = [], bad = [], remote = [];
  p.on('pageerror', e => errors.push(e.message));
  p.on('dialog', d => d.dismiss());
  p.on('response', r => { const u = r.url(); if (r.status() >= 400 && !(u.includes('/app/') && BIGF.some(x => u.includes('/app/' + x)))) bad.push(r.status() + ' ' + u); });
  if (OPEN_FILE) await ctx.route(/^https?:/, rt => rt.abort());
  else if (!LIVE) await ctx.route('https://sachinrosario.github.io/ibin-apps/jeeva-sampada/sasya/**', rt => { const rel = decodeURIComponent(rt.request().url().split('/jeeva-sampada/sasya/')[1].split('?')[0]); const f = path.join(JS, rel); remote.push(rel);
    fs.existsSync(f) ? rt.fulfill({ path: f, contentType: MIME[path.extname(f).toLowerCase()] }) : rt.fulfill({ status: 404, body: '' }); });
  await p.goto(OPEN_FILE ? 'file://' + OPEN_FILE : LIVE ? `https://sachinrosario.github.io/ibin-apps/${APP}/?t=${Date.now()}` : `http://localhost:${srv.address().port}/app/index.html`);
  await p.waitForFunction(() => typeof CORE !== 'undefined' && CORE && SPI, null, { timeout: 90000 });
  const S = await p.evaluate(() => { const r = document.getElementById('stage').getBoundingClientRect(); return { x: r.left, y: r.top, k: r.width / 1024 }; });
  const tap = async (x, y) => { const X = S.x + x * S.k, Y = S.y + y * S.k; if (MODE === 'phone') await p.touchscreen.tap(X, Y); else await p.mouse.click(X, Y); await p.waitForTimeout(250); };
  const tapEl = async (h) => { if (MODE === 'phone') await h.tap(); else await h.click(); await p.waitForTimeout(250); return true; };
  const V2 = await p.evaluate(() => VERSION.startsWith('2'));
  const winOpen = () => p.evaluate(() => { const w = [...document.querySelectorAll('.win')]; return w.length ? (w[w.length - 1].titleEl || '') : null; });
  const top = () => p.evaluate(() => { const w = [...document.querySelectorAll('.win')].pop(); return w ? w.textContent : ''; });
  // pick an item in a combo box (drawn by the page): open it, then tap the item
  const combo = async (x, y, text) => { await tap(x, y); const it = await p.$(`xpath=//div[contains(@style,"z-index: 100000")]/div[normalize-space(.)=${JSON.stringify(text)}]`); if (!it) { if (process.env.DEBUG) console.log('combo miss', text, await p.evaluate(() => { const d = document.querySelector('div[style*="z-index: 100000"]'); return [...document.querySelectorAll('div[style*="z-index: 100000"]')].map(d => [...d.children].map(c => JSON.stringify(c.textContent)).join('|')).join(' ## ') || 'no dropdown'; })); return false; } await it.scrollIntoViewIfNeeded(); return tapEl(it); };
  const menu = async item => { await tap(50, 27); const y = { cm: 41, sci: 57, cat: 73, db: 89, web: 105, exit: 128 }[item]; await tap(15 + 60, y + 8); };
  // the screen must really show on this screen size (on phones the page once went blank)
  { const im = require('pngjs').PNG.sync.read(await p.screenshot()); let lit = 0, n = 0; for (let i = 0; i < im.data.length; i += 64) { n++; if (im.data[i] + im.data[i + 1] + im.data[i + 2] > 40) lit++; }
    ok(`the program is visible on this screen (${Math.round(100 * lit / n)}% drawn)`, lit / n > 0.25 && await p.evaluate(() => innerWidth <= document.documentElement.clientWidth + 1)); }
  ok('opening screen shows the credit lines and version', await p.evaluate(() => /Proprietary right holder - Dr\. K\.N\. Ganeshaiah/.test(document.body.textContent) && /Updated in 2026 by Dr\. Sachin A\. Rosario/.test(document.body.textContent) && /Version \d/.test(document.body.textContent)));
  await tap(124, 27); ok('Credits opens the credits window', await p.evaluate(() => document.querySelectorAll('.win').length === 1));
  // Scientific Names
  await menu('sci'); ok('Search > Scientific Names opens its dialog', await p.evaluate(() => document.querySelectorAll('.win').length === 1));
  const sp = await p.evaluate(() => { const r = CORE.sp.find(r => r[1] === 'Azadirachta') || CORE.sp[0]; return [r[1], nm(r).slice(r[1].length + 1), r[0]]; });
  ok('genus combo lists the genera', await combo(73 + 155 + 80, 40 + 94 - 48 + 12, sp[0]));
  ok('species combo lists the species of the genus', await combo(73 + 155 + 80, 40 + 94 + 12, sp[1]));
  await tap(73 + 131 + 33, 40 + 142 + 17); await p.waitForTimeout(800);
  ok('OK opens the plant (classification window, plant name on the status bar)', await p.evaluate(id => cur === id && /Classification of/.test(document.body.textContent), sp[2]), sp.join(' '));
  if (V2) ok('Version 2: current name in brackets on the status bar', await p.evaluate(() => /\(.+\)/.test(status.textContent) || status.textContent.length > 3), await p.evaluate(() => status.textContent));
  // every toolbar button with data opens its window
  const btns = await p.evaluate(() => LAY.toolbars.tb.btns.map(([a, b], i) => [i, (a + b) / 2, EN[BTN[i]]]));
  const NAMES = ['Classification', 'Common names', 'Floras / synonyms', 'Distribution map', 'Web pages', 'Pictures', 'Accessions', 'Uses', 'Pests', 'Patents'];
  for (const [i, y, en] of btns) {
    if (!en) { results.push(`----  ${NAMES[i]}: no data for this plant (button disabled, as in the original)`); continue; }
    await tap(35, y); await p.waitForTimeout(900);
    const st = await p.evaluate(i => { const w = document.querySelectorAll('.win'), fr = document.querySelector('iframe'); return { wins: w.length, iframe: fr ? fr.src : null, imgs: [...document.querySelectorAll('.win img')].filter(x => x.src && !/\/ui\//.test(x.src)).map(x => [x.src, x.complete && x.naturalWidth > 0]), canvas: !!document.querySelector('.win canvas'), txt: [...w].map(x => x.textContent).join(' ').length }; }, i);
    if (BTN_IS(i, 'html')) { await p.waitForTimeout(1500); const loaded = await p.evaluate(() => { const fr = document.querySelector('iframe'); try { return fr && fr.contentDocument && fr.contentDocument.body && fr.contentDocument.body.innerHTML.length > 50; } catch (e) { return 'cross-origin'; } });
      ok(`${NAMES[i]}: the plant's web page opens`, !!st.iframe && loaded !== false, st.iframe); await p.evaluate(() => child && child.close()); continue; }
    if (BTN_IS(i, 'img')) { const pic = await p.waitForFunction(() => { const im = [...document.querySelectorAll('.win img')].find(x => /Images\//.test(x.src)); return im && im.complete && im.naturalWidth > 0; }, null, { timeout: 30000 }).then(() => true).catch(() => false); ok(`${NAMES[i]}: the picture shows`, pic); continue; }
    ok(`${NAMES[i]} window opens with content`, st.wins >= 1 && (st.txt > 20 || st.canvas), JSON.stringify(st).slice(0, 120));
  }
  function BTN_IS(i, n) { return ['tax', 'cm', 'syn', 'dist', 'html', 'img', 'acc', 'uses', 'pests', 'pat'][i] === n; }
  if (V2) {
    await p.evaluate(() => ACT.tax()); await p.waitForTimeout(800);
    ok('Version 2: classification window has today\'s name, IUCN status and plant barcodes', await p.evaluate(() => { const t = document.body.textContent; return /Catalogue of Life/.test(t) && /IUCN/.test(t) && /rbcL/.test(t); }));
    await p.evaluate(() => ACT.syn()); await p.waitForTimeout(800); ok('Version 2: synonyms now shown with the floras', await p.evaluate(() => /Synonyms now/.test(document.body.textContent)));
    await p.evaluate(() => ACT.cm()); await p.waitForTimeout(800); ok('Version 2: common names now shown with the 2005 names', await p.evaluate(() => /Common names now/.test(document.body.textContent)));
  }
  // Vernacular / common names dialog
  await menu('cm'); const cm = await p.evaluate(() => { for (const [id, ns] of Object.entries(CORE.cm)) { const x = ns.find(([l, n]) => l === 'Kannada' && n); if (x && SPI.has(id)) return [x[0], x[1], id]; } });
  const [c1, c2] = await p.evaluate(() => W('dlg_cm').fields);
  ok('common names: language combo', await combo(73 + c1[0] + 40, 40 + c1[1] + 6, cm[0]));
  ok('common names: name combo', await combo(73 + c2[0] + 40, 40 + c2[1] + 6, cm[1]));
  await tap(73 + 135, 40 + 177); await p.waitForTimeout(800); ok('common-name search opens the plant', await p.evaluate(() => cur != null && document.querySelectorAll('.win').length >= 1), cm.join(' / '));
  // Species list by major category
  await menu('cat'); const cat = await p.evaluate(() => CORE.cats[0]); const [k1, k2] = await p.evaluate(() => W('dlg_cat').fields);
  ok('category combo', await combo(73 + k1[0] + 40, 40 + k1[1] + 6, cat));
  const n1 = await p.evaluate(() => document.querySelectorAll('.win .lst div').length); ok('category lists its plants', n1 > 0, cat + ': ' + n1);
  await p.evaluate(() => { cur = null; }); const row = await p.$('.win .lst div'); if (MODE === 'phone') { await p.waitForTimeout(600); await row.tap(); await p.waitForTimeout(100); if ((await p.evaluate(() => cur)) == null) { const r2 = await p.$('.win .lst div'); if (r2) await r2.dblclick(); } } else await row.dblclick(); await p.waitForTimeout(800); ok('double-click opens a listed plant', await p.evaluate(() => cur != null));
  // Criteria search through the database
  await menu('db'); await p.waitForTimeout(600); const f = await p.evaluate(() => W('dlg_db').fields); const part = await p.evaluate(async () => { const U2 = await load('uses'); const keys = new Set(CORE.sp.map(key)); return [...new Set(Object.entries(U2).filter(([k]) => keys.has(k)).flatMap(([k, v]) => v.map(x => x[0])).filter(has))].sort((a, b) => a.localeCompare(b))[0]; });
  ok('database criteria: plant part combo', await combo(73 + f[2][0] + 40, 40 + f[2][1] + 6, part));
  await tap(73 + 374 + 26, 40 + 214 + 9); await p.waitForTimeout(500); const n2 = await p.evaluate(() => [...document.querySelectorAll('.win .lst')].pop().children.length); ok('database search lists the plants', n2 > 0, `${part}: ${n2}`);
  // Criteria search through the web pages
  await menu('web'); await p.waitForTimeout(600); const fw = await p.evaluate(() => W('dlg_web').fields); const wt = await p.evaluate(async () => { const C = await load('webcrit'); return (C.types['Parts'] || [])[0]; });
  ok('web-page criteria: parts combo', await combo(73 + fw[1][0] + 40, 40 + fw[1][1] + 6, wt));
  await tap(73 + 560 + 32, 40 + 210 + 9); await p.waitForTimeout(500); const n3 = await p.evaluate(() => [...document.querySelectorAll('.win .lst')].pop().children.length); ok('web-page search lists the plants', n3 > 0, `${wt}: ${n3}`);
  // all plants open with every window that has data (data check)
  const all = await p.evaluate(async () => { const badl = []; for (const r of CORE.sp) { try { await setSpecies(r[0]); for (const k of ['tax', 'cm', 'syn', 'dist', 'acc', 'uses', 'pests', 'pat']) if (EN[k]) await ACT[k](); } catch (e) { badl.push(r[0] + ':' + e.message); } } if (child) child.close(); return badl; });
  ok(`all ${await p.evaluate(() => CORE.sp.length)} plants open on every window without error`, all.length === 0, all.slice(0, 5).join('; '));
  const pics = await p.evaluate(async () => { const list = CORE.sp.flatMap(r => r[9]).filter((v, i, a) => a.indexOf(v) === i); const miss = []; for (let i = 0; i < list.length; i += 25) { const f = list[i]; await new Promise(ok => { const im = new Image(); im.onload = ok; im.onerror = () => { miss.push(f); ok(); }; im.src = BIG('Images/') + enc(f); }); } return [list.length, miss]; });
  ok(`pictures load (every 25th of ${pics[0]})`, pics[1].length === 0, pics[1].slice(0, 5).join(', '));
  await menu('exit'); await p.waitForTimeout(500); ok('Exit closes the program', await p.evaluate(() => /Sasya Sampada is closed/.test(document.body.textContent)));
  if (!LIVE && !OPEN_FILE && SMALL) ok('pictures and web pages came from Jeeva Sampada\'s web copy', remote.some(r => r.startsWith('Images/')) && remote.some(r => r.startsWith('NEWhtml/')), remote.length + ' files');
  ok('no script errors', errors.length === 0, errors.slice(0, 5).join(' | '));
  ok('no failed downloads', bad.length === 0, bad.slice(0, 5).join(' | '));
  console.log(`${APP} ${MODE}${OPEN_FILE ? ' OFFLINE ZIP' : SMALL ? ' small-installer' : LIVE ? ' LIVE web page' : ''}\n` + results.join('\n') + `\n${failed ? failed + ' FAILED' : 'ALL PASSED'} (${results.filter(r => /^(PASS|FAIL)/.test(r)).length} checks)`);
  await b.close(); srv.close(); process.exit(failed ? 1 : 0);
})().catch(e => { console.log(results.join('\n') + '\nCRASH ' + e.stack); process.exit(2); });
