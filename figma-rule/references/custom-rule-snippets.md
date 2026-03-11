# Figma MCP custom rule snippets

Use these as compact source material. Convert them into the repo's rule format instead of copying documentation examples literally.

## General-purpose rules

```md
- IMPORTANT: Always use components from `/path_to_your_design_system` when possible
- Prioritize Figma fidelity to match designs exactly
- Avoid hardcoded values; use design tokens from Figma where available
- Follow WCAG requirements for accessibility
- Add component documentation when the repo expects it
- Place UI components in `/path_to_your_design_system`; avoid inline styles unless truly necessary
```

## Consistently good Figma MCP output

```md
## Figma MCP Integration Rules

These rules define how to translate Figma inputs into code for this project and must be followed for every Figma-driven change.

### Required flow
1. Run `get_design_context` first for the exact node.
2. If the response is too large or truncated, run `get_metadata`, then re-fetch only the required node with `get_design_context`.
3. Run `get_screenshot` for a visual reference.
4. Only after design context and screenshot are available, download assets and start implementation.
5. Translate the MCP output into this project's conventions, styles, and framework.
6. Validate against Figma for 1:1 look and behavior before marking complete.

### Implementation rules
- Treat React + Tailwind output as a representation of design and behavior, not final code style.
- Replace utility classes with the project's preferred tokens, utilities, and components where applicable.
- Reuse existing buttons, inputs, typography, icons, and wrappers instead of rebuilding them.
- Respect the repo's routing, state, data-fetching, and file-organization patterns.
- Prefer design-system tokens when Figma values conflict slightly with existing scales.
```

## Asset handling guidance

Condense the asset guidance into a few durable rules:

- Use image and SVG assets provided by the Figma MCP payload as-is.
- Prefer the provided localhost asset source over recreating or exporting substitutes.
- Do not introduce third-party icon packages when the design payload already includes the needed icons.
- Do not create placeholder graphics if a real asset source is present.
- Phrase the final rule in the host format the repo uses, but keep the meaning unchanged.

## Codebase audit checklist

When rules must be tailored to a repo, inspect these areas before writing them:

- Token definitions: colors, typography, spacing, radius, shadows, breakpoints, naming, and transformations.
- Component library: shared primitives, composition patterns, file locations, and documentation sources.
- Framework and tooling: UI framework, styling system, bundler, and app architecture constraints.
- Asset management: image locations, import conventions, optimization pipeline, and CDN or loader rules.
- Icon system: storage location, wrapper components, naming conventions, and import paths.
- Styling approach: global themes, utility layers, CSS methodology, and responsive patterns.
- Project structure: where features, screens, and reusable UI belong.

Capture concrete file paths and brief pattern notes so the final rules can reference repo facts instead of placeholders.
