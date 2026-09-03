# nbg-design-pptx

Editable PowerPoint decks for NBG, built from native PowerPoint objects with the real NBG lockup.
Two styles: **briefing** (default) - the internal team-briefing look: pure white slides, one teal
accent for highlights only, grey ink hierarchy, status pills, callout bands, hairline tables,
two-panel layouts, lean by design (5-8 slides) - and **design-system**, the `nbg-design` HTML
look (dark hero covers, cream editorial covers, dividers, numbered columns, hero stats).

## Installation

```bash
/plugin install nbg-design-pptx@aihub-skills
```

One-time engine setup (Python, uv-managed):

```bash
cd skills/nbg-design-pptx/engine && uv sync
```

## Usage

Ask Claude for an NBG deck "as PowerPoint in the NBG design system"; the skill writes a deck spec,
builds the `.pptx`, validates it against the design guidelines and renders previews for a visual
check. Manual use:

```bash
cd skills/nbg-design-pptx/engine
.venv/bin/python build_deck.py ../spec/examples/briefing-showcase.yaml /tmp/showcase.pptx
.venv/bin/python build_deck.py ../spec/examples/design-system-showcase.yaml /tmp/design-showcase.pptx
.venv/bin/python preview_deck.py /tmp/showcase.pptx --out /tmp/showcase-previews
.venv/bin/python -m pytest tests -q
```

## Documentation

- `skills/nbg-design-pptx/SKILL.md` - workflow, rules, QA gate
- `skills/nbg-design-pptx/references/templates.md` - template catalogue (geometry, limits)
- `skills/nbg-design-pptx/references/deck-spec.md` - the YAML contract
- `skills/nbg-design-pptx-docs/` - source analysis, design, plan, verification and pending items

## License

MIT
