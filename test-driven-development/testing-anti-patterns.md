# Testing Anti-Patterns (High-Attention)

Load this file when writing tests, adding mocks, or considering test-only production APIs.

## Non-Negotiable Rules

```text
1) Never assert mock existence as product behavior.
2) Never add production methods used only by tests.
3) Never mock before mapping dependency side effects.
4) Never ship partial schema mocks when full schema is known.
```

If any rule is violated, stop and return to RED in TDD.

## 10-Second Mock Gate

Before any `mock(...)`, answer all three:

1. What real side effects does this dependency produce?
2. Which side effects does this test rely on?
3. Why is this mock level the narrowest safe level?

If any answer is unknown: do not mock yet.

## Anti-Pattern A: Testing Mock Behavior

Bad:

```typescript
test('renders sidebar', () => {
  render(<Page />);
  expect(screen.getByTestId('sidebar-mock')).toBeInTheDocument();
});
```

Why wrong:

- Asserts that the fake exists, not that user-visible behavior works.
- Creates false confidence when real component integration is broken.

Good:

```typescript
test('shows navigation', () => {
  render(<Page />);
  expect(screen.getByRole('navigation')).toBeInTheDocument();
});
```

Gate:

```text
If assertion target contains "mock" or synthetic test ids, reject and rewrite.
```

## Anti-Pattern B: Test-Only Production Methods

Bad:

```typescript
class Session {
  async destroy() { /* used only in tests */ }
}
```

Why wrong:

- Pollutes production API.
- Blurs ownership of resource lifecycle.

Good:

```typescript
// test-utils/cleanupSession.ts
export async function cleanupSession(session: Session) {
  // test-only cleanup here
}
```

Gate:

```text
If a new production method has no production caller, block it.
Move it to test utilities.
```

## Anti-Pattern C: Mocking at the Wrong Layer

Bad:

```typescript
// Mocking a high-level method that writes config,
// while the test depends on config being written.
```

Why wrong:

- Removes the very behavior being tested.
- Causes pass/fail for the wrong reason.

Good strategy:

- Keep the behavior-under-test path real.
- Mock only slow/external boundaries (network, process, clock, random).

Gate:

```text
Mock the lowest external boundary possible.
Never mock the method whose side effect is part of the assertion.
```

## Anti-Pattern D: Partial Schema Mocks

Bad:

```typescript
const resp = { status: 'ok', data: { id: '1' } }; // missing metadata fields
```

Why wrong:

- Omits downstream-consumed fields.
- Lets tests pass while integration fails.

Good:

```typescript
const resp = {
  status: 'ok',
  data: { id: '1' },
  metadata: { requestId: 'req-1', timestamp: 1 },
};
```

Gate:

```text
If API/schema is known, mock must mirror full structure.
Unknown schema -> fetch docs/examples first.
```

## Anti-Pattern E: Tests as Afterthought

Bad sequence:

```text
Implement -> "ready for testing"
```

Required sequence:

```text
RED -> GREEN -> REFACTOR
```

Gate:

```text
If implementation exists without prior failing-test evidence, treat as violation.
```

## Fast Decision Tree

```text
Need isolation?
  |- No -> do not mock.
  |- Yes -> Do I know side effects?
            |- No -> inspect real behavior first.
            |- Yes -> mock lowest external boundary only.
```

## Red Flags (Immediate Stop)

- Assertions on `*-mock` nodes or mock-only test ids.
- Mock setup longer than the behavior assertions.
- "Mocking to be safe" without side-effect mapping.
- Production API added and referenced only by tests.
- Cannot explain why this dependency is mocked.

## Review Checklist

- [ ] Assertion verifies user-visible or domain-visible behavior.
- [ ] No test-only methods were added to production code.
- [ ] Mock level is minimal and justified.
- [ ] Mock data mirrors real schema (or schema was fetched first).
- [ ] Test remains meaningful if mock implementation changes internally.

## Bottom Line

Mocks are isolation tools, not the target of truth.

When uncertain, prefer fewer mocks and more real behavior checks.
