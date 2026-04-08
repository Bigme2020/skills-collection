---
name: "playwright-interactive"
description: "Evidence-driven browser workflow built on playwright-cli. Use this whenever the user is implementing, debugging, or testing browser-facing behavior and wants to stay aligned with the real page through frequent verification. Especially relevant for UI work, interaction flows, local web-app checks, E2E test authoring, reproducing browser-only issues, and iterative QA/debugging."
allowed-tools: Bash(playwright-cli:*)
---

# Playwright Interactive

`playwright-interactive` is not a separate browser driver.

It uses `playwright-cli` as a continuous source of browser evidence so development and testing stay grounded in the real page instead of drifting on assumptions.

Use this skill to reduce drift between what the agent thinks is happening and what the page is actually doing.

## When to use it

- Use it for UI and interaction work that benefits from frequent browser checks.
- Use it when iterating on a local web app and validating each meaningful change.
- Use it when writing or repairing E2E tests and you need to confirm the real flow, selectors, or expected states in the browser.
- Use it when debugging flaky or browser-only behavior and you need evidence from snapshots, screenshots, tracing, console output, or network activity.
- Use it as the required final validation path when `verification-before-completion` applies to browser-visible work.

## Core idea

Work in short verification loops:

1. Make a small change.
2. Verify it in the browser with `playwright-cli`.
3. Compare the observed page state with the requirement.
4. Adjust from evidence.
5. Continue only after the current step is grounded.

Do not leave browser validation until the very end unless the task is genuinely trivial.

When the task changes browser-visible behavior, this skill is not just a helpful debugging aid. It is the workflow that produces the final evidence needed to claim the work is complete.

## How to work

- Prefer small, reversible steps over large speculative edits.
- After each meaningful step, inspect the page with `playwright-cli`.
- Reuse a named session with `playwright-cli -s=<name>` when you need continuity across multiple checks.
- Default to `snapshot` for fast structural checks.
- Use screenshots, tracing, console logs, network inspection, and saved state when they are the better source of evidence.
- When browser evidence conflicts with your assumption, trust the browser and revise the plan.

## UI and app development

- Validate layout, copy, states, and interactions as they are built.
- Check important transitions such as loading, validation, disabled states, error messaging, and post-submit results.
- If the requirement is still fuzzy, use the browser to reduce uncertainty before adding more code.

## End-to-end test work

- When writing or revising E2E tests, use `playwright-cli` to confirm the key user path when the flow or assertions are still unclear.
- Turn verified observations into durable test code, but do not treat exploratory CLI steps as a complete test design.
- If you run Playwright's test runner from the terminal, default to `--reporter=line` so the output stays stream-friendly for agents and does not hang on interactive or overly verbose reporters. Only use a different reporter when the user explicitly asks for it.
- When a test fails, choose the fastest useful evidence source. That may be `playwright-cli`, or it may be trace output, screenshots, video, logs, or mocking.
- Use browser exploration to separate product bugs, test bugs, selector issues, and environment issues.

## Relationship to `playwright-cli`

- `playwright-cli` provides browser commands.
- `playwright-interactive` provides the workflow.
- Reach for this skill when the main need is continuous validation during implementation or debugging, not just one-off browser automation.

## Common pattern

```bash
playwright-cli -s=debug open http://127.0.0.1:3000
playwright-cli -s=debug snapshot
playwright-cli -s=debug click e5
playwright-cli -s=debug snapshot
playwright-cli -s=debug console
playwright-cli -s=debug close
```

## Notes

- This skill is about cadence and evidence, not about replacing a full test runner.
- Use judgment: some tiny tasks do not need repeated browser checks, while risky or ambiguous tasks usually do.
- If `verification-before-completion` requires browser evidence for the task, do not stop at one failed check. Keep the repair-and-reverify loop going until the page renders correctly, the console is clean enough for the task, and the key flow works.
- For any `playwright test` command you run while following this skill, prefer `playwright test --reporter=line` or the package-manager equivalent such as `npx playwright test --reporter=line`.
- Prefer `playwright-cli` directly only when the user simply needs a one-off browser action rather than an iterative validation loop.
