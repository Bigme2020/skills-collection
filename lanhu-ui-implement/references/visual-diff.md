# Bounded visual review

Read before the first capture. Use the finalized [page contract](./page-contract.md) without rebuilding it each round.

## Shared page budget

Default: **at most two visual repair batches for the whole page and all selected variants**, unless the user supplies another finite limit. A batch is one planned set of one to three confirmed, nonconflicting visual fixes followed by screenshot verification. Initial implementation, baseline review, read-only diagnosis, and regression-only captures do not consume batches. Any post-baseline rendering correction, including one discovered by review or a project check, consumes a batch; purely nonvisual corrections do not.

Record the shared count before editing. Failed captures, improvement, renaming regions, adding variants, restarting the agent, and checkpoint resume never refund or reset it. A shared edit consumes one batch, not one per artboard. Once a batch is verified, further visual edits require another batch. Diagnosis does not provide a free repair.

Use remaining budget for major layout, missing visual fidelity, assets, cropping, wrapping, or typography before small decorative differences. A vague request to continue until convergence does not remove the finite default. Extensions require an explicit finite user authorization; when a user authorizes more repairs without a number, add at most one batch and record that bound.

## Evidence and captures

Use one task-specific OS temporary directory and one shared checkpoint:

```text
<task-temp>/
├── visual-loop-state.json
└── <artboard>/
    ├── design.png
    ├── current.png
    └── previous.png       # optional, only when needed to judge a repair
```

Keep images and contract records separate per artboard. The checkpoint contains a shared page budget and a `targets` record with each artboard's contract, capture conditions or resolved shared reference, observations, and verdict. A target record is that artboard's checkpoint for purposes of the page-contract reference.

Before every capture, verify actual device/state, crop, scale, page range, viewport, DPR, zoom, scroll, fonts, images, and frozen animations. Stop comparison until uniform scale and comparable ranges are proved. Return compact readiness totals, failed resources, and relevant bounds/styles, not full DOM or successful resource lists.

Compare screenshots with model vision. Use DOM/geometry evidence to resolve uncertainty and check assertions; no pixel-difference percentages, heatmaps, or numeric visual pass thresholds. Reuse unchanged design images already in context. Load the new screenshot and only load a previous image when needed; deleting files does not remove prior images from model context.

## Review sequence

### 1. Baseline review

按主流程的关系优先顺序开始，再完成全部所选画板的基线检查后统一修复。Capture and review all selected artboards once. For each, check every required region in page order, required/forbidden/excluded assertions, layout-critical relationships, major geometry, typography, assets, and dynamic wrappers. Record the largest confirmed discrepancies and the evidence needed for uncertain ones.

If no visible, fixable difference remains, this review is also the final scan once the final coverage and implementation gates below are satisfied. Do not invent edits or perform a second identical inspection.

### 2. Plan and verify a repair batch

Select one to three confirmed, nonconflicting fixes across the page. Record each issue, evidence-supported cause, intended change, and affected artboards. If a cause is uncertain, use one focused diagnostic pass before editing. Coordinate deltas are hypotheses: reconcile crop, scale, coordinate space, and DOM bounds before acting on them.

Reserve a batch, make the planned edits, and capture every affected variant. Check changed regions, adjacent layout, and affected assertions. Shared changes invalidate affected acceptance; uncertain impact requires all selected variants to be rechecked. Unaffected checks can be carried forward only with their original provenance, not reported as new observations.

Give each planned fix an `improved`, `unchanged`, or `regressed` result, expanding evidence only for failures or uncertainty. Improvement alone is not acceptance. Movement away from confirmed design geometry is regression. Batch related safe adjustments; do not require a separate repair/capture per region or per CSS property.

A fully unchanged or regressed batch triggers one focused diagnosis before any next repair. If no supported cause is established, stop with `unconfirmed_cause` while budget remains. Do not repeat speculative edits. At an exhausted budget, record unresolved visual differences and finalize if technical evidence remains valid; no additional repair follows diagnosis.

### 3. Finalize using the last review

Normally each artboard needs one baseline comparison and up to two post-repair comparisons. Reuse the last affected-variant review as final verification by expanding its coverage to the checklist below on the same valid screenshot. An unaffected artboard may retain its baseline as final evidence only when no later rendering change affects it.

No duplicate final screenshot or identical full-page scan is required merely to finish. Recapture when data, state, readiness, code, or other rendering inputs changed or the image is invalid. Required regression checks and failed-capture retries can add captures, but not free visual repairs.

If final coverage discovers another issue, repair only within the remaining shared budget. At the limit, finish with disclosed visual differences rather than reopening an unbounded loop. Missing required UI, broken interactions, unstable assets, project-rule failures, and evidence/tooling failures remain implementation or evidence blockers, not allowable fidelity differences.

## Final coverage

For every artboard, cover all required regions in page order, with explicit geometry and typography conclusions. Presence alone or a generic `accepted` is insufficient. Verify each layout-critical relationship against page/viewport/parent edges, preceding content's visible boundary, and any reserved space.

For repeated siblings or lists, check all instances for missing content, overflow, wrapping anomalies, occlusion, and spacing/edge consistency, using compact DOM or geometry assertions where practical. Inspect visual representatives of every distinct layout/text-wrapping type, including first/last and suspicious instances; inspect every instance when unique, uncertain, or inconsistent. A consistent group may have one shared geometry/typography verdict naming its checked instances and exceptions, rather than repeating identical prose. Identify every multiline group and value-ignored wrapper; continue checking wrapper geometry and styling when its value is ignored.

Check the last content item's gap to each container bottom. Diagnose excess whitespace through height, min-height, flex stretch, or reserved space; preserve justified design spacing. For variable-length lists, test sparse or empty data for content boundaries and bottom occlusion. For bottom safe-area layouts, verify both zero and nonzero clearance under the page-contract rule. Run these pressure checks once at final verification, rerunning only if relevant layout changes; they are regression checks, not new design artboards or evidence of real-device testing.

Run the final changed-file assertion audit and affected project checks with this verification. Any rendering fix invalidates relevant visual evidence and follows the shared budget; a nonvisual fix only reruns its applicable checks.

For an authorized independent review, use the fresh read-only review in the main skill for this final coverage rather than duplicating self-review and reviewer scans. Supply resolved contracts and current images, not prior pass claims or repair history. Keep visual and implementation verdicts separate. Review findings cannot extend the budget.

## Lightweight checkpoint

Maintain `visual-loop-state.json` with:

- page entry, selected targets, shared batch count/limit, authorized extensions, pending batch and affected targets;
- per-target contract, sources, capture conditions, exclusions, dynamic selectors/reasons, image paths and dimensions;
- per-batch issues and concise outcomes, checked scope, observations and provenance, unresolved differences, next action;
- per-target `targetStatus` (`active`, `completed`, `blocked`), `visualVerdict` (`pending`, `passed`, `differences_remaining`), stop reason and final coverage;
- final image SHA-256 hashes and scanned screenshot hash when sealing evidence, plus the delivered revision or working-tree identity.

Reserve the budget with an atomic state-file replacement before editing; preserve this state if capture fails. Stage a screenshot, validate dimensions and readiness, install it, then atomically update observations. Reuse established capture/state commands. Intermediate rounds need no full checkpoint backup, repeated image hashing, or dedicated new helper.

Seal image hashes at final delivery, planned handoff, or a recoverable stop. Mark evidence dirty/pending before changes, clearing stale final acceptance. Interrupted updates do not imply code rollback, acceptance, or a refunded batch.

Resume only a user-identified checkpoint. Validate contracts, counters, image dimensions and any recorded hashes before reusing sealed evidence. A mismatch or contradictory completion is a blocker; preserve evidence and report it rather than guessing progress. An unsealed intermediate checkpoint supplies counters and pending work only: do not reuse its visual acceptance. Obtain current design evidence, recapture the current implementation, and validate the new evidence before continuing; preserve cumulative counts. If counters or contracts cannot be established, stop for direction.

## Completion and cleanup

Set `targetStatus: completed` and `visualVerdict: passed` only when final coverage finds no visible, fixable difference and capture evidence, required UI/behavior, stable assets, project assertions, and relevant checks are valid. Bind the conclusion to the final `current.png` hash and delivered revision.

At the shared limit, valid technical delivery may use `targetStatus: completed`, `visualVerdict: differences_remaining`, and `stopReason: repair_limit`. Preserve unresolved visual findings and failed fidelity observations without marking them passed. Budget exhaustion alone is not a blocker or a request for extra rounds. Other evidence, implementation, or tooling failures use `targetStatus: blocked`, with an explicit cause; a fully passed target is not downgraded because another variant has remaining differences.

Keep design images, final screenshots, and the shared checkpoint. Remove previous/earlier images after completed delivery; on blockers retain the previous image when relevant. Remove validation-only mocks, interception, injected CSS, and temporary project changes while preserving authorized implementation and all pre-existing user changes. Report the final Git state.

按主 skill 的单份简短交付结论收尾，引用本检查点与工具清单，避免在票、验证文档、完成报告和最终回复里重复展开同一事实。差异或阻塞附已尝试修复及后续区域指针；模拟验证如实标明。Do not claim user approval or a check that was not performed.
