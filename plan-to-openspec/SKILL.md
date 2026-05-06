---
name: plan-to-openspec
description: >
  Turn an already-agreed plan, requirement list, or conversation context into
  OpenSpec change artifacts, then review and correct them until they match the
  approved scope exactly. Use this skill whenever the user wants to generate
  OpenSpec artifacts or formal change docs from agreed scope: an OpenSpec
  proposal, OpenSpec change, spec, design doc, tasks doc, change docs, or
  "formalize /整理 /落成文档 /沉淀" an agreed plan into OpenSpec artifacts, even if
  they do not explicitly say "OpenSpec" and instead say things like "根据上面的需求出
  change proposal", "把这段计划整理成变更文档", "把当前上下文转成 spec/tasks", or
  "把已经讨论好的内容落到 proposal 里". Do not use it for generic brainstorming,
  ordinary business/product proposals, requests that only ask to discuss or refine
  a plan, or implementation-only work with no request to produce OpenSpec or
  formal change artifacts.
compatibility: Requires openspec CLI and access to `openspec-propose` for new changes plus `openspec-continue-change` or direct artifact editing for existing changes.
---

# Plan To OpenSpec

Use this skill when the user is asking to generate OpenSpec artifacts or formal change documents from a plan or agreed context.

Trigger aggressively when the user intent is "take agreed content and turn it into formal OpenSpec change docs", even if the request is phrased indirectly.

If the user is not asking to generate an OpenSpec proposal/change, create OpenSpec documents/specs, or formalize agreed scope into change artifacts, stop and do not use it.

Examples that should trigger this skill:

- `生成 openspec proposal`
- `把已确认需求生成 openspec change proposal`
- `帮我 propose 一个 openspec`
- `根据上面的 plan 出 openspec 文档`
- `把这个需求整理成 openspec change`
- `把刚才定下来的方案落成 proposal + tasks`
- `把上面讨论好的内容整理成 spec/design/tasks`
- `根据当前上下文生成变更文档，不要再扩需求`
- `把这些确认过的需求正式化成 change proposal`

Examples that should not trigger this skill:

- generic brainstorming with no request to create OpenSpec artifacts
- ordinary business/product/implementation proposals with no OpenSpec or formal change-doc intent
- implementation-only requests
- requests to review existing code without creating OpenSpec change docs

## Goal

Turn one authoritative plan or approved delta into OpenSpec change artifacts, then keep reviewing and editing until the generated or updated documents contain every plan item and no extra scope.

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

When later user messages add or revise requirements, treat them as incremental updates to the existing approved context, not as a full replacement of everything said earlier. If the workflow is continuing an existing OpenSpec change, treat the current user message as a delta unless the user explicitly says to replace, restart, or regenerate from scratch.

Merge rule:

- Keep existing approved facts, requirements, constraints, non-goals, and assumptions that the later message does not mention or contradict.
- If a later approved message directly conflicts with an earlier approved item, the later message wins for that specific conflicted item only.
- Do not delete or rewrite unrelated existing facts because a newer requirement arrived.
- Do not preserve stale alternatives, historical notes, or superseded wording for the conflicted item itself; state only the current winning decision.
- Preserve non-conflicting content from existing OpenSpec artifacts. Absence from the latest user message is not permission to delete prior approved content.

Conflict means both statements cannot be true at the same time for the same subject, field, behavior, constraint, or decision. A newer message that only adds more detail is not a conflict; merge the detail with the existing item.

If the current context contains unclear conflicts, conflicting constraints without an obvious newer winner, or too little information to write faithful OpenSpec artifacts, ask one targeted clarification question before proceeding.

## Existing Change Preservation

Before generating or editing artifacts, check whether the target change directory already exists or the conversation is continuing a previously generated OpenSpec change. If it exists, read the existing change documents first and use them as the baseline to patch.

For existing changes:

- do not regenerate whole files merely because the user supplied a new plan fragment
- do not replace the entire proposal, design, tasks, or spec content unless the user explicitly requested a full replacement
- preserve sections, bullets, scenarios, tasks, rationale, and constraints that do not conflict with the latest approved update
- edit only the smallest section, paragraph, bullet, scenario, or task needed to apply the new or corrected plan item
- create missing artifacts when needed, but patch existing artifacts in place

Treat existing artifact content as previously approved by default, even when the current conversation does not contain its original approval trail. Do not delete old artifact content just because it lacks visible trace metadata or is absent from the latest prompt. Remove or reword old content only when it clearly conflicts with the latest approved scope, the user explicitly asks to prune or replace it, or it is implementation mechanics being promoted into product scope.

## Normalize The Plan

Convert the authoritative plan into an internal checklist before invoking OpenSpec.

The checklist should contain atomic items only:

- one line per requirement
- one line per constraint
- one line per non-goal
- one line per explicit assumption the user already approved

Keep the user's original wording whenever possible. Preserve ambiguity instead of silently resolving it.

For an existing change, split the checklist into two groups before editing:

- preserved baseline items already represented in existing artifacts and still valid
- update items from the latest approved message that are new, changed, or conflicting

Only update items drive edits. Preserved baseline items are evidence to keep existing content, not a reason to rewrite it.

Also create an internal trace map for yourself:

- every plan item must later map to at least one OpenSpec section
- every substantive OpenSpec statement must map back to a plan item

This trace map is for review discipline. It does not need to appear in the final artifacts.

## Change Name

- If the user explicitly provided a change name, pass it through unchanged.
- If continuing an existing change, use the existing change path/name. Do not derive a new change name from the latest delta.
- If the user did not provide a change name, do not force one. Let `openspec-propose` or the OpenSpec workflow derive the default name from the plan.

## Generate Or Update OpenSpec Artifacts

Choose the artifact path by change state.

For a new change with no existing change directory, invoke the `openspec-propose` skill or equivalent `/opsx-propose` workflow.

For an existing change, do not invoke `openspec-propose` to regenerate proposal, design, tasks, or specs from templates. Use `openspec-continue-change`, the equivalent continue workflow, or direct artifact edits to patch the existing change. Before direct edits, check the existing change status and relevant artifact instructions when available so schema dependencies and apply readiness are not bypassed. Create only missing artifacts; patch existing artifacts in place according to the preservation rules above.

Provide the selected workflow with:

- the authoritative plan or normalized checklist
- the explicit change name, if one was provided
- a strict scope instruction: `Do not add new product scope that is not present in this plan. Do not introduce new user-visible requirements, features, constraints, or non-goals. Minimal implementation detail needed to produce standard OpenSpec artifacts is allowed only when it stays strictly inside the approved product scope.`
- an ambiguity instruction: `If the plan contains a real ambiguity that would affect scope, naming, design conclusions, or task content, do not guess. Ask one minimal clarification question instead.`
- a preservation instruction for existing changes: `Treat existing artifacts as the baseline. Patch them surgically. Do not overwrite whole files, recreate files from templates, or remove non-conflicting prior content because it is absent from the latest prompt.`

These instructions override any downstream `openspec-propose` or `/opsx-propose` guidance that encourages reasonable default decisions or momentum. Do not use reasonable decisions to fill scope gaps. If ambiguity affects approved product scope, naming, design conclusions, task content, or user-visible behavior, ask one minimal clarification question before generation or preserve it as an explicit open question in the artifacts.

Generated proposal, design, and task wording must distinguish approved plan facts from implementation mechanics. Do not promote inferred implementation choices, rollout assumptions, risks, or defaults into approved product scope.

Let a new-change workflow generate the OpenSpec change directory and the normal proposal artifacts. Let an existing-change workflow preserve the change directory and modify only required artifact fragments.

After generation or update, identify the change path, enumerate the files that now exist in that change directory, and inspect every generated or edited change document there.

At minimum, review these files when present:

- `proposal.md`
- `design.md`
- `tasks.md`

If additional change documents exist in the same change directory, review those too. Metadata files may help confirm the change structure, but they are not part of the document parity review unless the workflow explicitly generated them as reviewable artifacts.

## Strict Parity Review Loop

After generation or update, compare the artifacts against the authoritative plan. For existing changes, compare against the merged approved plan plus preserved baseline items, not only the latest update. Do not trust the first draft.

Run two passes each iteration.

### Pass 1: Coverage

Check that every plan item is represented somewhere appropriate.

- every requirement appears
- every explicit constraint appears
- every explicit non-goal remains visible when relevant
- every explicit assumption the user already approved appears where relevant
- every preserved baseline item in an existing change remains represented unless explicitly superseded or pruned
- no approved clarification was dropped

### Pass 2: Scope

Check that the artifacts do not expand product scope.

For existing changes, do not treat preserved baseline content as extra scope solely because it is absent from the latest update. Treat it as extra scope only when it conflicts with the merged approved plan, is explicitly pruned by the user, or promotes implementation mechanics into product scope.

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

If any mismatch exists, edit the OpenSpec artifacts directly.

For a change that is still in development, treat the merged approved plan plus non-conflicting existing artifacts as the current truth. OpenSpec documents should not read like an append-only patch log: keep all still-valid earlier facts, but do not preserve outdated decisions, contradicted alternatives, or historical conflict notes for items that a later approved message superseded. Patch only the affected proposal, design, spec, and task fragments so each document states the current decision directly and coherently.

Use surgical edits by default:

- identify the exact section or list item that needs change before editing
- replace one bullet instead of a whole list when one bullet is stale
- replace one scenario instead of a whole spec when one scenario changed
- add a new task instead of rewriting the task list when existing tasks remain valid
- preserve existing ordering and wording when it still matches approved scope
- never use full-file rewrite as a cleanup strategy

Required fixes:

- add back missing plan items
- remove extra scope
- reword speculative statements into faithful plan language
- preserve unrelated existing approved facts that remain valid
- replace only stale or conflicting historical decisions with the current approved decision
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
- whether this was a new change or an existing change update
- if existing, whether full-file replacement was avoided and which artifact fragments changed; verify this by inspecting a VCS diff or file diff before reporting it
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
