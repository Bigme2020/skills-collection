# Bounded visual review

Read before the first capture. Use the finalized [page contract](./page-contract.md), the main skill's evidence-validity rule, and one shared checkpoint throughout.

## Shared page budget

Default: **at most two visual repair batches for the page and all selected variants**, unless the user specifies another finite limit. Each batch plans one to three confirmed, nonconflicting fixes, then verifies them by screenshot.

Charge any post-baseline rendering correction, including check-discovered fixes/rollback; exclude initial implementation, baseline, read-only diagnosis, regression-only capture, and nonvisual corrections. Reserve before editing, once per shared batch rather than per artboard. Further rendering edits after verification require another batch. Failures, restart, rename, added variants, and resume never refund usage.

Rank fixes by visual harm, not element category or passing geometry. The budget is a ceiling: with no obvious defects at normal display size, enter final verification, retaining minor differences rather than spending batches on magnified details. Obvious defects include missing/wrong content/assets, bad crop/layout, occlusion, and noticeable typography/color/background/decoration differences. Stricter user/project fidelity requirements prevail.

Only explicit finite authorization extends the budget. If the user authorizes more repairs without a number, add at most one batch and record the new total with cumulative usage intact. Exhaustion neither grants repairs nor establishes quality.

## Capture valid evidence

Use one task-specific OS temporary directory containing `visual-loop-state.json` and per-artboard `design.png`, `current.png`, and optional `previous.png`. Keep each artboard's images, contract, and verdict separate under the shared budget.

Before every capture, verify the page contract's actual conditions and readiness, applying its distinct artboard-mapping and pressure-scenario rules.

Judge images with model vision, not geometry assertions or numeric pixel-difference thresholds/heatmaps. DOM/bounds/styles explain uncertainty; return compact readiness/failure evidence rather than full dumps. Load new images and only needed previous images; reuse unchanged design evidence. Deletion does not remove images from model context.

## Review sequence

### 1. Baseline

Capture and review every selected artboard **and applicable pressure conditions before choosing the first repair batch**. Use the coverage below to identify significant composition/relationship differences and evidence needed for uncertain causes. Plan repairs across the page, not separate local loops. A baseline with no obvious defects can proceed directly to final verification with zero batches.

### 2. Repair and compare

Record **observed discrepancy -> evidence-supported cause -> corrective change**, affected artboards, and relationships to preserve for each fix. Inspect uncertain causes once before reserving; coordinate deltas alone are not causes. Scope follows cause/visual benefit, allowing asset/composition/layout replacement even in the last batch.

Reserve, edit/audit, capture affected variants, and compare changed regions plus neighbors with the design. Record `improved`, `unchanged`, or `regressed`, including new differences: improvement is not acceptance. Apply the main validity rule to affected/shared changes; uncertain impact requires all potentially affected variants, not blind reuse.

If the whole batch is unchanged or regressed, perform one focused diagnosis before another batch. Without a supported cause, stop with `unconfirmed_cause`, even with budget left. At the limit, diagnosis grants no further repair or undo; follow the appropriate completion/blocked path.

### 3. Finalize using the last review

Extend the last valid review only for missing coverage; unaffected artboards may retain baselines. Recapture for changed/uncertain inputs or invalid/missing evidence, not a handoff milestone.

1. Stabilize edits/autofixes; finish affected checks/captures through verified entry points under the main validity rule, including build/cleanup effects.
2. Complete missing coverage below, reusing valid pressure baselines. Run needed pressure captures serially with natural state/temporary contexts where possible; keep injections local and remove promptly.
3. Restore target device, viewport, data, and scroll, removing verification-only changes; await readiness. Confirm delivery state against established service/source evidence and actual manifest fields. Add restoration-specific evidence only; reverify changed/uncertain mappings or inputs.
4. With gates complete, seal final image hashes/scan bindings, delivered sources, actual time, and truthful checkpoint status; immediately follow the main Handoff without rebuilding history.

New findings use remaining budget; blockers below cannot become cosmetic differences at exhaustion.

## Coverage

Inspect every artboard in page order for content, geometry, typography, assets, and relationships, including visible contours, clipping, and occlusion at region boundaries; give explicit conclusions, not presence-only `accepted`. Check required/forbidden/excluded regions against page/viewport/parent edges, preceding visible content, and reserved space.

- **Repeated content:** check all instances for missing content, wrapping, overflow/occlusion, spacing/edges. Visually inspect every distinct layout/wrapping type, first/last/suspicious items and every unique/uncertain/inconsistent instance. Group consistent verdicts with scope/exceptions; include multiline and ignored-value wrappers.
- **Boundaries:** inspect last-item gaps; diagnose height/min-height, stretch, and reserved space while preserving justified whitespace. Test supported sparse/empty variable lists, not invented fixed-data variants.
- **Pressure:** apply the page contract's zero/nonzero safe-area and pressure criteria; defects affect final quality and the existing budget. Label simulation/gesture limits.
- **Implementation:** consolidate applicable checks and constraint audits. An authorized independent review supplies this coverage instead of a duplicate review loop, with separate visual/implementation verdicts.

## Checkpoint and resume

Keep `visual-loop-state.json` as the index with per-artboard records under `targets`, referencing original evidence instead of copying full outputs:

- Shared entry, selected targets, batch count/limit/extensions, pending batch and affected targets.
- Per-target contract/conditions or resolved references, sources, exclusions/dynamic ignores, images/dimensions, observations, differences, and covered regions.
- Batch issues/outcomes and provenance; check command/scope/trigger, related input identity, result/exit, and raw log path.
- Per-target `targetStatus` (`active`, `completed`, `blocked`), `visualVerdict` (`pending`, `passed`, `differences_remaining`), stop reason and next action.
- At sealing: actual time, final image SHA-256, scanned-image hash binding, and delivered revision or working-tree identity.

Reserve atomically before editing; retain pending usage on failure and clear stale acceptance before input changes. Stage/validate images before installation and atomic observation updates. Seal at delivery, planned handoff, or recoverable stop, not every intermediate round; no backup rotation/helper is required. Interruption implies neither rollback nor acceptance.

Validate user-specified resume contracts, counters, dimensions, and recorded hashes; mismatch/contradictory completion blocks. Unsealed checkpoints supply contracts/counters/pending work only: obtain current design evidence and recapture/validate before reusing acceptance. Keep cumulative usage; ask for direction if contracts/counters cannot be established.

## Status and cleanup

With valid evidence, required UI/behavior/assets, project assertions, checks, coverage, and restoration:

| Visual finding                         | Target result                                              |
| -------------------------------------- | ---------------------------------------------------------- |
| No visible, fixable difference         | `completed`, `passed`                                      |
| Only minor differences, budget remains | `completed`, `differences_remaining`, `no_obvious_defects` |
| Differences remain at the shared limit | `completed`, `differences_remaining`, `repair_limit`       |

At exhaustion, report whether artboard/pressure defects remain obvious; obvious means visual acceptance failed. Missing required UI, broken behavior, unstable assets, project-rule or evidence/tool failures use `blocked`, not cosmetic completion. Bind each independent target verdict to final hashes/sources; one target's failure does not downgrade another. Completion/minor differences imply neither exact equivalence nor user approval.

**Blocked path:** preserve current source/failure association, cause/questions, raw failures, unexecuted coverage, budget, and Git/resource state; give the main skill's short handoff. Diagnose only as needed, without exhausted-budget edits. Skip unrelated successful checks/pressure scenarios and unchanged passes; retain safe cleanup and mandatory work. Rendering cleanup invalidates affected evidence; earlier images are diagnostic, not delivery.

Keep designs/final images/checkpoint; remove earlier images on completion, retaining relevant ones on blockers. Remove verification mocks/interception/injections/temporary changes while preserving implementation and pre-existing work. Report Git/resource state, limits, and unperformed checks once, without hiding failures or claiming approval.
