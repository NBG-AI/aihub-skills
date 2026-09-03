/* NBG Design — in-deck right-click menu: "Edit text", "Resize / move shape", "Export to PDF",
 * "Save edited copy".
 *
 * Inlined into every delivered HTML deck by add-deck-menu.mjs, right after print-layout.js
 * (which defines nbgPreparePrintLayout / nbgRestorePrintLayout). Plain browser JavaScript.
 *
 * Text editing
 *   - double-click a text element inside a slide (or right-click it → "Edit text") to edit it
 *     in place: the element becomes contenteditable (its inline markup and the slide's CSS are
 *     untouched; formatting commands are blocked, paste/drop insert plain text, and anything the
 *     browser wraps around typed text is unwrapped on commit); Enter or a click outside applies,
 *     Escape cancels, Shift+Enter inserts a line break; deck shortcuts are suppressed meanwhile.
 *
 * Shape resizing / moving
 *   - right-click a card, photo panel, image, decorative block or text block → "Resize / move
 *     shape": a selection frame with eight handles appears (three for elements in normal flow,
 *     which can only grow to the right/bottom). Drag a handle to resize (Shift keeps the
 *     proportions), drag inside the frame to move, arrow keys nudge by 1 px (Shift: 10 px),
 *     Alt+arrows resize, Tab selects the enclosing shape, Esc / Enter / click outside finishes.
 *     Only the element's inline geometry (left/top/width/height, position for flow elements)
 *     changes; pointer deltas are divided by the slide's current scale so the artboard
 *     coordinates stay exact at any viewport size. "Reset shape" restores one element.
 *
 * Persistence and hand-back
 *   - every change is recorded as { path, kind: 'html' | 'style', original, value } and kept in
 *     localStorage under a key derived from the file, so a reload keeps it until saved/discarded;
 *   - "Save edited copy" downloads <name>-edited.html: the changes applied to a pristine snapshot
 *     of the deck taken when this script ran, so the copy loads exactly like the original — still
 *     self-contained, still carrying this menu; "Discard edits" restores everything.
 *
 * PDF export
 *   - "Export to PDF" applies the shared print layout (every slide visible in flow, one
 *     1920x1080 page per slide, zero margins, backgrounds forced — exactly what
 *     scripts/export-pdf.mjs produces), opens the browser's print dialog, and restores the
 *     interactive deck when the dialog closes. The viewer picks "Save as PDF" (Chrome / Edge);
 *   - Ctrl/Cmd+P and the browser's own Print command go through the same prepare / restore.
 *
 * window.nbgDeck = { version, pdf: { prepare, restore, exportPdf }, edit: { start, commit,
 * cancel, isEditing, list, buildEditedHtml, save, discard }, shape: { select, deselect,
 * selected, reset }, resolveTextTarget, resolveShapeTarget } is exposed; window.nbgPdf aliases
 * the pdf part. An external driver (export-pdf.mjs, tests) sets window.__nbgPdfExternal = true so
 * the native print hooks stay out of its way.
 *
 * The menu, toast and selection frame live outside the slides, so the print layout hides them.
 */
(function () {
  if (window.nbgDeck) return;
  var VERSION = 3;
  var ACCENT = '#003841', CYAN = '#00ADBF', INK = '#0A1416', CREAM = '#F5F8F6', MUTED = '#5B6B6D';
  var FONT = "'Aptos', 'Inter', Helvetica, Arial, sans-serif";

  // Pristine snapshot of the deck as loaded — BEFORE persisted edits are re-applied and before any
  // runtime element of ours exists. "Save edited copy" applies the edits to this markup.
  var DOCTYPE = document.doctype ? '<!DOCTYPE ' + document.doctype.name + '>' : '<!DOCTYPE html>';
  var PRISTINE = document.documentElement.outerHTML;

  /* ---------- element paths (stable between the live DOM and the pristine snapshot) ---------- */
  function pathOf(el) {
    var path = [];
    while (el && el !== document.documentElement) {
      var p = el.parentElement; if (!p) return null;
      path.unshift(Array.prototype.indexOf.call(p.children, el));
      el = p;
    }
    return path;
  }
  function elAt(root, path) {
    var el = root.documentElement;
    for (var i = 0; i < path.length && el; i++) el = el.children[path[i]];
    return el || null;
  }

  /* ---------- target resolution ---------- */
  var OURS = '#nbg-deck-menu, #nbg-deck-toast, #nbg-shape-box';
  var INLINE = /^(span|a|b|i|em|strong|small|code|sup|sub|mark|u|abbr|time|label|s|q)$/i;
  function hasOwnText(el) {
    for (var n = el.firstChild; n; n = n.nextSibling) if (n.nodeType === 3 && n.nodeValue.trim()) return true;
    return false;
  }
  function resolveTextTarget(t) {
    if (t && t.nodeType === 3) t = t.parentElement;
    if (!t || !t.closest) return null;
    if (t.closest(OURS)) return null;
    var slide = t.closest('.slide'); if (!slide) return null;
    var el = t;
    while (el && el !== slide && !hasOwnText(el)) el = el.parentElement;
    if (!el || el === slide) return null;
    // an inline run inside a text block edits the whole block (keeps the accent spans intact)
    while (el.parentElement && el.parentElement !== slide && INLINE.test(el.tagName) && hasOwnText(el.parentElement)) el = el.parentElement;
    if (/^(img|svg|video|canvas|input|textarea|select|button)$/i.test(el.tagName)) return null;
    return el;
  }
  function isBoxy(el) {
    if (/^(img|svg|video|canvas|picture|iframe)$/i.test(el.tagName)) return true;
    var cs = getComputedStyle(el);
    if (cs.position === 'absolute' || cs.position === 'fixed') return true;
    if (cs.backgroundImage !== 'none') return true;
    if (cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent') return true;
    if (cs.boxShadow !== 'none') return true;
    if (parseFloat(cs.borderTopWidth) > 0 || parseFloat(cs.borderLeftWidth) > 0 || parseFloat(cs.borderBottomWidth) > 0 || parseFloat(cs.borderRightWidth) > 0) return true;
    return false;
  }
  function resolveShapeTarget(t) {
    if (t && t.nodeType === 3) t = t.parentElement;
    if (!t || !t.closest) return null;
    if (t.closest(OURS)) return null;
    var slide = t.closest('.slide'); if (!slide || t === slide) return null;
    var el = t;
    while (el && el !== slide) { if (isBoxy(el)) return el; el = el.parentElement; }
    return resolveTextTarget(t);
  }
  function parentShape(el) {
    var slide = el.closest('.slide'); if (!slide) return null;
    var p = el.parentElement;
    while (p && p !== slide) { if (isBoxy(p) || hasOwnText(p)) return p; p = p.parentElement; }
    return null;
  }
  function describe(el) {
    var cls = (el.getAttribute('class') || '').trim().split(/\s+/).filter(function (c) { return c && !/^nbg-/.test(c) && c !== 'active'; })[0];
    return el.tagName.toLowerCase() + (el.id ? '#' + el.id : cls ? '.' + cls : '') + ' · ' + Math.round(el.offsetWidth) + '×' + Math.round(el.offsetHeight);
  }

  /* ---------- edit records + persistence ---------- */
  var STORAGE_KEY = 'nbg-deck-edits:' + location.pathname + '#' + document.title;
  var edits = [];          // { path, kind: 'html' | 'style', original, value }
  var editing = null;      // { el, original }
  function attrStyle(el) { return el.hasAttribute('style') ? el.getAttribute('style') : null; }
  function current(el, kind) { return kind === 'style' ? attrStyle(el) : el.innerHTML; }
  function apply(el, kind, value) {
    if (kind === 'style') { if (value === null) el.removeAttribute('style'); else el.setAttribute('style', value); }
    else el.innerHTML = value;
  }
  function store() {
    try { if (edits.length) localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 2, edits: edits })); else localStorage.removeItem(STORAGE_KEY); } catch (e) { /* storage unavailable */ }
  }
  function loadStored() {
    var raw = null; try { raw = localStorage.getItem(STORAGE_KEY); } catch (e) { return; }
    if (!raw) return;
    var data; try { data = JSON.parse(raw); } catch (e) { return; }
    if (!data || !data.edits) return;
    data.edits.forEach(function (ed) {
      if (!ed.kind) { ed.kind = 'html'; ed.value = ed.html; delete ed.html; }   // v1 records
      var el = elAt(document, ed.path);
      if (el && current(el, ed.kind) === ed.original) { apply(el, ed.kind, ed.value); edits.push(ed); }   // stale entries (deck changed) are dropped
    });
    store();
  }
  function findEdit(el, kind) {
    var key = pathOf(el).join('/');
    for (var i = 0; i < edits.length; i++) if (edits[i].kind === kind && edits[i].path.join('/') === key) return edits[i];
    return null;
  }
  function recordEdit(el, kind, original, value) {
    var ed = findEdit(el, kind);
    if (ed) { ed.value = value; }                                    // keep the first original
    else edits.push({ path: pathOf(el), kind: kind, original: original, value: value });
    // an edit that lands back on the original is no edit
    edits = edits.filter(function (e) { return e.value !== e.original; });
    store();
  }
  function changesLabel() { return edits.length + ' unsaved change' + (edits.length === 1 ? '' : 's'); }

  /* ---------- text editing ---------- */
  function startEdit(el, keepSelection) {
    if (!el || busy) return false;
    if (editing && editing.el === el) return true;
    if (editing) commitEdit();
    deselectShape();
    closeMenu();
    var sel = window.getSelection(), ranges = [];
    if (keepSelection && sel) for (var i = 0; i < sel.rangeCount; i++) ranges.push(sel.getRangeAt(i).cloneRange());
    editing = { el: el, original: el.innerHTML };
    // Rich contenteditable (plaintext-only would force white-space:pre-wrap and re-flow the text
    // while editing). Formatting commands, rich paste and drops are blocked in `beforeinput`, and
    // every element the browser inserts (other than <br>) is unwrapped on commit — the original
    // descendants are tagged so they can be told apart.
    el.querySelectorAll('*').forEach(function (c) { c.setAttribute('data-nbg-orig', ''); });
    el.setAttribute('contenteditable', 'true');
    el.setAttribute('spellcheck', 'true');
    el.classList.add('nbg-editing');
    el.focus({ preventScroll: true });
    if (sel) {
      sel.removeAllRanges();
      if (ranges.length) ranges.forEach(function (r) { sel.addRange(r); });
      else { var r = document.createRange(); r.selectNodeContents(el); r.collapse(false); sel.addRange(r); }
    }
    toast('Editing — Enter applies, Esc cancels, Shift+Enter for a line break.', 2500);
    return true;
  }
  function endEdit() {
    var e = editing; editing = null;
    e.el.removeAttribute('contenteditable');
    e.el.removeAttribute('spellcheck');
    e.el.classList.remove('nbg-editing');
    if (e.el.getAttribute('class') === '') e.el.removeAttribute('class');
    // keep the original inline markup, drop whatever the browser wrapped around typed text
    var all = Array.prototype.slice.call(e.el.querySelectorAll('*')).reverse();   // deepest first
    all.forEach(function (c) {
      if (c.hasAttribute('data-nbg-orig')) { c.removeAttribute('data-nbg-orig'); return; }
      if (c.tagName === 'BR') return;
      while (c.firstChild) c.parentNode.insertBefore(c.firstChild, c);
      c.parentNode.removeChild(c);
    });
    return e;
  }
  function commitEdit() {
    if (!editing) return false;
    var e = endEdit();
    if (e.el.innerHTML !== e.original) {
      var ed = findEdit(e.el, 'html');
      recordEdit(e.el, 'html', ed ? ed.original : e.original, e.el.innerHTML);
      toast('Text updated — ' + changesLabel() + '. Right-click → “Save edited copy” to download the deck with your changes.', 5000);
    }
    return true;
  }
  function cancelEdit() {
    if (!editing) return false;
    var e = endEdit();
    e.el.innerHTML = e.original;
    return true;
  }

  /* ---------- shapes: resize / move ---------- */
  var shape = null;        // { el }
  var box = null, chip = null, drag = null;
  var HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
  var CURSORS = { nw: 'nwse-resize', se: 'nwse-resize', ne: 'nesw-resize', sw: 'nesw-resize', n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize' };

  function slideScale(el) {
    var slide = el.closest('.slide') || el;
    return slide.offsetWidth ? slide.getBoundingClientRect().width / slide.offsetWidth : 1;
  }
  function isPositioned(el) { var p = getComputedStyle(el).position; return p === 'absolute' || p === 'fixed'; }
  function geom(el) {
    var cs = getComputedStyle(el);
    return {
      positioned: isPositioned(el), relative: cs.position === 'relative',
      left: el.offsetLeft - (parseFloat(cs.marginLeft) || 0), top: el.offsetTop - (parseFloat(cs.marginTop) || 0),
      width: el.offsetWidth, height: el.offsetHeight,
      rleft: parseFloat(cs.left) || 0, rtop: parseFloat(cs.top) || 0,
      padX: (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0) + (parseFloat(cs.borderLeftWidth) || 0) + (parseFloat(cs.borderRightWidth) || 0),
      padY: (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0) + (parseFloat(cs.borderTopWidth) || 0) + (parseFloat(cs.borderBottomWidth) || 0),
      contentBox: cs.boxSizing !== 'border-box',
    };
  }
  function setSize(el, g, w, h) {
    if (w !== null) el.style.setProperty('width', Math.round(g.contentBox ? w - g.padX : w) + 'px');
    if (h !== null) el.style.setProperty('height', Math.round(g.contentBox ? h - g.padY : h) + 'px');
  }
  function setPos(el, g, l, t) {
    if (g.positioned) {
      el.style.setProperty('left', Math.round(l) + 'px'); el.style.setProperty('top', Math.round(t) + 'px');
      el.style.setProperty('right', 'auto'); el.style.setProperty('bottom', 'auto');
    } else {
      if (!g.relative) el.style.setProperty('position', 'relative');
      el.style.setProperty('left', Math.round(l) + 'px'); el.style.setProperty('top', Math.round(t) + 'px');
    }
  }
  function ensureBox() {
    if (box) return;
    box = document.createElement('div'); box.id = 'nbg-shape-box'; box.hidden = true;
    HANDLES.forEach(function (h) { var d = document.createElement('div'); d.className = 'nbg-h nbg-h-' + h; d.setAttribute('data-h', h); d.style.cursor = CURSORS[h]; box.appendChild(d); });
    chip = document.createElement('div'); chip.className = 'nbg-chip'; box.appendChild(chip);
    box.addEventListener('pointerdown', onShapePointerDown);
    box.addEventListener('dblclick', function (e) {
      // double-click on the frame: hand over to text editing of what is underneath
      var under = document.elementsFromPoint(e.clientX, e.clientY).filter(function (x) { return !box.contains(x); })[0];
      var t = resolveTextTarget(under);
      if (t) { e.preventDefault(); deselectShape(); startEdit(t, false); }
    });
    box.addEventListener('contextmenu', function (e) {
      e.preventDefault(); e.stopPropagation();
      var under = document.elementsFromPoint(e.clientX, e.clientY).filter(function (x) { return !box.contains(x); })[0];
      openMenu(e.clientX, e.clientY, resolveTextTarget(under), shape ? shape.el : resolveShapeTarget(under));
    });
    document.body.appendChild(box);
  }
  function layoutBox() {
    if (!shape || !box || box.hidden) return;
    var el = shape.el, r = el.getBoundingClientRect(), g = geom(el);
    box.style.left = r.left + 'px'; box.style.top = r.top + 'px'; box.style.width = r.width + 'px'; box.style.height = r.height + 'px';
    box.classList.toggle('nbg-flow', !g.positioned);
    chip.textContent = Math.round(g.width) + ' × ' + Math.round(g.height) + (g.positioned ? ' · L ' + Math.round(g.left) + ' T ' + Math.round(g.top) : g.relative || el.style.position === 'relative' ? ' · Δ ' + Math.round(g.rleft) + ', ' + Math.round(g.rtop) : '');
    chip.classList.toggle('nbg-chip-below', r.top < 40);
  }
  function selectShape(el) {
    if (!el || busy) return false;
    if (editing) commitEdit();
    closeMenu();
    ensureBox();
    shape = { el: el };
    box.hidden = false;
    layoutBox();
    toast('Shape selected — drag the handles to resize (Shift keeps proportions), drag inside to move, arrows nudge, Tab selects the enclosing shape, Esc when done.', 5000);
    return true;
  }
  function deselectShape() {
    if (!shape) return false;
    shape = null; drag = null;
    if (box) box.hidden = true;
    return true;
  }
  function finishDrag(cancel) {
    if (!drag) return;
    var d = drag; drag = null;
    if (cancel) { apply(d.el, 'style', d.preStyle); layoutBox(); return; }
    var now = attrStyle(d.el);
    if (now !== d.preStyle) {
      var ed = findEdit(d.el, 'style');
      recordEdit(d.el, 'style', ed ? ed.original : d.preStyle, now);
      toast('Shape updated — ' + changesLabel() + '. Right-click → “Save edited copy” to download the deck with your changes.', 4000);
    }
    layoutBox();
  }
  function onShapePointerDown(e) {
    if (!shape || e.button !== 0) return;
    e.preventDefault(); e.stopPropagation();
    var el = shape.el, g = geom(el);
    var h = e.target.getAttribute && e.target.getAttribute('data-h');
    if (h && !g.positioned && !/^(e|s|se)$/.test(h)) return;   // flow elements only grow right/down
    drag = { el: el, mode: h ? 'resize' : 'move', h: h, startX: e.clientX, startY: e.clientY, scale: slideScale(el) || 1, g: g, preStyle: attrStyle(el), pointerId: e.pointerId };
    try { box.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ }
  }
  function onShapePointerMove(e) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    e.preventDefault();
    var d = drag, g = d.g, dx = (e.clientX - d.startX) / d.scale, dy = (e.clientY - d.startY) / d.scale;
    if (d.mode === 'move') {
      if (g.positioned) setPos(d.el, g, g.left + dx, g.top + dy);
      else setPos(d.el, g, g.rleft + dx, g.rtop + dy);
    } else {
      var h = d.h, L = g.left, T = g.top, W = g.width, H = g.height, MIN = 16;
      if (h.indexOf('e') >= 0) W = g.width + dx;
      if (h.indexOf('s') >= 0) H = g.height + dy;
      if (h.indexOf('w') >= 0) { W = g.width - dx; }
      if (h.indexOf('n') >= 0) { H = g.height - dy; }
      if (e.shiftKey && h.length === 2 && g.height) {              // corner + Shift: keep the proportions
        var ratio = g.width / g.height;
        if (Math.abs(W - g.width) / g.width >= Math.abs(H - g.height) / g.height) H = W / ratio; else W = H * ratio;
      }
      W = Math.max(MIN, W); H = Math.max(MIN, H);
      if (h.indexOf('w') >= 0) L = g.left + (g.width - W);
      if (h.indexOf('n') >= 0) T = g.top + (g.height - H);
      var touchW = /e|w/.test(h) || (e.shiftKey && h.length === 2), touchH = /n|s/.test(h) || (e.shiftKey && h.length === 2);
      // pin the top-left corner first: a right/bottom-anchored element would otherwise slide when
      // its width/height changes (the anchor stays, the opposite edge moves)
      if (g.positioned) setPos(d.el, g, L, T);
      setSize(d.el, g, touchW ? W : null, touchH ? H : null);
    }
    layoutBox();
  }
  function nudge(dx, dy, resize) {
    if (!shape) return;
    var el = shape.el, g = geom(el), pre = attrStyle(el);
    if (resize) { if (g.positioned) setPos(el, g, g.left, g.top); setSize(el, g, dx ? Math.max(16, g.width + dx) : null, dy ? Math.max(16, g.height + dy) : null); }
    else if (g.positioned) setPos(el, g, g.left + dx, g.top + dy);
    else setPos(el, g, g.rleft + dx, g.rtop + dy);
    var ed = findEdit(el, 'style');
    recordEdit(el, 'style', ed ? ed.original : pre, attrStyle(el));
    layoutBox();
  }
  function resetShape(el) {
    var ed = findEdit(el, 'style'); if (!ed) return false;
    apply(el, 'style', ed.original);
    edits = edits.filter(function (e) { return e !== ed; }); store();
    layoutBox();
    toast('Shape reset to its original geometry.', 2500);
    return true;
  }
  window.addEventListener('pointermove', onShapePointerMove, true);
  window.addEventListener('pointerup', function (e) { if (drag && e.pointerId === drag.pointerId) finishDrag(false); }, true);
  window.addEventListener('pointercancel', function () { finishDrag(true); }, true);
  window.addEventListener('resize', function () { requestAnimationFrame(layoutBox); });
  window.addEventListener('scroll', function () { requestAnimationFrame(layoutBox); }, true);

  /* ---------- discard / save ---------- */
  function discardEdits() {
    if (editing) cancelEdit();
    deselectShape();
    for (var i = edits.length - 1; i >= 0; i--) { var el = elAt(document, edits[i].path); if (el) apply(el, edits[i].kind, edits[i].original); }
    edits = []; store();
    toast('All edits discarded.', 2500);
  }
  function buildEditedHtml() {
    if (editing) commitEdit();
    var doc = new DOMParser().parseFromString(PRISTINE, 'text/html');
    var applied = 0, skipped = 0;
    edits.forEach(function (ed) {
      var el = elAt(doc, ed.path);
      if (!el || current(el, ed.kind) !== ed.original) {
        // fallback: a unique element with the same tag and original markup
        var same = Array.prototype.filter.call(doc.querySelectorAll('.slide ' + (el ? el.tagName : '*')), function (c) { return current(c, ed.kind) === ed.original && (ed.kind === 'style' ? c.innerHTML === (el ? el.innerHTML : c.innerHTML) : true); });
        el = same.length === 1 ? same[0] : null;
      }
      if (el) { apply(el, ed.kind, ed.value); applied++; } else skipped++;
    });
    return { html: DOCTYPE + '\n' + doc.documentElement.outerHTML + '\n', applied: applied, skipped: skipped };
  }
  function saveEditedCopy() {
    var r = buildEditedHtml();
    var name = decodeURIComponent((location.pathname.split('/').pop() || 'deck.html')).replace(/\.html?$/i, '') + '-edited.html';
    var blob = new Blob([r.html], { type: 'text/html' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
    toast('Saved “' + name + '” with ' + r.applied + ' change' + (r.applied === 1 ? '' : 's') + (r.skipped ? ' (' + r.skipped + ' could not be located)' : '') + '. The copy carries this menu too.', 6000);
    return r;
  }

  /* ---------- print orchestration ---------- */
  var busy = false, preparedByMenu = false;
  function prepare(opts) { if (editing) commitEdit(); deselectShape(); return nbgPreparePrintLayout(opts || {}); }
  function restore() { return nbgRestorePrintLayout(); }
  function external() { return !!window.__nbgPdfExternal; }

  async function exportPdf() {
    if (busy) return;
    busy = true; preparedByMenu = true;
    closeMenu();
    try {
      var diag = await prepare();
      if (!diag.slides) { toast('No slides found — nothing to export.', 4000); preparedByMenu = false; busy = false; restore(); return; }
      window.print();
    } catch (e) {
      preparedByMenu = false; busy = false; restore();
      toast('PDF export failed: ' + (e && e.message ? e.message : e), 6000);
      return;
    }
    finishPrint();
  }
  function finishPrint() {
    if (!busy) return;
    busy = false; preparedByMenu = false;
    restore();
  }
  // Native print (Ctrl/Cmd+P, menu > Print): beforeprint runs synchronously before the preview is
  // laid out, and the DOM part of prepare() is synchronous, so the preview already sees the layout.
  // (Chrome also fires both events around DevTools Page.printToPDF — see __nbgPdfExternal.)
  window.addEventListener('beforeprint', function () {
    if (preparedByMenu || external()) return;
    busy = true;
    prepare();
  });
  window.addEventListener('afterprint', function () { if (!external()) finishPrint(); });

  /* ---------- UI ---------- */
  var style = document.createElement('style');
  style.id = 'nbg-deck-menu-style';
  style.textContent =
    '#nbg-deck-menu{position:fixed;z-index:2147483647;min-width:280px;max-width:380px;padding:6px;background:#fff;color:' + INK + ';' +
    'border:1px solid rgba(0,56,65,.14);border-radius:12px;box-shadow:0 12px 32px rgba(10,20,22,.18),0 2px 6px rgba(10,20,22,.10);' +
    'font:14px/1.35 ' + FONT + ';user-select:none;-webkit-user-select:none}' +
    '#nbg-deck-menu .nbg-head{display:flex;align-items:center;gap:8px;padding:8px 10px 6px;font-size:11px;letter-spacing:.12em;' +
    'text-transform:uppercase;color:' + ACCENT + ';opacity:.85}' +
    '#nbg-deck-menu .nbg-head i{display:inline-block;width:18px;height:3px;background:' + CYAN + ';border-radius:2px}' +
    '#nbg-deck-menu button{display:block;width:100%;text-align:left;border:0;background:transparent;color:inherit;' +
    'font:inherit;padding:9px 10px;border-radius:8px;cursor:pointer}' +
    '#nbg-deck-menu button:hover,#nbg-deck-menu button:focus-visible{background:' + CREAM + ';outline:none}' +
    '#nbg-deck-menu button b{display:block;font-weight:600;color:' + INK + '}' +
    '#nbg-deck-menu button span{display:block;font-size:12px;color:' + MUTED + ';margin-top:2px}' +
    '#nbg-deck-menu .nbg-sep{height:1px;margin:4px 8px;background:rgba(0,56,65,.10)}' +
    '#nbg-deck-menu .nbg-quiet{color:' + MUTED + '}' +
    '#nbg-deck-toast{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:2147483647;max-width:min(640px,90vw);' +
    'padding:12px 16px;background:' + INK + ';color:#fff;border-radius:10px;font:14px/1.4 ' + FONT + ';box-shadow:0 8px 24px rgba(0,0,0,.25)}' +
    '.nbg-editing{outline:2px solid ' + CYAN + ' !important;outline-offset:4px;box-shadow:0 0 0 6px rgba(0,173,191,.15) !important;cursor:text;border-radius:3px}' +
    '#nbg-shape-box{position:fixed;z-index:2147483646;box-sizing:border-box;outline:1.5px solid ' + CYAN + ';outline-offset:-1px;cursor:move;' +
    'box-shadow:0 0 0 4px rgba(0,173,191,.14);touch-action:none}' +
    '#nbg-shape-box .nbg-h{position:absolute;width:11px;height:11px;margin:-6px;background:#fff;border:1.5px solid ' + CYAN + ';border-radius:2px;box-sizing:border-box;box-shadow:0 1px 3px rgba(10,20,22,.25)}' +
    '#nbg-shape-box .nbg-h-nw{left:0;top:0}#nbg-shape-box .nbg-h-n{left:50%;top:0}#nbg-shape-box .nbg-h-ne{left:100%;top:0}' +
    '#nbg-shape-box .nbg-h-e{left:100%;top:50%}#nbg-shape-box .nbg-h-se{left:100%;top:100%}#nbg-shape-box .nbg-h-s{left:50%;top:100%}' +
    '#nbg-shape-box .nbg-h-sw{left:0;top:100%}#nbg-shape-box .nbg-h-w{left:0;top:50%}' +
    '#nbg-shape-box.nbg-flow .nbg-h-nw,#nbg-shape-box.nbg-flow .nbg-h-n,#nbg-shape-box.nbg-flow .nbg-h-ne,#nbg-shape-box.nbg-flow .nbg-h-sw,#nbg-shape-box.nbg-flow .nbg-h-w{display:none}' +
    '#nbg-shape-box .nbg-chip{position:absolute;left:0;top:-30px;white-space:nowrap;padding:3px 8px;border-radius:6px;background:' + INK + ';color:#fff;' +
    'font:12px/1.4 ' + FONT + ';pointer-events:none}' +
    '#nbg-shape-box .nbg-chip.nbg-chip-below{top:auto;bottom:-30px}' +
    '@media print{#nbg-deck-menu,#nbg-deck-toast,#nbg-shape-box{display:none!important}.nbg-editing{outline:none!important;box-shadow:none!important}}';
  document.head.appendChild(style);

  var menu = null, menuTarget = null, menuShape = null;
  function item(action, label, hint, cls) {
    return '<button type="button" role="menuitem" data-action="' + action + '"' + (cls ? ' class="' + cls + '"' : '') + '><b>' + label + '</b>' + (hint ? '<span>' + hint + '</span>' : '') + '</button>';
  }
  function renderMenu() {
    var h = '<div class="nbg-head"><i></i>NBG deck</div>';
    if (menuTarget) h += item('edit', 'Edit text', 'Edit this text in place — Enter applies, Esc cancels. Or double-click any text.');
    if (menuShape) {
      h += item('shape', 'Resize / move shape', describe(menuShape) + ' — handles resize (Shift keeps proportions), drag moves, arrows nudge, Esc finishes.');
      if (findEdit(menuShape, 'style')) h += item('reset', 'Reset shape', 'Restore this element’s original size and position.', 'nbg-quiet');
    }
    h += item('pdf', 'Export to PDF', 'Opens the print dialog — choose “Save as PDF”. One page per slide, 1920×1080, margins and backgrounds preset.');
    if (edits.length) {
      h += '<div class="nbg-sep"></div>';
      h += item('save', 'Save edited copy', 'Download this deck with your ' + changesLabel().replace(' unsaved', '') + ' applied (…-edited.html).');
      h += item('discard', 'Discard edits', 'Restore every original text, size and position.', 'nbg-quiet');
    }
    h += '<div class="nbg-sep"></div>' + item('close', 'Cancel', '', 'nbg-quiet');
    menu.innerHTML = h;
  }
  function buildMenu() {
    menu = document.createElement('div');
    menu.id = 'nbg-deck-menu';
    menu.setAttribute('role', 'menu');
    menu.hidden = true;
    menu.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      e.preventDefault(); e.stopPropagation();
      var action = b.getAttribute('data-action'), t = menuTarget, s = menuShape;
      if (action === 'pdf') exportPdf();
      else if (action === 'edit') { closeMenu(); startEdit(t, false); }
      else if (action === 'shape') { closeMenu(); selectShape(s); }
      else if (action === 'reset') { closeMenu(); resetShape(s); }
      else if (action === 'save') { closeMenu(); saveEditedCopy(); }
      else if (action === 'discard') { closeMenu(); discardEdits(); }
      else closeMenu();
    });
    menu.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    document.body.appendChild(menu);
  }
  function openMenu(x, y, target, shapeTarget) {
    if (!menu) buildMenu();
    menuTarget = target || null; menuShape = shapeTarget || null;
    renderMenu();
    menu.hidden = false;
    menu.style.left = '0px'; menu.style.top = '0px';
    var r = menu.getBoundingClientRect();
    menu.style.left = Math.max(8, Math.min(x, window.innerWidth - r.width - 8)) + 'px';
    menu.style.top = Math.max(8, Math.min(y, window.innerHeight - r.height - 8)) + 'px';
    var first = menu.querySelector('button'); if (first) first.focus({ preventScroll: true });
  }
  function closeMenu() { if (menu && !menu.hidden) { menu.hidden = true; menuTarget = null; menuShape = null; } }

  var toastTimer = null;
  function toast(msg, ms) {
    var t = document.getElementById('nbg-deck-toast');
    if (!t) { t = document.createElement('div'); t.id = 'nbg-deck-toast'; document.body.appendChild(t); }
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, ms || 4000);
  }

  /* ---------- events ---------- */
  document.addEventListener('contextmenu', function (e) {
    if (busy) return;
    var t = e.target;
    if (t && t.closest && t.closest('#nbg-shape-box')) return;                                   // handled by the frame itself
    if (editing && editing.el.contains(t)) return;                                              // native menu while editing (spellcheck etc.)
    if (t && t.closest && t.closest('a[href], input, textarea, select, [contenteditable="true"]')) return;
    e.preventDefault();
    if (editing) commitEdit();
    openMenu(e.clientX, e.clientY, resolveTextTarget(t), resolveShapeTarget(t));
  });
  document.addEventListener('dblclick', function (e) {
    if (busy || (menu && !menu.hidden)) return;
    if (editing && editing.el.contains(e.target)) return;
    if (e.target && e.target.closest && e.target.closest('#nbg-shape-box')) return;
    var el = resolveTextTarget(e.target);
    if (!el) return;
    e.preventDefault();
    startEdit(el, true);
  });
  document.addEventListener('pointerdown', function (e) {
    if (menu && !menu.hidden && !menu.contains(e.target)) closeMenu();
    if (editing && !editing.el.contains(e.target) && !(menu && menu.contains(e.target))) commitEdit();
    if (shape && !(box && box.contains(e.target)) && !(menu && menu.contains(e.target))) deselectShape();
  }, true);
  document.addEventListener('focusout', function (e) {
    if (editing && e.target === editing.el) setTimeout(function () { if (editing && document.activeElement !== editing.el) commitEdit(); }, 0);
  }, true);
  document.addEventListener('beforeinput', function (e) {
    if (!editing || !editing.el.contains(e.target)) return;
    var t = e.inputType || '';
    if (t === 'insertParagraph') { e.preventDefault(); commitEdit(); return; }                   // Enter applies
    if (t === 'insertFromPaste' || t === 'insertFromDrop') {                                     // plain text only
      e.preventDefault();
      var txt = e.dataTransfer ? e.dataTransfer.getData('text/plain') : '';
      if (txt) document.execCommand('insertText', false, txt.replace(/\r?\n/g, ' '));
      return;
    }
    if (/^format/.test(t) || /^insert(OrderedList|UnorderedList|HorizontalRule|Link|FromYank)$/.test(t)) e.preventDefault();
  }, true);
  ['keydown', 'keyup', 'keypress'].forEach(function (type) {
    document.addEventListener(type, function (e) {
      if (editing) {
        // keep the deck's shortcuts (arrows, space, Home/End…) from firing while typing
        e.stopPropagation();
        if (type !== 'keydown') return;
        if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); }
        else if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitEdit(); }
        return;
      }
      if (shape && !(menu && !menu.hidden)) {
        e.stopPropagation();
        if (type !== 'keydown') return;
        var step = e.shiftKey ? 10 : 1;
        if (e.key === 'Escape') { e.preventDefault(); if (drag) finishDrag(true); else deselectShape(); }
        else if (e.key === 'Enter') { e.preventDefault(); deselectShape(); }
        else if (e.key === 'Tab') { e.preventDefault(); var p = parentShape(shape.el); if (p) selectShape(p); else toast('No enclosing shape.', 1500); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); nudge(-step, 0, e.altKey); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); nudge(step, 0, e.altKey); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); nudge(0, -step, e.altKey); }
        else if (e.key === 'ArrowDown') { e.preventDefault(); nudge(0, step, e.altKey); }
        return;
      }
      if (!menu || menu.hidden) return;
      e.stopPropagation();
      if (type !== 'keydown') return;
      if (e.key === 'Escape') { e.preventDefault(); closeMenu(); }
      else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        var items = Array.prototype.slice.call(menu.querySelectorAll('button'));
        var i = items.indexOf(document.activeElement);
        items[(i + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length].focus({ preventScroll: true });
      }
    }, true);
  });
  window.addEventListener('resize', closeMenu);
  window.addEventListener('scroll', closeMenu, true);
  window.addEventListener('beforeunload', function () { if (editing) commitEdit(); });

  loadStored();

  window.nbgDeck = {
    version: VERSION,
    pdf: { prepare: prepare, restore: restore, exportPdf: exportPdf },
    edit: {
      start: function (el) { return startEdit(el, false); }, commit: commitEdit, cancel: cancelEdit,
      isEditing: function () { return !!editing; }, list: function () { return edits.slice(); },
      buildEditedHtml: buildEditedHtml, save: saveEditedCopy, discard: discardEdits,
    },
    shape: { select: selectShape, deselect: deselectShape, selected: function () { return shape ? shape.el : null; }, reset: resetShape },
    resolveTextTarget: resolveTextTarget, resolveShapeTarget: resolveShapeTarget,
  };
  window.nbgPdf = { prepare: prepare, restore: restore, exportPdf: exportPdf, version: VERSION };
})();
