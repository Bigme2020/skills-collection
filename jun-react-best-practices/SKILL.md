---
name: jun-react-best-practices
description: "Default React skill for component architecture, single responsibility, state/data-flow, and pragmatic performance guidance. Use whenever working in a React, Next.js, or React Native repo, especially when you see react dependencies, .tsx/.jsx files, hooks, props/state, component composition, client UI, App Router, Server Actions, or RSC. Apply when designing, writing, reviewing, simplifying, or refactoring components, hooks, forms, context, lists, dialogs, and feature folders. 当项目是 React/Next.js/React Native，或存在 react 依赖、.tsx/.jsx、hooks、props/state、客户端 UI、RSC、server actions 时默认使用。"
---

# Jun React Best Practices

## Overview

Apply these rules by default in any React codebase unless the task is clearly unrelated to components, hooks, state, effects, rendering, or client UI logic.

Treat this skill as the default React guardrail for architecture and maintainability first, then performance. Keep code cohesive, reusable, and easy to reason about. Prefer existing project conventions over introducing new abstractions or libraries without a strong reason.

## Default Stance

- Prefer clear component boundaries over clever abstractions.
- Prefer composition over large multi-purpose components.
- Prefer existing project stack over introducing a competing library.
- Prefer derived state over duplicated state.
- Prefer plain functions over hooks when React primitives are not needed.
- Prefer measured optimization over premature optimization.
- Apply Next.js and RSC rules only when the repository actually uses them.

## Core Architecture

### Component responsibilities

- Give each component one clear job.
- Split mixed concerns in this order: pure utilities -> hooks/store logic -> sub-components.
- Extract pure logic to `<name>.utils.ts` or shared `src/utils/` before creating a custom hook.
- Split large TSX files when render structure, handlers, and domain logic stop being readable; treat about 100-150 lines as a smell, not an absolute law.
- Avoid internal `renderXxx()` helpers when a real component with props would be clearer.
- Store selection by stable ID and derive the selected item from current data.

### High cohesion, low coupling

- Co-locate feature-specific components, hooks, utils, and types.
- Avoid one feature change requiring edits across many unrelated files.
- Keep sub-components focused and prop contracts small.
- Reusable logic belongs in shared hooks/utils; feature-only logic stays near the feature.

### Props, params, and naming

- Destructure props and object parameters when it improves readability.
- When a function has 2+ parameters, prefer one params object with a named interface placed immediately above the function.
- Avoid boolean flag parameters when separate functions or named options would be clearer.
- Use kebab-case file names.
- Prefer one non-trivial hook per file.

## Component Structure

- Keep a predictable order inside components: types -> state -> computed values -> effects -> handlers -> render.
- Keep simple handlers inline when that is clearer; otherwise use one named handler per interaction.
- Avoid handler factories unless they are clearly justified.
- Use early returns in render paths instead of deep nesting or ternary chains.
- Use explicit boolean conditions in JSX when falsy values like `0` could render unexpectedly.
- Move static data and pure helper functions outside the component body.

## Hooks, State, and Effects

### Hooks

- If logic does not need state, effects, refs, or context, make it a plain function instead of a hook.
- Split broad hooks into focused hooks by concern, such as fetch, filter, pagination, or form state.
- Keep hook inputs explicit and avoid hidden reads from globals or broad context unless that is the hook's main purpose.
- Return narrow APIs like `{ data, isLoading, error }` instead of large bags of unrelated state and setters.
- If the project already has a state manager such as Zustand, MobX, or Redux, prefer extending the store over creating many overlapping hooks.

### State and effects

- Derive values during render when they can be computed from props or existing state.
- Do not use effects only to mirror props into state.
- Put user-triggered side effects in event handlers instead of modeling them as state plus effect.
- Narrow effect dependencies to the primitive values that actually matter.
- Use functional `setState` when the next state depends on the previous state.
- Use lazy `useState(() => ...)` initialization for expensive initial values.
- Use `useRef` for transient values that should not trigger a re-render on every update.

## Memoization and Optimization

- Default: do not add `useMemo`, `useCallback`, or `memo` just because they exist.
- Use memoization only when there is a measured bottleneck, an expensive subtree, or a stable-prop boundary that materially matters.
- Never wrap simple primitive expressions in `useMemo`.
- If a memoized component needs a default non-primitive prop, hoist that default to a constant.
- When non-urgent updates would otherwise block interaction, use `startTransition` or `useTransition`.
- Choose readability first unless profiling shows the hot path is real.

## Data Fetching and Async Work

### Default policy

- Follow the repository's existing data-fetching stack first.
- Do not introduce both TanStack Query and SWR into the same project without a strong reason.
- Avoid ad hoc `useState` + `useEffect` fetching in client components when the project already has a data layer.

### If no clear project convention exists

- Prefer TanStack Query for richer client-side server-state workflows, especially when mutations, cache invalidation, and query coordination matter.
- Prefer SWR for simpler read-heavy client fetching where lightweight cache and revalidation are enough.
- Prefer `react-hook-form` when forms have multiple fields, validation, and submission state.

### Async patterns

- Defer `await` until the value is actually needed.
- Use `Promise.all()` for independent work.
- Start independent async work early and await later.
- Use Suspense boundaries strategically when they improve perceived loading behavior.

## Rendering and UI Performance

- Hoist static JSX or constants when doing so removes repeated work without hurting clarity.
- Use explicit conditional rendering instead of `&&` when `0`, `NaN`, or other falsy values could leak into the UI.
- Use `content-visibility` for long lists when browser support and layout behavior are appropriate.
- Avoid hydration flicker by aligning server and client output; suppress hydration warnings only for intentionally mismatched content.
- Animate wrapper elements instead of SVG nodes directly when that avoids browser rendering issues.

## Next.js and RSC Rules

Apply this section only when the project clearly uses Next.js, App Router, Server Actions, or React Server Components.

- Treat Server Actions like public API routes: validate input, authenticate, and authorize inside the action.
- Keep server/client boundaries small; pass only the fields the client actually needs.
- Avoid duplicate serialization across RSC boundaries.
- Use `React.cache()` for per-request deduplication of non-`fetch` async work.
- Use an LRU or equivalent shared cache only when cross-request reuse is actually useful in the deployment model.
- Restructure server component trees to parallelize fetches through composition.
- Use `after()` or equivalent non-blocking patterns for logging, analytics, and cleanup that should not delay the response.
- Prefer direct imports, dynamic imports, and deferred third-party loading when bundle size is a real concern.

## Small, High-Value JavaScript Rules

Keep only the micro-optimizations that are broadly useful and low-risk:

- Use early returns to flatten control flow.
- Use `Set` and `Map` for repeated membership or keyed lookups.
- Use `toSorted()` or immutable equivalents instead of mutating arrays in React flows.
- Build lookup maps once when the same search is repeated many times.
- Avoid layout thrashing by batching DOM reads and writes.

Do not trade maintainability for tiny wins.

## Conflict Resolution

When rules appear to compete, apply them in this order:

1. Preserve correctness.
2. Follow existing project conventions and libraries.
3. Improve clarity and responsibility boundaries.
4. Reduce coupling and duplicated state.
5. Apply performance techniques only when the benefit is concrete.

## Quick Checklist

- Does this component or hook do more than one thing?
- Can any logic move to a plain utility before introducing more React structure?
- Is state duplicated instead of derived?
- Are props, params, and return values narrower than they were before?
- Is the chosen data-fetching approach aligned with the existing stack?
- Is any memoization justified by a real cost?
- If this is Next.js or RSC code, are server boundaries, auth, and serialization handled deliberately?
