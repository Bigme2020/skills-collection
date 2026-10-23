---
name: implement-frontend-spec
description: Implement frontend UI tickets, pause for user screenshot approval, then implement logic tickets on the same integration branch.
disable-model-invocation: true
---

# Implement Frontend Spec

Implement `/to-frontend-tickets` on one **integration branch**: UI first, then logic after explicit user approval. If no issue tracker is configured, ask the user to run `/setup-matt-pocock-skills`.

Tickets form a **task graph**, not a step list. Dispatch the **frontier** whose blockers are satisfied within the current phase: UI tickets to `ui-implementer`, Logic tickets to `implementer`.

## Orchestration

The parent owns dispatch, monitoring, blockers, integration, and user acceptance. Each implementer owns its configured implementation, tests, required independent reviews, fixes, and issue-status updates. Use configured agent models and skills; do not duplicate their workflow in the parent.

Run implementers in the background with one writer per isolated worktree. Use a **merger subagent** for serialized integration. Use issues as the status source of truth and communicate through spec, ticket, commit, and evidence pointers rather than duplicate briefs or handoff-only agents. Record the review baseline and approvals in the tracker, PR, or conversation.

## Execution Rules

- **Advance automatically.** Once execution is authorized, dispatch the current frontier. After completion or blocker changes, refresh the task frontier and dispatch ready work, fixes, and safe recovery without asking about internal details. Pause only affected work; if no safe progress remains, report attempted corrections and the specific blocker rather than claiming completion.
- **Recover within bounds.** Preserve the error, run records, Git state, partial changes, and evidence. Retry only with a concrete correction and attempt limit; stop repeated failures without new evidence. Keep the original model and tool protocol. Inspect long-running commands before interrupting them, and stop only verified task-owned processes.
- **Reuse evidence.** Prefer complete, traceable artifacts matching the review scope and source commit, including tool-managed records. Missing or mismatched evidence is not a pass. Do not rerun reviews or checks merely to recreate files or change formatting. Fix commits still require independent review.
- **Honor acceptance and authorization.** Run applicable spec and project checks, including browser behavior where relevant. Disclose simulated environments, differences, and unverified scope; disclosure does not replace required validation. Keep affected tickets unaccepted until resolved or explicitly waived, without blocking independent work. Respect business clarification, dependency permissions, high-risk operation authorization, and user approval gates.

After initial UI approval, specified business states and accepted differences do not require repeated approval. Seek renewed visual approval only for out-of-spec design changes or at the user's request. Actual regressions and missing required validation still need resolution.

## Steps

1. Read the spec and tickets; identify UI/Logic types, dependencies, design targets, preview contracts, and acceptance criteria. Resolve ambiguous classification, cycles, or UI blocked by unfinished logic before implementation. Optionally use an exploration subagent to save shared notes outside the repo, accessible to subsequent implementers.

2. Create the integration branch from the current working branch, and merge it back into that branch when complete. Record the pre-implementation review baseline. Confirm the `ui-implementer` and `implementer` agent types are available. If the tracker closes work through PRs, or the user requests one, open a draft PR after the first integration merge, linked to the spec and tickets.

3. Dispatch ready UI tickets to **`ui-implementer` subagents**, each on its own branch and worktree based on the current integration branch. Provide the ticket, spec, design pointers, scope, acceptance criteria, and evidence location. Isolate preview ports, browser sessions, and screenshots. Each agent preserves user changes, commits its work, merges the integration tip before reporting completion, and returns its evidence.

4. Use the merger subagent to integrate completed UI branches one at a time. Check the integrated result and dispatch newly unblocked UI tickets until all UI work is merged.

5. Once all UI work is merged, present the implementers' final screenshots, checkpoints, and reports by ticket/page/variant, with source commits, reproducible states, check results, remaining differences, and the integration branch/commit. Reuse these artifacts directly rather than recapturing or launching another visual-check pass for presentation. Preserve intentional preview fixtures until logic replacement; remove validation-only injections and mocks.

6. **Wait for explicit user approval of the screenshot presentation before starting logic.** Keep UI tickets pending and the PR in draft. If changes are requested, return affected targets to `ui-implementer` and present updated evidence for approval. Skip this gate when there are no UI tickets.

7. Record the approved commit and evidence links; resolve UI tickets or record acceptance if closure waits for the PR. Dispatch ready Logic tickets to **`implementer` subagents** using the same branch/worktree isolation and completion requirements, returning validation evidence. Integrate serially through the merger subagent and advance the frontier without reimplementing completed UI.

8. Once all tickets are implemented, run `code-review` on the integration branch against the recorded baseline and full spec. Dispatch logic fixes to `implementer` and UI fixes to `ui-implementer`, with exclusive ownership and serialized integration. Recheck affected pages/variants after logic or shared-code changes and obtain independent review of fix commits. Report visual conclusions separately from project checks.

9. Mark an existing draft PR ready for review; otherwise resolve tickets as the tracker requires. Before final delivery, the parent preserves evidence outside temporary worktrees, closes task-owned browser sessions, stops verified task-owned services, and runs `git worktree remove` from the original worktree for all clean, fully merged workflow worktrees, including integration, unless the user explicitly requests retention. Pending acceptance, future reproduction, or installed dependencies are not retention reasons. Preserve the original worktree, unrelated worktrees, and branches; do not force removal or discard user changes. Verify cleanup and report the delivery branch/commit, evidence links, and any concrete cleanup blockers.
