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
- For HTML-to-PowerPoint conversion requests, require native editable PowerPoint recreation instead of screenshot-based slide content.
- For HTML-to-PowerPoint conversion requests, preserve continuous text blocks as continuous editable text boxes with natural wrapping and only preserve source-intended line breaks.
- For HTML-to-PowerPoint conversion requests, require rendered PowerPoint inspection against the rendered HTML reference and correction of obvious visual mismatches before delivery.

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

## Sofia Voice Agent Native PowerPoint Recreation

### Function
Provide a single-slide, 16:9 PowerPoint version of the Sofia Voice Agent automation areas page, recreated with editable PowerPoint-native objects rather than a flattened screenshot.

### Presentation File
- `presentations/sofia-voice-agent-automation-areas.pptx`

### Generation Script
- `test_scripts/create_sofia_native_pptx.py`

### Functional Requirements
- Contain exactly one widescreen PowerPoint slide.
- Recreate the source HTML page `presentations/sofia-voice-agent-automation-areas.html` with native PowerPoint shapes and editable text.
- Use the current declarative scene-based OpenXML generator rather than a screenshot converter or HTML raster capture.
- Preserve continuous copy blocks as continuous editable PowerPoint text blocks with natural wrapping; do not split them into separate text boxes per rendered line.
- Preserve source-intended manual line breaks only for the HTML title structure and dataset-label break.
- Use the NBG knockout logo only as a discrete image asset.
- Avoid embedding a full-slide screenshot or large image representing the HTML page.
- Preserve the Greek copy and the required numeric values: `77,3%`, `13.090`, `10.116`, `2.376`, `598`, `7.053`, `53,9%`, `18,2%`, and `4,6%`.
- Keep verification evidence in `docs/reference/powerpoint-visual-verification-sofia-html-to-single-slide-native-powerpoint.md` and rendered screenshots under `test_scripts/screenshots/`.

## Voice Agent Call Categories Opportunity Slide

### Function
Provide a single English NBG-styled executive slide that communicates the voice-agent serviceable opportunity from 25,000 daily calls and the staged 2026 / Q1 2027 adoption target.

### Presentation Files
- HTML source of truth: `presentations/voice-agent-call-categories-slide.html`
- Native editable PowerPoint output: `presentations/voice-agent-call-categories-slide.pptx`

### Generation Script
- `test_scripts/create_voice_agent_call_categories_pptx.py`

### Functional Requirements
- Present the baseline of 25,000 total inbound calls per day.
- Show that 50% of total daily calls are classified into major categories, approximately 12,500 calls/day.
- Preserve the provided classified category distribution: 27%, 27%, 14%, 8%, 6%, 5%, 5%, 4%, and 4%.
- Explain that 60% of the classified subset is estimated to be voice-agent serviceable, approximately 7,500 calls/day or 30% of total daily call volume.
- Show the rollout target of 15% of total daily volume in 2026 and another 15% in Q1 2027.
- Keep final slide copy in English.
- Use the NBG 16:9 / 1920×1080 presentation design style with NBG logo and teal-led palette.
- Fit the HTML slide completely inside common browser viewports without unintended scrolling or clipping.
- Recreate the PowerPoint version with native editable shapes, text boxes, bars, and layout objects, not a screenshot of the HTML page.
- Use only the NBG logo as a discrete embedded image asset in the PPTX.
- Transparently handle the source ambiguity that says “10 categories” but lists 9 category rows by avoiding a misleading category count and adding a source note.
- Keep verification evidence in `docs/reference/powerpoint-visual-verification-voice-agent-call-categories-slide.md` and rendered screenshots under `test_scripts/screenshots/`.

## HTML-to-PowerPoint Native Recreation Guardrail

### Function
Define reusable configuration rules for converting HTML slides/pages into editable PowerPoint slides without flattening the HTML content into screenshots.

### Configuration File
- `config/pi-agent-nbg-design.yaml`

### Functional Requirements
- Use the rendered HTML page as the authoritative visual reference for layout, color, spacing, typography hierarchy, and proportions.
- Recreate PowerPoint slides using native editable objects: shapes, text boxes, fonts, fills, borders, rounded rectangles, lines, charts, and layout elements.
- Do not use a full-slide screenshot, rendered HTML capture, or major rasterized HTML-content region as the PowerPoint slide content.
- Allow image use only for discrete source/design assets, such as logos or intentional photos.
- Preserve continuous text blocks as continuous editable PowerPoint text blocks with natural wrapping; do not split paragraphs, headlines, or recommendations into separate text boxes per rendered line.
- Preserve explicit/source-intended line breaks only where the HTML uses them semantically.
- Inspect the generated PowerPoint render against the rendered HTML reference and revise until the visual match is as close to 100% as technically possible while preserving native editability.
- Document non-trivial conversion verification artifacts under `docs/reference/` and screenshots/renders under `test_scripts/screenshots/` when available.

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
- Accept `pdf` as an output format next to `html` (default) and `pptx`; a PDF is always produced from the HTML deck, never authored separately.
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
