# AIHub Skills

AIHub Skills - Claude Code plugin marketplace

## Installation

Add this marketplace to Claude Code:

```bash
/plugin marketplace add <your-github-username>/aihub-skills
```

## Available Plugins

See the `plugins/` directory for available plugins.

## Plugin Installation

Install individual plugins:

```bash
/plugin install plugin-name@aihub-skills
```

## Public mirror

A public copy of this repository lives at
[BikS2013-coding-agents/nbg-design](https://github.com/BikS2013-coding-agents/nbg-design), branch `working`.
Its history starts at the "Initial working snapshot" commit (the tree of `main` on 2026-09-05) and contains
no earlier commits, versions or deleted files. Locally it is the orphan branch `working`, the remote is
`coding-agents`, and the tag `working-synced` marks the last `main` commit mirrored.

After committing on `main`, run:

```bash
scripts/sync-working.sh            # pushes main to origin, replays new commits onto working, pushes the mirror
scripts/sync-working.sh --no-origin
```

The remote `coding-agents` is configured with the push refspec `refs/heads/working:refs/heads/working`, so a
bare `git push coding-agents` can only ever send `working`. Never run `git push --all` or `git push --mirror`
against it.

## License

MIT

---

Managed with [manage-marketplaces](https://github.com/anthropics/claude-code) skill.
