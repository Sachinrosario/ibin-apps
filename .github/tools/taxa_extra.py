"""Synonyms, common names and DNA-barcode records for names already matched by taxa_update.py (runs on a GitHub runner).
usage: python3 taxa_extra.py <dir with the taxa_update results *.json> <out.json> [part/parts]
Sources (all free, no key):
  Catalogue of Life (ChecklistBank, latest release 3LR): synonyms of the accepted name (homotypic and heterotypic)
  GBIF species API: common (vernacular) names in English and the languages of India, with their source
  NCBI Entrez (nucleotide): all sequences, and the plant DNA-barcode regions rbcL, matK, ITS and trnH-psbA
  BOLD Systems public barcode records, counted through GBIF (BOLD's own API refuses cloud computers)"""
import json, sys, time, glob, os, threading, urllib.request, urllib.parse
from concurrent.futures import ThreadPoolExecutor
SRC, OUT = sys.argv[1:3]
T = {}
for f in sorted(glob.glob(os.path.join(SRC, '*.json'))): T.update(json.load(open(f)))
UA = {'User-Agent': 'ibin-apps/1.0 (IBIN Apps rebuild; https://sachinrosario.github.io/ibin-apps/)'}
def get(url, tries=5, to=40):
    for i in range(tries):
        try: return json.loads(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=to).read())
        except urllib.error.HTTPError as e:
            if e.code == 404: return None
            err = e; time.sleep(2 + 3 * i)
        except Exception as e: err = e; time.sleep(2 + 3 * i)
    print('FAILED', url, err); return None
# the work: one task per accepted name (Catalogue of Life id, GBIF key, name for DNA)
tasks = {}
for n, r in T.items():
    if r.get('col_match') in ('higherrank', 'none', 'error') and len((r.get('accepted') or r.get('col_name') or '').split()) < 2: continue
    cid = r.get('accepted_id') or (r.get('col_id') if r.get('col_status') == 'accepted' else None)
    dna = r.get('dna_name') or ' '.join(n.split()[:2])
    k = dna
    t = tasks.setdefault(k, {'dna': dna, 'cids': set(), 'gbif': r.get('gbif_key'), 'old': set()})
    if cid: t['cids'].add(cid)
    t['old'].add(' '.join(n.split()[:2]))
keys = sorted(tasks)
if len(sys.argv) > 3: pi, pn = map(int, sys.argv[3].split('/')); keys = keys[pi::pn]
INDIA = {'eng': 'English', 'hin': 'Hindi', 'kan': 'Kannada', 'tam': 'Tamil', 'tel': 'Telugu', 'mal': 'Malayalam', 'mar': 'Marathi', 'ben': 'Bengali', 'guj': 'Gujarati',
         'ori': 'Odia', 'ory': 'Odia', 'pan': 'Punjabi', 'san': 'Sanskrit', 'urd': 'Urdu', 'asm': 'Assamese', 'nep': 'Nepali', 'kok': 'Konkani', 'sat': 'Santali', 'mni': 'Manipuri',
         'brx': 'Bodo', 'doi': 'Dogri', 'kas': 'Kashmiri', 'mai': 'Maithili', 'snd': 'Sindhi', 'lus': 'Mizo', 'kha': 'Khasi', 'grt': 'Garo', 'tcy': 'Tulu', 'new': 'Newari', 'bho': 'Bhojpuri', 'sin': 'Sinhala',
         'en': 'English', 'hi': 'Hindi', 'kn': 'Kannada', 'ta': 'Tamil', 'te': 'Telugu', 'ml': 'Malayalam', 'mr': 'Marathi', 'bn': 'Bengali', 'gu': 'Gujarati', 'or': 'Odia', 'pa': 'Punjabi', 'sa': 'Sanskrit', 'ur': 'Urdu', 'as': 'Assamese', 'ne': 'Nepali'}
def synonyms(cids):
    out = []
    for cid in cids:
        j = get(f'https://api.checklistbank.org/dataset/3LR/taxon/{cid}/synonyms') or {}
        for kind in ('homotypic', 'heterotypic', 'misapplied'):
            for s in j.get(kind) or []:
                nm = s.get('name') or {}
                if isinstance(nm, dict) and nm.get('scientificName'): out.append([nm['scientificName'], nm.get('authorship') or '', kind])
            for grp in (j.get('heterotypicGroups') or []) if kind == 'heterotypic' else []:
                for s in grp or []:
                    nm = s.get('name') or {}
                    if isinstance(nm, dict) and nm.get('scientificName') and not any(x[0] == nm['scientificName'] for x in out): out.append([nm['scientificName'], nm.get('authorship') or '', 'heterotypic'])
    seen = set(); res = []
    for x in out:
        if (x[0], x[1]) not in seen: seen.add((x[0], x[1])); res.append(x)
    return res
def vernacular(gkey):
    if not gkey: return []
    j = get(f'https://api.gbif.org/v1/species/{gkey}/vernacularNames?limit=1000') or {}
    seen = set(); res = []
    for v in j.get('results') or []:
        lang = (v.get('language') or '').lower(); nm = (v.get('vernacularName') or '').strip()
        if lang in INDIA and nm and (INDIA[lang], nm.lower()) not in seen:
            seen.add((INDIA[lang], nm.lower())); res.append([INDIA[lang], nm, v.get('source') or ''])
    return sorted(res, key=lambda x: (x[0] != 'English', x[0], x[1].lower()))
_lk = threading.Lock(); _last = [0.0]
def _slot():      # NCBI: at most 3 requests a second from one address
    with _lk:
        w = 0.36 - (time.time() - _last[0])
        if w > 0: time.sleep(w)
        _last[0] = time.time()
MARK = {'rbcL': 'rbcL[All Fields]', 'matK': '(matK[All Fields] OR "maturase K"[All Fields])', 'ITS': '("internal transcribed spacer"[All Fields] OR ITS1[All Fields] OR ITS2[All Fields])', 'trnH-psbA': '("trnH-psbA"[All Fields] OR "psbA-trnH"[All Fields] OR (trnH[All Fields] AND psbA[All Fields]))'}
def ncbi(n):
    def c(term):
        _slot(); j = get('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?' + urllib.parse.urlencode({'db': 'nucleotide', 'term': term, 'retmode': 'json', 'retmax': 0}))
        return int(((j or {}).get('esearchresult') or {}).get('count', 0) or 0)
    org = f'"{n}"[Organism]'
    r = {'all': c(org)}
    if r['all']:
        for k, q in MARK.items(): r[k] = c(f'{org} AND {q}')
    return r
BOLD_DS = '040c5662-da76-4782-a48e-cdea1892d14c'   # "International Barcode of Life project (iBOL)" - BOLD's public records in GBIF
def bold(gkey):
    if not gkey: return None
    j = get(f'https://api.gbif.org/v1/occurrence/search?datasetKey={BOLD_DS}&taxonKey={gkey}&limit=0')
    return (j or {}).get('count')
def one(k):
    t = tasks[k]; r = {'dna': t['dna']}
    try: r['syn'] = synonyms(sorted(t['cids']))
    except Exception as e: r['syn_error'] = repr(e)
    try: r['cm'] = vernacular(t['gbif'])
    except Exception as e: r['cm_error'] = repr(e)
    try:
        d = ncbi(t['dna']); used = t['dna']
        if not d['all']:      # NCBI may still file the sequences under the name of 2005
            for o in sorted(t['old']):
                if o != t['dna']:
                    d2 = ncbi(o)
                    if d2['all']: d, used = d2, o; break
        r['ncbi'] = d; r['ncbi_name'] = used
    except Exception as e: r['ncbi_error'] = repr(e)
    try: r['bold'] = bold(t['gbif'])
    except Exception as e: r['bold_error'] = repr(e)
    r['checked'] = time.strftime('%Y-%m-%d')
    return k, r
d = get(f'https://api.gbif.org/v1/dataset/{BOLD_DS}'); print('BOLD dataset in GBIF:', (d or {}).get('title'))
print(len(keys), 'names in this part')
res = {}
with ThreadPoolExecutor(6) as ex:
    for i, (k, r) in enumerate(ex.map(one, keys)):
        res[k] = r
        if i % 200 == 0: print(i, k, json.dumps(r)[:300], flush=True)
json.dump(res, open(OUT, 'w'), ensure_ascii=False, indent=0)
print('synonyms for', sum(1 for r in res.values() if r.get('syn')), '| common names for', sum(1 for r in res.values() if r.get('cm')), '| DNA for', sum(1 for r in res.values() if (r.get('ncbi') or {}).get('all')), '| BOLD for', sum(1 for r in res.values() if r.get('bold')))
