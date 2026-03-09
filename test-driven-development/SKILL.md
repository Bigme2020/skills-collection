---
name: test-driven-development
description: Strict test-first workflow for any feature, bugfix, refactor, or behavior change. Use before writing production code. Enforce internal RED->GREEN verification and require a Chinese test-case summary in implementation responses.
---

# Test-Driven Development (TDD)

## Output Language Requirement

All user-facing TDD content must be in Simplified Chinese unless the user explicitly requests another language.

This includes (but is not limited to):

- Test-case summary blocks
- Blocked/error notices related to TDD flow

Hard requirement:

- All test-case descriptions must be written in Simplified Chinese.
- Do not output English-only test-case descriptions in user-facing responses.

## Execution Contract (Non-Negotiable)

Follow this contract for every implementation task:

1. Do not write production code before a failing test exists.
2. Verify RED first (test fails for the expected reason).
3. Write the smallest production change to reach GREEN.
4. Verify GREEN (targeted tests pass).
5. Include a Chinese test-case summary and verification evidence in your response.

If any step is missing, stop and report:

`阻塞：缺少测试用例验证证据。`

## Allowed State Machine (Internal Only)

Only these transitions are valid:

`INIT -> RED_VERIFIED -> GREEN_VERIFIED -> REFACTOR -> DONE`

Invalid transitions (violations):

- `INIT -> GREEN_VERIFIED`
- `INIT -> DONE`
- `RED_VERIFIED -> DONE`

Do not expose this state machine or stage labels in user-facing output unless the user explicitly asks for it.

## Required User-Facing Block (Every Implementation Response)

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

Constraints for this block:

- Use Simplified Chinese for every line and every test-case description.
- Do not include `Stage` / `RED_VERIFIED` / `GREEN_VERIFIED` labels unless explicitly requested by the user.

## Core Rule

```text
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST.
```

If you accidentally wrote production code first:

1. Delete or ignore that implementation as source of truth.
2. Write failing tests first.
3. Re-implement from tests.

## TDD Workflow

### 1) RED - Write a Failing Test

Write one minimal test for one behavior.

Requirements:

- Clear behavior-focused test name.
- One behavior per test.
- Prefer real behavior checks over mock-behavior checks.

Run targeted test command (examples):

```bash
pnpm test path/to/file.test.ts
# or
npm test path/to/file.test.ts
```

RED acceptance criteria:

- Test fails (not runtime/setup error).
- Failure reason matches missing behavior.

If test passes immediately, test is invalid for this change. Rewrite the test.

### 2) GREEN - Minimal Implementation

Write the smallest possible production code to satisfy RED.

Constraints:

- No speculative abstractions.
- No bundling unrelated refactors.
- No hidden feature expansion.

Run the same targeted test command again.

GREEN acceptance criteria:

- Targeted tests pass.
- No newly introduced failures in related scope.

### 3) REFACTOR - Keep Behavior Stable

Refactor only after GREEN.

Allowed refactors:

- Rename for clarity.
- Remove duplication.
- Extract helpers without behavior change.

Run tests again and remain GREEN.

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

## Completion Checklist

Before claiming completion, all must be true:

- [ ] New/changed behavior has failing test evidence first.
- [ ] RED failure reason is correct and recorded.
- [ ] Minimal implementation added.
- [ ] GREEN pass evidence is recorded.
- [ ] Refactor (if any) stayed GREEN.
- [ ] Final response includes `[测试用例摘要]` block.
- [ ] All test-case descriptions in the final response are Simplified Chinese.

If any box is unchecked, work is not complete.

## Testing Anti-Patterns

Before heavy use of mocks/test utilities, read `@testing-anti-patterns.md`.

## Final Rule

```text
Production code is valid only if test existed and failed first.
Otherwise: not TDD.
```
