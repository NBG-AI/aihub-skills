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
- Use NBG logos and bundled photography from `NBG-Design/assets/`.
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
- When screenshot tooling is available, save screenshots under `test_scripts/screenshots/` in the active working project, or another user-selected output folder, and visually inspect them before delivery.
- Protect the slide artboard from unintended element overlap: cards, text blocks, decorative shapes, logos, footers, page numbers, and grouped rows/columns must not collide unless the overlap is an explicit, content-safe brand accent.
- Reserve non-overlapping layout zones for the title/header, main body, card grids/rows, bottom callouts, and footer/logo area. Keep at least 32px internal artboard spacing between adjacent content groups, and at least 72px clearance above footer/page-number elements unless the template defines a larger safe area.
- When content does not fit without overlap, reduce copy, resize or simplify components, change the grid/row structure, or split the content across additional slides. Do not hide overflow, stack opaque elements on top of content, or rely on z-index as a workaround for a crowded layout.
- Treat the current `agentic-engineering-nbg-executive-presentation.html` slides 2 and 3 overlap pattern as a regression example: independently positioned card/callout rows must be checked against each other before delivery.

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

- `NBG-Design/assets/logo-primary.png`
- `NBG-Design/assets/logo-knockout.png`
- `NBG-Design/assets/logo-small.png`
- `NBG-Design/assets/photo-fields.jpeg`
- `NBG-Design/assets/photo-heart.jpeg`
- `NBG-Design/assets/photo-parthenon.jpeg`
- `NBG-Design/assets/photo-skate.jpeg`
- `NBG-Design/assets/photo-street.jpeg`

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
