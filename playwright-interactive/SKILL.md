---
name: "playwright-interactive"
description: "Manual, evidence-driven browser workflow built on playwright-cli. Use when the user explicitly asks for playwright-interactive, browser-interactive validation, screenshots, snapshots, console/network evidence, or real-page verification. Also use when a browser-only issue cannot be diagnosed otherwise. Do not auto-trigger for every browser-facing code change."
allowed-tools: Bash(playwright-cli:*)
---

# Playwright Interactive

`playwright-interactive` is not a separate browser driver.

It uses `playwright-cli` as a continuous source of browser evidence so development and testing stay grounded in the real page instead of drifting on assumptions.

Use this skill to reduce drift between what the agent thinks is happening and what the page is actually doing when browser evidence is requested or necessary.

## When to use it

- Use it for UI and interaction work that benefits from frequent browser checks.
- Use it when the user explicitly requests this skill, browser-interactive validation, screenshots, snapshots, console checks, network checks, or real-page verification.
- Use it when iterating on a local web app and validating each meaningful change.
- Use it when writing or repairing E2E tests and you need to confirm the real flow, selectors, or expected states in the browser.
- Use it when debugging flaky or browser-only behavior and you need evidence from snapshots, screenshots, tracing, console output, or network activity.
- Do not use it automatically for every browser-visible code change; prefer lighter project verification unless browser evidence was requested or is necessary.

## Core idea

Work in short verification loops:

1. Make a small change.
2. Verify it in the browser with `playwright-cli`.
3. Compare the observed page state with the requirement.
4. Adjust from evidence.
5. Continue only after the current step is grounded.

Do not enter this loop by default for every UI task. Use lighter verification first unless the user asked for browser-interactive evidence or the bug cannot be proven without the browser.

When browser evidence is requested or necessary, this skill is the workflow that produces evidence needed to make browser-specific claims.

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
- If the user requested browser evidence or the task requires browser evidence, do not stop at one failed check. Keep the repair-and-reverify loop going until the page renders correctly, the console is clean enough for the task, and the key flow works.
- For any `playwright test` command you run while following this skill, prefer `playwright test --reporter=line` or the package-manager equivalent such as `npx playwright test --reporter=line`.
- Prefer `playwright-cli` directly only when the user simply needs a one-off browser action rather than an iterative validation loop.
