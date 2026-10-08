---
name: to-frontend-tickets
description: Split a frontend spec into UI-first and logic tickets with explicit blocking relationships, and publish them to the configured tracker.
disable-model-invocation: true
---

# To Frontend Tickets

Break a plan, spec, or conversation into **UI tickets** and **logic tickets** for `/implement-frontend-spec`: complete UI first, obtain user approval, then implement logic.

The issue tracker and triage label vocabulary should have been provided. Otherwise ask the user to run `/setup-matt-pocock-skills`.

## Steps

1. Gather the available context. If given a spec path, issue number, or URL, read its full body and comments. Explore the relevant codebase when needed; use the project's glossary and respect its ADRs.

2. Draft tickets sized for one fresh context window:
   - **UI**: one page, route, or component and its related variants, implemented from current Lanhu evidence. Include the Lanhu reference and target artboards, reproducible fixed data or preview state, visible requirements, and visual checks. Preserve existing behavior; leave new business behavior to logic tickets.
   - **Logic**: connect data, state, interactions, APIs, and tests to the completed UI. State the observable behavior and agreed testing seams. Work without UI changes needs only logic tickets.
   - Identify shared UI components first and give each shared implementation one owner. Other UI tickets depend on that owner instead of concurrently changing the same component.

3. Declare each ticket's **blocking edges**. Logic tickets depend on their corresponding UI tickets and any genuine logic prerequisites. UI tickets may depend on other UI tickets, but must be runnable without unfinished logic tickets. Resolve cross-phase dependencies by agreeing on a minimal preview contract or adjusting the breakdown with the user; never silently ignore a blocker. Check for dependency cycles. The user approval between phases is a workflow gate, not a fictitious ticket dependency.

4. Present the numbered breakdown with each ticket's title, type, blockers, deliverable, and acceptance criteria. Confirm granularity, dependency edges, UI/logic boundaries, and missing design or preview decisions with the user. Publish only after approval.

5. Publish one ticket per approved task in dependency order:
   - **Local files**: `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01`; blockers reference ticket numbers and titles.
   - **Issue tracker**: one issue per ticket, linked to the spec; use native blocking relationships where available, otherwise list them in the body. Apply the configured `ready-for-agent` label and existing type labels when available. The body always records the type.

Use this body for each ticket, adding the tracker's normal parent reference or local status as appropriate:

```markdown
# <Title>

**Type:** UI | Logic
**Parent:** <spec reference>
**What to build:** <deliverable and scope boundary>
**Blocked by:** <ticket references, or None>

## Acceptance criteria

- [ ] <verifiable criterion>

## UI evidence and preview (UI tickets only)

- Lanhu reference and target artboards: <references>
- Page or component and variants: <targets>
- Fixed data or reproducible preview state: <contract>

## Testing seams (logic tickets only)

- <observable behavior and agreed seam>
```

Keep tickets independently demonstrable or verifiable within their phase. UI visual checks follow `lanhu-ui-implement`, including its budget-exhausted delivery policy; UI approval remains the user's decision. Avoid speculative implementation paths and code snippets unless they record an already-agreed design decision. Do not close or modify the parent issue.
