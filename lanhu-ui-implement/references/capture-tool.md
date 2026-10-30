# Generic UI evidence tools

Read for batch captures, resource readiness, scrolling, or geometry checks. The mechanism is generic; tasks supply business contracts. It embeds no domain, route, design width, component selector, equal-height requirement, or acceptance threshold.

## Entry point

Use `playwright-cli` to create or reuse the device context and session required by current design evidence. Verify only selected devices. The tool changes viewport and navigates/reloads; **it does not create or switch device modes**. Confirm availability with `command -v playwright-cli` and `--version`. Follow project dependency-installation authorization without automatically downloading tools.

Run from the tested repository with Node 18+:

```bash
node <skill-dir>/scripts/ui-evidence.mjs <plan.json> <session-name> <output-dir>
```

Use task temporary/evidence directories outside the repository or in an ignored location, with separate output for each source revision/batch. The CLI neither overrides the task budget nor changes business sources. It supports `--help`.

By default, source identity includes Git HEAD, tracked diffs, and untracked content. For established rendering scope, top-level `sourceFiles` lists individual verified files: page dependencies, relevant configuration, lockfiles, and rendering-relevant ignored inputs. Resolve paths from the tested repository and expand known directories to their actual files when constructing this list; the tool neither expands directory/glob entries nor discovers dependencies. The containing project may have no Git repository or commits. Keep default Git identity when scope is uncertain. Selected file changes during capture cause failure.

**Local file identity does not prove the running service uses those sources.** Reuse available service startup directory, build/deployment revision, and actually loaded resource provenance. Associate manifests with that evidence once in the shared checkpoint; inspect real responses or source maps when necessary instead of reproving unchanged inputs. A working directory or screenshot hash alone is insufficient. Keep `servedRevision: unverified` unchanged and reference the separately verified service evidence.

## Task configuration

This synthetic example is not a default acceptance requirement. Include only relationships established by the current contract:

```json
{
  "timeoutMs": 10000,
  "expected": { "touch": true, "dpr": 2, "zoom": 1 },
  "targets": [
    {
      "id": "mixed-layout",
      "url": "https://example.test/preview?state=mixed",
      "viewport": { "width": 360, "height": 760 },
      "ready": "[data-page-ready]",
      "resourceRoot": "main, footer",
      "measurements": { "items": "[data-card]", "footer": "footer" },
      "checks": [
        {
          "type": "equal",
          "selector": "[data-card]",
          "metric": "height",
          "tolerance": 0.5
        },
        {
          "type": "equal",
          "selector": "[data-card]",
          "metric": "y",
          "tolerance": 0.5
        }
      ],
      "screenshot": { "fullPage": false }
    }
  ]
}
```

- Put shared `ready/resourceRoot/measurements/checks/screenshot` in `defaults`; targets specify differences. Scalars and `checks` arrays replace whole values. Merge `measurements/screenshot` by field without implicit assertion concatenation. `expected/timeoutMs` remain at plan level.
- Execute `targets` in order. Put diagnostic mixed states first where useful while covering every contract target. Each `id` is unique and contains only letters, digits, `_`, and `-`.
- Each target requires visible `ready` and `resourceRoot` CSS selectors. Without `url`, reload the current page. Use the function entry below for clicks, input, or extra readiness conditions instead of adding a generic business-action DSL.
- `expected` checks DPR, zoom, and touch capability. Touch points, user agent, and screen width are measured signals, **not independent proof of mobile mode**. Record context creation parameters in the capture contract. If selected artboards require different device contexts, use the corresponding `playwright-cli` sessions/plans while referencing one shared page checkpoint and budget. A viewport change alone does not switch device mode.
- `resourceRoot` limits image checks to matching roots, descendants, and pseudo-element CSS backgrounds. Wait for fonts, `img`, and background image decoding; record failed resources with a bounded timeout, not whole-page network idle. Decoding checks current resources only; page adaptation must verify that intended assets survive the actual rendering path, treating unintended fallbacks as failures. Adapt SVG `<image>`, canvas, video, JS animations, and special component states at page level without claiming full coverage.
- `measurements` returns all element bounds for each selector. Preserve diagnostic screenshots when assertions fail; unready resources/devices produce no comparable screenshot. `ok` means configured mechanical checks passed, not visual acceptance.
- `checks`: `equal` requires at least two matching elements with equal boundary values; `size` checks every matching value against `value`; `inside` checks every match against a unique `container`. `metric` is `x/y/right/bottom/width/height`. Zero matches cannot pass. `tolerance` is CSS px, default 0.5, for layout rounding only, not visual similarity.
- `screenshot.fullPage` covers the document, not expanded nested scrollers. `screenshot.selector` captures an element only after it fully enters the viewport; otherwise the tool fails to avoid automatic scrolling invalidating recorded geometry. Prefer viewport captures and explicit scroll positions for relationship/scroll checks. The CLI fills screenshot paths automatically; function calls require an absolute `path`.

### Configuration preflight

When adapting shared fields, overrides, or `steps`, inspect the effective configuration first, then run a few representative targets that distinguish inheritance from replacement:

```bash
node <skill-dir>/scripts/ui-evidence.mjs --inspect <plan.json>
```

Preflight does not connect to a browser, navigate, run `prepare`, create output directories, or require an unassigned `screenshot.path`. The function entry is named export `await inspectPlan(plan)` from the same module. Output expands final capture points and marks `reuse`. Shared scalars and `checks` replace whole values; `measurements/screenshot` merge by field. Compare with original configuration to establish provenance. This does not validate DOM matches, resources, or visual appearance.

A task may provide independently established top-level `coverage`, indexed by **final capture-point ID**:

```json
{
  "coverage": {
    "single-start": {
      "boundaryProbe": false,
      "measurements": { "footer": "footer" }
    },
    "single-end": { "boundaryProbe": false }
  }
}
```

When enabled, IDs must match exactly. Each declared field is compared as a complete value, ignoring nested object key order but preserving array order. Undeclared fields imply no business rules; an extra key inside a declared `measurements` value still fails. Derive expectations independently from the task contract or trusted prior inputs, not from the plan being tested. `boundaryProbe` is only a task-adaptation example with no built-in business meaning. Existing plans need no migration.

The ordinary CLI and `captureUI` also check coverage before the first browser access; invalid configuration fails without waiting for batch captures. A small live check after static preflight confirms page adaptation but does not replace full target coverage. Valid small-check evidence may be reused when inputs remain unchanged.

### Consecutive evidence in one scene

Use `steps` to reuse navigation for the first viewport, horizontal-scroll end, or post-action state sharing one URL, device, and data preparation. Every capture point independently checks resources, measurements, assertions, and screenshots. Result IDs are `scene-id-step-id`. Ordinary targets retain per-target navigation, with no migration required.

```json
{
  "defaults": { "ready": "main", "resourceRoot": "main, footer" },
  "targets": [
    {
      "id": "mixed-small",
      "url": "https://example.test/preview?state=mixed",
      "viewport": { "width": 360, "height": 760 },
      "steps": [
        { "id": "start" },
        {
          "id": "end",
          "scroll": {
            "selector": ".scroller",
            "axis": "x",
            "to": "end",
            "requireOverflow": true
          }
        }
      ]
    }
  ]
}
```

The CLI creates each step's screenshot path; function callers fill each `screenshot.path`. Later steps cannot reset URL/viewport; use another scene for those changes. Later capture points inherit actual preceding page state, including scroll, and **do not automatically reset scroll or selection**. Use the existing `prepare` callback for restoration/clicks without adding an action DSL. A failed point blocks following reuse points; independent scenes may continue. Shared configuration is not shared acceptance: resources and device signals are checked per point, not cached across navigation.

### Scrolling

Declare on the target:

```json
{
  "scroll": {
    "selector": ".scroller",
    "axis": "x",
    "to": "end",
    "requireOverflow": true
  },
  "checks": [
    {
      "type": "inside",
      "selector": ".item:last-child",
      "container": ".scroller"
    }
  ]
}
```

Scrolling happens before resource checks. Each target tests one explicit position; use separate scenes for start/end or different axes. No overflow returns `not_applicable`, failing only with `requireOverflow: true`. Short-viewport pressure scenarios come from the contract; the tool does not shrink the viewport to make tests pass.

**Programmatic scroll positioning proves reachability, not real touch/wheel gestures or absence of horizontal/vertical interference.** Verify applicability for RTL, scroll-snap, virtual lists, infinite loading, and other special scrolling, adapting at page level when needed. The tool neither simulates safe areas, clicks retry, nor infers default business selection.

## Function entry and adaptation boundary

`captureUI` is a self-contained async function accepting an existing Playwright `page`, shared by `playwright-cli run-code` captures and existing project tests. This workflow still uses `playwright-cli` for browser verification:

```js
import { captureUI } from "<skill-dir>/scripts/capture-ui.mjs";

const result = await captureUI(page, plan);
// Optionally pass prepare(page, target) to prepare state after each navigation.
// Reuse existing fixtures/user actions; the generic tool does not interpret business actions.
// Check result.ok. The visual verdict remains pending until model image review.
```

For post-navigation clicks/retries, use `prepare` after navigation and before readiness/capture to perform authorized actions or extra waits. JSON plans execute no code. For preparation actions, call the same self-contained function with a callback inside `playwright-cli run-code`. Prefer fixed URLs/fixtures for ordinary pages. Keep shared measurements/assertions in the existing function instead of copying the runner.

## Evidence and delivery

The CLI generates `manifest.json`, screenshots, and raw stdout/stderr. Local source fields are `source`, `sourceAfter`, and `sourceUnchanged`; service status is separate in `servedRevision`. Associate actual fields with existing service evidence instead of inventing another source structure. Each record's `timingsMs` separates navigation, preparation, readiness, scrolling, resources, geometry, capture, and cleanup. Business actions in `prepare` count as preparation. CLI stdout already summarizes failures and phase timings; do not manually reconstruct that summary.

Use the stable summary/comparison entry for existing manifests:

```bash
node <skill-dir>/scripts/evidence-summary.mjs <manifest.json>
node <skill-dir>/scripts/evidence-summary.mjs <before.json> <after.json>
```

Comparison requires matching target IDs and measurement selectors in standard manifests, reporting coverage gaps and geometry differences mechanically. Adapt differing scenario names to a common task identity before comparing. This does not replace image review, business checks, or protocol-specific comparisons. Ordinary tasks need no new generic result summarizer or geometry comparator.

The manifest records actual browser/viewport, fonts/resources, geometry/assertions, scroll method, source identity, PNG dimensions, and SHA-256, and is written atomically. Any failed target or changed source causes a nonzero exit while retaining successful target evidence. Configuration errors may prevent the entire batch from starting; an outer shell's success cannot replace internal `ok`.

The tool does not judge design equivalence, crop mapping, or business correctness, and never sets `visualVerdict: passed`. Model review of valid images establishes visual conclusions. The shared checkpoint records contracts, budget, observations, and limitations while referencing manifests instead of duplicating measurements. Delivery format is defined only by the main skill's Handoff.

## Self-tests

Run in a project with `@playwright/test` already installed, without installing extra dependencies:

```bash
node --test <skill-dir>/scripts/*.test.mjs
```

Tests use independent local synthetic pages and isolated browser contexts, not business services. They use the existing Chrome channel, which must already be installed. Coverage includes unequal mixed-layout failure, resource failure, inapplicable scrolling, horizontal/vertical reachability, zero matches, capture timeout, and device-signal errors. This is not real-device or old-browser validation.
