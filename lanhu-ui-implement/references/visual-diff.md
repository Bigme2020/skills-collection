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

Before every capture, use DOM or geometry evidence where practical to confirm required regions are visible, forbidden regions are absent, and exclusions occupy no page space. Record the observed result as `contract_assertions` in the checkpoint.

Compare the full page with model vision. Do not generate pixel-difference percentages, heatmaps, automatic connected regions, or numeric pass thresholds.

At each outer scan, select the one to three semantic regions with the greatest visual impact and repair value. Prefer page geometry and major containers, then large components, backgrounds, and asset crops, then local spacing, wrapping, and typography.

Record each region's semantic name, design appearance, current appearance, and the next evidence to check. For a layout-critical region, also compare its recorded relationship to the viewport, page edge, parent, and nearby content. Coordinates are optional; do not invent precision the images do not support.

## Two-layer loop

### Outer full-page scheduling

1. Validate the capture contract and checkpoint.
2. Inspect the current full-page screenshot against the design.
3. List the largest one to three semantic regions.
4. Mark one region `active` and enter its inner loop.
5. When it becomes `completed`, rescan the current full page and rank remaining regions again.

Do not carry an old ranking across a repair. A shared implementation change may expose or alter another region.

### Inner region repair

1. Lock the active region and its visible completion condition.
2. Choose one most likely cause.
3. Make one focused repair.
4. Capture the complete page again under the same contract.
5. Compare the design, `previous.png`, and `current.png`, including directly adjacent layout.
6. Record the round as `improved`, `unchanged`, or `regressed` and update the region lifecycle.

Treat reported coordinates and deltas as hypotheses. Before editing, reconcile their direction against the current crop, scale, and DOM bounds. After capture, record the affected landmark's design, before, and after positions; movement away from the design is `regressed`, not `improved`.

`improved` does not mean completed. For `improved + active`, reset the consecutive non-improvement count and continue the same region. Mark it `completed` only when no visible, fixable difference remains, its dynamic wrapper is checked, and the repair created no adjacent-layout problem.

After two consecutive `unchanged` or `regressed` rounds, stop styling guesses. Inspect DOM bounds, computed styles, fonts, asset dimensions, page entry, variant state, device mode, business data, and capture state. Repair a confirmed cause, then return to the same region.

Once every known region is completed, reuse the current full-page screenshot for a final scan. Add an overlooked region or reactivate an affected one when needed. Record `regressed` only when the current image is visibly worse than the previous image.

## Cold final scan

After all regions appear complete, run a new scan with only:

- the artboard contract;
- the design image with its proved crop and scale;
- the final `current.png`.

Do not supply earlier region rankings, repair history, `completedRegions`, or an assertion that the page already passed. When Step 4 triggers a fresh verifier, give it only these inputs and ask it to report visible contract violations and fixable differences. It must not modify code. Any finding reopens the relevant region and invalidates the prior completion claim.

The cold scan must cover every required region in page order and give each an explicit geometry and typography verdict against adjacent fixed landmarks. For every layout-critical region, it must also verdict the recorded relationship, including its edge distance, the preceding content's visible boundary, and any container area reserved between them. CSS positioning alone cannot prove overlap. Verdict every instance in a repeated sibling group and their spacing; a shared container verdict does not cover its instances. Name every repeated multiline group and every value-ignored wrapper; compare its visible bounds and spacing. Presence checks and region-level summaries such as `accepted` are not completion evidence.

## Rolling checkpoint

The model context may contain at most the design image and the two latest page screenshots for this target. `visual-loop-state.json` is the recovery point and must record at least:

- capture contract and authorized exclusions;
- artboard contract, layout-relationship sources, and observed contract assertions;
- dynamic selectors and reasons;
- image paths, dimensions, and SHA-256 hashes;
- active region and completion condition;
- latest round result and consecutive non-improvement count;
- completed region summaries;
- final scan result and the SHA-256 of the scanned `current.png`;
- target status: `active`, `completed`, or `blocked`;
- next action.

Update safely after every successful capture:

1. Create and validate the new screenshot.
2. Remove the old `previous.png` if present.
3. Move the old `current.png` to `previous.png`.
4. Move the new screenshot to `current.png`.
5. Write the new state file last.

If capture fails, preserve the last complete checkpoint. Stop and report a checkpoint error when a required file is missing, a hash fails, or recorded dimensions conflict with the images. Do not guess progress or silently reset counters.

## Completion checklist

For every artboard, confirm:

- the capture contract and image mapping are proved;
- every required, forbidden, and excluded contract assertion passes;
- authorized exclusions are explicit and target-specific;
- excluded regions render no element or space and the remaining comparison is cropped and rebased;
- every layout-critical relationship has a user-confirmed or user-authorized inferred source and passes against the usable viewport, page edge, parent, and nearby content;
- no visible, fixable difference remains unexplained;
- dynamic wrappers remain fully checked;
- assets are stable and traceable;
- no task-blocking browser error remains;

Set the target to `completed` only when `activeRegion` is empty, every contract assertion passes, and the cold final scan reports no visible fixable difference against the hash of the final `current.png`. A latest repair result of `improved` is progress, never completion by itself. Contradictory state is a checkpoint error; stop rather than normalizing it.

## Clean exit

On success, keep `design.png`, final `current.png`, and `visual-loop-state.json`; remove `previous.png`. On a blocker, keep all three images and the state file. Remove earlier screenshots, validation-only mocks, request interception, CSS injection, and other temporary project changes.

Preserve the authorized implementation and every pre-existing user change. Restore the whole worktree only when the task explicitly permits no production change. Report the final Git state.

The final visual report contains the target, page entry, reproducible variant state, device mode, capture contract, authorized exclusions, dynamic ignores, visual conclusion, final screenshot, checkpoint location, remaining difference or blocker, and page state.
