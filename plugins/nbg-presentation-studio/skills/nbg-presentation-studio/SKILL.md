---
name: nbg-presentation-studio
description: Use when creating, redesigning, or polishing National Bank of Greece (NBG)-branded presentations, slide decks, or board decks — as editable PowerPoint (PPTX, the default) or as self-contained HTML slides. Runs the full McKinsey-grade pipeline (Pyramid-Principle narrative, insight-driven action titles, NBG brand system, charts/tables) through one unified deck spec to either renderer, then an automated brand + quality QA gate. Triggers include: create presentation, make slides, build a deck, board-ready deck, ExCo/board pack, redesign this deck, polish slides, NBG presentation, NBG slides, HTML slides, pptx, executive summary deck, quarterly report deck, strategy deck.
---

# NBG Presentation Studio

Create **board-ready, NBG-branded presentations** from a brief, raw content, an existing
deck, or rough notes — and render them as **editable PowerPoint (PPTX, default)** or
**self-contained HTML slides (opt-in)**, from one source of truth.

This skill consolidates a PPTX engine, an HTML design system, a McKinsey-style narrative
pipeline, and a brand+quality QA gate. The discipline is fixed: **one key message per
slide, insight-driven action titles, the 5–7 second test, NBG brand compliance, and a QA
gate that nothing ships without passing.**

---

## How it works — one spec, two renderers

```
INPUT (brief / content / existing deck / notes)
   │
   ├─ 1. STORYLINE   → narrative: Pyramid Principle, action titles, one message/slide
   ├─ 2. STORYBOARD  → layout: NBG templates, positioning, chart/visual choices
   │        │
   │        ▼   produces ONE  ┌─────────────────────────┐
   │            ───────────►  │  DECK SPEC (YAML, the IR)│   spec/deck-spec.md
   │                          └─────────────────────────┘
   │                               │                 │
   ├─ 3. RENDER ──────────────────►│ PPTX (default)  │ HTML (opt-in)
   │                          python-pptx          1920×1080 templates
   │                          nbg_build.py         + data-URI embed
   │                               │                 │
   ├─ 4. QA GATE  ─────────────────┤ nbg_validate.py │ verify-deck --strict
   │              (branched by      + content QA      + screenshot review
   │               format; max 2 remediation cycles — never ship a FAIL)
   │                               ▼                 ▼
   └─ 5. LEARN (optional)  ──►  board-ready deck delivered
```

Each stage is documented in `pipeline/`:
`pipeline/1-storyline.md` · `pipeline/2-storyboard.md` · `pipeline/3-render.md` ·
`pipeline/4-qa.md` · `pipeline/5-learning.md`. **Read the stage file before running that
stage.** The deck-spec contract is `spec/deck-spec.md`; the brand is `theme/nbg/brand.md`.

---

## Modes

Pick the mode from the request; they share the same pipeline and QA gate.

| Mode | Trigger | Pipeline |
|---|---|---|
| **Create** | "create / make a presentation", a brief, raw content | full pipeline (1→5) |
| **Redesign** | "redesign this deck", a path to an off-brand `.pptx`/`.pdf`/`.docx` | extract content (`markitdown <file>`) → 1→4 |
| **Polish** | "polish these slides", already-structured content | skip 1–2; apply theme + render + QA |
| **Review** | "learn from my final deck", `/presentation-review`-style | stage 5 only (compare final vs draft, update style guide) |

---

## Output format (default PPTX, HTML opt-in)

- **Default: PPTX.** If the user does not specify a format, produce an editable PowerPoint.
- **HTML** when the user asks for "HTML", "web slides", "a shareable link/page", or an
  in-browser preview. Produce a self-contained 1920×1080 HTML deck with embedded assets.
- **Both** only when explicitly requested — render PPTX and HTML from the same spec so they
  stay in sync.

State the chosen format in your first response so the user can redirect.

---

## Setup (one-time per machine)

**PPTX engine (Python, via uv):**
```bash
cd renderers/pptx
uv venv .venv
uv pip install --python .venv/bin/python -r requirements.txt   # python-pptx, pyyaml, lxml, defusedxml
```
Invoke the engine with that interpreter: `renderers/pptx/.venv/bin/python renderers/pptx/nbg_build.py ...`.

**HTML toolchain (Node ≥ 16):** the three scripts in `renderers/html/` run on a stock Node with
zero npm dependencies.

**agent-browser (REQUIRED for browser-dependent runs — HTML render, in-browser preview, visual QA):**
the browser-automation CLI the skill uses to open, screenshot, and visually verify HTML decks. The
default PPTX renderer needs no browser, so a pure-PPTX run does not require it.
- Install — macOS: `brew install agent-browser` · any platform (Node ≥ 18): `npm install -g agent-browser`
- Detect: `command -v agent-browser` (then `agent-browser --version`)
- Homepage https://agent-browser.dev/ · repo https://github.com/vercel-labs/agent-browser

A run that will touch a browser must clear the **Preflight gate** below before it starts.

---

## Preflight gate — agent-browser (browser-dependent runs only)

**Trigger:** the moment a run will touch a browser — before authoring/rendering an HTML deck
(Stage 3, HTML path), before any in-browser preview, and before the Stage 4 visual/screenshot QA.
A **pure-PPTX run skips this gate entirely** (PPTX produces no browser output, so agent-browser is
not needed). Run the check *before* you start that browser work, not after.

**1 — Detect**
```bash
command -v agent-browser >/dev/null 2>&1 && agent-browser --version || echo "MISSING"
```

**2 — Present** → continue with the browser step.

**3 — MISSING** → STOP. Do not silently continue, fall back to another tool, or skip the visual QA.
Ask the user how to proceed (use `AskUserQuestion`) and offer two paths:

| Choice | What you do |
|---|---|
| **Install it for me (automated)** | Only with the user's explicit go-ahead, run the install for their platform — macOS: `brew install agent-browser`; otherwise (Node ≥ 18): `npm install -g agent-browser`. Then re-run the detect command and proceed only once it prints a version. |
| **I'll install it myself (manual)** | Point the user to the commands above (or https://agent-browser.dev/), then wait. Re-detect before proceeding. |

Installing software changes the user's machine: never run the automated install without explicit
consent, and never substitute a missing agent-browser with another browser or skip the visual step
on your own — that violates the no-fallback rule.

---

## Run it

### PPTX (default)
1. Build the deck spec (stages 1–2) → save as `deck.yaml` (see `spec/deck-spec.md`).
2. Render and auto-validate:
   ```bash
   renderers/pptx/.venv/bin/python renderers/pptx/nbg_build.py deck.yaml \
       ~/Downloads/$(date +%Y%m%d%H%M)_<name>.pptx
   ```
   `nbg_build.py` builds every slide from scratch (never from a template file) and runs
   `nbg_validate.py` automatically.
3. Complete the content QA in `pipeline/4-qa.md`. Remediate and re-render until clean.

### HTML (opt-in — browser-dependent)
0. **Preflight:** clear the agent-browser gate above. This path opens a browser, so if
   agent-browser is missing, install it (or ask the user) before continuing — do not proceed without it.
1. Build the same deck spec (stages 1–2).
2. Author a self-contained 1920×1080 deck from the spec using `renderers/html/templates/`
   and theme tokens. Reference **every** image as a `{{TOKEN}}` placeholder.
3. Embed assets, then run the browser-free strict gate:
   ```bash
   node renderers/html/embed-assets.mjs deck.html
   node renderers/html/verify-deck.mjs  deck.html --strict      # must exit 0
   ```
   Then capture and **READ** one PNG per slide with agent-browser (recipe in `pipeline/4-qa.md`).
Full procedure: `pipeline/3-render.md` and `pipeline/4-qa.md`.

---

## Brand essentials (full spec: `theme/nbg/brand.md`)

```yaml
dimensions: { pptx: 13.33in x 7.5in (LAYOUT_WIDE), html: 1920x1080, ratio: 16:9 }
colors:
  title:   "#003841"   # Dark Teal
  brand:   "#007B85"   # NBG Teal (section numbers, bumper pills, accents)
  chart:   "#00ADBF"   # Cyan (primary chart colour)
  bullet:  "#00DFF8"   # Bright Cyan (bullets only, never a background)
  body:    "#202020"
  bg:      "#FFFFFF"    # PPTX always white; HTML covers may use #0A1416
fonts:   { primary: Aptos, fallback: Arial }
logo:    { greek default, small on content, large on cover/divider, oval centred on back cover }
```

**Non-negotiable rules (QA-enforced):** no pie charts (doughnut instead) · no "Thank You"
slides (plain back cover) · page numbers on content slides only · one message per slide ·
action titles (full-sentence claims) · scannable in 5–7 seconds · no em-dashes in copy.

---

## Layout

```
nbg-presentation-studio/
├── SKILL.md                     # this file — the orchestrator
├── spec/
│   ├── deck-spec.md             # the unified deck-spec contract (IR)
│   └── examples/                # 3 validated example specs
├── theme/nbg/                   # the NBG theme module (swappable)
│   ├── brand.md                 # unified token manifest (start here)
│   ├── colors.md typography.md layouts.md dimensions.md
│   ├── charts.md ooxml-charts.md icons.md asset-library.md pillar-ds.md
│   ├── presentation-style-guide.md   # learned preferences (updated by stage 5)
│   └── assets/                  # logos, icons (338), illustrations (21), screenshots (117), photos
├── renderers/
│   ├── pptx/                    # python-pptx engine
│   │   ├── nbg_build.py         # spec → .pptx (auto-runs the validator)
│   │   ├── nbg_validate.py      # 17 brand/quality checks
│   │   ├── inject_chart_data.py inject_table_data.py
│   │   └── requirements.txt
│   └── html/                    # HTML toolchain (Node, zero-dep)
│       ├── templates/           # 1920×1080 slide templates + design system reference
│       ├── embed-assets.mjs     # {{TOKEN}} → inline data: URI
│       ├── verify-deck.mjs      # headless strict QA gate
│       ├── screenshot-deck.mjs  # optional visual capture
│       └── assets/              # data-URI assets for embedding
└── pipeline/                    # 1-storyline · 2-storyboard · 3-render · 4-qa · 5-learning
```

---

## Quality bar

Every deck this skill delivers should look like it came from a top-tier European bank's
internal design team. **Quality over speed. Brand consistency over creativity. Clarity over
cleverness.** A deck is done only when its QA gate (`pipeline/4-qa.md`) passes for the
chosen format(s).
