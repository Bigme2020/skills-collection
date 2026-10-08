---
name: implement-frontend-spec
description: Implement frontend UI tickets, pause for user screenshot approval, then implement logic tickets on the same integration branch.
disable-model-invocation: true
---

# Implement Frontend Spec

Implement the spec and tickets from `/to-frontend-tickets` on a single **integration branch**. During the UI phase this is the UI integration branch; continue on that same branch for logic after explicit user approval.

The issue tracker should have been provided. Otherwise ask the user to run `/setup-matt-pocock-skills`.

Tickets form a **task graph**, not a step list. Work the **frontier** whose blockers are satisfied, within the current phase. Communicate through pointers to the spec, tickets, research, commits, and evidence rather than repeating them. Run implementers in the background, with one writer per isolated worktree and serialized integration merges.

## Steps

1. Read the spec and tickets. Identify their explicit UI/Logic types, dependencies, design targets, and preview contracts. Ask about ambiguous classification, cycles, or UI blocked by unfinished logic; resolve these before launching implementation. Optionally use an exploration subagent to save shared notes outside the repo.

2. Create the integration branch and record its pre-implementation review baseline. Check that the `ui-implementer` and `implementer` agent types are available; use their configured models and skills. If the tracker closes work through PRs, or the user requests one, open a draft PR after the first integration merge, linked to the spec and tickets.

3. Dispatch ready UI tickets to **`ui-implementer` subagents**, each on its own branch and worktree based on the current integration branch. Give each the ticket, spec, design pointers, scope, acceptance criteria, and evidence location. Isolate preview ports, browser sessions, and screenshots. Each agent commits its work and merges the integration tip into its branch before reporting completion. Preserve user changes when reconciling the base.

4. Use a merger subagent to merge each completed UI branch into the integration branch, one at a time. Check the integrated result and dispatch newly unblocked UI tickets. A visual repair-limit delivery is completed automation with disclosed differences, not a failed ticket or a reason to stop scheduling other UI work. Genuine implementation, capture, or tooling blockers still require resolution.

5. Once all UI work is merged, collect each `ui-implementer`'s final screenshots, checkpoints, and completion report. Assemble them by ticket, page, and variant, preserving their source commits, reproducible states, project-check results, and remaining visual differences. Keep evidence outside disposable worktrees. Reuse these deliverables directly; do not recapture from the integration branch or launch another visual-verification pass merely to assemble the user review. Preserve intentional UI preview fixtures until user review and later logic replacement; remove validation-only injections and mocks.

6. **Pause for user UI approval.** Present the collected subagent screenshot links and completion reports, together with the integration branch/commit; identify screenshots by their source commits rather than claiming they were captured from the integration branch. Save a handoff outside disposable worktrees with ticket progress, evidence paths, pending logic, and approval status. End this phase without launching logic, closing UI tickets, or marking the PR ready. Only the user's explicit approval of this assembled UI handoff permits the logic phase. If changes are requested, have the responsible `ui-implementer` revise UI and return updated screenshots for the affected targets, then ask again. If there are no UI tickets, skip this gate.

7. After approval, record the approved commit and evidence. Resolve UI tickets according to the tracker's workflow, or record their acceptance when closure waits for the PR. Dispatch ready remaining tickets to **`implementer` subagents** in isolated branches/worktrees based on the same integration branch. Each commits, merges the integration tip before reporting, and hands off validation evidence. Merge serially through a merger subagent and keep advancing the logic frontier. Do not reimplement completed UI tickets.

8. Once all tickets are implemented, execute `code-review` on the integration branch against the recorded baseline and full spec. Use `implementer` for logic fixes and `ui-implementer` for UI fixes, with exclusive ownership. Recheck affected pages and variants after logic or shared-code changes; report visual conclusions separately from project checks. If the approved UI changes visibly, refresh the screenshots and obtain renewed user approval before final delivery. Preserve disclosed, user-approved visual differences rather than reopening them without a new regression or requirement.

9. Mark an existing draft PR ready for review; otherwise resolve tickets as the tracker requires and report the integration branch. Preserve final screenshots, checkpoints, validation results, and approval evidence before cleaning up implementer worktrees. Keep failed or unmerged work until it is safely accounted for.
