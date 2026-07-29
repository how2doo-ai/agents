#!/bin/sh
# worker/state.sh — deterministic iteration-state discovery, JSON to stdout.
# The spec-kit lesson: state discovery is sh, not model imagination. The worker
# runs this FIRST every iteration and trusts its numbers over impressions.
#
# Usage: state.sh <target-repo> <goal-file>
# Exit 0 with one JSON line; exit 1 on bad args (init.sh contract).
set -eu
unset CDPATH 2>/dev/null || true # a set CDPATH makes cd print — corrupts $(cd …) captures

REPO="${1:?usage: state.sh <target-repo> <goal-file>}"
GOAL="${2:?usage: state.sh <target-repo> <goal-file>}"
[ -d "$REPO" ] || { echo "no such repo: $REPO" >&2; exit 1; }
[ -f "$GOAL" ] || { echo "no such goal: $GOAL" >&2; exit 1; }

branch=$(git -C "$REPO" rev-parse --abbrev-ref HEAD 2>/dev/null || echo none)
head=$(git -C "$REPO" rev-parse --short HEAD 2>/dev/null || echo none)
dirty=$(git -C "$REPO" status --porcelain 2>/dev/null | wc -l | tr -d ' ')

# success criteria straight from the goal file's checkboxes
crit_done=$(grep -c '^- \[x\]' "$GOAL" 2>/dev/null || true)
crit_total=$(grep -c '^- \[[ x]\]' "$GOAL" 2>/dev/null || true)

# the ledger, when present (bd ready lines start with ○)
has_beads=false; ready=0; in_progress=0
if [ -d "$REPO/.beads" ] && command -v bd >/dev/null 2>&1; then
  has_beads=true
  ready=$(cd "$REPO" && bd ready 2>/dev/null | grep -c '^○' || true)
  in_progress=$(cd "$REPO" && bd list --status in_progress 2>/dev/null | grep -c '^◐' || true)
fi

# spec-kit presence — full-mode worker checks this instead of assuming
speckit=false
[ -d "$REPO/.specify" ] && speckit=true

printf '{"branch":"%s","head":"%s","dirty_files":%s,"criteria":{"done":%s,"total":%s},"beads":{"present":%s,"ready":%s,"in_progress":%s},"speckit":%s}\n' \
  "$branch" "$head" "$dirty" "${crit_done:-0}" "${crit_total:-0}" "$has_beads" "${ready:-0}" "${in_progress:-0}" "$speckit"
