# Project Design

## Overview
This project contains the local NBG presentation design-system assets and supporting configuration artifacts for using Pi Agent to create NBG-styled presentations.

## Current Design Decisions

### Pi Agent NBG presentation context config
- Decision: Store the presentation-generation context bundle at `config/pi-agent-nbg-design.yaml`.
- Rationale: The codebase scan found no existing project config convention and recommended a new root-level `config/` directory for runtime configuration. Pi Agent native settings are JSON, so the YAML is explicitly treated as a context file passed to Pi via `@config/pi-agent-nbg-design.yaml`.
- Source evidence:
  - Refined request: `docs/reference/refined-request-pi-agent-nbg-design-yaml-config.md`
  - Codebase scan: `docs/reference/codebase-scan-pi-agent-nbg-design-yaml-config.md`
- Design-system source: `NBG-Design/`
- Primary presentation files:
  - `NBG-Design/NBG Design System.html`
  - `NBG-Design/slide-templates.jsx`
  - `NBG-Design/assets/`

### Portable deterministic Pi context configuration
- Decision: Keep `config/pi-agent-nbg-design.yaml` as the single shared Pi context file, but make all project-internal paths repository-root-relative and remove machine-specific checkout roots from shared runtime/setup configuration.
- Rationale: The portability investigation found that the current project is a lightweight design-system/context artifact repository, not a packaged application. A repository-relative config model plus deterministic setup documentation fixes the known local-folder coupling without introducing unnecessary package, container, or local override systems.
- Path semantics: Pi `@file` relative paths resolve against the shell current working directory. Deterministic usage therefore requires running Pi commands from the repository root, or a future wrapper that changes to the repository root before invoking Pi.
- Runtime boundary: The YAML is included as prompt/context text. Pi does not parse it as native settings, expand variables, or automatically read nested file references listed inside it.
- Setup guide: `docs/design/configuration-guide.md` documents prerequisites, configuration source priority, required values, path-resolution rules, validation checks, and the portable Pi command.
- Source evidence:
  - Refined request: `docs/reference/refined-request-portable-deterministic-config.md`
  - Investigation: `docs/reference/investigation-portable-deterministic-config.md`
  - Technical research: `docs/research/pi-agent-file-context-path-resolution.md`
  - Codebase scan: `docs/reference/codebase-scan-portable-deterministic-config.md`
  - Plan: `docs/design/plan-004-portable-deterministic-config.md`
- Boundaries: This portability work does not modify `NBG-Design/**`, generated `presentations/**`, global Pi settings, cloud/container infrastructure, or version-control state.

### Sofia Voice Agent automation presentation page
- Decision: Add a standalone one-page HTML presentation artifact at `presentations/sofia-voice-agent-automation-areas.html` rather than overwriting the existing English multi-slide Voice Agent deck.
- Rationale: The request asks for a single Greek presentation page. The codebase scan found related English multi-slide artifacts under `presentations/`, so the new page extends/localizes/compresses that work while preserving the existing generated deck.
- Design approach: Use a 1920×1080 internal artboard, NBG teal-led palette, local NBG knockout logo, stat-led left accent panel, grouped volume bars, and a concise wave-based automation recommendation.
- Sizing correction: The HTML page uses a viewport-sized frame plus JavaScript based on `visualViewport`/`innerWidth` and `innerHeight` to scale and center the fixed artboard, so the complete 16:9 slide remains visible within common browser viewport boundaries without relying on the unscaled transform layout box for page height.
- Source evidence:
  - Refined request: `docs/reference/refined-request-voice-agent-automation-presentation.md`
  - Sizing refined request: `docs/reference/refined-request-presentation-page-sizing-config.md`
  - Codebase scan: `docs/reference/codebase-scan-voice-agent-automation-presentation.md`
  - Creation plan: `docs/design/plan-002-sofia-voice-agent-automation-presentation.md`
  - Sizing fix plan: `docs/design/plan-003-presentation-page-sizing-config.md`
- Boundaries: `NBG-Design/` source files remain unchanged for this deliverable.

### Native PowerPoint recreation for Sofia automation areas
- Decision: Maintain `presentations/sofia-voice-agent-automation-areas.pptx` as a native-shape single-slide PowerPoint recreation of `presentations/sofia-voice-agent-automation-areas.html`, not as a full-slide screenshot.
- Rationale: The refined request requires editable PowerPoint shapes, text, fonts, and layout objects. Native OpenXML generation preserves PowerPoint editability while allowing the NBG logo to remain a discrete image asset. Continuous copy blocks are kept as single editable text blocks with natural wrapping instead of being decomposed into one text box per rendered line.
- Current implementation approach: `test_scripts/create_sofia_native_pptx.py` is a replacement declarative scene-based generator. It defines reusable native OpenXML layers for fills, outlines, shapes, lines, text boxes, images, and paragraphs, then maps the source HTML's 1920×1080 composition into one widescreen PowerPoint slide. It embeds only `NBG-Design/assets/logo-knockout.png` and preserves manual line breaks only where they are source-intended in the HTML title/dataset label.
- Font/rendering note: The source design uses Aptos with system fallback. The replacement PPTX pins Arial because local Quick Look verification rendered Greek Aptos as a serif fallback; Arial better preserves the HTML's sans-serif fallback appearance in the available verification renderer.
- Verification: `docs/reference/powerpoint-visual-verification-sofia-html-to-single-slide-native-powerpoint.md` records the replacement package checks, required numeric-value checks, native-object checks, and visual inspection of the Quick Look render at `test_scripts/screenshots/sofia-replacement-ql/sofia-voice-agent-automation-areas.pptx.png` against `test_scripts/screenshots/sofia-replacement-html-1920x1080.png`.
- Source evidence:
  - Refined request: `docs/reference/refined-request-sofia-html-to-single-slide-native-powerpoint.md`
  - Codebase scan: `docs/reference/codebase-scan-sofia-html-to-single-slide-native-powerpoint.md`
  - Replacement plan: `docs/design/plan-006-replace-sofia-native-pptx-generator.md`
  - Current verification: `docs/reference/powerpoint-visual-verification-sofia-html-to-single-slide-native-powerpoint.md`
  - Prior verification: `docs/reference/powerpoint-visual-verification-sofia-voice-agent-automation-areas.md`
- Boundaries: The generator does not modify `NBG-Design/` source assets and does not use a full-slide browser capture as the PowerPoint slide content.

### HTML-to-PowerPoint native recreation guardrail
- Decision: `config/pi-agent-nbg-design.yaml` now includes `presentation_generation_rules.html_to_powerpoint_conversion` guidance for future HTML-to-PowerPoint conversion requests.
- Rationale: HTML-to-PowerPoint conversions must preserve editability and brand fidelity by recreating rendered HTML with native PowerPoint shapes, text boxes, fonts, fills, borders, charts, and layout objects rather than capturing the HTML as a flattened image.
- Required pattern: Use the rendered HTML page as the visual reference, inspect the HTML source for exact content/tokens, map the slide to a widescreen PowerPoint artboard, use only discrete source assets as images, and preserve continuous copy blocks as continuous editable text boxes with natural PowerPoint wrapping.
- Quality checks: Future conversions must inspect the generated PowerPoint render against the rendered HTML reference, verify that no full-slide or major-content screenshot was embedded, verify continuous text blocks were not split into per-line text objects, and revise obvious visual mismatches before delivery.
- Source evidence:
  - User instruction: 2026-06-05 config update request for HTML-to-PowerPoint native recreation and continuous text preservation.

### HTML presentation overlap-protection guardrail
- Decision: `SKILL.md` and `config/pi-agent-nbg-design.yaml` now require generated NBG HTML presentations to protect against unintended internal element overlaps, not only viewport overflow.
- Rationale: The regression deck `agentic-engineering-nbg-executive-presentation.html` showed that a slide can fit the browser viewport while still having collisions inside the 1920×1080 artboard. Slide 2 overlapped a board-level implication card with the bottom three-card row; slide 3 overlapped the top card row with lower question cards.
- Required pattern: Reserve separate zones for title/header, body content, card rows/grids, bottom callouts, footer/logo, and page-number elements; keep clear spacing between content groups; verify absolute-positioned row/callout bounding boxes before finalizing.
- Remediation pattern: If content cannot fit safely, reduce copy, simplify or resize components, change the grid structure, or split content across slides. Do not hide overflow or layer opaque elements over content to mask a collision.
- Quality checks: Future HTML outputs must inspect screenshots at 1366×768 and 1440×900 for card-to-card, callout-to-card, shape-to-content, logo/footer-to-content, and page-number collisions; any overlap requires layout revision and repeated screenshot validation before delivery.
- Source evidence:
  - Refined request: `/Users/giorgosmarinos/contentwork/temp/docs/reference/refined-request-nbg-design-overlap-protection.md`
  - Codebase scan: `/Users/giorgosmarinos/contentwork/temp/docs/reference/codebase-scan-nbg-design-overlap-protection.md`
  - Issue/solution record: `/Users/giorgosmarinos/contentwork/temp/docs/reference/nbg-design-overlap-protection-issue-solution.md`

### HTML presentation viewport-fit guardrail
- Decision: `config/pi-agent-nbg-design.yaml` now includes `presentation_generation_rules.html_output_layout` guidance for HTML outputs.
- Rationale: Generated HTML presentation pages must preserve the NBG 1920×1080 / 16:9 composition without exceeding screen boundaries in normal browser viewing.
- Required pattern: Wrap the fixed-size slide in a viewport-sized or exact-scaled frame, scale the 1920×1080 slide to the available viewport, center it with translate offsets, and prevent unintended artboard-driven overflow. When transform scaling is used, do not let the unscaled 1080px layout box determine page height.
- Quality checks: Future HTML outputs must verify complete slide visibility and lack of unintended horizontal/vertical overflow at common desktop/laptop viewport sizes including 1366×768 and 1440×900. Verification must include rendered browser screenshots saved under `test_scripts/screenshots/` and visually inspected before delivery; code review or sizing arithmetic alone is not sufficient.
- Source evidence:
  - Refined request: `docs/reference/refined-request-presentation-page-sizing-config.md`
  - Plan: `docs/design/plan-003-presentation-page-sizing-config.md`

### Voice Agent call categories opportunity slide
- Decision: Add a new English, single-slide NBG presentation deliverable at `presentations/voice-agent-call-categories-slide.html` and a native editable PowerPoint recreation at `presentations/voice-agent-call-categories-slide.pptx`.
- Rationale: The refined request asks for an executive slide that communicates the voice-agent opportunity from 25,000 daily calls. The codebase scan found that the exact slide did not already exist, but an adjacent Sofia HTML/native-PPTX workflow provides the correct implementation pattern.
- Content approach: The slide avoids claiming “10 categories” because the supplied source lists 9 category rows that sum to 100%. It presents the data as classified major categories and adds a transparent note about the 9-row source list.
- Design approach: The HTML uses a 1920×1080 NBG artboard, deep-teal accent panel, cream content background, NBG knockout logo, stat-led narrative, category bars, and staged adoption cards. The viewport-fit script follows the `visualViewport`/`innerWidth` pattern required by `config/pi-agent-nbg-design.yaml`.
- PowerPoint approach: `test_scripts/create_voice_agent_call_categories_pptx.py` recreates the slide with native OpenXML shapes, editable text boxes, native bar elements, and only the discrete NBG logo image. It does not embed the HTML page or a full-slide screenshot.
- Verification: HTML screenshots were saved at `test_scripts/screenshots/voice-agent-call-categories-1366x768.png`, `test_scripts/screenshots/voice-agent-call-categories-1440x900.png`, and `test_scripts/screenshots/voice-agent-call-categories-html-1920x1080.png`. PPTX package/object and Quick Look render verification are documented in `docs/reference/powerpoint-visual-verification-voice-agent-call-categories-slide.md`.
- Source evidence:
  - Refined request: `docs/reference/refined-request-voice-agent-call-categories-slide.md`
  - Codebase scan: `docs/reference/codebase-scan-voice-agent-call-categories-slide.md`
  - Plan: `docs/design/plan-007-voice-agent-call-categories-slide.md`
  - Verification: `docs/reference/powerpoint-visual-verification-voice-agent-call-categories-slide.md`
- Boundaries: `NBG-Design/**` source assets/templates remain unchanged; existing Sofia deliverables remain unchanged.

### HTML deck PDF export (skill v1.3.0)
- Decision: A PDF deliverable is always **exported from the finished, verified HTML deck** by the bundled zero-dependency script `scripts/export-pdf.mjs`; it is never authored separately, re-laid-out for paper, or assembled from screenshots. `pdf` joins `html` (default) and `pptx` as an accepted output format.
- Rationale: The requirement is "converted to PDF without changes in aesthetics". Printing the deck with the same browser engine that renders it, at the slide's own box (1920×1080 px = 20 × 11.25 in, zero margins, backgrounds forced, scale 1), keeps typography, palette, spacing, logos and photography identical and leaves the text vector/selectable. Every other route (browser Save-as-PDF at A4/Letter with headers, `window.print()`, Office round-trips, stitched screenshots) re-flows or rasterises the design.
- Mechanism: Headless Chrome/Chromium/Edge is driven over the DevTools protocol through `--remote-debugging-pipe` (no npm dependency). A shim evaluated in the page lifts only the host layer — navigation toggles (`.active` / `.hidden` / inline `display` / `[hidden]`), viewport-fit wrappers (scaled `#deck` / `.slide-wrap`, fixed `#stage`, flex centering), non-slide chrome — makes every top-level `.slide` visible in flow, jumps animations/transitions to their end state, forces `print-color-adjust: exact`, waits for fonts/images, then calls `Page.printToPDF` with `printBackground`, `preferCSSPageSize`, page size = measured slide box. A slide's own CSS/size/copy is never touched; slides of another size are reported, not resized.
- Built-in gate: page count must equal slide count and every slide box must equal the page box; otherwise the exporter exits 1 (the PDF is still written for diagnosis). Exit 3 = no browser on the host → deliver the HTML and the one-line command to run elsewhere.
- Shared code: the browser locator moved to `scripts/lib/find-browser.mjs`, used by both `screenshot-deck.mjs` and `export-pdf.mjs`. `screenshot-deck.mjs` also gained a generic in-place slide isolation (works for `.hidden` toggles and stacked decks), an exact-token slide count, and injection before the last `</body>`.
- Verification (2026-09-03): three real decks produced with this skill (15, 11 and 17 slides; `.active`-toggle, stacked-scroll and `.hidden`-toggle hosts) exported with pages = slides; pdftoppm renders pixel-diffed against 1920×1080 browser screenshots show at most 0.16 % of pixels with a solid difference (anti-aliasing of text edges only). Record: `docs/nbg-design-docs/verification.md` in the development workspace.
- Configuration: `config/pi-agent-nbg-design.yaml` → `presentation_workflow.expected_agent_behavior` (PDF rules), `optional_user_inputs_with_defaults` (accepted formats), `presentation_generation_rules.pdf_export`, `visual_verification.required_for_output_formats` (+ `pdf`), `quality_checks`.

### In-deck right-click "Export to PDF" menu (skill v1.4.0)
- Decision: Every delivered HTML deck carries a self-contained right-click menu whose **Export to PDF** item produces the same one-page-per-slide PDF as `scripts/export-pdf.mjs`, for viewers who have only the HTML and a browser. `scripts/add-pdf-menu.mjs` inlines it; `verify-deck.mjs --strict` requires it (`--no-pdf-menu` only when the user declined it).
- Rationale: A delivered deck runs standalone from `file://` with no Node available. The browser's own print engine is the only PDF producer there, so the deck must prepare its own print layout — and it must be the *same* layout the CLI produces, or the two PDFs would differ.
- Mechanism: The print-layout shim moved to `scripts/lib/print-layout.js` (plain browser JS) and gained a registry so `nbgRestorePrintLayout()` can undo every class/inline-style/attribute change and re-dispatch `resize` for the deck's viewport-fit code. `scripts/lib/pdf-menu.js` adds the menu (contextmenu → NBG-styled panel; Escape/outside click closes; links/form fields keep the native menu), and around `window.print()` it runs prepare → print → restore. `beforeprint`/`afterprint` hooks make Ctrl/Cmd+P and the browser's Print command faithful too; Chrome fires the same events around DevTools `Page.printToPDF`, so a driver that manages the layout itself (the CLI exporter) sets `window.__nbgPdfExternal = true` to keep the hooks idle. The injected block's id (`nbg-pdf-menu-script`) deliberately differs from the runtime menu element (`nbg-pdf-menu`).
- What the viewer does: right-click → *Export to PDF* → the print dialog opens with the page's `@page { size: 1920px 1080px; margin: 0 }` → choose *Save as PDF* (Chrome/Edge). Backgrounds are forced by `print-color-adjust: exact`; zero margins suppress browser headers/footers.
- Shared code: `scripts/lib/cdp.mjs` (DevTools client: launch, open page, navigate, evaluate, print, count pages) is used by `export-pdf.mjs` and by the development round-trip test.
- Verification (2026-09-03): on the three real decks, the native print path (no driver preparation, hooks only) yields pages = slides, the DOM (`outerHTML`) and computed transforms are byte-identical after the round-trip, and the PDFs pixel-match the browser renders exactly like the CLI export (≤ 0.16 % solid difference). `docs/nbg-design-docs/verification.md` in the development workspace.

### In-deck text editing and "Save edited copy" (skill v1.5.0)
- Decision: The in-deck menu (renamed `scripts/add-deck-menu.mjs` / `scripts/lib/deck-menu.js`, block id `nbg-deck-menu-script`) lets viewers edit any text on a slide in place — double-click, or right-click → *Edit text* — keep the edits across reloads, download the deck with them applied (*Save edited copy*), or drop them (*Discard edits*). Layout, images, colours and structure are deliberately not editable.
- Rationale: A standalone `file://` deck cannot write to itself, so "edit in place" needs three parts: an editing surface that cannot damage the design, a memory that survives a reload, and a way to hand the result back as a file. Text-only editing keeps the NBG design system intact; the saved copy is the deliverable path.
- Editing surface: the whole text block (inline accent spans inside a title stay intact) becomes `contenteditable="true"` — not `plaintext-only`, whose UA `white-space: pre-wrap` re-flowed titles while editing. Formatting commands, rich paste and drops are blocked in `beforeinput` (paste inserts plain text); Enter applies, Esc cancels, Shift+Enter inserts `<br>`; original descendants are tagged during the edit and every element the browser wraps around typed text is unwrapped on commit, so the committed markup is the original inline markup plus text. Deck shortcuts are suppressed while editing.
- Persistence: edits are `{ path, original, html }` (child-index path from the root) in `localStorage` under `nbg-deck-edits:<pathname>#<title>`; re-applied on load, entries whose original no longer matches are dropped.
- Saved copy: a pristine `outerHTML` snapshot is taken when the inlined script runs (after the deck's own scripts, before any runtime element of ours and before stored edits are re-applied); `DOMParser` applies the edits by path (unique-markup fallback) and the result downloads as `<name>-edited.html` — still self-contained, still carrying the menu, loading exactly like the original.
- Boundaries: the CLI exporter prints the file on disk; a PDF of an edited deck is made from the saved copy. `verify-deck.mjs --strict` requires the v2 block (`--no-deck-menu` only when the user declined it) and warns on the v1.4 PDF-only block, which `add-deck-menu.mjs` upgrades in place.
- Verification (2026-09-03): on the three real decks, `test_scripts/deck-menu-roundtrip.mjs` covers double-click editing, shortcut suppression, blocked formatting, wrapper clean-up, Enter/Esc, persistence across reload, the saved copy (passes `verify-deck.mjs --strict` and `export-pdf.mjs`, edit visible on page 1), discard, and both PDF paths with DOM/transform identity after restore. `docs/nbg-design-docs/verification.md` in the development workspace.

### In-deck shape resizing and moving (skill v1.6.0)
- Decision: The in-deck menu gains *Resize / move shape*: a selection frame with eight handles on the card, photo panel, image, decorative block or text block under the pointer. Drag handles to resize (Shift keeps proportions), drag inside to move, arrows nudge (Shift 10 px), Alt+arrows resize, Tab selects the enclosing shape, Esc/Enter/click outside finishes; *Reset shape* restores one element. Edits are `{ path, kind: 'style', original, value }` records — the same persistence, *Save edited copy* and *Discard edits* as text edits.
- Rationale: A viewer who can fix a word should also be able to fix a card that is too narrow or a photo panel that needs nudging, without asking for a regeneration. Restricting the change to inline geometry keeps the design system's colours, typography and structure intact and keeps every change reversible.
- Mechanism: "shape" = positioned element, or one with a background, border or shadow, or an image; otherwise the text block. Pointer deltas are divided by the slide's current scale (`getBoundingClientRect().width / offsetWidth`) so the artboard coordinates are exact at any viewport size. Resizing a positioned element first pins its top-left corner (`left/top` explicit, `right/bottom: auto`) — otherwise a right/bottom-anchored element slides when its size changes — then writes `width/height` in the element's own `box-sizing`. Flow elements get only the east/south/corner handles; moving one sets `position: relative` offsets. The frame (`#nbg-shape-box`) is a fixed-position overlay outside the slides, so the print layout hides it; `prepare()` deselects before printing.
- Gate: `verify-deck.mjs --strict` now also warns when the deck's block is older than the version the skill ships (read from `scripts/lib/deck-menu.js`), so re-delivered decks get the current menu.
- Verification (2026-09-03): `test_scripts/deck-menu-roundtrip.mjs` on the three real decks — selection frame with eight handles on the cover photo panel; south-east drag at a 0.71 scale grows the box by exactly the scaled delta with the position unchanged; drag inside moves it; north-west drag keeps the opposite corner; arrow/Shift/Alt nudges; Reset; persistence across reload; saved copy carries the inline geometry; both PDF paths unchanged. One sample deck (`nbg-design-skill-guide-deck.html`) mis-fits a 1366×768 viewport (it centres the unscaled box — the very pattern the skill forbids), so the test uses the full artboard for it.

### In-deck text formatting toolbar (skill v1.7.0)
- Decision: While a text element is being edited, a toolbar floats above it: Bold / Italic / Underline / Strikethrough, A− / A+ and an exact px size, font family, text colour, alignment, Clear, Done. A selected run gets semantic `<b>/<i>/<u>/<s>` tags (Chrome's `execCommand` with `styleWithCSS` off; an "un-bold inside a bold block" arrives as a `<span style="font-weight: normal">` and is kept when its style holds only weight/style/decoration); with no selection the whole block toggles via inline style. Size, family, colour and alignment are always block-level inline style.
- Brand guardrails: font families are limited to the design system's stacks (Aptos, Inter, Helvetica, Arial, Georgia, Times New Roman, Courier New, Default) and colours to the NBG palette (deep teal, teal, bright cyan, electric cyan, black, grey, cream, white, Default). A viewer can emphasise and resize text but cannot leave the palette or bring in arbitrary fonts.
- Mechanism: block formatting edits the element's `style` attribute and is recorded as a `style` edit next to the `html` edit (same records as shape geometry — one `style` record per element, first original kept); Esc restores both. *Clear* returns the block to the inline style it had before any formatting (this session's or an earlier saved one) and removes the selection's tags — it never strips the design's own inline properties. A first font-size change also sets a unitless `line-height` equal to the current ratio when the design fixed line-height in px, so enlarged text does not overlap. `pointerdown` on the toolbar is default-prevented so the editable keeps focus and selection; the size field and family select save/restore the selection around their own focus; the live selection is authoritative whenever the editable is focused. Shortcuts: Ctrl/Cmd+B/I/U (collapsed caret → whole block), Ctrl/Cmd+Shift+> / <.
- Verification (2026-09-03): `test_scripts/deck-menu-roundtrip.mjs` on the three real decks — toolbar appears; clicking it keeps the session; bold on a selection wraps the run (v3's already-bold title gets the un-bold span, kept on commit); italic/A+/Ctrl+Shift+>/exact 40 px/Georgia/bright cyan/centre/underline as inline style; toolbar state reflects it; Clear returns to the authored style; Enter records `html` + `style`; Esc restores both; persistence across reload; saved copy carries the formatting; discard restores. Defects found and fixed on the way: Clear stripped the authored `font-size`; a stale saved selection overrode the live one; un-bold spans were unwrapped.

## Configuration Policy
- Secrets, API keys, tokens, and expiring credentials must not be stored in project YAML files.
- Missing required presentation inputs must be surfaced to the user; they must not be replaced with undocumented fallback values.
- The `NPG Design` wording from the original request is documented as a naming ambiguity; local implementation uses the available `NBG-Design/` folder.
