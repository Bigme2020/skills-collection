# Visual iteration

Read this reference before the first capture for an artboard, after finalizing its [page and artboard contract](page-contract.md). Use those contracts throughout the iteration instead of redefining them here.

## Independent target state

Give every artboard its own task-specific OS temporary directory:

```text
<task-temp>/<target>/
├── design.png
├── previous.png
├── current.png
└── visual-loop-state.json
```

The first round may omit `previous.png`. Never share these files or region state between variants, even when they use the same route or component.

## Semantic comparison

Verify actual capture state and readiness before every capture. Check all required, forbidden, and excluded assertions at baseline and final verification, using DOM or geometry evidence where practical. During inner repairs, check the active region, adjacent layout, and assertions affected by the change; if impact is uncertain, check all. Record checked scope and observations as `contract_assertions`; carried-forward results are not fresh observations.

Compare the full page with model vision. Do not generate pixel-difference percentages, heatmaps, automatic connected regions, or numeric pass thresholds.

Keep browser diagnostics compact without reducing check coverage: return readiness totals and failed resources, and only the bounds or styles needed for the current region and its neighbors. Retain per-instance final verdicts below; expand failed or uncertain checks instead of dumping the full DOM, style objects, or successful resource lists.

At each outer scan, select the one to three semantic regions with the greatest visual impact and repair value. Prefer page geometry and major containers, then large components, backgrounds, and asset crops, then local spacing, wrapping, and typography.

Record each region's semantic name, design appearance, current appearance, and the next evidence to check. For a layout-critical region, also compare its recorded relationship to the viewport, page edge, parent, and nearby content. Coordinates are optional; do not invent precision the images do not support.

## Two-layer loop

### Outer full-page scheduling

1. Validate the capture contract and checkpoint.
2. Inspect the current full-page screenshot against the design.
3. If no visible, fixable difference exists, enter final verification without creating an active region or modifying code. Otherwise list the largest one to three semantic regions to repair.
4. Mark one region `active` and enter its inner loop.
5. When it becomes `completed`, rescan the current full page and rank remaining regions again.

Stay in the inner loop until the active region completes, then rescan and rerank from current evidence. Return to the outer loop early if a repair reveals a clear cross-region regression. Do not repeat full-page scheduling after every inner repair; affected-variant checks still apply.

### Inner region repair

1. Lock the active region and its visible completion condition.
2. Choose one most likely cause.
3. Check the repair limits below, then make one focused repair.
4. Capture the complete page again under the same contract.
5. Compare the design, `previous.png`, and `current.png`, including directly adjacent layout.
6. Record the round as `improved`, `unchanged`, or `regressed` and update the region lifecycle.

For position or size repairs, or feedback based on coordinates, treat reported deltas as hypotheses and reconcile them with the current crop, scale, and DOM bounds before editing. Record the relevant design, before, and after geometry when supported by evidence; movement away from the design is `regressed`, not `improved`. For other repairs, record evidence relevant to the changed property rather than unrelated coordinates.

`improved` does not mean completed. For `improved + active`, reset the consecutive non-improvement count and continue the same region. Mark it `completed` only when no visible, fixable difference remains, its dynamic wrapper is checked, and the repair created no adjacent-layout problem.

After two consecutive `unchanged` or `regressed` rounds, stop styling guesses and perform one focused diagnostic pass using evidence relevant to the symptom: DOM bounds, styles, fonts, assets, or page/capture state. If it establishes a cause and budget remains, repair it in the same region. Otherwise stop the target and hand off; do not repeat diagnosis without new evidence.

Once every known region is completed, enter the final scan below using the current full-page screenshot. This is one final scan, not an additional preliminary pass. Add an overlooked region or reactivate an affected one when needed. Record `regressed` only when the current image is visibly worse than the previous image.

## Repair limits

Default limits are 3 cumulative repair rounds per semantic region and 8 per artboard, unless the user specifies finite limits. A round is one focused visual repair and its screenshot verification. Reserve and persist the round count before editing; failed captures do not refund it. Initial implementation, baseline capture, read-only scans, and regression-only captures do not count. Visual repairs resulting from diagnosis or review do count; nonvisual corrections follow the main skill's project-check rules.

Keep cumulative counts through improvement, region renaming, reopening, and checkpoint resume. Charge a shared repair to its declared primary artboard and region; verify all affected variants. Do not switch the primary target to bypass an exhausted limit or modify a stopped variant through shared code. Unaffected targets may continue.

At a limit, finish verification of the last repair and allow final acceptance if all criteria pass; otherwise make no further repair. Stop the target as `blocked` with reason `repair_limit` or `unconfirmed_cause`, never as accepted. Preserve evidence and report counts, remaining differences, attempted fixes, and the likely file/region for human follow-up. Resume repairs only with explicit user authorization for a finite extension; retain cumulative counts. If the user authorizes continuation without a number, add at most 3 rounds to each exhausted limit and record that extension.

## Final scan

Use these evidence inputs for final verification:

- the artboard contract;
- the design image with its proved crop and scale;
- the final `current.png`.

For ordinary tasks, the current agent scans the page anew and derives verdicts from these inputs rather than earlier pass conclusions. This is a reinspection, not context isolation. When Step 4 triggers a fresh verifier, use it for this final scan and supply only these inputs, without earlier rankings, repair history, `completedRegions`, or a claim that the page passed. It must not modify code. Any finding reopens the relevant region and invalidates the prior completion claim.

The final scan must cover every required region in page order and give each an explicit geometry and typography verdict against adjacent fixed landmarks. For every layout-critical region, it must also verdict the recorded relationship, including its edge distance, the preceding content's visible boundary, and any container area reserved between them. CSS positioning alone cannot prove overlap. Verdict every instance in a repeated sibling group and their spacing; a shared container verdict does not cover its instances. Name every repeated multiline group and every value-ignored wrapper; compare its visible bounds and spacing. Presence checks and region-level summaries such as `accepted` are not completion evidence.

## Rolling checkpoint

Keep per-region and per-instance check results compact: identify the item and checked dimensions with a brief verdict; expand evidence for failures and uncertainty. Do not replace individual checks with a single container-level pass or repeat unchanged contracts in round reports.

Load only images needed for the current comparison. Reuse unchanged design and before images already available in context; reload them only when unavailable or insufficient to judge. Load the new current screenshot after each repair, and the previous screenshot when needed to establish improvement or regression. Do not reload older rounds. File rotation limits disk evidence, not images already present in conversation context.

`visual-loop-state.json` is the recovery point and must record at least:

- capture conditions or a resolvable shared-record reference with overrides, and authorized exclusions;
- artboard contract, layout-relationship sources, and observed contract assertions;
- dynamic selectors and reasons;
- image paths, dimensions, and SHA-256 hashes;
- active region and completion condition;
- latest round result and consecutive non-improvement count;
- cumulative artboard and region repair counts, finite limits and authorized extensions, pending repair if any, and stop reason;
- completed region summaries;
- final scan result and the SHA-256 of the scanned `current.png`;
- target status: `active`, `completed`, or `blocked`;
- next action.

Reuse the task's established capture and checkpoint-update commands or helper across rounds, changing target and round data as needed. Adapt them when conditions change; do not rebuild the same file-handling procedure each round or introduce a new tool solely to satisfy this instruction.

Update safely after every successful capture:

1. Stage the new screenshot and state in temporary files and validate their dimensions, hashes, and consistency.
2. Preserve a complete backup of the existing checkpoint, including its images, referenced conditions, and already reserved repair count.
3. Install the new image pair and replace the state file last; retain the backup throughout this update.
4. Validate the installed checkpoint before removing the backup and staging files.

If capture fails, preserve the last complete checkpoint and pending repair count, and apply the main loop's tool-failure limit. If installation is interrupted, restore only a validated backup from this update, report the recovery, and recapture the current implementation before further comparison; restoring evidence does not restore code or refund rounds. Without a validated backup, stop and report a checkpoint error for missing files, hash failures, or conflicting dimensions. Do not guess progress or silently reset counters.

## Completion checklist

For every artboard, confirm:

- the capture contract and image mapping are proved;
- all contract assertions and the per-region final scan pass;
- assets are stable and traceable;
- no task-blocking browser error remains.

Set the target to `completed` only when `activeRegion` is empty, every contract assertion passes, and the final scan reports no visible fixable difference against the hash of the final `current.png`. A latest repair result of `improved` is progress, never completion by itself. Contradictory state is a checkpoint error; stop rather than normalizing it.

## Clean exit

On success, keep `design.png`, final `current.png`, and `visual-loop-state.json`; remove `previous.png`. On a blocker, keep all three images and the state file. Remove earlier screenshots, validation-only mocks, request interception, CSS injection, and other temporary project changes.

Preserve the authorized implementation and every pre-existing user change. Restore the whole worktree only when the task explicitly permits no production change. Report the final Git state.

The final visual report gives each target's entry and reproducible variant, visual conclusion, remaining difference or stop reason, and links to the final screenshot and checkpoint. Keep device mode, capture conditions, exclusions, dynamic ignores, detailed checks, and page state in the linked checkpoint; call out any condition that limits the verdict. For stopped targets, include the repair-limit handoff above.
