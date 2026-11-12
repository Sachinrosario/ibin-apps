#!/usr/bin/env python3
"""Sasya Sampada as a program of its own (it was planned as a separate program and later merged into Jeeva Sampada).
Builds apps/sasya-sampada/web from Jeeva Sampada's Sasya Sampada module, so a fix to the module reaches both:
  - its own copy of the screens (ui), the shared screen code (classic.js) and the data, as .js files so it also opens from disk (offline zip)
  - the plant pictures (Images) and web pages (NEWhtml) are shared with Jeeva Sampada: used from the program's folder when they are there
    (offline zip), otherwise from Jeeva Sampada's copy on the IBIN site (web version and small installers)
  - Close / Exit end the program (inside Jeeva Sampada they return to the Jeeva Sampada screen)
usage: python3 .github/tools/sasya_sampada_page.py apps/jeeva-sampada/web apps/sasya-sampada/web"""
import sys, os, json, shutil, glob, re
J, OUT = sys.argv[1:3]
SRC = os.path.join(J, 'sasya')
s = open(os.path.join(SRC, 'index.html'), encoding='utf-8').read()
def R(a, b, n=1):
    global s
    assert s.count(a) == n, ('patch point', s.count(a), a[:80]); s = s.replace(a, b)
ver = json.load(open(os.path.join(OUT, '..', 'release.json')))['version']
R('<link rel="icon" href="../ui/icon.png">', '<link rel="icon" href="ui/icon.png">')
R('<script src="../classic.js"></script>', '<script src="classic.js"></script>')
R("img('../ui/icon.png', 2, 1, d, 'width:16px;height:16px;');", "img('ui/icon.png', 2, 1, d, 'width:16px;height:16px;');")
R("""const load = n => cache[n] || (cache[n] = fetch('data/' + n + '.json').then(r => r.json()));
Promise.all([fetch(U + 'layout.json').then(r => r.json()), load('core')]).then(([l, c]) => { LAY = l; CORE = c; start(); });""",
f"""// Sasya Sampada as a program of its own, version {ver}. The data come as .js files so the program also opens from disk.
const VERSION = '{ver}';
const SHARED_WEB = 'https://sachinrosario.github.io/ibin-apps/jeeva-sampada/sasya/';   // pictures and web pages shared with Jeeva Sampada
window.SSD = window.SSD || {{}};
function script(src) {{ return new Promise((ok, bad) => {{ const e = document.createElement('script'); e.src = src; e.onload = ok; e.onerror = () => {{ e.remove(); bad(new Error(src)); }}; document.head.appendChild(e); }}); }}
const load = n => cache[n] || (cache[n] = script('data/' + n + '.js').then(() => window.SSD[n]));
let BIGBASE = '';
const BIG = p => BIGBASE + p;
function quitApp() {{ try {{ window.close(); }} catch (e) {{}} setTimeout(() => {{ document.body.innerHTML = '<div style="position:fixed;inset:0;background:#000;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;font:20px Arial"><div>Sasya Sampada is closed. You can close this window.</div><button style="font:16px Arial;padding:4px 16px" onclick="location.reload()">Open it again</button></div>'; }}, 250); }}
Promise.all([script(U + 'layout.js').then(() => window.SSD.layout), load('core')]).then(([l, c]) => {{ LAY = l; CORE = c;
  // pictures and web pages: from this folder when they are here (offline zip), otherwise from Jeeva Sampada on the IBIN site
  const first = c.sp.find(r => r[9].length); const probe = new Image();
  probe.onload = () => {{ BIGBASE = ''; start(); }}; probe.onerror = () => {{ BIGBASE = SHARED_WEB; start(); }};
  probe.src = 'Images/' + enc(first[9][0]);
}});""")
R("hot(1006, 4, 16, 14, stage, () => { location.href = '../index.html'; }, 'Close');", "hot(1006, 4, 16, 14, stage, () => quitApp(), 'Close');")
R("['Exit', () => { location.href = '../index.html'; }, 128]", "['Exit', () => quitApp(), 128]")
R("pages.map(p => ({src: 'NEWhtml/' + enc(p)}))", "pages.map(p => ({src: BIG('NEWhtml/') + enc(p)}))")
R("pics = r[9].map(f => 'Images/' + enc(f));", "pics = r[9].map(f => BIG('Images/') + enc(f));")
# credit lines and version on the status bar until a plant is chosen
R("  status = label(stage, 0, 742, 1024, 24, '', 'bold 20px Arial,Helvetica,sans-serif', '#804000', 'center');",
  "  status = label(stage, 0, 742, 1024, 24, '', 'bold 20px Arial,Helvetica,sans-serif', '#804000', 'center');\n  CREDIT = label(stage, 0, 744, 1024, 22, 'Proprietary right holder - Dr. K.N. Ganeshaiah  \\u00b7  Updated in 2026 by Dr. Sachin A. Rosario  \\u00b7  Version ' + VERSION, 'bold 12px Arial,Helvetica,sans-serif', '#804000', 'center');")
R("  cur = id; const r = SPI.get(id), k = key(r);", "  cur = id; const r = SPI.get(id), k = key(r); if (CREDIT) CREDIT.remove(), CREDIT = null;")
R("let LAY = null, CORE = null;", "let LAY = null, CORE = null, CREDIT = null;")
R("<title>Medicinal &amp; Economically Important Plants – Sasya Sampada</title>", "<title>Sasya Sampada – Medicinal &amp; Economically Important Plants</title>")
os.makedirs(OUT, exist_ok=True)
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(s)
shutil.copy(os.path.join(J, 'classic.js'), os.path.join(OUT, 'classic.js'))
os.makedirs(os.path.join(OUT, 'ui'), exist_ok=True); os.makedirs(os.path.join(OUT, 'data'), exist_ok=True)
for f in glob.glob(os.path.join(SRC, 'ui', '*')):
    if f.endswith('.json'):
        open(os.path.join(OUT, 'ui', 'layout.js'), 'w', encoding='utf-8').write('window.SSD=window.SSD||{};SSD.layout=' + open(f, encoding='utf-8').read().strip() + ';\n')
    else: shutil.copy(f, os.path.join(OUT, 'ui', os.path.basename(f)))
shutil.copy(os.path.join(J, 'ui', 'icon.png'), os.path.join(OUT, 'ui', 'icon.png'))
for f in glob.glob(os.path.join(SRC, 'data', '*.json')):
    n = os.path.basename(f)[:-5]
    open(os.path.join(OUT, 'data', n + '.js'), 'w', encoding='utf-8').write(f'window.SSD=window.SSD||{{}};SSD[{json.dumps(n)}]=' + open(f, encoding='utf-8').read().strip() + ';\n')
print('Sasya Sampada page written:', OUT)
