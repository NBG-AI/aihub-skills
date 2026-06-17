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

## Configuration Policy
- Secrets, API keys, tokens, and expiring credentials must not be stored in project YAML files.
- Missing required presentation inputs must be surfaced to the user; they must not be replaced with undocumented fallback values.
- The `NPG Design` wording from the original request is documented as a naming ambiguity; local implementation uses the available `NBG-Design/` folder.
