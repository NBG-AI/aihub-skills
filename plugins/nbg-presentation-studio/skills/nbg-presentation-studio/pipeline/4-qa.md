# Pipeline Stage 4 — QA Gate

**Mandatory final gate. Nothing ships while QA is FAIL.** Review with fresh eyes as an independent
reviewer. The gate is **branched by render format**: run the PPTX branch or the HTML branch (whichever
Stage 3 produced), then apply the **shared content gate** to either.

All commands run from the **skill root**.

---

## PPTX branch

### Layer 1 — Technical brand compliance (automated)
```bash
python renderers/pptx/nbg_validate.py <out>.pptx
```
**Must report 0 failures.** Any failure → automatic FAIL; fix before touching Layer 2.
The validator runs these **17 check categories** (in order):

1. Slide count
2. Dimensions (13.33"×7.5" LAYOUT_WIDE)
3. Colors (all within NBG palette)
4. Fonts (Aptos/Arial/Calibri/Tahoma only)
5. Logo present (in media files)
6. Back cover (last slide plain, no "Thank You")
7. Element boundaries (no overflow off slide edges)
8. Color contrast (text readable vs background)
9. Decorative elements (no rogue ellipses/stars/hearts)
10. Pie charts (none — must be doughnut)
11. Thank-you slides (no forbidden closing phrases)
12. Text margins (zero margins on text boxes)
13. Content safe zones (vertical ~1.1"–6.85", horizontal ~0.37"–12.96")
14. Font sizes (10pt floor; 8pt allowed for footnotes/sources only)
15. Content spacing (≥0.15" gap between title and first content element)
16. Title overflow (titles ≤80 chars for single-line fit)
17. Competitor banks (bank charts use official brand colors + logos)

### Layer 2 — Content quality (manual, only after Layer 1 passes)
Extract per-slide content (python-pptx / XML) and assess:

- **2A Message clarity** — title is an action title (not a label); one message per slide; passes "So what?"; body supports the title's claim.
- **2B Visual balance** — rate each content slide **A–D**:
  | A | B | C | D |
  |---|---|---|---|
  | Visual + concise text, clear eye path | Text-dominant but with structural visuals (cards, icon bullets) | Heavy text but well-structured/scannable | Text wall, or visual with no context |
  **D never ships.** Max 2 consecutive slides at C or below. Cover/divider/back_cover exempt; exec-summary may be C.
- **2C Layout variety** — no 3+ consecutive identical layouts; ≥2 distinct layout types; ≥1 full-width visual slide in decks of 8+.
- **2D Scannability (5–7s)** — ≤6 bullets/slide; ≤2 lines/bullet; comfortable whitespace.
- **2E Font sizes** — title 24pt (fail <20), body/bullets 12pt (fail <12), metric value 18pt, labels/table/chart-labels 11pt, footnotes 8pt, page # 10pt. **10pt floor** (footnotes/sources the only exception). Fix = enlarge/reduce content, never keep small text.
- **2F Structure** — cover first (subtitle lists units), plain back cover last, dividers for 8+ slide multi-topic decks, page numbers on content slides only, logo on every slide.

---

## HTML branch

### Hard gate (automated)
```bash
node renderers/html/verify-deck.mjs <deck>.html --strict
```
**Must exit 0.**
- **Hard failures (always):** unresolved `{{TOKEN}}` placeholders; any image referenced by
  `file://` / absolute / relative / `http(s)://` instead of a `data:` URI; zero embedded images.
- **`--strict` also fails on:** fewer than `--min-images` embedded images (default 2); file smaller
  than `--min-bytes` (default 200000) — the photo-less-deck tell; bare `>NBG<` / `>NPG<` text nodes
  that may be a text/box substitute for the real logo lockup.

### Visual check (optional, needs a browser)
```bash
node renderers/html/screenshot-deck.mjs <deck>.html
```
- Writes one PNG per slide at **1366×768 and 1440×900** (default viewports).
- Exit codes: 0 = written, 1 = error, **3 = no browser** (soft signal — fall back to the `--strict`
  gate above, which is mandatory on headless hosts).
- **Then READ each PNG** and inspect for clipping, overlap, and missing assets.

---

## Shared content gate (both formats)

Regardless of format, the deck must satisfy the content quality bar: action titles, one message per
slide, no D-rated/wall-of-text slides, layout variety, 5–7s scannability, minimum font sizes, and
correct structure (cover → content → back cover). See Layer-2 criteria above; apply them to HTML by
reading the screenshots.

---

## Remediation loop (max 2 cycles)

```
Render → QA ──PASS──▶ SHIP
            └─FAIL──▶ fix list → re-render → QA (retry) ──PASS──▶ SHIP
                                              └─FAIL (2nd) ──▶ flag remaining issues to user
```

1. On FAIL, produce a specific, actionable fix list (slide number + exact fix).
2. **Route fixes back:** title/message/narrative fixes → **Stage 1 (storyline)**; layout/visual/brand
   fixes → **Stage 3 (render)**.
3. Re-render, then re-run this gate.
4. **Maximum 2 remediation cycles.** If still failing after 2 rounds, stop and present the remaining
   issues to the user — do not silently ship.

**NEVER declare a deck ready while QA is FAIL.**
