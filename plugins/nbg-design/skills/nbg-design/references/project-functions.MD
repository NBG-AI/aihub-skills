# Project Functions

## Pi Agent NBG Presentation Configuration

### Function
Provide a reusable YAML context/config bundle that Pi Agent can read before creating presentation content or slide specifications using the local NBG design system.

### Configuration File
- `config/pi-agent-nbg-design.yaml`

### Functional Requirements
- Reference the local `NBG-Design/` folder as the presentation design-system source.
- Reference the primary design-system host page, slide templates, assets, master deck, and presentation screenshots.
- Encode NBG presentation style principles, color tokens, supported languages, and template catalog.
- Instruct Pi Agent to inspect the design-system files before generating slides.
- Exclude newsletter/email prototypes by default.
- Avoid hardcoded secrets or provider credentials.
- Avoid machine-specific project-root paths in shared runtime/setup configuration.
- Treat paths inside `config/pi-agent-nbg-design.yaml` as repository-root-relative.
- Require Pi commands that use relative `@config/...` file inclusion to run from the repository root.
- Validate required repository files before use on a new machine.
- Use explicit local browser executable paths only when screenshot automation is performed; do not rely on a committed browser fallback path.
- Require user clarification for missing deck-specific inputs instead of using fallbacks.

### How to Use
Run from the repository root because Pi resolves relative `@file` paths against the shell current working directory.

```bash
cd /path/to/nbg-theme-agent
pi @config/pi-agent-nbg-design.yaml "Create a presentation about <topic> using the NBG design system."
```

For one-shot outline/spec generation:

```bash
cd /path/to/nbg-theme-agent
pi -p @config/pi-agent-nbg-design.yaml "Create a presentation outline about <topic> using the NBG design system."
```

Notes:
- All paths in `config/pi-agent-nbg-design.yaml` are repository-root-relative.
- Pi includes the YAML as context text; it does not automatically read nested YAML paths.
- Follow `docs/design/configuration-guide.md` when moving the project to another machine or checkout location.

## Sofia Voice Agent Automation Presentation Page

### Function
Provide a single Greek NBG-styled HTML presentation page that summarizes the top automation opportunity areas for Sofia's Voice Agent using the supplied top-10 call-category data.

### Presentation File
- `presentations/sofia-voice-agent-automation-areas.html`

### Functional Requirements
- Present the automation topic in Greek and explicitly mention Sofia's Voice Agent.
- Use a single 16:9 / 1920×1080 presentation page.
- Represent the supplied total of 13,090 top-10 calls accurately.
- Highlight card-related calls as the dominant automation opportunity: 10,116 calls / 77.3%.
- Show grouped opportunity areas for cards, digital banking, and account/restriction inquiries.
- Recommend a first automation wave focused on card lifecycle and Smart PIN/reset PIN, which together represent 7,053 calls / 53.9% of the top-10 volume.
- Preserve NBG presentation styling through the local logo, teal-led palette, calm content layout, and executive-friendly copy.
- Fit the complete slide within browser viewport boundaries while preserving the internal 1920×1080 / 16:9 composition.
- Keep NBG design-system source files unchanged.

## Voice Agent Call Categories Opportunity Slide

### Function
Provide a single English NBG-styled executive slide that communicates the voice-agent serviceable opportunity from 25,000 daily calls and the staged 2026 / Q1 2027 adoption target.

### Presentation Files
- HTML source of truth: `presentations/voice-agent-call-categories-slide.html`

### Functional Requirements
- Present the baseline of 25,000 total inbound calls per day.
- Show that 50% of total daily calls are classified into major categories, approximately 12,500 calls/day.
- Preserve the provided classified category distribution: 27%, 27%, 14%, 8%, 6%, 5%, 5%, 4%, and 4%.
- Explain that 60% of the classified subset is estimated to be voice-agent serviceable, approximately 7,500 calls/day or 30% of total daily call volume.
- Show the rollout target of 15% of total daily volume in 2026 and another 15% in Q1 2027.
- Keep final slide copy in English.
- Use the NBG 16:9 / 1920×1080 presentation design style with NBG logo and teal-led palette.
- Fit the HTML slide completely inside common browser viewports without unintended scrolling or clipping.
- Transparently handle the source ambiguity that says “10 categories” but lists 9 category rows by avoiding a misleading category count and adding a source note.

## HTML Presentation Overlap-Protection Guardrail

### Function
Define reusable configuration and skill rules that prevent generated NBG HTML presentation slides from containing unintended internal collisions between content elements.

### Configuration Files
- `SKILL.md`
- `config/pi-agent-nbg-design.yaml`

### Functional Requirements
- Preserve the 1920×1080 / 16:9 NBG artboard while reserving distinct zones for header/title, body content, card grids/rows, bottom callouts, footer/logo, and page-number elements.
- Prevent unintended overlaps between cards, text blocks, decorative shapes, logos, footer elements, page numbers, and grouped rows/columns.
- Allow overlap only when it is an explicit content-safe brand accent that does not obscure, crowd, or reduce readability of primary content.
- Keep at least 32px spacing between adjacent content groups and at least 72px footer clearance unless the bundled template defines a larger safe area.
- When using absolute positioning, check bounding boxes for independently positioned rows/callouts and ensure they have positive separation on the artboard.
- If content cannot fit safely, reduce copy, simplify or resize components, change the grid structure, or split material across additional slides.
- Do not solve overlap by hiding overflow, stacking opaque elements over content, or relying on z-index/source order to mask crowded composition.
- Require screenshot inspection at 1366×768 and 1440×900 to check for card-to-card, callout-to-card, shape-to-content, logo/footer-to-content, and page-number collisions.
- Treat any unintended overlap found during verification as a blocking defect requiring revision and repeated screenshot validation before delivery.
- Use `agentic-engineering-nbg-executive-presentation.html` slides 2 and 3 as regression examples of collisions to prevent.

## HTML Presentation Viewport-Fit Guardrail

### Function
Define reusable configuration rules that prevent generated HTML presentation pages from exceeding browser screen boundaries.

### Configuration File
- `config/pi-agent-nbg-design.yaml`

### Functional Requirements
- Preserve NBG's 1920×1080 / 16:9 slide composition for generated HTML presentation output.
- Render the complete slide inside the available browser viewport on common desktop and laptop screens.
- Use a viewport-fitting wrapper, aspect-ratio constraint, fixed-artboard scaling, or equivalent robust implementation.
- When fixed-artboard scaling uses CSS transforms, ensure the wrapper/frame height reflects the scaled slide or actual viewport height, not the unscaled 1080px artboard box.
- Prevent unintended horizontal or vertical overflow caused by the slide artboard itself.
- Verify future HTML outputs against common viewport sizes, including 1366×768 and 1440×900.
- Render screenshots for generated HTML slides at the required viewport sizes and visually inspect the actual screenshots before delivery.
- Store visual verification screenshots under `test_scripts/screenshots/` with filenames that include the slide name and viewport size.
- Repeat revisions and screenshot checks if any clipping, hidden bottom content, overflow, broken assets, or readability/design issues are visible.

## HTML Deck PDF Export

### Function
Export a finished, verified NBG HTML deck to a PDF that preserves its aesthetics: one page per slide at the slide's own box (the 1920×1080 artboard = 20 × 11.25 in), zero margins, backgrounds and embedded images preserved, vector (selectable) text.

### Script
- `scripts/export-pdf.mjs` (zero-dependency Node ≥ 18; drives headless Chrome/Chromium/Edge over the DevTools pipe)
- `scripts/lib/find-browser.mjs` (browser locator shared with `scripts/screenshot-deck.mjs`)

### Functional Requirements
- Accept `pdf` as an output format next to `html` (default); PowerPoint is out of scope; a PDF is always produced from the HTML deck, never authored separately.
- Require the HTML gate first: `embed-assets.mjs`, `verify-deck.mjs --strict`, and the screenshot inspection; never export a deck that fails the gate.
- Lift only the deck's host layer (navigation toggles `.active` / `.hidden` / inline `display` / `[hidden]`, viewport-fit wrappers, non-slide chrome); never change a slide's own CSS, size, fonts, colours, copy, logos or photography.
- Jump CSS animations/transitions to their end state, force `print-color-adjust: exact`, and wait for fonts and images before printing.
- Print with `Page.printToPDF` (`printBackground`, `preferCSSPageSize`, `scale 1`, page size = the measured box of slide 1; `--size WxH` only overrides a wrong slide box).
- Verify that the PDF page count equals the slide count and that every slide box equals the page box; exit 1 otherwise (the PDF is still written for diagnosis). A mismatch is a slide sizing/overflow defect to fix in the HTML.
- Exit 3 when no browser exists on the host; the agent then delivers the HTML and the one-line export command for a host with a browser.
- After a PASS, rasterise a few pages (`pdftoppm`) and read them next to the browser screenshots (cover, a divider, a dense content slide, the last slide at minimum) before delivery.
- Deliver the PDF together with its source HTML unless the user wants only the PDF; report the exporter's slides / pages / page-box line.

### How to Use
```bash
node "<skill-root>/scripts/export-pdf.mjs" my-deck.html            # writes my-deck.pdf next to the deck
node "<skill-root>/scripts/export-pdf.mjs" my-deck.html -o out/my-deck.pdf --browser "/path/to/chrome"
pdftoppm -r 72 -png my-deck.pdf pages/my-deck && pdfinfo my-deck.pdf
```

## In-Deck Right-Click Menu (Text Editing & Formatting, Shape Resizing & Arranging, PDF Export, Saved Copy)

### Function
Let anyone who receives the HTML deck (a) edit any text on a slide in place — double-click it or right-click → *Edit text* — (b) resize, move, style, order, align, distribute and group any card, photo panel, image, decorative block or text block, one at a time or several at once — right-click → *Resize / move shape*, Shift+click / Shift+drag / Ctrl+A to select more — keep the changes across reloads and download the deck with them applied, and (c) export the deck to PDF from the browser — right-click → *Export to PDF* → *Save as PDF* — with the same one-page-per-slide, aesthetics-preserved result as `scripts/export-pdf.mjs`. No tooling installed.

### Script
- `scripts/add-deck-menu.mjs` — inlines the menu (idempotent; upgrades the v1.4 PDF-only block; `--remove` strips it)
- `scripts/lib/print-layout.js` — print-layout shim shared with the CLI exporter (prepare + restore)
- `scripts/lib/deck-menu.js` — the menu UI, in-place editing, persistence, saved copy, print orchestration

### Functional Requirements
- Add the menu to every delivered HTML deck after `embed-assets.mjs` and before `verify-deck.mjs --strict`; the strict gate requires it unless the user declined it (`--no-deck-menu`) and warns on the older PDF-only block.
- Keep the deck fully self-contained: one inline `<script id="nbg-deck-menu-script" data-nbg-deck-menu="<version>">`, no external references; re-running upgrades an older block.
- Right-click (except on links/form fields) shows an NBG-styled menu: *Edit text* when the click landed on text, *Export to PDF*, and — once edits exist — *Save edited copy* and *Discard edits*, plus *Cancel*; Escape or a click outside closes it; deck keyboard shortcuts stay suppressed while it is open.
- Text editing: double-click any text on a slide or use *Edit text*; the whole text block (inline accent spans intact) becomes `contenteditable` with a teal outline; Enter or a click outside applies, Esc cancels, Shift+Enter inserts a line break, Ctrl/Cmd+Z undoes; formatting shortcuts are blocked, paste/drop insert plain text, and every element the browser wraps around typed text (other than `<br>`) is unwrapped on commit; the element's CSS, `white-space` and box do not change while editing; deck shortcuts are suppressed.
- Formatting toolbar while editing (draggable by its grip): every control applies to the selected text when there is a selection and to the whole block otherwise — Bold / Italic / Underline / Strikethrough (semantic tags on a run; un-bold spans kept), A− / A+ and an exact px size, font family limited to the design system's stacks, text colour limited to the NBG palette (on a run: exactly the selected text wrapped in a styled span; on the block: inline style with line-height kept proportional when fixed in px), alignment (block), Clear (selection: tags and spans removed; block: back to the authored inline style), Done; shortcuts Ctrl/Cmd+B/I/U and Ctrl/Cmd+Shift+> / <; block formatting is recorded as a `style` edit, selection spans travel with the text edit, Esc restores both.
- Shape toolbar while a shape is selected (draggable by its grip): X / Y / W / H fields, fill (NBG palette, transparent, Default), border (none, 1–6 px, palette colour), corner radius, opacity, shadow (none, soft, strong, Default), Reset, Done — all inline style on the element, recorded in its `style` edit.
- Multi-selection: Shift+click adds or removes a shape, Shift+drag draws a selection box (top-level shapes fully inside; slide-filling backdrops excluded), Ctrl/Cmd+A selects every top-level shape of the slide, Ctrl/Cmd+click picks one shape alone; the menu offers *Add to selection* / *Remove from selection* / *Select all shapes on this slide*; the frame spans the selection with a dashed mark per member; moving, scaling (proportional), nudging, styling and Reset apply to every member; modifier gestures never reach the deck's own click handlers.
- Stack picker for nested / overlapping shapes: the menu lists every shape under the pointer (*Select at this point*, front-most first, text blocks inside cards included; click selects alone, Shift+click adds), the toolbar's Stack list offers enclosing shapes / the selected one / its child shapes, Ctrl/Cmd+click on the same spot cycles outward, Tab / Shift+Tab step out / in.
- Arrange (second toolbar row): Order — bring to front / forward / backward / send to back (Ctrl/Cmd+] / [ with Shift for front/back; also in the menu) as inline `z-index` derived from the siblings' effective stacking order, a flow element positioned relatively, the parent isolated when a negative index is needed, never DOM re-ordering; Align left / centre / right / top / middle / bottom and Distribute horizontally / vertically with equal gaps, relative to the selection's box (first and last fixed; distribute needs three) or to the slide (two or more); Group (Ctrl/Cmd+G) / Ungroup (Ctrl/Cmd+Shift+G) as logical groups (`data-nbg-group`, a `group` edit record) that always select and move together.
- Shape resizing / moving: a selection frame with eight handles (three for flow elements) on the element under the pointer; handle drags resize (Shift keeps proportions), dragging inside moves, arrows nudge (Shift 10 px), Alt+arrows resize, Tab selects the enclosing shape, Esc/Enter/click outside finishes; pointer deltas are divided by the slide's current scale; only inline geometry changes, the top-left corner is pinned before a resize, flow elements move with `position: relative`; *Reset shape* restores one element; the frame is hidden in the print layout.
- Toolbars: a *Toolbars* menu section that ticks the visible toolbars; tick = show and pin (stays visible, follows the selection, idle when nothing applies), untick or the toolbar's ✕ = hide until shown again, *Automatic toolbars* = the default show-with-selection behaviour; remembered per deck. Every toolbar adapts to the selection and the slide: the text toolbar formats the text being edited or every selected text block at block level, the shape toolbar the selection's geometry and style, the structure panel the selection and the slide; a slide change drops an off-screen selection.
- Structure / HTML panel (*Show structure* / *Show HTML*, toolbar `</>`, Ctrl/Cmd+Shift+O / H): an outline of the slide's shapes (cards, text blocks, images, nested by containment) with a checkbox per row for selecting several, readable labels, All / None, a filter, and the selection highlighted on the slide and in the list (a container and its content are never selected together); a tree of the slide synced with the visual selection both ways (select on the slide → row highlighted and revealed; click a row → that exact element selected, Shift+click adds, double-click edits text, hover outlines, keyboard navigation; edited elements marked) and an editable source view of the selected element — Apply keeps the element type, strips scripts / event handlers / `javascript:` URLs, records style / group / html / attrs edits. Deliberate exception to the brand guardrails, at the user's request.
- Persist edits as `{ path, kind: 'html' | 'style' | 'group' | 'attrs', original, value }` in `localStorage` under `nbg-deck-edits:<pathname>#<title>`; re-apply them on load, dropping entries whose original markup no longer matches.
- *Save edited copy* downloads `<name>-edited.html`: the edits applied to a pristine snapshot of the deck taken at load, so the copy loads like the original, stays self-contained and carries the menu. *Discard changes on this slide* restores only the slide under the pointer; *Discard edits* restores every slide and clears storage.
- *Export to PDF* commits any open edit, applies the shared print layout, opens the browser print dialog, and restores the interactive deck (classes, inline styles, attributes, viewport-fit scaling) when the dialog closes; Ctrl/Cmd+P and the browser Print command behave the same through `beforeprint`/`afterprint`.
- Preset the page (`@page { size: <slide box>; margin: 0 }`, `print-color-adjust: exact`) so the viewer only chooses *Save as PDF*.
- Expose `window.nbgDeck = { version, pdf, edit: { …, discardSlide, listFor, slideAt }, toolbars: { mode, set, visible, sync, names }, code: { open, show, close, isOpen, tab, refresh, target, source, setSource, apply, revert, rowOf, outlineRowOf, filter }, shape: { select, selectMany, add, remove, toggle, solo, selectAll, deselect, selected, selection, reset, align, distribute, order, group, ungroup, groupOf, shapesOf, stackAt, enclosing, inside }, resolveTextTarget, resolveShapeTarget }` (and the `window.nbgPdf` alias); honour `window.__nbgPdfExternal` so an external driver can print without the hooks interfering.
- The menu edits text, text formatting (fonts limited to the design system's stacks, colours to the NBG palette), geometry, stacking order and grouping only; images, new elements and structure remain the skill's job; shape changes do not re-flow neighbours (Distribute restores even spacing). The CLI exporter prints the file on disk, not unsaved in-browser edits.

### How to Use
```bash
node "<skill-root>/scripts/add-deck-menu.mjs" my-deck.html          # add / upgrade
node "<skill-root>/scripts/add-deck-menu.mjs" my-deck.html --remove # strip (only if the user declines it)
```
Tell the recipient in one line: double-click any text to edit it (Enter applies, Esc cancels); right-click for *Resize / move shape* (Shift+click or Shift+drag selects several; the toolbar orders, aligns, distributes and groups them), *Export to PDF* and *Save edited copy*.
