# Visual diff

Read this reference before the first comparison for a target.

## Capture

Create one capture contract for each artboard. Record the browser and version, viewport, DPR, zoom, theme, locale, time zone, device mode, scroll position, data fixture, font and image readiness, and animation state.

Use the project's real device switch, then reload. Capture the complete artboard height. Write screenshots and diff artifacts to a task-specific OS temporary directory.

When a project converts design units, record the converted viewport before capture. For Hasaki's 750/rem convention, read the current project `AGENTS.md`: convert a default 375-wide Lanhu design to 750 terms, capture at 750 CSS px, and verify that the root font size is 100px.

## Compare

Generate a design baseline, implementation screenshot, heatmap, changed-region list, and compact result JSON. Start with a full-page comparison.

A dynamic value may be masked only by a selector for its content node. Keep its wrapper in the comparison. Record every mask with its selector and reason.

## Tight repair loop

1. If no visible, fixable difference remains, run the completion checklist.
2. Otherwise choose the largest one to three changed regions. Read only their manifest entries and source pointers.
3. Make one focused repair, then repeat the full-page comparison.
4. Track consecutive non-improving repairs per region. Reset that count only after the same region improves or work moves to another region.
5. At two non-improving repairs, inspect DOM bounds, computed styles, fonts, image dimensions, route/device state, and data state. Repair a confirmed root cause, then compare again.
6. If no repairable root cause exists, record a blocker with the target, latest artifacts, evidence checked, and the missing requirement.

Pixel difference is a locator and progress signal. It does not replace visual review.

## Completion checklist

For every target, confirm:

- capture state and artboard dimensions match;
- no visible, fixable difference is unexplained;
- masked content is the only excluded part of each dynamic region;
- assets are stable and traceable;
- no task-blocking browser error remains;
- relevant project checks pass and preserved behavior still works.

## Clean exit

Run cleanup on every terminal path, including a blocker:

- retain final screenshots, diff result, and evidence needed to explain the outcome;
- remove validation-only mocks and temporary project changes;
- restore the Git worktree to its recorded starting state;
- report the final Git state.

Do not use a universal numeric diff threshold before a real calibration proves it is useful for that project.

