# NBG Design — build, verification & export scripts

Zero-dependency Node scripts (Node >= 18, no `npm install`) that make asset embedding
deterministic, add a browser-free quality gate, capture per-slide screenshots, and export
the finished deck to PDF. They exist because the hand-pasting of large base64 data URIs is
the step that silently breaks in headless / SSH / Linux runs — the model "approximates" a
photo with a gradient or substitutes a text/box logo, and with no display to screenshot,
the lapse ships — and because a PDF produced any other way (browser "Save as PDF",
`window.print()` at A4, Office round-trips) changes the deck's aesthetics.

All scripts resolve the bundled assets **relative to the script's own location** (the
skill root), never the current working directory — so they work from any cwd and on any
machine, as long as the **whole skill folder** (including `NBG-Design/assets/` and
`scripts/lib/`) was copied, not just `SKILL.md`.

## 1. Embed assets — `embed-assets.mjs`

Author the deck with `{{TOKEN}}` placeholders instead of inline data URIs, then run:

```
node "<skill-root>/scripts/embed-assets.mjs" my-deck.html
```

- Tokens map to asset files by lower-casing and turning `_` into `-`:
  `{{PHOTO_STREET}}` → `photo-street.datauri.txt`, `{{LOGO_KNOCKOUT}}` → `logo-knockout.datauri.txt`.
- Available tokens: `{{LOGO_PRIMARY}}` `{{LOGO_KNOCKOUT}}` `{{LOGO_SMALL}}`
  `{{PHOTO_FIELDS}}` `{{PHOTO_HEART}}` `{{PHOTO_PARTHENON}}` `{{PHOTO_SKATE}}` `{{PHOTO_STREET}}`.
- Define each token **once** (e.g. a CSS `background-image: url("{{PHOTO_STREET}}")` class)
  and reuse the class, so the large URI appears only once in the file.
- Fails loudly if a token has no matching asset or the asset isn't a `data:image/` URI.
- `-o out.html` writes to a new file; default overwrites in place.

## 2. Verify the deck — `verify-deck.mjs`

Run this before delivering **any** deck. It needs no browser, so it works over SSH:

```
node "<skill-root>/scripts/verify-deck.mjs" my-deck.html --strict
```

Exit code 0 = pass, 1 = fail.

**Hard failures (always):** unresolved `{{TOKEN}}` placeholders; any image referenced by
`file://` / absolute / relative / `http(s)://` instead of a `data:` URI; zero embedded
images.

**`--strict` also fails on:** fewer than `--min-images` embedded images (default 2); file
smaller than `--min-bytes` (default 200000) — a photo-less deck is the classic tell; bare
`>NBG<` / `>NPG<` text nodes that may be a text/box substitute for the logo lockup; a missing
right-click "Export to PDF" menu (section 5; `--no-pdf-menu` only when the user declined it).
A present-but-incomplete menu block is a hard failure in every mode.

## 3. Screenshot the deck — `screenshot-deck.mjs` (optional, needs a browser)

Visual check for hosts that have Chrome/Chromium/Edge. Writes one PNG per slide at the
required viewports so they can be read and inspected:

```
node "<skill-root>/scripts/screenshot-deck.mjs" my-deck.html [-o <dir>] [--viewports WxH,WxH] [--slides 1,2,5]
```

- Auto-detects a browser (override with `--browser <path>` or env `NBG_BROWSER` / `CHROME_BIN`).
- Navigates slides generically: injects a shim (before the **last** `</body>`) that calls the
  deck's `window.showSlide` / `window.gotoSlide` if present, then forces the Nth top-level
  `.slide` to be the only visible one **in place** — so `.active` toggles, `.hidden` toggles,
  inline `display` toggles and stacked scrolling decks all work, and the deck's own
  viewport-fit scaling still applies to the capture.
- Counts slides by the exact class token `slide` (`slide-title` / `slide-footer` do not count).
- Default viewports `1366x768,1440x900`; default output `test_scripts/screenshots/`.
- **Exit codes:** 0 = screenshots written, 1 = error, **3 = no browser found** (a soft signal — fall
  back to `verify-deck.mjs --strict`, which is the mandatory gate on headless hosts).

## 4. Export to PDF — `export-pdf.mjs` (needs a browser)

Turns the finished, verified HTML deck into a PDF **without changing its aesthetics**: one
page per slide at the slide's own box (the 1920×1080 artboard = 20 × 11.25 in at 96 dpi),
zero margins, backgrounds and embedded images preserved, vector (selectable) text.

```
node "<skill-root>/scripts/export-pdf.mjs" my-deck.html [-o my-deck.pdf] [--size WxH] [--selector <css>]
                                                        [--settle <ms>] [--timeout <ms>] [--browser <path>]
                                                        [--debug-html <path>]
```

How it works: the deck is opened in headless Chrome/Chromium/Edge and driven over the
DevTools protocol (`--remote-debugging-pipe`, so nothing to install). A shim
(`lib/print-layout.js`, the same code the in-deck menu inlines) evaluated in the page lifts
the **host layer only** — navigation toggles (`.active` / `.hidden` / inline
`display` / `[hidden]`), the viewport-fit wrappers (scaled `#deck` / `.slide-wrap`, fixed
`#stage`, flex centering), non-slide chrome (buttons, counters) — makes every top-level
`.slide` visible in normal flow, jumps CSS animations/transitions to their end state,
forces `print-color-adjust: exact`, waits for fonts and images, then prints with
`Page.printToPDF` (`printBackground`, `preferCSSPageSize`, `scale: 1`, page size = slide box).
**A slide's own CSS, size, fonts, colours, copy, logos and photography are never touched**;
a slide whose box differs from slide 1 is reported, not resized.

Flags:

- `-o, --out` — output path (default: next to the deck, same name, `.pdf`).
- `--size WxH` — force the page box in CSS px; use only when the deck's slide box is wrong.
  The default is the measured box of slide 1 (a 1280×720 deck yields 1280×720 pages).
- `--selector` — slide selector (default `.slide`; nested matches ignored). Only for decks
  not authored with this skill.
- `--settle` — extra ms after fonts/images are ready (default 400).
- `--timeout` — whole browser session (default 120000 ms).
- `--browser` / env `NBG_BROWSER`, `CHROME_BIN` — explicit browser binary.
- `--debug-html` — dump the prepared (print-layout) DOM for inspection when a page looks off.

Fonts: the PDF embeds the faces the browser resolved on the exporting host for the deck's
font stack (`pdffonts my-deck.pdf` lists them). With Aptos absent, both the screenshots and
the PDF use the same system fallback — export where Aptos is installed if it must appear.

Built-in verification (exit 1 on failure): PDF page count must equal the slide count; every
slide box must equal the page box. A mismatch is a defect in the deck (a slide with
`height:auto` that overflows spills to an extra page; an undetected slide is missing) — fix
the HTML and re-export, never add print CSS or resize slides to get past it.

**Exit codes:** 0 = PDF written and verified, 1 = error / verification failure, **3 = no
browser found** — deliver the verified HTML, say the PDF could not be produced on this host,
and give the one-line command to run on a host with a browser.

After a PASS, rasterise a few pages and **read them** next to the screenshots:

```
pdftoppm -r 72 -png my-deck.pdf pages/my-deck     # poppler; 1382x777 px per page at 72 dpi
pdfinfo my-deck.pdf                                # Pages: N, Page size: 1440 x 810 pts
pdftotext -l 1 my-deck.pdf -                       # text is selectable (vector), not a bitmap
```

## 5. In-deck right-click "Export to PDF" menu — `add-pdf-menu.mjs`

Gives the people who receive the HTML the same export with no tooling: right-click anywhere
on the deck → **Export to PDF** → choose **Save as PDF** in the browser's print dialog.

```
node "<skill-root>/scripts/add-pdf-menu.mjs" my-deck.html [-o <out.html>] [--remove]
```

- Inlines one `<script id="nbg-pdf-menu-script" data-nbg-pdf-menu="<version>">` before the
  last `</body>`: `lib/print-layout.js` (the print-layout shim shared with `export-pdf.mjs`)
  followed by `lib/pdf-menu.js` (the UI). The deck stays fully self-contained (~17 KB more).
- Idempotent: re-running reports `already current`, or replaces an older block (`upgraded`).
  `--remove` strips it.
- The menu: NBG-styled panel (white, teal accent, Aptos stack) with *Export to PDF* and
  *Cancel*; Escape / click outside closes it; arrow keys move; deck shortcuts are suppressed
  while it is open; right-clicking a link or form field keeps the browser's native menu.
- *Export to PDF*: applies the print layout (every slide in flow, page box = slide box, zero
  margins, backgrounds forced, animations settled), calls `window.print()`, and restores the
  interactive deck — classes, inline styles, attributes and the viewport-fit scaling — when the
  dialog closes. Ctrl/Cmd+P and the browser's Print command use the same
  `beforeprint`/`afterprint` hooks, so any print of the deck is faithful.
- `window.nbgPdf = { prepare, restore, exportPdf, version }` is exposed for tests; an external
  driver sets `window.__nbgPdfExternal = true` to keep the hooks idle (`export-pdf.mjs` does).
- Chrome and Edge honour the page's `@page { size: 1920px 1080px; margin: 0 }` in the dialog;
  the viewer only has to pick *Save as PDF* (keep Scale 100 %). Safari's `@page size` support
  is partial — the CLI exporter remains the deterministic reference.

## Recommended workflow

```
# 1. author my-deck.html using {{TOKEN}} placeholders for every image
node "<skill-root>/scripts/embed-assets.mjs"    my-deck.html
node "<skill-root>/scripts/add-pdf-menu.mjs"    my-deck.html            # standard: right-click "Export to PDF"
node "<skill-root>/scripts/verify-deck.mjs"     my-deck.html --strict   # mandatory, headless-safe
node "<skill-root>/scripts/screenshot-deck.mjs" my-deck.html            # optional, when a browser exists
# then READ the PNGs and inspect them
node "<skill-root>/scripts/export-pdf.mjs"      my-deck.html            # when a PDF was requested
# then rasterise a few pages and READ them against the screenshots
```

`<skill-root>` is the directory that contains `SKILL.md`. Shared code under `scripts/lib/`:
`find-browser.mjs` (browser locator), `cdp.mjs` (DevTools-protocol client), `print-layout.js`
(print-layout shim, browser JS, used by the exporter and inlined by the menu), `pdf-menu.js`
(menu UI, browser JS).
