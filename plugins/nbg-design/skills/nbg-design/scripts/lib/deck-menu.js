/* NBG Design — in-deck right-click menu: "Edit text", "Resize / move shape", "Export to PDF",
 * "Save edited copy".
 *
 * Inlined into every delivered HTML deck by add-deck-menu.mjs, right after print-layout.js
 * (which defines nbgPreparePrintLayout / nbgRestorePrintLayout). Plain browser JavaScript.
 *
 * Text editing
 *   - double-click a text element inside a slide (or right-click it → "Edit text") to edit it
 *     in place: the element becomes contenteditable (its inline markup and the slide's CSS are
 *     untouched; paste/drop insert plain text; anything the browser wraps around typed text
 *     other than the toolbar's b/i/u/s tags is unwrapped on commit); Enter or a click outside
 *     applies, Escape cancels, Shift+Enter inserts a line break; deck shortcuts are suppressed;
 *   - a formatting toolbar floats above the text while editing (draggable by its grip; double-click
 *     the grip to re-dock). Every control applies to the selected text when there is a selection
 *     and to the whole block otherwise: Bold / Italic / Underline / Strikethrough (semantic tags on
 *     a run), A− / A+ and an exact px size, font family (the design system's stacks), text colour
 *     (the NBG palette) — on a run these wrap exactly the selected text in a styled span, on the
 *     block they are inline style (line-height kept proportional) — alignment (block), Clear, Done.
 *     Block-level formatting is recorded as a 'style' edit. Shortcuts: Ctrl/Cmd+B/I/U,
 *     Ctrl/Cmd+Shift+> and < for size.
 *
 * Shape resizing / moving
 *   - right-click a card, photo panel, image, decorative block or text block → "Resize / move
 *     shape": a selection frame with eight handles appears (three for elements in normal flow,
 *     which can only grow to the right/bottom). Drag a handle to resize (Shift keeps the
 *     proportions), drag inside the frame to move, arrow keys nudge by 1 px (Shift: 10 px),
 *     Alt+arrows resize, Tab selects the enclosing shape, Esc / Enter / click outside finishes.
 *     Only the element's inline geometry (left/top/width/height, position for flow elements)
 *     changes; pointer deltas are divided by the slide's current scale so the artboard
 *     coordinates stay exact at any viewport size. "Reset shape" restores one element;
 *   - a shape toolbar (draggable) appears with the frame: X / Y / W / H fields, fill, border,
 *     corner radius, opacity, shadow (NBG palette), Reset, Done — all inline style on the element.
 *
 * Several shapes at once (text blocks, shapes and images alike)
 *   - Shift+click a shape adds it to (or removes it from) the selection, Shift+drag on the slide
 *     draws a selection box (every top-level shape fully inside is added), Ctrl/Cmd+A selects every
 *     top-level shape of the slide, Ctrl/Cmd+click picks one shape alone (even inside a group); the
 *     menu offers "Add to selection" / "Remove from selection" / "Select all shapes" as well. The
 *     frame spans the selection (each member gets a dashed mark), dragging moves all, handles scale
 *     all proportionally, arrows nudge all, the toolbar's style controls apply to all;
 *   - the shape toolbar's second row arranges: Order (bring to front / forward / backward / send to
 *     back — inline z-index computed from the siblings' effective stacking order, the parent made a
 *     stacking context when a negative index is needed; Ctrl/Cmd+] / [ with Shift for front/back),
 *     Align (left / centre / right / top / middle / bottom) and Distribute (horizontal / vertical,
 *     equal gaps) relative to the selection's own box or to the slide, Group / Ungroup
 *     (Ctrl/Cmd+G / Ctrl/Cmd+Shift+G). A group is logical: its members carry
 *     data-nbg-group="<id>" — recorded as a 'group' edit — and always select together;
 *   - nested / overlapping shapes: the menu lists every shape under the pointer ("Select at this
 *     point": nested parts, their containers, shapes behind — a text block inside a card included),
 *     the toolbar's Stack list offers the enclosing shapes, the selected one and its child shapes,
 *     Ctrl/Cmd+click on the same spot cycles outward, Tab / Shift+Tab step out / in.
 *
 * Structure / HTML panel (menu "Show structure" / "Show HTML", toolbar </>, Ctrl/Cmd+Shift+O / H)
 *   - Outline tab: only the shapes (cards, text blocks, images) nested by containment, with a
 *     checkbox per row for picking several, All / None, a text filter, kind icons, sizes, group
 *     badges; click a name selects it alone, Shift+click adds, Ctrl/Cmd+click toggles, Space
 *     toggles the focused row; the selection is highlighted on the slide and in the list;
 *   - Tree tab: the slide's elements (tag, id, classes, attributes, text previews), synced with the
 *     visual selection both ways — selecting on the slide highlights and reveals the row, clicking a
 *     row selects that exact element on the slide (Shift+click adds, double-click edits its text,
 *     hovering outlines it, arrows / Enter navigate); edited elements carry a dot;
 *   - Code tab: the selected element's source, editable. Apply (Ctrl/Cmd+Enter) keeps the element's
 *     type, strips scripts / event handlers / javascript: URLs, and records the result as the usual
 *     'style' / 'group' / 'html' edits plus an 'attrs' edit (the other attributes as sorted JSON).
 *
 * Persistence and hand-back
 *   - every change is recorded as { path, kind: 'html' | 'style' | 'group' | 'attrs', original, value } and kept in
 *     localStorage under a key derived from the file, so a reload keeps it until saved/discarded;
 *   - "Save edited copy" downloads <name>-edited.html: the changes applied to a pristine snapshot
 *     of the deck taken when this script ran, so the copy loads exactly like the original — still
 *     self-contained, still carrying this menu; "Discard changes on this slide" restores the slide
 *     under the pointer only, "Discard edits" restores everything.
 *
 * PDF export
 *   - "Export to PDF" applies the shared print layout (every slide visible in flow, one
 *     1920x1080 page per slide, zero margins, backgrounds forced — exactly what
 *     scripts/export-pdf.mjs produces), opens the browser's print dialog, and restores the
 *     interactive deck when the dialog closes. The viewer picks "Save as PDF" (Chrome / Edge);
 *   - Ctrl/Cmd+P and the browser's own Print command go through the same prepare / restore.
 *
 * window.nbgDeck = { version, pdf: { prepare, restore, exportPdf }, edit: { start, commit,
 * cancel, isEditing, list, format, buildEditedHtml, save, discard, discardSlide, listFor, slideAt },
 * shape: { select, selectMany,
 * add, remove, toggle, solo, selectAll, deselect, selected, selection, reset, align, distribute,
 * order, group, ungroup, groupOf, shapesOf }, resolveTextTarget, resolveShapeTarget } is exposed; window.nbgPdf aliases
 * the pdf part. An external driver (export-pdf.mjs, tests) sets window.__nbgPdfExternal = true so
 * the native print hooks stay out of its way.
 *
 * The menu, toast, selection frame and toolbars live outside the slides, so the print layout
 * hides them.
 */
(function () {
  if (window.nbgDeck) return;
  var VERSION = 7;
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
  var OURS = '#nbg-deck-menu, #nbg-deck-toast, #nbg-shape-box, #nbg-sel-marks, #nbg-marquee, #nbg-hover, #nbg-text-tools, #nbg-shape-tools, #nbg-code';
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
  // a "shape" for the stack pickers: a boxed element or a text block (a text block inside a card is
  // reachable this way, although a click resolves to the card)
  function isShapeCandidate(el) { return !!el && el.nodeType === 1 && !el.closest(OURS) && (isBoxy(el) || resolveTextTarget(el) === el); }
  function parentShape(el) {
    var slide = el.closest('.slide'); if (!slide) return null;
    var p = el.parentElement;
    while (p && p !== slide) { if (isShapeCandidate(p)) return p; p = p.parentElement; }
    return null;
  }
  function ancestorShapes(el) { var out = [], p = parentShape(el); while (p) { out.unshift(p); p = parentShape(p); } return out; }   // outermost first
  function childShapes(el) {   // the first shape level inside el
    var out = [];
    Array.prototype.forEach.call(el.querySelectorAll('*'), function (c) {
      if (!isShapeCandidate(c) || !c.offsetWidth || !c.offsetHeight) return;
      var p = c.parentElement; while (p && p !== el && !isShapeCandidate(p)) p = p.parentElement;
      if (p === el) out.push(c);
    });
    return out;
  }
  // every shape under a point, front-most / innermost first (nested ancestors and overlapping siblings alike)
  function shapeStack(x, y) {
    var out = [];
    document.elementsFromPoint(x, y).forEach(function (el) {
      if (el.closest(OURS)) return;
      var slide = el.closest('.slide'); if (!slide || el === slide) return;
      if (isShapeCandidate(el) && out.indexOf(el) < 0) out.push(el);
    });
    return out;
  }
  var lastPoint = null;   // where the pointer last went down / right-clicked (for Shift+Tab and Ctrl/Cmd+click cycling)
  function describe(el) {
    var cls = (el.getAttribute('class') || '').trim().split(/\s+/).filter(function (c) { return c && !/^nbg-/.test(c) && c !== 'active'; })[0];
    return el.tagName.toLowerCase() + (el.id ? '#' + el.id : cls ? '.' + cls : '') + ' · ' + Math.round(el.offsetWidth) + '×' + Math.round(el.offsetHeight);
  }

  /* ---------- edit records + persistence ---------- */
  var STORAGE_KEY = 'nbg-deck-edits:' + location.pathname + '#' + document.title;
  var edits = [];          // { path, kind: 'html' | 'style' | 'group' | 'attrs', original, value }
  var editing = null;      // { el, original }
  function attrStyle(el) { return el.hasAttribute('style') ? el.getAttribute('style') : null; }
  function current(el, kind) { return kind === 'style' ? attrStyle(el) : kind === 'group' ? (el.getAttribute('data-nbg-group') || null) : kind === 'attrs' ? attrsOf(el) : el.innerHTML; }
  function apply(el, kind, value) {
    if (kind === 'style') { if (value === null) el.removeAttribute('style'); else el.setAttribute('style', value); }
    else if (kind === 'group') { if (value === null) el.removeAttribute('data-nbg-group'); else el.setAttribute('data-nbg-group', value); }
    else if (kind === 'attrs') applyAttrs(el, value);
    else el.innerHTML = value;
  }
  function store() {
    try { if (edits.length) localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 2, edits: edits })); else localStorage.removeItem(STORAGE_KEY); } catch (e) { /* storage unavailable */ }
    codeRefresh();
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
    editing = { el: el, original: el.innerHTML, preStyle: attrStyle(el) };
    // Rich contenteditable (plaintext-only would force white-space:pre-wrap and re-flow the text
    // while editing). Only the toolbar's formatting commands are allowed in `beforeinput` (rich
    // paste and drops insert plain text), and every element the browser inserts — other than
    // <br> and the semantic b/i/u/s tags the toolbar produces — is unwrapped on commit; the
    // original descendants are tagged so they can be told apart.
    el.querySelectorAll('*').forEach(function (c) { c.setAttribute('data-nbg-orig', ''); });
    el.setAttribute('contenteditable', 'true');
    el.setAttribute('spellcheck', 'true');
    el.classList.add('nbg-editing');
    try { document.execCommand('styleWithCSS', false, false); } catch (x) { /* tags, not spans */ }
    el.focus({ preventScroll: true });
    if (sel) {
      sel.removeAllRanges();
      if (ranges.length) ranges.forEach(function (r) { sel.addRange(r); });
      else { var r = document.createRange(); r.selectNodeContents(el); r.collapse(false); sel.addRange(r); }
    }
    showTools();
    codeFollow();
    toast('Editing — Enter applies, Esc cancels, Shift+Enter for a line break. Use the toolbar (or Ctrl/Cmd+B/I/U, Ctrl/Cmd+Shift+> / <) to format.', 3000);
    return true;
  }
  var KEEP_TAGS = /^(BR|B|STRONG|I|EM|U|S|STRIKE)$/;
  // Chrome expresses "un-bold inside a bold block" (and the italic/underline equivalents) as a
  // styled span; keep such spans when their style holds nothing but those three properties.
  var FORMAT_PROPS = /^(font-weight|font-style|font-size|font-family|color|line-height|text-decoration(-line|-style|-color|-thickness)?)$/;
  function isFormatSpan(c) {
    if (c.tagName !== 'SPAN' || c.attributes.length !== 1 || !c.hasAttribute('style')) return false;
    for (var i = 0; i < c.style.length; i++) if (!FORMAT_PROPS.test(c.style[i])) return false;
    return c.style.length > 0;
  }
  function endEdit() {
    var e = editing; editing = null;
    hideTools();
    codeRefresh();
    e.el.removeAttribute('contenteditable');
    e.el.removeAttribute('spellcheck');
    e.el.classList.remove('nbg-editing');
    if (e.el.getAttribute('class') === '') e.el.removeAttribute('class');
    // keep the original inline markup and the toolbar's b/i/u/s wrappers, drop whatever else the
    // browser wrapped around typed text (styled spans, fonts, divs)
    var all = Array.prototype.slice.call(e.el.querySelectorAll('*')).reverse();   // deepest first
    all.forEach(function (c) {
      if (c.hasAttribute('data-nbg-orig')) { c.removeAttribute('data-nbg-orig'); return; }
      if (KEEP_TAGS.test(c.tagName) || isFormatSpan(c)) { if (c.tagName !== 'BR' && !c.textContent) c.parentNode.removeChild(c); else if (c.tagName === 'STRIKE') { var s2 = document.createElement('s'); while (c.firstChild) s2.appendChild(c.firstChild); c.parentNode.replaceChild(s2, c); } return; }
      while (c.firstChild) c.parentNode.insertBefore(c.firstChild, c);
      c.parentNode.removeChild(c);
    });
    return e;
  }
  function commitEdit() {
    if (!editing) return false;
    var e = endEdit();
    var changed = false;
    if (e.el.innerHTML !== e.original) {
      var ed = findEdit(e.el, 'html');
      recordEdit(e.el, 'html', ed ? ed.original : e.original, e.el.innerHTML);
      changed = true;
    }
    if (attrStyle(e.el) !== e.preStyle) {
      var sd = findEdit(e.el, 'style');
      recordEdit(e.el, 'style', sd ? sd.original : e.preStyle, attrStyle(e.el));
      changed = true;
    }
    if (changed) toast('Text updated — ' + changesLabel() + '. Right-click → “Save edited copy” to download the deck with your changes.', 5000);
    return true;
  }
  function cancelEdit() {
    if (!editing) return false;
    var e = endEdit();
    e.el.innerHTML = e.original;
    apply(e.el, 'style', e.preStyle);
    return true;
  }

  /* ---------- floating panels (movable toolbars) ---------- */
  var panelPos = {};   // panel id -> { left, top } once the viewer dragged it; cleared by double-clicking the grip
  function makeMovable(panel, relayout) {
    var grip = document.createElement('span');
    grip.className = 'nbg-grip'; grip.textContent = '⋮⋮';
    grip.title = 'Drag to move this toolbar — double-click to let it follow the selection again';
    var host = panel.querySelector('.nbg-row') || panel;   // a multi-row panel keeps the grip in its first row
    host.insertBefore(grip, host.firstChild);
    var pd = null;
    grip.addEventListener('pointerdown', function (e) {
      e.preventDefault(); e.stopPropagation();
      var r = panel.getBoundingClientRect();
      pd = { id: e.pointerId, dx: e.clientX - r.left, dy: e.clientY - r.top };
      try { grip.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ }
    });
    grip.addEventListener('pointermove', function (e) {
      if (!pd || e.pointerId !== pd.id) return;
      var r = panel.getBoundingClientRect();
      var left = Math.max(0, Math.min(e.clientX - pd.dx, window.innerWidth - r.width));
      var top = Math.max(0, Math.min(e.clientY - pd.dy, window.innerHeight - r.height));
      panelPos[panel.id] = { left: left, top: top };
      panel.style.left = left + 'px'; panel.style.top = top + 'px';
    });
    grip.addEventListener('pointerup', function (e) { if (pd && e.pointerId === pd.id) pd = null; });
    grip.addEventListener('dblclick', function (e) { e.preventDefault(); e.stopPropagation(); delete panelPos[panel.id]; relayout(); });
    grip.addEventListener('contextmenu', function (e) { e.preventDefault(); e.stopPropagation(); });
  }
  function placePanel(panel, anchor) {
    panel.style.left = '0px'; panel.style.top = '0px';
    var tr = panel.getBoundingClientRect(), pos = panelPos[panel.id], left, top;
    if (pos) {
      left = Math.max(0, Math.min(pos.left, window.innerWidth - tr.width));
      top = Math.max(0, Math.min(pos.top, window.innerHeight - tr.height));
    } else {
      left = Math.max(8, Math.min(anchor.left, window.innerWidth - tr.width - 8));
      // above the anchor; else below it; else just inside its top edge (keeps the frame's handles free)
      top = anchor.top - tr.height - 12;
      if (top < 8) top = anchor.bottom + 12 + tr.height <= window.innerHeight - 8 ? anchor.bottom + 12 : Math.max(8, Math.min(anchor.top + 16, window.innerHeight - tr.height - 8));
    }
    panel.style.left = left + 'px'; panel.style.top = top + 'px';
  }
  function swatches(attr, list) {
    return '<span class="nbg-swatches">' + list.map(function (c) {
      var bg = c[0] === '' ? 'linear-gradient(135deg,#fff 45%,#0A1416 55%)' : c[0] === 'transparent' ? 'repeating-linear-gradient(45deg,#ddd 0 4px,#fff 4px 8px)' : c[0];
      return '<button type="button" data-' + attr + '="' + c[0] + '" title="' + c[1] + '" style="background:' + bg + '"></button>';
    }).join('') + '</span>';
  }
  function normColor(v) { if (!v) return ''; var d = document.createElement('i'); d.style.color = v; return d.style.color || v; }

  /* ---------- text formatting toolbar (shown while editing) ---------- */
  var FONTS = [
    ['', 'Default (Aptos)'], ["'Aptos', 'Inter', Helvetica, Arial, sans-serif", 'Aptos'], ["'Inter', Helvetica, Arial, sans-serif", 'Inter'],
    ['Helvetica, Arial, sans-serif', 'Helvetica'], ['Arial, sans-serif', 'Arial'], ['Georgia, serif', 'Georgia'],
    ["'Times New Roman', Times, serif", 'Times New Roman'], ["'Courier New', Courier, monospace", 'Courier New'],
  ];
  var COLORS = [['', 'Default'], ['#003841', 'Deep teal'], ['#007B85', 'Teal'], ['#00ADBF', 'Bright cyan'], ['#00CFE7', 'Electric cyan'], ['#0A1416', 'Black'], ['#5B6B6D', 'Grey'], ['#F5F8F6', 'Cream'], ['#FFFFFF', 'White']];
  var tools = null, toolsSel = null;
  function selectionInEditing() {
    var sel = window.getSelection();
    return !!(sel && sel.rangeCount && editing && editing.el.contains(sel.getRangeAt(0).commonAncestorContainer));
  }
  function currentRange() { var sel = window.getSelection(); return (sel && sel.rangeCount && selectionInEditing()) ? sel.getRangeAt(0) : null; }
  function saveSelection() { var r = currentRange(); toolsSel = r ? r.cloneRange() : null; }
  function restoreSelection() {
    if (!editing) return;
    if (document.activeElement === editing.el) return;      // the live selection is authoritative
    editing.el.focus({ preventScroll: true });
    var sel = window.getSelection();
    if (sel && toolsSel) { sel.removeAllRanges(); sel.addRange(toolsSel); }
  }
  function styleProp(el, prop) { return el.style.getPropertyValue(prop); }
  function setTextStyle(prop, value) {
    var el = editing.el;
    if (value === '' || value === null) el.style.removeProperty(prop); else el.style.setProperty(prop, value);
    if (el.getAttribute('style') === '') el.removeAttribute('style');
  }
  function fontSizePx(el) { return parseFloat(getComputedStyle(el).fontSize) || 16; }
  function setBlockFontSize(px) {
    var el = editing.el, cs = getComputedStyle(el);
    // keep the line-height proportional when the design fixed it in px
    if (!styleProp(el, 'line-height') && cs.lineHeight !== 'normal') {
      var ratio = (parseFloat(cs.lineHeight) || 0) / fontSizePx(el);
      if (ratio > 0) setTextStyle('line-height', String(Math.round(ratio * 1000) / 1000));
    }
    setTextStyle('font-size', Math.max(8, Math.round(px)) + 'px');
  }
  function toggleBlock(prop, on, off) {
    var el = editing.el, cur = styleProp(el, prop) || getComputedStyle(el)[prop.replace(/-([a-z])/g, function (_, c) { return c.toUpperCase(); })];
    setTextStyle(prop, (cur || '').indexOf(on) >= 0 ? off : on);
  }
  function toggleDecoration(kind) {
    var el = editing.el, cur = (styleProp(el, 'text-decoration') || getComputedStyle(el).textDecorationLine || '').split(/\s+/).filter(function (x) { return x && x !== 'none'; });
    var i = cur.indexOf(kind);
    if (i >= 0) cur.splice(i, 1); else cur.push(kind);
    setTextStyle('text-decoration', cur.length ? cur.join(' ') : 'none');
  }
  // Selection-level styling: wrap exactly the selected text runs in styled spans (reusing a span
  // that already wraps just that run), so the rest of the block is untouched.
  function wrapSelection(styler) {
    var range = currentRange(); if (!range || range.collapsed) return false;
    var root = range.commonAncestorContainer; if (root.nodeType === 3) root = root.parentNode;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), nodes = [];
    while (walker.nextNode()) { var n = walker.currentNode; if (n.nodeValue && range.intersectsNode(n)) nodes.push(n); }
    var wrapped = [];
    nodes.forEach(function (n) {
      var start = n === range.startContainer ? range.startOffset : 0;
      var end = n === range.endContainer ? range.endOffset : n.nodeValue.length;
      if (start >= end || !n.nodeValue.slice(start, end).trim()) return;      // nothing, or whitespace only
      var target = n;
      if (end < n.nodeValue.length) n.splitText(end);
      if (start > 0) target = n.splitText(start);
      var p = target.parentNode, span;
      if (p !== editing.el && p.tagName === 'SPAN' && !p.hasAttribute('data-nbg-orig') && p.childNodes.length === 1 && isFormatSpan(p)) span = p;
      else { span = document.createElement('span'); p.insertBefore(span, target); span.appendChild(target); }
      styler(span);
      if (!span.getAttribute('style')) { while (span.firstChild) span.parentNode.insertBefore(span.firstChild, span); span.parentNode.removeChild(span); wrapped.push(target); }
      else wrapped.push(span);
    });
    if (wrapped.length) {
      var sel = window.getSelection(), r = document.createRange();
      r.setStartBefore(wrapped[0]); r.setEndAfter(wrapped[wrapped.length - 1]);
      sel.removeAllRanges(); sel.addRange(r);
    }
    return wrapped.length > 0;
  }
  function unwrapSelectionSpans() {
    var range = currentRange(); if (!range) return;
    Array.prototype.slice.call(editing.el.querySelectorAll('span[style], b, i, u, s, strong, em, strike')).forEach(function (s) {
      if (s.hasAttribute('data-nbg-orig') || !range.intersectsNode(s)) return;
      while (s.firstChild) s.parentNode.insertBefore(s.firstChild, s);
      s.parentNode.removeChild(s);
    });
  }
  function format(action, value) {
    if (!editing) return false;
    restoreSelection();
    var range = currentRange(), ranged = !!(range && !range.collapsed), el = editing.el;
    var f = action === 'bigger' ? 1.1 : 1 / 1.1;
    switch (action) {
      case 'bold': if (ranged) document.execCommand('bold'); else toggleBlock('font-weight', '700', '400'); break;
      case 'italic': if (ranged) document.execCommand('italic'); else toggleBlock('font-style', 'italic', 'normal'); break;
      case 'underline': if (ranged) document.execCommand('underline'); else toggleDecoration('underline'); break;
      case 'strike': if (ranged) document.execCommand('strikeThrough'); else toggleDecoration('line-through'); break;
      case 'bigger': case 'smaller':
        if (ranged) wrapSelection(function (span) { span.style.fontSize = Math.max(8, Math.round(fontSizePx(span) * f)) + 'px'; });
        else setBlockFontSize(fontSizePx(el) * f);
        break;
      case 'size':
        if (!value) break;
        if (ranged) wrapSelection(function (span) { span.style.fontSize = Math.max(8, Math.round(parseFloat(value))) + 'px'; });
        else setBlockFontSize(parseFloat(value));
        break;
      case 'family':
        if (ranged) wrapSelection(function (span) { if (value) span.style.fontFamily = value; else span.style.removeProperty('font-family'); });
        else setTextStyle('font-family', value || '');
        break;
      case 'color':
        if (ranged) wrapSelection(function (span) { if (value) span.style.color = value; else span.style.removeProperty('color'); });
        else setTextStyle('color', value || '');
        break;
      case 'align': setTextStyle('text-align', value || ''); break;
      case 'clear': {
        // selection: drop its tags and styled spans; no selection: the block returns to the inline
        // style it had before any formatting (this session's or an earlier saved one)
        if (ranged) { document.execCommand('removeFormat'); unwrapSelectionSpans(); }
        else { var rec = findEdit(el, 'style'); apply(el, 'style', rec ? rec.original : editing.preStyle); }
        break;
      }
      default: return false;
    }
    layoutTools(); saveSelection();
    return true;
  }
  function buildTools() {
    tools = document.createElement('div');
    tools.id = 'nbg-text-tools'; tools.className = 'nbg-panel';
    tools.setAttribute('role', 'toolbar');
    var h = '';
    h += '<button type="button" data-f="bold" title="Bold (Ctrl/Cmd+B) — the selection, or the whole text when nothing is selected"><b>B</b></button>';
    h += '<button type="button" data-f="italic" title="Italic (Ctrl/Cmd+I)"><i>I</i></button>';
    h += '<button type="button" data-f="underline" title="Underline (Ctrl/Cmd+U)"><u>U</u></button>';
    h += '<button type="button" data-f="strike" title="Strikethrough"><s>S</s></button>';
    h += '<i class="nbg-tsep"></i>';
    h += '<button type="button" data-f="smaller" title="Smaller (Ctrl/Cmd+Shift+&lt;) — the selection, or the whole text">A−</button>';
    h += '<input type="number" data-f="size" min="8" max="400" step="1" title="Font size in px — the selection, or the whole text" aria-label="Font size">';
    h += '<button type="button" data-f="bigger" title="Larger (Ctrl/Cmd+Shift+&gt;) — the selection, or the whole text">A+</button>';
    h += '<i class="nbg-tsep"></i>';
    h += '<select data-f="family" title="Font family — the selection, or the whole text" aria-label="Font family">' + FONTS.map(function (f) { return '<option value="' + f[0].replace(/"/g, '&quot;') + '">' + f[1] + '</option>'; }).join('') + '</select>';
    h += '<i class="nbg-tsep"></i>';
    h += swatches('f="color" data-v', COLORS).replace('<span class="nbg-swatches">', '<span class="nbg-swatches" title="Text colour (NBG palette) — the selection, or the whole text">');
    h += '<i class="nbg-tsep"></i>';
    h += '<button type="button" data-f="align" data-v="left" title="Align left">⇤</button><button type="button" data-f="align" data-v="center" title="Centre">☰</button><button type="button" data-f="align" data-v="right" title="Align right">⇥</button>';
    h += '<i class="nbg-tsep"></i>';
    h += '<button type="button" data-f="clear" class="nbg-tquiet" title="Clear formatting — the selection, or the whole text back to its design">Clear</button>';
    h += '<button type="button" data-f="done" class="nbg-tdone" title="Apply (Enter)">Done</button>';
    tools.innerHTML = h;
    makeMovable(tools, layoutTools);
    // keep the editable focused and its selection intact while using the buttons
    tools.addEventListener('pointerdown', function (e) { if (!e.target.closest('input, select')) e.preventDefault(); saveSelection(); });
    tools.addEventListener('click', function (e) {
      e.stopPropagation();
      var b = e.target.closest('button'); if (!b) return;
      e.preventDefault();
      var f = b.getAttribute('data-f');
      if (f === 'done') { commitEdit(); return; }
      format(f, b.getAttribute('data-v'));
    });
    tools.querySelector('[data-f=size]').addEventListener('change', function (e) { format('size', e.target.value); restoreSelection(); });
    tools.querySelector('[data-f=size]').addEventListener('keydown', function (e) { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); format('size', e.target.value); restoreSelection(); } if (e.key === 'Escape') { e.preventDefault(); restoreSelection(); } });
    tools.querySelector('[data-f=family]').addEventListener('change', function (e) { format('family', e.target.value); restoreSelection(); });
    tools.querySelector('[data-f=family]').addEventListener('keydown', function (e) { e.stopPropagation(); });
    document.body.appendChild(tools);
  }
  function showTools() { if (!tools) buildTools(); tools.hidden = false; layoutTools(); }
  function hideTools() { if (tools) tools.hidden = true; toolsSel = null; }
  function inlineUp(node, prop) {      // nearest inline value of prop from node up to the edited block
    var el = node && node.nodeType === 3 ? node.parentElement : node;
    while (el && editing && (el === editing.el || editing.el.contains(el))) { var v = styleProp(el, prop); if (v) return v; if (el === editing.el) break; el = el.parentElement; }
    return '';
  }
  function layoutTools() {
    if (!tools || tools.hidden || !editing) return;
    var el = editing.el, range = currentRange();
    var probe = range ? (range.startContainer.nodeType === 3 ? range.startContainer.parentElement : range.startContainer) : el;
    if (!probe || !(probe === el || el.contains(probe))) probe = el;
    var cs = getComputedStyle(probe);
    placePanel(tools, el.getBoundingClientRect());
    tools.querySelector('[data-f=size]').value = Math.round(fontSizePx(probe));
    var fam = inlineUp(probe, 'font-family'), famSel = tools.querySelector('[data-f=family]');
    famSel.value = fam; if (famSel.value !== fam) famSel.value = '';
    tools.querySelector('[data-f=bold]').classList.toggle('nbg-on', parseInt(cs.fontWeight, 10) >= 600);
    tools.querySelector('[data-f=italic]').classList.toggle('nbg-on', cs.fontStyle === 'italic');
    tools.querySelector('[data-f=underline]').classList.toggle('nbg-on', /underline/.test(cs.textDecorationLine));
    tools.querySelector('[data-f=strike]').classList.toggle('nbg-on', /line-through/.test(cs.textDecorationLine));
    Array.prototype.forEach.call(tools.querySelectorAll('[data-f=align]'), function (b) { b.classList.toggle('nbg-on', styleProp(el, 'text-align') === b.getAttribute('data-v')); });
    var col = normColor(inlineUp(probe, 'color'));
    Array.prototype.forEach.call(tools.querySelectorAll('[data-f=color]'), function (b) { b.classList.toggle('nbg-on', col === normColor(b.getAttribute('data-v'))); });
  }
  document.addEventListener('selectionchange', function () { if (editing && tools && !tools.hidden) layoutTools(); });

  /* ---------- shapes: selection (one or many), resize / move ---------- */
  var shape = null;        // { el } — the primary shape (the last one selected); `sel` holds every selected element
  var sel = [];
  var box = null, chip = null, marks = null, rubber = null, drag = null, marquee = null, swallowClick = false;
  var HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
  var CURSORS = { nw: 'nwse-resize', se: 'nwse-resize', ne: 'nesw-resize', sw: 'nesw-resize', n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize' };
  var MIN = 16;

  function slideOf(el) { return el.closest('.slide'); }
  function slideScale(el) {
    var slide = slideOf(el) || el;
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
      // an element sized by its right/bottom anchors (inset, or a shrink-to-fit text block) keeps its size
      if (!el.style.width && el.offsetWidth !== g.width) setSize(el, g, g.width, null);
      if (!el.style.height && el.offsetHeight !== g.height) setSize(el, g, null, g.height);
    } else {
      if (!g.relative) el.style.setProperty('position', 'relative');
      el.style.setProperty('left', Math.round(l) + 'px'); el.style.setProperty('top', Math.round(t) + 'px');
    }
  }
  // move by (dx, dy) artboard px: absolute geometry for positioned elements, relative offsets for flow ones
  function shift(el, g, dx, dy) { if (g.positioned) setPos(el, g, g.left + dx, g.top + dy); else setPos(el, g, g.rleft + dx, g.rtop + dy); }
  // record the element's `kind` value as an edit when it differs from `pre` (the first original is kept)
  function track(el, kind, pre) {
    var now = current(el, kind); if (now === pre) return false;
    var ed = findEdit(el, kind);
    recordEdit(el, kind, ed ? ed.original : pre, now);
    return true;
  }
  // run fn, then record every listed element whose inline style changed; returns how many did
  function withRecords(els, fn) {
    var pre = els.map(function (el) { return attrStyle(el); }), n = 0;
    fn();
    els.forEach(function (el, i) { if (track(el, 'style', pre[i])) n++; });
    layoutBox();
    return n;
  }
  function unionRect(els) {
    var u = null;
    els.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (!u) u = { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
      else { u.left = Math.min(u.left, r.left); u.top = Math.min(u.top, r.top); u.right = Math.max(u.right, r.right); u.bottom = Math.max(u.bottom, r.bottom); }
    });
    if (u) { u.width = u.right - u.left; u.height = u.bottom - u.top; }
    return u;
  }
  function underPoint(x, y) { return document.elementsFromPoint(x, y).filter(function (n) { return !n.closest(OURS); })[0] || null; }
  // the selected shape that is (or contains) t — a click on a nested part of a selected shape means that shape
  function ownerOf(t) { var o = null; if (t) sel.forEach(function (m) { if (!o && (m === t || m.contains(t))) o = m; }); return o; }
  // the outermost shape containing t (backdrops excluded) — what Shift+click, the selection box and
  // Select all work with; Ctrl/Cmd+click and the menu keep the precise element under the pointer
  function topShape(t) {
    if (!t) return null;
    var slide = slideOf(t), best = null, el = t;
    while (slide && el && el !== slide) { if (isShapeEl(el) && !isBackdrop(el, slide)) best = el; el = el.parentElement; }
    return best || t;
  }
  function pick(t, precise) { return ownerOf(t) || (precise ? t : topShape(t)); }

  /* selection model — groups are logical: members carry data-nbg-group="<id>" (a 'group' edit record) */
  function groupId(el) { return el.getAttribute('data-nbg-group') || null; }
  function groupMembers(el) {
    var id = groupId(el); if (!id) return [el];
    return Array.prototype.slice.call((slideOf(el) || document).querySelectorAll('[data-nbg-group="' + id + '"]'));
  }
  function docOrder(a, b) { return a === b ? 0 : (a.compareDocumentPosition(b) & 4) ? -1 : 1; }   // 4 = DOCUMENT_POSITION_FOLLOWING
  function expandGroups(els) {   // whole groups, no duplicates, document order
    var out = [];
    els.forEach(function (el) { if (el) groupMembers(el).forEach(function (m) { if (out.indexOf(m) < 0) out.push(m); }); });
    return out.sort(docOrder);
  }
  function isShapeEl(el) { return el.offsetWidth > 0 && el.offsetHeight > 0 && resolveShapeTarget(el) === el; }
  // a layer that fills the slide is its backdrop, not a shape (it can still be picked by right-click)
  function isBackdrop(el, slide) { return el.offsetWidth >= slide.offsetWidth * 0.98 && el.offsetHeight >= slide.offsetHeight * 0.98; }
  function slideShapes(slide) {   // the top-level shapes of a slide: shapes with no shape ancestor, backdrops excluded
    var all = Array.prototype.filter.call(slide.querySelectorAll('*'), function (el) { return isShapeEl(el) && !isBackdrop(el, slide); });
    return all.filter(function (el) { var p = el.parentElement; while (p && p !== slide) { if (all.indexOf(p) >= 0) return false; p = p.parentElement; } return true; });
  }
  function sameGroup() { var id = groupId(shape.el); return !!id && sel.every(function (m) { return groupId(m) === id; }); }
  function selectionToast() {
    var n = sel.length;
    if (n === 1) toast('Shape selected — drag the handles to resize (Shift keeps proportions), drag inside to move, arrows nudge, Tab selects the enclosing shape; Shift+click adds another shape, Shift+drag on the slide draws a selection box. The toolbar sets size and style, orders, aligns, distributes and groups. Esc when done.', 5000);
    else toast((sameGroup() ? 'Group of ' : '') + n + ' shapes selected — drag to move them together, handles scale them; the toolbar orders, aligns, distributes and groups them. Shift+click adds or removes a shape, Ctrl/Cmd+click picks one shape alone, Shift+drag draws a selection box. Esc when done.', 5000);
  }
  function setSelection(els, primary, opts) {
    opts = opts || {};
    var list = [];
    (opts.raw ? els : expandGroups(els)).forEach(function (el) { if (el && list.indexOf(el) < 0) list.push(el); });
    // a container and something inside it never travel together (a move would apply twice): keep the outer one
    var nested = list.filter(function (el) { return list.some(function (o) { return o !== el && o.contains(el); }); });
    if (nested.length) { list = list.filter(function (el) { return nested.indexOf(el) < 0; }); if (opts.toast !== false || nested.length) toast(nested.length + ' inner shape' + (nested.length === 1 ? '' : 's') + ' left out — its container is selected. Ctrl/Cmd+click picks an inner shape on its own.', 3000); }
    if (!list.length) { deselectShape(); return false; }
    if (busy) return false;
    if (editing) commitEdit();
    closeMenu();
    ensureBox();
    sel = list;
    shape = { el: primary && list.indexOf(primary) >= 0 ? primary : list[list.length - 1] };
    box.hidden = false;
    layoutBox();
    showShapeTools();
    if (opts.toast !== false) selectionToast();
    codeFollow();
    return true;
  }
  function selectShape(el) { return !!el && setSelection([el], el); }
  function selectShapes(els) { return setSelection(els || [], null); }
  function selectSolo(el, quiet) {   // one element on its own, even when it belongs to a group
    if (!el) return false;
    var ok = setSelection([el], el, { raw: true, toast: false });
    if (ok && !quiet) toast(groupId(el) ? 'One member of the group selected on its own — Shift+click adds shapes, Esc when done.' : 'Shape selected — Shift+click adds another shape, Esc when done.', 3000);
    return ok;
  }
  // Ctrl/Cmd+click: the innermost shape under the point; clicking the same spot again goes one
  // level out (nested or behind), wrapping round — the toolbar's Stack list shows the same choices
  function pickAtPoint(x, y, fallback) {
    var st = shapeStack(x, y);
    if (!st.length) return selectSolo(fallback);
    var i = sel.length === 1 ? st.indexOf(shape.el) : -1;
    var el = st[i >= 0 ? (i + 1) % st.length : 0], pos = st.indexOf(el);
    var ok = selectSolo(el, true);
    if (ok) toast(describe(el) + ' selected' + (st.length > 1 ? ' — ' + (pos + 1) + ' of ' + st.length + ' at this point; Ctrl/Cmd+click again for the next one, Tab / Shift+Tab move out / in, or pick from the toolbar’s Stack list.' : '.'), 3500);
    return ok;
  }
  function addToSelection(el) {
    if (!el) return false;
    if (!shape) return selectShape(el);
    if (sel.indexOf(el) >= 0) return true;
    var ok = setSelection(sel.concat([el]), el, { toast: false });
    if (ok) toast(sel.length + ' shapes selected.', 1500);
    return ok;
  }
  function removeFromSelection(el) {
    if (!el || !shape) return false;
    var gone = groupMembers(el), rest = sel.filter(function (m) { return gone.indexOf(m) < 0; });
    if (!rest.length) return deselectShape();
    var ok = setSelection(rest, null, { toast: false });
    if (ok) toast(sel.length + ' shape' + (sel.length === 1 ? '' : 's') + ' selected.', 1500);
    return ok;
  }
  function toggleSelection(el) { return sel.indexOf(el) >= 0 ? removeFromSelection(el) : addToSelection(el); }
  function selectAllIn(slide) {
    slide = slide || (shape ? slideOf(shape.el) : null); if (!slide) return false;
    var all = slideShapes(slide);
    if (!all.length) { toast('No shapes found on this slide.', 2000); return false; }
    var ok = setSelection(all, null, { toast: false });
    if (ok) toast(sel.length + ' shape' + (sel.length === 1 ? '' : 's') + ' selected — the toolbar aligns, distributes, orders and groups them.', 3000);
    return ok;
  }
  function deselectShape() {
    if (!shape) return false;
    shape = null; sel = []; drag = null; marquee = null;
    if (box) box.hidden = true;
    if (marks) marks.hidden = true;
    if (rubber) rubber.hidden = true;
    hideShapeTools();
    codeRefresh();
    return true;
  }

  /* frame + per-shape marks + rubber band */
  function ensureBox() {
    if (box) return;
    marks = document.createElement('div'); marks.id = 'nbg-sel-marks'; marks.hidden = true; document.body.appendChild(marks);
    rubber = document.createElement('div'); rubber.id = 'nbg-marquee'; rubber.hidden = true; document.body.appendChild(rubber);
    box = document.createElement('div'); box.id = 'nbg-shape-box'; box.hidden = true;
    HANDLES.forEach(function (h) { var d = document.createElement('div'); d.className = 'nbg-h nbg-h-' + h; d.setAttribute('data-h', h); d.style.cursor = CURSORS[h]; box.appendChild(d); });
    chip = document.createElement('div'); chip.className = 'nbg-chip'; box.appendChild(chip);
    box.addEventListener('pointerdown', onShapePointerDown);
    box.addEventListener('click', function (e) { e.stopPropagation(); e.preventDefault(); });     // the deck's own click handlers stay out of it
    box.addEventListener('dblclick', function (e) {
      // double-click on the frame: hand over to text editing of what is underneath
      var t = resolveTextTarget(underPoint(e.clientX, e.clientY));
      if (t) { e.preventDefault(); e.stopPropagation(); deselectShape(); startEdit(t, false); }
    });
    box.addEventListener('contextmenu', function (e) {
      e.preventDefault(); e.stopPropagation();
      // the menu refers to the selected shape under the pointer (a descendant counts as its shape), else to what is there
      // the menu refers to the selected shape under the pointer; with several selected, an unselected
      // shape inside the frame is offered as itself (Add to selection); with one, the frame IS the shape
      var under = underPoint(e.clientX, e.clientY), t = resolveShapeTarget(under);
      openMenu(e.clientX, e.clientY, resolveTextTarget(under), ownerOf(t) || (sel.length > 1 && t) || (shape ? shape.el : t));
    });
    document.body.appendChild(box);
  }
  function layoutMarks() {
    if (!marks) return;
    marks.hidden = sel.length < 2;
    if (marks.hidden) return;
    while (marks.children.length > sel.length) marks.removeChild(marks.lastChild);
    while (marks.children.length < sel.length) marks.appendChild(document.createElement('div'));
    sel.forEach(function (m, i) {
      var r = m.getBoundingClientRect(), d = marks.children[i];
      d.style.left = r.left + 'px'; d.style.top = r.top + 'px'; d.style.width = r.width + 'px'; d.style.height = r.height + 'px';
      d.classList.toggle('nbg-primary', m === shape.el);
    });
  }
  function layoutBox() {
    if (!shape || !box || box.hidden) return;
    var multi = sel.length > 1, el = shape.el, g = geom(el), u = unionRect(sel), scale = slideScale(el) || 1;
    box.style.left = u.left + 'px'; box.style.top = u.top + 'px'; box.style.width = u.width + 'px'; box.style.height = u.height + 'px';
    box.classList.toggle('nbg-flow', !multi && !g.positioned);
    box.classList.toggle('nbg-multi', multi);
    if (multi) chip.textContent = (sameGroup() ? 'Group · ' : '') + sel.length + ' shapes · ' + Math.round(u.width / scale) + ' × ' + Math.round(u.height / scale);
    else chip.textContent = Math.round(g.width) + ' × ' + Math.round(g.height) + (g.positioned ? ' · L ' + Math.round(g.left) + ' T ' + Math.round(g.top) : g.relative || el.style.position === 'relative' ? ' · Δ ' + Math.round(g.rleft) + ', ' + Math.round(g.rtop) : '');
    chip.classList.toggle('nbg-chip-below', u.top < 40);
    layoutMarks();
    if (!drag) layoutShapeTools();
  }

  /* dragging: move every selected shape; handles resize one shape or scale the whole selection */
  function members() { return sel.map(function (m) { return { el: m, g: geom(m), r: m.getBoundingClientRect(), preStyle: attrStyle(m), moved: false }; }); }
  // scale the members proportionally from the union box u (screen px) to U1
  function scaleMembers(ms, u, U1, touchW, touchH, scale) {
    var sx = u.width ? U1.width / u.width : 1, sy = u.height ? U1.height / u.height : 1;
    ms.forEach(function (m) {
      var fx = u.width ? (m.r.left - u.left) / u.width : 0, fy = u.height ? (m.r.top - u.top) / u.height : 0;
      var ddx = (U1.left + fx * U1.width - m.r.left) / scale, ddy = (U1.top + fy * U1.height - m.r.top) / scale;
      if (Math.round(ddx) || Math.round(ddy) || m.moved || m.g.positioned) { shift(m.el, m.g, ddx, ddy); m.moved = true; }
      setSize(m.el, m.g, touchW ? Math.max(MIN, m.g.width * sx) : null, touchH ? Math.max(MIN, m.g.height * sy) : null);
    });
  }
  // the new box for a handle drag by (dx, dy) from box u; MIN scaled to screen px
  function resizedBox(u, h, dx, dy, keepRatio, min) {
    var L = u.left, T = u.top, W = u.width, H = u.height;
    if (h.indexOf('e') >= 0) W = u.width + dx;
    if (h.indexOf('s') >= 0) H = u.height + dy;
    if (h.indexOf('w') >= 0) W = u.width - dx;
    if (h.indexOf('n') >= 0) H = u.height - dy;
    if (keepRatio && h.length === 2 && u.height && u.width) {
      var ratio = u.width / u.height;
      if (Math.abs(W - u.width) / u.width >= Math.abs(H - u.height) / u.height) H = W / ratio; else W = H * ratio;
    }
    W = Math.max(min, W); H = Math.max(min, H);
    if (h.indexOf('w') >= 0) L = u.left + (u.width - W);
    if (h.indexOf('n') >= 0) T = u.top + (u.height - H);
    return { left: L, top: T, width: W, height: H };
  }
  function finishDrag(cancel) {
    if (!drag) return;
    var d = drag; drag = null;
    if (cancel) { d.members.forEach(function (m) { apply(m.el, 'style', m.preStyle); }); layoutBox(); return; }
    var n = 0;
    d.members.forEach(function (m) { if (track(m.el, 'style', m.preStyle)) n++; });
    if (n) toast((d.members.length > 1 ? d.members.length + ' shapes' : 'Shape') + ' updated — ' + changesLabel() + '. Right-click → “Save edited copy” to download the deck with your changes.', 4000);
    layoutBox();
  }
  function onShapePointerDown(e) {
    if (!shape || e.button !== 0) return;
    e.preventDefault(); e.stopPropagation();
    if (e.shiftKey || e.metaKey || e.ctrlKey) {                     // adjust the selection through the frame
      var t = pick(resolveShapeTarget(underPoint(e.clientX, e.clientY)), !e.shiftKey);
      if (e.shiftKey) { if (t) toggleSelection(t); } else pickAtPoint(e.clientX, e.clientY, t);
      swallowClick = true;
      return;
    }
    var ms = members(), h = e.target.getAttribute && e.target.getAttribute('data-h');
    if (h && ms.length === 1 && !ms[0].g.positioned && !/^(e|s|se)$/.test(h)) return;   // a flow element only grows right/down
    drag = { members: ms, mode: h ? 'resize' : 'move', h: h, startX: e.clientX, startY: e.clientY, scale: slideScale(shape.el) || 1, union: unionRect(sel), pointerId: e.pointerId };
    try { box.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ }
  }
  function onShapePointerMove(e) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    e.preventDefault();
    var d = drag, dx = (e.clientX - d.startX) / d.scale, dy = (e.clientY - d.startY) / d.scale;
    if (d.mode === 'move') d.members.forEach(function (m) { shift(m.el, m.g, dx, dy); });
    else if (d.members.length === 1) {
      var m = d.members[0], g = m.g, h = d.h;
      var nb = resizedBox({ left: g.left, top: g.top, width: g.width, height: g.height }, h, dx, dy, e.shiftKey, MIN);
      var touchW = /e|w/.test(h) || (e.shiftKey && h.length === 2), touchH = /n|s/.test(h) || (e.shiftKey && h.length === 2);
      // pin the top-left corner first: a right/bottom-anchored element would otherwise slide when
      // its width/height changes (the anchor stays, the opposite edge moves)
      if (g.positioned) setPos(m.el, g, nb.left, nb.top);
      setSize(m.el, g, touchW ? nb.width : null, touchH ? nb.height : null);
    } else {
      var U1 = resizedBox(d.union, d.h, e.clientX - d.startX, e.clientY - d.startY, e.shiftKey, MIN * d.scale);
      var tw = /e|w/.test(d.h) || (e.shiftKey && d.h.length === 2), th = /n|s/.test(d.h) || (e.shiftKey && d.h.length === 2);
      scaleMembers(d.members, d.union, U1, tw, th, d.scale);
    }
    layoutBox();
  }
  function nudge(dx, dy, resize) {
    if (!shape) return;
    withRecords(sel, function () {
      sel.forEach(function (el) {
        var g = geom(el);
        if (resize) { if (g.positioned) setPos(el, g, g.left, g.top); setSize(el, g, dx ? Math.max(MIN, g.width + dx) : null, dy ? Math.max(MIN, g.height + dy) : null); }
        else shift(el, g, dx, dy);
      });
    });
  }
  function resetShape(el) {
    var ed = findEdit(el, 'style'); if (!ed) return false;
    apply(el, 'style', ed.original);
    edits = edits.filter(function (e) { return e !== ed; }); store();
    layoutBox();
    toast('Shape reset to its original geometry and style.', 2500);
    return true;
  }
  function resetSelection() {
    var n = 0; sel.forEach(function (el) { if (resetShape(el)) n++; });
    if (!n) toast('Nothing to reset.', 1500); else if (n > 1) toast(n + ' shapes reset to their original geometry and style.', 2500);
    return n > 0;
  }

  /* rubber-band selection (Shift+drag on a slide) and modifier clicks */
  function startSelectGesture(e) {
    var t = e.target; if (!t || !t.closest || t.closest(OURS)) return false;
    if (t.closest('a[href], input, textarea, select, button, [contenteditable="true"]')) return false;
    var slide = t.closest('.slide'); if (!slide) return false;
    if (!shape && !e.shiftKey) return false;                          // Ctrl/Cmd+click only refines an existing selection
    e.preventDefault(); e.stopPropagation();
    marquee = { x: e.clientX, y: e.clientY, slide: slide, target: resolveShapeTarget(t), shift: e.shiftKey, pointerId: e.pointerId, moved: false };
    swallowClick = true;
    return true;
  }
  function marqueeRect(m, e) {
    return { left: Math.min(m.x, e.clientX), top: Math.min(m.y, e.clientY), right: Math.max(m.x, e.clientX), bottom: Math.max(m.y, e.clientY) };
  }
  function moveMarquee(e) {
    var m = marquee;
    if (!m.moved && Math.abs(e.clientX - m.x) < 4 && Math.abs(e.clientY - m.y) < 4) return;
    m.moved = true;
    var r = marqueeRect(m, e); ensureBox();
    rubber.hidden = false; rubber.style.left = r.left + 'px'; rubber.style.top = r.top + 'px'; rubber.style.width = (r.right - r.left) + 'px'; rubber.style.height = (r.bottom - r.top) + 'px';
  }
  function finishMarquee(e, cancel) {
    var m = marquee; marquee = null;
    if (rubber) rubber.hidden = true;
    if (cancel) return;
    if (!m.moved) { var t = pick(m.target, !m.shift); if (m.shift) { if (t) toggleSelection(t); } else pickAtPoint(m.x, m.y, t); return; }
    var r = marqueeRect(m, e);
    var hits = slideShapes(m.slide).filter(function (el) { var b = el.getBoundingClientRect(); return b.left >= r.left - 1 && b.right <= r.right + 1 && b.top >= r.top - 1 && b.bottom <= r.bottom + 1; });
    if (!hits.length) { toast('No shape lies fully inside the box — drag around whole shapes.', 2000); return; }
    var keep = shape && slideOf(shape.el) === m.slide ? sel : [];
    setSelection(keep.concat(hits), hits[hits.length - 1], { toast: false });
    toast(sel.length + ' shape' + (sel.length === 1 ? '' : 's') + ' selected.', 2000);
  }
  window.addEventListener('pointermove', function (e) {
    if (marquee && e.pointerId === marquee.pointerId) { e.preventDefault(); moveMarquee(e); return; }
    onShapePointerMove(e);
  }, true);
  window.addEventListener('pointerup', function (e) {
    if (marquee && e.pointerId === marquee.pointerId) { finishMarquee(e, false); return; }
    if (drag && e.pointerId === drag.pointerId) finishDrag(false);
  }, true);
  window.addEventListener('pointercancel', function (e) { if (marquee) finishMarquee(e, true); finishDrag(true); }, true);
  document.addEventListener('click', function (e) { if (swallowClick) { swallowClick = false; e.stopPropagation(); e.preventDefault(); } }, true);
  window.addEventListener('resize', function () { requestAnimationFrame(layoutBox); });
  window.addEventListener('scroll', function () { requestAnimationFrame(layoutBox); }, true);

  /* ---------- arrange: align, distribute, order, group ---------- */
  function refRectFor(mode) {
    if (mode !== 'slide' && sel.length > 1) return unionRect(sel);
    return slideOf(shape.el).getBoundingClientRect();
  }
  function alignSelection(kind, mode) {
    if (!shape) return false;
    var ref = refRectFor(mode), scale = slideScale(shape.el) || 1;
    var n = withRecords(sel, function () {
      sel.forEach(function (el) {
        var r = el.getBoundingClientRect(), dx = 0, dy = 0;
        if (kind === 'left') dx = ref.left - r.left;
        else if (kind === 'center') dx = (ref.left + ref.width / 2) - (r.left + r.width / 2);
        else if (kind === 'right') dx = ref.right - r.right;
        else if (kind === 'top') dy = ref.top - r.top;
        else if (kind === 'middle') dy = (ref.top + ref.height / 2) - (r.top + r.height / 2);
        else if (kind === 'bottom') dy = ref.bottom - r.bottom;
        if (Math.round(dx / scale) || Math.round(dy / scale)) shift(el, geom(el), dx / scale, dy / scale);
      });
    });
    toast(n ? 'Aligned ' + kind + (mode === 'slide' || sel.length < 2 ? ' to the slide' : ' within the selection') + ' — ' + changesLabel() + '.' : 'Already aligned ' + kind + '.', 2500);
    return n > 0;
  }
  function distributeSelection(axis, mode) {
    if (!shape) return false;
    var horiz = axis === 'h', toSlide = mode === 'slide';
    if (sel.length < (toSlide ? 2 : 3)) { toast('Select at least ' + (toSlide ? 'two' : 'three') + ' shapes to distribute them' + (toSlide ? '' : ' (or choose “to slide” for two)') + '.', 3000); return false; }
    var items = sel.map(function (el) { return { el: el, r: el.getBoundingClientRect() }; });
    // along the axis, ties by the other axis, then document order (sel is in document order)
    items.sort(function (a, b) { return (horiz ? a.r.left - b.r.left || a.r.top - b.r.top : a.r.top - b.r.top || a.r.left - b.r.left); });
    var sum = 0; items.forEach(function (it) { sum += horiz ? it.r.width : it.r.height; });
    var ref = refRectFor(mode), scale = slideScale(shape.el) || 1, start, gap;
    if (toSlide) { gap = ((horiz ? ref.width : ref.height) - sum) / (items.length + 1); start = (horiz ? ref.left : ref.top) + gap; }
    else {
      var first = items[0].r, last = items[items.length - 1].r;
      gap = ((horiz ? last.right - first.left : last.bottom - first.top) - sum) / (items.length - 1);
      start = horiz ? first.left : first.top;
    }
    var n = withRecords(sel, function () {
      var pos = start;
      items.forEach(function (it) {
        var d = (pos - (horiz ? it.r.left : it.r.top)) / scale;
        if (Math.round(d)) shift(it.el, geom(it.el), horiz ? d : 0, horiz ? 0 : d);
        pos += (horiz ? it.r.width : it.r.height) + gap;
      });
    });
    toast(n ? 'Distributed ' + (horiz ? 'horizontally' : 'vertically') + ' with equal gaps of ' + Math.round(gap / scale) + ' px — ' + changesLabel() + '.' : 'Already evenly distributed.', 2500);
    return n > 0;
  }
  // z-order: effective layer of an element among its siblings — negative z-index < in-flow content (0)
  // < positioned with z-index auto/0 (0.5) < positive z-index; ties are painted in document order
  var SKIP_TAGS = /^(script|style|template|link|meta|noscript)$/i;
  function zKey(el) {
    var cs = getComputedStyle(el), pos = cs.position !== 'static';
    if (cs.zIndex !== 'auto') { var n = parseInt(cs.zIndex, 10) || 0; return n === 0 ? (pos ? 0.5 : 0) : n; }
    return pos ? 0.5 : 0;
  }
  function tierAbove(k) { return k < -1 ? k + 1 : k < 0.5 ? 0.5 : k < 1 ? 1 : Math.floor(k) + 1; }
  function tierBelow(k) { return k > 1 ? Math.ceil(k) - 1 : k > 0.5 ? 0.5 : k >= 0 ? -1 : k - 1; }
  function stackOrder(parent) {   // visible element siblings, bottom to top
    return Array.prototype.filter.call(parent.children, function (c) { return !SKIP_TAGS.test(c.tagName) && !c.closest(OURS) && getComputedStyle(c).display !== 'none'; })
      .map(function (c, i) { return { el: c, z: zKey(c), i: i }; })
      .sort(function (a, b) { return a.z - b.z || a.i - b.i; });
  }
  function isStackingContext(el) {
    var cs = getComputedStyle(el);
    return cs.isolation === 'isolate' || (cs.position !== 'static' && cs.zIndex !== 'auto') || cs.position === 'fixed' || cs.position === 'sticky' ||
      parseFloat(cs.opacity) < 1 || cs.transform !== 'none' || (cs.filter || 'none') !== 'none' || (cs.backdropFilter || 'none') !== 'none' ||
      cs.mixBlendMode !== 'normal' || (cs.clipPath || 'none') !== 'none' || (cs.maskImage || 'none') !== 'none' || cs.perspective !== 'none' ||
      /transform|opacity|filter/.test(cs.willChange) || /paint|layout|strict|content/.test(cs.contain || '');
  }
  function setZ(el, z) {
    if (getComputedStyle(el).position === 'static') el.style.setProperty('position', 'relative');
    el.style.setProperty('z-index', String(z === 0.5 ? 0 : z));
    // a negative z-index sinks below the parent's background unless the parent is a stacking context
    if (z < 0 && el.parentElement && !isStackingContext(el.parentElement)) el.parentElement.style.setProperty('isolation', 'isolate');
  }
  function orderOne(el, action) {
    var order = stackOrder(el.parentElement), idx = -1, j, z;
    order.forEach(function (o, i) { if (o.el === el) idx = i; });
    if (idx < 0) return;
    var top = order.length - 1;
    if (action === 'front') { if (idx < top) setZ(el, tierAbove(order[top].z)); }
    else if (action === 'back') { if (idx > 0) setZ(el, tierBelow(order[0].z)); }
    else if (action === 'forward') {
      if (idx === top) return;
      var A = order[idx + 1], cand = tierAbove(A.z);
      for (j = idx + 2, z = cand; j < order.length && order[j].z <= z; j++) { z = tierAbove(z); setZ(order[j].el, z); }   // make room above
      setZ(el, cand);
    } else if (action === 'backward') {
      if (idx === 0) return;
      var B = order[idx - 1], cand2 = tierBelow(B.z);
      for (j = idx - 2, z = cand2; j >= 0 && order[j].z >= z; j--) { z = tierBelow(z); setZ(order[j].el, z); }      // make room below
      setZ(el, cand2);
    }
  }
  var ORDER_LABEL = { front: 'Brought to the front', back: 'Sent to the back', forward: 'Brought forward', backward: 'Sent backward' };
  function reorder(action) {
    if (!shape || !ORDER_LABEL[action]) return false;
    // bottom-most first when raising, top-most first when lowering, so the selection keeps its own order
    var list = sel.slice().sort(function (a, b) { return (zKey(a) - zKey(b)) || docOrder(a, b); });
    if (action === 'back' || action === 'backward') list.reverse();
    var touched = sel.slice();
    sel.forEach(function (el) { var p = el.parentElement; if (p && touched.indexOf(p) < 0) touched.push(p); Array.prototype.forEach.call(p ? p.children : [], function (c) { if (touched.indexOf(c) < 0) touched.push(c); }); });
    var n = withRecords(touched, function () { list.forEach(function (el) { orderOne(el, action); }); });
    toast(n ? ORDER_LABEL[action] + ' — ' + changesLabel() + '.' : 'Already at the ' + (action === 'front' || action === 'forward' ? 'front' : 'back') + '.', 2500);
    return n > 0;
  }
  function groupSelection() {
    if (!shape) return false;
    if (sel.length < 2) { toast('Select at least two shapes to group them (Shift+click adds a shape).', 2500); return false; }
    var id = 'g' + Date.now().toString(36);
    sel.forEach(function (el) { var pre = groupId(el); apply(el, 'group', id); track(el, 'group', pre); });
    setSelection(sel, shape.el, { toast: false });
    toast('Grouped ' + sel.length + ' shapes — they now select, move, resize and align together. Ctrl/Cmd+click picks one member; Ungroup separates them. ' + changesLabel() + '.', 4000);
    return true;
  }
  function ungroupSelection() {
    if (!shape) return false;
    var n = 0;
    sel.forEach(function (el) { var pre = groupId(el); if (!pre) return; apply(el, 'group', null); track(el, 'group', pre); n++; });
    if (!n) { toast('No group in the selection.', 1500); return false; }
    setSelection(sel, shape.el, { toast: false });
    toast('Ungrouped ' + n + ' shapes — they are still selected; Esc when done. ' + changesLabel() + '.', 3000);
    return true;
  }

  /* ---------- shape toolbar (shown while shapes are selected) ---------- */
  var stools = null;
  var FILLS = [['', 'Default'], ['transparent', 'Transparent'], ['#003841', 'Deep teal'], ['#007B85', 'Teal'], ['#00ADBF', 'Bright cyan'], ['#00CFE7', 'Electric cyan'], ['#0A1416', 'Black'], ['#5B6B6D', 'Grey'], ['#F5F8F6', 'Cream'], ['#FFFFFF', 'White']];
  var BORDERS = [['', 'Border: default'], ['0', 'No border'], ['1', 'Border 1 px'], ['2', 'Border 2 px'], ['3', 'Border 3 px'], ['4', 'Border 4 px'], ['6', 'Border 6 px']];
  var SHADOWS = [['', 'Shadow: default'], ['none', 'No shadow'], ['0 12px 32px rgba(10,20,22,.18)', 'Soft shadow'], ['0 24px 56px rgba(10,20,22,.30)', 'Strong shadow']];
  var ICONS = {
    front: '<rect x="2.5" y="6.5" width="7" height="7"/><rect class="nbg-fill" x="6.5" y="2.5" width="7" height="7"/>',
    forward: '<rect x="2.5" y="6.5" width="7" height="7"/><path d="M11 12V4M8 7l3-3 3 3"/>',
    backward: '<rect x="6.5" y="2.5" width="7" height="7"/><path d="M5 4v8M2 9l3 3 3-3"/>',
    back: '<rect x="6.5" y="2.5" width="7" height="7"/><rect class="nbg-fill" x="2.5" y="6.5" width="7" height="7"/>',
    left: '<path d="M2 1.5v13"/><rect x="4" y="3" width="9" height="4"/><rect x="4" y="9" width="6" height="4"/>',
    center: '<path d="M8 1.5v13"/><rect x="3.5" y="3" width="9" height="4"/><rect x="5" y="9" width="6" height="4"/>',
    right: '<path d="M14 1.5v13"/><rect x="3" y="3" width="9" height="4"/><rect x="6" y="9" width="6" height="4"/>',
    top: '<path d="M1.5 2h13"/><rect x="3" y="4" width="4" height="9"/><rect x="9" y="4" width="4" height="6"/>',
    middle: '<path d="M1.5 8h13"/><rect x="3" y="3.5" width="4" height="9"/><rect x="9" y="5" width="4" height="6"/>',
    bottom: '<path d="M1.5 14h13"/><rect x="3" y="3" width="4" height="9"/><rect x="9" y="6" width="4" height="6"/>',
    h: '<path d="M1.5 2v12M14.5 2v12"/><rect x="4" y="5" width="3" height="6"/><rect x="9" y="5" width="3" height="6"/>',
    v: '<path d="M2 1.5h12M2 14.5h12"/><rect x="5" y="4" width="6" height="3"/><rect x="5" y="9" width="6" height="3"/>',
  };
  function icon(k) { return '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">' + ICONS[k] + '</svg>'; }
  function abtn(action, value, title, label) { return '<button type="button" data-a="' + action + '"' + (value ? ' data-v="' + value + '"' : '') + ' title="' + title + '">' + (label || icon(value || action)) + '</button>'; }
  function inShapeTools(t) { return !!(stools && t && stools.contains(t)); }
  function tidyStyle(el) { if (el.getAttribute('style') === '') el.removeAttribute('style'); }
  function shapeStyle(prop, value) {
    if (!shape) return;
    withRecords(sel, function () {
      sel.forEach(function (el) { if (value === '' || value === null) el.style.removeProperty(prop); else el.style.setProperty(prop, value); tidyStyle(el); });
    });
  }
  function shapeBorder(v) {
    if (!shape) return;
    withRecords(sel, function () {
      sel.forEach(function (el) {
        if (v === '') ['border', 'border-width', 'border-style', 'border-color'].forEach(function (p) { el.style.removeProperty(p); });
        else if (v === '0') el.style.setProperty('border', '0');
        else {
          el.style.setProperty('border-width', v + 'px'); el.style.setProperty('border-style', 'solid');
          if (!el.style.borderColor && /^(rgba\(0, 0, 0, 0\)|transparent)$/.test(getComputedStyle(el).borderTopColor)) el.style.setProperty('border-color', ACCENT);
        }
        tidyStyle(el);
      });
    });
  }
  function unionArt() {   // the selection's union box in artboard px, relative to the slide
    var u = unionRect(sel), scale = slideScale(shape.el) || 1, sr = slideOf(shape.el).getBoundingClientRect();
    return { u: u, scale: scale, left: (u.left - sr.left) / scale, top: (u.top - sr.top) / scale, width: u.width / scale, height: u.height / scale };
  }
  function shapeGeom(prop, v) {
    if (!shape || isNaN(v)) return;
    if (sel.length > 1) {
      var a = unionArt();
      withRecords(sel, function () {
        if (prop === 'left' || prop === 'top') { var dx = prop === 'left' ? v - a.left : 0, dy = prop === 'top' ? v - a.top : 0; sel.forEach(function (el) { shift(el, geom(el), dx, dy); }); }
        else {
          var U1 = { left: a.u.left, top: a.u.top, width: prop === 'width' ? Math.max(MIN, v) * a.scale : a.u.width, height: prop === 'height' ? Math.max(MIN, v) * a.scale : a.u.height };
          scaleMembers(members(), a.u, U1, prop === 'width', prop === 'height', a.scale);
        }
      });
      return;
    }
    var el = shape.el;
    withRecords(sel, function () {
      var g = geom(el);
      if (prop === 'width' || prop === 'height') {
        if (g.positioned) setPos(el, g, g.left, g.top);
        setSize(el, g, prop === 'width' ? Math.max(MIN, v) : null, prop === 'height' ? Math.max(MIN, v) : null);
      } else if (g.positioned) setPos(el, g, prop === 'left' ? v : g.left, prop === 'top' ? v : g.top);
      else setPos(el, g, prop === 'left' ? v : g.rleft, prop === 'top' ? v : g.rtop);
    });
  }
  function refMode() { var s = stools && stools.querySelector('[data-a=ref]'); return s && sel.length > 1 ? s.value : 'slide'; }
  function arrange(a, v) {
    if (a === 'order') return reorder(v);
    if (a === 'align') return alignSelection(v, refMode());
    if (a === 'dist') return distributeSelection(v, refMode());
    if (a === 'group') return groupSelection();
    if (a === 'ungroup') return ungroupSelection();
    if (a === 'all') return selectAllIn(null);
    if (a === 'code') return openCode(shape ? shape.el : null);
    return false;
  }
  function buildShapeTools() {
    stools = document.createElement('div');
    stools.id = 'nbg-shape-tools'; stools.className = 'nbg-panel nbg-rows';
    stools.setAttribute('role', 'toolbar');
    var h = '<div class="nbg-row">';
    h += '<label title="Left (px on the artboard; offset for elements in normal flow; the selection box for several shapes)">X<input type="number" data-s="left" step="1"></label>';
    h += '<label title="Top">Y<input type="number" data-s="top" step="1"></label>';
    h += '<label title="Width (several shapes: scales the selection from its top-left corner)">W<input type="number" data-s="width" min="16" step="1"></label>';
    h += '<label title="Height">H<input type="number" data-s="height" min="16" step="1"></label>';
    h += '<i class="nbg-tsep"></i>';
    h += swatches('s="fill" data-v', FILLS).replace('<span class="nbg-swatches">', '<span class="nbg-swatches" title="Fill (NBG palette)">');
    h += '<i class="nbg-tsep"></i>';
    h += '<select data-s="border" title="Border">' + BORDERS.map(function (b) { return '<option value="' + b[0] + '">' + b[1] + '</option>'; }).join('') + '</select>';
    h += swatches('s="bordercolor" data-v', COLORS).replace('<span class="nbg-swatches">', '<span class="nbg-swatches" title="Border colour (NBG palette)">');
    h += '<i class="nbg-tsep"></i>';
    h += '<label title="Corner radius (px)">◜<input type="number" data-s="radius" min="0" step="1"></label>';
    h += '<label title="Opacity (%)">◐<input type="number" data-s="opacity" min="0" max="100" step="5"></label>';
    h += '<select data-s="shadow" title="Shadow">' + SHADOWS.map(function (b) { return '<option value="' + b[0] + '">' + b[1] + '</option>'; }).join('') + '</select>';
    h += '<i class="nbg-tsep"></i>';
    h += '<button type="button" data-s="reset" class="nbg-tquiet" title="Restore the selected shapes’ original size, position and style">Reset</button>';
    h += '<button type="button" data-s="done" class="nbg-tdone" title="Finish (Esc)">Done</button>';
    // second row: arrange
    h += '</div><div class="nbg-row">';
    h += '<span class="nbg-tlabel" data-count>1 shape</span>';
    h += '<select data-a="stack" title="Stack: the shapes enclosing the selected one and the shapes inside it — pick the one you want (Tab / Shift+Tab step out / in)"></select>';
    h += '<button type="button" data-a="all" class="nbg-tquiet" title="Select every shape on this slide (Ctrl/Cmd+A) — Shift+click adds one, Shift+drag draws a selection box, Ctrl/Cmd+click picks one alone">All</button>';
    h += '<i class="nbg-tsep"></i><span class="nbg-tlabel">Order</span>';
    h += abtn('order', 'front', 'Bring to front (Ctrl/Cmd+Shift+])') + abtn('order', 'forward', 'Bring forward one step (Ctrl/Cmd+])') + abtn('order', 'backward', 'Send backward one step (Ctrl/Cmd+[)') + abtn('order', 'back', 'Send to back (Ctrl/Cmd+Shift+[)');
    h += '<i class="nbg-tsep"></i><span class="nbg-tlabel">Align</span>';
    h += abtn('align', 'left', 'Align left edges') + abtn('align', 'center', 'Align horizontal centres') + abtn('align', 'right', 'Align right edges') + abtn('align', 'top', 'Align top edges') + abtn('align', 'middle', 'Align vertical middles') + abtn('align', 'bottom', 'Align bottom edges');
    h += '<i class="nbg-tsep"></i><span class="nbg-tlabel">Distribute</span>';
    h += abtn('dist', 'h', 'Distribute horizontally — equal gaps between the shapes (three or more; the first and last stay put — or across the slide)') + abtn('dist', 'v', 'Distribute vertically — equal gaps between the shapes');
    h += '<select data-a="ref" title="Align and distribute relative to the selection’s own box, or to the slide"><option value="selection">to selection</option><option value="slide">to slide</option></select>';
    h += '<i class="nbg-tsep"></i>';
    h += '<button type="button" data-a="code" title="Show the slide’s structure and HTML: an outline with checkboxes for selecting several shapes (Ctrl/Cmd+Shift+O), the element tree (Ctrl/Cmd+Shift+H), and the selected element’s editable source">&lt;/&gt;</button>';
    h += '<i class="nbg-tsep"></i>';
    h += '<button type="button" data-a="group" title="Group the selected shapes so they select, move, resize and align together (Ctrl/Cmd+G)">Group</button>';
    h += '<button type="button" data-a="ungroup" title="Ungroup (Ctrl/Cmd+Shift+G)">Ungroup</button>';
    h += '</div>';
    stools.innerHTML = h;
    makeMovable(stools, layoutShapeTools);
    stools.addEventListener('click', function (e) {
      e.stopPropagation();
      var b = e.target.closest('button'); if (!b || !shape) return;
      e.preventDefault();
      var a = b.getAttribute('data-s'), ar = b.getAttribute('data-a');
      if (ar) arrange(ar, b.getAttribute('data-v'));
      else if (a === 'done') deselectShape();
      else if (a === 'reset') resetSelection();
      else if (a === 'fill') shapeStyle('background-color', b.getAttribute('data-v'));
      else if (a === 'bordercolor') shapeStyle('border-color', b.getAttribute('data-v'));
    });
    stools.addEventListener('change', function (e) {
      var t = e.target, a = t.getAttribute('data-s');
      if (t.getAttribute('data-a') === 'ref') { t.setAttribute('data-user', ''); return; }
      if (t.getAttribute('data-a') === 'stack') { var pickEl = stackList[parseInt(t.value, 10)]; if (pickEl && pickEl !== shape.el) selectSolo(pickEl); return; }
      if (!a || !shape) return;
      if (/^(left|top|width|height)$/.test(a)) shapeGeom(a, parseFloat(t.value));
      else if (a === 'border') shapeBorder(t.value);
      else if (a === 'radius') shapeStyle('border-radius', t.value === '' ? '' : Math.max(0, parseFloat(t.value)) + 'px');
      else if (a === 'opacity') shapeStyle('opacity', t.value === '' ? '' : String(Math.max(0, Math.min(100, parseFloat(t.value))) / 100));
      else if (a === 'shadow') shapeStyle('box-shadow', t.value);
    });
    stools.addEventListener('keydown', function (e) {
      e.stopPropagation();
      if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); e.target.dispatchEvent(new Event('change', { bubbles: true })); }
      if (e.key === 'Escape') { e.preventDefault(); deselectShape(); }
    });
    document.body.appendChild(stools);
  }
  var stackList = [];   // what the toolbar's Stack select offers: enclosing shapes, the selected one, its child shapes
  function layoutStackList() {
    var sl = stools.querySelector('[data-a=stack]'), el = shape.el, up = ancestorShapes(el), down = childShapes(el);
    stackList = up.concat([el], down);
    sl.hidden = sel.length > 1 || stackList.length < 2;
    if (sl.hidden) return;
    var esc = function (t) { return t.replace(/&/g, '&amp;').replace(/</g, '&lt;'); };
    sl.innerHTML = stackList.map(function (x, i) {
      var depth = i < up.length ? i : i === up.length ? up.length : up.length + 1;
      var tag = i < up.length ? 'encloses · ' : i === up.length ? 'selected · ' : 'inside · ';
      return '<option value="' + i + '"' + (x === el ? ' selected' : '') + '>' + new Array(depth + 1).join('› ') + esc(tag + describe(x)) + '</option>';
    }).join('');
  }
  function showShapeTools() { if (!stools) buildShapeTools(); stools.hidden = false; layoutShapeTools(); }
  function hideShapeTools() { if (stools) stools.hidden = true; }
  function layoutShapeTools() {
    if (!stools || stools.hidden || !shape) return;
    var el = shape.el, g = geom(el), st = el.style, multi = sel.length > 1;
    placePanel(stools, unionRect(sel));
    var set = function (k, v) { var i = stools.querySelector('[data-s=' + k + ']'); if (document.activeElement !== i) i.value = v; };
    if (multi) { var a = unionArt(); set('left', Math.round(a.left)); set('top', Math.round(a.top)); set('width', Math.round(a.width)); set('height', Math.round(a.height)); }
    else {
      set('left', Math.round(g.positioned ? g.left : g.rleft)); set('top', Math.round(g.positioned ? g.top : g.rtop));
      set('width', Math.round(g.width)); set('height', Math.round(g.height));
    }
    var fill = normColor(st.backgroundColor);
    Array.prototype.forEach.call(stools.querySelectorAll('[data-s=fill]'), function (b) { b.classList.toggle('nbg-on', !!fill && fill === normColor(b.getAttribute('data-v'))); });
    var bw = st.border === '0px' || st.borderWidth === '0px' ? '0' : st.borderWidth ? String(parseInt(st.borderWidth, 10)) : '';
    var bsel = stools.querySelector('[data-s=border]'); bsel.value = bw; if (bsel.value !== bw) bsel.value = '';
    var bc = normColor(st.borderColor);
    Array.prototype.forEach.call(stools.querySelectorAll('[data-s=bordercolor]'), function (b) { b.classList.toggle('nbg-on', !!bc && bc === normColor(b.getAttribute('data-v'))); });
    set('radius', st.borderRadius ? parseInt(st.borderRadius, 10) : ''); set('opacity', st.opacity ? Math.round(parseFloat(st.opacity) * 100) : '');
    var ssel = stools.querySelector('[data-s=shadow]'); ssel.value = st.boxShadow || ''; if (ssel.value !== (st.boxShadow || '')) ssel.value = '';
    // arrange row
    stools.querySelector('[data-count]').textContent = multi ? (sameGroup() ? 'Group · ' : '') + sel.length + ' shapes' : '1 shape';
    layoutStackList();
    var ref = stools.querySelector('[data-a=ref]'); ref.disabled = !multi; if (!multi) ref.value = 'slide'; else if (ref.value === 'slide' && !ref.hasAttribute('data-user')) ref.value = 'selection';
    var grouped = sel.some(function (m) { return !!groupId(m); });
    Array.prototype.forEach.call(stools.querySelectorAll('[data-a=dist], [data-a=group]'), function (b) { b.classList.toggle('nbg-off', !multi); });
    stools.querySelector('[data-a=ungroup]').classList.toggle('nbg-off', !grouped);
  }

  /* ---------- HTML panel: navigable tree + editable source, synced with the visual selection ---------- */
  var code = null, codeTree = null, codeOut = null, codeRaw = null, codeStatus = null, codeTab = 'outline', codeEl = null, codeSlideEl = null, outFilter = '';
  var codeOpen = new Set(), codeClosed = new Set(), rawDirty = false, rawFor = null, hover = null, codeRaf = 0, codeObserver = null;
  var TRANSIENT_ATTR = /^(contenteditable|spellcheck|data-nbg-orig)$/;
  function inCode(t) { return !!(code && t && code.contains(t)); }
  function pathKey(el) { var p = pathOf(el); return p ? p.join('/') : ''; }
  function elByKey(key) { return key ? elAt(document, key.split('/').map(Number)) : null; }
  function cleanClass(el) { return (el.getAttribute('class') || '').split(/\s+/).filter(function (c) { return c && c !== 'nbg-editing'; }).join(' '); }
  // the element's markup as the viewer should see it: without our transient editing attributes
  function cleanOuterHtml(el) {
    var c = el.cloneNode(true), all = [c].concat(Array.prototype.slice.call(c.querySelectorAll('*')));
    all.forEach(function (n) {
      Array.prototype.slice.call(n.attributes).forEach(function (a) { if (TRANSIENT_ATTR.test(a.name)) n.removeAttribute(a.name); });
      if (n.classList.contains('nbg-editing')) { n.classList.remove('nbg-editing'); if (!n.getAttribute('class')) n.removeAttribute('class'); }
    });
    return c.outerHTML;
  }
  function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function isEdited(el) { return !!(findEdit(el, 'html') || findEdit(el, 'style') || findEdit(el, 'group') || findEdit(el, 'attrs')); }
  function codeSlide() {
    var el = codeEl && codeEl.isConnected ? codeEl : (shape ? shape.el : editing ? editing.el : null);
    var s = el ? slideOf(el) : null;
    return s || slideAtPoint(window.innerWidth / 2, window.innerHeight / 2);
  }
  function selectedKeys() {
    var keys = {};
    sel.forEach(function (m) { keys[pathKey(m)] = true; });
    if (editing) keys[pathKey(editing.el)] = true;
    return keys;
  }
  function contentNodes(el) {
    return Array.prototype.filter.call(el.childNodes, function (n) { return n.nodeType === 1 ? !n.closest(OURS) : n.nodeType === 3 && n.nodeValue.trim(); });
  }
  function renderNode(node, depth, out, keys, openKeys) {
    if (node.nodeType === 3) {
      var t = node.nodeValue.replace(/\s+/g, ' ').trim(); if (t.length > 80) t = t.slice(0, 77) + '…';
      out.push('<div class="nbg-tr nbg-tr-text" data-path="' + esc(pathKey(node.parentElement)) + '" data-text="1" style="padding-left:' + (depth * 14 + 18) + 'px">' + esc(t) + '</div>');
      return;
    }
    if (node.nodeType !== 1 || node.closest(OURS) || /^(script|style|template)$/i.test(node.tagName)) return;
    var key = pathKey(node), kids = contentNodes(node);
    var open = kids.length && !codeClosed.has(key) && (codeOpen.has(key) || openKeys[key] || depth < 2);
    var attrs = '';
    Array.prototype.forEach.call(node.attributes, function (a) {
      if (TRANSIENT_ATTR.test(a.name)) return;
      var v = a.name === 'class' ? cleanClass(node) : a.value; if (a.name === 'class' && !v) return;
      if (a.name === 'src' && /^data:/.test(v)) v = 'data:…';
      if (v.length > 48) v = v.slice(0, 45) + '…';
      attrs += ' <span class="nbg-an">' + esc(a.name) + '</span>=<span class="nbg-av">"' + esc(v) + '"</span>';
    });
    var inline = !open && kids.length === 1 && kids[0].nodeType === 3 ? ' <span class="nbg-tx">' + esc(kids[0].nodeValue.replace(/\s+/g, ' ').trim().slice(0, 60)) + '</span>' : '';
    out.push('<div class="nbg-tr' + (keys[key] ? ' nbg-on' : '') + (isEdited(node) ? ' nbg-ed' : '') + '" data-path="' + esc(key) + '" style="padding-left:' + (depth * 14 + 4) + 'px">' +
      '<span class="nbg-tw' + (kids.length ? '' : ' nbg-tw-none') + '">' + (kids.length ? (open ? '▾' : '▸') : '·') + '</span>' +
      '<span class="nbg-tag">&lt;' + node.tagName.toLowerCase() + '</span>' + attrs + '<span class="nbg-tag">&gt;</span>' + inline + (isEdited(node) ? ' <span class="nbg-dot" title="edited in this browser">●</span>' : '') + '</div>');
    if (open) kids.forEach(function (k) { renderNode(k, depth + 1, out, keys, openKeys); });
  }
  function renderTree() {
    if (!code || code.hidden) return;
    var slide = codeSlide(); codeSlideEl = slide;
    code.querySelector('.nbg-ct').textContent = slide ? 'Slide ' + (slideIndex(slide) + 1) : 'Slide';
    if (!slide) { codeTree.innerHTML = '<div class="nbg-tr">No slide found.</div>'; return; }
    var keys = selectedKeys(), openKeys = {};
    Object.keys(keys).forEach(function (k) { var el = elByKey(k); while (el && el !== slide) { el = el.parentElement; if (el) openKeys[pathKey(el)] = true; } });
    if (codeEl && codeEl.isConnected) { var e2 = codeEl; while (e2 && e2 !== slide) { e2 = e2.parentElement; if (e2) openKeys[pathKey(e2)] = true; } }
    var out = [];
    renderNode(slide, 0, out, keys, openKeys);
    codeTree.innerHTML = out.join('');
    var on = codeTree.querySelector('.nbg-on'); if (on && codeTab === 'tree') on.scrollIntoView({ block: 'nearest' });
  }
  /* outline: only the shapes (cards, text blocks, images), nested by containment, with checkboxes */
  var KIND_ICON = { img: '▨', text: 'T', box: '▭' };
  function shapeKind(el) { return /^(img|svg|video|canvas|picture)$/i.test(el.tagName) ? 'img' : hasOwnText(el) && !isBoxy(el) ? 'text' : 'box'; }
  function shapeLabel(el) {
    if (/^(img|svg|video|canvas|picture)$/i.test(el.tagName)) return el.getAttribute('alt') || el.getAttribute('aria-label') || 'Image';
    var t = hasOwnText(el) ? el.textContent.replace(/\s+/g, ' ').trim() : '';
    if (t) return t.length > 56 ? t.slice(0, 53) + '…' : t;
    var cls = (el.getAttribute('class') || '').trim().split(/\s+/).filter(function (c) { return c && !/^nbg-/.test(c) && c !== 'active'; })[0];
    return el.tagName.toLowerCase() + (el.id ? '#' + el.id : cls ? '.' + cls : '');
  }
  function groupBadges(slide) {   // group id -> G1, G2 … per slide
    var ids = [], map = {};
    Array.prototype.forEach.call(slide.querySelectorAll('[data-nbg-group]'), function (m) { var g = m.getAttribute('data-nbg-group'); if (ids.indexOf(g) < 0) ids.push(g); });
    ids.forEach(function (g, i) { map[g] = 'G' + (i + 1); });
    return map;
  }
  function renderOutlineNode(el, depth, out, keys, badges, slide, filter) {
    var kids = childShapes(el), key = pathKey(el), label = shapeLabel(el), kind = shapeKind(el);
    var kidRows = [];
    kids.forEach(function (k) { renderOutlineNode(k, depth + 1, kidRows, keys, badges, slide, filter); });
    if (filter && label.toLowerCase().indexOf(filter) < 0 && !kidRows.length) return;
    var open = kids.length && !codeClosed.has(key);
    var g = groupId(el), backdrop = isBackdrop(el, slide);
    out.push('<div class="nbg-tr nbg-or' + (keys[key] ? ' nbg-on' : '') + (isEdited(el) ? ' nbg-ed' : '') + '" data-path="' + esc(key) + '" style="padding-left:' + (depth * 14 + 4) + 'px">' +
      '<span class="nbg-tw' + (kids.length ? '' : ' nbg-tw-none') + '">' + (kids.length ? (open ? '▾' : '▸') : '·') + '</span>' +
      '<input type="checkbox" class="nbg-ock" ' + (keys[key] ? 'checked ' : '') + 'aria-label="select" title="Tick to add this shape to the selection, untick to remove it">' +
      '<span class="nbg-ok nbg-ok-' + kind + '" title="' + (kind === 'img' ? 'image' : kind === 'text' ? 'text block' : 'card / panel / block') + '">' + KIND_ICON[kind] + '</span>' +
      '<span class="nbg-ol">' + esc(label) + '</span>' +
      '<span class="nbg-os">' + Math.round(el.offsetWidth) + '×' + Math.round(el.offsetHeight) + '</span>' +
      (g && badges[g] ? '<span class="nbg-og" title="group ' + esc(g) + '">' + badges[g] + '</span>' : '') +
      (backdrop ? '<span class="nbg-og nbg-ob" title="fills the slide — not part of Select all">backdrop</span>' : '') +
      (isEdited(el) ? ' <span class="nbg-dot" title="edited in this browser">●</span>' : '') + '</div>');
    if (open || filter) kidRows.forEach(function (r) { out.push(r); });
  }
  function renderOutline() {
    if (!code || code.hidden) return;
    var slide = codeSlide(); codeSlideEl = slide;
    code.querySelector('.nbg-ct').textContent = slide ? 'Slide ' + (slideIndex(slide) + 1) : 'Slide';
    if (!slide) { codeOut.innerHTML = '<div class="nbg-tr">No slide found.</div>'; return; }
    var keys = selectedKeys(), out = [], badges = groupBadges(slide), filter = outFilter.trim().toLowerCase();
    childShapes(slide).forEach(function (el) { renderOutlineNode(el, 0, out, keys, badges, slide, filter); });
    codeOut.innerHTML = out.length ? out.join('') : '<div class="nbg-tr nbg-tr-text">' + (filter ? 'Nothing matches “' + esc(outFilter) + '”.' : 'No shapes on this slide.') + '</div>';
    var cnt = code.querySelector('.nbg-oc'); cnt.textContent = sel.length ? sel.length + ' selected' : '';
    var on = codeOut.querySelector('.nbg-on'); if (on && codeTab === 'outline') on.scrollIntoView({ block: 'nearest' });
  }
  function renderRaw() {
    if (!code || code.hidden) return;
    var target = codeEl && codeEl.isConnected ? codeEl : null;
    var lock = rawDirty && rawFor && rawFor.isConnected;
    if (lock) target = rawFor;
    code.querySelector('.nbg-cw').textContent = target ? describe(target) + (lock ? ' · unapplied changes' : '') : 'nothing selected';
    if (!target) { codeRaw.value = ''; codeRaw.disabled = true; return; }
    codeRaw.disabled = false;
    if (!lock) { rawFor = target; codeRaw.value = cleanOuterHtml(target); rawDirty = false; setRawStatus(''); }
  }
  function setRawStatus(msg, bad) { codeStatus.textContent = msg; codeStatus.classList.toggle('nbg-bad', !!bad); }
  function codeRefresh() {
    if (!code || code.hidden) return;
    cancelAnimationFrame(codeRaf);
    codeRaf = requestAnimationFrame(function () { renderOutline(); renderTree(); renderRaw(); });   // both lists stay consistent whichever tab is shown
  }
  function codeFollow() {   // the element the panel follows: the primary selection or the text being edited
    var el = shape ? shape.el : editing ? editing.el : null;
    if (el) codeEl = el;
    codeRefresh();
  }
  /* attributes other than style / group as a fourth edit kind: JSON of sorted [name, value] pairs */
  function attrsOf(el) {
    var list = [];
    Array.prototype.forEach.call(el.attributes, function (a) {
      if (a.name === 'style' || a.name === 'data-nbg-group' || TRANSIENT_ATTR.test(a.name)) return;
      var v = a.name === 'class' ? cleanClass(el) : a.value; if (a.name === 'class' && !v) return;
      list.push([a.name, v]);
    });
    list.sort(function (a, b) { return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0; });
    return JSON.stringify(list);
  }
  function applyAttrs(el, value) {
    var want = {}; try { JSON.parse(value).forEach(function (p) { want[p[0]] = p[1]; }); } catch (e) { return; }
    Array.prototype.slice.call(el.attributes).forEach(function (a) {
      if (a.name === 'style' || a.name === 'data-nbg-group' || TRANSIENT_ATTR.test(a.name)) return;
      if (!(a.name in want)) el.removeAttribute(a.name);
    });
    Object.keys(want).forEach(function (k) { if (el.getAttribute(k) !== want[k]) el.setAttribute(k, want[k]); });
  }
  function sanitise(root) {   // the deck is self-contained: no scripts, event handlers or javascript: URLs come in through the editor
    var n = 0;
    Array.prototype.slice.call(root.querySelectorAll('script, iframe, object, embed')).forEach(function (x) { x.parentNode.removeChild(x); n++; });
    [root].concat(Array.prototype.slice.call(root.querySelectorAll('*'))).forEach(function (x) {
      Array.prototype.slice.call(x.attributes).forEach(function (a) {
        if (/^on/i.test(a.name) || (/^(href|src|xlink:href|action|formaction)$/i.test(a.name) && /^\s*javascript:/i.test(a.value))) { x.removeAttribute(a.name); n++; }
      });
    });
    return n;
  }
  function applyRaw() {
    var el = rawFor && rawFor.isConnected ? rawFor : codeEl;
    if (!el || !el.isConnected) { setRawStatus('Nothing to apply to.', true); return false; }
    var tpl = document.createElement('template'); tpl.innerHTML = codeRaw.value;
    var roots = Array.prototype.filter.call(tpl.content.childNodes, function (n) { return n.nodeType === 1 || (n.nodeType === 3 && n.nodeValue.trim()); });
    if (roots.length !== 1 || roots[0].nodeType !== 1) { setRawStatus('The source must be exactly one element (the ' + el.tagName.toLowerCase() + ' and its contents).', true); return false; }
    var neu = roots[0];
    if (neu.tagName !== el.tagName) { setRawStatus('Keep the element a <' + el.tagName.toLowerCase() + '> — its type cannot change (use its parent to replace it).', true); return false; }
    var dropped = sanitise(neu);
    if (editing && editing.el === el) commitEdit();
    var preStyle = attrStyle(el), preGroup = groupId(el), preAttrs = attrsOf(el), preHtml = el.innerHTML;
    if (neu.hasAttribute('style')) el.setAttribute('style', neu.getAttribute('style')); else el.removeAttribute('style');
    if (neu.hasAttribute('data-nbg-group')) el.setAttribute('data-nbg-group', neu.getAttribute('data-nbg-group')); else el.removeAttribute('data-nbg-group');
    applyAttrs(el, attrsOf(neu));
    if (el.innerHTML !== neu.innerHTML) el.innerHTML = neu.innerHTML;
    var n = 0;
    if (track(el, 'style', preStyle)) n++;
    if (track(el, 'group', preGroup)) n++;
    if (track(el, 'attrs', preAttrs)) n++;
    if (track(el, 'html', preHtml)) n++;
    rawDirty = false; rawFor = null; codeEl = el;
    if (shape && sel.indexOf(el) >= 0) layoutBox();
    setRawStatus(n ? 'Applied — ' + changesLabel() + '.' + (dropped ? ' Removed ' + dropped + ' script / event-handler item' + (dropped === 1 ? '' : 's') + '.' : '') : 'No change.');
    if (n) toast('HTML applied to ' + describe(el) + ' — ' + changesLabel() + '. Right-click → “Save edited copy” to download the deck with your changes.', 4000);
    codeRefresh();
    return n > 0;
  }
  function revertRaw() { rawDirty = false; rawFor = null; setRawStatus(''); renderRaw(); }
  function ensureHover() {
    if (hover) return;
    hover = document.createElement('div'); hover.id = 'nbg-hover'; hover.hidden = true; document.body.appendChild(hover);
  }
  function hoverEl(el) {
    ensureHover();
    if (!el || !el.isConnected) { hover.hidden = true; return; }
    var r = el.getBoundingClientRect();
    hover.hidden = false; hover.style.left = r.left + 'px'; hover.style.top = r.top + 'px'; hover.style.width = r.width + 'px'; hover.style.height = r.height + 'px';
  }
  function placeCode() {
    var pos = panelPos[code.id];
    if (pos) { code.style.left = Math.max(0, Math.min(pos.left, window.innerWidth - code.offsetWidth)) + 'px'; code.style.top = Math.max(0, Math.min(pos.top, window.innerHeight - code.offsetHeight)) + 'px'; return; }
    code.style.left = Math.max(8, window.innerWidth - code.offsetWidth - 8) + 'px'; code.style.top = '8px';   // docked to the right
  }
  function setTab(tab) {
    codeTab = tab; hoverEl(null);
    Array.prototype.forEach.call(code.querySelectorAll('[data-tab]'), function (b) { b.classList.toggle('nbg-on', b.getAttribute('data-tab') === tab); });
    codeTree.hidden = tab !== 'tree';
    code.querySelector('.nbg-cout').hidden = tab !== 'outline';
    code.querySelector('.nbg-craw').hidden = tab !== 'code';
    codeRefresh();
  }
  function buildCode() {
    code = document.createElement('div');
    code.id = 'nbg-code'; code.className = 'nbg-panel nbg-code';
    code.setAttribute('role', 'dialog'); code.setAttribute('aria-label', 'Structure and HTML of the slide');
    code.innerHTML =
      '<div class="nbg-row nbg-ch"><span class="nbg-ct">Slide</span>' +
      '<button type="button" data-tab="outline" class="nbg-on" title="The slide’s shapes — cards, text blocks, images — nested by containment: tick the boxes to select several, click a name to select it alone, Shift+click adds, double-click edits its text">Outline</button>' +
      '<button type="button" data-tab="tree" title="The slide’s HTML elements — click selects one on the slide, Shift+click adds it, double-click edits its text, ▸ expands">Tree</button>' +
      '<button type="button" data-tab="code" title="The selected element’s source — edit it and Apply (Ctrl/Cmd+Enter)">Code</button>' +
      '<span class="nbg-cfill"></span>' +
      '<button type="button" data-c="refresh" class="nbg-tquiet" title="Re-read the slide">↻</button>' +
      '<button type="button" data-c="close" class="nbg-tquiet" title="Close (Esc)">✕</button></div>' +
      '<div class="nbg-cb nbg-cout"><div class="nbg-of"><input type="search" class="nbg-oq" placeholder="Filter by text…" aria-label="Filter shapes">' +
      '<button type="button" data-o="all" class="nbg-tquiet" title="Select every top-level shape of the slide (Ctrl/Cmd+A)">All</button>' +
      '<button type="button" data-o="none" class="nbg-tquiet" title="Clear the selection">None</button><span class="nbg-oc"></span></div><div class="nbg-olist" role="tree"></div></div>' +
      '<div class="nbg-cb nbg-ctree" hidden role="tree"></div>' +
      '<div class="nbg-cb nbg-craw" hidden><div class="nbg-cw"></div><textarea class="nbg-raw" spellcheck="false" wrap="off" aria-label="HTML source of the selected element"></textarea>' +
      '<div class="nbg-cf"><button type="button" data-c="apply" class="nbg-tdone" title="Apply the source to the element (Ctrl/Cmd+Enter) — recorded like every other edit">Apply</button>' +
      '<button type="button" data-c="revert" class="nbg-tquiet" title="Drop the unapplied changes">Revert</button>' +
      '<button type="button" data-c="copy" class="nbg-tquiet" title="Copy the source">Copy</button><span class="nbg-cs"></span></div></div>';
    codeTree = code.querySelector('.nbg-ctree'); codeOut = code.querySelector('.nbg-olist'); codeRaw = code.querySelector('.nbg-raw'); codeStatus = code.querySelector('.nbg-cs');
    code.querySelector('.nbg-oq').addEventListener('input', function (e) { outFilter = e.target.value; renderOutline(); });
    makeMovable(code, placeCode);
    code.addEventListener('click', function (e) {
      e.stopPropagation();
      var b = e.target.closest('button');
      if (b && b.hasAttribute('data-tab')) { setTab(b.getAttribute('data-tab')); return; }
      if (b && b.hasAttribute('data-c')) {
        var c = b.getAttribute('data-c');
        if (c === 'close') closeCode(); else if (c === 'refresh') codeRefresh(); else if (c === 'apply') applyRaw(); else if (c === 'revert') revertRaw();
        else if (c === 'copy') { try { navigator.clipboard.writeText(codeRaw.value); setRawStatus('Copied.'); } catch (x) { codeRaw.select(); document.execCommand('copy'); setRawStatus('Copied.'); } }
        return;
      }
      if (b && b.hasAttribute('data-o')) { if (b.getAttribute('data-o') === 'all') selectAllIn(codeSlide()); else deselectShape(); return; }
      var row = e.target.closest('.nbg-tr'); if (!row) return;
      var el = elByKey(row.getAttribute('data-path')); if (!el) return;
      var outline = row.classList.contains('nbg-or');
      if (e.target.classList.contains('nbg-tw') && !e.target.classList.contains('nbg-tw-none')) {   // twisty
        var key = row.getAttribute('data-path');
        if (row.querySelector('.nbg-tw').textContent === '▾') { codeOpen.delete(key); codeClosed.add(key); } else { codeClosed.delete(key); codeOpen.add(key); }
        if (outline) renderOutline(); else renderTree();
        return;
      }
      if (el.classList.contains('slide')) return;
      codeEl = el;
      if (e.target.classList.contains('nbg-ock')) { toggleSelection(el); codeRefresh(); return; }            // checkbox: add / remove
      if (e.shiftKey && shape) addToSelection(el); else if ((e.metaKey || e.ctrlKey) && shape) toggleSelection(el); else selectSolo(el, true);
      codeRefresh();
    });
    code.addEventListener('dblclick', function (e) {
      var row = e.target.closest('.nbg-tr'); if (!row) return;
      e.preventDefault(); e.stopPropagation();
      var el = elByKey(row.getAttribute('data-path')), t = el && resolveTextTarget(el);
      if (t) { deselectShape(); startEdit(t, false); }
    });
    code.addEventListener('pointerover', function (e) { var row = e.target.closest('.nbg-tr'); hoverEl(row ? elByKey(row.getAttribute('data-path')) : null); });
    code.addEventListener('pointerleave', function () { hoverEl(null); });
    code.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    code.addEventListener('contextmenu', function (e) { if (!e.target.closest('textarea')) { e.preventDefault(); e.stopPropagation(); } });
    codeRaw.addEventListener('input', function () { rawDirty = true; rawFor = rawFor || codeEl; setRawStatus('Modified — Apply (Ctrl/Cmd+Enter) or Revert.'); });
    code.addEventListener('keydown', function (e) {
      e.stopPropagation();
      var mod = e.ctrlKey || e.metaKey;
      if (e.target === codeRaw) { if (mod && e.key === 'Enter') { e.preventDefault(); applyRaw(); } else if (e.key === 'Escape') { e.preventDefault(); if (rawDirty) revertRaw(); else closeCode(); } return; }
      if (e.key === 'Escape') { e.preventDefault(); closeCode(); return; }
      // tree keyboard: arrows move, Right / Left expand / collapse, Enter selects, Shift+Enter adds
      var list = codeTab === 'outline' ? codeOut : codeTree;
      var rows = Array.prototype.slice.call(list.querySelectorAll('.nbg-tr')), cur = list.querySelector('.nbg-cur') || list.querySelector('.nbg-on') || rows[0];
      if (!rows.length || !cur) return;
      var i = rows.indexOf(cur), key = cur.getAttribute('data-path'), el = elByKey(key);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); var nx = rows[Math.max(0, Math.min(rows.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)))]; rows.forEach(function (r) { r.classList.remove('nbg-cur'); }); nx.classList.add('nbg-cur'); nx.scrollIntoView({ block: 'nearest' }); hoverEl(elByKey(nx.getAttribute('data-path'))); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); codeClosed.delete(key); codeOpen.add(key); if (codeTab === 'outline') renderOutline(); else renderTree(); markCur(key); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); codeOpen.delete(key); codeClosed.add(key); if (codeTab === 'outline') renderOutline(); else renderTree(); markCur(key); }
      else if (e.key === ' ' && codeTab === 'outline' && el && !el.classList.contains('slide')) { e.preventDefault(); codeEl = el; toggleSelection(el); codeRefresh(); markCur(key); }
      else if (e.key === 'Enter' && el && !el.classList.contains('slide')) { e.preventDefault(); codeEl = el; if (e.shiftKey && shape) addToSelection(el); else selectSolo(el, true); codeRefresh(); }
    });
    codeTree.setAttribute('tabindex', '0'); codeOut.setAttribute('tabindex', '0');
    document.body.appendChild(code);
  }
  function markCur(key) { var r = (codeTab === 'outline' ? codeOut : codeTree).querySelector('.nbg-tr[data-path="' + key + '"]'); if (r) r.classList.add('nbg-cur'); }
  function openCode(el, tab) {
    if (!code) buildCode();
    if (el && el.nodeType === 1 && !el.closest(OURS)) codeEl = el;
    else if (!codeEl || !codeEl.isConnected) codeEl = shape ? shape.el : editing ? editing.el : null;
    code.hidden = false;
    placeCode();
    if (tab) setTab(tab); else codeRefresh();
    if (!codeObserver) {
      // deck-driven changes (slide switches, animations) and edits made elsewhere keep the tree current
      codeObserver = new MutationObserver(function (list) {
        for (var i = 0; i < list.length; i++) { var t = list[i].target; if (!(t.nodeType === 1 ? t.closest(OURS) : t.parentElement && t.parentElement.closest(OURS))) { codeRefresh(); return; } }
      });
    }
    codeObserver.observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true, attributeFilter: ['class', 'style', 'hidden', 'data-nbg-group'] });
    if (!shape && !editing && codeEl && codeEl.isConnected && !codeEl.classList.contains('slide')) selectSolo(codeEl, true);
    toast('Structure panel — Outline: tick boxes to select several shapes, click a name to select one; Tree: the HTML elements; Code: the selected element’s source, editable. The selection is highlighted on the slide and here.', 5000);
    return true;
  }
  function closeCode() {
    if (!code || code.hidden) return false;
    code.hidden = true; hoverEl(null);
    if (codeObserver) codeObserver.disconnect();
    return true;
  }
  function codeIsOpen() { return !!(code && !code.hidden); }
  window.addEventListener('resize', function () { if (code && !code.hidden) { placeCode(); codeRefresh(); } });

  /* ---------- discard / save ---------- */
  function discardEdits() {
    if (editing) cancelEdit();
    deselectShape();
    for (var i = edits.length - 1; i >= 0; i--) { var el = elAt(document, edits[i].path); if (el) apply(el, edits[i].kind, edits[i].original); }
    edits = []; store();
    toast('All edits discarded.', 2500);
  }
  // per-slide discard: the records whose element lives inside that slide
  function slideIndex(slide) { return Array.prototype.indexOf.call(document.querySelectorAll('.slide'), slide); }
  function editsIn(slide) { return edits.filter(function (ed) { var el = elAt(document, ed.path); return !!el && slide.contains(el); }); }
  function slideAtPoint(x, y) {   // the slide under a point, else the one at the viewport centre, else the first visible one
    var hit = null;
    document.elementsFromPoint(x, y).forEach(function (n) { if (!hit && !n.closest(OURS)) hit = n.closest('.slide'); });
    if (!hit) { var c = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2); hit = c && c.closest ? c.closest('.slide') : null; }
    return hit || Array.prototype.filter.call(document.querySelectorAll('.slide'), function (sl) { return sl.offsetWidth > 0; })[0] || null;
  }
  function discardSlideEdits(slide) {
    if (!slide) return 0;
    if (editing && slide.contains(editing.el)) cancelEdit();
    if (shape && slide.contains(shape.el)) deselectShape();
    var mine = editsIn(slide);
    for (var i = mine.length - 1; i >= 0; i--) { var el = elAt(document, mine[i].path); if (el) apply(el, mine[i].kind, mine[i].original); }
    edits = edits.filter(function (ed) { return mine.indexOf(ed) < 0; }); store();
    var no = slideIndex(slide) + 1;
    toast(mine.length ? 'Slide ' + no + ': ' + mine.length + ' change' + (mine.length === 1 ? '' : 's') + ' discarded' + (edits.length ? ' — ' + changesLabel() + ' left on other slides.' : '.') : 'No changes on slide ' + no + '.', 3000);
    return mine.length;
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
    '#nbg-deck-menu .nbg-sub{padding:8px 10px 2px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:' + MUTED + ';border-top:1px solid rgba(0,56,65,.10);margin-top:4px}' +
    '#nbg-deck-menu button.nbg-pick{padding:6px 10px 6px 14px}#nbg-deck-menu button.nbg-pick b{font-weight:500;font-size:13px}#nbg-deck-menu button.nbg-pick-on b{font-weight:600;color:' + ACCENT + '}' +
    '#nbg-deck-menu button.nbg-pick span{font-size:11px}' +
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
    '#nbg-shape-box.nbg-multi{outline-style:dashed}' +
    '#nbg-sel-marks{position:fixed;left:0;top:0;width:0;height:0;z-index:2147483645;pointer-events:none}' +
    '#nbg-sel-marks div{position:fixed;box-sizing:border-box;outline:1.5px dashed ' + CYAN + ';outline-offset:-1px}' +
    '#nbg-sel-marks div.nbg-primary{outline-style:solid}' +
    '#nbg-marquee{position:fixed;z-index:2147483645;box-sizing:border-box;border:1.5px dashed ' + CYAN + ';background:rgba(0,173,191,.08);pointer-events:none}' +
    '#nbg-hover{position:fixed;z-index:2147483645;box-sizing:border-box;outline:2px dashed ' + CYAN + ';outline-offset:1px;background:rgba(0,173,191,.06);pointer-events:none}' +
    '.nbg-panel.nbg-code{flex-direction:column;align-items:stretch;gap:0;padding:0;width:460px;height:min(72vh,680px);min-width:300px;min-height:180px;resize:both;overflow:hidden;font-size:12px}' +
    '.nbg-code .nbg-ch{padding:4px 6px;border-bottom:1px solid rgba(0,56,65,.12);flex-wrap:nowrap}.nbg-code .nbg-ct{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:' + ACCENT + ';margin:0 6px 0 2px;white-space:nowrap}' +
    '.nbg-code .nbg-cfill{flex:1}.nbg-code .nbg-cb{flex:1;min-height:0;overflow:auto;font:12px/1.55 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}' +
    '.nbg-code .nbg-cb[hidden]{display:none!important}.nbg-code .nbg-ctree{padding:4px 0;outline:none}' +
    '.nbg-code .nbg-tr{white-space:nowrap;padding:1px 8px 1px 4px;cursor:default;color:' + INK + '}.nbg-code .nbg-tr:hover{background:' + CREAM + '}' +
    '.nbg-code .nbg-tr.nbg-on{background:' + ACCENT + ';color:#fff}.nbg-code .nbg-tr.nbg-on .nbg-tag,.nbg-code .nbg-tr.nbg-on .nbg-an,.nbg-code .nbg-tr.nbg-on .nbg-av,.nbg-code .nbg-tr.nbg-on .nbg-tx{color:#fff}' +
    '.nbg-code .nbg-tr.nbg-cur{box-shadow:inset 0 0 0 1.5px ' + CYAN + '}.nbg-code .nbg-tr-text{color:' + MUTED + ';font-style:italic}' +
    '.nbg-code .nbg-of{display:flex;align-items:center;gap:4px;padding:4px 6px;border-bottom:1px solid rgba(0,56,65,.10);font:12px ' + FONT + '}.nbg-code .nbg-oq{flex:1;min-width:60px;height:24px;border:1px solid rgba(0,56,65,.25);border-radius:6px;font:inherit;padding:0 6px}' +
    '.nbg-code .nbg-oc{color:' + MUTED + ';white-space:nowrap;margin-left:2px}.nbg-code .nbg-olist{padding:4px 0;outline:none}' +
    '.nbg-code .nbg-or{font:13px/1.6 ' + FONT + ';display:flex;align-items:center;gap:4px}.nbg-code .nbg-or .nbg-ol{overflow:hidden;text-overflow:ellipsis;min-width:0}' +
    '.nbg-code .nbg-ock{margin:0 2px 0 0;accent-color:' + ACCENT + ';cursor:pointer}.nbg-code .nbg-ok{display:inline-block;width:14px;text-align:center;font-size:11px;color:' + MUTED + '}.nbg-code .nbg-ok-text{font-weight:700}' +
    '.nbg-code .nbg-os{color:' + MUTED + ';font-size:11px;margin-left:auto;padding-left:6px;white-space:nowrap}.nbg-code .nbg-og{font-size:10px;padding:0 5px;border-radius:8px;background:rgba(0,173,191,.18);color:' + ACCENT + ';white-space:nowrap}.nbg-code .nbg-ob{background:rgba(91,107,109,.15);color:' + MUTED + '}' +
    '.nbg-code .nbg-tr.nbg-on .nbg-os,.nbg-code .nbg-tr.nbg-on .nbg-ok{color:#fff}.nbg-code .nbg-tr.nbg-on .nbg-og{background:rgba(255,255,255,.25);color:#fff}' +
    '.nbg-code .nbg-tw{display:inline-block;width:14px;color:' + MUTED + ';cursor:pointer}.nbg-code .nbg-tw-none{cursor:default;opacity:.4}' +
    '.nbg-code .nbg-tag{color:#8b2d8b}.nbg-code .nbg-an{color:#9a4b00}.nbg-code .nbg-av{color:#0b5fa5}.nbg-code .nbg-tx{color:' + MUTED + '}.nbg-code .nbg-dot{color:' + CYAN + ';font-size:9px}' +
    '.nbg-code .nbg-craw{display:flex;flex-direction:column}.nbg-code .nbg-cw{padding:4px 8px;font:12px ' + FONT + ';color:' + MUTED + ';border-bottom:1px solid rgba(0,56,65,.10);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.nbg-code .nbg-raw{flex:1;min-height:0;width:100%;box-sizing:border-box;border:0;outline:none;resize:none;padding:8px;font:inherit;color:' + INK + ';background:#fff;white-space:pre;overflow:auto;tab-size:2}' +
    '.nbg-code .nbg-cf{display:flex;align-items:center;gap:4px;padding:4px 6px;border-top:1px solid rgba(0,56,65,.12);font:12px ' + FONT + '}.nbg-code .nbg-cs{flex:1;color:' + MUTED + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-left:4px}.nbg-code .nbg-cs.nbg-bad{color:#b3261e}' +
    '.nbg-panel{position:fixed;z-index:2147483647;display:flex;align-items:center;gap:2px;padding:4px 6px;background:#fff;color:' + INK + ';' +
    'border:1px solid rgba(0,56,65,.14);border-radius:10px;box-shadow:0 10px 28px rgba(10,20,22,.18),0 2px 6px rgba(10,20,22,.10);font:13px/1 ' + FONT + ';user-select:none;-webkit-user-select:none;max-width:calc(100vw - 16px);flex-wrap:wrap}' +
    '.nbg-panel[hidden]{display:none!important}' +
    '.nbg-panel .nbg-grip{cursor:grab;color:' + MUTED + ';padding:0 4px;letter-spacing:-2px;font-size:14px;line-height:28px;touch-action:none}.nbg-panel .nbg-grip:active{cursor:grabbing}' +
    '.nbg-panel button{border:0;background:transparent;color:inherit;font:inherit;min-width:28px;height:28px;padding:0 6px;border-radius:6px;cursor:pointer;line-height:28px}' +
    '.nbg-panel button:hover{background:' + CREAM + '}.nbg-panel button.nbg-on{background:' + ACCENT + ';color:#fff}' +
    '.nbg-panel button.nbg-tquiet{color:' + MUTED + '}.nbg-panel button.nbg-tdone{background:' + CYAN + ';color:' + INK + ';font-weight:600;margin-left:4px}' +
    '.nbg-panel input[type=number]{width:52px;height:26px;border:1px solid rgba(0,56,65,.25);border-radius:6px;font:inherit;padding:0 4px;text-align:center;color:inherit;background:#fff}' +
    '.nbg-panel label{display:inline-flex;align-items:center;gap:3px;color:' + MUTED + ';font-size:12px;margin:0 2px}.nbg-panel label input{width:56px}' +
    '.nbg-panel select{height:26px;max-width:150px;border:1px solid rgba(0,56,65,.25);border-radius:6px;font:inherit;padding:0 4px;color:inherit;background:#fff}' +
    '.nbg-panel .nbg-tsep{width:1px;height:20px;margin:0 4px;background:rgba(0,56,65,.14)}' +
    '.nbg-panel .nbg-swatches{display:inline-flex;gap:3px;align-items:center}' +
    '.nbg-panel .nbg-swatches button{min-width:16px;width:16px;height:16px;padding:0;border-radius:50%;border:1px solid rgba(0,56,65,.3)}' +
    '.nbg-panel .nbg-swatches button.nbg-on{box-shadow:0 0 0 2px #fff,0 0 0 4px ' + CYAN + '}' +
    '.nbg-panel.nbg-rows{flex-direction:column;align-items:stretch;gap:3px}' +
    '.nbg-panel .nbg-row{display:flex;align-items:center;gap:2px;flex-wrap:wrap}' +
    '.nbg-panel .nbg-tlabel{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:' + MUTED + ';margin:0 4px 0 2px;white-space:nowrap}' +
    '.nbg-panel button.nbg-off{opacity:.35}' +
    '.nbg-panel button svg{display:block;fill:none;stroke:currentColor;stroke-width:1.4;stroke-linecap:round;stroke-linejoin:round}' +
    '.nbg-panel button svg .nbg-fill{fill:currentColor;stroke:none}' +
    '@media print{#nbg-deck-menu,#nbg-deck-toast,#nbg-shape-box,#nbg-sel-marks,#nbg-marquee,#nbg-hover,.nbg-panel{display:none!important}.nbg-editing{outline:none!important;box-shadow:none!important}}';
  document.head.appendChild(style);

  var menu = null, menuTarget = null, menuShape = null, menuStack = [], menuSlide = null;
  function item(action, label, hint, cls) {
    return '<button type="button" role="menuitem" data-action="' + action + '"' + (cls ? ' class="' + cls + '"' : '') + '><b>' + label + '</b>' + (hint ? '<span>' + hint + '</span>' : '') + '</button>';
  }
  function renderMenu() {
    var h = '<div class="nbg-head"><i></i>NBG deck</div>';
    if (menuTarget) h += item('edit', 'Edit text', 'Edit this text in place — Enter applies, Esc cancels. Or double-click any text.');
    if (menuShape) {
      var inSel = sel.indexOf(menuShape) >= 0;
      h += item('shape', 'Resize / move shape', describe(menuShape) + ' — handles resize (Shift keeps proportions), drag moves, arrows nudge, Esc finishes.' + (shape ? '' : ' Shift+click adds more shapes.'));
      if (shape && !inSel) h += item('addsel', 'Add to selection', 'Select this shape together with the ' + sel.length + ' already selected (Shift+click does the same).');
      else if (shape && inSel && sel.length > 1) h += item('rmsel', 'Remove from selection', 'Keep the other ' + (sel.length - 1) + ' selected (Shift+click does the same).', 'nbg-quiet');
      if (shape) h += item('selall', 'Select all shapes on this slide', 'Ctrl/Cmd+A while a shape is selected; Shift+drag draws a selection box.', 'nbg-quiet');
      h += item('front', 'Bring to front', (inSel && sel.length > 1 ? 'The ' + sel.length + ' selected shapes' : 'This shape') + ' above everything else here (Ctrl/Cmd+Shift+]). The toolbar also steps forward / backward, aligns, distributes and groups.', 'nbg-quiet');
      h += item('back', 'Send to back', (inSel && sel.length > 1 ? 'The ' + sel.length + ' selected shapes' : 'This shape') + ' behind everything else here (Ctrl/Cmd+Shift+[).', 'nbg-quiet');
      if (findEdit(menuShape, 'style')) h += item('reset', 'Reset shape', 'Restore this element’s original size, position, order and text formatting.', 'nbg-quiet');
    }
    if (menuStack.length > 1) {
      // every shape under the pointer, front-most first: nested parts, their containers, shapes behind
      h += '<div class="nbg-sub">Select at this point · ' + menuStack.length + ' stacked</div>';
      menuStack.forEach(function (el, i) {
        var rel = i === 0 ? 'front-most' : el.contains(menuStack[i - 1]) ? 'encloses the one above' : 'behind the one above';
        h += item('pick', (el === menuShape ? '● ' : '○ ') + describe(el), rel + (i === menuStack.length - 1 ? ' · outermost' : '') + ' — click selects it alone, Shift+click adds it', 'nbg-pick' + (el === menuShape ? ' nbg-pick-on' : ''));
      });
    }
    h += item('outline', 'Show structure', 'The slide’s shapes as an outline — tick boxes to select several, click a name to select one; the selection is highlighted here. Tabs for the HTML tree and the editable source.', 'nbg-quiet');
    h += item('code', 'Show HTML', (menuShape || menuTarget ? describe(menuShape || menuTarget) + ' in a tree of the slide' : 'A tree of the slide') + ' — click an element there to select it here, and edit its source in the Code tab.', 'nbg-quiet');
    h += item('pdf', 'Export to PDF', 'Opens the print dialog — choose “Save as PDF”. One page per slide, 1920×1080, margins and backgrounds preset.');
    if (edits.length) {
      h += '<div class="nbg-sep"></div>';
      h += item('save', 'Save edited copy', 'Download this deck with your ' + changesLabel().replace(' unsaved', '') + ' applied (…-edited.html).');
      var sc = menuSlide ? editsIn(menuSlide).length : 0;
      if (sc) h += item('discardslide', 'Discard changes on this slide', 'Slide ' + (slideIndex(menuSlide) + 1) + ': restore its ' + sc + ' change' + (sc === 1 ? '' : 's') + ' — text, formatting, size, position, order and groups. The other slides keep theirs.', 'nbg-quiet');
      h += item('discard', 'Discard edits', 'Restore every original text, size, position, order and group on every slide.', 'nbg-quiet');
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
      else if (action === 'addsel') { closeMenu(); addToSelection(s); }
      else if (action === 'rmsel') { closeMenu(); removeFromSelection(s); }
      else if (action === 'selall') { closeMenu(); selectAllIn(slideOf(s)); }
      else if (action === 'front' || action === 'back') { closeMenu(); if (sel.indexOf(s) < 0) setSelection([s], s, { toast: false }); reorder(action); }
      else if (action === 'reset') { closeMenu(); resetShape(s); }
      else if (action === 'pick') {
        var el = menuStack[Array.prototype.indexOf.call(menu.querySelectorAll('[data-action=pick]'), b)];
        closeMenu();
        if (el) { if (e.shiftKey && shape) addToSelection(el); else { selectSolo(el, true); toast(describe(el) + ' selected — Tab / Shift+Tab step out / in, the toolbar’s Stack list shows the whole stack.', 3000); } }
      }
      else if (action === 'save') { closeMenu(); saveEditedCopy(); }
      else if (action === 'discard') { closeMenu(); discardEdits(); }
      else if (action === 'discardslide') { var sl = menuSlide; closeMenu(); discardSlideEdits(sl); }
      else if (action === 'code') { var ce = s || t || menuSlide; closeMenu(); openCode(ce, 'tree'); }
      else if (action === 'outline') { var oe = s || t || menuSlide; closeMenu(); openCode(oe, 'outline'); }
      else closeMenu();
    });
    menu.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    document.body.appendChild(menu);
  }
  function openMenu(x, y, target, shapeTarget) {
    if (!menu) buildMenu();
    menuTarget = target || null; menuShape = shapeTarget || null;
    lastPoint = { x: x, y: y };
    menuSlide = slideAtPoint(x, y);
    menuStack = shapeStack(x, y);
    if (menuShape && menuStack.indexOf(menuShape) < 0) menuStack.unshift(menuShape);
    renderMenu();
    menu.hidden = false;
    menu.style.left = '0px'; menu.style.top = '0px';
    var r = menu.getBoundingClientRect();
    menu.style.left = Math.max(8, Math.min(x, window.innerWidth - r.width - 8)) + 'px';
    menu.style.top = Math.max(8, Math.min(y, window.innerHeight - r.height - 8)) + 'px';
    var first = menu.querySelector('button'); if (first) first.focus({ preventScroll: true });
  }
  function closeMenu() { if (menu && !menu.hidden) { menu.hidden = true; menuTarget = null; menuShape = null; menuStack = []; menuSlide = null; } }

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
  function inTools(t) { return !!(tools && t && tools.contains(t)); }
  document.addEventListener('pointerdown', function (e) {
    if (menu && !menu.hidden && !menu.contains(e.target)) closeMenu();
    if (editing && !editing.el.contains(e.target) && !inTools(e.target) && !(menu && menu.contains(e.target))) commitEdit();
    // Shift+click / Shift+drag (and Ctrl/Cmd+click with a selection) select shapes instead of deselecting
    lastPoint = { x: e.clientX, y: e.clientY };
    if (e.button === 0 && !busy && !editing && (e.shiftKey || e.metaKey || e.ctrlKey) && startSelectGesture(e)) return;
    // a right-click keeps the selection (the menu offers "Add to selection"); a plain click outside ends it
    if (shape && e.button !== 2 && !(box && box.contains(e.target)) && !inShapeTools(e.target) && !inCode(e.target) && !(menu && menu.contains(e.target))) deselectShape();
  }, true);
  document.addEventListener('focusout', function (e) {
    if (editing && e.target === editing.el && !inTools(e.relatedTarget)) {
      setTimeout(function () { if (editing && document.activeElement !== editing.el && !inTools(document.activeElement)) commitEdit(); }, 0);
    }
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
    if (/^format(Bold|Italic|Underline|StrikeThrough|RemoveFormat)$/.test(t)) return;           // the toolbar's commands
    if (/^format/.test(t) || /^insert(OrderedList|UnorderedList|HorizontalRule|Link|FromYank)$/.test(t)) e.preventDefault();
  }, true);
  ['keydown', 'keyup', 'keypress'].forEach(function (type) {
    document.addEventListener(type, function (e) {
      if (editing) {
        if (inTools(e.target) || inCode(e.target)) return;                                      // the panels' inputs handle their own keys
        // keep the deck's shortcuts (arrows, space, Home/End…) from firing while typing
        e.stopPropagation();
        if (type !== 'keydown') return;
        var mod = e.ctrlKey || e.metaKey;
        if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); }
        else if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitEdit(); }
        else if (mod && e.shiftKey && (e.key === '>' || e.key === '.')) { e.preventDefault(); saveSelection(); format('bigger'); }
        else if (mod && e.shiftKey && (e.key === '<' || e.key === ',')) { e.preventDefault(); saveSelection(); format('smaller'); }
        else if (mod && !e.shiftKey && /^[biu]$/i.test(e.key)) {
          // Ctrl/Cmd+B/I/U: the browser formats a selection itself; with a collapsed caret apply to the whole text
          var tsel = window.getSelection();   // (not `sel`: that is the shape selection, and var hoists)
          if (tsel && tsel.isCollapsed) { e.preventDefault(); saveSelection(); format({ b: 'bold', i: 'italic', u: 'underline' }[e.key.toLowerCase()]); }
        }
        return;
      }
      if (shape && !(menu && !menu.hidden)) {
        if (inShapeTools(e.target) || inCode(e.target)) return;                                 // the panels' inputs handle their own keys
        e.stopPropagation();
        if (type !== 'keydown') return;
        var step = e.shiftKey ? 10 : 1, mod2 = e.ctrlKey || e.metaKey;
        if (e.key === 'Escape') { e.preventDefault(); if (marquee) finishMarquee(e, true); else if (drag) finishDrag(true); else deselectShape(); }
        else if (e.key === 'Enter') { e.preventDefault(); deselectShape(); }
        else if (e.key === 'Tab' && sel.length > 1) { e.preventDefault(); toast('Tab / Shift+Tab step through the stack of a single selection.', 1500); }
        else if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); var p = parentShape(shape.el); if (p) { selectSolo(p, true); toast('Enclosing shape selected: ' + describe(p) + ' — Shift+Tab goes back in.', 2000); } else toast('No enclosing shape.', 1500); }
        else if (e.key === 'Tab') {
          // Shift+Tab: the child shape under the last pointer position, else the first child shape
          e.preventDefault();
          var kids = childShapes(shape.el), pt = lastPoint, hit = null;
          if (pt) shapeStack(pt.x, pt.y).forEach(function (x) { if (!hit && kids.indexOf(x) >= 0) hit = x; });
          var k = hit || kids[0];
          if (k) { selectSolo(k, true); toast('Inner shape selected: ' + describe(k) + (kids.length > 1 ? ' (one of ' + kids.length + ' — the toolbar’s Stack list has them all)' : '') + ' — Tab goes back out.', 2500); } else toast('No shape inside this one.', 1500);
        }
        else if (mod2 && (e.code === 'KeyA' || /^a$/i.test(e.key))) { e.preventDefault(); selectAllIn(null); }
        else if (mod2 && (e.code === 'KeyG' || /^g$/i.test(e.key))) { e.preventDefault(); if (e.shiftKey) ungroupSelection(); else groupSelection(); }
        else if (mod2 && (e.code === 'BracketRight' || e.key === ']' || e.key === '}')) { e.preventDefault(); reorder(e.shiftKey ? 'front' : 'forward'); }
        else if (mod2 && (e.code === 'BracketLeft' || e.key === '[' || e.key === '{')) { e.preventDefault(); reorder(e.shiftKey ? 'back' : 'backward'); }
        else if (mod2 && e.shiftKey && (e.code === 'KeyH' || /^h$/i.test(e.key))) { e.preventDefault(); if (codeIsOpen()) closeCode(); else openCode(shape.el); }
        else if (mod2 && e.shiftKey && (e.code === 'KeyO' || /^o$/i.test(e.key))) { e.preventDefault(); if (codeIsOpen() && codeTab === 'outline') closeCode(); else openCode(shape.el, 'outline'); }
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
      format: format, buildEditedHtml: buildEditedHtml, save: saveEditedCopy, discard: discardEdits,
      discardSlide: discardSlideEdits, listFor: editsIn, slideAt: slideAtPoint,
    },
    shape: {
      select: selectShape, selectMany: selectShapes, add: addToSelection, remove: removeFromSelection, toggle: toggleSelection, solo: selectSolo,
      selectAll: function (slide) { return selectAllIn(slide || null); }, deselect: deselectShape,
      selected: function () { return shape ? shape.el : null; }, selection: function () { return sel.slice(); }, reset: resetShape,
      align: alignSelection, distribute: distributeSelection, order: reorder, group: groupSelection, ungroup: ungroupSelection,
      groupOf: groupId, shapesOf: slideShapes, stackAt: shapeStack, enclosing: ancestorShapes, inside: childShapes,
    },
    code: {
      open: openCode, close: closeCode, isOpen: codeIsOpen, show: function (el) { return openCode(el, 'code'); }, tab: setTab, refresh: codeRefresh,
      target: function () { return codeEl; }, source: function () { return codeRaw ? codeRaw.value : ''; }, filter: function (q) { outFilter = q || ''; var i = code && code.querySelector('.nbg-oq'); if (i) i.value = outFilter; renderOutline(); },
      outlineRowOf: function (el) { return codeOut ? codeOut.querySelector('.nbg-tr[data-path="' + pathKey(el) + '"]') : null; },
      setSource: function (txt) { if (!code) return false; codeRaw.value = txt; rawDirty = true; rawFor = rawFor || codeEl; return true; },
      apply: applyRaw, revert: revertRaw, rowOf: function (el) { return codeTree ? codeTree.querySelector('.nbg-tr[data-path="' + pathKey(el) + '"]:not([data-text])') : null; },
    },
    resolveTextTarget: resolveTextTarget, resolveShapeTarget: resolveShapeTarget,
  };
  window.nbgPdf = { prepare: prepare, restore: restore, exportPdf: exportPdf, version: VERSION };
})();
