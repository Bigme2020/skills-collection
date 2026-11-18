---
name: ship-logic
description: "Drive an aligned logic-only requirement from aligned-requirements.md to delivered code: spec, logic tickets, implementation, development validation, review, merge-back, and cleanup. One authorization, then it advances on its own."
disable-model-invocation: true
---

# Ship Logic

Take a frozen `aligned-requirements.md` and carry it the rest of the way: produce the spec, split it into logic tickets, and implement through development validation, review, merge-back, and cleanup. The grilling phase and `/to-aligned-requirements` happen upstream and are not re-run here.

This skill is the orchestrator: it owns sequencing and hand-off integrity, and delegates each stage's workflow to the downstream skill that owns it.

## Input

One of:

- a path to an `aligned-requirements.md`, or
- a `feature-slug` from which the aligned-requirements file is located per the tracker convention.

The aligned-requirements file is the sole upstream input; everything a stage needs is in it or the artifacts earlier stages wrote.

## Boundary and authorization

Once authorized, the run advances automatically through spec, tickets, and implementation. The testing-seam confirmation in `/to-spec` and ticket-granularity confirmation in `/to-tickets` are auto-accepted within the frozen requirements. Prefer agreed or existing testing seams; report missing business decisions or contracts that prevent a valid spec or breakdown.

Live-environment integration and physical-device validation remain post-development, exactly as `/implement-spec` defines. They do not block this skill's completion.

## Steps

1. **Preflight.** Read `docs/agents/issue-tracker.md` and `docs/agents/domain.md`. If either is missing, stop and ask the user to run `/setup-matt-pocock-skills`; do not improvise the configuration. From the tracker doc, determine the hand-off medium: on a local-markdown tracker, stages hand off by file path under `.scratch/<feature-slug>/`; on a remote tracker, stages hand off by issue reference per that tracker's convention. Carry whichever medium the tracker dictates through every stage; never hard-code one.

2. **Locate the input.** Resolve the aligned-requirements file from the given path or slug. Confirm it exists and names a `feature-slug`. If it is absent, stop and point the user back to the grilling phase plus `/to-aligned-requirements`.

3. **Spec.** Produce the spec by running `/to-spec` in an isolated context that reads the aligned-requirements file and writes the spec to the tracker. The testing-seam confirmation is auto-accepted. This orchestration context receives only the resulting spec reference, keeping its capacity for the implementation stage.

4. **Tickets.** Produce the logic ticket breakdown from the spec by running `/to-tickets`, in the same isolated manner, returning only the ticket references. The ticket-granularity confirmation is auto-accepted: proceed without pausing for granularity or dependency-edge approval. A genuine blocker that prevents producing a valid breakdown at all, such as a dependency cycle, is still reported, not silently resolved.

5. **Implement.** Run `/implement-spec` directly in this orchestration context, passing the spec and ticket references. It already dispatches its own implementers, merger, and review, so running it directly here keeps the dispatch one layer deep. Let its execution, recovery, development validation, review, merge-back, and cleanup rules govern the rest.

6. **Report.** When `/implement-spec` completes, report what it reports: the delivery branch and commit, development-check results, evidence links, and the post-development verification list. Report the spec and ticket references produced along the way so the whole chain is traceable from the aligned-requirements file to the delivered commit.

## Execution posture

Once the user authorizes the run, advance automatically through stages 3→5. Pause only at a genuine blocker that no safe step can clear or an applicable authorization boundary required by `/implement-spec`. For failures within a stage, prefer the downstream skill's own recovery; surface the specific blocker rather than claiming completion. Keep the chain's single source of truth in the tracker and in the files each stage writes, not in this conversation.
