---
name: ship-frontend
description: "Deliver a ready frontend spec through UI and logic tickets, UI screenshot approval, and implementation."
disable-model-invocation: true
---

# Ship Frontend

Use a ready-to-implement spec by file path or tracker issue reference.

1. **Preflight.** Read `docs/agents/issue-tracker.md` and `docs/agents/domain.md`. If either is missing, ask the user to run `/setup-matt-pocock-skills`. Use the configured tracker for all hand-offs.
2. **Tickets.** Run `/to-frontend-tickets` in an isolated context with the spec reference and collect the ticket references. Ship authorization covers ticket granularity, dependency edges, and UI/logic boundaries. Surface actual blockers such as a dependency cycle or a UI ticket that needs unfinished logic.
3. **Implement.** Run `/implement-frontend-spec` in this context with the spec and ticket references. It owns the UI screenshot approval, implementation, review, merge-back, and cleanup.
4. **Report.** Return the spec and ticket references, delivery branch and commit, development checks, evidence, and post-development verification from `/implement-frontend-spec`.

Once authorized, advance through these steps. Pause for UI screenshot approval, a blocker that prevents progress, or an authorization boundary required by `/implement-frontend-spec`.
