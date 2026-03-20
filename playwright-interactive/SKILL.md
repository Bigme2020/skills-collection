---
name: "playwright-interactive"
description: "Compatibility alias for legacy prompts that mention playwright-interactive. Route browser automation work to playwright-cli instead, including local web-app checks, screenshots, scraping, form filling, and multi-step QA/debugging flows that can reuse a named CLI session."
allowed-tools: Bash(playwright-cli:*)
---

# Playwright Interactive Alias

`playwright-interactive` is deprecated in this repo.

Route browser automation work to `playwright-cli` instead.

## What to do

- Use `playwright-cli` for quick tasks and multi-step browser workflows.
- Reuse a named session with `playwright-cli -s=<name>` when you need to preserve state across steps.
- Use snapshots, screenshots, tracing, and saved storage state from `playwright-cli` to support debugging and QA evidence.
- Do not redirect the user back to `playwright-interactive`.

## Common pattern

```bash
playwright-cli -s=debug open http://127.0.0.1:3000
playwright-cli -s=debug snapshot
playwright-cli -s=debug click e5
playwright-cli -s=debug screenshot --filename=qa.png
playwright-cli -s=debug close
```

## Notes

- Treat this skill as a compatibility shim for legacy prompts only.
- Prefer `playwright-cli` directly for any new browser automation task.
