#!/bin/sh
# engineer plugin init — idempotent, run from the target repo's git root.
# Interview fills only what's MISSING (init.sh contract). Exit 0 ready / 1 not.
set -u
unset CDPATH 2>/dev/null || true

git rev-parse --show-toplevel >/dev/null 2>&1 || { echo "✗ not a git repo — run from your project's root"; exit 1; }
ok=0
command -v node >/dev/null 2>&1 && echo "✓ node $(node -v)" || { echo "✗ node missing (≥20 needed)"; ok=1; }
if command -v bd >/dev/null 2>&1; then
  [ -d .beads ] && echo "✓ beads ledger present" || echo "· bd installed, no ledger here — optional: bd init (tasks survive fresh contexts)"
else
  echo "· bd not installed (optional task ledger) — https://steveyegge.github.io/beads/"
fi
chmod +x "$(dirname "$0")/../skills/engineer/scripts/"*.sh 2>/dev/null || true
echo "engineer ready — modes: sdd none|light. See skills/engineer/SKILL.md"
exit $ok
