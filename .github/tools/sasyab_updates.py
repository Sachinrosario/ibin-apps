#!/usr/bin/env python3
"""Version 2 data for Sasya Bharathi: data/updates.js from the taxa lookup parts (sasyab-taxa-*.json) and the Version 1 core.js.
usage: python3 sasyab_updates.py <taxa dir> <core.js> <out updates.js> <out name-changes.csv> [<extra dir> <out web dir>]
With the extra lookups (synonyms, common names, barcodes) it also writes <web>/data/u/N.js, one part per 100th of the names."""
import json, sys, os, glob, csv, collections
TD, CORE, OUT, CSV = sys.argv[1:5]
XD, WEB = (sys.argv[5:7] + [None, None])[:2]
t = {}
for f in sorted(glob.glob(os.path.join(TD, 'sasyab-taxa-[0-9]*.json')) or glob.glob(os.path.join(TD, 'sasyab-taxa*.json'))): t.update(json.load(open(f)))
s = open(CORE, encoding='utf-8').read(); core = json.loads(s[s.index(',') + 1:s.rindex(')')])
LAB = {'LEAST_CONCERN': 'Least Concern (LC)', 'NEAR_THREATENED': 'Near Threatened (NT)', 'VULNERABLE': 'Vulnerable (VU)', 'ENDANGERED': 'Endangered (EN)',
       'CRITICALLY_ENDANGERED': 'Critically Endangered (CR)', 'NOT_EVALUATED': 'Not Evaluated (NE)', 'DATA_DEFICIENT': 'Data Deficient (DD)', 'EXTINCT': 'Extinct (EX)', 'EXTINCT_IN_THE_WILD': 'Extinct in the Wild (EW)'}
key = lambda r: ' '.join([r[2], r[3]] + (['subsp. ' + r[4]] if r[4] else []) + (['var. ' + r[5]] if r[5] else []))
up = {}; rows = []; fam = collections.defaultdict(collections.Counter); missing = 0
for r in core['sp']:
    k = key(r); x = t.get(k)
    if not x: missing += 1; continue
    if x.get('col_match') in ('higherrank', 'none', 'error') and len((x.get('accepted') or x.get('col_name') or '').split()) < 2:
        # only the genus is known to the Catalogue of Life: no current name, and the status / DNA counts found for the genus are not used
        up[k] = ['', '', 'not found (only the genus)', x.get('family') or '', '', 0, 0, '']
        if x.get('family'): fam[r[1].lower()][x['family']] += 1
        rows.append([k, r[1], k, 'not found (only the genus)', x.get('family') or '', '', '', '']); continue
    acc = x.get('accepted') or (x.get('col_name') if x.get('col_status') == 'accepted' else None)
    acc = ' '.join(acc.split()) if acc else ''
    if acc.lower() == k.lower(): acc = ''
    iu = x.get('iucn')
    up[k] = [acc, x.get('accepted_author') or x.get('col_author') or '', x.get('col_status') or 'not found', x.get('family') or '', LAB.get(iu, iu or ''),
             x.get('ncbi_all') or 0, x.get('ncbi_coi') or 0, x.get('dna_name') or '']
    if x.get('family'): fam[r[1].lower()][x['family']] += 1
    rows.append([k, r[1], acc or k, x.get('col_status') or 'not found', x.get('family') or '', LAB.get(iu, iu or ''), x.get('ncbi_all') or 0, x.get('ncbi_coi') or 0])
# a 2005 family is shown with today's family when most of its species (at least 3, and 60 %) now sit in that one family
fams = {}; colfams = {k.lower() for c in fam.values() for k in c}  # a family still in use today is not renamed (only split)
for f, c in fam.items():
    if f in colfams: continue
    top, n = c.most_common(1)[0]; tot = sum(c.values())
    if top.lower() != f and n >= 3 and n / tot >= 0.6 and f not in ('incertae_sedis', 'pteridophyta', 'coniferae', 'anthericaceae'): fams[f] = top
open(OUT, 'w', encoding='utf-8').write('SB.up=' + json.dumps({'sp': up, 'fam': fams}, ensure_ascii=False, separators=(',', ':')) + ';\n')
with open(CSV, 'w', newline='', encoding='utf-8') as f:
    w = csv.writer(f); w.writerow(['Name in 2005', 'Family in 2005', 'Name now (Catalogue of Life)', 'Catalogue of Life status of the 2005 name', 'Family now', 'IUCN Red List now', 'GenBank sequences', 'GenBank COI']); w.writerows(rows)
st = collections.Counter(v[2] for v in up.values())
print(len(up), 'names;', missing, 'not looked up;', sum(1 for v in up.values() if v[0]), 'changed;', len(fams), 'families renamed;', dict(st), dict(collections.Counter(v[4] for v in up.values())))

# ---- synonyms now, common names now, DNA barcodes (rechecked): data/u/N.js, keyed by the name used for DNA
if XD:
    import zlib
    X = {}
    for f in sorted(glob.glob(os.path.join(XD, '*-extra-*.json'))): X.update(json.load(open(f)))
    NU = 100; parts = collections.defaultdict(dict)
    for k, r in X.items():
        n = r.get('ncbi') or {}
        parts[zlib.crc32(k.lower().encode()) % NU][k] = {'s': r.get('syn') or [], 'c': r.get('cm') or [], 'n': [n.get('all', 0), n.get('rbcL', 0), n.get('matK', 0), n.get('ITS', 0), n.get('trnH-psbA', 0)],
                                                          'nn': r.get('ncbi_name') or k, 'b': r.get('bold'), 'd': r.get('checked')}
    os.makedirs(os.path.join(WEB, 'data', 'u'), exist_ok=True)
    for i in range(NU):
        open(os.path.join(WEB, 'data', 'u', f'{i}.js'), 'w', encoding='utf-8').write(f'SB.got("u",{i},' + json.dumps(parts.get(i, {}), ensure_ascii=False, separators=(',', ':')) + ');\n')
    print('extra:', len(X), 'names;', sum(1 for r in X.values() if r.get('syn')), 'with synonyms;', sum(1 for r in X.values() if r.get('cm')), 'with common names;',
          sum(1 for r in X.values() if (r.get('ncbi') or {}).get('all')), 'with GenBank sequences;', sum(1 for r in X.values() if any((r.get('ncbi') or {}).get(m) for m in ('rbcL', 'matK', 'ITS', 'trnH-psbA'))), 'with barcode-region sequences;',
          sum(1 for r in X.values() if r.get('bold')), 'with BOLD records;', sum(1 for r in X.values() if r.get('ncbi_error') or r.get('syn_error') or r.get('cm_error')), 'with lookup errors')
    # the CSV gets the rechecked barcode counts and the counts of synonyms / common names
    rows2 = []
    for row in rows:
        k = up.get(row[0]); x = X.get(k[7]) if k and k[7] else None
        n = (x or {}).get('ncbi') or {}
        rows2.append(row[:6] + [n.get('all', ''), n.get('rbcL', ''), n.get('matK', ''), n.get('ITS', ''), n.get('trnH-psbA', ''), (x or {}).get('bold', ''), len((x or {}).get('syn') or []), '; '.join(f'{a}: {b}' for a, b, _ in (x or {}).get('cm') or [])])
    with open(CSV, 'w', newline='', encoding='utf-8') as f:
        w = csv.writer(f); w.writerow(['Name in 2005', 'Family in 2005', 'Name now (Catalogue of Life)', 'Catalogue of Life status of the 2005 name', 'Family now', 'IUCN Red List now',
                                       'GenBank sequences', 'rbcL', 'matK', 'ITS', 'trnH-psbA', 'BOLD public barcode records', 'Synonyms now', 'Common names now']); w.writerows(rows2)
