---
name: to-aligned-requirements
description: "Capture the aligned requirements from the current conversation into a single durable file, merging per-section without clobbering sections it did not produce. No interview; just synthesis of what's already agreed."
disable-model-invocation: true
---

# To Aligned Requirements

Freeze what the current conversation has already aligned on into one durable file that a later, context-free session can consume. Do **not** interview; synthesise only what is already agreed. This file is the single hand-off between the grilling phase and `/ship-frontend`.

The issue tracker vocabulary should have been provided. Otherwise ask the user to run `/setup-matt-pocock-skills`. On a local-markdown tracker the file lives at `.scratch/<feature-slug>/aligned-requirements.md`; on a remote tracker, follow that tracker's convention for where a pre-spec requirements note lives, and record the chosen location so `/ship-frontend` can find it.

## What this file is, and is not

- It records **agreed requirements and architecture decisions**, not a spec. `/to-spec` consumes this file and produces the spec.
- It is the **only** input `/to-spec` needs. A session that reads this file must be able to produce the spec without the original grilling conversation.
- It is organised into fixed, independently-owned sections (below). Different grilling passes populate different sections; this skill updates the sections the current conversation produced and **leaves every other section exactly as found.**

## Per-section merge

This skill is run after any grilling pass. The upstream grilling skills do not know about each other; the only coordination point is this file's section layout.

1. Determine the `feature-slug` with the user if it is not already evident from the conversation or an existing file.

2. If the file already exists, read it. Treat each section heading below as an independent slot owned by whichever pass can fill it.

3. Write or update **only** the sections the current conversation has genuinely produced. For each such section, replace its body with the current synthesis. Do **not** touch sections the current conversation says nothing new about: preserve their existing content verbatim, including when they were written by an earlier, different grilling pass. Never delete a populated section because this pass had nothing to add to it.

4. If a section has no agreed content yet from any pass, leave its placeholder line (`- _Not yet aligned._`) so the layout stays stable and the gap is visible.

5. Report which sections you wrote, which you preserved untouched, and the file path.

## File template

Create the file from this template on first write; on later writes keep the headings stable and merge per the rules above.

```markdown
# Aligned Requirements: <feature>

> Single source of aligned intent for `/ship-frontend`. Sections are owned independently by different grilling passes; each pass updates only its own sections.

## Business alignment

The agreed problem and solution from the user's perspective, and the agreed observable behaviour. Enough for `/to-spec` to derive its Problem Statement, Solution, and User Stories.

- _Not yet aligned._

## Architecture readiness

The agreed encapsulation: intended modules and seams, interfaces and hidden complexity, ownership of state/side-effects/dependencies, and the test surface and migration shape. Enough for `/to-spec` to derive its Implementation and Testing Decisions. When a technical-design grilling pass produced a readiness report, carry its decision-rich content here.

- _Not yet aligned._

## Out of scope

What is explicitly not part of this feature.

- _Not yet aligned._

## Open questions

Any named business gaps or unresolved decisions that remain, so a later phase does not mistake them for settled. Empty is a valid, explicit answer.

- None.
```

Keep the file decision-rich and free of speculative file paths or code snippets, except a snippet that encodes a decision more precisely than prose can (a state machine, reducer, schema, or type shape); trim it to the decision, not a working demo.
