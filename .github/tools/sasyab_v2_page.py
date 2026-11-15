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
  const card = pos(el('div', { class: 'abs', style: { background: 'rgba(255,255,255,.9)', border: '1px solid #7d0000', font: '13px/19px var(--arial)', color: '#202020', padding: '5px 10px', boxSizing: 'border-box' } }), 300, 480, 766);
  const lnk = (u, t) => `<a href="${u}" target="_blank" rel="noopener" style="color:#00e">${t}</a>`;
  if (D.kind === 'S') { const u = NOWN.get(D.key); const nm = upKey(D.row);
    if (u) { const dna = u[7] || nm;
      card.innerHTML = `<b>Name in 2005:</b> <i>${esc(nm)}</i><br><b>Catalogue of Life (2026):</b> <i>${esc(u[0] || nm)}</i> ${esc(u[1])} &nbsp;[${esc(u[0] ? (u[2] === 'accepted' ? 'accepted' : u[2] + ' of the name above') : u[2])}]` +
        (u[3] ? `<br><b>Family now:</b> ${esc(u[3])}` : '') + `<br><b>IUCN Red List now:</b> ${esc(u[4] || 'not assessed / not found')}` +
        (D.ex ? (() => { const x = D.ex, g = t => 'https://www.ncbi.nlm.nih.gov/nuccore/?term=' + encodeURIComponent('"' + x.nn + '"[Organism]' + (t ? ' AND ' + t : ''));
            return `<br><b>DNA barcodes</b> (GenBank${x.nn !== dna ? ', filed as <i>' + esc(x.nn) + '</i>' : ''}; checked ${esc(x.d || '')}): ${lnk(g(''), x.n[0] + ' sequences')} &middot; rbcL ${lnk(g('rbcL[All Fields]'), x.n[1])} &middot; matK ${lnk(g('matK[All Fields]'), x.n[2])} &middot; ITS ${lnk(g('"internal transcribed spacer"[All Fields]'), x.n[3])} &middot; trnH-psbA ${lnk(g('"trnH-psbA"[All Fields]'), x.n[4])}` +
              `<br><b>BOLD Systems:</b> ${x.b == null ? 'not found' : x.b + ' public barcode records'} &middot; ${lnk('https://portal.boldsystems.org/result?query=' + encodeURIComponent(dna + '[tax]'), 'open in BOLD')}`; })()
          : '<br><b>DNA:</b> not looked up (the name is not known at species level)');
    } else card.innerHTML = `<b>Name in 2005:</b> <i>${esc(nm)}</i><br>Not found in the Catalogue of Life.`; }
  else { const f = D.kind === 'F' ? NOWF.get(D.key.toLowerCase()) : null; card.innerHTML = D.kind === 'F' ? `<b>Family in 2005:</b> ${esc(fam)}<br><b>Family now (Catalogue of Life 2026):</b> ${esc(f || fam)}${f ? '' : ' (unchanged)'}` : `<b>Genus:</b> ${esc(D.key)} &middot; the current names of its species are shown in brackets in the lists.`; }
  B.append(card);
}""")
R("B.append(pos(el('div', { class: 'abs', style: { font: '22px var(--arial)', color: '#804000', textAlign: 'center' } }, `${esc(nm)}&nbsp; [${STLAB[D.row[6]]}]`), 318, 10, 732));",
  "B.append(pos(el('div', { class: 'abs', style: { font: '22px var(--arial)', color: '#804000', textAlign: 'center' } }, `${esc(LABEL(nm))}&nbsp; [${STLAB[D.row[6]]}]`), 318, 10, 732));")
R("D.imgs = SB.im[r[7].toLowerCase()] || []; }", "D.imgs = SB.im[r[7].toLowerCase()] || []; await loadExtra(D); }")
R("""p.textContent = o ? '-' : '+'; };
}""", """p.textContent = o ? '-' : '+'; };
  extraPanel(B, D, 'syn');
}""")
R("""out.innerHTML = flat[+td.dataset.i][1].map(f => esc(f.join(' ; '))).join('<br>'); };
}""", """out.innerHTML = flat[+td.dataset.i][1].map(f => esc(f.join(' ; '))).join('<br>'); };
  extraPanel(B, D, 'cm');
}""")
R("// ---------- start ----------", """// ---------- Version 2: synonyms now, common names now and rechecked DNA barcodes ----------
async function loadExtra(D) {
  D.ex = null; const u = NOWN.get(D.key); if (!u || !u[7]) return;
  try { const sh = await shard('u', crc32(u[7].toLowerCase()) % 100); D.ex = (sh || {})[u[7]] || null; } catch (e) { D.ex = null; }
}
function extraPanel(B, D, what) {
  const u = NOWN.get(D.key), x = D.ex;
  const box = pos(el('div', { class: 'abs v2x', style: { background: 'rgba(255,255,255,.93)', border: '1px solid #7d0000', font: '12px/16px var(--arial)', color: '#202020', overflow: 'auto', padding: '6px 8px', boxSizing: 'border-box' } }),
    what === 'syn' ? 1058 : 10, what === 'syn' ? 39 : 9, what === 'syn' ? 300 : 326, what === 'syn' ? 466 : 530);
  const acc = u && (u[0] || upKey(D.row));
  if (what === 'syn') {
    let h = `<div style="font:bold 12px var(--arial);color:#7d0000;margin-bottom:4px">Synonyms now &ndash; Catalogue of Life (2026)</div>`;
    if (!x) h += '<div>The name is not known to the Catalogue of Life at species level, so it has no synonyms there.</div>';
    else { h += `<div style="margin-bottom:4px"><b>Accepted name:</b> <i>${esc(acc)}</i> ${esc(u[1] || '')}</div>`;
      h += x.s.length ? x.s.map(([n, a, k]) => `<div title="${k}">${k === 'homotypic' ? '&equiv;' : k === 'misapplied' ? '&ne;' : '='} <i>${esc(n)}</i> ${esc(a)}${k === 'misapplied' ? ' (misapplied)' : ''}</div>`).join('') + `<div style="margin-top:6px;color:#555;font-size:11px">&equiv; same type (homotypic) &nbsp; = different type (heterotypic) &middot; ${x.s.length} names</div>` : '<div>No synonyms are listed.</div>'; }
    box.innerHTML = h;
  } else {
    let h = `<div style="font:bold 12px var(--arial);color:#7d0000;margin-bottom:4px">Common names now &ndash; GBIF (2026)</div>`;
    if (!x || !x.c.length) h += '<div>No common names in English or the languages of India are recorded today for this plant.</div>';
    else { let last = ''; for (const [l, n, src] of x.c) { if (l !== last) { h += `<div style="margin-top:4px;color:#008080;font-weight:bold">${esc(l)}</div>`; last = l; } h += `<div title="${esc(src)}">${esc(n)}</div>`; }
      h += `<div style="margin-top:6px;color:#555;font-size:11px">${x.c.length} names &middot; sources shown when you hold the mouse on a name</div>`; }
    box.innerHTML = h;
  }
  B.append(box);
}
// ---------- start ----------""")
R("loadJs('data/core.js').then(() => { initData(); busy(false); })", "loadJs('data/core.js').then(() => loadJs('data/updates.js').catch(() => {})).then(() => { initData(); initUpdates(); busy(false); })")
R("const REMOTE = 'https://sachinrosario.github.io/ibin-apps/sasya-bharathi/';", "const REMOTE = 'https://sachinrosario.github.io/ibin-apps/sasya-bharathi/'; // Version 1's copy of the plant records and pictures (shared)")
open(dst, 'w', encoding='utf-8').write(s)
print('Version 2 page written')
