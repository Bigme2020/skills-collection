# Skill self-iteration

Maintenance only. Read this document when the operator explicitly asks to improve or evaluate this skill's iteration process. It is outside the page-implementation workflow: keep it unlinked from SKILL.md, runtime references, and agent invocation metadata. It grants no authority to start experiments, delegate work, extend budgets, commit, or publish.

## Adopted decisions

The operator approved retaining both changes after their original evaluations and separate retests:

- **Round 5 — visible-composite contract:** retain the existing composition guidance in SKILL.md, section 3.
- **Round 7 — pressure in baseline review:** retain the existing review timing in SKILL.md, section 4, and visual-diff.md, including evidence reuse when rendering inputs are unchanged.

This settles adoption, not proof of stable speedup or approval of the evaluated pages. Preserve historical quality failures and timing uncertainty; do not reclassify them as successful cost reductions. These decisions add no runtime instructions or further experiments.

## Objective

Improve the agent's decisions so it delivers a page meeting the agreed visual quality with less wasted work. Evaluate three separate outcomes:

| Outcome            | Question                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------- |
| Visual quality     | Does the rendered page meet the agreed fidelity requirement? What significant differences remain? |
| Execution behavior | Did the candidate produce the decision or action this change was intended to improve?             |
| End-to-end cost    | How long did the complete task take, and where was the time spent?                                |

Quality comes first. A faster run that misses the quality requirement is not a successful speed improvement. Static checks, successful captures, and exhausted repair budgets do not establish visual acceptance. Execution completion and user approval are separate conclusions.

Keep two loops distinct:

- **Page loop:** implementation, visual review, and the finite repair budget defined by the frozen skill or explicit task authorization.
- **Skill loop:** diagnose a previous run, change the candidate, then evaluate it through another implementation.

A skill iteration does not reset a sealed page's repair count. Use a separate implementation entry and evidence directory for a new evaluation, preserving previous work.

## 1. Select the problem

Review the previous run's actual design, page images, execution records, and timing. Historical artifacts may diagnose the skill here; they are not visual guidance for the next implementation.

Distinguish the primary cause:

- **Judgment:** a significant discrepancy was missed, or an asset or layout relationship was misinterpreted.
- **Action:** edits began without a supported cause or did not address that cause.
- **Process:** repeated checks, ineffective tool organization, or reconstructed handoff evidence consumed time.
- **Environment:** service, authentication, tools, or model connectivity prevented reliable execution.
- **Acceptance calibration:** the agent's visual judgment did not meet the user's quality requirement.

Choose one main behavior worth changing. Record supporting evidence and unresolved uncertainty. A run with many failures does not require one new instruction per failure.

**Complete when:** the iteration has one evidence-supported problem statement, not just a list of symptoms.

## 2. Form a behavioral hypothesis

State the intended change in one sentence:

> Replacing instruction A with B should make the agent do C at stage D, reducing error or wasted work E.

Name the observation that would support it and what would disprove it. Separate these possibilities: behavior did not change; behavior changed without improving quality; a local improvement caused a larger regression; or preparation cost exceeded saved repair effort.

For example, organizing implementation around visual composition should lead the agent to choose assets that combine correctly with their actual backgrounds and neighboring content in the first version. The hypothesis concerns that decision, not compliance with a particular image-processing recipe.

**Complete when:** the next run can reveal whether the expected behavior occurred and whether it helped.

## 3. Make the smallest change and freeze it

Change only the authorized candidate. Prefer replacing, combining, or deleting existing instructions over adding incident-specific prohibitions. Keep project implementation conventions in project instructions and reusable decision-making in the skill.

Check consistency between the main workflow, relevant references, and evaluation expectations. Update existing evaluation scenarios where sufficient; add one only for a materially uncovered behavior. Written expectations and static validation are not executed model-behavior evaluations.

Run checks appropriate to the changed files. Record the candidate version or content identity and preserve the previous version for comparison. Freeze the candidate before implementation begins; keep it unchanged throughout that evaluation. New findings feed the next skill iteration.

**Complete when:** the candidate is identifiable, internally consistent, and ready to test against the stated hypothesis.

## 4. Evaluate through a separate implementation

Before starting, establish the design and selected variants, model and reasoning settings, device and capture conditions, quality requirement, page repair budget, and timing boundaries. Record material environment or cache differences rather than silently treating runs as equivalent.

Implement from current design evidence and the current project. Keep prior implementation sources, screenshots, repair rankings, and acceptance conclusions out of the implementation context. A fresh session can provide context separation; disclose retained knowledge if execution stays in the same session. Use a subagent or independent reviewer only with operator authorization.

Use the same design to compare behavior and effort, and a new design to test transfer. Both need not run in every iteration, but successful reuse of a familiar page alone does not establish general improvement. Before treating an improvement as stable, evaluate it on a design not used to develop the change.

Follow the frozen skill's normal implementation and verification workflow, including required playwright-cli verification and applicable project checks. Preserve actual failures and budget usage. The experiment does not create a different repair policy.

**Complete when:** the run has attributable sources, valid evidence, an actual terminal result or an explicit interruption, and truthful coverage limits.

## 5. Judge quality, then explain cost

First compare current design and rendered page images under the agreed conditions. Identify the most significant differences and decide whether quality meets the requirement. Use assets, sources, and geometry to explain findings, not as substitutes for visual judgment. Review applicable layout pressure cases separately from design-equivalence evidence.

Then examine whether the hypothesized behavior occurred and how execution time changed. At minimum, record:

- Task start under a consistent timing boundary.
- First comparable implementation screenshot.
- Last main screenshot.
- Final handoff, including required result submission.

Measure wall-clock time from task start through final handoff, including preparation, failed operations, waiting, recovery, verification, and documentation. If a user request is available, include work after that request rather than starting the clock at the first convenient command. For orchestrated runs, include dispatch and return overhead. A capture, saved report, or evidence-sealing timestamp is a phase marker, not the complete execution endpoint. Preserve interrupted runs as interrupted; a later review does not retroactively complete them.

Use phase times to locate cost. Disclose differences in scope, model settings, environment, and cache state. A single observation does not establish stable speedup, visual equivalence, lower model cost, or causation by the edited instruction.

**Complete when:** quality, observed behavior, and complete timing each have an evidence-based conclusion with comparison limits.

## 6. Decide what to retain

| Observation                                                              | Decision                                                                                                     |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Expected behavior occurred, quality improved or held, and cost decreased | Retain provisionally and verify in later runs.                                                               |
| Expected behavior occurred, but quality or cost worsened                 | Adjust or withdraw the candidate change within authorized scope.                                             |
| Expected behavior did not occur                                          | Reconsider wording, placement, competing instructions, or the hypothesis instead of adding synonymous rules. |
| Quality improved at higher cost                                          | Keep the trade-off explicit and obtain direction when it changes the agreed objective.                       |
| Environment or evidence prevents attribution                             | Mark the hypothesis unverified and resolve the blocker before claiming a skill effect.                       |

A retained candidate is not yet a proven improvement. Subsequent user findings are new acceptance evidence: append the corrected judgment while preserving the original run record. Restore only changes attributable to this iteration when withdrawing it; preserve unrelated work.

**Complete when:** the iteration has a clear retain, adjust, withdraw, or unverified decision and one next focus, if needed.

## 7. Continue within a finite scope

Run only the finite number of skill iterations authorized by the operator. Stop when evidence cannot distinguish causes, repeated changes fail to produce the intended behavior, environment prevents comparison, a quality/cost trade-off needs a user decision, or the objective has been reached with little supported benefit from further changes.

Reconsider the page repair limit only when runs show that significant discrepancies were identified, causes were supported, and repairs were effective, yet the limit repeatedly prevented completion. Missed discrepancies and speculative edits point to judgment or repair selection first. The current runtime policy remains authoritative until an explicitly scoped change is made; maintenance work never grants old pages additional batches.

## Iteration record

Keep one short iteration conclusion linked to original evidence. Use existing repository task and evidence conventions rather than introducing a parallel reporting system. Record:

```text
Candidate identity:
Hypothesis and disconfirming observation:
Instruction changes:

Evaluation scope and conditions:
Quality judgment and significant differences:
Did the expected behavior occur?:
First screenshot / last main screenshot / full handoff times:
Comparison limits:

Decision: retain / adjust / withdraw / unverified
Next focus, if any:
Evidence references:
```

Keep complete outputs in their original records. The iteration conclusion explains the decision; it does not retell the execution history.
