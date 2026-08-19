---
name: grill-technical-design-with-docs
description: A scoped interview that aligns technical contracts after business boundaries are settled, while preserving local implementation latitude for tickets and TDD.
disable-model-invocation: true
---

# Grill Technical Design With Docs

Settle the technical decisions that `/to-spec` and `/to-tickets` need without designing each ticket's implementation. Run a `/grilling` session using `/codebase-design` and `/domain-modeling`.

Use this phase after business alignment and before `/to-spec`. Its completion criterion is **contract-complete**, not implementation-complete.

## 1. Establish the decision horizon

Read the relevant requirements, `CONTEXT.md`, ADRs, and code before questioning the user. Facts come from those primary sources; decisions come from the user.

Classify every candidate question before adding it to the design tree:

- **Contract** — different answers change what a caller, test, another module, another ticket, or an operator must know.
- **Local** — different answers remain inside one ticket and can be changed without altering an agreed contract.
- **Probe** — conversation cannot answer it reliably; state, business logic, performance, or UI must be run or seen.
- **Business** — the answer changes observable product behaviour or contradicts the agreed business boundary.

Only Contract and unresolved Business decisions belong on the grilling frontier. Record Local choices as implementer latitude. Route Probe questions through `/handoff` → `/prototype` → `/handoff`, leaving unrelated frontier branches active.

## 2. Build the contract tree

Use `/codebase-design` to examine:

- modules, their responsibilities, and seam placement;
- interfaces, including invariants, ordering, observable errors, configuration, and material performance characteristics;
- state and side-effect ownership;
- dependencies and adapters that genuinely vary;
- schemas, protocols, compatibility, migration, security, and deployment constraints;
- cross-ticket contracts and blocking edges;
- hard-to-reverse choices with real alternatives.

A detail becomes Contract only when it changes one of those surfaces. Function decomposition, private types, ordinary control flow, and edge handling remain Local while they preserve the contract. This keeps `/implement` and `/tdd` responsible for discovering the cheapest correct implementation.

## 3. Apply specialized design lenses narrowly

Reach for a framework-specific design skill only when its subject is on the Contract frontier.

For React, use `/vercel-composition-patterns` when designing a reusable component interface, component family, shared-state provider, or variant strategy. Treat JSX structure and private component decomposition as Local unless callers depend on them.

## 4. Grill in rounds

Follow `/grilling`: ask the whole currently unblocked Contract frontier in one numbered round, recommend an answer for every question, then wait. Prefix each question title with `[Contract]` or `[Business]` so the decision horizon stays visible.

When an answer opens a child question, classify that child again before admitting it to the frontier. Local descendants are leaves: add them to the latitude ledger instead of expanding them.

If a Business question requires renewed alignment with a business owner, mark the affected branch blocked and give the user a concise question to take back. Continue with independent frontier branches.

## 5. Capture durable knowledge

Use `/domain-modeling` throughout:

- update `CONTEXT.md` only for resolved domain vocabulary;
- create an ADR only for a hard-to-reverse, surprising decision produced by a real trade-off;
- keep ordinary implementation choices in the latitude ledger, not in the glossary or ADRs.

The conversation remains the primary source for `/to-spec`; do not create a competing specification in this phase.

## 6. Apply the contract-complete gate

The phase is complete when all of the following are true:

- every caller-facing and cross-ticket interface is settled;
- state, side effects, and external failure ownership are settled;
- hard-to-reverse constraints and migration obligations are settled;
- tickets can be written without inventing a new cross-ticket contract;
- every remaining question is classified as Local, Probe, or a named Business re-alignment.

Before asking for confirmation, report:

```markdown
## Technical-design readiness

### Resolved contracts
- ...

### Implementer latitude
- ...

### Business re-alignment
- None | ...

### Prototype detours
- None | ...

### Durable docs updated
- None | ...

### Gate
- Ready for `/to-spec` | Not ready: ...
```

Ask the user to confirm shared understanding. After confirmation, hand the unchanged session context to `/to-spec`, then `/to-tickets`; implementation details belong to the resulting tickets and `/implement`.
