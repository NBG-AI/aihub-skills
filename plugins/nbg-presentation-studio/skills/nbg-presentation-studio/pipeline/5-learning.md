# Pipeline Stage 5 — Learning Loop (Optional)

**Goal:** learn the user's real style preferences by comparing the deck they actually finalized against
the draft we generated, and feed durable patterns back into the style guide so future decks start
closer to what they want.

This stage is **optional** and runs in two moments:
- **Post-render (every deck):** a draft record is saved so a later comparison is possible.
- **Phase 0 (before each new deck) / on demand:** detect a finalized version, compare, and update preferences.

State stores:
- Draft records (pending comparison): **`~/.claude/presentations/pending/`**
- Completed reviews: **`~/.claude/presentations/reviewed/`**
- Learned preferences: **`../theme/nbg/presentation-style-guide.md`**

```bash
mkdir -p ~/.claude/presentations/pending ~/.claude/presentations/reviewed   # idempotent
```

---

## A. Draft record (written after Stage 3)

When a deck is produced, save a JSON draft record to `pending/` capturing: `id`, `created`,
`file_path`, `file_hash` (SHA-256 of the file), the deck-spec/storyline snapshot, and a per-slide list
(index, type, title, layout, content summary), with `status: pending`. The hash enables confirming the
user actually changed something before learning from it.

---

## B. Compare final vs draft

1. **Locate the draft record** in `pending/` matching the final's filename; if no exact match, list
   candidates and ask the user (auto-detection may scan email/local file when no path is given).
2. **Extract the final deck** content (python-pptx / unzip + XML): per slide title, content, layout,
   chart types, positioning. Compute its SHA-256 and confirm it differs from the draft hash.
3. **Slide-by-slide diff:** title rewrites, reordering, content add/remove/reword, chart-type swaps,
   layout changes, slides added/removed.

### Slide classification
| Classification | Criteria |
|---|---|
| `USED_AS_IS` | No meaningful change (minor formatting only) |
| `MODIFIED` | Title reworded, points edited, or layout tweaked |
| `HEAVILY_REWRITTEN` | Substantially different content, structure, or visual approach |
| `NOT_USED` | Draft slide removed entirely from final |
| `NEW` | Slide in final that was not in the draft |

4. **Save a comparison record** to `reviewed/` (draft_id, hashes, per-slide classification + changes,
   `summary` counts, `patterns_detected`) and move the draft record from `pending/` → `reviewed/`
   (status `reviewed`; age out stale drafts >30 days with no match as `EXPIRED`).

---

## C. Update the style guide

Edit `../theme/nbg/presentation-style-guide.md` with learned preferences, e.g.:
- Title style (data-driven vs narrative), narrative framework (SCQA vs straight-to-answer)
- Content density (concise vs detailed)
- Chart preferences (e.g. consistently swaps bar→doughnut), layout preferences (e.g. 40/60 over 50/50)
- White-space / opening / closing patterns

**Critical rule: only record a preference that appears in 2+ reviews** — aggregate patterns across all
reviews, not a single deck, to avoid one-off noise. Add a confidence level based on consistency.

Stages 1 and 2 read this file at the start of every run, so learned preferences automatically steer
future storylines and storyboards.

---

## D. Report to the user

Show a short delta: overall change stats (how many slides changed and how), notable patterns detected,
a few concrete examples, and any new preference added to the style guide. If no finalized version is
found, skip silently.
