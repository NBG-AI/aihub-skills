---
name: nbg-design
description: Use when creating National Bank of Greece (NBG) styled presentations, HTML slides, slide specifications, or editable PowerPoint recreations using the bundled NBG Presentation Design System, templates, logos, photography, screenshots, and guardrails.
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
3. **Verify before delivery (browser-free — works headless).**
   `node "<skill-root>/scripts/verify-deck.mjs" <deck>.html --strict`
   It exits non-zero if any image is not a `data:` URI, if forbidden `file://`/absolute/relative paths remain, if tokens are unresolved, or (in `--strict`) if the deck is suspiciously small / photo-less or contains bare `NBG`/`NPG` text that may be a logo substitute. **Never deliver a deck that fails this gate.**
4. **If the skill was moved to another machine**, confirm the **whole** skill folder travelled, including `NBG-Design/assets/` (the `*.datauri.txt` files). If `embed-assets.mjs` reports a missing assets directory, that is the root cause — copy the full skill, not just `SKILL.md`.

5. **Optional visual check when a browser exists.** On a host with Chrome/Chromium/Edge, also capture screenshots:
   `node "<skill-root>/scripts/screenshot-deck.mjs" <deck>.html`
   It auto-detects a browser, navigates each slide (works for both hash-based and `showSlide`-based decks), and writes one PNG per slide at 1366×768 and 1440×900 into `test_scripts/screenshots/`. Then **read each PNG** and inspect for clipping, overflow, element overlap, missing logo/photos, and brand alignment. If no browser is found it exits cleanly (code 3) — on a headless host rely on the `verify-deck.mjs --strict` gate instead.

`<skill-root>` is the directory containing this `SKILL.md`. See `scripts/README.md`.

### Pre-delivery check

Before delivering HTML, verify: (a) every `<img>`/`background-image` value starts with `data:image/` — grep the file and confirm there are **zero** `file://`, absolute, or relative image paths; and (b) a real NBG lockup image (not a text/CSS placeholder) appears wherever a logo is expected. The fastest way to perform both checks is to run `scripts/verify-deck.mjs <deck>.html --strict` (above), which works even on a headless host with no browser.

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
- Confirm every slide has a clear purpose.
- Confirm colors match the bundled NBG palette.
- Confirm the language is consistent with the request or the approved English default.
- Confirm the output format is consistent with the request or the approved HTML default.
- Confirm NBG logo visibility and placement match the intended template.
- For HTML output, confirm the full slide fits the viewport without clipping or unintended scrolling.
- For HTML output, confirm rendered screenshots show no unintended overlaps among cards, text blocks, decorative shapes, logos, grouped rows/columns, footers, or page numbers.
- If any overlap is found during visual verification, revise the layout and repeat the screenshot inspection before delivery; do not report the deck as complete while a collision remains.
- For PowerPoint output, confirm native editability and absence of full-slide screenshot embedding.
- Report the files/resources inspected and any visual verification artifacts used.
