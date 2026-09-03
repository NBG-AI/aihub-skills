---
name: nbg-design-pptx
description: Use when creating National Bank of Greece (NBG) presentations as editable PowerPoint (.pptx). Default style is the internal team "briefing" look - pure white slides, one teal accent (#007B85) for highlights, lines and details, grey ink hierarchy, status pills, callout bands, hairline tables and two-panel layouts, lean by design (5-8 slides). The original NBG Presentation Design System look (dark hero covers, cream covers, dividers, numbered columns, hero stats) stays available as `style design-system`. Everything is rendered as native, editable PowerPoint objects, never HTML and never screenshots. Triggers include NBG pptx, NBG PowerPoint, internal briefing deck, team briefing, release outlook deck, status deck, lean NBG deck, NBG design-system deck, convert the nbg-design HTML look to PowerPoint.
---

# NBG Design PPTX

This skill produces **editable PowerPoint decks for NBG** from a small YAML deck spec. It ships
two template families, selected by `deck.style`:

| Style | When | Look |
|---|---|---|
| `briefing` (**default**) | internal team briefings: status, release outlook, committee updates, orientation decks | white ground, one teal accent for highlights only, grey ink, status pills, callouts, hairline tables, two-panel layouts (the `index 1.html` reference) |
| `design-system` | editorial / external decks in the `nbg-design` HTML look | dark hero and cream covers, dividers, numbered columns, hero stats, photography |

Every slide is built from native PowerPoint objects (text boxes, shapes, tables, charts, the real
NBG lockup), so the result opens, edits and re-themes like a hand-built deck.

## First step when this skill is used

Resolve every path below relative to **this skill directory**; never assume the shell's working
directory.

1. Read `references/templates.md` (template catalogue: geometry, limits, fields) and
   `references/deck-spec.md` (the YAML contract). The briefing section comes first.
2. Set up the engine once per machine (Python, uv-managed):
   ```bash
   cd <skill-root>/engine && uv sync
   ```
   Always run the engine through that environment with the explicit interpreter
   `<skill-root>/engine/.venv/bin/python <script>` (the user's shell aliases `python`).

## Who the briefing decks are for (read before writing the storyline)

Briefing decks are for **internal teams**. The audience is semi-technical but not necessarily
familiar with the estate being presented. The job is **orientation, not exhaustive
documentation**: a colleague who was never involved in the projects should finish the deck
with a shared mental model of the concepts, the state of play and what happens next.

**"Lean" is a hard requirement, not a preference.** A long deck will not get read; the value is
the shared mental model, not a reference manual.

- Target **5 to 8 slides**; the builder warns above 8 and the validator **fails above 12**.
- One question per slide, answered in the head: *what is this, where does it stand, what is asked*.
- Cards hold 3-5 short bullets; tables hold about 8 short rows; a panel holds 2-3 blocks.
  The templates refuse copy that does not fit (`SPEC ERROR`). Do not shrink text or "adjust
  whitespace" to force it in: cut, merge, or move detail to the speaker `notes`.
- Prefer status over narrative: every item carries a state (`ok` / `warn` / `stop` / `wait`),
  a date, an owner or a dependency. Close with the asks / next steps, never with a "Thank you".
- Appendix dumps (portfolio lists, per-project plans, demo placeholders) do not belong in a
  briefing; reference them from `notes` and say where the full list lives.
- Use the design's own devices for emphasis: a callout band for the one thing that blocks
  everything, a date rail for the milestones, `**strong**` spans for the words that matter.

## Required user inputs

For every deck request, require: the topic, the target audience (defaults to the internal team
briefing profile above only when the user says it is a briefing), and the desired slide count or
depth. Ask for anything missing instead of inventing it. Approved defaults are:

- `style: briefing`, `language: en`, `show_logo: true`.

Do **not** substitute any other missing value: a missing title, table column, tone or chart type
is a spec error the engine raises.

Delivery convention (state it in your first response): save to `~/Downloads/` as
`YYYYMMDDHHMM_<descriptive_name>.pptx` (Athens time, lowercase, underscores) unless the user
names a location. Deliver the `.yaml` spec next to it so the deck can be regenerated.

## Workflow

```
inputs -> storyline (lean) -> deck spec (YAML) -> build_deck.py (build + validate) -> preview_deck.py -> read every PNG -> fix -> deliver
```

1. **Storyline first, lean.** For a briefing: cover (what the deck answers, 2-3 section cards),
   then one slide per question, then next steps / asks. Write the head of every slide as
   `title` + `sub` (one line) and the right-hand `meta` (dates, scope). Put expansion in `notes`.
2. **Pick a template per slide** (`references/templates.md`): `brief_cover`, `brief_cards`
   (callout + cards + note), `brief_table` (flow strip, date rail, table, band of boxes / asks),
   `brief_panels` (two panels of matrix / box / ask / note / list / steps blocks), `brief_chart`.
   Vary them; a briefing rarely needs more than two tables in a row.
3. **Write the deck spec** (`references/deck-spec.md`). Inline markup: `**strong**` (SemiBold
   ink), `*emphasis*`, `~accent~`, `\n`. Status tones: `ok`, `warn`, `stop`, `wait`, `accent`.
4. **Build and validate:**
   ```bash
   <skill-root>/engine/.venv/bin/python <skill-root>/engine/build_deck.py deck.yaml out.pptx
   ```
   Exit 1 = spec error (`SPEC ERROR: slide N (template): ...`), exit 2 = validator `FAIL`.
5. **Preview and READ the slides** (mandatory):
   ```bash
   <skill-root>/engine/.venv/bin/python <skill-root>/engine/preview_deck.py out.pptx --out previews/
   ```
   Open every `slide-N.png` and check it against `references/qa-checklist.md`.
6. Fix the spec, rebuild, re-preview until the validator passes and the visual read is clean.
7. Deliver: the `.pptx` and `.yaml` paths, the validator summary, the preview folder, what was
   left out of the briefing and where it lives (notes, source deck, appendix on request).

## Briefing design rules (enforced by the engine and the validator)

- **Background**: always pure white `#FFFFFF`; no dark or tinted slides.
- **Accent**: `#007B85` only, and only for highlights, rules, tags, bullets, card edges and the
  progress bar. Never as a fill behind body copy. `deck.accent` / slide `accent` are rejected.
- **Ink hierarchy**: ink `#0E1B1D` (titles, strong), muted `#5B6B6D` (body), faint `#8A9A9C`
  (labels, meta, footer), hairlines `#E2E8E9` / `#EFF3F3`, tints `#E6F2F3` / `#F4FAFA`.
- **Status tones** (pills, dots, callout bands only): ok `#1F8A5F`, warn `#C07A08`,
  stop `#B33A2B`, wait `#6B7A7C`, each with its pale background.
- **Typography**: Aptos SemiBold for titles / strong spans, Regular for body. Head 17pt, body
  9.5pt, labels 7.5-8pt (the reference's own density), never below the 7pt floor.
- **Rhythm is fixed**: head at y=64, hairline at y=130, body y=156..976, footer band y=1016.
  Templates never move these; copy that does not fit is a spec error.
- **Chrome**: accent progress bar (top), compact lockup + footer label (bottom-left),
  `02 / 07` counter (bottom-right). The cover carries the primary lockup top-left.
- **Charts** are native, in accent tints; `pie` is rejected (use `doughnut`).
- **Copy hygiene**: middle dot `·` as the separator, no em-dashes (the validator flags them),
  no "Thank you" slide.

The design-system rules (palette of the four teals, dark surfaces, photos, dividers, back cover)
apply unchanged when `style: design-system` is used; see the second half of
`references/templates.md`.

## QA gate

A deck is done only when all three pass:

1. **Validator** (run by the builder): 16:9, palette of the chosen style, Aptos only, real lockup
   on every slide, no rasters, everything inside the artboard, no collisions, footer clearance,
   7pt floor, contrast, estimated text fit, white ground and lean limits (briefing), plain
   closing slide (design-system). `FAIL` blocks delivery; read and resolve every `WARN`.
2. **Visual read** of every preview PNG: clipped or wrapped heads, bullets running out of a
   card, a table's last row under the band, pills overlapping titles, orphaned words.
3. **Content read**: one purpose per slide; a newcomer understands each slide without the
   presenter; states and dates present; the deck is as short as it can be.

Preview notes: `preview_deck.py` renders through LibreOffice with the Aptos faces bundled with
Microsoft Office when present; translucent text may look clipped at its right edge (PowerPoint is
fine). `--engine powerpoint` (macOS) is the most faithful check.

## Bundled files

```
nbg-design-pptx/
├── SKILL.md
├── references/  templates.md (briefing + design-system catalogue) · deck-spec.md · qa-checklist.md
├── spec/examples/  briefing-showcase.yaml (the reference deck) · design-system-showcase.yaml
├── assets/  logos (primary / knockout / small) · photos (design-system covers)
└── engine/  build_deck.py · validate_deck.py · preview_deck.py · nbg_pptx/ (theme, primitives,
             text, charts, templates = design-system, briefing = briefing style) · tests/
```
