---
name: nbg-design
description: Use when creating National Bank of Greece (NBG) styled presentations, HTML slides (with a built-in right-click menu for in-place text editing, shape resize/move, "Export to PDF" and "Save edited copy"), slide specifications, PDF exports of HTML decks (one page per slide, aesthetics preserved), or editable PowerPoint recreations using the bundled NBG Presentation Design System, templates, logos, photography, screenshots, and guardrails.
---

# NBG Design

This skill packages the NBG Presentation Design System as a user-level Pi skill so it can be used from any working directory.

## First step when this skill is used

Resolve all paths below relative to this skill directory, the directory that contains this `SKILL.md` file. Do **not** assume the original project checkout exists or that the current shell working directory is the original project root.

Before generating final slide output, read these bundled resources:

1. `config/pi-agent-nbg-design.yaml` — canonical NBG presentation behavior, defaults, asset list, and guardrails.
2. `NBG-Design/NBG Design System.html` — visual design-system reference.
3. `NBG-Design/slide-templates.jsx` — reusable 1920×1080 slide templates and component patterns.
4. `NBG-Design/tweaks-panel.jsx` — bundled tweak/edit helper reference when inspecting template host behavior.

Use the bundled assets in `NBG-Design/assets/` and the bundled presentation screenshots in `NBG-Design/screenshots/` as visual references.

## Required user inputs

For each deck or slide request, require:

- presentation topic;
- target audience;
- desired slide count or depth.

Ask the user for missing required inputs instead of inventing them.

Approved defaults:

- If no deck language is specified, use English (`en`).
- If no final output format is specified, use HTML (`html`).

Supported output formats: `html` (default), `pdf` (always exported from the finished HTML deck — see "PDF output"), and `pptx` (native recreation — see "HTML-to-PowerPoint conversion guardrails"). A request for "a PDF", "PDF version", "print version", or "send as PDF" selects `pdf`.

Do not create any other fallback configuration values unless the user explicitly approves the exception.

## Design-system rules

- Use the NBG Presentation Design System; do not invent a parallel brand or visual system.
- Preserve the NBG 16:9 / 1920×1080 internal slide composition.
- Use the NBG teal-led palette, quiet neutrals, generous whitespace, clear hierarchy, and restrained emphasis.
- Use NBG logos and bundled photography from `NBG-Design/assets/`. The NBG logo must always be the bundled lockup image — never a text label, initials, a colored square/box, or any CSS/SVG re-creation. See "Logo rendering (MANDATORY)".
- Treat bundled screenshots as visual references, not as source code.
- Start decks with an NBG-style cover slide.
- Use divider slides for major sections.
- Use content slides for explanations, comparisons, statistics, and takeaways.
- Keep slide copy concise and use speaker-notes-style expansion where needed.
- Keep newsletter/email prototypes out of scope unless the user explicitly asks to reuse them.

## HTML output guardrails

For HTML slide or presentation output:

- Fit the complete 16:9 slide inside common browser viewports.
- Keep the internal design coordinate system compatible with the 1920×1080 NBG artboard while scaling the rendered slide down when needed.
- Use a viewport-fitting wrapper, explicit rendered width/height sizing, aspect-ratio constraint, CSS transform scaling, or equivalent robust approach.
- When scaling a fixed 1920×1080 artboard, do not rely on the unscaled transformed element's layout box for page height.
- Prevent unintended horizontal or vertical scrolling caused by the artboard itself.
- Verify fit at common desktop/laptop viewport sizes, including 1366×768 and 1440×900.
- When screenshot tooling is available, save screenshots under `test_scripts/screenshots/` in the active working project, or another user-selected output folder, and visually inspect them before delivery. On a headless host with no browser (typical for SSH/Linux runs), the screenshot step cannot run — so the browser-free `scripts/verify-deck.mjs <deck>.html --strict` check is the mandatory minimum gate and must pass before delivery.
- Protect the slide artboard from unintended element overlap: cards, text blocks, decorative shapes, logos, footers, page numbers, and grouped rows/columns must not collide unless the overlap is an explicit, content-safe brand accent.
- Reserve non-overlapping layout zones for the title/header, main body, card grids/rows, bottom callouts, and footer/logo area. Keep at least 32px internal artboard spacing between adjacent content groups, and at least 72px clearance above footer/page-number elements unless the template defines a larger safe area.
- When content does not fit without overlap, reduce copy, resize or simplify components, change the grid/row structure, or split the content across additional slides. Do not hide overflow, stack opaque elements on top of content, or rely on z-index as a workaround for a crowded layout.
- Treat the current `agentic-engineering-nbg-executive-presentation.html` slides 2 and 3 overlap pattern as a regression example: independently positioned card/callout rows must be checked against each other before delivery.

## Image embedding (MANDATORY)

Delivered HTML must be **fully self-contained**: every image — the NBG logo **and** all photography — must be embedded inline as a base64 `data:` URI so the deck renders identically on any machine, when moved, emailed, or opened directly. This is the single most important output rule.

### Absolute prohibitions for delivered HTML

- **NEVER** reference any image by a file path of any kind. Specifically forbidden as an `<img src>` / `background-image` / `url(...)` value:
  - `file://...` URLs (e.g. `file:///home/<user>/.claude/plugins/.../assets/logo-knockout.png`) — these point at the generating machine's plugin cache and break everywhere else. **This is the most common cause of a missing logo and is never acceptable.**
  - Absolute filesystem paths (`/Users/...`, `/home/...`, `C:\...`).
  - Relative paths (`assets/...`, `./NBG-Design/...`, `../...`).
  - URLs to the skill directory, the plugin cache, or any local location.
- **NEVER** substitute the logo with text (e.g. a "National Bank of Greece" label), initials, a single letter, a colored square/rounded box, an emoji, or any hand-built CSS/SVG mark.

A deck that contains any `file://`, absolute, or relative image path, or any non-image logo placeholder, is **incorrect and must be fixed before delivery**.

### Required approach

1. For each image you place, read the matching pre-encoded data-URI file bundled next to the asset and paste its **entire contents** as the `src`. Every asset has a ready-to-use `<asset>.datauri.txt`:
   - Logos: `NBG-Design/assets/logo-primary.datauri.txt` (full-color, for **light** backgrounds), `logo-knockout.datauri.txt` (white, for **dark** backgrounds), `logo-small.datauri.txt` (compact, for footers/tight spaces).
   - Photography: `NBG-Design/assets/photo-fields.datauri.txt`, `photo-heart.datauri.txt`, `photo-parthenon.datauri.txt`, `photo-skate.datauri.txt`, `photo-street.datauri.txt`.
   - Each file already begins with the correct `data:image/png;base64,` or `data:image/jpeg;base64,` prefix — paste it verbatim, do not truncate or edit it.
   - Example: `<img src="data:image/png;base64,iVBORw0K..." alt="National Bank of Greece" style="height:56px;width:auto;display:block;" />`
2. To avoid repeating a large data URI, define each one **once** and reuse it. Valid reuse patterns: a CSS class with `background-image: url("data:...")` applied to sized elements (data URIs work in `background-image`), or — in React/Babel decks — a shared JS constant interpolated into each `src`. (Note: CSS `var()` cannot be used for an `<img src>` attribute, only for `background-image`.)
3. Choose the logo variant by background: primary on light, knockout on dark, small for footers/compact placements. Preserve native aspect ratio (set `height`, let `width:auto`); never stretch or distort.
4. **For PPTX output**, insert the actual `NBG-Design/assets/<asset>.png|jpeg` image as a picture object; do not re-draw the logo with shapes or text and do not link the image by external path.

### Deterministic embedding & verification (REQUIRED — especially headless / SSH / Linux)

Hand-pasting large base64 blobs is the step that most often fails in non-interactive runs (e.g. `claude -p` over SSH on a Linux host): the model "approximates" a photo with a gradient or substitutes a text/box logo, and — with no display to screenshot — the lapse ships. **Do not rely on hand-pasting.** Use the bundled scripts instead:

1. **Author the deck with placeholder tokens, not inline data URIs.** Put a token wherever an image goes: `{{LOGO_PRIMARY}}`, `{{LOGO_KNOCKOUT}}`, `{{LOGO_SMALL}}`, and `{{PHOTO_FIELDS}}`, `{{PHOTO_HEART}}`, `{{PHOTO_PARTHENON}}`, `{{PHOTO_SKATE}}`, `{{PHOTO_STREET}}`. Define each token **once** (e.g. a CSS `background-image: url("{{PHOTO_STREET}}")` class) and reuse the class.
2. **Embed deterministically.** From any working directory:
   `node "<skill-root>/scripts/embed-assets.mjs" <deck>.html`
   The script resolves the bundled assets relative to itself (not the cwd), so it works on any machine. It replaces every token with the verbatim `data:` URI and fails loudly if an asset is missing.
3. **Add the in-deck right-click menu (standard for every delivered deck).**
   `node "<skill-root>/scripts/add-deck-menu.mjs" <deck>.html`
   Inlines one self-contained `<script id="nbg-deck-menu-script">` before the last `</body>` (idempotent; re-running upgrades an older menu, including the v1.4 PDF-only one). Viewers get *Edit text* (in-place editing, also by double-click), *Resize / move shape*, *Export to PDF*, *Save edited copy* and *Discard edits*. See "In-deck right-click menu". Skip only if the user explicitly declines the menu, and then verify with `--no-deck-menu`.
4. **Verify before delivery (browser-free — works headless).**
   `node "<skill-root>/scripts/verify-deck.mjs" <deck>.html --strict`
   It exits non-zero if any image is not a `data:` URI, if forbidden `file://`/absolute/relative paths remain, if tokens are unresolved, or (in `--strict`) if the deck is suspiciously small / photo-less, contains bare `NBG`/`NPG` text that may be a logo substitute, or lacks the right-click deck menu. **Never deliver a deck that fails this gate.**
5. **If the skill was moved to another machine**, confirm the **whole** skill folder travelled, including `NBG-Design/assets/` (the `*.datauri.txt` files) and `scripts/lib/`. If `embed-assets.mjs` reports a missing assets directory, that is the root cause — copy the full skill, not just `SKILL.md`.

6. **Optional visual check when a browser exists.** On a host with Chrome/Chromium/Edge, also capture screenshots:
   `node "<skill-root>/scripts/screenshot-deck.mjs" <deck>.html`
   It auto-detects a browser, navigates each slide (works for both hash-based and `showSlide`-based decks), and writes one PNG per slide at 1366×768 and 1440×900 into `test_scripts/screenshots/`. Then **read each PNG** and inspect for clipping, overflow, element overlap, missing logo/photos, and brand alignment. If no browser is found it exits cleanly (code 3) — on a headless host rely on the `verify-deck.mjs --strict` gate instead.

`<skill-root>` is the directory containing this `SKILL.md`. See `scripts/README.md`.

### Pre-delivery check

Before delivering HTML, verify: (a) every `<img>`/`background-image` value starts with `data:image/` — grep the file and confirm there are **zero** `file://`, absolute, or relative image paths; and (b) a real NBG lockup image (not a text/CSS placeholder) appears wherever a logo is expected. The fastest way to perform both checks is to run `scripts/verify-deck.mjs <deck>.html --strict` (above), which works even on a headless host with no browser.

## In-deck right-click menu (text editing, shape resizing & PDF export)

Every delivered HTML deck carries a self-contained right-click menu, inlined by `scripts/add-deck-menu.mjs` (NBG-styled: white panel, teal accent rule, Aptos stack; Escape or a click outside closes it; right-clicking a link or form field keeps the browser's native menu). It adds ~44 KB and lives outside the slides, so it — and the shape selection frame — never appears in the slide area of screenshots, in PDFs, or in the print layout.

- **Edit text** — offered when the right-click landed on text; **double-clicking any text on a slide does the same**. The element (the whole text block, so accent spans inside a title stay intact) becomes editable in place with a teal outline: typing, Backspace, Shift+Enter for a line break, Ctrl/Cmd+Z; **Enter or a click outside applies, Esc cancels**. The slide's CSS is never touched: formatting shortcuts are blocked, paste and drop insert plain text, and anything the browser wraps around typed text is unwrapped when the edit is applied. Deck keyboard shortcuts (arrows, space) are suppressed while editing.
- **Resize / move shape** — offered for the card, photo panel, image, decorative block or text block under the pointer (the hint names it with its size). A teal selection frame with eight handles appears: drag a handle to resize (Shift keeps the proportions), drag inside to move, arrow keys nudge by 1 px (Shift 10 px), Alt+arrows resize, Tab selects the enclosing shape, Esc/Enter/click outside finishes. Elements in normal flow get only the east/south/corner handles (they grow right and down). Only the element's inline geometry changes (`left/top/width/height`, plus `position:relative` for a moved flow element); pointer deltas are divided by the slide's current scale, so coordinates stay exact artboard pixels at any viewport size. **Reset shape** restores one element's original geometry.
- **Edits persist** in the browser's storage (keyed by the file) so a reload keeps them until they are saved or discarded. They live only in that browser: the file on disk is unchanged until the viewer saves a copy.
- **Save edited copy** — downloads `<name>-edited.html`: the edits applied to a pristine snapshot of the deck taken at load, so the copy loads exactly like the original, stays fully self-contained and carries the menu itself. **Discard edits** restores every original text.
- **Export to PDF** — see "PDF output → Export from the in-deck menu".

Rules for the agent:

- Run `add-deck-menu.mjs` after `embed-assets.mjs` and before `verify-deck.mjs --strict` (which requires the menu unless `--no-deck-menu` is passed because the user declined it). Re-running upgrades an older block.
- The menu edits **text and geometry only** (what a viewer can fix on the spot: a word, a card that should be wider, a photo panel nudged). Colours, typography, images, new elements and structure stay the skill's job; if the user wants those changed, regenerate the deck. Shape changes are per element and do not re-flow neighbours: a viewer who widens one card in a row must move the next one too, and the overlap rules of this skill still apply to the result.
- The CLI exporter prints the file on disk, not a viewer's unsaved edits. To deliver a PDF of an edited deck, export the saved `-edited.html` copy.
- When handing over a deck, tell the user in one line: double-click any text to edit it (Enter applies, Esc cancels); right-click for *Resize / move shape*, *Export to PDF* and *Save edited copy*.

## PDF output (export from the HTML deck)

A PDF deliverable is **always derived from the finished, verified HTML deck** — never authored separately, never re-laid-out for paper, and never assembled from screenshots. The bundled exporter prints the deck with the browser engine so the PDF is the deck: same 1920×1080 artboard per page, same palette, typography, spacing, logos and photography, with vector (selectable) text.

### Workflow

1. Build and verify the HTML deck exactly as for HTML output (author with tokens → `embed-assets.mjs` → `verify-deck.mjs --strict` → visual check). The PDF inherits every defect of the HTML, so the HTML gate is a precondition, not an option.
2. Export:
   `node "<skill-root>/scripts/export-pdf.mjs" <deck>.html [-o <deck>.pdf]`
   The script opens the deck in headless Chrome/Chromium/Edge (auto-detected; `--browser <path>` or `NBG_BROWSER` / `CHROME_BIN` to override), lifts the deck's navigation and viewport-scaling layer without touching any slide's own CSS, makes every top-level `.slide` visible in flow, settles fonts/images/animations, and prints one page per slide at the slide's own box (20 × 11.25 in for the 1920×1080 artboard, zero margins, backgrounds forced). It then verifies that the PDF page count equals the slide count and exits non-zero on any mismatch.
3. Inspect: rasterise a few pages (`pdftoppm -r 72 -png <deck>.pdf <prefix>` when poppler is available, otherwise open the PDF) and **read them** next to the browser screenshots. Cover, one divider, one dense content slide and the last slide are the minimum set. Anything that differs from the HTML render — a missing background, an animation stuck at its start state, a clipped card, a re-flowed line — is a defect to fix in the deck, then re-export.
4. Deliver the PDF together with the HTML it was exported from (unless the user explicitly wants only the PDF) and report the exporter output line (slides / pages / page box).

### Export from the in-deck menu

Viewers of the HTML deck get the same export without any tooling: the in-deck menu's **Export to PDF** applies the very same print-layout code the CLI exporter uses (`scripts/lib/print-layout.js`, inlined), opens the browser's print dialog, and restores the interactive deck when the dialog closes. In the dialog the viewer picks **Save as PDF** (Chrome / Edge); paper size (1920×1080), zero margins and background printing are preset by the page, so the result is one page per slide, identical to the CLI export. Ctrl/Cmd+P and the browser's own Print command go through the same prepare/restore hooks. See "In-deck right-click menu". The agent-produced PDF deliverable is still made with `scripts/export-pdf.mjs` (deterministic, verified page count); the menu is for the people who receive the HTML.

### Rules

- **Aesthetics are frozen.** Do not add print stylesheets, change slide sizes, fonts, colours or copy "to make it print". If the exporter reports a slide box that differs from the page box, or more pages than slides, the deck's slide sizing/overflow is the bug — fix it in the HTML and re-export.
- **Do not fake it.** No `window.print()` at Letter/A4 size, no browser "Save as PDF" with headers/footers and margins, no PowerPoint/Word round-trips, no stitched screenshots. Only `scripts/export-pdf.mjs` (or the identical DevTools `Page.printToPDF` settings it uses) produces a compliant PDF.
- **Every top-level slide must carry the `slide` class** (the exporter and the screenshot helper both key on it; use `--selector` only for a deck you did not author). Nested helper classes such as `slide-title` / `slide-footer` are fine.
- **Fonts come from the exporting host.** The PDF embeds exactly the faces the browser resolved for the deck's font stack (`Aptos` → system fallback when Aptos is absent), so PDF and screenshots always agree with each other. If the deliverable must show Aptos, export on a host where Aptos is installed; do not swap the font stack in the deck.
- **Headless host with no browser:** the exporter exits with code 3. Deliver the verified HTML, state plainly that the PDF could not be produced on this host, and give the one-line command to run where a browser exists. Never substitute a differently produced PDF.
- The exporter must never be used to print a deck that fails `verify-deck.mjs --strict`.

`<skill-root>` is the directory containing this `SKILL.md`. See `scripts/README.md` for the flags.

## HTML-to-PowerPoint conversion guardrails

When asked to convert an HTML page, HTML slide, or HTML presentation page into PowerPoint:

- Recreate the slide/deck with native editable PowerPoint objects: shapes, text boxes, fonts, fills, borders, rounded rectangles, lines, charts, icons, and layout objects.
- Do **not** capture the HTML and use it as a full-slide screenshot or background image.
- Do **not** use a large rasterized content region to flatten text or major slide content.
- Use images only when they are discrete source/design assets, such as logos or intentional photography.
- Preserve continuous paragraphs, headlines, labels, recommendations, and copy blocks as continuous editable PowerPoint text boxes with natural wrapping.
- Preserve explicit/source-intended manual line breaks only where they are semantically present in the HTML.
- Visually compare the generated PowerPoint rendering against the rendered HTML reference and revise obvious mismatches before delivery.

## Bundled files

Scripts (zero-dependency Node, see `scripts/README.md`):

- `scripts/embed-assets.mjs` — deterministic `{{TOKEN}}` → data-URI embedding.
- `scripts/verify-deck.mjs` — browser-free pre-delivery gate (mandatory, `--strict`).
- `scripts/screenshot-deck.mjs` — per-slide PNGs at the required viewports (needs a browser).
- `scripts/export-pdf.mjs` — HTML deck → PDF, one page per slide, aesthetics preserved (needs a browser).
- `scripts/add-deck-menu.mjs` — inlines the right-click deck menu (Edit text / Export to PDF / Save edited copy) into a deck (idempotent; `--remove` strips it).
- `scripts/lib/find-browser.mjs` — shared Chrome/Chromium/Edge locator.
- `scripts/lib/cdp.mjs` — shared DevTools-protocol client (launch, navigate, evaluate, print).
- `scripts/lib/print-layout.js` — the print-layout shim shared by the exporter and the in-deck menu (browser JS).
- `scripts/lib/deck-menu.js` — the in-deck menu: UI, in-place text editing, shape resize/move, persistence, saved copy, print orchestration (browser JS, inlined by `add-deck-menu.mjs`).

Core configuration and references:

- `config/pi-agent-nbg-design.yaml`
- `references/project-design.md`
- `references/project-functions.MD`
- `references/configuration-guide.md`
- `references/issues-pending-items.md`

Design-system files:

- `NBG-Design/NBG Design System.html`
- `NBG-Design/slide-templates.jsx`
- `NBG-Design/tweaks-panel.jsx`
- `NBG-Design/uploads/Powerpoint - Version 1.0_EN.pptx`

Assets:

- `NBG-Design/assets/logo-primary.png` (+ `logo-primary.datauri.txt` — base64 data URI for HTML embedding)
- `NBG-Design/assets/logo-knockout.png` (+ `logo-knockout.datauri.txt` — base64 data URI for HTML embedding)
- `NBG-Design/assets/logo-small.png` (+ `logo-small.datauri.txt` — base64 data URI for HTML embedding)
- `NBG-Design/assets/photo-fields.jpeg` (+ `photo-fields.datauri.txt`)
- `NBG-Design/assets/photo-heart.jpeg` (+ `photo-heart.datauri.txt`)
- `NBG-Design/assets/photo-parthenon.jpeg` (+ `photo-parthenon.datauri.txt`)
- `NBG-Design/assets/photo-skate.jpeg` (+ `photo-skate.datauri.txt`)
- `NBG-Design/assets/photo-street.jpeg` (+ `photo-street.datauri.txt`)
- All `*.datauri.txt` files hold the ready-to-embed base64 data URI for the matching image (see "Image embedding (MANDATORY)").

Presentation screenshots:

- `NBG-Design/screenshots/01-editorial.png`
- `NBG-Design/screenshots/01b-editorial-prog.png`
- `NBG-Design/screenshots/01c-editorial-end.png`
- `NBG-Design/screenshots/02-bold.png`
- `NBG-Design/screenshots/03-report.png`
- `NBG-Design/screenshots/03b-report-mid.png`
- `NBG-Design/screenshots/03c-report-learn.png`
- `NBG-Design/screenshots/03d-report-end.png`

## Excluded by default

Do not use or expect these adjacent project artifacts unless the user explicitly requests them:

- newsletter/email prototype folders;
- `NBG-Design/nbg-gpt/`;
- `NBG-Design/newsletter/`;
- `NBG-Design/notebooklm/`;
- email/GPT/NotebookLM/training screenshots;
- generated presentation deliverables from the original project;
- test artifacts from the original project;
- secrets, credentials, tokens, virtual environments, caches, generated bytecode, or version-control metadata.

## Quality checklist

Before delivering NBG slide work:

- For HTML output, run `node "<skill-root>/scripts/verify-deck.mjs" <deck>.html --strict` and confirm it passes. This is mandatory and works on a headless host. Never report a deck complete while it fails. (Embed assets with `scripts/embed-assets.mjs` first; see "Deterministic embedding & verification".)
- For HTML output, confirm the right-click deck menu was added with `scripts/add-deck-menu.mjs` (the strict gate checks for it and warns when the block is older than the skill's) and tell the user how to use it (double-click to edit text; right-click for Resize / move shape, Export to PDF, Save edited copy), unless the user declined it.
- Confirm every slide has a clear purpose.
- Confirm colors match the bundled NBG palette.
- Confirm the language is consistent with the request or the approved English default.
- Confirm the output format is consistent with the request or the approved HTML default.
- Confirm NBG logo visibility and placement match the intended template.
- For HTML output, confirm the full slide fits the viewport without clipping or unintended scrolling.
- For HTML output, confirm rendered screenshots show no unintended overlaps among cards, text blocks, decorative shapes, logos, grouped rows/columns, footers, or page numbers.
- If any overlap is found during visual verification, revise the layout and repeat the screenshot inspection before delivery; do not report the deck as complete while a collision remains.
- For PowerPoint output, confirm native editability and absence of full-slide screenshot embedding.
- For PDF output, confirm the source HTML passed `verify-deck.mjs --strict`, that `scripts/export-pdf.mjs` reported `RESULT: PASS` (pages = slides, page box = the slide box, normally 1920x1080), and that rasterised pages were read and match the browser render (backgrounds, photography, logo, typography, no clipping). Deliver the PDF with its source HTML.
- Report the files/resources inspected and any visual verification artifacts used.
