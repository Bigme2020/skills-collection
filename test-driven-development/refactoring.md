# Refactor Candidates

After the TDD cycle is GREEN, look for:

- Duplication -> extract function/class
- Long methods -> break into private helpers while keeping tests on public interface
- Feature envy -> move logic to where data lives
- Primitive obsession -> introduce value objects
- Existing code the new code reveals as problematic
- Responsibility, dependency-direction, module-boundary, abstraction, or deep-module questions -> invoke the `solid` skill

Never refactor while RED. Get to GREEN first, then refactor in small steps with tests after each step.
