---
name: figma-rule
description: Create or refine repo-specific rules for Figma MCP work. Use this skill whenever the user wants `CLAUDE.md`, Cursor rules, agent instructions, or another reusable rules document that makes future Figma-driven implementation follow the repo's design system, component paths, asset handling, and fidelity expectations. Also use it when the user says Figma output is drifting from the codebase, wants stronger Figma rules before implementation, or asks for a repo audit to improve future Figma results. Do not use this skill for directly building the UI from a Figma node; use `implement-design` for that, and use both when the user wants rules plus implementation.
---

# Figma Rule

Turn Figma's "Add custom rules and instructions" guidance into repo-specific agent rules. Use this skill to inspect the codebase, extract the project's real UI conventions, and write concise instructions that improve Figma MCP output without repetitive prompting.

## When To Use This Skill

This skill is for writing durable guidance that changes how future Figma tasks are executed in the repo.

- Use `figma-rule` when the user wants to create or update persistent instructions such as `CLAUDE.md`, Cursor rules, repo prompts, or team guidance for Figma work.
- Use `figma-rule` when the user says Figma-generated code keeps missing the repo's components, tokens, asset pipeline, file structure, or fidelity standards.
- Use `implement-design` when the user wants a component, page, or screen implemented from a Figma URL or node.
- Use both when the user wants to first lock in repo-specific Figma rules and then implement the design using those rules.

## Workflow

1. Inspect the repo before writing rules.
   - Find design tokens, typography, spacing, colors, and layout primitives.
   - Find the shared component library and where UI components live.
   - Identify the framework, styling system, routing, state, and asset conventions.
   - Find how icons and images are stored, imported, optimized, and referenced.

2. Choose the target rule surface.
   - Match the user's environment: `CLAUDE.md`, Cursor rules, or another MCP client format.
   - Keep the host format correct, but keep the rule content tool-agnostic.

3. Write rules in four layers.
   - General project rules: reuse existing components, tokens, naming, paths, and accessibility standards.
   - Required Figma MCP flow: fetch design context first, fetch screenshot, then implement.
   - Asset rules: summarize the MCP asset behavior into project rules; use returned assets directly, and do not invent placeholders or add icon packages when the payload already includes assets.
   - Validation rules: check for 1:1 parity with Figma before claiming completion.

4. Replace placeholders with repo facts.
   - Prefer concrete paths, component names, token files, and style systems from the repo.
   - If a detail cannot be verified, write a narrow rule that stays true without guessing.

5. Keep the final rules concise and imperative.
   - Write short bullets.
   - Use "always", "do not", and "prefer" for stable expectations.
   - Avoid long explanations inside the rules doc.
   - Do not copy documentation examples verbatim when they are really instructions for a human author; extract the durable rule and rewrite it for the agent using this skill.

## Required Coverage

Every rules doc produced with this skill should cover these topics when the repo supports them:

- Design tokens: where colors, typography, spacing, radius, shadows, and breakpoints live.
- Component reuse: which primitives and shared components should be used before creating new ones.
- Styling approach: CSS modules, Tailwind, styled components, utility helpers, or design-system wrappers.
- Asset handling: local image conventions, SVG usage, icon system, and MCP-provided localhost assets.
- Project structure: where screens, features, and UI components belong.
- Accessibility and fidelity: WCAG expectations, semantic HTML, keyboard support, and Figma parity.

## Figma MCP Rules Baseline

Unless the repo has a stronger established convention, include these behaviors:

1. Run `get_design_context` first for the exact selected node.
2. If the payload is too large or truncated, run `get_metadata` and narrow the node scope.
3. Run `get_screenshot` for visual comparison before implementation.
4. Treat generated React/Tailwind as design intent, not final project code style.
5. Translate the output into the repo's existing components, tokens, and architecture.
6. Validate the final result against Figma for visual and behavioral parity.

## Asset Guidance

When converting Figma's asset guidance into rules, keep only the operative behavior:

- Treat MCP-provided image and SVG sources as the source of truth.
- If the MCP payload provides a localhost asset URL, use it directly.
- Do not add new icon libraries when the design assets already come from the MCP payload.
- Do not generate placeholders when a real MCP asset is available.
- Rewrite these points to match the repo's existing asset pipeline and the target rule format.

See `references/custom-rule-snippets.md` for concise starter material adapted from Figma's guidance.

## Output Pattern

Produce a small, practical rules document with sections like:

- Project rules
- Figma MCP flow
- Asset handling
- Validation checklist

If discovery comes first, audit the codebase before drafting rules. At minimum, inspect design system structure, component library, framework, assets, icons, styling, and project structure. Only produce a reusable audit prompt if the user explicitly asks for one.

## Quality Bar

The rules should help another agent behave like an experienced teammate joining the repo:

- Specific to the codebase, not generic.
- Short enough to stay readable.
- Strongly biased toward reuse over new abstractions.
- Clear about what must happen before implementation begins.
- Clear about how to use MCP-provided assets.
