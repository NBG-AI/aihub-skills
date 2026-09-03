#!/usr/bin/env node
// NBG Design — export an HTML deck to PDF with no change in aesthetics.
//
// The deck is opened in headless Chrome/Chromium/Edge and printed through the DevTools
// protocol (talked over --remote-debugging-pipe, so there is no dependency to install).
// Before printing, a shim is evaluated inside the page that turns the interactive deck
// into a print layout WITHOUT touching its design:
//
//   - every top-level `.slide` becomes visible (the `.active` / `.hidden` toggles, inline
//     display/opacity/visibility and [hidden] attributes used by deck navigation are lifted);
//   - the viewport-fit machinery (scaled `#deck` / `.slide-wrap`, fixed `#stage`, flex
//     centering) is neutralised so each slide sits in normal flow at its native artboard
//     size — the slide's own CSS, fonts, colours and embedded images are left untouched;
//   - navigation chrome outside the slides (buttons, counters, hints) is hidden;
//   - CSS animations/transitions jump to their end state, background colours and images
//     are forced to print (`print-color-adjust: exact`), and web fonts/images are awaited;
//   - the PDF page size is set to the slide's own box (normally 1920x1080 px = 20 x 11.25 in
//     at 96 dpi) with zero margins and one slide per page, so text stays vector/selectable.
//
// After writing the file the script verifies the PDF page count equals the slide count and
// exits non-zero on a mismatch (a slide taller than its page spills to an extra page; a
// slide that could not be detected is missing). Zero dependencies. Node >= 18.
//
// Exit: 0 = PDF written and verified, 1 = error / verification failure, 3 = no browser found.

import { readFileSync, writeFileSync, existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { resolve, dirname, basename, join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { findBrowser, NO_BROWSER_EXIT_CODE } from './lib/find-browser.mjs';

const USAGE = `NBG deck PDF exporter (needs a browser; vector output, one page per slide)
Usage: node export-pdf.mjs <deck.html> [-o <out.pdf>] [--size WxH] [--selector <css>]
                                     [--settle <ms>] [--timeout <ms>] [--browser <path>]
                                     [--debug-html <path>]

  -o, --out          Output PDF path (default: next to the deck, same name, .pdf).
  --size WxH         Force the page size in CSS px (default: the measured box of slide 1,
                     normally 1920x1080). Use only when the deck's slide box is wrong.
  --selector <css>   Slide selector (default ".slide"; nested matches are ignored).
  --settle <ms>      Extra wait after fonts/images are ready, before printing (default 400).
  --timeout <ms>     Overall timeout for the browser session (default 120000).
  --browser <path>   Explicit browser binary (else auto-detect; or env NBG_BROWSER / CHROME_BIN).
  --debug-html       Write the prepared (print-layout) DOM to this path for inspection.

Exit: 0 = PDF written and verified, 1 = error / verification failure, 3 = no browser found.`;

function parseArgs(argv) {
  const a = { _: [], settle: 400, timeout: 120000, selector: '.slide' };
  for (let i = 0; i < argv.length; i++) {
    const x = argv[i];
    if (x === '-o' || x === '--out') a.out = argv[++i];
    else if (x === '--size') a.size = argv[++i];
    else if (x === '--selector') a.selector = argv[++i];
    else if (x === '--settle') a.settle = parseInt(argv[++i], 10);
    else if (x === '--timeout') a.timeout = parseInt(argv[++i], 10);
    else if (x === '--browser') a.browser = argv[++i];
    else if (x === '--debug-html') a.debugHtml = argv[++i];
    else if (x === '-h' || x === '--help') a.help = true;
    else a._.push(x);
  }
  return a;
}

// ---------------------------------------------------------------------------------------
// In-page shim. Serialised with .toString() and evaluated in the deck via Runtime.evaluate.
// Everything it does is additive (classes + one <style>), so the deck's own CSS keeps
// governing the look of each slide; only the host/navigation layer is neutralised.
// ---------------------------------------------------------------------------------------
async function nbgPreparePrintLayout(opts) {
  const diag = { slides: 0, page: null, forcedDisplay: 0, hiddenElements: 0, ancestors: 0, sizeMismatch: [], notes: [] };
  const sel = opts.selector || '.slide';
  const all = Array.from(document.querySelectorAll(sel));
  const slides = all.filter((s) => !(s.parentElement && s.parentElement.closest(sel)));
  if (!slides.length) { diag.notes.push(`no element matches "${sel}"`); return diag; }
  diag.slides = slides.length;

  // 1. Global print rules (page box is filled in after measurement).
  const style = document.createElement('style');
  style.id = 'nbg-pdf-style';
  document.head.appendChild(style);
  const baseCss = `
    html, body { margin:0 !important; padding:0 !important; height:auto !important; min-height:0 !important;
                 max-height:none !important; overflow:visible !important; background:transparent !important; }
    *, *::before, *::after { -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important;
                 animation-duration:0s !important; animation-delay:0s !important; animation-fill-mode:forwards !important;
                 transition-duration:0s !important; transition-delay:0s !important; }
    ::-webkit-scrollbar { display:none !important; }
    .nbg-pdf-ancestor { position:static !important; display:block !important; transform:none !important;
                 width:auto !important; height:auto !important; min-width:0 !important; min-height:0 !important;
                 max-width:none !important; max-height:none !important; margin:0 !important; padding:0 !important;
                 inset:auto !important; overflow:visible !important; aspect-ratio:auto !important; zoom:1 !important;
                 flex:none !important; float:none !important; border:0 !important; }
    .nbg-pdf-hidden { display:none !important; }
    .nbg-pdf-slide { position:relative !important; inset:auto !important; margin:0 !important; transform:none !important;
                 opacity:1 !important; visibility:visible !important; overflow:hidden !important; float:none !important;
                 zoom:1 !important; break-after:page !important; page-break-after:always !important;
                 break-inside:avoid !important; page-break-inside:avoid !important; }
    .nbg-pdf-last { break-after:auto !important; page-break-after:auto !important; }`;
  style.textContent = baseCss;

  // 2. Neutralise every ancestor of a slide and hide the siblings that are not on the way
  //    to a slide (navigation buttons, counters, hints, decorative stage backgrounds).
  const chain = new Set();
  for (const s of slides) {
    let p = s.parentElement;
    while (p && p !== document.documentElement) { chain.add(p); p = p.parentElement; }
  }
  const skipTags = new Set(['SCRIPT', 'STYLE', 'LINK', 'TEMPLATE', 'META', 'TITLE', 'NOSCRIPT']);
  for (const a of chain) {
    a.classList.add('nbg-pdf-ancestor');
    diag.ancestors++;
    for (const c of Array.from(a.children)) {
      if (chain.has(c) || slides.includes(c) || skipTags.has(c.tagName)) continue;
      c.classList.add('nbg-pdf-hidden');
      diag.hiddenElements++;
    }
  }

  // 3. Make every slide visible in flow. Lift the navigation toggles, keep the design CSS.
  slides.forEach((s, i) => {
    s.classList.remove('hidden', 'is-hidden', 'inactive');
    s.classList.add('active', 'nbg-pdf-slide');
    s.removeAttribute('hidden');
    s.removeAttribute('aria-hidden');
    for (const p of ['display', 'opacity', 'visibility', 'transform', 'position', 'top', 'left', 'right', 'bottom', 'margin']) {
      s.style.removeProperty(p);
    }
    if (i === slides.length - 1) s.classList.add('nbg-pdf-last');
  });
  for (const s of slides) {
    if (getComputedStyle(s).display === 'none') {
      s.style.setProperty('display', 'block', 'important');
      diag.forcedDisplay++;
    }
  }

  // 4. Page box = the slide's own box (or the forced --size). Slides of another size are
  //    reported, never resized — resizing would change the design.
  let W, H;
  if (opts.size) { [W, H] = opts.size; }
  else {
    const r = slides[0].getBoundingClientRect();
    W = Math.round(r.width); H = Math.round(r.height);
  }
  if (!W || !H) { diag.notes.push('slide 1 has a zero-sized box'); return diag; }
  diag.page = { width: W, height: H };
  slides.forEach((s, i) => {
    const r = s.getBoundingClientRect();
    const w = Math.round(r.width), h = Math.round(r.height);
    if (w !== W || h !== H) diag.sizeMismatch.push({ slide: i + 1, width: w, height: h });
  });
  style.textContent = `@page { size: ${W}px ${H}px; margin: 0; }\n html, body { width:${W}px !important; }` + baseCss;

  // 5. Wait for fonts, images and two frames so lazy layout settles before printing.
  try { if (document.fonts && document.fonts.ready) await document.fonts.ready; } catch (e) { diag.notes.push('fonts.ready failed: ' + e); }
  await Promise.all(Array.from(document.images).filter((im) => !im.complete).map((im) => new Promise((res) => { im.onload = im.onerror = res; })));
  await new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)));
  window.scrollTo(0, 0);
  return diag;
}

// ---------------------------------------------------------------------------------------
// Minimal DevTools-protocol client over --remote-debugging-pipe (fd 3 = to browser,
// fd 4 = from browser; messages are JSON terminated by a NUL byte).
// ---------------------------------------------------------------------------------------
class Cdp {
  constructor(proc) {
    this.proc = proc; this.nextId = 0; this.pending = new Map(); this.listeners = new Set(); this.buf = '';
    const input = proc.stdio[4];
    input.setEncoding('utf8');
    input.on('data', (chunk) => {
      this.buf += chunk;
      let i;
      while ((i = this.buf.indexOf('\0')) >= 0) {
        const raw = this.buf.slice(0, i); this.buf = this.buf.slice(i + 1);
        let msg; try { msg = JSON.parse(raw); } catch { continue; }
        this.dispatch(msg);
      }
    });
  }
  dispatch(m) {
    if (m.id !== undefined && this.pending.has(m.id)) {
      const p = this.pending.get(m.id); this.pending.delete(m.id);
      if (m.error) p.reject(new Error(`${p.method}: ${m.error.message}${m.error.data ? ' — ' + m.error.data : ''}`));
      else p.resolve(m.result);
    } else if (m.method) {
      for (const l of this.listeners) l(m);
    }
  }
  send(method, params = {}, sessionId) {
    const id = ++this.nextId;
    const msg = { id, method, params };
    if (sessionId) msg.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject, method });
      this.proc.stdio[3].write(JSON.stringify(msg) + '\0');
    });
  }
  waitFor(method, sessionId, timeoutMs) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.listeners.delete(l); reject(new Error(`timeout waiting for ${method}`)); }, timeoutMs);
      const l = (m) => {
        if (m.method === method && (!sessionId || m.sessionId === sessionId)) {
          clearTimeout(timer); this.listeners.delete(l); resolve(m.params);
        }
      };
      this.listeners.add(l);
    });
  }
  failAll(err) { for (const p of this.pending.values()) p.reject(err); this.pending.clear(); }
}

function countPdfPages(buf) {
  // Chrome (Skia) writes classic xref tables without object streams, so page objects are
  // visible in the byte stream. `/Type /Page` followed by a non-word char (not `/Pages`).
  const text = buf.toString('latin1');
  const m = text.match(/\/Type\s*\/Page(?![A-Za-z])/g);
  return m ? m.length : 0;
}

async function exportPdf(args) {
  const deck = resolve(process.cwd(), args._[0]);
  if (!existsSync(deck)) throw new Error('not found: ' + deck);
  const out = resolve(process.cwd(), args.out || join(dirname(deck), basename(deck).replace(/\.html?$/i, '') + '.pdf'));

  let size = null;
  if (args.size) {
    const [w, h] = args.size.toLowerCase().split('x').map((n) => parseInt(n, 10));
    if (!w || !h) throw new Error(`bad --size "${args.size}" (expected WxH in px)`);
    size = [w, h];
  }

  const browser = findBrowser(args.browser);
  if (browser && browser.error) throw new Error(browser.error);
  if (!browser) return { noBrowser: true };

  const profile = mkdtempSync(join(tmpdir(), 'nbg-pdf-profile-'));
  const proc = spawn(browser, [
    '--headless=new', '--remote-debugging-pipe', '--disable-gpu', '--hide-scrollbars',
    '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--disable-sync',
    '--disable-background-networking', '--mute-audio', '--force-device-scale-factor=1',
    `--user-data-dir=${profile}`, '--window-size=1920,1080', 'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe', 'pipe', 'pipe'] });
  let stderr = '';
  proc.stderr.setEncoding('utf8');
  proc.stderr.on('data', (d) => { stderr += d; if (stderr.length > 20000) stderr = stderr.slice(-20000); });

  const cdp = new Cdp(proc);
  const deadline = new Promise((_, reject) => setTimeout(() => reject(new Error(`timed out after ${args.timeout} ms`)), args.timeout).unref());
  const exited = new Promise((_, reject) => proc.on('exit', (code) => reject(new Error(`browser exited early (code ${code})${stderr ? '\n' + stderr.trim().split('\n').slice(-5).join('\n') : ''}`))));
  proc.on('exit', () => cdp.failAll(new Error('browser exited')));

  const work = (async () => {
    const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
    await cdp.send('Page.enable', {}, sessionId);
    await cdp.send('Runtime.enable', {}, sessionId);
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false }, sessionId);

    const loaded = cdp.waitFor('Page.loadEventFired', sessionId, args.timeout);
    await cdp.send('Page.navigate', { url: pathToFileURL(deck).href }, sessionId);
    await loaded;

    const expr = `(${nbgPreparePrintLayout.toString()})(${JSON.stringify({ selector: args.selector, size })})`;
    const ev = await cdp.send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }, sessionId);
    if (ev.exceptionDetails) throw new Error('print shim failed: ' + (ev.exceptionDetails.exception?.description || ev.exceptionDetails.text));
    const diag = ev.result.value;
    if (!diag.slides) throw new Error(`no slides detected (${diag.notes.join('; ')}) — pass --selector if the deck does not use .slide`);
    if (!diag.page) throw new Error(`could not size the page (${diag.notes.join('; ')})`);

    if (args.settle > 0) await new Promise((r) => setTimeout(r, args.settle));

    if (args.debugHtml) {
      const dump = await cdp.send('Runtime.evaluate', { expression: 'document.documentElement.outerHTML', returnByValue: true }, sessionId);
      writeFileSync(resolve(process.cwd(), args.debugHtml), dump.result.value, 'utf8');
    }

    const { width, height } = diag.page;
    const pdf = await cdp.send('Page.printToPDF', {
      printBackground: true, preferCSSPageSize: true, displayHeaderFooter: false, scale: 1,
      paperWidth: width / 96, paperHeight: height / 96,
      marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0,
      transferMode: 'ReturnAsBase64',
    }, sessionId);
    const buf = Buffer.from(pdf.data, 'base64');
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, buf);
    try { await cdp.send('Browser.close'); } catch { /* already gone */ }
    return { out, buf, diag };
  })();

  try {
    return await Promise.race([work, deadline, exited]);
  } finally {
    try { proc.kill('SIGKILL'); } catch { /* ignore */ }
    try { rmSync(profile, { recursive: true, force: true }); } catch { /* ignore */ }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args._.length !== 1) { console.log(USAGE); process.exit(args.help ? 0 : 2); }

  let r;
  try { r = await exportPdf(args); }
  catch (e) { console.error('export-pdf ERROR: ' + e.message); process.exit(1); }

  if (r.noBrowser) {
    console.error('No Chrome/Chromium/Edge binary found — PDF export needs a browser engine.');
    console.error('  Install Chrome/Chromium on this host, or set NBG_BROWSER / CHROME_BIN, or pass --browser <path>.');
    console.error('  The HTML deck itself remains the deliverable; export the PDF on a host that has a browser.');
    process.exit(NO_BROWSER_EXIT_CODE);
  }

  const { out, buf, diag } = r;
  const pages = countPdfPages(buf);
  const kb = Math.round(buf.length / 1024);
  console.log(`\nNBG deck PDF export — ${out}`);
  console.log(`  slides: ${diag.slides} | pages: ${pages} | page box: ${diag.page.width}x${diag.page.height} px (${(diag.page.width / 96).toFixed(2)} x ${(diag.page.height / 96).toFixed(2)} in) | size: ${kb.toLocaleString()} KB`);
  console.log(`  host layer neutralised: ${diag.ancestors} wrapper(s), ${diag.hiddenElements} non-slide element(s) hidden, ${diag.forcedDisplay} slide(s) force-shown`);

  const problems = [];
  if (diag.page.width !== 1920 || diag.page.height !== 1080) {
    console.log(`  ! page box is not the NBG 1920x1080 artboard — kept as authored (${diag.page.width}x${diag.page.height}).`);
  }
  if (diag.sizeMismatch.length) {
    problems.push(`slide box differs from the page box on slide(s) ${diag.sizeMismatch.map((m) => `${m.slide} (${m.width}x${m.height})`).join(', ')} — fix the slide sizing in the deck; slides are never resized by the exporter.`);
  }
  if (pages !== diag.slides) {
    problems.push(`PDF has ${pages} page(s) for ${diag.slides} slide(s) — a slide that overflows its box spills onto extra pages, an undetected slide is missing.`);
  }
  if (diag.notes.length) diag.notes.forEach((n) => console.log('  ! ' + n));

  if (problems.length) {
    console.log('\nProblems:'); problems.forEach((p) => console.log('  ✗ ' + p));
    console.log('\nRESULT: FAIL — the PDF was written but does not match the deck; fix the deck and re-export.\n');
    process.exit(1);
  }
  console.log('\nRESULT: PASS — one page per slide at the native artboard size, vector text, backgrounds and embedded images preserved.');
  console.log('Now rasterise and READ a few pages (e.g. `pdftoppm -r 72 -png <out.pdf> <prefix>`) and compare them with the browser screenshots before delivery.\n');
  process.exit(0);
}

main();
