---
name: ui-review
description: Independently review UI changes for project compatibility, correctness, and unintended effects.
---

# UI Review

The calling agent establishes scope, dispatches one independent read-only reviewer, and returns its findings.

## 1. Establish scope

Identify the baseline and reviewed source revision, including working-tree changes. Locate applicable project instructions, UI requirements, and existing check and visual evidence.

## 2. Review independently

Use the configured `reviewer` agent with a fresh context. Provide the scope, source location, baseline, requirements, and evidence pointers. The reviewer reads the diff and related components, styles, and callers as needed, assessing:

- Project fit: supported environments, component contracts, and conventions.
- Correctness: structure, styles, assets, and presentation behavior.
- Impact: unintended effects on shared code and existing consumers.

The reviewer reuses applicable evidence and investigates concrete uncertainties. Findings identify actionable defects with a source location, triggering condition, consequence, and supporting requirement or technical basis. Its task is read-only review, not dispatching further reviews.

## 3. Report

Collect the independent result and return the reviewed revision and scope, findings ordered by severity, and material verification limits. State when no actionable defects were found; report unavailable independent review as incomplete.

For fixes, independently review the changes and affected relationships, reusing valid prior evidence.
