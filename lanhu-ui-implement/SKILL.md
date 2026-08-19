---
name: lanhu-ui-implement
description: Implement and visually converge browser-rendered UI from Lanhu designs. Use whenever the user asks to implement, restore, or visually match a local web page from a 蓝湖/Lanhu link, design, or artboard. Coordinate lanhu-mcp for design specifications and assets, then use playwright-cli at the exact design viewport to iterate on the real page. Do not use for PRD-only analysis, non-Lanhu design sources, generic browser checks, or native UI without a browser preview.
---

# Lanhu UI Implement

Own the complete loop from Lanhu design evidence to a visually converged local page:

`Lanhu design -> lanhu-mcp evidence -> project-native implementation -> local page -> Playwright screenshot -> visual diff -> repair -> repeat`

Continue until every target artboard passes the completion gate or a concrete blocker prevents further progress.

## Evidence contract

Use each source for the job it can prove:

- **Lanhu HTML/CSS specification** supplies explicit visual values and layout intent.
- **Design Tokens** supplement properties missing from the HTML/CSS, especially gradients, borders, opacity, and shadows.
- **Lanhu slices** supply the intended image assets.
- **Design screenshots** are the final visual acceptance reference.
- **The repository** supplies the framework, component boundaries, styling system, development command, route conventions, and device-mode mechanism.
- **The rendered local page** proves what the implementation actually does.

When structured values and the screenshot appear to conflict, first re-check the selected artboard, viewport, fonts, assets, page state, and device mode. If the conflict remains, preserve the explicit specification and ask the user to resolve it; do not silently invent a compromise.

## Workflow

### 1. Fix the target set

Identify the Lanhu project, target artboard or artboards, local route, and repository in scope. Inspect the project rather than asking the user for facts available in its config or source.

For each target, record:

- exact artboard width and height;
- desktop or mobile mode;
- local page URL;
- the project's real mechanism for selecting that mode.

One target passing does not cover another. If the requested design is ambiguous after listing the available artboards, ask the user to choose before editing.

**Complete when:** every requested target maps to one unambiguous artboard, viewport, page URL, and device mode.

### 2. Build the Lanhu evidence package

Use `lanhu-mcp` before writing UI code:

1. Resolve an invite link when necessary.
2. Call `lanhu_get_designs` to enumerate the project designs.
3. Call `lanhu_get_ai_analyze_design_result` for every target artboard.
4. Call `lanhu_get_design_slices` for every target that contains assets.

Collect the returned design screenshot, HTML/CSS specification, Design Tokens, and slice mapping together. Treat this package as the durable reference for the implementation loop.

**Complete when:** every target has a design screenshot and sufficient structured specification to implement it, and every visible asset is accounted for or explicitly blocked.

### 3. Discover the project contract

Read the project configuration and nearby implementation before changing code. Detect the framework and the existing styling and asset conventions. Locate the smallest page/component boundary that owns the target UI, the relevant development command, and the actual desktop/mobile switch mechanism.

Keep business behavior stable. Reuse existing components, tokens, and responsive primitives. Make only the local DOM changes needed by layout or semantics. If matching the design requires changing data flow, interaction behavior, or business state, surface that as a separate decision.

**Complete when:** the implementation location, project conventions, run command, and business-preservation boundary are known.

### 4. Materialize assets

Follow the user's asset instructions first. When the user gives no asset-handling instruction, try the `duitang-image-upload` workflow for the Lanhu slices.

Keep Lanhu temporary URLs out of final production code. If the chosen asset path cannot be completed, report the exact missing credential, tool, or project convention instead of substituting placeholders or temporary remote links.

**Complete when:** every referenced asset has a stable project-ready path and matches its source slice.

### 5. Implement the first faithful pass

Implement in the framework and styling system already used by the project. Translate the Lanhu DOM structure into project-native components while retaining explicit sizes, spacing, typography, colors, gradients, borders, radii, shadows, clipping, and asset choices.

Aim for a complete first pass, then let browser evidence drive refinements. Avoid unrelated refactors and speculative abstractions.

**Complete when:** the target page compiles or renders far enough to begin real-page comparison, with every visible design element represented.

### 6. Establish the Playwright baseline

Start or reuse the project's local development server. Reuse one named `playwright-cli` session for the iteration loop.

For each target:

1. Open its local development URL.
2. Resize the viewport to the exact Lanhu artboard width and height.
3. Select the project's real desktop or mobile mode. Viewport resizing alone is not a substitute for business device state.
4. Reload the page so the selected mode and viewport are applied from initial render.
5. Wait for the target state to settle, then capture an implementation screenshot.

Use a route, query parameter, stored preference, or in-page control only when repository or browser evidence shows that it is the project's actual switch mechanism.

**Complete when:** the design and implementation screenshots represent the same target, dimensions, mode, content state, and scroll position.

### 7. Run the visual convergence loop

Compare the design screenshot with the latest implementation screenshot. Maintain a short **diff ledger** covering:

- page frame and major regions;
- alignment, dimensions, spacing, and overflow;
- typography and text wrapping;
- colors, borders, radii, gradients, opacity, and shadows;
- images, icons, cropping, and object positioning;
- responsive and device-specific visibility;
- fixed, sticky, layered, and scroll-dependent elements.

Fix the largest structural mismatch first. Make a focused DOM/CSS change, let the page update, reload when initial state matters, and capture another screenshot at the same viewport. Re-evaluate the whole page after each round because a local correction can move downstream geometry.

Pixel-difference measurements may help locate change, but browser font rendering, antialiasing, and dynamic content make them supporting evidence rather than the completion rule.

**Complete when:** the diff ledger has no unexplained, visible, and fixable discrepancy for any target.

### 8. Pass the completion gate

Finish only when all of the following are true for every target:

- the final screenshot uses the exact artboard viewport and correct project device mode;
- no obvious visual mismatch remains unexplained;
- remaining variance is limited to confirmed rendering noise or uncontrollable dynamic content;
- required assets are stable and traceable to the design;
- the page renders without a task-blocking browser error;
- relevant project checks pass and preserved business behavior still works.

A first successful render or a single screenshot is evidence of progress, not completion. If a real blocker stops the loop, identify the blocked target, the last verified state, the missing requirement, and the evidence needed to resume.

**Complete when:** every gate item is supported by fresh evidence for every target, or the handoff records a concrete blocker without claiming completion.

## Handoff

Report the smallest useful evidence set:

- target artboard names and exact dimensions;
- local URLs and desktop/mobile modes;
- modified files;
- final implementation screenshots;
- visual areas and states verified;
- any remaining differences and why they are acceptable or blocked;
- relevant test, build, lint, and browser-check results.

Keep intermediate screenshots as diagnostic evidence, but show only the final round and any image needed to explain a remaining discrepancy.
