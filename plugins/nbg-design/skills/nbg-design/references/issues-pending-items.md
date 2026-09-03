# Issues - Pending Items

## Pending Items

### Medium — Confirm whether "NPG Design" was intended to mean `NBG-Design/`
- Detected: 2026-06-03
- Context: The original request mentioned an "NPG Design" folder, but the project contains `NBG-Design/` and no local `NPG Design/` folder.
- Current handling: `config/pi-agent-nbg-design.yaml` documents the ambiguity and uses `NBG-Design/` based on local evidence.
- Resolution condition: User confirms the intended folder name/path.

### Medium — Confirm final presentation workflow and output format
- Detected: 2026-06-03
- Context: Pi Agent does not have a native YAML settings schema; the created YAML is a context/config bundle intended for `@file` usage. The final output format for generated presentations was initially not specified.
- Current handling: User confirmed on 2026-06-03 that unspecified deck output format should default to HTML. Technical research for the portability work confirmed the YAML behaves as Pi `@file` context text when used through the CLI. The YAML still needs confirmation only for whether a custom Pi extension/workflow will consume or parse it structurally.
- Resolution condition: User confirms whether a custom Pi extension/workflow will consume the YAML.

### Medium — Confirm target operating systems for deterministic setup validation
- Detected: 2026-06-04
- Context: The portable setup guide is documentation/checklist based and uses shell examples that are straightforward on macOS/Linux. Windows support may require different command quoting or a different validation script approach.
- Current handling: The shared config avoids machine-specific roots and documents repository-root execution. No executable validation script has been added pending OS confirmation.
- Resolution condition: User confirms target OS support: macOS only, macOS/Linux, or Windows as well.

### Medium — Decide whether to add an executable portable-config validation script
- Detected: 2026-06-04
- Context: The deterministic process now includes a manual validation checklist in `docs/design/configuration-guide.md`. An executable script under `test_scripts/` could enforce missing-file and machine-specific-path checks, but script language depends on OS support.
- Current handling: No script was created because executable automation and target OS support remain unconfirmed.
- Resolution condition: User approves or declines adding a validation script and confirms target OS expectations.

### Low — No-browser exit path of the browser-backed scripts is verified by review only
- Detected: 2026-09-03
- Context: `scripts/export-pdf.mjs` and `scripts/screenshot-deck.mjs` exit with code 3 when `scripts/lib/find-browser.mjs` finds no Chrome/Chromium/Edge. The development host always has Chrome at its standard macOS path, so the branch could only be reviewed, not executed; the explicit `--browser <bad path>` error branch and the pipe/verification paths were executed.
- Current handling: The branch mirrors the pre-existing `screenshot-deck.mjs` logic (unchanged semantics) and is documented in `SKILL.md` and `scripts/README.md`.
- Resolution condition: Run either script once on a host without a browser (e.g. a bare Linux container) and confirm exit code 3 with the documented message.

## Configuration Defaults / Exceptions Log

### 2026-06-03 — NBG presentation context defaults
- Exception authorized by user: when deck language is not specified, assume English (`en`).
- Exception authorized by user: when final output format is not specified, assume HTML (`html`).
- Scope: `config/pi-agent-nbg-design.yaml` only.

## Completed Items

### 2026-09-03 — Added PDF export that preserves the HTML deck's aesthetics (skill v1.3.0)
- Detected: User requested that the skill support exporting a presentation to PDF "without changes in aesthetics".
- Affected files: `scripts/export-pdf.mjs` (new), `scripts/lib/find-browser.mjs` (new, shared), `scripts/screenshot-deck.mjs`, `scripts/README.md`, `SKILL.md`, `config/pi-agent-nbg-design.yaml`, `references/project-design.md`, `references/project-functions.MD`, `references/configuration-guide.md`, plugin/marketplace manifests (1.2.0 → 1.3.0).
- Cause: The skill had no PDF path; any ad-hoc route (browser Save-as-PDF at A4 with headers, `window.print()`, Office round-trips, stitched screenshots) re-flows or rasterises the 1920×1080 design.
- Solution: A zero-dependency Node exporter drives headless Chrome over the DevTools pipe, lifts only the deck's navigation/viewport-fit layer, shows every top-level `.slide` in flow, settles animations/fonts/images, and prints one page per slide at the slide's own box with backgrounds forced and vector text. It verifies pages = slides and slide box = page box and exits non-zero otherwise. `pdf` is now an accepted output format with rules in `SKILL.md` and the YAML (`presentation_generation_rules.pdf_export`).
- Verification: Three real decks produced with this skill (15 / 11 / 17 slides; `.active`-toggle, stacked-scroll and `.hidden`-toggle hosts) exported with pages = slides and 1440 × 810 pt pages; pdftoppm renders pixel-diffed against 1920×1080 browser screenshots show ≤ 0.16 % of pixels with a solid difference (text anti-aliasing). Synthetic decks confirmed the overflow failure path (exit 1), the `--size` mismatch report, a 1280×720 deck kept as authored, animation/transition end states, and the `--selector` / `--browser` error paths. Record: `docs/nbg-design-docs/verification.md` (development workspace).

### 2026-09-03 — Fixed three defects in `scripts/screenshot-deck.mjs` found while verifying the PDF export
- Detected: Reference screenshots of two real decks showed slide 1 for every slide, and the slide count was too high.
- Cause: (1) the navigation shim only toggled `.active`, so `.hidden`-toggle and stacked scrolling decks never changed slide; (2) the shim was injected at the first `</body>` string, which one deck had inside an HTML comment, so the shim never ran; (3) the slide counter matched `slide-title` / `slide-footer` as slides.
- Solution: The shim now isolates the Nth top-level `.slide` in place (hides the others with a class, lifts `.hidden` / `[hidden]` / inline display, keeps the deck's scaling), is injected before the last `</body>`, and the counter matches the exact class token. The browser locator moved to `scripts/lib/find-browser.mjs`.
- Verification: All three decks now capture 15 / 11 / 17 distinct slides and match the PDF pages.

### 2026-09-03 — Resolved: local browser path handling for screenshot automation and PDF export
- Context: Formerly the pending item "Decide local browser path handling for screenshot automation" (detected 2026-06-04).
- Solution: Both browser-backed scripts auto-detect Chrome/Chromium/Edge (`--browser` flag, `NBG_BROWSER` / `CHROME_BIN` / `CHROME_PATH` / `BROWSER` env, standard macOS/Linux locations, `PATH`) and fail clearly on a non-executable explicit path; no committed fallback path exists. Documented in `references/configuration-guide.md`.

### 2026-06-05 — Added overlap-protection guardrails for generated NBG HTML presentations
- Detected: `agentic-engineering-nbg-executive-presentation.html` slides 2 and 3 contained unintended content collisions visible in screenshots at 1366×768 and 1440×900.
- Affected files: `/Users/giorgosmarinos/.pi/agent/skills/nbg-design/SKILL.md`, `/Users/giorgosmarinos/.pi/agent/skills/nbg-design/config/pi-agent-nbg-design.yaml`, `/Users/giorgosmarinos/contentwork/temp/docs/reference/nbg-design-overlap-protection-issue-solution.md`, `/Users/giorgosmarinos/contentwork/temp/docs/design/project-design.md`, and `/Users/giorgosmarinos/contentwork/temp/docs/design/project-functions.MD`.
- Cause: Existing skill guidance required viewport fit and screenshot inspection for clipping/overflow/readability, but it did not explicitly require internal slide-collision checks between independently positioned cards, callouts, shapes, logos, and footer/page-number areas.
- Solution: Added anti-overlap authoring rules, layout-zone spacing guidance, regression examples, and screenshot-verification checks requiring revision/re-validation when overlaps are detected.
- Verification: Existing slide 2/3 screenshots were inspected as defect evidence, and `config/pi-agent-nbg-design.yaml` parsed successfully with Ruby Psych (`YAML OK`).

### 2026-06-05 — Resolved 10-category wording ambiguity in Voice Agent call-categories slide
- Detected: The user requested classification into “10 large categories” but supplied 9 category rows whose percentages sum to 100%.
- Affected files: `presentations/voice-agent-call-categories-slide.html`, `test_scripts/create_voice_agent_call_categories_pptx.py`, `presentations/voice-agent-call-categories-slide.pptx`, `docs/design/plan-007-voice-agent-call-categories-slide.md`, `docs/design/project-design.md`, `docs/design/project-functions.MD`, and `docs/reference/powerpoint-visual-verification-voice-agent-call-categories-slide.md`.
- Cause: Source-data count mismatch between the prose label and the listed rows.
- Solution: Avoided a misleading explicit “10 categories” claim in the final slide and added a transparent note: the source percentages list 9 category rows that sum to 100% of the classified set.
- Verification: The HTML and PPTX contain the supplied percentage distribution, the source note, and the required opportunity/rollout metrics. HTML screenshots and PPTX render/package checks are documented in `docs/reference/powerpoint-visual-verification-voice-agent-call-categories-slide.md`.

### 2026-06-05 — Replaced Sofia native PPTX generator with declarative scene-based implementation
- Detected: User selected replacement of the existing Sofia HTML-to-PowerPoint implementation instead of only verifying/extending it.
- Affected files: `test_scripts/create_sofia_native_pptx.py`, `presentations/sofia-voice-agent-automation-areas.pptx`, `docs/design/plan-006-replace-sofia-native-pptx-generator.md`, `docs/design/project-design.md`, `docs/design/project-functions.MD`, and `docs/reference/powerpoint-visual-verification-sofia-html-to-single-slide-native-powerpoint.md`.
- Cause: The project already had a working native generator, but the user requested a replacement approach for the same single-slide PPTX deliverable.
- Solution: Replaced the generator with a declarative scene-based standard-library OpenXML implementation that emits native PowerPoint shapes/text and embeds only the discrete NBG knockout logo asset. Regenerated the one-slide PPTX output.
- Verification: ZIP integrity passed; the deck contains exactly one 16:9 slide; only one media asset is embedded; native shape/text objects are present; all required numeric values are present; HTML reference and Quick Look PPTX render screenshots were saved under `test_scripts/screenshots/` and visually inspected.

### 2026-06-05 — Added HTML-to-PowerPoint native recreation rules to NBG Pi config
- Detected: User requested that `config/pi-agent-nbg-design.yaml` enforce native HTML-to-PowerPoint recreation, no HTML screenshot embedding, continuous text block preservation, and visual inspection against the HTML reference.
- Affected files: `config/pi-agent-nbg-design.yaml`, `docs/design/project-design.md`, and `docs/design/project-functions.MD`.
- Solution: Added explicit expected-agent behavior and a dedicated `presentation_generation_rules.html_to_powerpoint_conversion` section covering native shapes/text/fonts, discrete-only image assets, continuous text policy, rendered visual comparison, and verification artifacts.
- Verification: Confirmed the config contains the new `html_to_powerpoint_conversion` section and `pptx_converted_from_html` visual verification requirement. PyYAML is not installed in the current environment, so YAML parsing could not be performed with Python.

### 2026-06-05 — Preserved continuous text blocks in native Sofia PPTX
- Detected: User explicitly required the HTML-to-PowerPoint recreation not to break continuous text blocks into separated lines.
- Affected files: `test_scripts/create_sofia_native_pptx.py`, `presentations/sofia-voice-agent-automation-areas.pptx`, and `docs/reference/powerpoint-visual-verification-sofia-voice-agent-automation-areas.md`.
- Cause: The existing native generator used multiple separate line text boxes for several continuous paragraphs/headlines to mimic browser wrapping.
- Solution: Updated the generator so continuous content is emitted as single editable PowerPoint text blocks with natural wrapping. Preserved only source-intended breaks from the HTML title and dataset label.
- Verification: Regenerated the PPTX; ZIP integrity passed, the deck contains exactly one 16:9 slide, only one discrete logo image is embedded, no full-slide image exists, all required numeric values are present, the main headline/subtitle/hero label/recommendation copy are continuous text strings, and the Quick Look render was visually inspected against the HTML reference.

### 2026-06-04 — Replaced screenshot-based Sofia PPTX with native PowerPoint recreation
- Detected: User requested that `presentations/sofia-voice-agent-automation-areas.html` be converted to PowerPoint by recreating the slide with shapes, text, and fonts, explicitly not by using the HTML content as an image.
- Affected file: `presentations/sofia-voice-agent-automation-areas.pptx`.
- Cause: The existing PPTX conversion documented in `docs/reference/powerpoint-visual-verification-sofia-voice-agent-automation-areas.md` used a full-slide rendered PNG embedded into PowerPoint, which achieved pixel identity but violated the native-editability requirement.
- Solution: Added `test_scripts/create_sofia_native_pptx.py`, a standard-library OpenXML generator that creates a one-slide widescreen PPTX with native shapes and editable text. The only embedded image is the discrete NBG knockout logo asset.
- Verification: Regenerated the PPTX; ZIP integrity passed, slide count is exactly one, slide size is 16:9, only one media asset exists, there is no full-slide image element, all required numeric values are present, and a Quick Look visual render was inspected at `test_scripts/screenshots/sofia-native-ql/sofia-voice-agent-automation-areas.pptx.png`.

### 2026-06-03 — Fixed HTML presentation page exceeding screen boundaries
- Detected: User reported that the generated presentation page exceeded screen boundaries, then clarified that a page-height issue remained.
- Affected file: `presentations/sofia-voice-agent-automation-areas.html`.
- Cause: The page used a fixed 1920×1080 artboard and transform scaling; the initial correction still depended partly on CSS viewport-height calculations and a scaled element whose unscaled layout box could keep height behavior fragile in some browsers.
- Solution: Added a viewport-sized `.slide-frame`, kept the internal 1920×1080 slide artboard for design fidelity, and replaced the height-sensitive CSS scaling with `visualViewport`/`innerWidth`/`innerHeight` measurements that explicitly calculate scale plus x/y centering offsets. The document/body are fixed to the viewport and overflow is hidden.
- Prevention: Updated `config/pi-agent-nbg-design.yaml` with stricter `presentation_generation_rules.html_output_layout` guidance that warns not to rely on an unscaled transformed artboard's layout box for page height.
- Verification: Validated required content markers, YAML syntax, and viewport-fit calculations for common desktop/laptop viewport sizes.
