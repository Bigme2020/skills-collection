---
name: documenting-code-comments
description: Standards for deciding when code should stay self-documenting and when it still needs comments or docstrings. Use this whenever writing or changing code, not just when the user asks for documentation. This includes implementing features, fixing bugs, refactoring, changing public APIs, touching files that already contain comments, or modifying non-obvious business logic, edge cases, workarounds, and compatibility code. Use it to prevent three common failures: skipping needed function docstrings, leaving stale comments behind after code changes, and shipping complex logic with no explanation of why it works this way. Treat comment review as part of the implementation workflow, not optional cleanup.
---

# Code Comment Guidelines

## Required Workflow

When this skill is active, comment quality is part of the core task. Do not treat it as optional cleanup after the code change.

The goal is not to maximize comment count. The goal is to leave future readers with the context they cannot reliably recover from code alone. If that context exists, add or update the comment instead of silently hoping the code is obvious enough.

This skill exists because models often over-index on "self-documenting code" and under-deliver on actual comments. Do not default to zero comments just because the code looks readable after refactoring. If you touched non-trivial behavior, you must actively check whether a docstring or a short why-comment is now required.

For every file you touch, follow this sequence:

1. **Inspect existing comments and docstrings first** so you understand the local context before editing code.
2. **Refactor for clarity before adding comments** using naming, extraction, types, and structure.
3. **Preserve useful existing comments during changes** and update them if the behavior or rationale changed.
4. **Decide whether each touched function, module, class, or complex block needs documentation** based on whether the contract, constraints, or behavior are obvious from the signature and structure alone.
5. **Add comments where future readers need hidden context** such as why, constraints, edge cases, workarounds, business rules, external references, or non-obvious return semantics.
6. **Force a written decision for each touched file**: either add/update at least one useful comment or docstring, or consciously conclude that no hidden context remains after review.
7. **Run a final comment audit before finishing**: every touched comment should still be accurate, useful, and aligned with the final code.

Use these questions to keep the skill in your working memory while coding:

- What comments or docstrings already exist in the code I am changing?
- Will this edit make any surrounding comment stale or misleading?
- Did I touch any public API or exported symbol that now needs a docstring or contract note?
- Did I add or modify a complex private function that would be hard to understand without a short why comment?
- Did I add or modify any non-obvious block that deserves an inline comment even if the function itself stays undocumented?
- Can I make the code self-documenting instead of adding explanation?
- Is there any non-obvious why, constraint, gotcha, or external dependency that now needs a comment?
- If I touched a public API, does its docstring or contract documentation still match reality?

If you did not ask these questions while editing, you are probably not actually following the skill yet.

When reporting your work, briefly mention the documentation outcome for touched files: added or updated docstrings, refreshed stale comments, added rationale where needed, or intentionally left comments unchanged because the code is self-documenting. This is mandatory whenever this skill was active.

## Default Bias

When you are unsure, prefer adding one short useful comment over adding none.

Good default targets for that comment:

- A touched exported/public function whose contract is not obvious from the signature
- A touched private helper with branching, edge cases, or a hidden invariant
- A touched code block that exists because of ordering, data shape quirks, migration constraints, or external API behavior

Do not turn this into comment spam. The point is to defeat the common failure mode where the model writes zero comments after claiming it considered them.

## Minimum Documentation Expectations

Use the following defaults unless the local codebase has a stronger or conflicting convention.

### Public APIs and exported symbols

Check every touched public API, exported function, exported class, or module-level entry point.

It usually needs a docstring when at least one of these is true:

- The behavior is not fully obvious from the name and signature
- The return value has non-obvious semantics such as `null` vs `undefined`, partial results, fallback behavior, or mutation
- The function can throw, retries, short-circuits, caches, or has ordering, timing, or idempotency constraints
- The function exists to enforce a business rule, policy, or external contract

If none of those are true and the local project normally avoids docstrings for simple APIs, keep the code lean. But do not stop at that sentence as an excuse: still check whether nearby logic, return semantics, or usage constraints need a short comment instead.

### Complex private functions

Private functions do not need routine commentary, but they should not become black boxes.

Add a short function-level note or nearby why comment when a private function:

- Encodes a non-obvious business rule
- Has tricky branching or edge-case handling
- Depends on external quirks, migration constraints, or compatibility workarounds
- Uses a performance tradeoff that would look strange without context

Prefer a short rationale over a bulky docstring when that is enough.

If you edited a private function with tricky branching and still left no docstring and no nearby why-comment, you should be able to explain exactly why hidden context was not needed.

### Modules, classes, and files with existing comments

If you touch a file that already contains comments or docstrings, assume they need review. Existing comments are part of the code contract, not decoration.

### Workarounds and sharp edges

Leave a comment when code exists because of a browser bug, API inconsistency, legacy migration, data quirk, performance constraint, or ordering requirement. Future readers should not need to rediscover that history from scratch.

## Core Philosophy

**The best comment is the one you didn't need to write.**

Self-documenting code reduces maintenance burden and prevents comment drift. Studies show clear naming and structure can reduce onboarding time by up to 30%.

Do not misread this as "default to no comments." It means refactor obvious code to be clearer first, then write the smallest useful comment or docstring for the context that still remains hidden.

In practice, this skill should increase comment attention, not merely preserve the status quo.

### Writing Style Guidelines

**Tone:** Be direct, practical, and clear. Write in a natural and relaxed tone. Be approachable and down-to-earth with some personality, but light on the slang and excessive casual terms.

**Avoid**:

<AVOID>
- Corporate buzzwords and marketing speak
- AI-sounding language or excessive enthusiasm
- Overly formal/boring documentation style
- Dramatic hyperbole about revolutionary solutions
- Em dashes (—)
- Emojis
- Sycophancy
</AVOID>

### Hierarchy of Documentation

1. **Make code self-documenting** (naming, structure, types)
2. **Use type systems** to document contracts
3. **Use regular comments for WHY, not to restate WHAT**; use docstrings when readers need contract, behavior, return, or constraint details that are not obvious from the signature alone

---

## Refactoring: Preserve Existing Comments

**This skill's guidance applies to writing new code. When refactoring existing code, preserve comments.**

Existing comments represent institutional knowledge. Someone wrote them for a reason. During refactoring:

Changing behavior without checking nearby comments is incomplete work. If you touched the logic, you touched the burden of keeping its surrounding documentation true.

### Never Remove

- Comments explaining WHY something exists
- Comments warning about gotchas or edge cases
- Comments referencing external context (tickets, specs, RFCs)
- Comments documenting non-obvious business logic

### Update When Necessary

- If refactoring changes behavior the comment describes, update the comment
- If refactoring makes a workaround obsolete, update or remove with the workaround
- Add to existing comments if refactoring introduces new context

### Only Remove When

- The comment is demonstrably incorrect (doesn't match code behavior)
- The comment documents code you're deleting entirely
- The refactoring eliminates the "why" (e.g., removing a workaround makes its explanation obsolete)

## Comment Drift Prevention

For every touched file, run this quick check before finishing:

1. What comments or docstrings were already here?
2. Which of them describe code I just changed?
3. Are they still true word for word?
4. If not, should I update, remove, or expand them?

If the answer is "I changed the code but did not inspect the nearby comments," the task is not done yet.

```
// BAD: Stripping context during refactoring
// Before: // Retry 3x - payment gateway has transient failures (JIRA-892)
// After:  (comment removed, code unchanged)

// GOOD: Preserving context during refactoring
// Before: // Retry 3x - payment gateway has transient failures (JIRA-892)
// After:  // Retry 3x - payment gateway has transient failures (JIRA-892)

// GOOD: Updating comment when refactoring changes behavior
// Before: // Retry 3x - payment gateway has transient failures
// After:  // Retry with exponential backoff - payment gateway has transient failures
```

---

## When NOT to Write Comments

### Never Comment the Obvious

```
// ❌ BAD: Restates code
const name = user.name; // Get the user's name
items.forEach(item => process(item)); // Loop through items

// ✅ GOOD: Self-documenting
const userName = user.name;
items.forEach(processItem);
```

### Never Duplicate Type Information

```
// ❌ BAD: Types already document this
/** @param {string} email - The email string to validate */
function validateEmail(email: string): boolean {}

// ✅ GOOD: Types speak for themselves
function validateEmail(email: string): boolean {}
```

### Never Leave Stale Comments

```
// ❌ BAD: Comment doesn't match code
// Returns user's full name
const getEmail = () => user.email;

// ✅ GOOD: Remove or fix
const getEmail = () => user.email;
```

---

## When TO Write Comments

### 1. Explain WHY, Not WHAT

```
// ✅ Explains reasoning
// Use exponential backoff - service rate-limits after 3 rapid failures
const backoffMs = Math.pow(2, attempts) * 1000;

// ✅ Documents constraint
// Must run before useEffect to prevent hydration mismatch
useLayoutEffect(() => initTheme(), []);
```

### 2. Warn About Gotchas and Edge Cases

```
// ✅ Critical warning
// IMPORTANT: Assumes UTC - local timezone causes date drift
const dayStart = new Date(date.setHours(0, 0, 0, 0));

// ✅ Non-obvious behavior
// Returns null for deleted users (not undefined) - check explicitly
const user = await getUser(id);
```

### 3. Reference External Context

```
// ✅ Links to ticket
// Workaround for Safari flexbox bug (JIRA-1234)
display: '-webkit-flex';

// ✅ References specification
// Per RFC 7231 §6.5.4, return 404 for missing resources
return res.status(404);
```

### 4. Document Performance Decisions

```
// ✅ Explains optimization with data
// Map for O(1) lookup - benchmarked 3x faster than array.find() at n>100
const userMap = new Map(users.map(u => [u.id, u]));
```

### 5. Complex Business Logic

```
// ✅ Documents business rule
// Discount applies only to orders >$100 AND first-time customers
if (orderTotal > 100 && customer.orderCount === 0) {
```

---

## Comment Formatting Standards

### Single-line Comments

```
// Sentence case, no period for fragments
// Full sentences get periods.
```

### JSDoc/TSDoc for Public APIs

Use JSDoc or TSDoc for touched public APIs when behavior is not obvious from the signature alone, especially for contracts, thrown errors, edge-case returns, or important constraints.

```typescript
/**
Validates email format and checks domain blacklist.
  @throws {ValidationError} If format invalid or domain blacklisted
  @example
    validateEmail('user@example.com'); // OK
    validateEmail('spam@blocked.com'); // throws
*/
function validateEmail(email: string): void {}
```

### TODO Format

```
// ✅ GOOD: Actionable with ticket
// TODO(JIRA-567): Replace with batch API when available Q1 2025

// ❌ BAD: No context
// TODO: fix this later
```

---

## Refactor Before Commenting

| Instead of commenting...      | Refactor to...                                      |
| ----------------------------- | --------------------------------------------------- |
| `// Get active users`         | `const activeUsers = users.filter(u => u.isActive)` |
| `// Check if admin`           | `const isAdmin = user.role === 'admin'`             |
| `// 86400000 ms = 1 day`      | `const ONE_DAY_MS = 24 * 60 * 60 * 1000`            |
| `// Handle error case`        | Extract to `handleAuthError(err)` function          |
| `// Calculate total with tax` | `const totalWithTax = calculateTotalWithTax(items)` |

---

## Audit Checklist

When reviewing code comments:

1. **Necessity**: For new code, can it be self-documenting? For existing code, is this comment still accurate? If accurate, keep it.
2. **Accuracy**: Does comment match current code behavior?
3. **Value**: Does it explain WHY, not WHAT?
4. **Freshness**: Is it still relevant?
5. **Actionability**: If TODO, does it have a ticket reference?

---

## Language-Specific Patterns

### TypeScript/JavaScript

- Prefer TypeScript types over JSDoc type annotations
- Use `@deprecated` JSDoc tag for deprecated APIs
- Document thrown errors in JSDoc when not obvious

### Go

- Follow effective Go: first sentence is function name + verb
- Document exported functions, unexported can be brief
- Use `// Deprecated:` comment prefix

### Python

- Prefer docstrings for touched modules, classes, and public functions when the project convention expects them or the contract is not obvious
- Keep simple functions lean when the code and type hints already make the behavior clear
- Follow Google or NumPy docstring format consistently when the project already uses one
- Type hints reduce need for repetitive parameter documentation

## Final Comment Audit

Before you finish, explicitly verify:

1. Public APIs I touched still have adequate contract documentation
2. Existing comments near changed logic are still accurate
3. Complex rules, workarounds, or gotchas now have enough rationale
4. New comments explain why, constraints, or edge cases instead of restating the code
5. I did not use "the code is readable" as a blanket reason to avoid all documentation work
6. For each touched file, I can point to either a comment/docstring change or a conscious decision that no hidden context remained

In your final handoff, briefly state which of these happened:

- Added or updated docstrings for touched APIs
- Updated stale comments after changing behavior
- Added rationale comments for tricky logic or constraints
- Intentionally left comments unchanged because the code is clear and no hidden context remained

If the final handoff does not mention the documentation outcome, treat that as a workflow miss and fix it before finishing.
