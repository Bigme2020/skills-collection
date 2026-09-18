---
name: lanhu-ui-implement
description: Implement and visually verify one browser page and its related variants from current Lanhu design evidence, using project-native code and fixed-state Playwright screenshots. Use for Lanhu design-to-code or visual matching; exclude PRD analysis, generic browser checks, and native UI without a browser preview.
---

# Lanhu UI Implement

Run a tight loop:

`page target -> design evidence -> implement -> capture -> semantic compare -> repair or diagnose -> finish`

One invocation handles one page, route, or component and the artboards that show its related variants. Treat every included artboard as an independent visual target with its own state, capture contract, checkpoint, and conclusion. Keep Lanhu evidence, implementation, and the visual loop in the same agent context; do not pass design retrieval through a lossy summary.

Use fresh evidence only: the current Lanhu MCP result, the current checkout and live page, and screenshots or checkpoints created for this task. Do not search memory, prior conversations, rollout summaries, Git history, other branches, old task directories, or historical screenshots and acceptance conclusions for visual guidance. Resume only from a task checkpoint the user identifies and whose hashes and dimensions validate.

## Design evidence

Treat Lanhu HTML/CSS as a reference representation of the design, not final project code or a complete layout truth. Reconcile the current evidence by role:

- user requirements and project rules define scope, behavior, external-container ownership, and implementation constraints;
- the design screenshot shows visible composition, grouping, order, overlap, and layout relationships;
- HTML/CSS supplies precise local values and structural clues after the represented element and relationship are confirmed;
- Design Tokens clarify tokenized effects or properties absent from HTML/CSS;
- Lanhu slices supply the exact image and icon content.

The model interprets these sources together and adapts the result to the project's framework and conventions. When they conflict, first verify the artboard, design-unit conversion, crop, viewport, fonts, assets, data state, scroll position, device mode, and external chrome. Preserve a genuine unresolved conflict for user or design confirmation.

## Main loop

For any tool operation, stop repeating it after two consecutive failures under unchanged conditions. Retry only after a concrete corrective action or verified condition change; otherwise preserve relevant evidence and report the blocker. This applies to design retrieval, browser capture, and project commands.

Keep tool output scoped to the decision. Read required skills, references, and project instructions completely; for ordinary source or configuration inspection, locate the relevant symbols or settings before reading their surrounding code. Run documented tools from their usage instructions; inspect their implementation only for a failure, unclear interface, or required adaptation. Keep parallel results individually bounded. If display truncation hides part of an available result, retrieve only the unread portion from that result rather than repeating the request or already-read content. Preserve direct design evidence; these output controls do not authorize a replacement design summary.

### 1. Draft the page contract

Read every applicable repository instruction file, including root and target-scoped `AGENTS.md` or `CLAUDE.md`, before inspecting or changing implementation files. Extract only the rules that affect this page: framework, design units, layout, image handling, component placement, exports, compatibility floor, required checks, development command, browser URL, and device switch. Turn each rule into a checkable implementation assertion. Stop if a required instruction file is unavailable.

Identify the requested page and variant scope and map the implementation to its local entry. Leave artboard selection and design-dependent fields pending when they require Lanhu evidence. Related artboards may share the same route; use the project's existing state mechanism, such as a device switch, app environment, query parameter, or fixed data, instead of inventing a route per artboard.

Before drafting the contracts, read [page-contract.md](references/page-contract.md). Apply it separately to every artboard. Record user-stated layout relationships now; leave evidence-dependent relationships provisional until Step 2.

**Complete when:** the page entry and requested variant scope are identified, the contract draft distinguishes known conditions from evidence-dependent fields, and every applicable project rule has a checkable implementation assertion.

### 2. Use direct design evidence

Obtain the current artboard list with `lanhu_get_designs`, select only the requested page's artboards, then call `lanhu_get_ai_analyze_design_result` for them. Reuse a valid result already obtained for this task and scope; apply the tool-failure limit above to retries. Call `lanhu_get_design_slices` only when a target uses assets.

Apply the design-evidence roles directly to the current Lanhu MCP result. Adapt returned code to the project rather than pasting it, and do not create a replacement manifest or condensed design specification.

After inspecting the design evidence, identify every layout-critical region and describe in plain language what it stays attached to and whether it overlaps or reserves space for nearby content. If the user has not supplied these relationships, ask one grouped question with evidence-based proposals. Implement only after the user confirms them or explicitly authorizes inference. When inference is authorized, record the evidence and decision separately for each artboard.

A CSS positioning declaration is only a clue. For any edge or overlapping region, compare the preceding content's visible boundary and check whether its container leaves a dedicated area. Visible separation and reserved container space mean the regions do not overlap even when the inner element uses absolute positioning. Explain any specialized term the first time it is needed; prefer plain descriptions such as `bottom operation area` over abbreviations.

Before implementation, finalize each artboard contract with its design dimensions, page entry, device mode, reproducible variant state, capture conditions, and confirmed or user-authorized inferred relationships. Treat the relationship as the requirement, not a particular CSS technique.

**Complete when:** every selected artboard has a finalized contract, every visible element is accounted for, each needed asset is available, explicitly excluded, or blocked, and every layout-critical relationship has its user or design-evidence source.

### 3. Materialize assets and implement

Follow the user's asset instruction, then the project's existing convention. Use `duitang-image-upload` only when the approved project-ready reference requires Duitang CDN URLs. Keep temporary Lanhu URLs out of production code.

Implement the smallest project-native change that represents every visible target element while preserving business behavior. Shared page changes must support all included variants.

Audit every changed implementation file against its applicable project assertions, authorized scope, style isolation, and requested behavior after initial implementation and at final verification. During repairs, recheck affected assertions; use the full audit when impact is uncertain. Run the narrowest applicable project checks and record each command, scope, exit status, and relevant failure output. Successful checks need no full log in context; retain detailed diagnostics in task evidence when needed and read the relevant failure or uncertainty. Rerun after changes to relevant files, configuration, or dependencies; when unsure whether a prior pass still applies, rerun the narrow check rather than build a hash-based check cache.

Fix failures introduced by this change or affecting the target page. Report a pre-existing unrelated failure separately, with current-checkout evidence establishing both its baseline status and lack of impact; do not label the failed command as passing or change unrelated code to clear it. If relevance or cause remains unresolved after focused diagnosis, report a blocker. Visual fixes consume the visual repair budget; purely nonvisual fixes such as export or lint corrections do not, but still follow the tool-failure limit. Recheck visual acceptance if a correction can affect rendering. Stop for direction on a genuine framework/project-rule conflict.

**Complete when:** every variant renders its complete visible state with stable asset references, requested behavior still works, every recorded project assertion passes against the changed implementation, and checks pass apart from evidenced unrelated baseline failures reported separately. No target-affecting failure or framework/project-rule conflict remains unresolved.

### 4. Run the visual loop

Before the first capture, read [visual-diff.md](references/visual-diff.md). It defines only the screenshot comparison, repair loop, rolling checkpoint, final scan, and cleanup.

Run each artboard through that loop independently, within its repair limits defined in the reference. After a shared implementation change, invalidate prior acceptance and recheck every affected variant.

For an independent evaluation, benchmark, or user-designated high-risk verification, use fresh reviewers when available. First run the read-only visual verifier defined by `visual-diff.md`, then a fresh read-only implementation review with the project assertions, authorized scope, artboard contracts, and dynamic ignores. Keep their verdicts separate. Check findings about visible copy, repeated content, controls, assets, or variant presence against the current Lanhu evidence and artboard contract; design-required repetition is not a code smell. Any confirmed finding reopens the affected artboard or implementation.

**Complete when:** every artboard passes its contract assertions, final scan, and the completion checklist; every recorded project assertion passes the Step 3 audit; and any triggered independent verification also passes. Otherwise the task remains active or ends with a concrete blocker and preserved evidence.

## Handoff

Report the visual fields required by `visual-diff.md` for each artboard, then summarize project assertion and behavior-check results with links to detailed evidence. State visual and implementation conclusions separately. Keep only the evidence required by the two references.
