---
name: grill-technical-design-with-docs
description: Grill how an agreed feature should be encapsulated into deep modules before its spec is written.
disable-model-invocation: true
---

# Grill Technical Design With Docs

Design the implementation architecture for an agreed requirement before `/to-spec`. Keep accepted business behaviour fixed. Decide what the change should encapsulate, where its seams belong, and how callers and tests use it now, before a later architecture cleanup becomes necessary.

Treat this as the feature-scoped counterpart of `/improve-codebase-architecture`: apply its deepening discipline to the code the requirement will change. Skip its repo-wide scan and HTML candidate report. Use `/codebase-design` and read its `DEEPENING.md` before questioning the user. Run the interview with `/grilling` and maintain durable domain knowledge with `/domain-modeling`.

The completion criterion is **architecture-ready**: the spec can name the intended modules, interfaces, seams, dependencies, and test surfaces without inventing them.

## 1. Recover the change path

Read the agreed requirements, relevant `CONTEXT.md`, ADRs, code, tests, and recent changes in the affected area. Trace the current path from caller to observable result. Find facts in the repository rather than asking the user to recall them.

Write a short working diagnosis before the first round:

- which existing modules and callers the requirement touches;
- where orchestration, state, side effects, or domain rules are currently spread across callers;
- which existing interfaces the change could deepen instead of adding another shallow module;
- which constraints come from accepted business behaviour or ADRs.

Scope the architecture work to this requirement and the friction it exposes. Leave unrelated codebase health to `/improve-codebase-architecture`.

## 2. Build the deepening tree

Use the `/codebase-design` vocabulary exactly: **module**, **interface**, **depth**, **seam**, **adapter**, **leverage**, and **locality**.

Build questions around the shape of the implementation:

- **Module responsibility**: what complete capability should one module own, and what complexity should it hide from callers?
- **Interface**: what are the fewest useful entry points, inputs, results, invariants, ordering rules, and error modes callers must know?
- **Seam placement**: where should callers cross into that module, and which current seams should disappear or remain internal?
- **Ownership**: which module owns orchestration, state transitions, side effects, retries, and failure translation?
- **Dependencies**: classify each dependency using `DEEPENING.md`; introduce a port only when production and test or multiple production adapters make the seam real.
- **Test surface**: which behaviours should tests exercise through the module's interface, and which shallow-module tests can be replaced?
- **Adoption**: which callers migrate, what compatibility must remain, and whether the change can land as one slice.

Apply the deletion test to every proposed module. If deleting it merely moves the same coordination back into its callers, it has depth. If deleting it removes indirection without spreading complexity, reject it as shallow.

For a consequential interface with several credible shapes, use the `DESIGN-IT-TWICE.md` process before asking the user to choose. Compare alternatives by depth, locality, seam placement, and migration cost.

## 3. Keep the frontier technical

Classify every candidate question before adding it to the design tree:

- **Architecture**: a different answer changes module responsibility, interface, seam placement, dependency strategy, ownership, test surface, or migration shape. Ask it.
- **Mechanics**: a different answer only changes private control flow, helper decomposition, local data structures, or library syntax while preserving the agreed architecture. Record it as implementer latitude.
- **Probe**: code reading cannot settle a runtime, performance, or UI fact. Route that branch through `/handoff` to `/prototype`, then bring the evidence back.
- **Business gap**: the technical options expose an unresolved observable behaviour. Name the missing decision and block only that branch for business re-alignment.

Implementation-level encapsulation belongs on the frontier even when it affects only one ticket. "Local" is not a reason to defer a choice when that choice determines depth, locality, or the interface used by tests.

Treat settled product behaviour as an input. When several technical shapes preserve it, recommend the strongest one and ask the user to decide between those shapes.

## 4. Grill in rounds

Follow `/grilling`: ask the whole unblocked **Architecture** frontier in one numbered round, recommend an answer for every question, then wait.

Ground each question in current code. Prefer concrete contrasts such as:

- callers orchestrate three steps versus one module owns the workflow;
- callers assemble transport fields versus the module accepts a domain input;
- tests mock private collaborators versus tests cross one stable interface;
- a dependency stays internal versus a real adapter sits at the seam.

When an answer opens a child question, classify it again. Add **Mechanics** leaves to the latitude ledger instead of expanding them. Continue independent branches while a probe or business gap is blocked.

## 5. Capture durable knowledge

Use `/domain-modeling` only when the design resolves domain vocabulary or produces an ADR-worthy decision:

- update `CONTEXT.md` for domain terms, never implementation structure;
- create an ADR only for a hard-to-reverse, surprising choice made through a real trade-off;
- keep ordinary module and interface decisions in the conversation that `/to-spec` will consume.

The conversation remains the primary source for `/to-spec`; do not create a competing specification.

## 6. Apply the architecture-ready gate

The phase is complete when:

- each capability affected by the change has a clear owning module, either existing or proposed;
- each module's interface states everything callers and tests must know, and no internal seam leaks through it;
- state, side effects, dependencies, adapters, and failure translation have owners;
- the design passes the deletion test and improves locality or leverage over the current path;
- the test surface and migration path are explicit;
- every remaining question is Mechanics, Probe, or a named Business gap.

Before asking for confirmation, report:

```markdown
## Technical-design readiness

### Proposed modules and seams
- ...

### Interfaces and hidden complexity
- ...

### State, side effects, and dependencies
- ...

### Test surface and migration
- ...

### Implementer latitude
- ...

### Business gaps
- None | ...

### Prototype evidence
- None | ...

### Durable docs updated
- None | ...

### Gate
- Ready for `/to-spec` | Not ready: ...
```

Ask the user to confirm the proposed encapsulation. After confirmation, hand the unchanged session context to `/to-spec`, then `/to-tickets`. `/implement` and `/tdd` may choose private mechanics, but they must preserve the agreed modules, interfaces, seams, and test surfaces.
