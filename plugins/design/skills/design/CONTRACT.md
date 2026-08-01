# The Design Contract

Every repo that installs the `design` skill gets the same three guarantees,
regardless of its stack: the same two files, the same three verbs, the same
never-auto-edit rule. This document is the law for the skill and anything
that reads `docs/design/`; per-invocation craft judgment stays in `SKILL.md`.
Ships inside the skill (`.claude/skills/design/CONTRACT.md` after install) —
it's part of the installable unit, not a wiki page that drifts from what
actually runs.

Contract version: **1.2.0** (matches the initial `contractVersion` this
skill's `generate` mode stamps into `tokens.json` — see §II).

## I. One installable unit

1. Install via `/plugin marketplace add how2doo-ai/agents` then
   `/plugin install design` — or the how2doo platform's own installer Setup
   tab, which does the same file-copy from the same source. Either path
   copies this whole skill folder atomically into the target repo's
   `.claude/skills/design/`; nothing else under the repo's `.claude/` is
   touched (see `install-agent.mjs`'s `kind: skills` copy).
2. The skill's own version (`plugin.json`) and a repo's `tokens.json`
   `contractVersion` move independently. Upgrading the skill never silently
   reinterprets an old repo's `tokens.json` — if a repo's `contractVersion`
   is behind this contract, `generate` calls it out and migrates it forward;
   `apply` still runs against whatever shape is actually on disk (a script
   crash on a missing field is a bug, not acceptable "upgrade friction").

## II. Two files, one schema

3. A repo that has run `generate` has exactly two files:
   `docs/design/BRAND.md` (prose — reasoning, changelog, human-readable) and
   `docs/design/tokens.json` (machine-readable, validated against
   `tokens.schema.json` shipped alongside this skill). No third location,
   no per-repo variant schema. A hand-authored `BRAND.md` with no
   `tokens.json` yet is a valid, partial state — `apply` isn't usable until
   `generate` has produced `tokens.json` too.
4. `docs/design/BRAND.md` **wins** when it exists — the skill's default
   build mode reads it before any generic default (SKILL.md §0). A root
   `BRAND.md` (the older hand-authored convention) is still honored for
   repos that already have one there.
5. A host repo that already has `docs/design/BRANDBOOK.md` plus
   `docs/design/tokens.json` is a compatible legacy state. The skill reads
   that brandbook as law and must not rename or overwrite it during review or
   default build mode. Moving it to `BRAND.md` is an explicit migration, not
   an install side effect.

## III. Four modes, same everywhere

6. *(default, no mode keyword)* — build/redesign a UI. `BRAND.md` is law
   when present; otherwise pin the brief explicitly rather than guessing.
7. `review <page-or-component-path-or-route>` — read-only ultrareview of the
   rendered interface. It reports evidence-backed quality findings but never
   edits the target or changes an `apply` verdict.
8. `generate [reference...]` — derive or re-derive the two files above.
   Re-running is always re-derivation with a change note, never a blind
   overwrite of prior reasoning (SKILL.md Mode: generate, rule 2).
9. `apply <page> [--out <path>] [--tokens <path>]` — runs
   `npx tsx .claude/skills/design/scripts/apply.ts`. A pure function of two
   files on disk (the target file + `tokens.json`): same inputs → the exact
   same report, every time. No model judgment inside it.

## IV. Never an auto-edit

10. `apply`'s report is the **only** output of that mode — it never writes to
   the target file, ever. Turning a reported deviation into a real code
   change is separate work, routed through whatever review process the host
   repo already uses (a draft PR, a normal commit + review) — never a
   silent edit as a side effect of checking conformance.
11. `verdict: conforms` is exactly as valid an outcome as
   `verdict: deviations-found` — never re-run hoping for a different
   answer, never hand-add a finding the script didn't emit.

## V. Enforcement

12. No placeholders: a `generate` run that doesn't actually look at the
    given reference material, or an `apply` run that doesn't actually read
    the target file, is a fabricated result, not a shortcut.
13. Leave a trail: `BRAND.md`'s reasoning and change notes are what the next
    run — in this repo, or a completely different one that installed the
    same skill — reads instead of re-deriving everything from scratch.

## VI. Human direction and review evidence

14. Default build mode separates a focused repair from a directional change.
    A new surface, an ambiguous redesign, or a material visual-language choice
    needs an editable brief and a visible decision gate before implementation.
    The agent may state one narrow assumption for a small reversible repair;
    it must not fabricate a brand to escape an ambiguous brief.
15. A directional decision presents two or three meaningful approaches on the
    relevant product axis, a recommendation, and trade-offs. The human chooses
    (or explicitly delegates the choice) before code changes. Cosmetic reskins
    do not satisfy this requirement.
16. A completed UI increment reports rendered evidence for the agreed desktop
    and narrow viewport, relevant user interaction and states, accessibility
    or keyboard focus, and console errors. If that evidence cannot be captured,
    the result is clearly called a source-only review; source code is not proof
    of visual quality.
17. Repeated, *confirmed* human feedback may be captured as a concise change
    note in `BRAND.md`. A one-off preference remains conversational context;
    it must not silently become a permanent token or a new project rule.

## Changelog

- **1.1.0** (2026-08-01) — added read-only `review` mode with rendered-
  evidence requirements and explicit compatibility for host repos that use
  `docs/design/BRANDBOOK.md`.
- **1.2.0** (2026-08-01) — added a human-directed design loop: editable brief,
  visible direction choice, focused increment, rendered state evidence, and
  explicit confirmation before recurring feedback becomes brand guidance.
- **1.0.0** (2026-07-31) — initial contract: two files, three verbs,
  `tokens.schema.json` published alongside the skill.
