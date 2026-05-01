# Deep Modules

From "A Philosophy of Software Design":

**Deep module** = small interface + substantial implementation hidden behind it.

```text
+---------------------+
|   Small Interface   |  <- Few methods, simple params
+---------------------+
|                     |
|  Deep Implementation|  <- Complex logic hidden
|                     |
+---------------------+
```

**Shallow module** = large interface + little implementation. Avoid it.

```text
+-----------------------------+
|       Large Interface       |  <- Many methods, complex params
+-----------------------------+
|     Thin Implementation     |  <- Mostly passes through
+-----------------------------+
```

## How This Connects to SOLID

- SRP: a deep module usually has one cohesive reason to change.
- ISP: a deep module keeps its public interface small and role-focused.
- DIP: a deep module hides concrete details behind stable abstractions.
- OCP: a deep module can often absorb new implementation detail without changing callers.

## Detection Questions

Ask these when designing or refactoring module boundaries:

- Can I reduce the number of public methods?
- Can I simplify the parameters?
- Can I hide more complexity inside?
- Are callers coordinating details that should belong inside this module?
- Would adding a new behavior require changing many callers?

## Refactoring Direction

- Move orchestration currently duplicated by callers behind the module boundary.
- Replace many narrowly-scoped methods with fewer capability-oriented methods.
- Keep the interface stable while changing internals.
- Avoid hiding unrelated responsibilities together; deep is cohesive, not bloated.
