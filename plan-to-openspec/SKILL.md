---
name: plan-to-openspec
description: >
  Turn an already-agreed plan, requirement list, or conversation context into
  OpenSpec change artifacts, then review and correct them until they match the
  approved scope exactly. Use this skill whenever the user wants to generate a
  proposal, OpenSpec proposal, change, spec, design doc, tasks doc, change docs,
  or "formalize /整理 /落成文档 /沉淀" an agreed plan into OpenSpec artifacts,
  even if they do not explicitly say "OpenSpec" and instead say things like
  "根据上面的需求出 proposal", "把这段计划整理成变更文档", "把当前上下文转成 spec/tasks",
  or "把已经讨论好的内容落到 proposal 里". Do not use it for generic
  brainstorming, requests that only ask to discuss or refine a plan, or
  implementation-only work with no request to produce OpenSpec artifacts.
compatibility: Requires openspec CLI and access to the `openspec-propose` skill or equivalent workflow.
---

# Plan To OpenSpec

Use this skill when the user is asking to generate a proposal or OpenSpec artifacts from a plan or agreed context.

Trigger aggressively when the user intent is "take agreed content and turn it into formal OpenSpec change docs", even if the request is phrased indirectly.

If the user is not asking to generate a proposal, propose an OpenSpec change, or create OpenSpec documents/specs, stop and do not use it.

Examples that should trigger this skill:

- `生成 openspec proposal`
- `生成 proposal`
- `帮我 propose 一个 openspec`
- `根据上面的 plan 出 openspec 文档`
- `把这个需求整理成 openspec change`
- `把刚才定下来的方案落成 proposal + tasks`
- `把上面讨论好的内容整理成 spec/design/tasks`
- `根据当前上下文生成变更文档，不要再扩需求`
- `把这些确认过的需求正式化成 change proposal`

Examples that should not trigger this skill:

- generic brainstorming with no request to create OpenSpec artifacts
- implementation-only requests
- requests to review existing code without creating OpenSpec change docs

## Goal

Turn one authoritative plan into OpenSpec change artifacts, then keep reviewing and editing until the generated documents contain every plan item and no extra scope.

## Plan Source

Build one authoritative plan before generating anything.

Plan source priority:

1. Explicit plan text in the current user message or manual skill arguments.
2. If no explicit plan was supplied, derive the plan from the current conversation context.

When deriving from conversation context, use only:

- user-approved requirements
- explicit constraints
- explicit non-goals
- explicit change-name requests
- clarifications already accepted by the user

Do not invent missing requirements.

If the current context contains conflicting plans, conflicting constraints, or too little information to write faithful OpenSpec artifacts, ask one targeted clarification question before proceeding.

## Normalize The Plan

Convert the authoritative plan into an internal checklist before invoking OpenSpec.

The checklist should contain atomic items only:

- one line per requirement
- one line per constraint
- one line per non-goal
- one line per explicit assumption the user already approved

Keep the user's original wording whenever possible. Preserve ambiguity instead of silently resolving it.

Also create an internal trace map for yourself:

- every plan item must later map to at least one OpenSpec section
- every substantive OpenSpec statement must map back to a plan item

This trace map is for review discipline. It does not need to appear in the final artifacts.

## Change Name

- If the user explicitly provided a change name, pass it through unchanged.
- If the user did not provide a change name, do not force one. Let `openspec-propose` or the OpenSpec workflow derive the default name from the plan.

## Generate OpenSpec Artifacts

Invoke the `openspec-propose` skill or equivalent `/opsx-propose` workflow.

Provide it with:

- the authoritative plan or normalized checklist
- the explicit change name, if one was provided
- a strict scope instruction: `Do not add new product scope that is not present in this plan. Do not introduce new user-visible requirements, features, constraints, or non-goals. Minimal implementation detail needed to produce standard OpenSpec artifacts is allowed only when it stays strictly inside the approved product scope.`
- an ambiguity instruction: `If the plan contains a real ambiguity that would affect scope, naming, design conclusions, or task content, do not guess. Ask one minimal clarification question instead.`

Let it generate the OpenSpec change directory and the normal proposal artifacts.

After generation, identify the created change path, enumerate the files that now exist in that change directory, and inspect every generated change document there.

At minimum, review these files when present:

- `proposal.md`
- `design.md`
- `tasks.md`

If additional change documents exist in the same change directory, review those too. Metadata files may help confirm the change structure, but they are not part of the document parity review unless the workflow explicitly generated them as reviewable artifacts.

## Strict Parity Review Loop

After generation, compare the artifacts against the authoritative plan. Do not trust the first draft.

Run two passes each iteration.

### Pass 1: Coverage

Check that every plan item is represented somewhere appropriate.

- every requirement appears
- every explicit constraint appears
- every explicit non-goal remains visible when relevant
- every explicit assumption the user already approved appears where relevant
- no approved clarification was dropped

### Pass 2: Scope

Check that the artifacts do not expand product scope.

Treat each of the following as a scope addition unless directly grounded in the plan:

- new user-visible features
- new product requirements
- new product constraints
- new non-goals presented as approved scope boundaries
- new rollout or migration requirements framed as required product work
- new risks framed as mandatory scope
- assumptions promoted into facts

Allowed content:

- minimal OpenSpec structure required by the template
- connective text that only restates plan items
- minimal implementation detail needed to produce coherent OpenSpec artifacts, as long as it does not expand approved product scope
- task breakdown, sequencing, and dependency relationships that only operationalize approved scope rather than adding new scope
- migration or rollout notes only when they are implementation detail inside approved scope rather than new required product work
- explicit open questions when ambiguity truly exists and the user has not resolved it

"Helpful" additions still count as additions. Remove them.

## Fix Mismatches

If any mismatch exists, edit the generated OpenSpec artifacts directly.

For a change that is still in development, treat the latest approved plan as the current truth. OpenSpec documents should not read like an append-only patch log: do not preserve outdated decisions, contradicted alternatives, or historical conflict notes just because they appeared in an earlier draft. Overwrite the affected proposal, design, spec, and task content so each document states the current decision directly and coherently.

Required fixes:

- add back missing plan items
- remove extra scope
- reword speculative statements into faithful plan language
- replace stale or conflicting historical decisions with the current approved decision
- convert unsupported assumptions into explicit open questions, if needed
- keep proposal, design, and tasks mutually consistent after each edit

After editing, run the parity review again.

Repeat this loop until all conditions hold:

- zero missing plan items
- zero extra scope items
- change-name handling matches user input or default behavior
- artifacts still read as coherent OpenSpec documents

Do not stop after one correction pass if mismatches remain.

## Ambiguity Rules

- Do not guess when the plan is underspecified in a way that changes scope.
- Do not silently collapse two different user requests into one.
- Do not drop small constraints because they seem obvious.
- Do not guess when ambiguity would change naming, design conclusions, or task content in a substantive way.
- Do not add product scope that the user never asked for.

If exact parity cannot be reached without resolving a real ambiguity, ask the smallest possible clarification question and then continue the same parity loop.

## Final Output

When the workflow is complete, report:

- which plan source was used: explicit prompt or conversation context
- whether the change name came from the user or from default derivation
- the change path
- which artifacts were reviewed
- whether the parity loop found mismatches
- what kinds of mismatches were corrected: missing content, extra scope, or both

## Example Triggering Prompts

- `Use plan-to-openspec for this plan: ...`
- `Run plan-to-openspec on the plan we already agreed above.`
- `Use plan-to-openspec. Change name: add-bulk-export. Plan: ...`
- `生成 openspec proposal，plan 就是上面这些需求`
- `根据这段计划帮我 propose 一个 openspec`
- `把当前上下文整理成 openspec 文档`
