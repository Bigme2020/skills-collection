---
name: lanhu-ui-implement
description: Implement a Lanhu browser page and related variants with current design evidence and a shared two-batch visual repair budget. Use for bounded design-to-code or visual matching; exclude PRD analysis, generic browser checks, and native UI without a browser preview.
---

# Lanhu UI Implement

Use a bounded page workflow:

`page contract -> current design evidence -> implement -> full-page review -> up to two repair batches -> deliver`

One invocation covers one page, route, or component and its selected artboard variants. Keep direct Lanhu evidence, implementation, and visual comparison in the same agent context. Each artboard has independent capture conditions and a visual verdict; all variants share one page repair budget, defined only in [visual-diff.md](references/visual-diff.md).

Use the current Lanhu MCP result, current checkout and live page, and evidence created for this task. Resume only a user-identified task checkpoint after validation. Historical screenshots, prior acceptance claims, memory, Git history, and other branches are not visual guidance.

## Operating rules

- After two consecutive failures of a tool operation under unchanged conditions, stop repeating it. Retry only after a concrete correction or verified condition change; otherwise preserve evidence and report the blocker.
- Read required skills, references, and project instructions completely. Scope ordinary source inspection to relevant symbols or settings. Use tools from their documented interfaces; inspect internals only for a failure, unclear interface, or required adaptation.
- Keep outputs compact. Retrieve unread portions of retained results instead of repeating requests. Preserve direct design evidence rather than replacing it with a model-written design summary.

## 1. Draft the page contract

Read every applicable repository instruction file, including root and target-scoped `AGENTS.md` or `CLAUDE.md`, before inspecting or editing implementation. Stop if a required file is unavailable.

Identify the page entry and requested variant scope. Extract checkable project assertions for framework, design units, layout, image handling, component placement, exports, compatibility, required checks, preview command, URL, and device switch.

Read [page-contract.md](references/page-contract.md). Draft one region-level contract per artboard; leave design-dependent fields pending until current Lanhu evidence supplies them. Use existing state and device mechanisms rather than inventing routes per artboard. Record user-stated layout relationships now.

**Complete when:** entry, scope, known capture conditions, and applicable project assertions are recorded, with evidence-dependent fields explicitly pending.

## 2. Retrieve and interpret current design evidence

Get the artboard list with `lanhu_get_designs`, select only requested targets, then call `lanhu_get_ai_analyze_design_result`. Reuse valid results already obtained for this task and scope. Call `lanhu_get_design_slices` only for needed assets.

Reconcile evidence by role:

- user requirements and project rules define scope, behavior, ownership, and implementation constraints;
- the screenshot establishes composition, grouping, order, overlap, and layout relationships;
- HTML/CSS supplies precise local values after confirming the represented element and relationship;
- Design Tokens clarify tokenized properties or effects absent from HTML/CSS;
- slices provide exact image and icon content.

Returned HTML/CSS is a reference, not final project code or a complete layout truth. For conflicts, verify artboard, units, crop, viewport, fonts, assets, data state, scroll position, device mode, and external chrome before asking for a decision.

For each layout-critical region, record what it stays attached to and whether nearby content reserves space for it. Check visible content boundaries and reserved container space; absolute positioning alone does not prove overlap. Ask one grouped plain-language question with evidence-based proposals when relationships are not user-supplied. Implement after confirmation or explicit authorization to infer, recording the evidence and decision separately per artboard.

Apply the reference's external-chrome and bottom-safe-area rules. Removing a Home Indicator graphic does not remove page-owned minimum spacing.

**Complete when:** every artboard has finalized dimensions, entry, device mode, reproducible state, capture conditions, authorized exclusions, required/forbidden regions, and sourced layout relationships; every needed asset is available, authorized as excluded, or reported blocked.

## 3. Materialize assets and implement

Follow the user's asset instruction, then existing project conventions. Use `duitang-image-upload` only when approved project-ready references require Duitang CDN URLs. Keep temporary Lanhu URLs out of production code.

Make the smallest project-native change representing every required visible element while preserving business behavior and supporting all selected variants. Content cards default to content-driven height; fixed, fill, stretch, or minimum heights require the confirmed container contract. Page-fill and bottom-operation spacing do not establish an inner card's height.

Audit changed files against project assertions, authorized scope, style isolation, and behavior after initial implementation. During repairs, audit affected assertions; audit all when impact is uncertain. At delivery, consolidate the final audit with the last verification rather than repeating an unchanged review.

Run the narrowest applicable project checks and record command, scope, exit status, and relevant failure output. Rerun checks after their inputs change; do not repeat an unchanged passing command merely for another handoff. Keep full successful logs out of context.

Fix introduced or target-affecting failures. Report an unrelated baseline failure only with current-checkout evidence of its pre-existing status and lack of target impact; do not call that command passing or edit unrelated code to clear it. Unresolved relevance, implementation failures, or project-rule conflicts remain blockers. Purely nonvisual corrections do not consume visual batches, but any rendering effect requires visual rechecking under the visual reference's budget rules.

**Complete when:** every variant renders its required elements and state with stable assets, requested behavior is preserved, and implementation assertions and relevant checks pass apart from evidenced unrelated baseline failures disclosed separately.

## 4. Review and repair within the page budget

Read [visual-diff.md](references/visual-diff.md) before the first capture. It is the authority for batch counting, review coverage, checkpointing, finalization, and cleanup.

初始检查先看最有诊断价值的布局关系：混排类型、状态混排、首尾项、窄屏及底部边界；按契约核对同组元素之间的尺寸、对齐、间距和角标锚点，而不只核对各自数值。关系检查优先于其余变体，但仍须完成全部所选画板的基线检查后统一规划修复，不增加局部修复循环，也不默认混排必须等高。

批量截图、资源就绪、滚动和几何取证优先复用 [通用取证工具](references/capture-tool.md)：共享条件放 defaults、目标只写差异；同场景连续捕获用 steps 复用导航；失败与几何差异用现成摘要入口。由任务提供入口、选择器、关系和最小业务适配，脚本结果不替代视觉判断。工具不适用时记录具体缺口，只补缺失能力，不为每批重建捕获器或通用比较器。

Review every selected artboard initially. Batch confirmed, nonconflicting visual repairs instead of entering a separate iterative loop for each region. Recheck affected variants after shared changes; uncertainty expands coverage. Combine the last review with final verification, using the same valid screenshots rather than scheduling an additional identical scan.

Ordinary tasks use the current agent for visual and implementation review. Independent evaluation, benchmarks, or user-designated high-risk verification may use a fresh read-only reviewer only when delegation is authorized. Prefer one bounded review covering both visual and implementation checks, with separate verdicts. Supply resolved contracts, dynamic ignores, current design/page images, project assertions, and authorized scope, not prior acceptance claims or repair rankings. If no reviewer is available, disclose that independence was not achieved.

Confirmed reviewer findings use the remaining shared budget; they do not open another automatic repair cycle. Validate visible-content findings against current Lanhu evidence: design-required repeated copy or controls are not code smells.

**Complete when:** every artboard has a final scan and truthful visual verdict, implementation gates pass, and any requested independent review is recorded. Visual budget exhaustion permits delivery with disclosed differences, not bypassing missing evidence or technical blockers.

## Handoff

已有完整清单且检查点符合 [固定封存入口支持的结构](references/capture-tool.md#已封存证据收尾) 时，用该入口核对并生成根外 machine receipt；不重跑捕获、不升级服务或视觉结论，人工交付引用同一 receipt。其他检查点结构沿用既有收尾，不为调用工具重写原证据。

只写一份简短人工交付结论：交付提交与范围；逐目标入口／复现状态、视觉结论、截图及差异；项目检查与独立审查（如要求）的结论和原始证据链接；共享预算、验证限制、待决策及清理／保留结果。逐目标用紧凑表格，不展开重复叙述。

原始设计结果、截图、命令日志及审查原文保留不变；捕获条件、源身份和图片 hash 使用工具清单，观察与预算使用共享检查点。每项引用必须已落盘、可访问且版本匹配。任务票只更新状态并追加提交、审批／阻塞与交付链接；父会话呈现必要截图和用户决策，不重新生成完整验证报告。协议要求的结构化结果照常提供，引用同一证据而非另写一套长叙述。Delivery completion, visual correctness, and user approval are separate conclusions.
