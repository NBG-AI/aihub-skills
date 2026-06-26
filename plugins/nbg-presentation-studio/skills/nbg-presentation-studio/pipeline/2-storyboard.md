# Pipeline Stage 2 — Storyboard (Layout)

**Goal:** decide HOW each slide looks. Pick the NBG layout per slide type, position every element,
select chart types, and specify visual detail.
**You refine the deck-spec in place** — add `layout`, element positions, chart specs, and visual notes
to each slide entry from Stage 1. Do not change the narrative.
**You decide the blueprint, not the final pixels** — rendering happens in Stage 3.

**Never invent coordinates.** All exact numbers live in the theme files — cite them:
`../theme/nbg/dimensions.md` (slide/margins/logo/page-number), `../theme/nbg/layouts.md` (per-layout
boxes), `../theme/nbg/charts.md` (chart configs), `../theme/nbg/colors.md` (palette),
`../theme/nbg/typography.md` (fonts/sizes). Check `../theme/nbg/presentation-style-guide.md` for learned
layout/chart/density preferences first.

---

## Core principles

1. **Layout matches content** — every layout choice supports the message.
2. **White space is power** — generous breathing room; content fills ~60–85% of the safe area, never cramped, never empty.
3. **Visual hierarchy** — guide the eye to what matters first.
4. **NBG consistency** — only NBG colors, Aptos font, brand-spec positions.
5. **Visual-first** — never an all-text slide; convert bullets to cards/charts/icons/timelines.

---

## Layout selection by slide type

| Slide need | Layout | Coordinates in |
|---|---|---|
| Title / intro | `cover` (large logo) | `../theme/nbg/layouts.md` |
| Section break | `divider` (number + title, large logo) | `../theme/nbg/layouts.md` |
| TOC | `contents` (numbered section list) | `../theme/nbg/layouts.md` |
| Single idea, prose/bullets | `full_width` | `../theme/nbg/layouts.md` |
| Two parallel ideas | `two_column` 50/50 | `../theme/nbg/layouts.md` |
| Text + supporting chart | `two_column_text_chart` 40/60 | `../theme/nbg/layouts.md` |
| Three parallel items | `three_column` | `../theme/nbg/layouts.md` |
| KPIs (3–6 metrics) | `metric_cards` | `../theme/nbg/layouts.md` |
| Closing | `back_cover` (centered oval logo, no text) | `../theme/nbg/layouts.md` |

Slide canvas is 13.33" × 7.5" (LAYOUT_WIDE). Standard side margins, content area, logo placement
(small on content, large on covers/dividers), and page-number box are all defined in
`../theme/nbg/dimensions.md`. Page numbers on content slides only — never cover/divider/back_cover.

---

## Positioning rules

- Keep all elements inside the **content safe zone** (vertical ~1.1"–6.85", horizontal ~0.37"–12.96") — exact bounds in `../theme/nbg/dimensions.md`.
- Title sits at the top in a **tight** box; leave ≥0.15" (ideally 0.2–0.3") gap before the first content element.
- Footnotes/source citations go above the footer exclusion zone; never overlap the logo or page number.
- Long (two-line) titles get a taller title box; size body boxes to actual content (no 5"-tall empty boxes).

## Text-box standards (apply to EVERY text element)

| Rule | Value | Why |
|---|---|---|
| `margin` | `0` | Default margins shift text unpredictably; zero gives pixel-perfect control |
| `valign` | `top` | Middle/bottom makes text jump when content changes; top is predictable |
| sizing | tight | Oversized boxes create invisible click targets and layering issues |

Font is **Aptos** throughout; colors only from `../theme/nbg/colors.md` (titles dark teal `003841`,
body `202020`, bullets bright cyan `00DFF8`, background white). Min font sizes enforced in Stage 4 QA.

---

## Chart-type selection

| Content | Chart | Notes |
|---|---|---|
| Comparison (2–5) | bar/column | explicit NBG colors, value labels |
| Trend over time | line **or** area | smooth curves, 3pt lines, visible markers |
| Proportions (≤5) | **doughnut** | **NEVER pie** |
| Financial flow | waterfall | |
| Distribution | doughnut / stacked bar | |

Full chart configs (colors, axes, label sizes, hole size) are in `../theme/nbg/charts.md` — reference,
don't reinvent.

---

## Systemic-bank comparison slides (NBG vs Eurobank, Piraeus, Alpha)

Mandatory rules — note them in the spec so Stage 3 renders correctly:

1. **Manual bars, NOT the chart engine** — build the bar chart with shapes so bars and logos share the
   same `centerX` and align perfectly (the chart engine's auto-layout makes logo centering unreliable).
2. **Official brand colors** — NBG `#007B85`, Eurobank `#CA2029`, Piraeus `#FDB913`, Alpha `#02509C`. No generic palette substitutes.
3. **Bank logos replace text axis labels** — centered under each bar.
4. **NBG oval logo aspect ratio** — NBG logo is oval (96×62, ratio 1.55:1); render via the `addBankLogo()` helper so it is **never squished to square**. Other banks' logos are square (64×64).
5. **Tables too** — include logos and color the bank name text with the bank's brand color.

Spec note example:
```
visual_type: manual_bar_chart   # shapes, NOT chart engine — guarantees logo-bar alignment
chart_axis: bank_logos          # logos replace text labels
colors: per_bank_brand          # NBG=#007B85 Eurobank=#CA2029 Piraeus=#FDB913 Alpha=#02509C
```

---

## Quality gate before handing to Stage 3

- [ ] Every slide has a `layout` and all element positions within slide bounds
- [ ] Standard margins respected; small logo on content slides; page numbers on content only
- [ ] All text boxes `margin:0`, `valign:top`, tight sizing
- [ ] Colors from NBG palette only; font is Aptos
- [ ] No pie charts (doughnut); line charts smooth/3pt/markers
- [ ] Back cover = centered oval logo, no text
- [ ] Adequate white space; clear visual hierarchy; no all-text slides
- [ ] Bank-comparison slides flagged for manual shapes + brand colors + oval logo

**Do NOT:** write the narrative, generate the actual PPTX/HTML, use non-NBG colors/fonts, crowd slides,
guess positions (use the theme files), specify pie charts, or add "Thank You" text.
