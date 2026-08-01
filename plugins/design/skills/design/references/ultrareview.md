# Ultrareview reference

Use this guide for `/design review` and for task-specific design research. It
does not replace the repo's brand, change the deterministic `apply` result, or
authorise a dependency addition.

## Source roles

- **[Phosphor Icons](https://phosphoricons.com/)** — research semantic icon
  coverage and weight variants. Its experimental public REST API supports fuzzy
  lookup at `GET https://api.phosphoricons.com/v1/search?q=<term>`, plus icon
  metadata and SVG generation. No official MCP was identified. Keep the host
  repo's existing icon family unless a deliberate migration is approved.
- **[Recent](https://recent.design/info)** — curated work across web
  interfaces, branding, product, typography, motion, illustration, and 3D.
  Use for hierarchy or tone comparisons; record the specific example and
  principle, never lift a full layout, copy, or asset.
- **[Layers](https://layers.to/explore)** — searchable community screens and
  UI components. Search for a narrow pattern (such as a task board, filter,
  empty state, or form flow), then judge it against the actual user task.
- **[Animista](https://animista.net/)** — playground for parameterised CSS
  animations and generated keyframes. Use to prototype one intentional motion
  treatment; generated CSS is not an interaction model and must still meet
  reduced-motion and performance requirements.

## Rubric

Use only criteria that apply and attach observed evidence to every finding.

| Criterion | Review question |
|---|---|
| Task clarity | Can a first-time user identify purpose, current state, and next meaningful action? |
| Hierarchy | Does scan order put task, primary action, and urgent state before metadata and chrome? |
| System coherence | Do color, type, spacing, radius, elevation, and icon weight follow the host brand/component system? |
| Information density | Is content grouped by decision, with disclosure instead of blank expanse or chip-wall overload? |
| State coverage | Are loading, empty, error, selected, disabled, and success states honest and useful? |
| Interaction | Are controls recognisable, keyboard-reachable, focus-visible, and accompanied by immediate feedback? |
| Responsive | Does a narrow viewport preserve task order, tap targets, readable text, and access to all controls? |
| Motion | Does every effect communicate change, orientation, feedback, or direct manipulation; is it reduced-motion-safe? |
| Performance | Are effects bounded and assets/dependencies justified, with no scroll hijacking, layout thrash, or page-wide filter cost? |

## Evidence standard

When a runnable app is available, capture desktop and narrow-mobile rendered
states, primary/control interaction evidence, an accessibility snapshot, and
console errors. Without that evidence, call the result a source review and say
that visual verification is pending.
