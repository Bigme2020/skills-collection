---
name: verification-before-completion
description: Use when about to claim work is complete, fixed, or passing, before committing, or before creating a PR. Requires fresh verification evidence for every success claim, not assumptions. For browser-visible work such as pages, components, interactions, visual states, or UI bug fixes, this skill must also trigger `playwright-interactive` as part of final verification so rendering, console health, and key user flows are confirmed before any completion claim.
---

# Verification Before Completion

## Overview

Claiming work is complete without verification is dishonesty, not efficiency.

**Core principle:** Evidence before claims, always.

**Violating the letter of this rule is violating the spirit of this rule.**

## The Iron Law

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

If you haven't run the verification command in this message, you cannot claim it passes.

## The Gate Function

```
BEFORE claiming any status or expressing satisfaction:

1. IDENTIFY: What evidence proves this claim?
2. CHECK SCOPE: Does the work affect anything a user sees or does in the browser?
3. RUN:
   - If NO: execute the full verification commands
   - If YES: execute the full verification commands AND invoke `playwright-interactive`
4. READ:
   - command output, exit codes, failures
   - browser evidence: rendering, console, interactions, visible states
5. VERIFY: Does the evidence confirm the claim?
   - If NO: State actual status with evidence
   - If YES: State claim WITH evidence
6. ONLY THEN: Make the claim

Skip any step = lying, not verifying
```

## Browser-Visible Work Requires Browser Evidence

If the work changes anything a user can see or do in the browser, terminal-only verification is insufficient.

Treat all of the following as browser-visible work:

- Pages, routes, layouts, styles, responsiveness, or visual states
- Components that render in the browser
- Forms, dialogs, menus, tabs, navigation, or other interactions
- Client-side data fetching, loading states, validation, or error states
- Any bug fix where the symptom is observed in the page rather than only in logs or tests

For this class of work, you must invoke `playwright-interactive` before claiming completion. Do not wait for the very end and then skip it because the task looks small.

## Required Browser Evidence

For browser-visible work, collect fresh evidence that the relevant page or flow actually works:

- The page opens and renders the expected content
- There is no white screen, missing content, or obviously broken layout
- The browser console shows no relevant errors blocking the flow
- The targeted interaction or user path works end to end
- The visible result matches the requirement after the interaction completes

If the task is about a specific fix, verify the original symptom is gone in the browser, not just that tests or builds pass.

## Failure Loop For UI Work

If `playwright-interactive` finds a rendering issue, console error, interaction failure, or wrong visible result, the task is not complete.

Stay in the fix-and-reverify loop:

1. Fix the specific issue the browser evidence exposed.
2. Re-run the relevant verification commands.
3. Re-run `playwright-interactive` on the affected page or flow.
4. Continue until the browser evidence passes.

Do not treat build success, test success, or code inspection as a substitute for browser validation when the requirement is visible in the page.

## When Browser Verification Cannot Run

If browser-visible work requires `playwright-interactive` but you cannot run it yet, do not claim completion.

Examples of valid blockers:

- The local app will not start or stay up
- Required credentials, seed data, or environment variables are missing
- The target route or flow is inaccessible in the current environment
- Browser automation itself is blocked by the environment

In this case, report the real status plainly:

- What browser evidence is still missing
- Why it could not be collected
- What specific blocker must be resolved next

"Blocked pending browser verification" is honest. "Done except for Playwright" is not.

## Common Failures

| Claim | Requires | Not Sufficient |
|-------|----------|----------------|
| Tests pass | Test command output: 0 failures | Previous run, "should pass" |
| Linter clean | Linter output: 0 errors | Partial check, extrapolation |
| Build succeeds | Build command: exit 0 | Linter passing, logs look good |
| Bug fixed | Test original symptom: passes | Code changed, assumed fixed |
| Regression test works | Red-green cycle verified | Test passes once |
| UI works / page fixed | Fresh `playwright-interactive` browser evidence plus relevant test/build output | Build passes, code inspection, old screenshots, "looks correct" |
| Agent completed | VCS diff shows changes | Agent reports "success" |
| Requirements met | Line-by-line checklist | Tests passing |

## Red Flags - STOP

- Using "should", "probably", "seems to"
- Expressing satisfaction before verification ("Great!", "Perfect!", "Done!", etc.)
- About to commit/push/PR without verification
- About to claim a UI change is complete without browser verification
- Trusting agent success reports
- Relying on partial verification
- Treating build or test success as proof that the page renders correctly
- Seeing browser errors or broken rendering and still trying to conclude the task
- Thinking "just this once"
- Tired and wanting work over
- **ANY wording implying success without having run verification**

## Rationalization Prevention

| Excuse | Reality |
|--------|---------|
| "Should work now" | RUN the verification |
| "I'm confident" | Confidence ≠ evidence |
| "Just this once" | No exceptions |
| "Linter passed" | Linter ≠ compiler |
| "Agent said success" | Verify independently |
| "The page change was small" | Small UI changes still need browser evidence |
| "The build passed so the UI is fine" | Passing build ≠ correct rendering or interaction |
| "I'm tired" | Exhaustion ≠ excuse |
| "Partial check is enough" | Partial proves nothing |
| "Different words so rule doesn't apply" | Spirit over letter |

## Key Patterns

**Tests:**
```
✅ [Run test command] [See: 34/34 pass] "All tests pass"
❌ "Should pass now" / "Looks correct"
```

**Regression tests (TDD Red-Green):**
```
✅ Write → Run (pass) → Revert fix → Run (MUST FAIL) → Restore → Run (pass)
❌ "I've written a regression test" (without red-green verification)
```

**Build:**
```
✅ [Run build] [See: exit 0] "Build passes"
❌ "Linter passed" (linter doesn't check compilation)
```

**Browser-visible work:**
```
✅ [Run tests/build as relevant; if using Playwright test runner, use `--reporter=line`] + [Invoke playwright-interactive] + [Confirm rendering, console, and interaction evidence] "The page change passes verification"
❌ "Build passed so the page should be fine" / "Looks correct from the code"
```

**Browser-visible work with blocker:**
```
✅ [Try to run the app or target flow] + [Identify the blocker] + [State that browser evidence is still missing] "Blocked pending browser verification because <specific reason>"
❌ "Everything else passed so this is basically done"
```

**Requirements:**
```
✅ Re-read plan → Create checklist → Verify each → Report gaps or completion
❌ "Tests pass, phase complete"
```

**Agent delegation:**
```
✅ Agent reports success → Check VCS diff → Verify changes → Report actual state
❌ Trust agent report
```

## Why This Matters

From 24 failure memories:
- your human partner said "I don't believe you" - trust broken
- Undefined functions shipped - would crash
- Missing requirements shipped - incomplete features
- Time wasted on false completion → redirect → rework
- Violates: "Honesty is a core value. If you lie, you'll be replaced."

## When To Apply

**ALWAYS before:**
- ANY variation of success/completion claims
- ANY expression of satisfaction
- ANY positive statement about work state
- Committing, PR creation, task completion
- Moving to next task
- Delegating to agents

**ALWAYS additionally for browser-visible work:**
- Invoke `playwright-interactive` as part of final verification
- If running `playwright test`, use `--reporter=line` unless the user explicitly requests another reporter
- Use browser evidence to validate rendering, console health, and the key interaction path
- Stay in the fix-and-reverify loop until the visible behavior passes

**Rule applies to:**
- Exact phrases
- Paraphrases and synonyms
- Implications of success
- ANY communication suggesting completion/correctness

## The Bottom Line

**No shortcuts for verification.**

Run the command. Read the output. THEN claim the result.

This is non-negotiable.
