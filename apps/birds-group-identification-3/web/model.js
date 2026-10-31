/* Bird Identification Version 3 — the species-level probability model.
   Used by the app (index.html) and by the accuracy test (test/simulate.js).
   Every answer multiplies each species' weight by "how likely a person looking at this species would give that answer".
   Answers that do not fit lower a species a lot but never remove it, so one mistake can be recovered from.
   Place (state) and month are a backup: they shift weight using GBIF records but never rule a species out. */
(function (root) {
  'use strict';
  const COLOURS = { k: 'Black', w: 'White', g: 'Grey', b: 'Brown', r: 'Rufous / chestnut', f: 'Buff / sandy', y: 'Yellow', l: 'Olive', n: 'Green', u: 'Blue', v: 'Purple / violet', m: 'Maroon', d: 'Red', p: 'Pink', o: 'Orange' };
  const NEAR = 'kg gw bk br bf rf ro oy yl ln nu uv vm md dp pv do fw gu fy lb gb nl'.split(' ');
  const near = (a, b) => NEAR.includes(a + b) || NEAR.includes(b + a);
  const MARKS = {
    cr: 'Crest or tuft', et: 'Ear tufts (“horns”)', er: 'Eye-ring', eb: 'Eyebrow (stripe above the eye)', es: 'Eye-stripe or mask', cp: 'Dark or coloured cap',
    tp: 'Throat patch or bib', bb: 'Breast band or collar', st: 'Streaks', sp: 'Spots', ba: 'Bars', wb: 'Wing bars', wp: 'Wing patch',
    rp: 'Pale or coloured rump', ts: 'Long tail or tail streamers', ft: 'Forked tail', wt: 'White in the tail', ot: 'Orange or rufous tail',
    bs: 'Bare coloured skin or wattle', cq: 'Casque (helmet on the bill)'
  };
  const BILLS = { co: 'Short and conical (seed-eater)', th: 'Thin and pointed', ho: 'Hooked', ls: 'Long and straight (dagger)', dc: 'Curved downwards',
    lg: 'Large and heavy', fl: 'Flat (duck bill)', sp: 'Spoon-shaped', up: 'Curved upwards', wi: 'Tiny bill, wide gape' };
  // groups of bill shapes that are easily confused, written as 2-letter codes run together ("lglsho" = lg, ls, ho)
  const BILL_NEAR = 'thco thdc lsth lsdc lglsho lgho lgco hoth flsp lgdc with'.split(' ').map(x => x.match(/../g));
  const billNear = (a, b) => a !== b && BILL_NEAR.some(g => g.includes(a) && g.includes(b));
  const HAB = { W: 'Wetland, lake or marsh', S: 'Sea or coast', R: 'River or stream', F: 'Forest or woodland', O: 'Open country, fields or grassland', D: 'Dry scrub or desert', T: 'Towns, gardens, farms', M: 'Mountains (high hills)' };
  const BEH = { sw: 'Swimming', wa: 'Wading in water', gr: 'On the ground', tr: 'Perched in a tree or bush', ae: 'Flying or soaring', nt: 'Active at night' };
  const SIZE = ['', 'Tiny (sunbird, warbler)', 'Small (sparrow to bulbul)', 'Medium (myna to pigeon)', 'Large (crow, duck, kite)', 'Very large (eagle, stork, crane)'];
  const LEN3 = ['', 'Short', 'Medium', 'Long'];
  const KIND_NEAR = 'heron-wader wader-gull gull-seabird grebe-duck grebe-seabird rail-wader rail-gamebird gamebird-bustard bustard-wader raptor-falcon raptor-owl falcon-swift owl-nightjar pigeon-parrot cuckoo-raptor cuckoo-songbird swift-songbird kingfisher-songbird woodpecker-songbird crowlike-songbird hornbill-crowlike pigeon-cuckoo nightjar-cuckoo'.split(' ');
  const kindNear = (a, b) => KIND_NEAR.includes(a + '-' + b) || KIND_NEAR.includes(b + '-' + a);

  // the questions, in the order shown on screen
  const Q = [
    { id: 'k', title: 'What kind of bird is it?', part: 'kind', single: true },
    { id: 'sz', title: 'How big is it?', part: 'size', single: true },
    { id: 'h', title: 'Colour of the head', part: 'head', colour: true },
    { id: 'u', title: 'Colour of the back and wings (upperparts)', part: 'upper', colour: true },
    { id: 'd', title: 'Colour of the breast and belly (underparts)', part: 'under', colour: true },
    { id: 'm', title: 'Which markings can you see?', part: 'marks' },
    { id: 'bs', title: 'Shape of the bill', part: 'bill', single: true },
    { id: 'bc', title: 'Colour of the bill', part: 'bill', colour: true },
    { id: 'lc', title: 'Colour of the legs and feet', part: 'legs', colour: true },
    { id: 'lg', title: 'Length of the legs', part: 'legs', single: true },
    { id: 'tl', title: 'Length of the tail', part: 'tail', single: true },
    { id: 'hab', title: 'Where was it?', part: 'place' },
    { id: 'beh', title: 'What was it doing?', part: 'place' },
  ];
  function options(q, kinds) {
    switch (q.id) {
      case 'k': return kinds.map(k => ({ v: k.id, label: k.label }));
      case 'sz': return [1, 2, 3, 4, 5].map(v => ({ v, label: SIZE[v] }));
      case 'm': return Object.entries(MARKS).map(([v, label]) => ({ v, label })).concat([{ v: 'none', label: 'No clear markings' }]);
      case 'bs': return Object.entries(BILLS).map(([v, label]) => ({ v, label }));
      case 'lg': case 'tl': return [1, 2, 3].map(v => ({ v, label: LEN3[v] }));
      case 'hab': return Object.entries(HAB).map(([v, label]) => ({ v, label }));
      case 'beh': return Object.entries(BEH).map(([v, label]) => ({ v, label }));
      default: return Object.entries(COLOURS).map(([v, label]) => ({ v, label }));
    }
  }
  const E = 0.04;     // allowance for a wrong answer
  function colourLike(have, ans) {
    if (!have || !have.length) return 0.4;
    let s = 0;
    for (const a of ans) for (const h of have) s = Math.max(s, h === a ? 1 : near(h, a) ? 0.35 : 0);
    return E + (0.92 - E) * s;
  }
  function plumageLike(p, qid, ans) {           // p = {h,u,d,m}
    if (qid === 'm') {
      const has = p.m || [];
      if (ans.includes('none')) return has.length >= 2 ? 0.35 : has.length === 1 ? 0.65 : 1;
      let f = 1; for (const a of ans) f *= has.includes(a) ? 0.85 : (a === 'ts' && has.includes('ft')) || (a === 'ft' && has.includes('ts')) ? 0.3 : 0.07;
      return f;
    }
    return colourLike(p[qid], ans);
  }
  function classLike(v, a) { if (!v) return 0.4; const d = Math.abs(v - a); return d === 0 ? 0.8 : d === 1 ? 0.25 : E; }
  // likelihood of the answers to the plumage questions (head, upper, under, marks) for one species, mixing male and female plumage
  function like(sp, qid, ans) {
    switch (qid) {
      case 'k': return Math.max(...ans.map(a => a === sp.k ? 0.92 : kindNear(a, sp.k) ? 0.2 : 0.02));
      case 'sz': return Math.max(...ans.map(a => classLike(sp.sz, +a)));
      case 'tl': return Math.max(...ans.map(a => classLike(sp.tl, +a)));
      case 'lg': return Math.max(...ans.map(a => classLike(sp.lg, +a)));
      case 'bs': return Math.max(...ans.map(a => a === sp.bs ? 0.85 : billNear(a, sp.bs) ? 0.25 : E));
      case 'bc': return colourLike(sp.bc, ans);
      case 'lc': return colourLike(sp.lc, ans);
      case 'hab': return ans.some(a => sp.hab.includes(a)) ? 0.85 : 0.12;
      case 'beh': return ans.some(a => sp.beh.includes(a)) ? 0.85 : (ans.includes('ae') ? 0.3 : 0.1);
    }
    return null;
  }
  const PLUMAGE = ['h', 'u', 'd', 'm'];
  function speciesLike(sp, ans) {
    let other = 1, male = 1, fem = sp.f ? 1 : null;
    for (const [qid, a] of Object.entries(ans)) {
      if (!a || !a.length) continue;
      if (PLUMAGE.includes(qid)) {
        male *= plumageLike(sp, qid, a);
        if (fem !== null) fem *= plumageLike({ h: sp.f.h.length ? sp.f.h : sp.h, u: sp.f.u.length ? sp.f.u : sp.u, d: sp.f.d.length ? sp.f.d : sp.d, m: sp.f.m }, qid, a);
      } else other *= like(sp, qid, a);
    }
    return other * (fem === null ? male : 0.5 * (male + fem));
  }
  function prior(sp, place, month) {
    let p = Math.pow(sp.rec + 20, 0.25);
    if (sp.x) p *= 0.02;
    if (place !== '' && place != null) {
      const tot = Object.values(sp.st).reduce((a, b) => a + b, 0);
      p *= !tot ? 0.5 : 0.15 + 0.85 * Math.min(1, ((sp.st[place] || 0) / tot) * 15);
    }
    if (month) {
      const tot = sp.mo.reduce((a, b) => a + b, 0);
      if (tot) p *= 0.15 + 0.85 * Math.min(1, (sp.mo[month - 1] / tot) * 24);
    }
    return p;
  }
  function posterior(species, ans, place, month) {
    const out = species.map((sp, i) => ({ sp, i, p: prior(sp, place, month) * speciesLike(sp, ans) }));
    const tot = out.reduce((a, r) => a + r.p, 0) || 1;
    out.forEach(r => r.p /= tot);
    return out.sort((a, b) => b.p - a.p);
  }
  const ent = ps => -ps.reduce((a, p) => a + (p > 0 ? p * Math.log2(p) : 0), 0);
  // the unanswered question whose answer is expected to narrow the list most (information gain over the likely species)
  function bestNext(post, ans, skipped, kinds) {
    const top = post.slice(0, 250).filter(r => r.p > 1e-6);
    const mass = top.reduce((a, r) => a + r.p, 0) || 1;
    const H0 = ent(top.map(r => r.p / mass));
    let best = null;
    for (const q of Q) {
      if (ans[q.id] || skipped.includes(q.id)) continue;
      const opts = options(q, kinds).filter(o => o.v !== 'none');
      let H = 0;
      if (q.id === 'm') {        // markings: value of asking about the single most telling marking
        let bestM = Infinity;
        for (const o of opts) {
          const yes = top.map(r => r.p * plumageLike(r.sp, 'm', [o.v])), pyes = yes.reduce((a, b) => a + b, 0);
          const no = top.map((r, k) => r.p - yes[k] * 0.9), pno = no.reduce((a, b) => a + b, 0);
          const h = (pyes * ent(yes.map(x => x / pyes)) + pno * ent(no.map(x => x / pno))) / (pyes + pno);
          bestM = Math.min(bestM, h);
        }
        H = bestM;
      } else {
        // answer distribution for each species: proportional to its likelihood of each option
        const L = top.map(r => { const l = opts.map(o => PLUMAGE.includes(q.id) ? plumageLike(r.sp, q.id, [o.v]) : like(r.sp, q.id, [o.v])); const s = l.reduce((a, b) => a + b, 0) || 1; return l.map(x => x / s); });
        for (let j = 0; j < opts.length; j++) {
          const w = top.map((r, k) => r.p * L[k][j]), pj = w.reduce((a, b) => a + b, 0);
          if (pj > 0) H += pj * ent(w.map(x => x / pj));
        }
        H /= mass;
      }
      const gain = H0 - H;
      if (!best || gain > best.gain) best = { q, gain };
    }
    return best;
  }
  root.BirdModel = { COLOURS, MARKS, BILLS, HAB, BEH, SIZE, LEN3, Q, options, like, plumageLike, speciesLike, prior, posterior, bestNext };
  if (typeof module !== 'undefined') module.exports = root.BirdModel;
})(typeof window !== 'undefined' ? window : globalThis);
