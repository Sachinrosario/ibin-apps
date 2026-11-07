// Jeeva Sampada – screens of the original Windows programs, rebuilt from screenshots of the originals.
// Every screen is drawn on a fixed 1024 x 768 "desktop" (the size the originals filled), scaled to fit the browser.
"use strict";
const CL = (() => {
  const stage = document.createElement('div');
  stage.id = 'stage';
  document.body.appendChild(stage);
  function fit() {
    const s = Math.min(innerWidth / 1024, innerHeight / 768);
    stage.style.transform = `translate(${(innerWidth - 1024 * s) / 2}px, ${(innerHeight - 768 * s) / 2}px) scale(${s})`;
  }
  addEventListener('resize', fit); fit();
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  function el(tag, css, parent, cls) {
    const e = document.createElement(tag);
    if (css) e.style.cssText = css;
    if (cls) e.className = cls;
    (parent || stage).appendChild(e);
    return e;
  }
  const box = (x, y, w, h) => `left:${x}px;top:${y}px;width:${w}px;height:${h}px;`;
  function img(src, x, y, parent, extra) { const i = el('img', `position:absolute;left:${x}px;top:${y}px;${extra || ''}`, parent); i.src = src; i.draggable = false; return i; }
  function hot(x, y, w, h, parent, fn, title) {
    const b = el('div', `position:absolute;${box(x, y, w, h)}cursor:default;`, parent, 'hot');
    if (title) b.title = title;
    b.addEventListener('click', e => { e.stopPropagation(); fn(e); });
    return b;
  }
  // a window drawn from its template picture; dragging by the title bar, closing with the caption button
  let zTop = 10;
  function win(src, x, y, w, h, opts = {}) {
    const d = el('div', `position:absolute;${box(x, y, w, h)}z-index:${++zTop};`, opts.parent, 'win');
    img(src, 0, 0, d);
    d.addEventListener('mousedown', () => { d.style.zIndex = ++zTop; });
    const bar = el('div', `position:absolute;${box(4, 4, w - 28, 18)}`, d);
    if (opts.title != null) d.titleEl = el('div', `position:absolute;left:20px;top:2px;font:bold 11px Tahoma,Verdana,Arial,sans-serif;color:#fff;white-space:nowrap;`, bar).textContent = opts.title;
    let drag = null;
    bar.addEventListener('pointerdown', e => { drag = {x: e.clientX, y: e.clientY, l: d.offsetLeft, t: d.offsetTop, s: stage.getBoundingClientRect().width / 1024}; bar.setPointerCapture(e.pointerId); });
    bar.addEventListener('pointermove', e => { if (!drag) return; d.style.left = drag.l + (e.clientX - drag.x) / drag.s + 'px'; d.style.top = drag.t + (e.clientY - drag.y) / drag.s + 'px'; });
    bar.addEventListener('pointerup', () => { drag = null; });
    d.close = () => { d.remove(); opts.onclose && opts.onclose(); };
    hot(w - 22, 5, 17, 15, d, () => d.close(), 'Close');
    return d;
  }
  // a text box: white with text, or grey (as the originals show an empty, disabled box)
  function text(parent, x, y, w, h, value, font, color, opts = {}) {
    const has = value != null && String(value).trim() !== '';
    const t = el('div', `position:absolute;${box(x, y, w, h)}background:${has || opts.white ? '#fff' : '#d4d0c8'};font:${font};color:${color};padding:1px 2px;overflow:hidden;white-space:${opts.wrap ? 'pre-wrap' : 'nowrap'};line-height:1.15;box-sizing:border-box;`, parent);
    t.textContent = has ? value : '';
    return t;
  }
  // a list box with selectable lines
  function list(parent, x, y, w, h, items, font, color, onpick, opts = {}) {
    const l = el('div', `position:absolute;${box(x, y, w, h)}background:#fff;font:${font};color:${color};overflow-y:auto;overflow-x:hidden;box-sizing:border-box;`, parent, 'lst');
    let sel = opts.select ?? -1;
    function paint() {
      l.innerHTML = '';
      items.forEach((it, i) => {
        const r = el('div', `padding:0 2px;white-space:pre;line-height:${opts.lh || 1.2};${i === sel && !opts.dotOnly ? 'background:#0a246a;color:#fff;' : ''}${i === sel && (opts.focus || opts.dotOnly) ? 'outline:1px dotted #000;outline-offset:-1px;' : ''}`, l);
        r.textContent = it;
        r.addEventListener('click', () => { sel = i; opts.dotOnly = false; paint(); onpick && onpick(i, it); });
        r.addEventListener('dblclick', () => { opts.ondbl && opts.ondbl(i, it); });
      });
    }
    paint();
    l.get = () => sel;
    l.set = (arr, s = -1) => { items = arr; sel = s; paint(); };
    return l;
  }
  // a drop-down combo box drawn over the original's combo (rect = whole combo incl. the arrow button)
  function combo(parent, x, y, w, h, items, font, color, onpick, opts = {}) {
    const c = el('div', `position:absolute;${box(x, y, w, h)}`, parent);
    const t = el('div', `position:absolute;${box(2, 2, w - 4 - 17, h - 4)}background:#fff;font:${font};color:${color};padding:0 2px;white-space:nowrap;overflow:hidden;line-height:${h - 4}px;box-sizing:border-box;`, c);
    t.textContent = opts.value || '';
    let open = null, value = opts.value || '';
    // opts.selHi: the chosen value stays highlighted (the box keeps the focus in the original)
    const show1 = v => { if (opts.selHi && v) { t.textContent = ''; const sp = el('span', 'background:#0a246a;color:#fff;', t); sp.textContent = v; } else t.textContent = v; };
    function close() { if (open) { open.remove(); open = null; } }
    function show() {
      if (open) return close();
      const r = c.getBoundingClientRect(), s = stage.getBoundingClientRect().width / 1024;
      const top = (r.top - stage.getBoundingClientRect().top) / s + h, left = (r.left - stage.getBoundingClientRect().left) / s;
      const n = Math.min(items.length, opts.rows || 8);
      open = el('div', `position:absolute;${box(left + 2, top - 1, w - 4, Math.max(1, n) * (opts.lh || 17) + 2)}background:#fff;border:1px solid #000;font:${font};color:${color};overflow-y:auto;z-index:100000;box-sizing:border-box;`);
      items.forEach((it, i) => {
        const r2 = el('div', `padding:0 2px;white-space:nowrap;height:${opts.lh || 17}px;line-height:${opts.lh || 17}px;`, open);
        r2.textContent = it;
        r2.addEventListener('mouseenter', () => { r2.style.background = '#0a246a'; r2.style.color = '#fff'; });
        r2.addEventListener('mouseleave', () => { r2.style.background = ''; r2.style.color = ''; });
        r2.addEventListener('click', e => { e.stopPropagation(); value = it; show1(it); close(); onpick && onpick(it, i); });
      });
      setTimeout(() => addEventListener('click', close, {once: true}), 0);
    }
    c.addEventListener('click', e => { e.stopPropagation(); show(); });
    c.set = (arr, v = '') => { items = arr; value = v; t.textContent = v; close(); };
    c.value = () => value;
    return c;
  }
  // a status-bar / label text drawn at a position
  function label(parent, x, y, w, h, txt, font, color, align) {
    const l = el('div', `position:absolute;${box(x, y, w, h)}font:${font};color:${color};text-align:${align || 'left'};white-space:nowrap;overflow:hidden;line-height:${h}px;`, parent);
    l.textContent = txt; return l;
  }
  return {stage, el, img, hot, win, text, list, combo, label, esc, box};
})();
