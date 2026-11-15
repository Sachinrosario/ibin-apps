#!/usr/bin/env python3
"""Builds apps/eastern-ghats-mapping-2 (Version 2) from the Western Ghats Mapping 2 design, the Eastern Ghats Mapping data
and the lookups (names, IUCN status, synonyms, common names, DNA barcodes).
usage: python3 .github/tools/eg2_build.py <taxa dir> <extra dir>"""
import sys, os, re, json, glob, shutil, datetime
TD, XD = sys.argv[1:3]
A = 'apps'; W2, E1, E2 = f'{A}/western-ghats-mapping-2', f'{A}/eastern-ghats-mapping', f'{A}/eastern-ghats-mapping-2'
ver = '2.0.0'
if os.path.isdir(E2): shutil.rmtree(E2)
shutil.copytree(W2, E2)
for f in ('core', 'detail', 'images', 'map'): shutil.copy(f'{E1}/web/data/{f}.js', f'{E2}/web/data/{f}.js')
for f in glob.glob(f'{E1}/web/img/ui/*'):
    if os.path.basename(f) in ('icon.png', 'team1.jpg'): shutil.copy(f, f'{E2}/web/img/ui/')
if os.path.exists(f'{E2}/web/img/ui/team2.jpg'): os.remove(f'{E2}/web/img/ui/team2.jpg')
for f in ('app-icon.png',): shutil.copy(f'{E1}/{f}', f'{E2}/{f}')
shutil.copy(f'{E1}/windows/app.ico', f'{E2}/windows/app.ico')
shutil.rmtree(f'{E2}/src-tauri/icons'); shutil.copytree(f'{E1}/src-tauri/icons', f'{E2}/src-tauri/icons')
open(f'{E2}/web/img/SHARED_MEDIA_FROM', 'w').write('eastern-ghats-mapping')
# ---- text substitutions in the copied text files
def sub(s):
    for a, b in (('Western Ghats', 'Eastern Ghats'), ('Western Ghat', 'Eastern Ghat'), ('WesternGhats', 'EasternGhats'), ('western-ghats', 'eastern-ghats'),
                 ('westernghats', 'easternghats'), ('WesternGhat', 'EasternGhat'), ('western_ghat', 'eastern_ghat'), ('Western', 'Eastern'), ('wg2-v1', 'eg2-v1'), ('47828', '47839')): s = s.replace(a, b)
    return s
for r, _, fs in os.walk(E2):
    for f in fs:
        p = os.path.join(r, f)
        if f.endswith(('.html', '.js', '.json', '.webmanifest', '.md', '.rs', '.toml', '.go', '.mod', '.rc', '.manifest', '.nsi')) and not p.endswith(('core.js', 'detail.js', 'images.js', 'map.js')):
            t = open(p, encoding='utf-8').read(); u = sub(t)
            if u != t: open(p, 'w', encoding='utf-8').write(u)
# ---- data
raw = open(f'{E2}/web/data/core.js', encoding='utf8').read(); C = json.loads(raw[raw.index('=') + 1:].rstrip().rstrip(';'))
T = {}; X = {}
for f in sorted(glob.glob(os.path.join(TD, '*.json'))): T.update(json.load(open(f)))
for f in sorted(glob.glob(os.path.join(XD, '*-extra-*.json'))): X.update(json.load(open(f)))
LAB = {'LEAST_CONCERN': 'Least Concern (LC)', 'NEAR_THREATENED': 'Near Threatened (NT)', 'VULNERABLE': 'Vulnerable (VU)', 'ENDANGERED': 'Endangered (EN)', 'CRITICALLY_ENDANGERED': 'Critically Endangered (CR)',
       'NOT_EVALUATED': 'Not Evaluated (NE)', 'DATA_DEFICIENT': 'Data Deficient (DD)', 'EXTINCT': 'Extinct (EX)', 'EXTINCT_IN_THE_WILD': 'Extinct in the Wild (EW)'}
def lev(a, b):
    p = list(range(len(b) + 1))
    for i, x in enumerate(a, 1):
        c = [i]
        for j, y in enumerate(b, 1): c.append(min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (x != y)))
        p = c
    return p[-1]
names, extra, rows = {}, {}, []
for x in C['sp']:
    i, gen, nm = x[0], x[1], x[2]
    k = nm; r = T.get(k)
    w = nm.split()
    if len(w) < 2 or w[1].lower() in ('none', 'sp', 'sp.', 'spp', 'spp.') or not gen.isalpha(): continue
    if not r: names[str(i)] = [3, '', 'no species match', '', '']; rows.append((i, nm, 'to check', 'no species match', '')); continue
    acc = ' '.join((r.get('accepted') or (r.get('col_name') if r.get('col_status') == 'accepted' else '') or '').split())
    aut = r.get('accepted_author') or r.get('col_author') or ''
    full = (acc + ' ' + aut).strip(); key = r.get('gbif_key') or ''; fam = r.get('family') or ''
    st = r.get('col_status') or ''; mt = r.get('col_match') or ''
    if mt in ('higherrank', 'none', 'error') and len(acc.split()) < 2:
        names[str(i)] = [3, '', 'no species match (only the genus was found)', key, '']; rows.append((i, nm, 'to check', 'only the genus matched', '')); continue
    if not acc or st in ('ambiguous synonym', 'misapplied'):
        names[str(i)] = [3, acc, f'doubtful status ({st})' + (': ' + full if full else ''), key, '']; rows.append((i, nm, 'to check', st, acc)); continue
    if acc == nm: names[str(i)] = [1, '', full, key, fam]; rows.append((i, nm, 'confirmed', st, acc))
    elif len(acc.split()) != 2 and len(w) == 2: names[str(i)] = [3, acc, 'accepted name not at species level: ' + full, key, '']; rows.append((i, nm, 'to check', 'not species level', acc))
    else: names[str(i)] = [2, acc, full, key, fam]; rows.append((i, nm, 'updated', st, acc))
    e = X.get(r.get('dna_name') or acc) or {}; n = e.get('ncbi') or {}
    extra[str(i)] = [LAB.get(r.get('iucn'), r.get('iucn') or ''),
                     [[a, b, c] for a, b, c in (e.get('syn') or [])][:60], [[a, b, c] for a, b, c in (e.get('cm') or [])],
                     [n.get('all', 0), n.get('rbcL', 0), n.get('matK', 0), n.get('ITS', 0), n.get('trnH-psbA', 0), e.get('bold', 0), e.get('ncbi_name') or e.get('dna') or acc]]
date = datetime.date.today().isoformat()
open(f'{E2}/web/data/names.js', 'w', encoding='utf-8').write('window.AM_NAMES=' + json.dumps({'date': date, 'source': 'Catalogue of Life (via GBIF Backbone)', 'n': names}, ensure_ascii=False, separators=(',', ':')) + ';')
open(f'{E2}/web/data/extra.js', 'w', encoding='utf-8').write('window.AM_EXTRA=' + json.dumps({'date': date, 'n': extra}, ensure_ascii=False, separators=(',', ':')) + ';')
open(f'{E2}/name-changes.csv', 'w', encoding='utf-8').write('id,name_2015,result,detail,current\n' + '\n'.join(','.join('"' + str(v).replace('"', '""') + '"' for v in r) for r in rows))
from collections import Counter
print(Counter(v[0] for v in names.values()), 'extra', len(extra), 'iucn', Counter(v[0] for v in extra.values()).most_common(4))
# ---- page
p = f'{E2}/web/index.html'; h = open(p, encoding='utf-8').read()
def rep(a, b, cnt=1):
    global h
    assert h.count(a) >= 1, a[:80]
    h = h.replace(a, b)
rep('x0: 72.7, x1: 78.7, y0: 8.0, y1: 21.5', 'x0: 74.0, x1: 87.6, y0: 8.0, y1: 22.7'); rep('Math.cos(14.8 * Math.PI / 180)', 'Math.cos(15.3 * Math.PI / 180)')
rep("  path(x, g) { const ps = g.t === 'Polygon' ? [g.c] : g.c;", "  path(x, g) { if (g.t === 'LineString' || g.t === 'MultiLineString') return this.lines(x, g); const ps = g.t === 'Polygon' ? [g.c] : g.c;")  # one Eastern Ghats district edge is stored as a line
rep('<script src="data/names.js"></script>', '<script src="data/names.js"></script>\n<script src="data/extra.js"></script>')
rep('NM = AM_NAMES;', 'NM = AM_NAMES, EX = AM_EXTRA;')
# per plant extras into SP
rep("  s.cm = dd[0]; s.syn = dd[1];", "  s.cm = dd[0]; s.syn = dd[1];\n  const ex = EX.n[id] || ['', [], [], null]; s.iucn = ex[0]; s.nsyn = ex[1]; s.ncm = ex[2]; s.dna = ex[3];")
rep("s.fCm = fold(s.cm.map(c => c[1]).join(' | ')); s.fSyn = fold(s.syn.map(x => x[0]).join(' | '));", "s.fCm = fold(s.cm.map(c => c[1]).concat(s.ncm.map(c => c[1])).join(' | ')); s.fSyn = fold(s.syn.map(x => x[0]).concat(s.nsyn.map(x => x[0])).join(' | '));")
rep("const y = s.syn.find(x => fold(x[0]).includes(t));", "const y = s.syn.concat(s.nsyn).find(x => fold(x[0]).includes(t));")
rep("const c = s.cm.find(c => fold(c[1]).includes(t));", "const c = s.cm.find(c => fold(c[1]).includes(t)) || (s.ncm.find(c => fold(c[1]).includes(t)) ? [0, s.ncm.find(c => fold(c[1]).includes(t))[1]] : null);")
# extra cards on the plant page
CARD = r"""
  ${s.iucn ? `<div class="note ${/Vulnerable|Endangered|Critically/.test(s.iucn) ? '' : 'ok'}"><b>IUCN Red List:</b> ${esc(s.iucn)} <span class="lead">(checked ${esc(EX.date)})</span></div>` : ''}"""
rep("  ${nameBlock(s)}</div></div>", "  ${nameBlock(s)}" + CARD + "</div></div>")
SYN = r"""
  <h2>Synonyms now (Catalogue of Life)</h2>${s.nsyn.length ? `<div class="card cn">${s.nsyn.map(y => `<p><i>${esc(y[0])}</i> <span class="lead">${esc(y[1])}${y[2] ? ' · ' + esc(y[2]) : ''}</span></p>`).join('')}</div>` : '<div class="card">No synonyms listed in the Catalogue of Life for this name.</div>'}
  <h2>Common names now</h2>${s.ncm.length ? `<div class="card cn">${s.ncm.map(c => `<p><span class="badge">${esc(c[0])}</span>${esc(c[1])} <span class="lead">${esc(c[2])}</span></p>`).join('')}</div>` : '<div class="card">No additional common names were found. The names from the 2015 program are listed above.</div>'}
  <h2>DNA barcodes</h2>${s.dna ? `<div class="card">GenBank (NCBI) records for <i>${esc(s.dna[6])}</i>: <b>${s.dna[0]}</b> sequences in all · rbcL <b>${s.dna[1]}</b> · matK <b>${s.dna[2]}</b> · ITS <b>${s.dna[3]}</b> · trnH-psbA <b>${s.dna[4]}</b>. BOLD public barcode records: <b>${s.dna[5]}</b>.<br><a href="https://www.ncbi.nlm.nih.gov/nuccore/?term=${encodeURIComponent('"' + s.dna[6] + '"[Organism]')}" target="_blank" rel="noopener">GenBank search</a> · <a href="https://portal.boldsystems.org/result?query=${encodeURIComponent(s.dna[6])}[tax]" target="_blank" rel="noopener">BOLD search</a></div>` : '<div class="card">No DNA-barcode lookup for this entry.</div>'}"""
rep("  <h2>Images and flier</h2>", SYN + "\n  <h2>Images and flier</h2>")
# about: Eastern Ghats team
team_old = re.search(r"<h2>Team</h2><div class=\"card\">.*?</div></div>", h, re.S).group(0)
ev1 = open(f'{E1}/web/index.html', encoding='utf-8').read()
tm = re.search(r"'<b>Project Co-ordinator</b>(.*?)<img src=\"img/ui/team1.jpg\"", ev1, re.S)
def jsstr(s): return re.sub(r"'\s*\+\s*\n\s*'", '', s)
team = '<b>Project Co-ordinator</b>' + jsstr(tm.group(1)).replace("\\'", "'")
rep(team_old, '<h2>Team</h2><div class="card">' + team + '<img src="img/ui/team1.jpg" alt="The Eastern Ghat team" style="max-width:100%;width:420px"></div>')
rep("<p>This is Version 2 of its 2026 rebuild by IBIN Apps: the original data with current plant names,", "<p>This is Version 2 of its 2026 rebuild by IBIN Apps: the original data with current plant names, IUCN Red List status, current synonyms and common names and DNA-barcode counts,")
rep("<li>GIS export of a plant's grids", "<li>New in 2026: the <b>IUCN Red List status</b>, <b>current synonyms</b> and <b>common names</b> (Catalogue of Life, GBIF) and <b>DNA-barcode counts</b> (GenBank rbcL, matK, ITS, trnH-psbA; BOLD) are shown on each plant page. Distribution, pictures and fliers stay as in 2015.</li><li>GIS export of a plant's grids")
open(p, 'w', encoding='utf-8').write(h)
json.dump({'version': ver, 'title': f'Eastern Ghats Mapping – Version 2 – Updated ({ver})', 'fileBase': 'EasternGhatsMapping2', 'test': 'tests/mapping.test.js'}, open(f'{E2}/release.json', 'w'), ensure_ascii=False)
pj = json.load(open(f'{E2}/package.json')); pj['version'] = ver; json.dump(pj, open(f'{E2}/package.json', 'w'), indent=2)
print('built', E2)
