---
name: code-review
description: Review changes since a fixed point (commit, branch, tag, or merge-base) against repository standards and the originating spec. Use when the user wants to review a branch, PR, work-in-progress changes, or asks to "review since X".
---

## Dispatch

Immediately call `spawn_agent` to create one fresh `review_lead` subagent. Use `fork_turns="none"` and pass only the user's review request and any explicit fixed point or spec path; the calling agent must not inspect the diff, spec, issue tracker, or standards sources.

Tell `review_lead` to read and execute [`REVIEW.md`](REVIEW.md) from this skill directory. It owns the complete review workflow and returns one compact final report to the calling agent.

The review is dispatched when the fresh `review_lead` exists with the request and execution-document path. The calling agent then waits for its report and presents it unchanged or lightly cleaned.
