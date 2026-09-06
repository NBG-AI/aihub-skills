# NBG Design

NBG Design - Claude Code plugin marketplace. It ships the `nbg-design` plugin: a presentation design
system for HTML slides inspired by the brand image of the National Bank of Greece (NBG), with the in-deck
editor, the AI assistant, PDF export and the per-deck rebuild script.

## Installation

The marketplace is distributed from the public repository
[BikS2013-coding-agents/nbg-design](https://github.com/BikS2013-coding-agents/nbg-design). Add it to
Claude Code and install the plugin:

```bash
/plugin marketplace add BikS2013-coding-agents/nbg-design
/plugin install nbg-design@nbg-design
```

The marketplace identifier (the part after `@`) is `nbg-design`, as declared in
`.claude-plugin/marketplace.json`.

## Available Plugins

See the `plugins/` directory for available plugins.

## Development source

The marketplace is developed in `github.com/NBG-AI/aihub-skills` (branch `main`, full history) and
published to the public repository above by `scripts/sync-working.sh` (next section). Install from the
public repository, not from the development one; installations made earlier as `nbg-design@aihub-skills`
must be re-added under the new identifier.

## Public mirror

The primary distribution channel of the marketplace is the public repository
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
