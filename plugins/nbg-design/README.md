# nbg-design

Use when creating National Bank of Greece (NBG) styled presentations, HTML slides (with a built-in right-click menu: in-place text editing with a formatting toolbar, shape resize/move with a shape toolbar, multi-selection with align / distribute / order / group, "Export to PDF", "Save edited copy"), slide specifications, PDF exports of HTML decks (one page per slide, aesthetics preserved), or editable PowerPoint recreations using the bundled NBG Presentation Design System, templates, logos, photography, screenshots, and guardrails.

## Overview

This skill packages the NBG Presentation Design System as a user-level Pi skill so it can be used from any working directory.

Output formats: `html` (default, fully self-contained), `pdf` (exported from the HTML deck by the bundled
`scripts/export-pdf.mjs` — one page per slide at the 1920×1080 artboard, vector text, backgrounds and
embedded images preserved; needs Chrome/Chromium/Edge on the host), and `pptx` (native recreation).

Every delivered HTML deck also carries a right-click menu (`scripts/add-deck-menu.mjs`):

- **Edit text** — double-click any text on a slide (or right-click it → *Edit text*) and edit it in
  place; Enter applies, Esc cancels. A movable toolbar offers bold / italic / underline / strikethrough,
  larger / smaller / exact font size, font family, NBG palette colours, alignment and Clear — applied
  to the selected text only, or to the whole block when nothing is selected.
- **Resize / move shape** — right-click a card, photo panel, image or text block: a selection frame
  with handles appears; drag to resize (Shift keeps proportions) or move, arrows nudge, Esc finishes.
  A movable shape toolbar sets X/Y/W/H, fill, border, corner radius, opacity and shadow.
  *Reset shape* restores one element.
- **Several shapes at once** — Shift+click adds shapes, Shift+drag draws a selection box, Ctrl/Cmd+A
  selects the whole slide; move, scale and style them together, and use the toolbar's arrange row to
  bring to front / send to back, align (left, centre, right, top, middle, bottom), distribute with
  equal gaps, and group / ungroup. Nested or overlapping shapes: the menu's *Select at this point*
  list, the toolbar's Stack list, Ctrl/Cmd+click cycling and Tab / Shift+Tab reach every level.
- **Show structure / Show HTML** — a panel with an outline of the slide's shapes (checkboxes to
  select several, All / None, filter), the element tree synced both ways with the selection, and
  the selected element's editable source; Apply records the change like every other edit
  (scripts are stripped).
- Edits survive a reload and **Save edited copy** downloads the deck with the changes baked in;
  **Discard changes on this slide** restores one slide, **Discard edits** restores them all.
- **Export to PDF** — choose *Save as PDF* in the browser's print dialog and get the same
  one-page-per-slide PDF as the CLI exporter, with no tooling installed.

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
