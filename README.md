# NBG Design

NBG Design - Claude Code plugin marketplace. It ships the `nbg-design` plugin: a presentation design
system for HTML slides inspired by the brand image of the National Bank of Greece (NBG), with the in-deck
editor, the AI assistant, PDF export and the per-deck rebuild script.

The repository and the marketplace identifier keep their original name `aihub-skills`
(`github.com/NBG-AI/aihub-skills`); only the product is called NBG Design. Existing installations are
unaffected.

## Installation

Add this marketplace to Claude Code:

```bash
/plugin marketplace add NBG-AI/aihub-skills
```

## Available Plugins

See the `plugins/` directory for available plugins.

## Plugin Installation

Install individual plugins:

```bash
/plugin install nbg-design@aihub-skills
```

## Public mirror

A public copy of this repository lives at
[BikS2013-coding-agents/nbg-design](https://github.com/BikS2013-coding-agents/nbg-design), branch `working`.
Its history starts at the "Initial working snapshot" commit (the tree of `main` on 2026-09-05) and contains
no earlier commits, versions or deleted files. Locally it is the orphan branch `working`, the remote is
`coding-agents`, and the tag `working-synced` marks the last `main` commit mirrored.

**Every push of `main` must be followed by a mirror sync.** "Commit and push" in this repository is not
finished until the script below has run; a `main` that is ahead of the `working-synced` tag means the public
mirror is stale. Coding agents working here are expected to run it as part of every push.

```bash
scripts/sync-working.sh            # pushes main to origin, replays new commits onto working, pushes the mirror
scripts/sync-working.sh --no-origin
```

To check whether the mirror is behind: `git log --oneline working-synced..main` (empty output means in sync).

The remote `coding-agents` is configured with the push refspec `refs/heads/working:refs/heads/working`, so a
bare `git push coding-agents` can only ever send `working`. Never run `git push --all` or `git push --mirror`
against it.

## License

MIT

---

Managed with [manage-marketplaces](https://github.com/anthropics/claude-code) skill.
