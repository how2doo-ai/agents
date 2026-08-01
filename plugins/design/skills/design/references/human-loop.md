# Human-directed design loop

Use this reference when a person is choosing a new interface direction or
asking for a deep review. It turns an agent's research into a small decision
surface a human can inspect, edit, and approve.

## Why this shape

Current design-agent tools converge on the same operating model:

- planning is a no-edit space for exploring and approving an approach;
- narrow, component-sized increments are easier to test and correct than a
  whole-page rewrite;
- project knowledge (product intent, users, roles, visual rules, components)
  needs to travel with every request; and
- a rendered UI in its important states is the evidence for a visual decision.

These are workflow constraints, not a house style. They prevent the agent from
mistaking an attractive first draft for a human-approved result.

## The editable brief

Keep the brief to one screen. The human should be able to correct it quickly.

| Field | What to record |
|---|---|
| Actor and context | Who is using this surface, and when? |
| Primary task | The one thing they must accomplish now. |
| Success signal | What observable outcome says the task worked? |
| Target and scope | Route/component and the explicitly included area. |
| Content and data | Real examples, important data shape, roles/permissions. |
| Constraints | Brand/system, technical limits, accessibility, time, and things not to change. |
| Evidence/references | Existing screen, annotated screenshot, brand material, or a narrow comparable pattern. |

Ask a question only if its answer changes the user task, information hierarchy,
or implementation boundary. Do not interrogate someone merely to obtain a
preferred color adjective.

## Direction gate

Use it only for material choices. Present no more than three options, each
named for what it optimises and expressed as a decision a person can make.

| Option | Optimises | Trade-off | Typical evidence |
|---|---|---|---|
| `Scan-first` | Fast overview and triage | Less contextual detail at once | Dense list/board with deliberate disclosure |
| `Decision-first` | One safe, high-confidence action | Lower information density | Guided next step plus supporting context |
| `Context-first` | Investigation and comparison | More reading before action | Detail pane, history, and linked context |

These are examples, not preselected visual directions. Replace them with axes
that fit the actual job. Name a recommendation and why it best meets the brief.
If the human says “choose”, record that delegation in the handoff.

## State and evidence ledger

Before building, agree which items apply. Capture only applicable evidence;
unnecessary screenshots slow review and hide the decisive information.

| Area | Minimum evidence |
|---|---|
| Layout | Desktop plus narrow-mobile viewports, with widths recorded. |
| Task | Primary action completed or a clear reason it cannot be. |
| States | Relevant loading, empty, error, success, selected, disabled, and permission states. |
| Access | Keyboard path/focus and accessibility-tree or equivalent evidence. |
| Runtime | Console errors; performance or network evidence only for a material risk. |
| Motion | Purpose, trigger, reduced-motion behaviour, and a still fallback. |

An implementation is not automatically accepted because each box exists. The
agent ends by identifying the one human decision, if any, that remains.

## Feedback that becomes learning

Receive feedback in the user's own words. Convert it into one of three forms:

1. **This increment** — a concrete edit and acceptance criterion.
2. **This surface** — a local rule that stays in the task/PR discussion.
3. **Recurring product rule** — a short, confirmed `BRAND.md` change note.

Never convert “I like it” into a token, a component rule, or a new aesthetic
doctrine. Confirm the recurrence and scope first. Preserve a rejected option
and its reason in the handoff so the next pass does not rediscover it.
