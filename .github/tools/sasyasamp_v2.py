#!/usr/bin/env python3
"""Sasya Sampada Version 2 = the separate Sasya Sampada program plus today's names (in brackets), threat status,
synonyms now, common names now and plant DNA barcodes (rbcL, matK, ITS, trnH-psbA, BOLD).
Writes apps/sasya-sampada-2/web from apps/sasya-sampada/web, with data/updates.js and data/u/N.js from the lookups.
usage: python3 .github/tools/sasyasamp_v2.py <taxa dir> <extra dir>"""
import sys, os, json, glob, shutil, zlib, collections, csv
TD, XD = sys.argv[1:3]
SRC, OUT = 'apps/sasya-sampada/web', 'apps/sasya-sampada-2/web'
ver = json.load(open('apps/sasya-sampada-2/release.json'))['version']
if os.path.isdir(OUT):
    for x in os.listdir(OUT):
        if x not in ('SHARED_FOLDERS',): (shutil.rmtree if os.path.isdir(os.path.join(OUT, x)) else os.remove)(os.path.join(OUT, x))
shutil.copytree(SRC, OUT, dirs_exist_ok=True)
# ---- data
T = {}
for f in sorted(glob.glob(os.path.join(TD, '*.json'))): T.update(json.load(open(f)))
X = {}
for f in sorted(glob.glob(os.path.join(XD, '*-extra-*.json'))): X.update(json.load(open(f)))
LAB = {'LEAST_CONCERN': 'Least Concern (LC)', 'NEAR_THREATENED': 'Near Threatened (NT)', 'VULNERABLE': 'Vulnerable (VU)', 'ENDANGERED': 'Endangered (EN)', 'CRITICALLY_ENDANGERED': 'Critically Endangered (CR)',
       'NOT_EVALUATED': 'Not Evaluated (NE)', 'DATA_DEFICIENT': 'Data Deficient (DD)', 'EXTINCT': 'Extinct (EX)', 'EXTINCT_IN_THE_WILD': 'Extinct in the Wild (EW)'}
up = {}; rows = []
for k, x in T.items():
    genus_only = x.get('col_match') in ('higherrank', 'none', 'error') and len((x.get('accepted') or x.get('col_name') or '').split()) < 2
    acc = '' if genus_only else ' '.join((x.get('accepted') or (x.get('col_name') if x.get('col_status') == 'accepted' else '') or '').split())
    if acc.lower() == k.lower(): acc = ''
    up[k] = [acc, '' if genus_only else (x.get('accepted_author') or x.get('col_author') or ''), 'not found (only the genus)' if genus_only else (x.get('col_status') or 'not found'),
             x.get('family') or '', '' if genus_only else LAB.get(x.get('iucn'), x.get('iucn') or ''), '' if genus_only else (x.get('dna_name') or '')]
    e = X.get(up[k][5]) or {}; n = e.get('ncbi') or {}
    rows.append([k, acc or k, up[k][2], up[k][3], up[k][4], n.get('all', ''), n.get('rbcL', ''), n.get('matK', ''), n.get('ITS', ''), n.get('trnH-psbA', ''), e.get('bold', ''), len(e.get('syn') or []), '; '.join(f'{a}: {b}' for a, b, _ in e.get('cm') or [])])
open(os.path.join(OUT, 'data', 'updates.js'), 'w', encoding='utf-8').write('window.SSD=window.SSD||{};SSD.updates=' + json.dumps(up, ensure_ascii=False, separators=(',', ':')) + ';\n')
parts = collections.defaultdict(dict)
for k, r in X.items():
    n = r.get('ncbi') or {}
    parts[zlib.crc32(k.lower().encode()) % 20][k] = {'s': r.get('syn') or [], 'c': r.get('cm') or [], 'n': [n.get('all', 0), n.get('rbcL', 0), n.get('matK', 0), n.get('ITS', 0), n.get('trnH-psbA', 0)], 'nn': r.get('ncbi_name') or k, 'b': r.get('bold'), 'd': r.get('checked')}
for i in range(20):
    open(os.path.join(OUT, 'data', f'u{i}.js'), 'w', encoding='utf-8').write('window.SSD=window.SSD||{};SSD["u' + str(i) + '"]=' + json.dumps(parts.get(i, {}), ensure_ascii=False, separators=(',', ':')) + ';\n')
with open('apps/sasya-sampada-2/name-changes.csv', 'w', newline='', encoding='utf-8') as f:
    w = csv.writer(f); w.writerow(['Name in the program', 'Name now (Catalogue of Life)', 'Catalogue of Life status', 'Family now', 'IUCN Red List now', 'GenBank sequences', 'rbcL', 'matK', 'ITS', 'trnH-psbA', 'BOLD public barcode records', 'Synonyms now', 'Common names now']); w.writerows(rows)
print(len(up), 'names;', sum(1 for v in up.values() if v[0]), 'changed;', sum(1 for v in up.values() if v[4] and v[4][-3:-1] in ('CR', 'EN', 'VU')), 'threatened;', len(X), 'extra lookups')
# ---- page
p = os.path.join(OUT, 'index.html'); s = open(p, encoding='utf-8').read()
def R(a, b):
    global s
    assert s.count(a) == 1, ('patch point', s.count(a), a[:80]); s = s.replace(a, b)
import re
s, k = re.subn(r"const VERSION = '[0-9.]+';", f"const VERSION = '{ver}';", s); assert k == 1
R("<title>Sasya Sampada – Medicinal &amp; Economically Important Plants</title>", "<title>Sasya Sampada – Version 2</title>")
R("'Proprietary right holder - Dr. K.N. Ganeshaiah  \\u00b7  Updated in 2026 by Dr. Sachin A. Rosario  \\u00b7  Version ' + VERSION",
  "'Proprietary right holder - Dr. K.N. Ganeshaiah  \\u00b7  Updated in 2026 by Dr. Sachin A. Rosario  \\u00b7  Version 2 (' + VERSION + '): names now in brackets'")
R("Promise.all([script(U + 'layout.js').then(() => window.SSD.layout), load('core')])", "Promise.all([script(U + 'layout.js').then(() => window.SSD.layout), load('core'), load('updates')])")
R("const key = r => (r[1] + ' ' + r[2]).toLowerCase().trim();", """const key = r => (r[1] + ' ' + r[2]).toLowerCase().trim();
// ---------- Version 2: today's names, status, synonyms, common names and DNA barcodes ----------
const upKey = r => [r[1], r[2], has(r[3]) ? 'subsp. ' + r[3] : '', has(r[4]) ? 'var. ' + r[4] : ''].filter(Boolean).join(' ').replace(/\\s+/g, ' ');
const NOW = r => (window.SSD.updates || {})[upKey(r)];
const LBL = r => { const u = NOW(r); return u && u[0] ? `${nm(r)} (${u[0]})` : nm(r); };
async function extra(r) { const u = NOW(r); if (!u || !u[5]) return null; const i = crc32(u[5].toLowerCase()) % 20; await load('u' + i).catch(() => null); return ((window.SSD['u' + i]) || {})[u[5]] || null; }
const crc32 = (() => { const T = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; T[n] = c >>> 0; } return s => { let c = 0xFFFFFFFF; for (const b of new TextEncoder().encode(s)) c = T[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }; })();
const lnk = (u, t) => `<a href="${u}" target="_blank" rel="noopener" style="color:#00e">${t}</a>`;
function nowPanel(d, x, y, w, h, title, html) { const b = el('div', `position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;background:#ffffe8;border:2px solid #7d0000;box-sizing:border-box;padding:5px 8px;overflow:auto;font:12px/16px Arial,Helvetica,sans-serif;color:#202020;z-index:2;`, d, 'lst v2x');
  b.innerHTML = `<div style="font:bold 12px Arial;color:#7d0000;margin-bottom:4px">${title}</div>` + html; return b; }""")
R("  status.textContent = nm(r);", "  status.textContent = LBL(r);")
R("openWin('tax', {title: 'Classification of ' + nm(r)})", "openWin('tax', {title: 'Classification of ' + LBL(r)})")
R("""    hot(87, 136, 72, 30, d, () => d.close()); hot(231, 136, 72, 30, d, () => d.close());
  },""", """    hot(87, 136, 72, 30, d, () => d.close()); hot(231, 136, 72, 30, d, () => d.close());
    const u = NOW(r), me = cur;
    extra(r).then(x => { if (cur !== me || !d.isConnected) return; const esc = CL.esc; let h = `<b>Name in the program:</b> <i>${esc(upKey(r))}</i>`;
      if (!u) h += '<br>Not looked up.'; else if (/only the genus/.test(u[2])) h += '<br>The Catalogue of Life knows only the genus of this name, so there is no current name, status or DNA record for it.';
      else { h += `<br><b>Catalogue of Life (2026):</b> <i>${esc(u[0] || upKey(r))}</i> ${esc(u[1])} [${esc(u[0] ? (u[2] === 'accepted' ? 'accepted' : u[2] + ' of the name above') : u[2])}]` + (u[3] ? `<br><b>Family now:</b> ${esc(u[3])}` : '') + `<br><b>IUCN Red List now:</b> ${esc(u[4] || 'not assessed / not found')}`;
        if (x) { const g = t => 'https://www.ncbi.nlm.nih.gov/nuccore/?term=' + encodeURIComponent('"' + x.nn + '"[Organism]' + (t ? ' AND ' + t : ''));
          h += `<br><b>DNA barcodes</b> (GenBank; checked ${esc(x.d || '')}): ${lnk(g(''), x.n[0] + ' sequences')} &middot; rbcL ${lnk(g('rbcL[All Fields]'), x.n[1])} &middot; matK ${lnk(g('matK[All Fields]'), x.n[2])} &middot; ITS ${lnk(g('"internal transcribed spacer"[All Fields]'), x.n[3])} &middot; trnH-psbA ${lnk(g('"trnH-psbA"[All Fields]'), x.n[4])}` +
               `<br><b>BOLD Systems:</b> ${x.b == null ? 'not found' : x.b + ' public barcode records'} &middot; ${lnk('https://portal.boldsystems.org/result?query=' + encodeURIComponent(u[5] + '[tax]'), 'open in BOLD')}`; } }
      nowPanel(d, 437, 0, 500, 411, 'Names now – Version 2 (2026)', h); });
  },""")
R("openWin('cm', {title: 'List Common Names for the Species ' + nm(r)})", "openWin('cm', {title: 'List Common Names for the Species ' + LBL(r)})")
R("""    label(d, 6, 447, 400, 14, `common names are available in ${by.size} Languages`, '11px Arial,Helvetica,sans-serif', '#000');
  },""", """    label(d, 6, 447, 400, 14, `common names are available in ${by.size} Languages`, '11px Arial,Helvetica,sans-serif', '#000');
    const me = cur; extra(r).then(x => { if (cur !== me || !d.isConnected) return; const esc = CL.esc; let h = '';
      if (!x || !x.c.length) h = 'No common names in English or the languages of India are recorded today for this plant.';
      else { let last = ''; for (const [l, n, src] of x.c) { if (l !== last) { h += `<div style="margin-top:4px;color:#008080;font-weight:bold">${esc(l)}</div>`; last = l; } h += `<div title="${esc(src)}">${esc(n)}</div>`; } h += `<div style="margin-top:6px;color:#555;font-size:11px">${x.c.length} names (sources shown when you hold the mouse on a name)</div>`; }
      nowPanel(d, 518, 0, 420, 472, 'Common names now – GBIF (2026)', h); });
  },""")
R("d = openWin('syn', {title: 'List of Floras which qualifies the species ' + nm(r)});", "d = openWin('syn', {title: 'List of Floras which qualifies the species ' + LBL(r)});")
R("""    if (ent[0]) show(ent[0][1]);
  },""", """    if (ent[0]) show(ent[0][1]);
    const me = cur, u = NOW(r); extra(r).then(x => { if (cur !== me || !d.isConnected) return; const esc = CL.esc; let h = '';
      if (!x) h = 'The name is not known to the Catalogue of Life at species level, so it has no synonyms there.';
      else { h = `<div style="margin-bottom:3px"><b>Accepted name:</b> <i>${esc(u[0] || upKey(r))}</i> ${esc(u[1])}</div>` + (x.s.length ? x.s.map(([n, a, k]) => `<span style="display:inline-block;margin-right:14px" title="${k}">${k === 'homotypic' ? '&equiv;' : k === 'misapplied' ? '&ne;' : '='} <i>${esc(n)}</i> ${esc(a)}</span>`).join('') + `<div style="color:#555;font-size:11px;margin-top:3px">&equiv; same type (homotypic) &nbsp; = different type (heterotypic) &middot; ${x.s.length} names</div>` : 'No synonyms are listed.'); }
      nowPanel(d, 0, 538, 787, 160, 'Synonyms now – Catalogue of Life (2026)', h); });
  },""")
R("ids.map(id => nm(SPI.get(id))), A12, BK, null, {lh: '14px', ondbl:", "ids.map(id => LBL(SPI.get(id))), A12, BK, null, {lh: '14px', ondbl:")
R("l.ids = ids; l.set(ids.map(id => nm(SPI.get(id))));", "l.ids = ids; l.set(ids.map(id => LBL(SPI.get(id))));")
R("ids = keys.map(k => byKey.get(k)).filter(Boolean); l.set(ids.map(id => nm(SPI.get(id))));", "ids = keys.map(k => byKey.get(k)).filter(Boolean); l.set(ids.map(id => LBL(SPI.get(id))));")
open(p, 'w', encoding='utf-8').write(s)
print('Version 2 page written', ver)
