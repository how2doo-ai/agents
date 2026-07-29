<!-- worker task template — "how tasks look". Injected into every iteration;
     every bd issue the worker files MUST follow this shape. Owner-editable:
     change this file (or point WORKER_TASK_TEMPLATE at your own) and every
     surface — loop, studio agents, interactive — files tasks your way. -->

Every task/issue you file has:

- **Title**: `<area>: <outcome>` — the outcome, not the activity
  (e.g. `feed: item cap decision`, not `look into feeds`).
- **Acceptance criteria** in the description: 1–4 `done-when` bullets a
  stranger could verify, including edge cases by name.
- **Test names**: the test(s) that will prove it (file + case name), written
  before implementation starts.
- **Priority**: P0 harness-blocker · P1 on the critical path to a criterion ·
  P2 valuable, not blocking · P3 polish/decision. When unsure: P2.
- **Blockers**: link ids it depends on (`bd dep add`), never "do X first" prose.
