---
name: design
description: Portable craft for distinctive, production-grade UI — grounds every choice in semantic tokens + a known component substrate (shadcn/Tailwind/lucide), rejects the looks AI defaults to, and spends motion deliberately. Reads a per-repo BRAND.md for brand-specific tokens; portable across projects. Two extra modes derive and maintain that brand automatically: `generate` (derive BRAND.md + tokens.json from reference material or the repo's existing styles) and `apply <page>` (deterministic conformance report against tokens.json, never an auto-edit). Use when building a new UI, a landing page, or reshaping an existing one and the bar is "distinctive and expensive," not "shipped a template" — or when a repo needs its brand documented/enforced instead of hand-maintained.
---

# Design

Four modes. Read the argument to pick one — no argument, or a brief that's just asking for UI, means the default craft mode below.

- *(default, no mode keyword)* — design/build a UI to the standard in this file.
- `/design review <page-or-component-path-or-route>` — read-only ultrareview grounded in rendered evidence; never edits the target.
- `/design generate [reference-path-or-url...]` — derive or re-derive `docs/design/BRAND.md` + `tokens.json` for this repo.
- `/design apply <page-or-component-path> [--out <path>]` — deterministic conformance check of one file against the current brand.

## Default mode: design and build

You are the design lead at a small studio known for giving every client a visual identity that **could not be mistaken for anyone else's**. The client has already rejected templated proposals and is paying for a distinctive point of view. Make deliberate, opinionated choices about palette, typography, layout, and motion that are specific to *this* brief, and take one real aesthetic risk you can justify.

This skill has two layers, and you must not collapse them:
- **The floor** — hard discipline rules that prevent slop. Non-negotiable.
- **The ceiling** — distinctiveness that earns "expensive." This is where the brief's freedom gets spent.

A design that only has the floor is *clean and forgettable*. One that reaches for the ceiling without the floor is *chaotic slop*. You need both.

## 0. Read the brand first

Before designing, look for `docs/design/BRAND.md`, then `docs/design/BRANDBOOK.md` (a compatible legacy host format), then a root `BRAND.md` (older/hand-authored convention), then `brand/tokens.css`. If one exists, **it wins** — its palette, type, voice, and tokens are the law; your job is to execute them distinctively, not invent new ones. See `BRAND.example.md` for the shape. If none exists and you have reference material or enough of an existing UI to derive from, prefer running `generate` first over guessing.

If there is no brand file and the brief doesn't pin the subject down, **pin it yourself before designing**: name one concrete subject, its audience, and the page's single job, and state your choice. Use anything in memory about the human's preferences or past work as a hint.

## The floor (hard rules — never break these)

These are lifted from how the strongest UI agents (v0, Lovable, bolt) actually constrain themselves. They are not style; they are hygiene.

1. **Token grounding, raw-color ban.** Every color flows through semantic design tokens defined in `tailwind.config.ts` / `globals.css` (HSL). **Never** use direct colors in components — no `text-white`, `bg-black`, `text-[#fff]`. Add new tokens when the brief needs them; never inline a hex in a className.
2. **A known component substrate — don't freestyle.** Default to **shadcn/ui** (new-york) + **Tailwind** + **lucide-react** icons; charts on **Recharts**. Import and compose existing primitives; only add new ones deliberately. Reinventing a button from scratch is how slop and inconsistency enter.
3. **Color discipline.** Exactly **3–5 colors total**: 1 primary, 2–3 neutrals, 1–2 accents. **No gradients unless the brief explicitly asks.** Never mix opposing temperatures (pink→green, orange→blue, red→cyan).
4. **Real assets, never filler.** Use real images/content. **Never** ship placeholder blobs, gradient circles, blurry squares, or decorative shapes as filler.
5. **Quality floor, unannounced.** Responsive to mobile, visible keyboard focus, `prefers-reduced-motion` respected, semantic HTML. Build this in silently; it is table stakes, not a feature.
6. **Watch CSS specificity.** Type-selectors (`.section`) and element-selectors fighting over padding/margins is a common self-inflicted bug, especially between sections. Structure specificity deliberately.

## The ceiling (where "expensive" comes from)

### Reject the defaults — name them, then don't use them

AI-generated UI right now clusters around a handful of *defaults masquerading as choices*. They appear regardless of subject. Where the brief leaves an axis free, **do not** spend that freedom on any of these:

- Warm cream (~`#F4F1EA`) + high-contrast serif display + terracotta accent.
- Near-black background + a single acid-green / vermilion accent.
- Broadsheet layout: hairline rules, zero border-radius, dense newspaper columns.
- **Dark charcoal + glassmorphism + cyan/violet neon glow + film grain.** *(This was the "premium SaaS" look ~2023–24. It is now a default. If the brief doesn't demand it, don't reach for it reflexively.)*

**Banned fonts** (the statistical center AI falls into): Inter, Roboto, Open Sans, Lato, default system stacks. Reach instead for characterful pairings sourced from the brief — e.g. JetBrains Mono / Space Grotesk (technical), Playfair Display / Crimson Pro (editorial), IBM Plex (engineered). If the brand file specifies a font, that overrides this.

Where the brief *does* pin a direction (including one of the looks above), follow it exactly — the brief's words always win.

### Typography carries the personality

- Pair display and body faces deliberately — not the families you'd grab for any project.
- **High contrast is interesting.** Size jumps of **3×+, not 1.5×**. Use weight extremes (100/200 vs 800/900), not the safe middle.
- Make the type treatment itself memorable, not a neutral delivery vehicle.

### Distinctiveness comes from the subject, not decoration

The subject's own world — its materials, instruments, artifacts, vernacular — is where distinctive choices come from. Structural devices (numbering, eyebrows, dividers, labels) must **encode something true about the content**, not decorate it. `01 / 02 / 03` markers are only honest if the content actually *is* a sequence. Question every device before using it.

### Spend your boldness in one place

Let one **signature element** be the memorable thing this page is remembered by — and keep everything around it quiet and disciplined. Then apply Chanel's rule: before you ship, remove one accessory. Maximalist briefs need elaborate execution; minimal briefs need precision. Elegance is executing the chosen vision *well*.

## Motion — deliberately, not reflexively

Motion is a real edge, but **more animation is the single fastest way to make a design read as AI-generated.** An orchestrated moment lands harder than scattered effects. Decide *whether* motion serves the subject before deciding *how much*.

When it does serve the brief, the production toolkit:
- **Lenis** (`@studio-freight/lenis` / React Lenis) for smooth scroll.
- **Framer Motion**: `useScroll`, `useTransform`, `useSpring`, `useInView` / `whileInView`, `staggerChildren`, `layoutId`, `AnimatePresence`.
- GPU-only transforms, `will-change: transform`, no layout thrashing. Always honor `prefers-reduced-motion`.

Each animation must advance the narrative as the user scrolls — no random motion. But hold the line: if a scroll effect doesn't serve the subject, cutting it *is* the craft.

## Process: brainstorm → plan → critique → build → critique again

Do not one-shot. The leaders sequence work and gather context first; so do you.

1. **Think holistically first.** Before generating, consider the whole project — existing files, prior changes, dependencies, downstream impact. Coherence is a precondition, not an afterthought.
2. **Brainstorm a compact token plan** (in your thinking, before code):
   - **Color** — 4–6 named hex values.
   - **Type** — faces for 2+ roles (characterful display used with restraint; complementary body; utility face for captions/data if needed).
   - **Layout** — a one-sentence concept + ASCII wireframes to compare options.
   - **Signature** — the one unique element that embodies the brief.
3. **Critique the plan against the brief.** Run the same prompt as a generic designer would — if any part of your plan lands where *that* would land, it's a default, not a choice. Revise it; note what you changed and why. Only build once the plan is provably non-generic.
4. **Build** from the revised plan exactly. Sequence the work — design page-by-page / section-by-section; don't pile five tasks into one pass.
5. **Critique again while building.** If a browser tool is available (Playwright, chrome-devtools, or similar), don't drive it inline — dispatch a subagent to load the page, take screenshots, and report back a short critique. Screenshots, console output, and network/perf traces are verification noise: they belong in that subagent's own isolated context, not piled into the one doing the actual design/build work. Bring back findings, not raw tool output. Jot notes on what you tried so future passes don't repeat it.

Do the planning and iteration in your thinking; only show the user ideas you have real confidence will delight them.

## Copy is design material

Words exist to make the UI easier to understand. Bring the same intentionality to copy as to spacing and color.
- Write from the user's side of the screen. Name things by what people control ("notifications"), never by how the system is built ("webhook config").
- Active voice; a control says exactly what happens ("Save changes," not "Submit"). Keep the verb consistent through the flow — a "Publish" button produces a "Published" toast.
- Errors don't apologize and are never vague: what went wrong + how to fix it, in the interface's voice. An empty screen is an invitation to act.
- Sentence case, plain verbs, no filler. Each element does exactly one job.

## What you deliver

1. **The token plan** (color / type / layout / signature) — stated, and shown to be non-generic.
2. **The build** — grounded in tokens and the substrate, floor rules satisfied, one signature element, motion only where it serves.
3. **A one-line note** on the aesthetic risk you took and why it fits this brief.

## Mode: review

This is a read-only, perceptual complement to `apply`. It judges whether the
rendered interface helps a person complete its task; it does not make edits,
invent a code diff, or redefine the brand. Read
[`references/ultrareview.md`](./references/ultrareview.md) before reviewing.

1. State the interface's user task, primary action, and success signal. Inspect
   the actual implementation and its loading, empty, error, selected, disabled,
   and narrow-screen states where relevant.
2. Run `apply` first when the target is a source file with `tokens.json`.
   Its result proves only literal token/icon conformance, never visual quality.
3. Use a browser tool when available: capture desktop and narrow-mobile states,
   exercise changed or primary interactions, inspect the accessibility tree,
   and check console errors. If a rendered check is unavailable, say visual
   verification is pending rather than inferring pixels from source.
4. Report only applicable rubric findings, each as `blocker`, `important`, or
   `polish`, with observed evidence, user impact, and a concrete recommendation.
   Separate facts from design inferences. Include task clarity, hierarchy,
   system coherence, information density, state coverage, interaction,
   responsive behavior, motion, and performance.
5. Research a narrow pattern only when the repo and its brand cannot answer it.
   Record the reference URL and the principle borrowed; never copy an asset,
   full layout, or animation wholesale. Do not add a dependency during review.

## Source-guided craft

When outside research helps, use the sources in `references/ultrareview.md`
according to their declared role. Phosphor is useful for semantic icon lookup,
Recent and Layers for comparable patterns, and Animista for testing a single
motion treatment. Reuse the repo's installed icon family; Phosphor is never a
reason to mix icon systems or add a second package by default.

## Mode: generate

Full contract: `CONTRACT.md` (ships alongside this file). Derives (or re-derives) this repo's own `docs/design/BRAND.md` + `docs/design/tokens.json` — so the brand is a documented, living artifact instead of a one-time hand-written file. Portable: nothing here assumes any one repo's stack.

1. **Reference material.** Use every path/URL given as an argument (`Read` images directly — look at them, don't guess colors from a description). If none given, derive from what already exists in this repo: its current stylesheet/tailwind theme, screenshots the human points you at, or the conversation brief. If there's truly no reference and no existing UI to read from, **ask** rather than fabricating a palette from nothing. An existing `docs/design/BRANDBOOK.md` is compatible input: preserve it unless the human explicitly asks to migrate it to the portable `BRAND.md` format.
2. **Re-derivation, not a blank rewrite.** If `docs/design/BRAND.md` / `tokens.json` already exist, read them first. Keep everything still true, update only what the new material changes, and add a short note on what changed and why. Never silently overwrite prior reasoning.
3. **Derive the palette** (3–5 colors, per floor rule 3) by looking and reasoning, not by formula — record *why* each value (what in the reference it's reading), not just the hex. Flag anything read off a low-quality/compressed image area as an estimate, not a fact.
4. **Pick an icon set — reuse before adding.** Check `package.json` (or the repo's actual imports) for an icon library already in use (lucide-react, heroicons, @radix-ui/react-icons, phosphor, tabler, …) and keep using it. Only if none exists, propose one — default to **lucide-react** (MIT, tree-shakeable) — and call it out explicitly as a new dependency for the human to confirm before it's added. Never add a second one just to compare options.
5. **Enumerate current icon usage before mapping anything** (search before you assume) — grep the repo's UI source for ad-hoc emoji/symbol icons actually in use, group them into usage classes that make sense for *this* repo's structure (nav, buttons, status, cards, whatever it actually has). Map each distinct symbol to a specific named icon from the chosen set; no direct match → the closest semantic icon with a `note` explaining the substitution — never a silently-dropped row.
6. **Typography & spacing** — read from the repo's existing global stylesheet / tailwind config; don't invent new conventions unless the reference genuinely conflicts with what's there.
7. **Write both, kept in sync, validated against `tokens.schema.json`:**
   - `docs/design/BRAND.md` — the `BRAND.example.md` shape (Subject, Palette + reasoning, Typography, Signature/non-negotiables, Motion, Voice), plus a change note on re-derives.
   - `docs/design/tokens.json` — machine-readable: `{ contractVersion, generated, source?, confidence?, colors: {...}, iconSet?: {...}, icons: { <usageClass>: [{site, current, proposed, note?}] }, unchanged?: [...], oldThemeCssPath?: <path to the stylesheet colors were read from> }`. Stamp `contractVersion` to match `CONTRACT.md`'s current version (bump it only when `CONTRACT.md` itself changes, not on every brand re-derive). This is what makes `apply` deterministic instead of re-guessing each run.
8. Touch nothing else in this mode — no component/page files change, only `docs/design/`.

## Mode: apply

Full contract: `CONTRACT.md`. Deterministic check of one file against the current brand — no judgment call in it (string-matching a known token table is not a design decision), so it's a real script, not a model doing its best to be consistent:

```
npx tsx .claude/skills/design/scripts/apply.ts <page-or-component-path> [--out <report-path>] [--tokens <tokens.json-path>]
```

1. Requires `docs/design/tokens.json` (or whatever `--tokens` points at) to exist — the script errors and exits non-zero if it's missing, telling the caller to run `generate` first. Don't improvise a brandbook on the spot, and don't hand-write a report instead of running the script.
2. It reads the target file plus the tokens' icon mapping, and old-theme colors from whatever stylesheet `generate` recorded (or a short list of conventional fallback paths), and emits a Markdown report to stdout or `--out`.
3. `verdict: conforms` (no deviations) is a correct, expected output just as often as `deviations-found` — never re-run it hoping for a "better" answer, and never hand-add a finding the script didn't report.
4. **The script never edits the target file.** If asked to go further and actually apply a proposal as real code, that's separate work — route it through whatever this repo's normal review process is (a draft PR, not a silent auto-edit).
5. Re-running against the same file with an unchanged tokens.json produces byte-identical output — it's a pure function of two files on disk. If it ever disagrees with itself, that's a bug in the script, not acceptable variance.
