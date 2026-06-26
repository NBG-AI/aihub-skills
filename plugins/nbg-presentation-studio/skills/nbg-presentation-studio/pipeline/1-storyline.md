# Pipeline Stage 1 — Storyline (Narrative)

**Goal:** turn a raw brief into a structured executive narrative — one clear message per slide.
**You decide WHAT each slide says, not how it looks.** Layout/visuals come in Stage 2.
**Output of this stage:** the unified **deck-spec** (`../spec/deck-spec.md`) — one slide entry per
slide carrying `type`, `title`, `bumper`, `points`, `key_message`, `recommended_visual`.

Before structuring, read `../theme/nbg/presentation-style-guide.md` for learned user preferences
(title style, narrative framework, content density) and honor them.

---

## Core principles

1. **One message per slide** — exactly ONE idea per slide. If a slide says two things, split it.
2. **Pyramid Principle (answer first)** — lead with the conclusion, then support it. Never build up to it.
3. **Insight-driven ACTION TITLES** — the title states the takeaway, not the topic.
4. **The "So What?" test** — every slide must answer "why does this matter?"
5. **The 5–7 second test** — a reader must grasp the slide's point in 5–7 seconds.
6. **MECE** — arguments are Mutually Exclusive, Collectively Exhaustive (no overlaps, no gaps).
7. **Visual-first** — never a text-only slide for executives; set `recommended_visual` on EVERY content slide.

---

## McKinsey frameworks

### Pyramid Principle (Barbara Minto)
```
        KEY MESSAGE            ← main recommendation / conclusion (state it FIRST)
       /     |     \
   Arg 1   Arg 2   Arg 3       ← 3 MECE supporting arguments
     |       |       |
   Data    Data    Data        ← evidence for each
```

### SCQA — narrative spine of the whole deck
- **Situation** — current state / context (what we know)
- **Complication** — the problem, challenge, or change
- **Question** — what should we do? (often implicit)
- **Answer** — your recommendation / solution

### SCR — the executive-summary slide only
- **Situation** (1 sentence) → **Complication** (1 sentence) → **Resolution** (2–3 bullets: recommendation + key support).

---

## Action titles

A title is a **complete insight sentence**, scannable alone. Reading only the titles top-to-bottom
must tell the whole story.

**Formula:** `[Subject] + [Action/Insight] + [Quantification if available]`

| BAD (label) | GOOD (action title) |
|---|---|
| Q4 Performance | Digital adoption grew 47% in Q4, exceeding targets |
| Digital Banking Overview | Mobile banking is now the preferred channel |
| Customer Statistics | Customer satisfaction reached a 5-year high |
| 2024 Priorities | Three initiatives will drive €80M incremental revenue |
| Challenges | Legacy systems cause 40% of customer complaints |

**Title checklist:** complete sentence? states the insight not the topic? understandable from title
alone? passes "So what?"? specific (numbers where relevant)? ≤80 chars (single-line fit).

---

## Slide-type taxonomy

| `type` | Purpose | Title rule | Page #? |
|---|---|---|---|
| `cover` | First impression | Strong 48pt title; subtitle lists units `Cards \| GoForMore \| Embedded \| Digital \| SSB \| Direct \| Fraud \| Controls` (NEVER "Cards and Digital Business") | No |
| `contents` | TOC | `01` + section title + 1-line description per section | Yes |
| `divider` | Section separator | `01`/`02`/… number + clear section title | No |
| `content` | Main info | Action title + 3–5 supporting points max | Yes |
| `chart` | Dedicated data viz | Title states what the data proves | Yes |
| `infographic` | Simplify a complex concept (flow, timeline, comparison) | Title states the insight | Yes |
| `summary` | Key takeaways / next steps | Action-oriented | Yes |
| `back_cover` | Closing | **Plain, centered NBG oval logo only — NO "Thank You"/"Questions" text** | No |

**Typical structures:** Executive Update 5–8 slides · Strategic Review 10–15 · Data Presentation 8–12.
Keep total 8–15 slides. Always open with `cover`, close with `back_cover`.

---

## Choosing the visual (set `recommended_visual` for every content slide)

| If the slide is about… | `recommended_visual` |
|---|---|
| Growth / change / comparison (2–5 items) | `bar_chart` |
| Trend over time | `line_chart` |
| Proportions / breakdown (≤5 segments) | `doughnut_chart` (NEVER pie) |
| Financial flow | `waterfall_chart` |
| Strategic priorities / steps (3–6) | `numbered_infographic` / `timeline` |
| KPIs (3–6 metrics) | `kpi_dashboard` (metric cards) |
| Before/After, side-by-side | `comparison_chart` |
| Purely qualitative (approvals, next steps) | `none` |

Chart selection rules: start from what you want to prove (not the data you have) · simplest chart wins ·
semantic color (green=good, red=bad, gray=neutral) · max 4–5 series · no chartjunk.

---

## Quality gate before emitting the deck-spec

- [ ] Main recommendation stated upfront (Pyramid)
- [ ] Arguments are MECE; each has evidence
- [ ] Exec summary follows SCR
- [ ] Every slide has exactly ONE `key_message`
- [ ] All titles are action titles (no labels), ≤80 chars
- [ ] Every slide passes "So what?" and the 5–7s test
- [ ] No slide has >5 points
- [ ] `recommended_visual` set on every content slide
- [ ] **Read-through test:** titles alone tell a complete, logical story (Situation → Resolution)

---

## Deck-spec output (one entry per slide)

Emit YAML conforming to `../spec/deck-spec.md`. Each slide entry carries the narrative fields; Stage 2
later refines the same entries with layout/chart detail. Minimal shape:

```yaml
presentation:
  title: "Q4 2025 Digital Banking Performance"
  audience: "Board of Directors"
  main_recommendation: "Accelerate mobile-first investments"
slides:
  - type: cover
    content: { title: "Digital Banking Performance", subtitle: "Q4 2025 Executive Summary", date: "February 2026" }
  - type: content
    key_message: "Headline metrics all beat targets"
    recommended_visual: kpi_dashboard
    content:
      title: "Digital channels exceeded all KPIs, led by 23% mobile growth"
      bumper: "KEY FINDING"
      points:
        - "Mobile active users 2.8M (+23% YoY)"
        - "Digital transaction share 78% of volume"
        - "NPS +45 (up 12 points)"
  - type: back_cover   # plain oval logo, no text
```

See `../spec/examples/` for full worked specs.

**Do NOT:** design layouts, write render code, invent data/names/quarters, use em-dashes (—/--),
or produce generic label titles.
