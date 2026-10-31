// Builds data/names2.js for Sasya Sahyadri Version 2 from the name check (out/names-check.json).
// usage: node tools/build_names2.js input/names.json names-check.json <app>/web/data/names2.js
// Rules: a name whose check is doubtful (review) keeps its 2004 name and family and is flagged;
// otherwise the plant takes the accepted name today, and the family / order / class of that name (APG IV via GBIF).
'use strict';
const fs = require('fs');
const [SRC, CHECK, OUT] = process.argv.slice(2);
const src = JSON.parse(fs.readFileSync(SRC, 'utf8')), chk = JSON.parse(fs.readFileSync(CHECK, 'utf8'));
const R = chk.names;
const clean = n => n.trim().replace(/\s+/g, ' ').replace(/\b(var|ssp|subsp|f|forma)\b\.?/g, (m, w) => ({ var: 'var.', ssp: 'subsp.', subsp: 'subsp.', f: 'f.', forma: 'f.' })[w]);
const sp = {}, syn = {}, fam = {}, stats = { checked: 0, same: 0, changed: 0, review: 0, famChanged: 0, iucn: 0 }, reviewList = [];
for (const x of src.species) {
  const r = R[x.name]; stats.checked++;
  if (!r) throw new Error('no result for ' + x.name);
  if (r.iucn) stats.iucn++;
  if (r.review || !r.accepted) {
    stats.review++; reviewList.push([x.id, r.reason || r.status]);
    sp[x.id] = [x.name, x.author, x.family2004, r.iucn || '', 2, r.reason || r.status || '', r.accepted || ''];
    continue;
  }
  const F = (r.family || x.family2004).toUpperCase();
  if (F !== x.family2004.toUpperCase()) stats.famChanged++;
  if (r.family && !fam[F]) fam[F] = [r.order || '', r.className || '', r.phylum || ''];
  const changed = r.accepted !== clean(x.name);
  changed ? stats.changed++ : stats.same++;
  sp[x.id] = [r.accepted, r.acceptedAuthor || x.author, F, r.iucn || '', changed ? 1 : 0, '', ''];
}
for (const x of src.synonyms) {
  const r = R[x.name];
  if (r && !r.review && r.accepted && r.accepted !== clean(x.name)) syn[x.id] = r.accepted;
}
const data = { version: '2.0.0', checked: chk.checked, source: chk.source, stats, sp, syn, fam };
fs.writeFileSync(OUT, '// Names of Sasya Sahyadri Version 2: the accepted name today for every 2004 name (built by tools/build_names2.js)\n' +
  '// sp: id -> [name, author, FAMILY, IUCN, 0 unchanged | 1 changed | 2 kept for review, review reason, suggested name]\n' +
  'window.SSY_NAMES=' + JSON.stringify(data) + ';\n');
console.log(stats, 'synonyms pointing to another name today:', Object.keys(syn).length, 'families:', Object.keys(fam).length);
