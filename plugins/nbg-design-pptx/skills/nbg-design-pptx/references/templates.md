# Template catalogue

Two families, selected by `deck.style`. The **briefing** family (default) is the internal
team-briefing look of the `index 1.html` reference; the **design-system** family is the
`nbg-design` HTML look. Coordinates are artboard pixels (1920x1080); 1 px = 6350 EMU = 0.5 pt.

## Briefing family (`style: briefing`, default)

Fixed rhythm on every content slide: head at y=64 (title 34px SemiBold, optional faint `sub` on the
same line, optional `tag` capsule before it, optional 2-line `meta` right-aligned at 17px), hairline
at y=130, body from y=156 to y=976, footer band at y=1016 (compact lockup, faint uppercase
`footer_label`, `02 / 07` counter), accent progress bar 4px at the top. Side margin 88px, content
width 1744px. Copy that does not fit is a spec error; the templates never reflow or shrink.

| Template | Purpose | Zones | Limits |
|---|---|---|---|
| `brief_cover` | opening slide | primary lockup top-left; eyebrow (16px accent caps) at y=250; 81x4 rule; title 84px SemiBold (`~accent~` spans); subtitle 28px muted; up to 3 section cards (heading 22px + text 17px, accent top bar); foot line (`foot_left` / `foot_right`, 16px faint caps); concentric mark at the right edge | title <= 2 lines; content must end above y=960 |
| `brief_cards` | one message + supporting cards | optional `callout` band (badge, 30px title, 20px text, `tone`); 1-4 cards (16px accent caps heading; `items` bullets 19px / `text` paragraph / `stat` 64px accent number + `label`); optional `note` pinned above the footer with a hairline | cards share the tallest card's height; ~3-5 short bullets per card with a callout, ~8 without |
| `brief_table` | status / release tables | optional `flow` strip (label + numbered steps, `cond` = outlined step); optional `rail` (label + pills `{key, note, tone}` + right `note`); `table` (`columns: [{header, width, kind}]`, `rows: [{status, cells}]`); optional `band` of 1-2 boxes (`{key, text}` or `{key, asks: [...]}`, asks box tinted) | column widths sum to 1; kinds `name` (dot + SemiBold), `text`, `muted`, `date` (SemiBold, red when the row status is `stop`), `status` (cell `{label, tone}`); about 8-9 short rows with a band, 12-13 one-line rows without |
| `brief_panels` | two-column briefings | 1-3 panels (`title` kicker with trailing hairline) each stacking `blocks`: `matrix` (header + `{name, status: {label, tone}}` rows, 42px each), `box` (21px title, optional `pill`, `items` / `text`), `ask` (tinted, accent border, numbered `items`), `note` (16px faint), `list`, `text`, `steps` | blocks stack with 18px gaps and must end above y=976 |
| `brief_statement` | demo placeholder / closing statement | concentric mark, optional eyebrow + rule, 84px SemiBold title, subtitle, footer chrome | title <= 2 lines |
| `brief_chart` | one native chart | optional `body` paragraphs (520px column) left; chart in the remaining width; optional `note` above the footer | chart types `column bar line area doughnut stacked_column stacked_bar` (`pie` rejected); first series takes the accent, second the faint grey |

Every content template also accepts `intro` (a muted 20px paragraph under the head, at most three
lines) for a long subtitle; the body starts below it. `brief_cards` accepts up to 12 cards (rows of
three or four after the first four) and a `timeline` strip under the cards (`{label?, phases: [{title,
text?, date?, tone?}]}`, 2-4 phase cards with a date pill); panels accept `table` and `timeline`
blocks as well.

Markup in any copy field: `**strong**` (SemiBold ink), `*emphasis*`, `~accent~`, `\n`.
Tones: `ok` green, `warn` amber, `stop` red, `wait` grey, `accent` teal (pills, dots, callouts only).
Small labels (kickers, rail notes, table headers, step subs) are 14-16px; body is 19px; nothing
below 14px (7pt).

Cell values in `brief_table` may be a string, `{text, sub: [...]}` (faint 15px sub-lines under
the text) or, for `status` columns, `{label, tone}`. Row `status` drives the dot before the name
and the red "hot" date.

## Design-system family (`style: design-system`)

Every template is a 1:1 translation of a component in `nbg-design/NBG-Design/slide-templates.jsx`.
Coordinates are artboard pixels (1920x1080). PowerPoint geometry: 1 px = 6350 EMU = 1/144 in;
font sizes: 1 px = 0.5 pt. The engine applies these values verbatim; the copy limits below are what
keeps the fixed compositions from overflowing.

| Template | JSX source | Surface | Default accent | Default photo | Footer / page number |
|---|---|---|---|---|---|
| `cover1` | `Cover1` - hero photo on dark | `#0A1416` | `#003841` | `street` | logo only |
| `cover2` | `Cover2` - editorial light cover | `#F5F8F6` | `#007B85` | `parthenon` | logo only |
| `cover3` | `Cover3` - typographic, no image | `#003841` | `#00ADBF` | - | logo only |
| `divider_image` | `DividerImage` - dark with image card | `#003841` | `#00CFE7` | `fields` | yes (dark) |
| `divider_dark` | `DividerDark` - dark, type only | `#003841` | `#00CFE7` | - | yes (dark) |
| `divider_bright` | `DividerBright` - bright on cream | `#F5F8F6` | `#00ADBF` | - | yes |
| `content_image_right` | `ContentImageRight` - image right (1/2) | white | `#003841` | `skate` | yes |
| `content_columns` | `ContentTwoColumn` - numbered columns | white | `#007B85` | - | yes |
| `content_stat` | `ContentStat` - hero stat + metric table | `#F5F8F6` | `#00ADBF` | - | yes |
| `content_chart` | content grammar + native chart (companion) | white | `#007B85` | - | yes |
| `content_table` | content grammar + table (companion) | white | `#007B85` | - | yes |
| `back_cover` | plain closing slide (companion) | `#F5F8F6` | - | - | none |

Companions are not in the JSX; they reuse the content-page grammar (eyebrow at y=70, 56px light
title at y=110, 60x3 accent rule at y=290, body zone from y=340 to y=944) so charts and tables sit
inside the same system rather than a parallel one.

Page numbers: every divider and content slide carries the design system's `PageFooter`
(compact lockup + optional label at bottom-left, two-digit page number at bottom-right, band
y=1016..1044). The number is the slide's ordinal in the deck (cover = 01). Covers and the back
cover carry no footer.

## Shared grammar

| Element | Geometry | Type |
|---|---|---|
| Eyebrow | x=90, y=70 (covers: 140 / 250), 16px, tracking +2.5 to +3, uppercase, Bold / SemiBold, accent | `eyebrow` |
| Content title | x=90, y=110, w=1740 (880 next to a photo), 56px Light, lh 1.05, tracking -1, ink | `title` |
| Accent rule | x=90, y=290, 60x3 (cover2: y=220, 80x6 rounded) | automatic |
| Body zone | y=340 to y=944 | template-specific |
| Footer | logo 28px high at (54, 1016); label 18px at 49% / 39% opacity; page number 18px SemiBold right-aligned to x=1866 | `footer_label` |

Copy in any field may be a string or `{en: ..., gr: ...}`. Inline markup: `\n` line break,
`*italic*` emphasis (Regular italic), `~accent~` accent colour. See `deck-spec.md`.

## Covers

### `cover1` - hero photo on dark (the default cover)
- Photo card: (1140, 100) 720x880, radius 18, on a 135-degree accent-to-`#001A1F` gradient, photo at 92% opacity; a 240px vignette fades the card edge into the background.
- Title: x=90, y=220, w=900, 88px Light, lh 0.95, tracking -1.5, cream; `~accent~` spans are Electric Cyan `#00CFE7` (the second line in the design).
- Subtitle: 64px below the title, 28px Regular, white at 86%, lh 1.25.
- Meta: 90px below the subtitle, 16px at 78%, one line per list item.
- Logo: knockout, 56px high, bottom-left at (90, 1000).
- Limits: the flowed block (title + subtitle + meta) must end 32px above the logo (y<=912). Title 2-3 lines; subtitle 1-2 lines; up to 2 meta lines. Exceeding this is a spec error.

### `cover2` - editorial light cover
- Photo card: (1040, 60) 820x960, radius 24, accent underlay, soft shadow (0 30 80 -30 ink 40%).
- Accent rule (90, 220) 80x6; eyebrow at y=250 (SemiBold, tracking 3).
- Title: (90, 300) w=880, 96px Light, lh 0.96, tracking -2, ink; `*word*` = italic Regular.
- Subtitle: (90, 640) w=880, 26px, ink 78%, lh 1.35.
- Logo primary bottom-left; meta right-aligned inside the 880px column, bottom-aligned at y=1000.
- Limits: title <= 3 lines (340px zone); subtitle <= 4 lines.

### `cover3` - typographic, no image
- Diagonal hairlines (white 6%, every 40px) as a native line group; accent block 380x380 top-right; optional ghost `number` (200px Light, 18%).
- Eyebrow at y=140; title (90, 260) w=1350, 120px Light, lh 0.96, tracking -2, cream; `~accent~` spans are accent colour, italic Regular.
- Logo knockout bottom-left; meta right-aligned to x=1830, bottom-aligned at y=1000.
- Limits: title <= 4 lines.

## Dividers (all take `number`, `title`, optional `caption`, optional `footer_label`)

### `divider_image` - dark with image card
- Image card (760, 100) 1100x880 radius 24. Number (80, 360) 220px Light tracking -8 accent. Title (90, 600) w=580 64px Light. Caption (90, 700) w=580 22px cream 70%.
- Limits: title 1 line (<=14 characters at 64px); caption <= 6 lines.

### `divider_dark` - dark, type only
- Accent bar 12px on the left edge. Number (90, 380) 260px Light tracking -10 accent 95%. Title (580, 410) w=1250 84px Light. Body (580, 580) w=720 26px cream 70%.
- Limits: title <= 2 lines; caption <= 8 lines.

### `divider_bright` - bright on cream
- Accent field 720x720 bottom-right with a 24px top-left radius. Eyebrow at y=140 (Bold, tracking 3). Number (90, 220) 320px Light tracking -12 ink. Title (90, 620) w=1000 72px Light. Body (90, 730) w=800 24px ink 70%.
- Limits: title 1 line (<=22 characters); caption <= 5 lines.

## Content

### `content_image_right` - image right (1/2)
- Photo full-height on the right 820px. Eyebrow / title (w=880, **title in the accent colour**) / rule. Body (90, 340) w=880 22px body ink 85%, lh 1.55, 24px between paragraphs. Footnote pinned at y=900..970, 14px at 50%.
- Fields: `body` (string or list of paragraphs), `footnote`, `photo`.
- Limits: body <= ~1,000 characters (about 12 lines); footnote 1-2 lines.

### `content_columns` - numbered columns
- 2-4 columns in one row, 5-6 in two rows of three; 48px gutters inside the 1740px content width. Per column: number 64px Light accent; heading 26px SemiBold ink (24px below); body 18px body ink 78%, lh 1.55 (16px below).
- Fields: `columns: [{number?, heading, body?}]`.
- Limits: heading <= 2 lines; body <= ~220 characters per column (3 columns), ~150 (4 columns).
- Use it for pillars, principles, steps and agendas (a 4-6 item agenda = 4 columns or 2x3).

### `content_stat` - hero stat with supporting table
- Cream surface. Left column (938px): hero number 260px Light tracking -10, value in accent, optional raised unit at 120px; caption 26px ink 24px below. Right column (722px, x=1108): up to 6 rows (82px each from y=400): label 20px ink 70% left, value 32px SemiBold ink right, hairline ink 12% below each.
- Fields: `stat: {value, unit?, caption}`, `rows: [{label, value}]`.
- Limits: value <= 6 characters; caption <= 2 lines; 0-6 rows.

### `content_chart` - native chart (companion)
- With `body`: 560px text column left, chart in the remaining 1132px. Without: chart spans 1740px. Chart zone y=340..944.
- `chart: {type, categories, series: [{name, values}], number_format?, data_labels?, show_percentage?, hole_size?, gap_width?, hide_value_axis?}`; `type` in `column | bar | line | area | doughnut | stacked_column | stacked_bar` (`pie` is rejected).
- Styling is fixed: series in `00ADBF, 003841, 007B85, 939793, BEC1BE, 00CFE7`; Aptos 9pt labels; light value gridlines only; legend at the bottom for multi-series; 3.5pt lines with hollow markers; 60% doughnut hole.

### `content_table` - table (companion)
- Table at (90, 340) w=1740; header row 56px, body rows 64px; first column 34% wide. Header 18px SemiBold ink with a 2px ink rule; body 20px at 85%; numeric columns right-aligned 22px SemiBold; 1px ink-12% hairlines; no fills.
- Fields: `table: {headers, rows}`.
- Limits: at most 8 rows (the engine rejects more).

### `back_cover`
- Cream surface, primary lockup 96px high centred. No copy, no footer, no page number.

## Bilingual (`bi`) decks

The design system's `<T>` helper prints the English line first and the Greek line beneath at
55% opacity, Regular weight (headings in columns drop to 22px). Zones do not grow, so keep
bilingual copy short: titles that are 1 line in English, captions of 2-3 lines. Footer labels show
the English variant only (the JSX footer has no bilingual form). The validator fails a deck whose
estimated copy cannot fit; the fix is shorter copy or a single-language deck.

## Photos

`photo:` accepts a bundled key (`fields`, `heart`, `parthenon`, `skate`, `street`) or a path to an
image file. Images are centre-cropped to the template frame (`object-fit: cover`), never distorted.
Prefer portrait or square sources for `cover1` (720x880) and `cover2` (820x960); landscape for
`divider_image` (1100x880); portrait for `content_image_right` (820x1080).
