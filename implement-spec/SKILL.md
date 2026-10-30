---
name: implement-spec
description: Implement the spec and tickets produced by /to-spec and /to-tickets through development validation, review, merge-back, and cleanup.
disable-model-invocation: true
---

# Implement Spec

Deliver `/to-spec` and `/to-tickets` to the **original working branch**: implement the scoped work, validate development work, review, merge back, and clean up. The integration branch and task worktrees are temporary execution spaces, not delivery destinations. If no issue tracker is configured, ask the user to run `/setup-matt-pocock-skills`.

Development is complete when the scoped implementation and required development checks are complete, applicable user approvals are recorded, changes are merged into the delivery branch, and temporary execution resources are closed out.

**Live-environment integration testing and physical-device validation follow development delivery.** Record their verification points and known risks for the next phase; they do not block tickets, merge-back, cleanup, or completion of this skill. Development validation includes applicable automated tests, engineering checks, and local runtime behavior. Fixtures establish behavior at the tested boundary, not live-environment or device verification. Missing external contracts or unclear business semantics that prevent correct implementation remain development blockers.

Tickets form a **task graph**, not a step list. Dispatch the **frontier** whose development blockers are satisfied to `implementer`.

## Orchestration

The parent owns dispatch, monitoring, blockers, integration, and user acceptance. Each implementer owns its configured implementation, tests, required independent reviews, fixes, and issue-status updates. Use configured agent models and skills; do not duplicate their workflow in the parent.

Run implementers in the background with one writer per isolated worktree. Use a **merger subagent** for serialized integration. Use issues as the status source of truth and communicate through spec, ticket, commit, and evidence pointers rather than duplicate briefs or handoff-only agents. Record the review baseline and approvals in the tracker, PR, or conversation.

## Execution Rules

- **Advance automatically.** Once execution is authorized, dispatch the current frontier. After completion or blocker changes, refresh the task frontier and dispatch ready work, fixes, and safe recovery without asking about internal details. Pause only affected work; if no safe progress remains, report attempted corrections and the specific blocker rather than claiming completion.
- **Recover within bounds.** For agent or execution-environment failures, preserve the error, run records, Git state, partial changes, and evidence. Retry only with a concrete correction and attempt limit; stop repeated failures without new evidence. Keep the original model and tool protocol. Compilation errors, failed test assertions, lint findings, and product regressions belong to the implementation–test–fix cycle. Inspect long-running commands before interrupting them, and stop only verified task-owned processes.
- **Reuse evidence.** Prefer complete, traceable artifacts matching the review scope and source commit, including tool-managed records. Missing or mismatched evidence is not a pass. Do not rerun reviews or checks merely to recreate files or change formatting. Fix commits still require independent review.
- **Honor acceptance and authorization.** Apply spec and project acceptance criteria within this skill's development boundary. Complete applicable development checks, including local runtime behavior where relevant; resolve failures or obtain explicit waivers. Move live-environment and physical-device verification criteria into the post-development verification list without treating them as failed development criteria. Report evidence within the environment it establishes. Respect business clarification, dependency permissions, high-risk operation authorization, and user approval gates.

## Steps

1. Read the spec and tickets; identify dependencies, scope, and acceptance criteria. Resolve ambiguities and cycles before affected implementation. Optionally use an exploration subagent to save shared notes outside the repo, accessible to subsequent implementers.

2. Record the original working directory, current branch as the delivery branch, pre-implementation review baseline, and existing user changes. Create the temporary integration branch from that baseline. Confirm the `implementer` agent type is available. If the tracker closes work through PRs, or the user requests one, open a draft PR after the first integration merge, linked to the spec and tickets.

3. Dispatch ready tickets to **`implementer` subagents**, each on its own branch and worktree based on the current integration branch. Provide the ticket, spec, scope, acceptance criteria, and evidence location. Each agent confirms its base before starting, preserves user changes, commits its work, merges the integration tip before reporting completion, and returns validation and review evidence.

4. Use the merger subagent to integrate completed branches one at a time. Check the integrated result and dispatch newly unblocked tickets until all work is implemented.

5. Once all tickets are implemented, run `code-review` on the integration branch against the recorded baseline and full spec. Dispatch fixes to `implementer` with exclusive ownership, integrate serially, and rerun affected checks; obtain independent review of fix commits.

6. Complete development acceptance using the integrated source and matching evidence. Resolve remaining implementation or development-check failures, and consolidate live-environment integration and physical-device verification points for the next phase. Resolve development tickets as the tracker requires, or record development acceptance when closure waits for a PR. Mark an existing draft PR ready for review.

7. Merge the integration branch back into the recorded delivery branch as part of the authorized workflow, preserving existing user changes. Verify that the delivered integration commit is an ancestor of the delivery branch HEAD. If the user explicitly chose a different delivery destination, use it instead. Resolve concrete merge conflicts or report the specific merge blocker; remote publication remains subject to the user's push or PR authorization.

8. Preserve evidence outside temporary worktrees, close task-owned browser sessions, stop verified task-owned services, and run `git worktree remove` from the original worktree for all clean, fully merged workflow worktrees, including integration, unless the user explicitly requests retention. Preserve the original worktree, unrelated worktrees, branches, and user changes. Verify cleanup and report the delivery branch/commit, development-check results, evidence links, post-development verification list, and any concrete cleanup blockers.
