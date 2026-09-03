# Deck spec - the YAML contract

`build_deck.py` consumes one YAML file. The complete, validated example is
`spec/examples/design-system-showcase.yaml` (one slide per template with the copy of the design
system's own examples). Copy it and replace the content.

```yaml
deck:
  title: "Q1 2026 strategy update"     # document title (core properties)
  style: briefing                      # briefing (default) | design-system
  lean: true                           # briefing: false = full-length deck by request; lean limits become warnings
  language: en                         # en | gr | bi   (default en)
  show_logo: true                      # default true
  accent: "#007B85"                    # design-system only: global accent (#003841 #007B85 #00ADBF #00CFE7); rejected in briefing
  footer_label: "Strategy update"      # optional default footer label (briefing: faint uppercase footer; design-system: dividers / content)

slides:                                # ordered; first must be a cover; end with back_cover
  - template: cover1                   # see references/templates.md
    title: "Placeholder title\n~that may run on two lines.~"
    subtitle: "..."
    meta: ["Athens", "14 / 03 / 2026"] # list of short lines, or one string
    photo: street                      # bundled key or a file path
    accent: "#003841"                  # optional per-slide override
    notes: "Speaker notes for this slide."
```

## Copy fields

Any copy field (`title`, `subtitle`, `eyebrow`, `caption`, `body` items, `heading`, `label`,
`meta` items, `footer_label`, `notes`, table cells) is a **string** or a **mapping**:

```yaml
title: "Building *tomorrow*, today."
title: { en: "Building *tomorrow*, today.", gr: "Χτίζοντας το *αύριο*, σήμερα." }
```

- `language: en` uses `en`; `gr` uses `gr`; `bi` prints both (Greek beneath, 55% opacity).
- A plain string is language-neutral and is shown as-is in every language.
- A mapping missing the requested language is a spec error.

Inline markup inside a string:

| Markup | Meaning | Design use |
|---|---|---|
| `\n` | semantic line break | the `<br/>` in cover titles |
| `**text**` | strong: SemiBold, ink colour | the bold spans inside muted briefing copy |
| `*text*` | emphasis: italic, Regular weight | "Building *tomorrow*, today." |
| `~text~` | accent span: accent colour (cover1: Electric Cyan; cover3: accent + italic) | second title line on covers |
| `\*`, `\~` | literal characters | |

## Per-template fields (briefing family)

| Template | Required | Optional |
|---|---|---|
| `brief_cover` | `title` | `eyebrow`, `subtitle`, `sections` (<= 3 of `{heading, text}`), `foot_left`, `foot_right` |
| `brief_cards` | `title`, `cards` (1-12 of `{heading, items?, text?, stat?, label?}`) | `tag`, `sub`, `meta` (<= 2 lines), `intro`, `callout` (`{title, text?, badge?, tone?}`), `timeline` (`{label?, phases: [{title, text?, date?, tone?}]}`), `note` |
| `brief_statement` | `title` | `eyebrow`, `subtitle` |
| `brief_table` | `title`, `table` (`{columns: [{header, width, kind?}], rows: [{status?, cells: [...]}]}`) | `tag`, `sub`, `meta`, `flow` (`{label?, steps: [{text, sub?, cond?}]}`), `rail` (`{label?, items: [{key, note?, tone?}], note?}`), `band` (1-2 of `{key, text}` / `{key, asks: [...]}`) |
| `brief_panels` | `title`, `panels` (1-3 of `{title, blocks: [...]}`) | `tag`, `sub`, `meta` |
| `brief_chart` | `title`, `chart` (`{type, categories, series}`) | `tag`, `sub`, `meta`, `body`, `note`, chart options |

All content templates accept `intro` (<= 3 lines). Block types inside `panels[].blocks`: `table` (same
fields as `brief_table.table`), `timeline`, `matrix` (`header?`, `rows: [{name, status: {label, tone}}]`),
`box` (`title`, `pill?: {label, tone}`, `items?`, `text?`), `ask` (`title`, `items`), `note` (`text`),
`list` (`items`), `text` (`text`), `steps` (`label?`, `steps`).

Every briefing slide accepts `notes` and `footer_label`. `accent` is not accepted (fixed #007B85).

## Per-template fields (design-system family)

| Template | Required | Optional |
|---|---|---|
| `cover1` | `title` | `subtitle`, `meta`, `photo`, `accent` |
| `cover2` | `title` | `eyebrow`, `subtitle`, `meta`, `photo`, `accent` |
| `cover3` | `title` | `eyebrow`, `number` (ghost numeral), `meta`, `accent` |
| `divider_image` | `number`, `title` | `caption`, `photo`, `footer_label`, `accent` |
| `divider_dark` | `number`, `title` | `caption`, `footer_label`, `accent` |
| `divider_bright` | `number`, `title` | `eyebrow`, `caption`, `footer_label`, `accent` |
| `content_image_right` | `title` | `eyebrow`, `body` (string or list), `footnote`, `photo`, `footer_label`, `accent` |
| `content_columns` | `title`, `columns` (2-6 of `{heading, body?, number?}`) | `eyebrow`, `footer_label`, `accent` |
| `content_stat` | `title`, `stat: {value, caption}` | `stat.unit`, `rows` (0-6 of `{label, value}`), `eyebrow`, `footer_label`, `accent` |
| `content_chart` | `title`, `chart: {type, categories, series}` | `body`, `eyebrow`, `footer_label`, `accent`, chart options |
| `content_table` | `title`, `table: {headers, rows}` (<= 8 rows) | `eyebrow`, `footer_label`, `accent` |
| `back_cover` | - | - |

Every slide accepts `notes` (speaker notes) and `footer_label` (dividers / content).

## Errors the builder raises (no silent fallbacks)

- unknown style; a template of the other family; `accent` in a briefing deck; an unknown `tone`;
- briefing copy that does not fit its zone (head longer than one line, cards, table rows, bands,
  panel blocks that would cross y=976), table column widths not summing to 1;
- unknown template, first slide not a cover, missing required field, empty slide list;
- accent outside the four teals, or invisible on the template's surface;
- copy mapping missing the requested language; `bi` mapping without both variants;
- photo key that is neither bundled nor an existing file;
- `chart.type: pie`, unknown chart type, series/category length mismatch;
- more table rows than fit; more than 6 stat rows; 1 or more than 6 columns;
- a `cover1` copy block that would reach the logo.

Warnings (printed as `build warning:`) flag copy that is likely to exceed a fixed zone; the
validator then fails the deck if the estimate is clearly over. Treat every warning as a fix item.

## Outputs

- `out.pptx` - 13.333 x 7.5 in (16:9), one slide per spec entry, slide names = template names,
  speaker notes attached, document title from `deck.title`.
- Validator report on stdout; exit code 0 = built and passed, 1 = spec error, 2 = validation FAIL.
