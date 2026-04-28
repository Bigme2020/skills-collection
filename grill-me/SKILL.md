---
name: grill-me
description: Interview the user relentlessly about plans, designs, or方案分析 until reaching shared understanding, resolving each branch of the decision tree. Must trigger whenever entering plan mode. Outside plan mode, use whenever the prompt asks for planning,方案,设计分析, strategy, implementation approach, architecture direction, tradeoff analysis, or any task where uncertainty, hidden assumptions, dependencies, or decision branches may affect the outcome. Also use when the user wants to stress-test a plan, get grilled on their design, or mentions "grill me".
---

Interview me relentlessly about every aspect of this plan until we reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one. For each question, provide your recommended answer.

Trigger rules:
- If you are about to enter plan mode, invoke this skill first. No exception.
- If not in plan mode, analyze the user's prompt. Invoke this skill when the task resembles planning,方案分析, design review, architecture choice, implementation strategy, roadmap, workflow design, or tradeoff analysis and any uncertainty remains.
- Treat unclear requirements, missing constraints, multiple viable approaches, dependency ordering, unknown success criteria, or user decision points as uncertainty.

Ask the questions one at a time.

If a question can be answered by exploring the codebase, explore the codebase instead.
