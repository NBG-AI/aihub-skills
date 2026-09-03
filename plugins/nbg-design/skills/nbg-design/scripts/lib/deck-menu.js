/* NBG Design — in-deck right-click menu: "Edit text", "Export to PDF", "Save edited copy".
 *
 * Inlined into every delivered HTML deck by add-deck-menu.mjs, right after print-layout.js
 * (which defines nbgPreparePrintLayout / nbgRestorePrintLayout). Plain browser JavaScript.
 *
 * Text editing
 *   - double-click a text element inside a slide (or right-click it → "Edit text") to edit it
 *     in place: the element becomes contenteditable (its inline markup and the slide's CSS are
 *     untouched; formatting commands are blocked, paste/drop insert plain text, and anything the
 *     browser wraps around typed text is unwrapped on commit); Enter or a click outside applies,
 *     Escape cancels, Shift+Enter inserts a line break; deck shortcuts are suppressed meanwhile;
 *   - edits are recorded as { path, original, html } and persisted in localStorage under a key
 *     derived from the file, so a reload keeps them until they are saved or discarded;
 *   - "Save edited copy" downloads <name>-edited.html: the edits applied to a pristine snapshot of
 *     the deck taken when this script ran (before any edit), so the copy loads exactly like the
 *     original — still self-contained, still carrying this menu;
 *   - "Discard edits" restores every original text and clears the stored edits.
 *
 * PDF export
 *   - "Export to PDF" applies the shared print layout (every slide visible in flow, one
 *     1920x1080 page per slide, zero margins, backgrounds forced — exactly what
 *     scripts/export-pdf.mjs produces), opens the browser's print dialog, and restores the
 *     interactive deck when the dialog closes. The viewer picks "Save as PDF" (Chrome / Edge);
 *   - Ctrl/Cmd+P and the browser's own Print command go through the same prepare / restore.
 *
 * window.nbgDeck = { version, pdf: { prepare, restore, exportPdf }, edit: { start, commit,
 * cancel, isEditing, list, buildEditedHtml, save, discard }, resolveTextTarget } is exposed;
 * window.nbgPdf aliases the pdf part. An external driver (export-pdf.mjs, tests) sets
 * window.__nbgPdfExternal = true so the native print hooks stay out of its way.
 *
 * The menu element lives outside the slides, so the print layout hides it automatically.
 */
(function () {
  if (window.nbgDeck) return;
  var VERSION = 2;
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

  /* ---------- text-element resolution ---------- */
  var INLINE = /^(span|a|b|i|em|strong|small|code|sup|sub|mark|u|abbr|time|label|s|q)$/i;
  function hasOwnText(el) {
    for (var n = el.firstChild; n; n = n.nextSibling) if (n.nodeType === 3 && n.nodeValue.trim()) return true;
    return false;
  }
  function resolveTextTarget(t) {
    if (t && t.nodeType === 3) t = t.parentElement;
    if (!t || !t.closest) return null;
    if (t.closest('#nbg-deck-menu, #nbg-deck-toast')) return null;
    var slide = t.closest('.slide'); if (!slide) return null;
    var el = t;
    while (el && el !== slide && !hasOwnText(el)) el = el.parentElement;
    if (!el || el === slide) return null;
    // an inline run inside a text block edits the whole block (keeps the accent spans intact)
    while (el.parentElement && el.parentElement !== slide && INLINE.test(el.tagName) && hasOwnText(el.parentElement)) el = el.parentElement;
    if (/^(img|svg|video|canvas|input|textarea|select|button)$/i.test(el.tagName)) return null;
    return el;
  }

  /* ---------- edit state + persistence ---------- */
  var STORAGE_KEY = 'nbg-deck-edits:' + location.pathname + '#' + document.title;
  var edits = [];          // { path, original, html }
  var editing = null;      // { el, original }
  function store() {
    try { if (edits.length) localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, edits: edits })); else localStorage.removeItem(STORAGE_KEY); } catch (e) { /* storage unavailable */ }
  }
  function loadStored() {
    var raw = null; try { raw = localStorage.getItem(STORAGE_KEY); } catch (e) { return; }
    if (!raw) return;
    var data; try { data = JSON.parse(raw); } catch (e) { return; }
    if (!data || !data.edits) return;
    data.edits.forEach(function (ed) {
      var el = elAt(document, ed.path);
      if (el && el.innerHTML === ed.original) { el.innerHTML = ed.html; edits.push(ed); }   // stale entries (deck changed) are dropped
    });
    store();
  }
  function recordEdit(el, original, html) {
    var path = pathOf(el);
    for (var i = 0; i < edits.length; i++) {
      if (edits[i].path.join('/') === path.join('/')) { edits[i].html = html; store(); return; }   // keep the first original
    }
    edits.push({ path: path, original: original, html: html });
    store();
  }

  /* ---------- editing ---------- */
  function startEdit(el, keepSelection) {
    if (!el || busy) return false;
    if (editing && editing.el === el) return true;
    if (editing) commitEdit();
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
      recordEdit(e.el, e.original, e.el.innerHTML);
      toast('Text updated — ' + edits.length + ' unsaved edit' + (edits.length === 1 ? '' : 's') + '. Right-click → “Save edited copy” to download the deck with your changes.', 5000);
    }
    return true;
  }
  function cancelEdit() {
    if (!editing) return false;
    var e = endEdit();
    e.el.innerHTML = e.original;
    return true;
  }
  function discardEdits() {
    if (editing) cancelEdit();
    for (var i = edits.length - 1; i >= 0; i--) { var el = elAt(document, edits[i].path); if (el) el.innerHTML = edits[i].original; }
    edits = []; store();
    toast('All edits discarded.', 2500);
  }

  /* ---------- saving ---------- */
  function buildEditedHtml() {
    if (editing) commitEdit();
    var doc = new DOMParser().parseFromString(PRISTINE, 'text/html');
    var applied = 0, skipped = 0;
    edits.forEach(function (ed) {
      var el = elAt(doc, ed.path);
      if (!el || el.innerHTML !== ed.original) {
        // fallback: a unique element with the same tag and original markup
        var same = Array.prototype.filter.call(doc.querySelectorAll('.slide ' + (el ? el.tagName : '*')), function (c) { return c.innerHTML === ed.original; });
        el = same.length === 1 ? same[0] : null;
      }
      if (el) { el.innerHTML = ed.html; applied++; } else skipped++;
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
    toast('Saved “' + name + '” with ' + r.applied + ' edit' + (r.applied === 1 ? '' : 's') + (r.skipped ? ' (' + r.skipped + ' could not be located)' : '') + '. The copy carries this menu too.', 6000);
    return r;
  }

  /* ---------- print orchestration ---------- */
  var busy = false, preparedByMenu = false;
  function prepare(opts) { if (editing) commitEdit(); return nbgPreparePrintLayout(opts || {}); }
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
    '#nbg-deck-menu{position:fixed;z-index:2147483647;min-width:280px;max-width:360px;padding:6px;background:#fff;color:' + INK + ';' +
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
    '#nbg-deck-toast{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:2147483647;max-width:min(600px,90vw);' +
    'padding:12px 16px;background:' + INK + ';color:#fff;border-radius:10px;font:14px/1.4 ' + FONT + ';box-shadow:0 8px 24px rgba(0,0,0,.25)}' +
    '.nbg-editing{outline:2px solid ' + CYAN + ' !important;outline-offset:4px;box-shadow:0 0 0 6px rgba(0,173,191,.15) !important;cursor:text;border-radius:3px}' +
    '@media print{#nbg-deck-menu,#nbg-deck-toast{display:none!important}.nbg-editing{outline:none!important;box-shadow:none!important}}';
  document.head.appendChild(style);

  var menu = null, menuTarget = null;
  function item(action, label, hint, cls) {
    return '<button type="button" role="menuitem" data-action="' + action + '"' + (cls ? ' class="' + cls + '"' : '') + '><b>' + label + '</b>' + (hint ? '<span>' + hint + '</span>' : '') + '</button>';
  }
  function renderMenu() {
    var h = '<div class="nbg-head"><i></i>NBG deck</div>';
    if (menuTarget) h += item('edit', 'Edit text', 'Edit this text in place — Enter applies, Esc cancels. Or double-click any text.');
    h += item('pdf', 'Export to PDF', 'Opens the print dialog — choose “Save as PDF”. One page per slide, 1920×1080, margins and backgrounds preset.');
    if (edits.length) {
      h += '<div class="nbg-sep"></div>';
      h += item('save', 'Save edited copy', 'Download this deck with your ' + edits.length + ' edit' + (edits.length === 1 ? '' : 's') + ' applied (…-edited.html).');
      h += item('discard', 'Discard edits', 'Restore every original text.', 'nbg-quiet');
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
      var action = b.getAttribute('data-action');
      if (action === 'pdf') exportPdf();
      else if (action === 'edit') { var t = menuTarget; closeMenu(); startEdit(t, false); }
      else if (action === 'save') { closeMenu(); saveEditedCopy(); }
      else if (action === 'discard') { closeMenu(); discardEdits(); }
      else closeMenu();
    });
    menu.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    document.body.appendChild(menu);
  }
  function openMenu(x, y, target) {
    if (!menu) buildMenu();
    menuTarget = target || null;
    renderMenu();
    menu.hidden = false;
    menu.style.left = '0px'; menu.style.top = '0px';
    var r = menu.getBoundingClientRect();
    menu.style.left = Math.max(8, Math.min(x, window.innerWidth - r.width - 8)) + 'px';
    menu.style.top = Math.max(8, Math.min(y, window.innerHeight - r.height - 8)) + 'px';
    var first = menu.querySelector('button'); if (first) first.focus({ preventScroll: true });
  }
  function closeMenu() { if (menu && !menu.hidden) { menu.hidden = true; menuTarget = null; } }

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
    if (editing && editing.el.contains(t)) return;                                              // native menu while editing (spellcheck etc.)
    if (t && t.closest && t.closest('a[href], input, textarea, select, [contenteditable="true"]')) return;
    e.preventDefault();
    if (editing) commitEdit();
    openMenu(e.clientX, e.clientY, resolveTextTarget(t));
  });
  document.addEventListener('dblclick', function (e) {
    if (busy || (menu && !menu.hidden)) return;
    if (editing && editing.el.contains(e.target)) return;
    var el = resolveTextTarget(e.target);
    if (!el) return;
    e.preventDefault();
    startEdit(el, true);
  });
  document.addEventListener('pointerdown', function (e) {
    if (menu && !menu.hidden && !menu.contains(e.target)) closeMenu();
    if (editing && !editing.el.contains(e.target) && !(menu && menu.contains(e.target))) commitEdit();
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
    resolveTextTarget: resolveTextTarget,
  };
  window.nbgPdf = { prepare: prepare, restore: restore, exportPdf: exportPdf, version: VERSION };
})();
