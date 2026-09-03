/* NBG Design — in-deck right-click menu with "Export to PDF".
 *
 * Inlined into every delivered HTML deck by add-pdf-menu.mjs, right after print-layout.js
 * (which defines nbgPreparePrintLayout / nbgRestorePrintLayout). Plain browser JavaScript.
 *
 * What it does:
 *   - right-click anywhere on the deck (except links / form fields) opens a small NBG-styled
 *     menu: "Export to PDF" and "Cancel";
 *   - "Export to PDF" applies the shared print layout (every slide visible in flow, one
 *     1920x1080 page per slide, zero margins, backgrounds forced — exactly what
 *     scripts/export-pdf.mjs produces), opens the browser's print dialog, and restores the
 *     interactive deck when the dialog closes. In the dialog the viewer picks
 *     "Save as PDF" (Chrome / Edge); paper size and margins are preset by the page;
 *   - Ctrl/Cmd+P and the browser's own Print command go through the same prepare / restore,
 *     so a plain "print" of the deck is also faithful;
 *   - window.nbgPdf = { prepare, restore, exportPdf, version } is exposed for tests.
 *
 * The menu element lives outside the slides, so the print layout hides it automatically.
 */
(function () {
  if (window.nbgPdf) return;
  var VERSION = 1;
  var ACCENT = '#003841', CYAN = '#00ADBF', INK = '#0A1416', CREAM = '#F5F8F6';
  var FONT = "'Aptos', 'Inter', Helvetica, Arial, sans-serif";

  /* ---------- print orchestration ---------- */
  var busy = false, preparedByMenu = false;

  function prepare(opts) { return nbgPreparePrintLayout(opts || {}); }
  function restore() { return nbgRestorePrintLayout(); }
  // An external driver (scripts/export-pdf.mjs, tests) that prepares/prints/restores on its own
  // sets window.__nbgPdfExternal = true so the native print hooks below stay out of its way.
  function external() { return !!window.__nbgPdfExternal; }

  async function exportPdf() {
    if (busy) return;
    busy = true; preparedByMenu = true;
    closeMenu();
    try {
      var diag = await prepare();
      if (!diag.slides) { alertBox('No slides found — nothing to export.'); preparedByMenu = false; busy = false; restore(); return; }
      window.print();
    } catch (e) {
      preparedByMenu = false; busy = false; restore();
      alertBox('PDF export failed: ' + (e && e.message ? e.message : e));
      return;
    }
    // Chrome returns from print() when the dialog closes; afterprint fires as well. Restore once.
    finishPrint();
  }
  function finishPrint() {
    if (!busy) return;
    busy = false; preparedByMenu = false;
    restore();
  }
  // Native print (Ctrl/Cmd+P, menu > Print): beforeprint runs synchronously before the preview is
  // laid out, and the DOM part of prepare() is synchronous, so the preview already sees the layout.
  // (Chrome also fires both events around DevTools Page.printToPDF, so a plain "print this page"
  // from any driver gets the faithful layout unless the driver opted out via __nbgPdfExternal.)
  window.addEventListener('beforeprint', function () {
    if (preparedByMenu || external()) return;
    busy = true;
    prepare();
  });
  window.addEventListener('afterprint', function () { if (!external()) finishPrint(); });

  /* ---------- UI ---------- */
  var style = document.createElement('style');
  style.id = 'nbg-pdf-menu-style';
  style.textContent =
    '#nbg-pdf-menu{position:fixed;z-index:2147483647;min-width:260px;padding:6px;background:#fff;color:' + INK + ';' +
    'border:1px solid rgba(0,56,65,.14);border-radius:12px;box-shadow:0 12px 32px rgba(10,20,22,.18),0 2px 6px rgba(10,20,22,.10);' +
    'font:14px/1.35 ' + FONT + ';user-select:none;-webkit-user-select:none}' +
    '#nbg-pdf-menu .nbg-pdf-head{display:flex;align-items:center;gap:8px;padding:8px 10px 6px;font-size:11px;letter-spacing:.12em;' +
    'text-transform:uppercase;color:' + ACCENT + ';opacity:.85}' +
    '#nbg-pdf-menu .nbg-pdf-head i{display:inline-block;width:18px;height:3px;background:' + CYAN + ';border-radius:2px}' +
    '#nbg-pdf-menu button{display:block;width:100%;text-align:left;border:0;background:transparent;color:inherit;' +
    'font:inherit;padding:9px 10px;border-radius:8px;cursor:pointer}' +
    '#nbg-pdf-menu button:hover,#nbg-pdf-menu button:focus-visible{background:' + CREAM + ';outline:none}' +
    '#nbg-pdf-menu button b{display:block;font-weight:600;color:' + INK + '}' +
    '#nbg-pdf-menu button span{display:block;font-size:12px;color:#5B6B6D;margin-top:2px}' +
    '#nbg-pdf-menu .nbg-pdf-sep{height:1px;margin:4px 8px;background:rgba(0,56,65,.10)}' +
    '#nbg-pdf-menu .nbg-pdf-cancel{color:#5B6B6D}' +
    '#nbg-pdf-toast{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:2147483647;max-width:min(560px,90vw);' +
    'padding:12px 16px;background:' + INK + ';color:#fff;border-radius:10px;font:14px/1.4 ' + FONT + ';box-shadow:0 8px 24px rgba(0,0,0,.25)}' +
    '@media print{#nbg-pdf-menu,#nbg-pdf-toast{display:none!important}}';
  document.head.appendChild(style);

  var menu = null;
  function buildMenu() {
    menu = document.createElement('div');
    menu.id = 'nbg-pdf-menu';
    menu.setAttribute('role', 'menu');
    menu.hidden = true;
    menu.innerHTML =
      '<div class="nbg-pdf-head"><i></i>NBG deck</div>' +
      '<button type="button" role="menuitem" data-action="pdf"><b>Export to PDF</b>' +
      '<span>Opens the print dialog — choose “Save as PDF”. One page per slide, 1920×1080, margins and backgrounds preset.</span></button>' +
      '<div class="nbg-pdf-sep"></div>' +
      '<button type="button" role="menuitem" class="nbg-pdf-cancel" data-action="close">Cancel</button>';
    menu.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      e.preventDefault(); e.stopPropagation();
      if (b.getAttribute('data-action') === 'pdf') exportPdf(); else closeMenu();
    });
    menu.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    document.body.appendChild(menu);
  }
  function openMenu(x, y) {
    if (!menu) buildMenu();
    menu.hidden = false;
    menu.style.left = '0px'; menu.style.top = '0px';
    var r = menu.getBoundingClientRect();
    var vw = window.innerWidth, vh = window.innerHeight;
    menu.style.left = Math.max(8, Math.min(x, vw - r.width - 8)) + 'px';
    menu.style.top = Math.max(8, Math.min(y, vh - r.height - 8)) + 'px';
    var first = menu.querySelector('button'); if (first) first.focus({ preventScroll: true });
  }
  function closeMenu() { if (menu && !menu.hidden) menu.hidden = true; }

  var toastTimer = null;
  function alertBox(msg) {
    var t = document.getElementById('nbg-pdf-toast');
    if (!t) { t = document.createElement('div'); t.id = 'nbg-pdf-toast'; document.body.appendChild(t); }
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, 6000);
  }

  document.addEventListener('contextmenu', function (e) {
    if (busy) return;
    var t = e.target;
    if (t && t.closest && t.closest('a[href], input, textarea, select, [contenteditable="true"]')) return;   // keep the native menu there
    e.preventDefault();
    openMenu(e.clientX, e.clientY);
  });
  document.addEventListener('pointerdown', function (e) { if (menu && !menu.hidden && !menu.contains(e.target)) closeMenu(); }, true);
  document.addEventListener('keydown', function (e) {
    if (!menu || menu.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeMenu(); }
    else if (e.key === 'Enter' && document.activeElement && menu.contains(document.activeElement)) { /* button click handles it */ }
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault(); e.stopPropagation();
      var items = Array.prototype.slice.call(menu.querySelectorAll('button'));
      var i = items.indexOf(document.activeElement);
      items[(i + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length].focus({ preventScroll: true });
    } else { e.stopPropagation(); }   // keep deck shortcuts (arrows/space) from firing while the menu is open
  }, true);
  window.addEventListener('resize', closeMenu);
  window.addEventListener('scroll', closeMenu, true);

  window.nbgPdf = { prepare: prepare, restore: restore, exportPdf: exportPdf, version: VERSION };
})();
