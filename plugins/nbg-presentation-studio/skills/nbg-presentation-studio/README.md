# NBG Presentation Studio

A single Claude Code skill that creates **board-ready, NBG-branded presentations** and
renders them as **editable PowerPoint (PPTX, default)** or **self-contained HTML slides
(opt-in)** — from one unified deck spec, through a McKinsey-grade narrative pipeline and an
automated brand + quality QA gate.

It consolidates two predecessor skills:

- the **`decks`** plugin (PPTX engine, multi-agent narrative pipeline, brand system, QA
  validator, learning loop) — from `plessas-marketplace`;
- the **`nbg-design`** skill (1920×1080 HTML design system, slide templates, deterministic
  asset embedding, headless verification) — from `aihub-skills`.

Both share the same NBG brand DNA (Aptos, 16:9, teal palette), so they sit on one theme.
HTML capability comes from `nbg-design`; deterministic, validated PPTX from `decks`.

## Quick start

```bash
# One-time: set up the PPTX engine (uv-managed venv)
cd renderers/pptx && uv venv .venv && uv pip install --python .venv/bin/python -r requirements.txt && cd -

# PPTX (default) — build + auto-validate from a deck spec
renderers/pptx/.venv/bin/python renderers/pptx/nbg_build.py spec/examples/executive-summary.yaml /tmp/demo.pptx

# HTML (opt-in) is browser-dependent — it requires the agent-browser CLI (preflight gate).
#   Install once: brew install agent-browser   (or: npm install -g agent-browser)
#   Detect:       command -v agent-browser
node renderers/html/embed-assets.mjs deck.html
node renderers/html/verify-deck.mjs  deck.html --strict   # browser-free static gate
node renderers/html/inspect-deck.mjs deck.html            # agent-browser DOM quality inspection
# then capture + READ one PNG per slide (inspect-deck --screens, or screenshot-deck.mjs); see pipeline/4-qa.md
```

In Claude Code, just ask: *"create an NBG board deck on Q4 results"* (→ PPTX) or
*"…as HTML slides"* (→ HTML). The skill drives the whole pipeline.

## What's where

| Path | Purpose |
|---|---|
| `SKILL.md` | The orchestrator — entry point, pipeline, modes, format selection |
| `spec/deck-spec.md` | The unified deck-spec contract (the IR both renderers consume) |
| `spec/examples/` | Three validated example specs |
| `theme/nbg/brand.md` | Unified brand token manifest (single source of truth) |
| `renderers/pptx/` | python-pptx build + 17-check validator + chart/table injectors |
| `renderers/html/` | HTML toolchain (Node, zero-dep): embed · verify · agent-browser inspect · screenshot |
| `pipeline/` | Stage docs: storyline · storyboard · render · qa · learning |

## Status

Both renderers are verified end-to-end:

- **PPTX:** all three example specs build and pass **17/17** brand/quality checks.
- **HTML:** asset embedding + strict verification pass; the strict gate correctly fails a
  non-embedded deck.

Design rationale, the full build plan, and the source analysis are in
`../nbg-presentation-studio-docs/`.
