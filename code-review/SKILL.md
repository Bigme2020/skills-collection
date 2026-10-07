---
name: code-review
description: Review changes since a fixed point (commit, branch, tag, or merge-base) against repository standards and the originating spec. Use when the user wants to review a branch, PR, work-in-progress changes, or asks to "review since X".
---

## 执行入口

主代理读取并执行 [REVIEW.md](REVIEW.md)：确认基线、查找 spec 和规范，使用当前 harness 可用的 subagent/agent-dispatch 能力创建两个独立 reviewer，最后汇总报告。两个 reviewer 应尽可能并行、使用独立上下文；优先使用已定义的 `reviewer`，否则按本次评审选择模型与推理强度。
