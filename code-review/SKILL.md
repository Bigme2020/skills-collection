---
name: code-review
description: Review changes since a fixed point (commit, branch, tag, or merge-base) against repository standards and the originating spec. Use when the user wants to review a branch, a PR, work-in-progress changes, or asks to "review since X".
---

# Code review

Review the diff between `HEAD` and a fixed point on two axes:

- **Standards**: does the code conform to this repo's documented coding standards?
- **Spec**: does the code faithfully implement the originating issue / spec?

The primary agent prepares the evidence, asks the user for missing information, dispatches independent reviewers, and aggregates their reports. A change can pass either axis and fail the other, so report them separately.

## Process

### 1. Pin the fixed point

Whatever the user said is the fixed point (a commit SHA, branch name, tag, `main`, `HEAD~5`, etc.). If they didn't specify one, ask for it.

Capture the diff command once: `git diff <fixed-point>...HEAD` (three-dot, so the comparison is against the merge-base). Also note the list of commits via `git log <fixed-point>..HEAD --oneline`.

Before going further, confirm the fixed point resolves (`git rev-parse <fixed-point>`) and the diff is non-empty. A bad ref or empty diff should fail here, not inside two parallel sub-agents.

### 2. Identify the spec source

Look for the originating spec, in this order:

1. Issue references in the commit messages (`#123`, `Closes #45`, GitLab `!67`, etc.). Fetch them using the issue tracker instructions provided for this repo. If no tracker instructions are available, tell the user to run `/setup-matt-pocock-skills` and continue looking for a local spec.
2. A path the user passed as an argument.
3. A spec file under `docs/`, `specs/`, or `.scratch/` matching the branch name or feature.
4. If nothing is found, ask the user for the spec source. If the user confirms there is no spec, omit the Spec review packet and record "no spec available" for aggregation.

### 3. Identify the standards sources

Search the repo for every file that documents how code should be written. Include `CODING_STANDARDS.md` and `CONTRIBUTING.md` when they exist.

On top of whatever the repo documents, the Standards axis always carries the **smell baseline** below: a fixed set of Fowler code smells (_Refactoring_, ch.3) that applies even when a repo documents nothing. Two rules bind it:

- **The repo overrides.** A documented repo standard always wins. Where it endorses something the baseline would flag, suppress the smell.
- **Always a judgement call.** Each smell is a labelled heuristic ("possible Feature Envy"), never a hard violation. Like any standard here, skip anything tooling already enforces.

Each smell reads *what it is* → *how to fix*. Match it against the diff:

- **Mysterious Name**: a function, variable, or type whose name doesn't reveal what it does or holds. → rename it. If no honest name comes, the design's murky.
- **Duplicated Code**: the same logic shape appears in more than one hunk or file in the change. → extract the shared shape, call it from both.
- **Feature Envy**: a method that reaches into another object's data more than its own. → move the method onto the data it envies.
- **Data Clumps**: the same few fields or params keep travelling together (a type wanting to be born). → bundle them into one type, pass that.
- **Primitive Obsession**: a primitive or string standing in for a domain concept that deserves its own type. → give the concept its own small type.
- **Repeated Switches**: the same `switch`/`if`-cascade on the same type recurs across the change. → replace with polymorphism, or one map both sites share.
- **Shotgun Surgery**: one logical change forces scattered edits across many files in the diff. → gather what changes together into one module.
- **Divergent Change**: one file or module is edited for several unrelated reasons. → split so each module changes for one reason.
- **Speculative Generality**: abstraction, parameters, or hooks added for needs the spec doesn't have. → delete it. Inline it until a real need shows.
- **Message Chains**: long `a.b().c().d()` navigation the caller shouldn't depend on. → hide the walk behind one method on the first object.
- **Middle Man**: a class or function that mostly just delegates onward. → cut it, call the real target direct.
- **Refused Bequest**: a subclass or implementer that ignores or overrides most of what it inherits. → drop the inheritance, use composition.

### 4. Dispatch independent reviewers

Use the current harness's dispatch capabilities to start Standards and Spec together in parallel whenever possible. Use foreground dispatch when supported. Start each reviewer in a fresh context and give it a working directory and a self-contained review packet for its assigned axis.

Prefer the predefined `reviewer`. If none is available, select a model and reasoning effort appropriate for this review.

Each packet tells the reviewer to cover only its assigned axis, inspect the workspace evidence independently, and return a report directly. Reviewers must not invoke `code-review`, dispatch further agents, or aggregate findings.

Determine tool availability from the declarations and actual call results. If dispatch is unavailable or fails, report the specific missing capability or original error and the incomplete stage. An inline review by the primary agent does not count as independent. If concurrency capacity is insufficient, let an existing reviewer finish before dispatching the remaining reviewer in a fresh context.

#### Standards review packet

- The full diff command and commit list.
- The standards files found in step 3 and the full smell baseline from that step.
- Report each documented standards violation with its file or hunk and the rule it violates. For each baseline smell, name it and quote the hunk. Distinguish hard violations from judgement calls. Baseline smells are always judgement calls, and a documented repo standard overrides the baseline. Skip anything tooling enforces. Under 400 words.

#### Spec review packet

- The diff command and commit list.
- The path or fetched contents of the spec.
- Report missing or partial requirements, changes outside the spec, and requirements that appear implemented incorrectly. Quote the spec line for each finding. Under 400 words.

If the user confirmed there is no spec in step 2, dispatch only Standards.

### 5. Aggregate

Wait for every required reviewer to finish or explicitly fail. Present each report verbatim or lightly edited under `## Standards` and `## Spec`. Mark missing or failed axes as incomplete and give the reason. Mark Spec as skipped when the user confirmed there is no spec.

Keep findings in their original axes. End with the finding count and worst issue, if any, for each completed axis.
