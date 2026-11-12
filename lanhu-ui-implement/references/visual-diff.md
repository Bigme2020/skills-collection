# Visual acceptance

Read before the first capture. Use the finalized [page contract](./page-contract.md), the main skill's evidence-validity rule, and one shared checkpoint throughout.

## Repair and stopping rules

Repair confirmed implementation differences until required coverage is complete, fixes are verified, and remaining differences are evidenced rendering-environment effects or explicitly accepted deviations. Consider cumulative effects across typography, spacing, and alignment as well as individual discrepancies. Normal-size views establish perceived impact; magnification helps diagnose causes.

Group fixes by supported cause and compatible scope, preserving correct relationships. There is no default batch limit. Track batches across the page and selected variants; when user/project/runtime instructions set a finite limit, record and honor it cumulatively. Count each post-baseline rendering correction, including rollback, once per batch; initial implementation, read-only diagnosis, regression captures, and nonvisual corrections do not consume it. Reserve before editing and retain usage through interruptions or resume.

Stop as incomplete when missing evidence/resources, environment failure, unresolved causes, or lack of progress prevents reliable repair. An explicit resource limit bounds execution, not the quality standard; extending it requires authorization under the instructions that set it.

## Capture valid evidence

Use one task-specific OS temporary directory containing `visual-loop-state.json` and per-artboard `design.png`, `current.png`, and optional `previous.png`. Keep each artboard's images, contract, and verdict separate under the shared repair history.

Before every capture, verify the page contract's actual conditions and readiness, applying its distinct artboard-mapping and pressure-scenario rules.

Judge design fidelity with whole-page and regional image comparison. Aligned overlays, difference images, and DOM/bounds/styles may locate or explain discrepancies; numeric pixel thresholds and geometry alone do not establish acceptance. Interpret antialiasing and dynamic-content noise against the contract. Load new images and only needed previous images; reuse unchanged design evidence.

## Review sequence

### 1. Baseline

Capture and review every selected artboard **and applicable pressure conditions before choosing the first repair batch**. Use whole-page and regional coverage below to identify differences and evidence needed for uncertain causes. Plan repairs across the page, not separate local loops. A baseline satisfying the acceptance criteria can proceed directly to final verification with zero batches.

### 2. Repair and compare

Record **observed discrepancy -> evidence-supported cause -> corrective change**, affected artboards, and relationships to preserve for each fix. Inspect uncertain causes once before reserving; coordinate deltas alone are not causes. Scope follows cause/visual benefit, allowing asset/composition/layout replacement even in the last batch.

Reserve, edit/audit, capture affected variants, and compare changed regions plus neighbors with the design. Record `improved`, `unchanged`, or `regressed`, including new differences: improvement is not acceptance. Apply the main validity rule to affected/shared changes; uncertain impact requires all potentially affected variants, not blind reuse.

Record each discrepancy as confirmed/pending, diagnosing, verified fixed, evidenced environment effect, or accepted deviation, retaining its evidence and outcome. If a batch is unchanged or regressed, perform one focused diagnosis before further edits. Continue only with new evidence supporting a corrective change; otherwise stop with `unconfirmed_cause` or `no_progress`. At an explicitly configured limit, preserve the unresolved findings and report incomplete.

### 3. Finalize using the last review

Extend the last valid review only for missing coverage; unaffected artboards may retain baselines. Recapture for changed/uncertain inputs or invalid/missing evidence, not a handoff milestone.

1. Stabilize edits/autofixes; finish affected checks/captures through verified entry points under the main validity rule, including build/cleanup effects.
2. Complete missing coverage below, reusing valid pressure baselines. Run needed pressure captures serially with natural state/temporary contexts where possible; keep injections local and remove promptly.
3. Restore target device, viewport, data, and scroll, removing verification-only changes; await readiness. Confirm delivery state against established service/source evidence and actual manifest fields. Add restoration-specific evidence only; reverify changed/uncertain mappings or inputs.
4. After the main workflow's independent implementation and visual review is complete, seal final image hashes/scan bindings, delivered sources, actual time, and truthful checkpoint status; immediately follow the main Handoff without rebuilding history.

New findings enter the same repair loop; apply any configured limit without lowering acceptance criteria.

## Coverage

Inspect every artboard at two levels:

- **Whole page:** composition, proportions, hierarchy, whitespace rhythm, overall color, and relationships between regions.
- **Regional:** compare corresponding design/render crops at equal scale, retaining neighboring context. Cover every visually distinct region for font family/weight/size, line height/wrapping/baselines, spacing, icons, borders/radii/shadows, artwork crop, and layering. Reuse original captures for crops; inspect at normal size for appearance and enlarge when needed for diagnosis. After local repairs, check their neighbors and the affected whole-page composition.

Give explicit conclusions for the quality contract's dimensions and covered regions. Check required/forbidden/excluded regions against page/viewport/parent edges, preceding visible content, and reserved space, including contours, clipping, and occlusion.

- **Repeated content:** check all instances for missing content, wrapping, overflow/occlusion, spacing/edges. Visually inspect every distinct layout/wrapping type, first/last/suspicious items and every unique/uncertain/inconsistent instance. Group consistent verdicts with scope/exceptions; include multiline and ignored-value wrappers.
- **Boundaries:** inspect last-item gaps; diagnose height/min-height, stretch, and reserved space while preserving justified whitespace. Test supported sparse/empty variable lists, not invented fixed-data variants.
- **Pressure:** apply the page contract's zero/nonzero safe-area and pressure criteria; defects affect final quality and enter the same repair loop. Label simulation/gesture limits.
- **Implementation:** consolidate applicable checks and constraint audits for the main workflow's combined independent review; retain separate implementation and visual conclusions.

## Checkpoint and resume

Keep `visual-loop-state.json` as the index with per-artboard records under `targets`, referencing original evidence instead of copying full outputs:

- Shared entry, selected targets, batch count, optional explicit limit and its authority/extensions, pending batch and affected targets.
- Per-target contract/conditions or resolved references, sources, exclusions/dynamic ignores, images/dimensions, observations, differences, and covered regions.
- Batch issues/outcomes and provenance; check command/scope/trigger, related input identity, result/exit, and raw log path.
- Per-target `targetStatus` (`active`, `completed`, `blocked`), `visualVerdict` (`pending`, `passed`, `differences_remaining`), stop reason and next action.
- At sealing: actual time, final image SHA-256, scanned-image hash binding, and delivered revision or working-tree identity.

Reserve atomically before editing; retain pending usage on failure and clear stale acceptance before input changes. Stage/validate images before installation and atomic observation updates. Seal at delivery, planned handoff, or recoverable stop, not every intermediate round; no backup rotation/helper is required. Interruption implies neither rollback nor acceptance.

Validate user-specified resume contracts, counters, dimensions, and recorded hashes; mismatch/contradictory completion blocks. Unsealed checkpoints supply contracts/counters/pending work only: obtain current design evidence and recapture/validate before reusing acceptance. Keep cumulative usage; ask for direction if contracts/counters cannot be established.

## Status and cleanup

With valid evidence, required UI/behavior/assets, project assertions, checks, coverage, and restoration:

| Visual finding | Target result |
| --- | --- |
| Required coverage passes; implementation differences resolved; remaining environment effects explained | `completed`, `passed` |
| Only explicitly accepted deviations remain | `completed`, `differences_remaining`, `accepted_deviations` |
| Unresolved differences or incomplete coverage at a configured limit or other blocker | `blocked`, `differences_remaining` or `pending`, with the actual stop reason |

Report unresolved differences with their impact, including cumulative effects. Missing required UI, broken behavior, unstable assets, project-rule or evidence/tool failures remain blockers. Bind each target's verdict to final hashes/sources; one target's failure does not downgrade another. Record who accepted deviations; technical completion does not establish user approval.

**Blocked path:** preserve current source/failure association, cause/questions, raw failures, unexecuted coverage, budget, and Git/resource state; give the main skill's short handoff. Diagnose only as needed, without exhausted-budget edits. Skip unrelated successful checks/pressure scenarios and unchanged passes; retain safe cleanup and mandatory work. Rendering cleanup invalidates affected evidence; earlier images are diagnostic, not delivery.

Keep designs/final images/checkpoint; remove earlier images on completion, retaining relevant ones on blockers. Remove verification mocks/interception/injections/temporary changes while preserving implementation and pre-existing work. Report Git/resource state, limits, and unperformed checks once, without hiding failures or claiming approval.
