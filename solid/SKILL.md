---
name: solid
description: |
  Apply SOLID principles to design flexible, maintainable, and testable
  production code. Use this skill whenever work involves class, module,
  interface, service, hook, or business-logic boundary design; refactoring
  responsibility-heavy code; improving testability; reducing coupling; adding
  extension points; choosing dependency direction; or deepening shallow modules
  by shrinking public interfaces and hiding implementation complexity. Invoke
  it before any non-trivial structural implementation and during any code
  review, PR review, or architecture audit involving abstractions, dependency
  wiring, large-file splits, new strategies/providers/repositories, or requests
  to clean up architecture and make code easier to extend.
---

# SOLID Principles

Five principles for building software that is easy to understand, extend, and
maintain. They reduce coupling, increase cohesion, and make code testable.

## When to Apply

Reference these principles when:

- Before writing implementation code, when translating agreed requirements into
  classes, modules, interfaces, and dependencies
- Designing new classes, modules, or interfaces
- Designing or refactoring services, hooks, repositories, controllers, or other
  business-logic units that need clear responsibilities
- Writing day-to-day production code that should strictly follow SOLID
- Refactoring code with too many responsibilities
- Reviewing PRs for architectural concerns
- Breaking apart god objects or fat interfaces
- Deciding where to draw module boundaries
- Deepening shallow modules: reducing public surface area while hiding
  implementation complexity behind cohesive interfaces
- Making code more testable
- Untangling concrete dependencies or hard-to-extend control flow
- Adding a new variant, provider, strategy, adapter, or integration and wanting
  to extend behavior without scattering edits across existing code
- The user asks for cleaner architecture without naming a specific principle

## Trigger Heuristics

Pause and invoke this skill if any of these are true before or during
implementation:

- You are about to create or refactor a non-trivial module and are deciding
  which responsibilities belong together
- You see branching by type, provider, mode, or integration and expect more of
  the same later
- High-level logic directly constructs concrete infrastructure dependencies
- A class, service, or module has become hard to test because setup is too coupled
- The user asks to make code cleaner, more extensible, more reusable, or easier
  to maintain, even without naming a pattern
- You are introducing interfaces, dependency injection, or boundary layers and
  need to choose where they actually help
- A module has many methods or complex parameters while doing little work, and
  may need to become a deeper module with a smaller interface

## Boundary

- Use this skill for technical design of code structure once the problem is
  understood
- Do not use it as a replacement for open-ended product discovery or
  brainstorming
- Do not use it as the main debugging workflow when the task is to investigate a
  failure first
- Pair it with implementation-specific skills only after the structural design
  direction is clear

## Quick Reference

| Principle | One-Liner | Red Flag |
| --------- | --------- | -------- |
| **S**RP | One reason to change | "This class handles X *and* Y *and* Z" |
| **O**CP | Add, don't modify | Growing `if/else` or `switch` chains for types |
| **L**SP | Subtypes are substitutable | Type-checking or special-casing in calling code |
| **I**SP | Small, focused interfaces | Empty method implementations or `throw new Error("Not implemented")` |
| **D**IP | Depend on abstractions | `new ConcreteClass()` inside business logic |
| Deep Modules | Small interface, deep implementation | Large public surface with thin pass-through logic |

See `references/PRINCIPLES.md` for detailed explanations and TypeScript examples.
See `references/deep-modules.md` for deeper guidance on shallow vs deep modules.

## Detection Checklist

Ask these questions for every class and module:

| Question | Violated Principle |
| -------- | ------------------ |
| Does this class have multiple reasons to change? | SRP |
| Do I need to modify existing code to add a new variant? | OCP |
| Does calling code need type-checks or special cases for subtypes? | LSP |
| Are implementors forced to stub out unused methods? | ISP |
| Does high-level logic directly instantiate infrastructure? | DIP |

## Applying SOLID at Different Scales

| Scale | SRP | OCP | LSP | ISP | DIP |
| ----- | --- | --- | --- | --- | --- |
| **Function** | Does one thing | — | — | — | Takes abstractions as params |
| **Class** | One reason to change | Extend via composition | Subtypes honor contracts | Implements only what it uses | Constructor injection |
| **Module** | One bounded context | Plugin architecture | Interchangeable implementations | Thin public API | Depends inward |
| **Service** | Single domain | New features = new services | API contract stability | Minimal API surface | Abstractions at boundaries |

## Relationships Between Principles

- **SRP + ISP**: Splitting responsibilities often means splitting interfaces too
- **OCP + DIP**: Depending on abstractions is what makes extension without modification possible
- **LSP + OCP**: If subtypes are substitutable, you can extend behavior by adding new subtypes
- **DIP + ISP**: Small focused interfaces make dependency inversion practical

## Common Anti-Patterns

| Anti-Pattern | Violated Principles | Fix |
| ------------ | ------------------- | --- |
| God class doing everything | SRP | Extract focused classes |
| `switch` on type across codebase | OCP, LSP | Replace with polymorphism |
| Subclass that throws "not supported" | LSP, ISP | Redesign hierarchy, split interface |
| Fat interface with 20 methods | ISP | Split into role-based interfaces |
| Business logic importing DB driver | DIP | Inject repository interface |
| Service creating its own dependencies | DIP | Constructor injection |

## Best Practices

### DO

- Start with SRP — it's the foundation for all others
- Use interfaces to define boundaries between components
- Let violations emerge from real problems, then fix them
- Prefer composition over inheritance for extending behavior
- Keep interfaces small and role-specific
- Prefer deep modules: small, stable public interfaces with substantial
  implementation hidden behind them
- Inject dependencies through constructors

### DON'T

- Apply SOLID dogmatically to trivial code (a 5-line utility doesn't need an interface)
- Create abstractions before you have at least two implementations
- Confuse SRP with "single method" — it's about reasons to change, not size
- Force Liskov compliance on classes that shouldn't be in the same hierarchy
- Over-segregate interfaces into single-method fragments when a cohesive group makes sense

## Code Review Protocol

When the task is a **code review, PR review, or architecture audit**, run through
this protocol before giving feedback. Never skip it — even clean-looking code
benefits from a structured pass.

### Step 1 — Rapid Triage (per file / module)

For each non-trivial module being reviewed, answer the five Detection Checklist
questions above. Mark each as ✅ (no violation), ⚠️ (mild concern), or 🚨
(clear violation).

### Step 2 — Prioritize Findings

| Severity | Meaning | Action |
| -------- | ------- | ------ |
| 🚨 Blocker | Will cause real pain at scale — coupling, untestable, or closed to extension | Request changes |
| ⚠️ Suggestion | Moderate violation, acceptable now but will worsen | Comment with concrete fix |
| ℹ️ Nit | Minor style or over-engineering risk | Optional note |

### Step 3 — Write Actionable Feedback

For every finding, provide:

1. **Which principle** is involved (SRP / OCP / LSP / ISP / DIP)
2. **What the concrete problem is** — e.g., "This service imports `PrismaClient`
   directly, so the business logic layer cannot be unit-tested without a real DB"
3. **A suggested fix** — even a one-sentence direction or a code snippet

### Step 4 — Acknowledge What Works

SOLID reviews are not just a red-pen pass. Call out correct abstractions,
well-defined boundaries, and good dependency direction. This helps the author
calibrate and keeps the review balanced.

### Review Output Template

```
## SOLID Review

### Violations
- [🚨/⚠️/ℹ️] **[PRINCIPLE]** `path/to/file.ts:line`
  Problem: <one sentence>
  Fix: <concrete suggestion>

### Strengths
- <what the code gets right from a SOLID perspective>

### Summary
<1–2 sentence verdict on the overall structural health>
```
