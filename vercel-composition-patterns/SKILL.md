---
name: vercel-composition-patterns
description:
  React composition patterns that scale. Use this skill proactively whenever
  building or refactoring React components, component libraries, design-system
  primitives, or reusable APIs so new code follows composition-first design
  instead of boolean prop proliferation. Invoke it before adding flags, mode
  props, renderX props, branching JSX, shared local state, or ad-hoc wrapper
  components. Reach for it even when the user only says "make this component more
  reusable", "clean up these props", "add another variant", "share behavior", or
  "design a better component API". Triggers on tasks involving compound
  components, slots, children-driven APIs, context providers, component
  architecture, or planning new React component APIs. Includes React 19 API
  changes.
---

# React Composition Patterns

Composition patterns for building flexible, maintainable React components.
Prefer these patterns during new implementation work, not only during
refactors. Avoid boolean prop proliferation by using compound components,
lifting state, and composing internals. These patterns make codebases easier
for both humans and AI agents to work with as they scale.

## When to Apply

Reference these guidelines when:

- Implementing new components or features that need flexible APIs
- Refactoring components with many boolean props
- Building reusable component libraries
- Designing flexible component APIs
- Reviewing component architecture
- Working with compound components or context providers
- Adding variants, states, sizes, or behaviors that might otherwise become more
  props and conditional branches
- Sharing behavior or layout across sibling components and deciding whether to
  use children, slots, context, or explicit subcomponents

Default to these guidelines when choosing the API shape of new React code.

## Trigger Heuristics

Pause and invoke this skill if any of these are true before or during
implementation:

- You are about to add a boolean prop such as `isOpen`, `hasIcon`, `showLabel`,
  `inline`, or similar API switches
- You are considering `variant`, `mode`, or `renderX` props and the component is
  starting to branch in multiple places
- You are designing reusable UI primitives, a design-system component, or a
  component family with shared state
- You need sibling pieces like `Tabs.List`, `Tabs.Trigger`, and `Tabs.Content`,
  or any API that naturally fits compound components
- The user asks for a cleaner, more composable, or more reusable component API
  without naming composition patterns explicitly
- You are deciding whether state belongs in a provider, a parent wrapper, or the
  consumer components themselves

## Rule Categories by Priority

| Priority | Category                | Impact | Prefix          |
| -------- | ----------------------- | ------ | --------------- |
| 1        | Component Architecture  | HIGH   | `architecture-` |
| 2        | State Management        | MEDIUM | `state-`        |
| 3        | Implementation Patterns | MEDIUM | `patterns-`     |
| 4        | React 19 APIs           | MEDIUM | `react19-`      |

## Quick Reference

### 1. Component Architecture (HIGH)

- `architecture-avoid-boolean-props` - Don't add boolean props to customize
  behavior; use composition
- `architecture-compound-components` - Structure complex components with shared
  context

### 2. State Management (MEDIUM)

- `state-decouple-implementation` - Provider is the only place that knows how
  state is managed
- `state-context-interface` - Define generic interface with state, actions, meta
  for dependency injection
- `state-lift-state` - Move state into provider components for sibling access

### 3. Implementation Patterns (MEDIUM)

- `patterns-explicit-variants` - Create explicit variant components instead of
  boolean modes
- `patterns-children-over-render-props` - Use children for composition instead
  of renderX props

### 4. React 19 APIs (MEDIUM)

> **⚠️ React 19+ only.** Skip this section if using React 18 or earlier.

- `react19-no-forwardref` - Don't use `forwardRef`; use `use()` instead of `useContext()`

## How to Use

Read individual rule files for detailed explanations and code examples:

```
rules/architecture-avoid-boolean-props.md
rules/state-context-interface.md
```

Each rule file contains:

- Brief explanation of why it matters
- Incorrect code example with explanation
- Correct code example with explanation
- Additional context and references

## Full Compiled Document

For the complete guide with all rules expanded: `AGENTS.md`
