"""Checks every plant name of Sasya Sahyadri (2003-04) against today's taxonomy, for Version 2.

usage: python3 tools/names_check.py input/names.json out/names-check.json

Source: GBIF Backbone Taxonomy, which is built on the Catalogue of Life (for flowering plants its families
follow APG IV through the World Checklist of Vascular Plants). Runs on a GitHub runner because the
name services are not reachable from the editing environment.

For every distinct name (the 10,353 species names and the synonyms the 2004 floras list) it records:
  matchType, confidence, status (ACCEPTED, SYNONYM, DOUBTFUL ...), the accepted name and author,
  family / order / class of the accepted name, GBIF keys, the IUCN Red List category when GBIF has one,
  and review=True with a reason when the answer should not be used without a taxonomist's check.
"""
import json, os, re, sys, time, urllib.parse, urllib.request
from collections import Counter
from concurrent.futures import ThreadPoolExecutor

SRC, OUT = sys.argv[1], sys.argv[2]
API = 'https://api.gbif.org/v1'
BACKBONE = 'd7dddbf4-2cf0-4f39-9b2a-bb099caae36c'
SPECIES_RANKS = ('SPECIES', 'SUBSPECIES', 'VARIETY', 'FORM', 'HYBRID')
SYNONYM = ('SYNONYM', 'HETEROTYPIC_SYNONYM', 'HOMOTYPIC_SYNONYM', 'PROPARTE_SYNONYM', 'MISAPPLIED')


def get(path, **q):
    url = API + path + ('?' + urllib.parse.urlencode(q) if q else '')
    for i in range(6):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'ibin-apps sasya-sahyadri name check'})
            with urllib.request.urlopen(req, timeout=40) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            time.sleep(2 + 3 * i)
        except Exception:
            time.sleep(2 + 3 * i)
    return 'ERROR'


def clean(n):
    """The 2004 tables write rank words without the full stop and sometimes with doubled spaces."""
    n = re.sub(r'\s+', ' ', n.strip())
    n = re.sub(r'\b(var|ssp|subsp|f|forma)\b\.?', lambda m: {'var': 'var.', 'ssp': 'subsp.', 'subsp': 'subsp.', 'f': 'f.', 'forma': 'f.'}[m.group(1)], n)
    return n


def look(name):
    q = clean(name)
    r = {'query': q}
    j = get('/species/match', name=q, kingdom='Plantae', strict='false', verbose='false')
    if j == 'ERROR':
        return name, {**r, 'status': 'ERROR', 'review': True, 'reason': 'lookup failed'}
    use = None
    if j and j.get('matchType') in ('EXACT', 'FUZZY') and j.get('rank') in SPECIES_RANKS:
        use = {'key': j.get('usageKey'), 'status': j.get('status'), 'name': j.get('canonicalName'), 'rank': j.get('rank'),
               'acceptedKey': j.get('acceptedUsageKey'), 'family': j.get('family')}
        r.update(matchType=j['matchType'], confidence=j.get('confidence'))
    else:   # matched only a genus or nothing: look the name up among the backbone's names (this finds synonyms)
        lst = get('/species', name=q, datasetKey=BACKBONE, limit=20)
        lst = lst if isinstance(lst, dict) else {}
        cand = [x for x in lst.get('results', []) if x.get('kingdom') == 'Plantae' and x.get('rank') in SPECIES_RANKS]
        cand.sort(key=lambda x: x.get('taxonomicStatus') != 'ACCEPTED')
        if cand:
            x = cand[0]
            use = {'key': x.get('key'), 'status': x.get('taxonomicStatus'), 'name': x.get('canonicalName'), 'rank': x.get('rank'),
                   'acceptedKey': x.get('acceptedKey'), 'family': x.get('family')}
            r.update(matchType='NAME-LIST', confidence=None)
        else:
            r.update(matchType=(j or {}).get('matchType', 'NONE'), confidence=(j or {}).get('confidence'))
    if not use:
        return name, {**r, 'status': 'NOT FOUND', 'review': True, 'reason': 'no species-level match in the Catalogue of Life'}
    r['status'], r['matchedName'], r['key'] = use['status'], use['name'], use['key']
    tgt = None
    if use['status'] in SYNONYM and use['acceptedKey']:
        tgt = get(f"/species/{use['acceptedKey']}")
    elif use['status'] == 'ACCEPTED' or use['status'] == 'DOUBTFUL':
        tgt = get(f"/species/{use['key']}")
    if not isinstance(tgt, dict):
        return name, {**r, 'review': True, 'reason': 'accepted name could not be read'}
    r.update(accepted=tgt.get('canonicalName'), acceptedAuthor=tgt.get('authorship', ''), acceptedKey=tgt.get('key'),
             acceptedRank=tgt.get('rank'), family=tgt.get('family') or use['family'], order=tgt.get('order'),
             className=tgt.get('class'), phylum=tgt.get('phylum'))
    iucn = get(f"/species/{tgt.get('key')}/iucnRedListCategory")
    if isinstance(iucn, dict) and iucn.get('code'):
        r['iucn'] = iucn['code']
    why = []
    if r['matchType'] == 'FUZZY' and (r.get('confidence') or 0) < 95:
        why.append(f"spelling matched loosely ({r.get('confidence')}%)")
    if r['matchType'] == 'NAME-LIST':
        why.append('found only by a name-list search')
    if use['status'] == 'DOUBTFUL':
        why.append('the name is marked doubtful')
    if r.get('acceptedRank') not in SPECIES_RANKS:
        why.append('accepted at a rank above species')
    if use['status'] == 'PROPARTE_SYNONYM':
        why.append('a synonym of more than one species (pro parte)')
    r['review'] = bool(why)
    if why:
        r['reason'] = '; '.join(why)
    return name, r


src = json.load(open(SRC, encoding='utf-8'))
names = sorted({x['name'] for x in src['species']} | {x['name'] for x in src['synonyms']})
print('distinct names', len(names), flush=True)
res, t0 = {}, time.time()
with ThreadPoolExecutor(10) as ex:
    for i, (n, r) in enumerate(ex.map(look, names)):
        res[n] = r
        if i % 1000 == 0:
            print(i, 'done', round(time.time() - t0), 's', flush=True)
os.makedirs(os.path.dirname(OUT) or '.', exist_ok=True)
json.dump({'checked': time.strftime('%Y-%m-%d'), 'source': 'GBIF Backbone Taxonomy (Catalogue of Life)', 'names': res},
          open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)

sp = [res[x['name']] for x in src['species']]
print('\nSpecies names:', len(sp))
print(' status', Counter(r.get('status') for r in sp))
print(' matchType', Counter(r.get('matchType') for r in sp))
print(' name changed', sum(1 for x in src['species'] if res[x['name']].get('accepted') and res[x['name']]['accepted'] != clean(x['name'])))
print(' to review', sum(1 for r in sp if r.get('review')))
print(' family changed', sum(1 for x in src['species'] if res[x['name']].get('family') and res[x['name']]['family'].upper() != x['family2004'].upper()))
print(' with IUCN category', sum(1 for r in sp if r.get('iucn')))
print('Synonym names:', len(src['synonyms']), Counter(res[x['name']].get('status') for x in src['synonyms']))
