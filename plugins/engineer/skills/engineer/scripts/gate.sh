#!/bin/sh
# worker/gate.sh — deterministic green gate: typecheck + tests in the target
# repo, JSON verdict + matching exit code. The worker runs this BEFORE every
# commit; "I believe the tests pass" is not a gate, this is.
#
# Usage: TYPECHECK_CMD=… TEST_CMD=… gate.sh <target-repo>
# (empty/unset command = that check is skipped, not failed)
# Exit 0 = green (nothing failed); exit 1 = something failed.
set -u
unset CDPATH 2>/dev/null || true # a set CDPATH makes cd print — corrupts $(cd …) captures

REPO="${1:?usage: gate.sh <target-repo>}"
cd "$REPO" || exit 1

tc=skipped; te=skipped
if [ -n "${TYPECHECK_CMD:-}" ]; then
  if eval "$TYPECHECK_CMD" >/dev/null 2>&1; then tc=ok; else tc=fail; fi
fi
if [ -n "${TEST_CMD:-}" ]; then
  if eval "$TEST_CMD" >/dev/null 2>&1; then te=ok; else te=fail; fi
fi

# both unconfigured = nothing was verified — that is NOT green, it's a
# misconfigured gate. Silent-pass here is exactly how a fail-open gate
# becomes indistinguishable from no gate at all.
if [ "$tc" = skipped ] && [ "$te" = skipped ]; then
  printf '{"typecheck":"skipped","tests":"skipped","green":false,"error":"no TYPECHECK_CMD or TEST_CMD configured — nothing was verified"}\n'
  exit 1
fi

green=true
{ [ "$tc" = fail ] || [ "$te" = fail ]; } && green=false
printf '{"typecheck":"%s","tests":"%s","green":%s}\n' "$tc" "$te" "$green"
[ "$green" = true ]
