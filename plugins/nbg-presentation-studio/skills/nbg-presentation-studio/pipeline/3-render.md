# Pipeline Stage 3 — Render

**Goal:** produce the deliverable from the finished deck-spec.
**Two render targets, ONE spec:** PPTX (default) and HTML (opt-in). Render PPTX unless the user
explicitly asks for HTML. The deck-spec from Stages 1–2 is the single source of truth for both.

All commands run from the **skill root**. The PPTX renderer is python-pptx based and builds **from
scratch** — never from a `.pptx` template file.

---

## (a) PPTX — DEFAULT

### Build
```bash
python renderers/pptx/nbg_build.py <spec>.yaml <out>.pptx
```
- Takes the deck-spec YAML, emits a fully formatted NBG PPTX.
- **Auto-runs the validator** on completion (it shells out to `renderers/pptx/nbg_validate.py` on the
  output), so you get a brand-compliance report immediately. Stage 4 still runs it as the formal gate.
- Builds every slide programmatically from brand specs — does NOT open or copy any template `.pptx`.

### Post-build data injection (optional)
When charts/tables are placeholders that need real data injected after the build:
```bash
python renderers/pptx/inject_chart_data.py <in>.pptx <chart_config>.json <out>.pptx
python renderers/pptx/inject_table_data.py <in>.pptx <table_config>.json <out>.pptx
```
Config shapes (slide index, chart/table index, data) are documented in `renderers/pptx/SOURCE-README.md`.

### Output naming & location
- Save final PPTX to **`~/Downloads/`** as `YYYYMMDDHHMM_descriptive_name.pptx`.
- Timestamp in Athens time: `TZ='Europe/Athens' date '+%Y%m%d%H%M'` (timestamp = save time, updates on re-save).
- All lowercase; spaces/hyphens → underscores.

---

## (b) HTML — OPT-IN (only when the user asks)

Author a single self-contained **1920×1080** HTML deck, then inline all assets.

### 1. Author from templates + theme tokens
- Start from the templates in `renderers/html/templates/` (e.g. `nbg-design-system.html`,
  `slide-templates.jsx`); use theme tokens/colors from `../theme/nbg/`.
- **Reference every image as a `{{TOKEN}}` placeholder** — never paste inline data URIs by hand.
  Define each token once (e.g. a CSS `background-image` class) and reuse it.
- Available tokens: `{{LOGO_PRIMARY}}` `{{LOGO_KNOCKOUT}}` `{{LOGO_SMALL}}` `{{PHOTO_FIELDS}}`
  `{{PHOTO_HEART}}` `{{PHOTO_PARTHENON}}` `{{PHOTO_SKATE}}` `{{PHOTO_STREET}}`
  (tokens map to `renderers/html/assets/<name>.datauri.txt` by lower-casing and `_`→`-`).

### 2. Inline assets
```bash
node renderers/html/embed-assets.mjs <deck>.html        # overwrites in place
node renderers/html/embed-assets.mjs <deck>.html -o out.html   # write to a new file
```
- Replaces each `{{TOKEN}}` with its `data:image/...` URI. Fails loudly on an unknown token or a
  non-image asset. Resolves assets relative to the script, so it works from any cwd.

The HTML deck is verified in Stage 4 with `verify-deck.mjs --strict` (and optional screenshots).

---

## Which target?

| Situation | Render |
|---|---|
| Default / board deck / "make a presentation" | **PPTX** |
| User explicitly asks for HTML / web / a self-contained page | **HTML** |

Both consume the same deck-spec — only the renderer differs. Proceed to **Stage 4 — QA**, branched by
the format you produced.
