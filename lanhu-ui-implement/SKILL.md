---
name: lanhu-ui-implement
description: Implement a Lanhu browser page and related variants with current design evidence and a shared two-batch visual repair budget. Use for bounded design-to-code or visual matching; exclude PRD analysis, generic browser checks, and native UI without a browser preview.
---

# Lanhu UI Implement

`page contract -> current design evidence -> implement -> bounded visual review -> deliver`

One invocation covers one page, route, or component and its selected artboard variants. Keep direct Lanhu evidence, implementation, and visual judgment in the same agent context. Each artboard has its own capture contract and verdict; all share the budget in [visual-diff.md](references/visual-diff.md).

## Operating rules

- Use current Lanhu results, checkout, live page, and task evidence, not historical implementations/images, acceptance claims, memory, Git history, or other branches. Resume only a user-identified checkpoint under the visual reference's rules.
- Read required instructions/references completely; inspect relevant source units and documented tool interfaces. Current project rules/configuration define constraints without an adapter or command cache. Inspect internals only for failure, ambiguity, or necessary adaptation.
- Preserve complete original evidence or its accessible source and call association. Read truncations from the same call, loading needed portions rather than repeating requests. Missing complete evidence is a blocker; a model summary cannot replace it.
- Combine related reads and independent read-only checks on stable inputs; serialize shared browser operations and visual diagnosis/repair. Inspect results and block dependent work after failure. Concurrency does not authorize subagents.
- Stop after two consecutive unchanged-condition tool failures. Retry only with a concrete correction or verified condition change; otherwise preserve/report the blocker.

## 1. Draft the page contract

Before inspecting or editing implementation, read every applicable repository instruction, including root and target-scoped `AGENTS.md` or `CLAUDE.md`. Stop if a required file is unavailable.

Read [page-contract.md](references/page-contract.md) and draft its region-level contracts. Record project requirements as editing prerequisites, capture conditions, or delivery gates, satisfying each at its required boundary. Use existing state/device mechanisms, not new routes per artboard.

**Complete when:** entry, selected variants/devices, project dependencies, known conditions, and pending design fields are recorded.

## 2. Resolve current design evidence

Get `lanhu_get_designs`, select requested artboards, then use `lanhu_get_ai_analyze_design_result`. Reuse valid same-task results; request `lanhu_get_design_slices` only for needed assets.

User/project rules define scope and constraints; screenshots establish composition and relationships. Use HTML/CSS for local values only after identifying their element/relationship, not as production code or complete layout truth. Tokens clarify missing effects/properties; slices supply artwork.

Resolve conflicts against artboard, units, crop, viewport, fonts/assets, data/scroll, device, and chrome. Apply the page reference's relationship, exclusion, and safe-area rules. Adopt supported judgments directly: a mobile design needs mobile verification, not unrequested desktop scope. Only unresolved material ambiguity warrants one consolidated question with recommendation and basis; user silence alone does not. Record the evidence or decision.

**Complete when:** every artboard's contract is resolved and sourced; needed assets are available, authorized as excluded, or reported blocked.

## 3. Implement and verify

Meet editing prerequisites first. Follow user/project asset storage, upload, and image-component conventions; use accessible, deliverable resources rather than temporary Lanhu URLs. Make the smallest project-native implementation covering required elements, behavior, and selected variants.

Treat the **visible composite** as the contract, decomposition as a choice. Use the simplest combination of artwork, crop, opacity, and drawing order reproducing it against neighbors; keep shared coordinates, clipping/occlusion, and scrolling coherent, splitting only for differing behavior. Preserve matching appearance across sizes/states and each repeated item's distinct artwork, badges, and overlays. Verify component defaults, prop/style precedence, and crop/container behavior in the first implementation, without a separate preparation phase. Derive heights/aspect ratios from design and project semantics, not page height, bottom-operation spacing, or a universal equal-height policy.

Within each implementation/repair batch, read complete changed units and relevant shared rules/callers; edit with unique context, finish formatting/autofixes, then audit resulting units and actual diffs, including untracked files. Cover selector matches, flow/positioning, dimensions/relationships, decorative ownership, unintended deletion/duplication, project constraints, scope, isolation, and behavior. Expand uncertain impact; carry valid unchanged-unit audits forward. This does not replace visual review or grant repairs.

### Check selection and reuse

Before implementation, choose checks for required delivery claims and real change risk; index commands, scope, triggers, sufficient evidence, inputs, results, and raw outputs/exits in the existing checkpoint. Verify entry points, arguments, extensions, configuration, and global declarations from project scripts/public help. Resolve blockers as found; run independent checks on stable inputs. Follow project dependency/tool authorization; unsupported optional metrics are limits, not extra gates.

**Validity:** evidence is reusable only while its relevant sources, configuration, dependencies, environment, fixtures, and runtime state remain established and unchanged. Recheck affected/uncertain claims; retain unaffected results with original provenance. Decide per dependency, not per task: CSS edits do not invalidate unrelated TS/business checks; TS/TSX edits require affected static checks and related tests. Delivery text alone does not invalidate rendering. Close sufficiently evidenced claims instead of repeating them at handoff.

- Retain all mandatory checks; otherwise test the narrowest actual impact. Unchanged imports are not changed test entries; verify declarative routing and investigate uncertain effects.
- Static fidelity uses screenshots/model review/pressure checks, not new snapshots, pixel/style/DOM assertions, or invented data variants for fixed mocks. Changed logic still requires business-behavior, compatibility, and regression tests; explicit test requirements prevail.
- Preserve raw commands/outputs/exits and inputs, loading conclusions/relevant failures only. Targeted success is not a full-repository pass. Report a baseline failure as unrelated only with current-checkout proof it predates the change and cannot affect the target. Introduced, target-affecting, or unresolved failures block; neither relabel failing commands nor modify unrelated code.

**Complete when:** all variants implement required content/state and preserved behavior with stable assets, and applicable checks pass except separately evidenced unrelated baseline failures. Visual acceptance follows Step 4.

## 4. Review within the shared budget

Use a real target-device context through `playwright-cli`. Read [visual-diff.md](references/visual-diff.md) before the first capture and follow its baseline (including applicable pressure conditions), repair, final-coverage, and blocked/completion rules. It owns batch counting, checkpointing, restoration, and sealing.

For batch capture, readiness, scrolling, geometry, or source binding, read and reuse [capture-tool.md](references/capture-tool.md). Use shared defaults and same-scene steps where appropriate. Tasks supply business selectors/state; the tools do not decide visual acceptance. If unsuitable, record the specific gap and add only missing adaptation, not another generic runner/comparator.

Review in this agent by default. Only authorized independent evaluation/user-designated verification may use one fresh read-only reviewer. Supply resolved contracts/ignores, current design/page evidence, project assertions, and scope, not past verdicts or repair rankings. Separate visual/implementation verdicts, disclose unavailable independence, and validate findings against design-required content. Findings consume the existing budget.

**Complete when:** every target has the visual reference's final coverage, valid evidence, and truthful verdict; implementation gates and requested independent review are accounted for.

## Handoff

Reference saved, accessible, version-matched originals, manifests, and checkpoint indexes; add missing facts to their owning record, not parallel reports.

Write one short delivery with a compact per-target entry/state/verdict/screenshot/differences table; working-tree or commit identity/scope; check/review evidence; shared budget, limits, pending decisions, and cleanup/retention. Retain commit delivery under user/project requirements, including only task changes.

After sealing and this conclusion, immediately submit the complete protocol-required terminal result, including failures/evidence/limits. Reuse content when both saving and submission are required; submit directly when runtime persists it. A saved file is not terminal submission. Execution completion, visual correctness, and user approval are separate.
