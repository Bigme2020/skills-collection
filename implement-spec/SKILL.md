---
name: implement-spec
description: Implement the result of /to-spec and /to-tickets on one integration branch through review and delivery.
disable-model-invocation: true
---

# Implement Spec

Implement `/to-spec` and `/to-tickets` on one **integration branch**. If no issue tracker is configured, ask the user to run `/setup-matt-pocock-skills`.

Tickets form a **task graph**, not a step list. Dispatch the **frontier** whose blockers are satisfied to `implementer`.

## Orchestration

The parent owns dispatch, monitoring, blockers, integration, and user acceptance. Each implementer owns its configured implementation, tests, required independent reviews, fixes, and issue-status updates. Use configured agent models and skills; do not duplicate their workflow in the parent.

Run implementers in the background with one writer per isolated worktree. Use a **merger subagent** for serialized integration. Use issues as the status source of truth and communicate through spec, ticket, commit, and evidence pointers rather than duplicate briefs or handoff-only agents. Record the review baseline and approvals in the tracker, PR, or conversation.

## Execution Rules

- **Advance automatically.** Once execution is authorized, dispatch the current frontier. After completion or blocker changes, refresh the task frontier and dispatch ready work, fixes, and safe recovery without asking about internal details. Pause only affected work; if no safe progress remains, report attempted corrections and the specific blocker rather than claiming completion.
- **Recover within bounds.** Preserve the error, run records, Git state, partial changes, and evidence. Retry only with a concrete correction and attempt limit; stop repeated failures without new evidence. Keep the original model and tool protocol. Inspect long-running commands before interrupting them, and stop only verified task-owned processes.
- **Reuse evidence.** Prefer complete, traceable artifacts matching the review scope and source commit, including tool-managed records. Missing or mismatched evidence is not a pass. Do not rerun reviews or checks merely to recreate files or change formatting. Fix commits still require independent review.
- **Honor acceptance and authorization.** Run applicable spec and project checks, including browser behavior where relevant. Disclose simulated environments, differences, and unverified scope; disclosure does not replace required validation. Keep affected tickets unaccepted until resolved or explicitly waived, without blocking independent work. Respect business clarification, dependency permissions, high-risk operation authorization, and user approval gates.

## Steps

1. Read the spec and tickets; identify dependencies, scope, and acceptance criteria. Resolve ambiguities and cycles before affected implementation. Optionally use an exploration subagent to save shared notes outside the repo, accessible to subsequent implementers.

2. Create the integration branch from the current working branch, and merge it back into that branch when complete. Record the pre-implementation review baseline. Confirm the `implementer` agent type is available. If the tracker closes work through PRs, or the user requests one, open a draft PR after the first integration merge, linked to the spec and tickets.

3. Dispatch ready tickets to **`implementer` subagents**, each on its own branch and worktree based on the current integration branch. Provide the ticket, spec, scope, acceptance criteria, and evidence location. Each agent confirms its base before starting, preserves user changes, commits its work, merges the integration tip before reporting completion, and returns validation and review evidence.

4. Use the merger subagent to integrate completed branches one at a time. Check the integrated result and dispatch newly unblocked tickets until all work is implemented.

5. Once all tickets are implemented, run `code-review` on the integration branch against the recorded baseline and full spec. Dispatch fixes to `implementer` with exclusive ownership, integrate serially, and rerun affected checks; obtain independent review of fix commits.

6. Mark an existing draft PR ready for review; otherwise resolve tickets as the tracker requires. Before final delivery, the parent preserves evidence outside temporary worktrees, closes task-owned browser sessions, stops verified task-owned services, and runs `git worktree remove` from the original worktree for all clean, fully merged workflow worktrees, including integration, unless the user explicitly requests retention. Pending acceptance, future reproduction, or installed dependencies are not retention reasons. Preserve the original worktree, unrelated worktrees, and branches; do not force removal or discard user changes. Verify cleanup and report the delivery branch/commit, evidence links, and any concrete cleanup blockers.
