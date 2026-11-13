---
name: to-frontend-tickets
description: Split a frontend spec into UI-first and logic tickets with explicit blocking relationships, and publish them to the configured tracker.
disable-model-invocation: true
---

# To Frontend Tickets

Break a plan, spec, or conversation into **UI tickets** and **logic tickets** for `/implement-frontend-spec`: complete UI first, obtain user approval, then implement logic.

The issue tracker and triage label vocabulary should have been provided. Otherwise ask the user to run `/setup-matt-pocock-skills`.

## Steps

1. Gather the available context. If given a spec path, issue number, or URL, read its full body and comments. Explore the relevant codebase when needed; use the project's glossary and respect its ADRs.

2. Draft tickets sized for one fresh context window:
   - **UI**：一个页面、路由或组件及其相关变体。记录已确认的设计依据：有蓝湖参照时填写引用和目标画板；无蓝湖时填写文字要求、适用的参考页面或截图及现有 UI 约束。两种情况都应包含可复现的固定数据或预览状态、可见要求和可验证的 UI 验收标准。明确要求还原蓝湖却缺少参照时，报告缺少的输入，不自动降级为文字要求实现。保留现有行为，新增业务行为交给 Logic ticket。
   - **Logic**: connect data, state, interactions, APIs, and tests to the completed UI. State the observable behavior and agreed testing seams. Work without UI changes needs only logic tickets.
   - Identify shared UI components first and give each shared implementation one owner. Other UI tickets depend on that owner instead of concurrently changing the same component.

3. Declare each ticket's **blocking edges**. Logic tickets depend on their corresponding UI tickets and any genuine logic prerequisites. UI tickets may depend on other UI tickets, but must be runnable without unfinished logic tickets. Resolve cross-phase dependencies by agreeing on a minimal preview contract or adjusting the breakdown with the user; never silently ignore a blocker. Check for dependency cycles. The user approval between phases is a workflow gate, not a fictitious ticket dependency.

4. Present the numbered breakdown with each ticket's title, type, blockers, deliverable, and acceptance criteria. Confirm granularity, dependency edges, UI/logic boundaries, and missing design or preview decisions with the user. Publish only after approval.

5. Publish one ticket per approved task in dependency order:
   - **Local files**: `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01`; blockers reference ticket numbers and titles.
   - **Issue tracker**: one issue per ticket, linked to the spec; use native blocking relationships where available, otherwise list them in the body. Apply the configured `ready-for-agent` label and existing type labels when available. The body always records the type.

Use this body for each ticket, adding the tracker's normal parent reference or local status as appropriate:

```markdown
# <Title>

**Type:** UI | Logic
**Parent:** <spec reference>
**What to build:** <deliverable and scope boundary>
**Blocked by:** <ticket references, or None>

## Acceptance criteria

- [ ] <verifiable criterion>

## UI evidence and preview (UI tickets only)

- 设计依据：<蓝湖还原 | 文字要求与现有 UI；引用已确认的要求及适用的参考页面或截图>
- 蓝湖引用与目标画板（蓝湖还原时必填）：<references>
- Page or component and variants: <targets>
- Fixed data or reproducible preview state: <contract>

## Testing seams (logic tickets only)

- <observable behavior and agreed seam>
```

任务应在各自阶段内可独立演示或验证。有蓝湖参照的 UI 任务遵循 `lanhu-ui-implement` 的视觉检查及预算耗尽交付规则；无蓝湖的 UI 任务按文字要求、现有 UI 和项目规范验收，提供本地浏览器验证结果与截图，不要求蓝湖画板比对。两种路径的 UI 确认均由用户决定。避免推测性的实现路径和代码片段，除非用于记录已确认的设计决策。不要关闭或修改父 issue。
