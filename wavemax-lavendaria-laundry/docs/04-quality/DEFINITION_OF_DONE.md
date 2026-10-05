# Definition of Done

A task is complete only when all applicable conditions pass:

- It links to an approved requirement and phase task.
- Acceptance criteria are observable and satisfied.
- The complete user path works, not merely one layer.
- Role permissions are tested for allowed and denied access.
- Source-data counts, quarantine counts, lineage, and reconciliations pass where data is affected.
- Dashboard, hover, drill-down, and export agree exactly where analytics is affected.
- Formatting, lint, types, unit, integration, contract, regression, and end-to-end checks pass as required.
- Loading, empty, error, disabled, permission, boundary, and recovery states are handled.
- UI changes were rendered and inspected at relevant widths with keyboard and accessibility checks.
- Logs explain failures without exposing personal information or secrets.
- The diff contains no unrelated changes or unexplained generated files.
- New files follow `docs/03-planning/REPOSITORY_STRUCTURE.md`; dependency boundaries and helper ownership are verified.
- Any refactoring is explicitly approved, behavior-preserving, separately explainable, and covered by relevant regression tests.
- Project Brain and verification evidence are current.
- Remaining limitations and risks are explicit.

Compilation, passing tests, or a rendered screen alone is insufficient. The approved product behavior must work end to end. A phase additionally requires owner acceptance.
