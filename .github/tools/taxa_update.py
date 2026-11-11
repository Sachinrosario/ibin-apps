"""Current name, threat status and DNA records for a list of scientific names (runs on a GitHub runner).
usage: python3 taxa_update.py <names.txt> <out.json> <kingdom: Animalia|Plantae> [part/parts]
Sources (all free, no key):
  Catalogue of Life (ChecklistBank, latest release 3LR): name match -> status, accepted name, authorship, family, order
  GBIF species API: IUCN Red List category of the accepted species (from the IUCN Red List checklist in GBIF)
  NCBI Entrez (nucleotide): all sequences and COI (DNA barcode) sequences of the accepted species
  BOLD Systems public API: barcode records of the accepted species"""
import json, sys, time, urllib.request, urllib.parse
from concurrent.futures import ThreadPoolExecutor
IN, OUT, KING = sys.argv[1:4]
names = [l.strip() for l in open(IN) if l.strip()]
SPELL = {}       # lines "name in the program|name to look up" mark a misspelt or outdated entry of the program
for i, l in enumerate(names):
    if '|' in l: a, b = l.split('|', 1); names[i] = a; SPELL[a] = b
if len(sys.argv) > 4 and '/' in sys.argv[4]:  # part i of n (several runners share a long list)
    pi, pn = map(int, sys.argv[4].split('/')); names = names[pi::pn]
UA = {'User-Agent': 'ibin-apps/1.0 (IBIN Apps rebuild; https://sachinrosario.github.io/ibin-apps/)'}
def get(url, js=True, tries=5, to=40):
    for i in range(tries):
        try:
            r = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=to).read()
            return json.loads(r) if js else r.decode('utf-8', 'replace')
        except Exception as e:
            err = e; time.sleep(2 + 3 * i)
    print('FAILED', url, err); return None
def col(n):
    j = get('https://api.checklistbank.org/dataset/3LR/match/nameusage?' + urllib.parse.urlencode({'scientificName': n, 'kingdom': KING, 'verbose': 'false'}))
    r = {'col_match': (j or {}).get('type', 'error')}
    u = (j or {}).get('usage')
    if not u: return r
    r['col_id'] = u.get('id'); r['col_status'] = u.get('status')
    nm_ = lambda x: (x.get('name') if isinstance(x.get('name'), str) else (x.get('name') or {}).get('scientificName')) or x.get('label')
    au_ = lambda x: x.get('authorship') or (x.get('name') or {}).get('authorship', '') if not isinstance(x.get('name'), str) else (x.get('authorship') or '')
    r['col_name'] = nm_(u); r['col_author'] = au_(u)
    acc = u.get('accepted') or (u if u.get('status') == 'accepted' else None)
    if isinstance(acc, dict):
        r['accepted'] = nm_(acc); r['accepted_author'] = au_(acc); r['accepted_id'] = acc.get('id')
    cl = {c.get('rank'): c.get('name') for c in (u.get('classification') or [])}
    r['family'] = cl.get('family'); r['order'] = cl.get('order'); r['class'] = cl.get('class')
    if 'accepted' not in r and r['col_status'] in ('synonym', 'ambiguous synonym', 'misapplied'):
        t = get(f"https://api.checklistbank.org/dataset/3LR/taxon/{u.get('parentId') or ''}") if u.get('parentId') else None
        if t: r['accepted'] = nm_(t); r['accepted_author'] = au_(t)
    return r
def gbif_iucn(n, alt=None):
    j = get('https://api.gbif.org/v1/species/match?' + urllib.parse.urlencode({'name': n, 'kingdom': KING, 'strict': 'false'}))
    if alt and alt != n and (not j or j.get('rank') not in ('SPECIES', 'SUBSPECIES')):     # GBIF does not know the new name yet: use the old one
        j = get('https://api.gbif.org/v1/species/match?' + urllib.parse.urlencode({'name': alt, 'kingdom': KING, 'strict': 'false'}))
    if not j or not j.get('usageKey') or j.get('rank') not in ('SPECIES', 'SUBSPECIES'): return {}
    k = j.get('acceptedUsageKey') or j['usageKey']
    c = get(f'https://api.gbif.org/v1/species/{k}/iucnRedListCategory', tries=2)
    return {'gbif_key': k, 'gbif_name': j.get('species') or j.get('canonicalName'), 'iucn': (c or {}).get('category'), 'iucn_code': (c or {}).get('code'), 'iucn_taxon': (c or {}).get('scientificName')}
import threading
_lk = threading.Lock(); _last = [0.0]
def _slot():      # NCBI: at most 3 requests a second from one address
    with _lk:
        w = 0.36 - (time.time() - _last[0])
        if w > 0: time.sleep(w)
        _last[0] = time.time()
def ncbi(n, alt=None):
    def q(term):
        _slot(); return _q(term)
    _q = lambda term: get('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?' + urllib.parse.urlencode({'db': 'nucleotide', 'term': term, 'retmode': 'json', 'retmax': 0}))
    a = q(f'"{n}"[Organism]')
    b = q(f'"{n}"[Organism] AND (COI[Gene] OR COX1[Gene] OR "cytochrome oxidase subunit I"[All Fields] OR "cytochrome c oxidase subunit I"[All Fields])')
    c = lambda j: int(((j or {}).get('esearchresult') or {}).get('count', 0) or 0)
    if alt and alt != n and c(a) == 0:          # NCBI may still file the sequences under the older name
        r2 = ncbi(alt); r2['ncbi_name'] = alt; return r2
    return {'ncbi_name': n, 'ncbi_all': c(a), 'ncbi_coi': c(b), 'ncbi_url': 'https://www.ncbi.nlm.nih.gov/nuccore/?term=' + urllib.parse.quote(f'"{n}"[Organism]')}
def bold(n):      # BOLD's public API refuses requests from cloud runners, so only the link to its taxon page is kept
    return {'bold_url': 'https://portal.boldsystems.org/result?query=' + urllib.parse.quote(n + '[tax]')}
def one(n):
    r = {'name': n}
    if n in SPELL: r['looked_up_as'] = SPELL[n]
    try: r.update(col(SPELL.get(n, n)))
    except Exception as e: r['col_error'] = repr(e)
    acc = r.get('accepted') or SPELL.get(n, n)
    acc2 = ' '.join(acc.split()[:2]) if acc else n
    r.update(gbif_iucn(acc2, n))
    r.update(ncbi(acc2, n)); r.update(bold(acc2)); r['dna_name'] = acc2
    print('done', n, flush=True)
    return n, r, acc2
print('sample', json.dumps(get('https://api.checklistbank.org/dataset/3LR/match/nameusage?' + urllib.parse.urlencode({'scientificName': names[0], 'kingdom': KING})))[:1500])
res = {}
with ThreadPoolExecutor(6) as ex:
    out = list(ex.map(one, names))
for n, r, acc2 in out: res[n] = r
json.dump(res, open(OUT, 'w'), ensure_ascii=False, indent=1)
from collections import Counter
print(Counter(r.get('col_status') for r in res.values())); print(Counter(r.get('iucn') for r in res.values()))
for n, r in res.items():
    if (r.get('accepted') or n) != n: print('NAME', n, '->', r.get('accepted'), '|', r.get('col_status'))
