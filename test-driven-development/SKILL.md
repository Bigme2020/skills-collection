---
name: test-driven-development
description: Strict test-first workflow for feature work, bug fixes, behavior-changing refactors, regression tests, interface design, and mock/test-utility decisions. Use before writing production code when the user asks for TDD, test-first development, red-green-refactor, behavior tests, integration-style tests, or regression coverage. Actively consider this skill for every implementation task. Requires failing-test evidence before production code, RED->GREEN verification, and a Chinese test-case summary in implementation responses.
---

# Test-Driven Development

## Output Language Requirement

All user-facing TDD content must be in Simplified Chinese unless the user explicitly requests another language.

At minimum, this includes:

- Test-case summary blocks
- Blocked/error notices related to TDD flow
- Test-case descriptions

This does not require translating unrelated non-TDD parts of the response.

## Core Principle

```text
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST.
```

Tests should verify behavior through public interfaces, not implementation details. Code can change entirely; tests should still pass if behavior stays the same.

Good tests are integration-style: they exercise real code paths through public APIs. They describe what the system does, not how it does it. A good test reads like a specification: `user can checkout with valid cart` tells you exactly what capability exists.

Bad tests are coupled to implementation. They mock internal collaborators, test private methods, assert call counts, or verify through external means instead of the product interface. Warning sign: a refactor breaks the test even though behavior did not change.

See `tests.md` for examples and `mocking.md` for mocking guidance. Before heavy use of mocks or test utilities, also read `testing-anti-patterns.md`.

## When to Use

Use this skill for:

- New feature implementation
- Bug fixes after the root cause is understood
- Behavior-changing refactors
- Regression tests
- Public interface design where testability matters
- Mock or test-utility design
- Requests mentioning TDD, test-first, RED/GREEN, red-green-refactor, behavior tests, integration-style tests, or regression coverage

Actively consider this skill before every implementation task. If the user explicitly approves non-TDD, follow the Exception Protocol.

## Execution Contract

Follow this contract for every implementation task:

1. Write one failing test for one behavior before production code.
2. Verify RED first: the test fails for the expected behavior reason, not setup/runtime noise.
3. Write the smallest production change to reach GREEN.
4. Verify GREEN with targeted tests.
5. Refactor only after GREEN, then verify tests stay GREEN.
6. Include a Chinese test-case summary and verification evidence in the final response.

If any step is missing, stop and report:

`阻塞：缺少测试用例验证证据。`

## Internal State Machine

Only these transitions are valid:

`INIT -> RED_VERIFIED -> GREEN_VERIFIED -> REFACTOR -> DONE`

Invalid transitions:

- `INIT -> GREEN_VERIFIED`
- `INIT -> DONE`
- `RED_VERIFIED -> DONE`

Do not expose state labels in user-facing output unless the user explicitly asks.

## Required User-Facing Block

When you write or modify production code, include this section in the response:

```md
[测试用例摘要]
- 目标行为: <本次变更要验证的用户/业务行为>
- 用例清单:
  - <用例 1：场景 + 预期结果>
  - <用例 2：场景 + 预期结果>
- 执行命令: <精确命令>
- 结果摘要: <通过/失败数量；若失败给出关键原因>
- 准确性结论: <这些用例为何能准确覆盖本次变更>
```

Constraints:

- Use Simplified Chinese for every line and every test-case description.
- Do not include `Stage`, `RED_VERIFIED`, or `GREEN_VERIFIED` unless explicitly requested.

## Context and Language Alignment

When exploring the codebase, use existing project vocabulary so test names, interface names, and behavior descriptions match the domain.

Relevant sources include:

- Existing production code and tests
- Project documentation and requirements
- OpenSpec specs such as `openspec/specs/**/spec.md` and `openspec/**/specs.md`
- Applicable `AGENTS.md` files, including repository, subdirectory, and user-level instructions

Do not make documentation lookup a default blocker. Read these sources when they affect naming, public interface shape, behavior boundaries, or test commands.

## Anti-Pattern: Horizontal Slices

Do not write all tests first, then all implementation. That is horizontal slicing.

Horizontal slicing produces weak tests:

- Tests written in bulk test imagined behavior, not actual behavior
- Tests drift toward data shape or function signatures instead of user-visible behavior
- Tests become insensitive to real changes
- Test structure gets locked in before the implementation teaches you what matters

Correct approach: vertical slices through tracer bullets. One test -> one implementation -> repeat.

```text
WRONG:
  RED:   test1, test2, test3, test4
  GREEN: impl1, impl2, impl3, impl4

RIGHT:
  RED->GREEN: test1->impl1
  RED->GREEN: test2->impl2
  RED->GREEN: test3->impl3
```

## Workflow

### 1. Clarify Only What Is Unclear

Before writing code, inspect relevant code and tests. Ask the user only when interface changes, behavior priority, or test scope cannot be inferred.

Clarify these when needed:

- What public interface should change?
- Which behaviors are most important to test?
- Which edge cases matter for this task?

You cannot test everything. Focus on critical paths and complex logic, not every possible edge case.

### 2. RED: Tracer Bullet

Write one minimal test for one behavior.

Requirements:

- Behavior-focused test name
- One behavior per test
- Public interface only
- Prefer real behavior checks over mock-behavior checks
- Test would survive internal refactor

Run a targeted test command, for example:

```bash
pnpm test path/to/file.test.ts
npm test path/to/file.test.ts
```

RED acceptance criteria:

- Test fails
- Failure is not a runtime/setup error
- Failure reason matches missing behavior

If the test passes immediately, it is invalid for this change. Rewrite it.

### 3. GREEN: Minimal Implementation

Write the smallest production code needed to satisfy the failing test.

Constraints:

- No speculative abstractions
- No unrelated refactors
- No hidden feature expansion
- No extra behavior for future imagined tests

Run the same targeted test command again.

GREEN acceptance criteria:

- Targeted tests pass
- No newly introduced failures in the related scope

### 4. Repeat Incrementally

For each remaining behavior:

```text
RED:   Write next behavior test -> verify expected failure
GREEN: Minimal implementation -> verify pass
```

Rules:

- One test at a time
- Only enough code for the current test
- Do not anticipate future tests
- Keep assertions on observable behavior

### 5. Refactor After GREEN

Refactor only after all targeted tests are GREEN.

Allowed refactors:

- Rename for clarity
- Remove duplication
- Extract helpers without behavior change
- Improve names, seams, or helper boundaries exposed by the tests

If refactoring or interface design raises non-trivial responsibility, dependency-direction, module-boundary, abstraction, or deep-module questions, invoke the `solid` skill. Keep TDD order intact: no production code before RED, and structural refactors happen only after GREEN unless you are designing the public seam needed for the first failing test.

See `refactoring.md` and `interface-design.md` for TDD-local guidance. Use the `solid` skill for structural design beyond that.

Run tests after each refactor step and stay GREEN.

## Mocking Rules

Mock at system boundaries only:

- External APIs
- Databases when a test DB is impractical
- Time/randomness
- File system when real filesystem tests are too slow or brittle

Do not mock:

- Your own modules/classes
- Internal collaborators
- The method whose side effect is part of the assertion

Before any mock, answer:

1. What real side effects does this dependency produce?
2. Which side effects does this test rely on?
3. Why is this mock level the narrowest safe level?

If any answer is unknown, inspect real behavior first.

## Exception Protocol

Default is strict TDD. Non-TDD is allowed only with explicit user approval.

Required approval format:

`Approve non-TDD for this task: <reason>`

Without that explicit approval, do not skip TDD.

## Anti-Rationalization Rules

Treat these statements as violations:

- "I will add tests after implementation."
- "This is too small to test."
- "I already manually verified it."
- "I can do one quick fix first."
- "I am sure this will pass."

When one appears, stop and return to RED.

## Checklist Per Cycle

```text
[ ] Test describes behavior, not implementation
[ ] Test uses public interface only
[ ] Test would survive internal refactor
[ ] RED failure reason was verified
[ ] Code is minimal for this test
[ ] No speculative features added
[ ] GREEN was verified with targeted tests
```

## Completion Checklist

Before claiming completion, all must be true:

- [ ] New/changed behavior has failing-test evidence first.
- [ ] RED failure reason is correct and recorded.
- [ ] Minimal implementation added.
- [ ] GREEN pass evidence is recorded.
- [ ] Refactor, if any, stayed GREEN.
- [ ] Final response includes `[测试用例摘要]` block when production code changed.
- [ ] All final test-case descriptions are Simplified Chinese.

If any box is unchecked, work is not complete.

## Final Rule

```text
Production code is valid only if test existed and failed first.
Otherwise: not TDD.
```
