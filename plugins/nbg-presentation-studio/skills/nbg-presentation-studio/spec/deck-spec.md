# NBG Deck Spec — the unified slide specification

The **deck spec** is the single intermediate representation (IR) of a presentation in
this skill. The storyline and storyboard stages produce ONE deck spec; both renderers
consume it:

- **PPTX** (default): `renderers/pptx/nbg_build.py <spec>.yaml <out>.pptx` reads it directly.
- **HTML** (opt-in): the agent authors the 1920×1080 HTML deck from the SAME spec, using
  the templates in `renderers/html/templates/` and the theme tokens in `theme/nbg/`.

Keeping a single spec is what guarantees the HTML and PPTX outputs tell the same story
with the same numbers. Author the spec once, render twice.

The spec is YAML. It is consumed by `build_presentation()` in `renderers/pptx/nbg_build.py`.

---

## Top-level structure

```yaml
template: GR                      # GR (Greek logo, default) | EN
presentation:                     # OPTIONAL metadata block (McKinsey framing)
  title: "Q4 2025 Digital Banking Performance"
  audience: "Board of Directors"
  purpose: "Quarterly results review and strategic recommendations"
  main_recommendation: "Accelerate mobile-first investment to capture the opportunity"
slides:                           # REQUIRED — the ordered list of slides
  - type: cover
    content: { ... }
  - type: content
    content: { ... }
  - type: back_cover
```

- `template`: `GR` uses the Greek NBG logo (default and preferred); `EN` the English variant.
- `presentation`: optional. When present it records audience/purpose/recommendation and
  switches console output to "Pyramid Principle" mode. **Slides may live under
  `presentation.slides` OR at the top level** — the builder accepts either (top-level is
  what the bundled examples use).
- `slides`: the ordered list. Every deck **must** open with a `cover` and close with a
  `back_cover` (a plain slide with the centred logo — never a "Thank You" slide).

---

## Slide types

The builder classifies each slide by its `type` (and `recommended_visual`) and routes it
to a dedicated layout. Recognised types:

| `type` | Renders as | Page number? |
|---|---|---|
| `cover` | Title cover (48pt title, 24pt subtitle, large logo) | no |
| `divider` | Section divider (60pt number + 48pt title, large logo) | no |
| `contents` / `toc` | Table of contents (numbered sections + descriptions) | yes |
| `content` | Action-title slide with bullet points (+ optional bumper pill) | yes |
| `chart` | Chart slide (bar / line / doughnut / column) | yes |
| `waterfall` | Waterfall chart (stacked bars, +cyan / −red) | yes |
| `table` | Table slide (header row + data rows) | yes |
| `back_cover` | Plain back cover, centred oval logo, NO text | no |

Anything unrecognised falls back to `content`.

---

## Per-type `content` fields

### cover
```yaml
- type: cover
  content:
    title: "Digital Banking Performance"
    subtitle: "Q4 2025 Executive Summary"   # pipe-separated units allowed: "Cards | Digital | SSB"
    location: "Athens, Greece"
    date: "February 2026"
```

### divider
```yaml
- type: divider
  content:
    number: "01"            # zero-padded section number
    title: "Executive Summary"
```

### contents / toc
```yaml
- type: contents
  content:
    sections:
      - number: "01"
        title: "Market Overview"
        description: "Current landscape"     # optional
      - number: "02"
        title: "Recommendations"
```

### content
```yaml
- type: content
  content:
    title: "Digital channels exceeded all KPIs, driven by 23% mobile adoption growth"
    bumper: "KEY FINDING"          # optional ALL-CAPS section pill above the title
    points:                        # max 5; each is one scannable line (also accepts `paragraphs`)
      - "Mobile active users reached 2.8M, up 23% YoY"
      - "Digital transaction share grew to 78% of total volume"
      - "Customer satisfaction (NPS) improved 12 points to +45"
  key_message: "Digital is now the dominant channel"   # optional, used by storyline + QA
  recommended_visual: none        # bar_chart|line_chart|doughnut_chart|metric_cards|timeline|none
```

> **Titles are insight-driven ACTION TITLES** — full sentences that make a claim
> (`"Revenue grew 23% in Q4, exceeding plan"`), never topic labels (`"Q4 Revenue"`).
> Exactly **one** key message per slide. See `../pipeline/1-storyline.md`.

### chart

The chart **type** comes from the slide `type` field; the chart **data** lives **inside
`content`** as `categories` + `series` (the engine reads `content.categories` and
`content.series`).

```yaml
- type: chart                     # clustered column (default). Also: line_chart, bar_chart,
                                  # doughnut_chart, pie_chart (pie auto-remapped to doughnut)
  recommended_visual: bar_chart
  content:
    title: "Mobile adoption outpaced all competitors in 2025"
    bumper: "BENCHMARK"           # optional
    categories: ["Q4 2024", "Q4 2025"]
    series:                       # one entry per series; a legend appears when >1 series
      - name: "NBG"
        values: [2.28, 2.8]
      - name: "Eurobank"
        values: [2.10, 2.4]
```

For a proportion chart use `type: doughnut_chart` with a single series:
`categories: ["NBG","Eurobank","Others"]`, `series: [{name: "Share", values: [27,23,50]}]`.
**Pie charts are forbidden** — the validator rejects them; pie is auto-remapped to doughnut.

### waterfall
```yaml
- type: waterfall
  content:
    title: "Cost-to-serve fell €18M net across four levers"
    waterfall_items:
      - { label: "FY24 base", value: 120 }     # first item = starting total
      - { label: "Digital migration", value: -12 }
      - { label: "Automation", value: -9 }
      - { label: "Volume", value: 3 }
      - { label: "FY25", value: 102 }           # last item = ending total
```

### table
```yaml
- type: table
  content:
    title: "Key metrics versus systemic peers"
  table:
    headers: ["Metric", "NBG", "Eurobank", "Piraeus"]
    rows:
      - ["Assets (€B)", "78.5", "82.1", "75.3"]
      - ["CET1 %", "17.2%", "15.8%", "14.9%"]
    highlight_column: 1           # optional, 0-indexed column to emphasise
```

### back_cover
```yaml
- type: back_cover               # no content needed — plain slide, centred oval logo
```

---

## Post-build data injection (PPTX only)

For charts/tables that need to be edited after the deck is built (e.g. an Excel-driven
refresh), build once then inject:

```bash
python renderers/pptx/inject_chart_data.py base.pptx chart_config.json out.pptx
python renderers/pptx/inject_table_data.py base.pptx table_config.json out.pptx
```

See `renderers/pptx/SOURCE-README.md` for the JSON config schemas.

---

## How the HTML renderer uses this spec

The HTML path does not parse the YAML programmatically; the agent reads the spec and
authors a self-contained 1920×1080 deck that mirrors it slide-for-slide:

- one `.slide` element per spec slide, in order;
- the same titles, bumpers, points, chart data, and table data;
- NBG theme tokens from `theme/nbg/brand.md` (colours, fonts, spacing);
- a template from `renderers/html/templates/` chosen to match each slide's type/visual;
- **every image referenced as a `{{TOKEN}}` placeholder**, then inlined with
  `node renderers/html/embed-assets.mjs`.

See `../pipeline/3-render.md` for the full HTML procedure and `../pipeline/4-qa.md` for
the HTML verification gate.

---

## Worked examples

Complete, validated specs live in `examples/`:

- `examples/executive-summary.yaml` — concise board-level deck (Pyramid Principle)
- `examples/quarterly-report.yaml` — data-rich quarterly report
- `examples/strategy-deck.yaml` — strategy narrative with dividers

All three build clean and pass 17/17 PPTX validation checks.
