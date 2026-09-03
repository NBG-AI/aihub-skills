# Visual QA checklist

Run after `build_deck.py` reports PASS. Render with `preview_deck.py` and read every PNG.

## Briefing decks (`style: briefing`)

- [ ] Head on one line (title + sub), meta on the right not colliding with it, hairline under it.
- [ ] Pure white ground; the accent appears only on rules, kickers, tags, bullets, card edges,
      the progress bar and chart highlights; never behind body copy.
- [ ] Callout band: badge, title and text do not overlap; the tone matches the message
      (`stop` for blockers only).
- [ ] Cards: bullets end inside the card; kicker headings on one line; stat numbers legible.
- [ ] Tables: header row, status dots, hot dates in red only for `stop` rows, sub-lines faint,
      the band (if any) fully below the last row.
- [ ] Panels: pills inside their matrix rows and boxes; the ask box tinted with numbered items;
      nothing below y=976.
- [ ] Rail pills and tags readable (no wrapped labels).
- [ ] Footer: compact lockup, faint label, `nn / NN` counter; progress bar grows slide by slide.
- [ ] Lean: 5-8 slides, ends on asks / next steps, no "Thank you", detail in notes.

## Per slide (design-system decks)

- [ ] Nothing clipped at the slide edge; nothing overflowing its zone (long titles wrapping into
      the accent rule or the body; captions reaching the footer band; column bodies running past
      y=944).
- [ ] No collisions: text over text, text over a photo (the footer page number over the
      half-page photo on `content_image_right` is by design), text over the logo.
- [ ] Logo present, correct variant (knockout on dark, primary/compact on light), native aspect
      ratio, in the template position.
- [ ] Photo fills its frame edge to edge with rounded corners where the template has them, no
      stretching; the intended subject is not cropped away (swap the photo if it is).
- [ ] One accent colour per slide; text is ink on light and cream/white on dark; eyebrow and
      footer are quiet.
- [ ] Display type: no single orphaned word on the last line of an 88-120px title; the
      `~accent~` line break sits where the design intends (usually after the first clause).
- [ ] Charts: teal tints only, labels legible, legend only for multi-series, no pie.
- [ ] Tables: numbers right-aligned, hairlines visible, header rule present, no fill colour.
- [ ] Bilingual decks: the Greek line is beneath the English one, muted, and still inside the zone.
- [ ] Speaker notes attached where the spec had `notes`.

## Deck

- [ ] Opens with a cover, dividers introduce major sections, ends with the plain back cover.
- [ ] Page numbers on dividers and content slides only, sequential, two digits.
- [ ] Layout variety: no more than two consecutive slides on the same content template.
- [ ] Language consistent with the request (or the `en` default).
- [ ] Every slide has one clear purpose; copy on the slide is concise, expansion is in notes.

## Preview caveats

- LibreOffice preview: translucent text may look clipped on its right edge and small italic runs
  may show a substitute face; PowerPoint renders both correctly. Confirm with
  `--engine powerpoint` when available (macOS; a one-time "Grant File Access" prompt may appear
  in PowerPoint for the folder - if it does, the export fails until it is answered).
- Without the Aptos faces on the machine, widths in the preview are approximate; leave ~10% slack
  before trusting a tight fit.
