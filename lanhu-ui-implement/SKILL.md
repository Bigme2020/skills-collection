---
name: lanhu-ui-implement
description: Implement or restore a browser UI from Lanhu artboards. Use Lanhu structured design evidence, project-native code, and a fixed-state Playwright visual loop. Use for Lanhu design implementation or visual matching, not PRD-only work, generic browser checks, or native UI without a browser preview.
---

# Lanhu UI Implement

Run a tight loop:

`target -> evidence -> manifest -> implement -> capture and diff -> repair or diagnose -> finish`

Do not claim visual convergence after a first render. Each requested artboard is an independent target.

## Design authority

Use sources in this order:

1. Lanhu HTML/CSS specification.
2. Design Tokens only for a property absent from the HTML/CSS.
3. Design screenshot.
4. Lanhu slice.
5. Model inference.

When the rendered page conflicts with an explicit specification, first verify the artboard, design-unit conversion, viewport, fonts, assets, data state, scroll position, and device mode. Preserve an unresolved genuine conflict for user or design confirmation.

## Main loop

### 1. Fix the target and project contract

Map every requested artboard to its local route, exact design dimensions, device mode, and page state. Inspect the repository for its framework, styling and asset conventions, development command, and real device switch.

**Complete when:** every target has one route, one mode, and one reproducible state.

### 2. Build complete design evidence

Before UI code, call `lanhu_get_designs`, then `lanhu_get_ai_analyze_design_result` for each target. Call `lanhu_get_design_slices` when the target uses assets.

Archive the raw results and build a `design-manifest.json`. The manifest must preserve every visible node, CSS property, Token supplement, and asset mapping, either directly or through a checked source pointer and hash.

Validate the manifest before implementation. A missing or unaccounted source item is a blocker, not an inference opportunity.

**Complete when:** the manifest validates and each needed asset is present or explicitly blocked.

### 3. Materialize assets and implement

Follow the user's asset instruction, then the project's existing convention. When approved assets need Duitang CDN URLs, pass only the selected slices to `duitang-image-upload`; otherwise materialize them through the approved project-local convention. Use stable project-ready references, not temporary Lanhu URLs.

Implement the smallest project-native change that represents every visible design element while preserving business behavior.

**Complete when:** the page renders with all visible target elements and stable asset references.

### 4. Run the visual loop

Before the first capture, read [visual-diff.md](references/visual-diff.md). It defines the capture contract, diff artifacts, repair loop, diagnosis branch, completion checklist, and cleanup that applies to both successful and blocked runs.

**Complete when:** every target passes the completion checklist or ends with a concrete blocker and its evidence.

## Handoff

Report target artboards and dimensions, route and device mode, modified files, final screenshots and diff artifacts, verified states, remaining differences or blockers, and relevant checks. Keep only final diagnostic evidence unless an earlier artifact explains a blocker.
