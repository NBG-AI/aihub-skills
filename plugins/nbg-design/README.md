# nbg-design

Use when creating National Bank of Greece (NBG) styled presentations, HTML slides, slide specifications, PDF exports of HTML decks (one page per slide, aesthetics preserved), or editable PowerPoint recreations using the bundled NBG Presentation Design System, templates, logos, photography, screenshots, and guardrails.

## Overview

This skill packages the NBG Presentation Design System as a user-level Pi skill so it can be used from any working directory.

Output formats: `html` (default, fully self-contained), `pdf` (exported from the HTML deck by the bundled
`scripts/export-pdf.mjs` — one page per slide at the 1920×1080 artboard, vector text, backgrounds and
embedded images preserved; needs Chrome/Chromium/Edge on the host), and `pptx` (native recreation).

## Installation

```bash
/plugin install nbg-design
```

## Usage

This plugin provides the `nbg-design` skill which Claude will use automatically based on context.

## Documentation

See `skills/nbg-design/SKILL.md` for complete documentation.

## License

MIT
