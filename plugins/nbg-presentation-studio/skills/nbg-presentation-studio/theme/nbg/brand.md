# NBG theme — unified brand manifest

This is the **single source of truth** for the NBG brand across both renderers. It
reconciles the two source design systems (the PPTX brand-system and the HTML design
system) into one token set. The detailed specifications live in the sibling files; this
manifest is the index and the reconciliation layer.

> **Themed module.** Everything NBG-specific lives under `theme/nbg/`. The renderers read
> tokens from here. To re-brand the skill later, supply a different theme folder and point
> `NBG_ASSETS_DIR` (PPTX) and `--assets` (HTML) at it — the engines stay unchanged.

| Concern | Detailed file |
|---|---|
| Colours (full palette) | [colors.md](colors.md) |
| Typography | [typography.md](typography.md) |
| Layouts & slide patterns | [layouts.md](layouts.md) |
| Exact dimensions (px / inch / EMU) | [dimensions.md](dimensions.md) |
| Charts (PptxGenJS / python-pptx props) | [charts.md](charts.md) |
| Charts (raw OOXML editing) | [ooxml-charts.md](ooxml-charts.md) |
| Icons | [icons.md](icons.md) |
| Asset library (icons/illustrations/logos/screenshots) | [asset-library.md](asset-library.md) |
| Digital-product tokens (apps, NOT slides) | [pillar-ds.md](pillar-ds.md) |
| Learned style preferences | [presentation-style-guide.md](presentation-style-guide.md) |

---

## Colours (the unified palette)

The two sources share an identical teal-led core. The unified palette is the core plus
the HTML system's two extra tokens.

| Token | Hex | Role |
|---|---|---|
| Dark Teal | `#003841` | Titles, headings, default ink |
| NBG Teal | `#007B85` | Brand, section numbers, accents, bumper pills |
| Cyan | `#00ADBF` | **Primary chart colour** |
| Bright Cyan | `#00DFF8` | Bullets only — **never** a background |
| Electric Cyan | `#00CFE7` | HTML-only bright accent (from the HTML design system) |
| Dark Text | `#202020` | Body text |
| Caption Gray | `#5A5F5A` | Captions, owner subtitles |
| Medium Gray | `#939793` | Secondary text, page numbers |
| Light Gray | `#BEC1BE` | Subtle dividers, borders |
| Off-white / Cream | `#F5F8F6` | Card / metric-box / light-section backgrounds |
| White | `#FFFFFF` | **PPTX slide background — ALWAYS** |
| Deep Black | `#0A1416` | HTML-only dark cover/divider backgrounds |
| Success | `#73AF3C` | Positive deltas in charts |
| Alert | `#AA0028` | Negative deltas in charts |

**Chart colour sequence (use in order):** `00ADBF, 003841, 007B85, 939793, BEC1BE, 00DFF8`.

**Background rule — the one real difference between the renderers:**
- **PPTX:** every slide background is white. No exceptions.
- **HTML:** content pages stay light (white / cream); covers and section dividers MAY use
  the deep-black (`#0A1416`) or large teal accent panels per the HTML templates. Use the
  **knockout** logo on dark backgrounds, the **primary** logo on light.

Never use the old NBG green `#006141` — it is retired; scan output for it and remove.

---

## Typography

- **Primary font:** Aptos. **Fallback:** Arial / Calibri (PPTX); in HTML use the stack
  `-apple-system, BlinkMacSystemFont, "Segoe UI", "Aptos", Helvetica, Arial, sans-serif`.
- Titles are **Regular** weight (not bold) except the Contents header and KPI numbers.
- Minimum sizes (hard floor): body ≥ 12pt (target 14pt), card titles ≥ 16pt, table cells
  ≥ 11pt, footnotes ≥ 8pt, page numbers 10pt. Full table in [typography.md](typography.md).
- **No em-dashes** in slide copy (they read as AI authorship) — use comma / colon / period.

---

## Dimensions & aspect

Both renderers are 16:9; only the unit differs.

| Renderer | Canvas | Unit |
|---|---|---|
| PPTX | 13.33″ × 7.5″ (`LAYOUT_WIDE`) | inches / EMU (12,192,000 × 6,858,000) |
| HTML | 1920 × 1080 px | CSS px (fixed artboard, viewport-fitted) |

Margins 0.37″; safe content band 1.1″–6.85″; footer band 6.85″–7.5″. Exact coordinates,
logo positions, and metric-card geometry are in [dimensions.md](dimensions.md).
For HTML, keep ≥ 32px between content groups and ≥ 72px clearance above the footer.

---

## Logos & imagery

| Use | PPTX (PNG, in `assets/`) | HTML (data-URI token, in `../../renderers/html/assets/`) |
|---|---|---|
| Content slide (small, bottom-left) | `nbg-logo-gr.png` | `{{LOGO_SMALL}}` |
| Cover / divider (large, bottom-left) | `nbg-logo-gr.png` (large geometry) | `{{LOGO_PRIMARY}}` (light bg) / `{{LOGO_KNOCKOUT}}` (dark bg) |
| Back cover (centred oval) | `nbg-back-cover-logo.png` | `{{LOGO_PRIMARY}}` centred |

- Always the **Greek** logo by default; preserve native aspect ratio (the NBG mark is an
  oval ~1.55:1 — never squish it to a square).
- HTML decks **must** embed every image as an inline `data:` URI via
  `node renderers/html/embed-assets.mjs` — never `file://`, absolute, or relative paths.
- Photography (`{{PHOTO_FIELDS|HEART|PARTHENON|SKATE|STREET}}`) is for HTML covers/dividers.
- Icons: prefer the bundled library (`assets/icons/`), else generate SVG per
  [icons.md](icons.md) (64×64, solid `#003841` fills, no strokes).

---

## Critical brand rules (enforced by QA)

1. **No pie charts** — doughnut for proportions.
2. **No "Thank You" slides** — plain back cover with centred logo.
3. **Page numbers on content slides only** — never on cover, divider, or back cover.
4. **White PPTX backgrounds always.**
5. **One key message per slide**, insight-driven action titles, scannable in 5–7 seconds.
6. **Logo on every slide** (small on content, large on cover/divider, oval on back cover).

See `../../pipeline/4-qa.md` for how these are checked per format.
