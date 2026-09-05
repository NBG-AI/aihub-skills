#!/usr/bin/env bash
# Mirror `main` onto the `working` branch and push it to the public remote.
#
# `working` is an orphan branch: its history starts at the "Initial working snapshot" commit
# (the tree of main on 2026-09-05) and contains no earlier commits, versions or deleted files.
# Every commit made on `main` after that point is replayed onto `working` with cherry-pick, so
# the public repository (BikS2013-coding-agents/nbg-design, branch `working`) follows `main`
# commit by commit while never receiving the history that predates the snapshot.
#
# The tag `working-synced` marks the last `main` commit that has been mirrored.
#
# Usage: scripts/sync-working.sh [--no-origin]
#   --no-origin   do not push `main` to `origin` first (default: push both remotes)
#
# Exit: 0 = in sync (pushed, or nothing to do), 1 = error (dirty tree, missing tag/remote,
#       cherry-pick conflict — resolve it, `git cherry-pick --continue`, then rerun).

set -euo pipefail

SOURCE_BRANCH="main"
MIRROR_BRANCH="working"
MIRROR_REMOTE="coding-agents"
ORIGIN_REMOTE="origin"
SYNC_TAG="working-synced"
PUSH_ORIGIN=1

for arg in "$@"; do
  case "$arg" in
    --no-origin) PUSH_ORIGIN=0 ;;
    -h|--help) sed -n '2,16p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "sync-working: unknown argument '$arg'" >&2; exit 1 ;;
  esac
done

cd "$(git rev-parse --show-toplevel)"

fail() { echo "sync-working: $*" >&2; exit 1; }

[ -n "$(git status --porcelain)" ] && fail "the working tree has uncommitted changes; commit or stash them first"
git rev-parse -q --verify "refs/tags/$SYNC_TAG" >/dev/null || fail "tag '$SYNC_TAG' is missing; create it at the last mirrored $SOURCE_BRANCH commit"
git rev-parse -q --verify "refs/heads/$MIRROR_BRANCH" >/dev/null || fail "branch '$MIRROR_BRANCH' does not exist"
git remote get-url "$MIRROR_REMOTE" >/dev/null 2>&1 || fail "remote '$MIRROR_REMOTE' is not configured"
git merge-base --is-ancestor "$SYNC_TAG" "$SOURCE_BRANCH" || fail "tag '$SYNC_TAG' is not an ancestor of $SOURCE_BRANCH ($SOURCE_BRANCH was rewritten?); move the tag to the last mirrored commit"

current_branch="$(git branch --show-current)"
restore() { [ "$(git branch --show-current)" = "$current_branch" ] || git checkout -q "$current_branch"; }
trap restore EXIT

if [ "$PUSH_ORIGIN" -eq 1 ]; then
  git push "$ORIGIN_REMOTE" "$SOURCE_BRANCH"
fi

pending="$(git rev-list --count "$SYNC_TAG..$SOURCE_BRANCH")"
if [ "$pending" -gt 0 ]; then
  echo "sync-working: replaying $pending commit(s) from $SOURCE_BRANCH onto $MIRROR_BRANCH"
  git checkout -q "$MIRROR_BRANCH"
  git cherry-pick -m 1 "$SYNC_TAG..$SOURCE_BRANCH"
  git tag -f "$SYNC_TAG" "$SOURCE_BRANCH" >/dev/null
  git checkout -q "$current_branch"
else
  echo "sync-working: $MIRROR_BRANCH already holds every $SOURCE_BRANCH commit"
fi

# Only ever push the mirror branch to the mirror remote.
git push "$MIRROR_REMOTE" "$MIRROR_BRANCH:$MIRROR_BRANCH"
echo "sync-working: $MIRROR_REMOTE/$MIRROR_BRANCH is at $(git rev-parse --short "$MIRROR_BRANCH") (mirrors $SOURCE_BRANCH $(git rev-parse --short "$SOURCE_BRANCH"))"
