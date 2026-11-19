---
name: ship-logic
description: "Deliver a ready logic-only spec through tickets, implementation, development validation, and review."
disable-model-invocation: true
---

# Ship Logic

Use a ready-to-implement spec by file path or tracker issue reference.

1. **Preflight.** Read `docs/agents/issue-tracker.md` and `docs/agents/domain.md`. If either is missing, ask the user to run `/setup-matt-pocock-skills`. Use the configured tracker for all hand-offs.
2. **Tickets.** Run `/to-tickets` in an isolated context with the spec reference and collect the ticket references. Ship authorization covers ticket granularity and dependency edges. Surface actual blockers such as a dependency cycle.
3. **Implement.** Run `/implement-spec` in this context with the spec and ticket references. It owns implementation, development validation, review, merge-back, and cleanup.
4. **Report.** Return the spec and ticket references, delivery branch and commit, development checks, evidence, and post-development verification from `/implement-spec`.

Once authorized, advance through these steps. Pause for a blocker that prevents progress or an authorization boundary required by `/implement-spec`.
