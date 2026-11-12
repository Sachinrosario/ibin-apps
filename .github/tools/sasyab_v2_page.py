#!/usr/bin/env python3
"""Sasya Bharathi Version 2 page = the Version 1 page plus today's names (in brackets), IUCN status and DNA records.
Every fix made to Version 1 reaches Version 2 by running this again.
usage: python3 .github/tools/sasyab_v2_page.py apps/sasya-bharathi/web/index.html apps/sasya-bharathi-2/web/index.html"""
import sys
src, dst = sys.argv[1:3]
s = open(src, encoding='utf-8').read()
def R(a, b):
    global s
    assert s.count(a) == 1, ('patch point not found once', a[:80]); s = s.replace(a, b)
R("<title>Sasya Bharathi</title>", "<title>Sasya Bharathi – Version 2</title>")
R("/* Sasya Bharathi (India) 2004-05 - Version 1, faithful web rebuild.", "/* Sasya Bharathi (India) 2004-05 - Version 2: the Version 1 rebuild with today's names (Catalogue of Life) in brackets,\n   IUCN Red List status and DNA (GenBank, BOLD) records added. Version 1 notes follow.")
import re, json, os
v2 = json.load(open(os.path.join(os.path.dirname(dst), '..', 'release.json')))['version']
s, k = re.subn(r"const VERSION = '1\.[0-9.]+';", f"const VERSION = '{v2}';", s); assert k == 1
R("<div>Updated in 2026 by Dr. Sachin A. Rosario &middot; <span id=\"ver\"></span></div></div>", "<div>Updated in 2026 by Dr. Sachin A. Rosario &middot; <span id=\"ver\"></span></div><div style=\"font-weight:400;font-size:12px\">Names in brackets: Catalogue of Life (2026) &middot; IUCN Red List and DNA records added</div></div>")
R("$('ver').textContent = 'Version ' + VERSION;", "$('ver').textContent = 'Version 2 (' + VERSION + ')';")
R("const LABEL = t => t;", """// ---------- Version 2: current names ----------
const NOWC = new Map(), NOWF = new Map(), NOWN = new Map();
const upKey = r => [r[2], r[3]].concat(r[4] ? ['subsp. ' + r[4]] : [], r[5] ? ['var. ' + r[5]] : []).join(' ');
function initUpdates() {
  if (!SB.up) return;
  for (const [f, now] of Object.entries(SB.up.fam)) NOWF.set(f, now);
  for (const r of SB.sp) { const u = SB.up.sp[upKey(r)]; if (!u) continue; NOWN.set(r[0], u);
    if (u[0]) { if (r[8]) NOWC.set(r[8].toLowerCase(), u[0]); if (!r[4] && !r[5] && !NOWC.has(r[7].toLowerCase())) NOWC.set(r[7].toLowerCase(), u[0].split(' ').slice(0, 2).join(' ')); } }
}
function LABEL(t) { const k = String(t).trim().replace(/\\s+/g, ' ').toLowerCase(); const c = NOWC.get(k); if (c && c.toLowerCase() !== k) return `${t} (${c})`; const f = NOWF.get(k); if (f) return `${t} (${f})`; return t; }""")
R("    $('dTitle').textContent = `Digitized Inventory of ${D.name} in entire India`;", "    $('dTitle').textContent = `Digitized Inventory of ${LABEL(D.name)} in entire India`;")
R("""  v.forEach((t, i) => B.append(pos(el('div', { class: 'hval' }, esc(t)), 556, 199 + 48 * i)));
}""", """  v.forEach((t, i) => B.append(pos(el('div', { class: 'hval' }, esc(i === 5 ? LABEL(t) : t)), 556, 199 + 48 * i)));
  const card = pos(el('div', { class: 'abs', style: { background: 'rgba(255,255,255,.88)', border: '1px solid #7d0000', font: '13px/19px var(--arial)', color: '#202020', padding: '6px 10px', boxSizing: 'border-box' } }), 330, 486, 706);
  const lnk = (u, t) => `<a href="${u}" target="_blank" rel="noopener" style="color:#00e">${t}</a>`;
  if (D.kind === 'S') { const u = NOWN.get(D.key); const nm = upKey(D.row);
    if (u) { const dna = u[7] || nm;
      card.innerHTML = `<b>Name in 2005:</b> <i>${esc(nm)}</i><br><b>Catalogue of Life (2026):</b> <i>${esc(u[0] || nm)}</i> ${esc(u[1])} &nbsp;[${esc(u[0] ? (u[2] === 'accepted' ? 'accepted' : u[2] + ' of the name above') : u[2])}]` +
        (u[3] ? `<br><b>Family now:</b> ${esc(u[3])}` : '') + `<br><b>IUCN Red List now:</b> ${esc(u[4] || 'not assessed / not found')}` +
        (u[7] || u[5] ? `<br><b>DNA:</b> ${lnk('https://www.ncbi.nlm.nih.gov/nuccore/?term=' + encodeURIComponent('"' + dna + '"[Organism]'), 'GenBank ' + u[5] + ' sequences')}, ${u[6]} COI barcodes &middot; ${lnk('https://portal.boldsystems.org/result?query=' + encodeURIComponent(dna + '[tax]'), 'BOLD Systems')}` : '<br><b>DNA:</b> not looked up (the name is not known at species level)');
    } else card.innerHTML = `<b>Name in 2005:</b> <i>${esc(nm)}</i><br>Not found in the Catalogue of Life.`; }
  else { const f = D.kind === 'F' ? NOWF.get(D.key.toLowerCase()) : null; card.innerHTML = D.kind === 'F' ? `<b>Family in 2005:</b> ${esc(fam)}<br><b>Family now (Catalogue of Life 2026):</b> ${esc(f || fam)}${f ? '' : ' (unchanged)'}` : `<b>Genus:</b> ${esc(D.key)} &middot; the current names of its species are shown in brackets in the lists.`; }
  B.append(card);
}""")
R("B.append(pos(el('div', { class: 'abs', style: { font: '22px var(--arial)', color: '#804000', textAlign: 'center' } }, `${esc(nm)}&nbsp; [${STLAB[D.row[6]]}]`), 318, 10, 732));",
  "B.append(pos(el('div', { class: 'abs', style: { font: '22px var(--arial)', color: '#804000', textAlign: 'center' } }, `${esc(LABEL(nm))}&nbsp; [${STLAB[D.row[6]]}]`), 318, 10, 732));")
R("loadJs('data/core.js').then(() => { initData(); busy(false); })", "loadJs('data/core.js').then(() => loadJs('data/updates.js').catch(() => {})).then(() => { initData(); initUpdates(); busy(false); })")
R("const REMOTE = 'https://sachinrosario.github.io/ibin-apps/sasya-bharathi/';", "const REMOTE = 'https://sachinrosario.github.io/ibin-apps/sasya-bharathi/'; // Version 1's copy of the plant records and pictures (shared)")
open(dst, 'w', encoding='utf-8').write(s)
print('Version 2 page written')
