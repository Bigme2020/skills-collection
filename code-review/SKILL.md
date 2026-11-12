---
name: code-review
description: Review changes since a fixed point (commit, branch, tag, or merge-base) against repository standards and the originating spec. Use when the user wants to review a branch, PR, work-in-progress changes, or asks to "review since X".
---

## Entry point

The primary agent reads and follows [REVIEW.md](REVIEW.md): confirm the baseline, locate the spec and standards, create two independent reviewers using the subagent/agent-dispatch capabilities available in the current harness, and aggregate their reports. Run the two reviewers in parallel whenever possible, with independent contexts. Prefer the predefined `reviewer`; otherwise, select a model and reasoning effort appropriate for this review.
