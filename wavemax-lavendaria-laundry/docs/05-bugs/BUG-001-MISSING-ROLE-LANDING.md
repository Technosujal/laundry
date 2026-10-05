# BUG-001 Missing role landing page

## Control

- Status: RESOLVED
- Severity: HIGH
- Affected requirement/task: DEC-003, DEC-008, P01-T004

## Locate

- Exact file/function/line: `apps/web/src/features/shell/AppShell.tsx`, `areaFromHash` and `AppShell`; `apps/web/src/features/shell/WorkspacePage.tsx`, `WorkspacePage`; `apps/web/src/styles/global.css`, root tokens and `.sidebar`.
- Trigger: an owner or manager signs in or opens the application without another hash route.
- Visible symptom: Command Center showed only a waiting-for-data panel and the shell used a dark-green visual treatment.

## Trace

- UI/event: login or initial application load.
- Route: `areaFromHash()` selected `command-center`.
- Shell: `AppShell()` passed that area to `WorkspacePage()`.
- Page: the prior `WorkspacePage()` content map returned `EmptyPanel` for Command Center.
- Result: both roles landed on a dead-end empty state instead of the requested module launcher.

## Explain and connect

- Root cause: Phase 1 acceptance tested role-correct navigation and empty states but did not encode the supplied landing-page structure or visual tokens as acceptance requirements.
- Why it fails: the default route had no dedicated component and therefore fell through to the generic no-data presentation.
- Side effects and cascading impact: first-use navigation was unclear, the manager/owner split was not visible on entry, and the unapproved green treatment contradicted the design authority.
- Data/security impact: no data was lost or exposed; the repair retains owner-only analytics restrictions.

## Evidence and attempts

- Reproduction: open `/#command-center` as either local preview role before the repair.
- Logs/traces/screenshots: the repaired owner and manager renders are retained under `.agent-system/` for local review.
- Failed test: no landing-page assertion existed before the repair.

## Fix and prevent

- Smallest safe change: add `CommandCenterHome`, route the default Command Center to it, define role-visible launch modules, and replace green shell tokens with the approved Omrix light/blue/pastel system.
- Why it fixes the cause: the default route now has a concrete role-aware destination and the approved design choices are expressed in code.
- Regression test: `AppShell.test.tsx` asserts owner cards, manager exclusions, Inventory routing, restricted-route fallback, and the role dashboard heading.
- Stronger constraint/check: PR-011 requires explicit visual-reference acceptance checks and rendered inspection.

## Verification and closure

- Commands/results: web component tests, TypeScript check, production build, lint, and format check pass.
- Visual/adjacent checks: owner and manager desktop dashboards were rendered; manager finance and analytics cards are absent.
- Remaining limitation: cards lead to intentionally data-free feature pages until each later phase approves its business logic and source data.
- Resolved date/commit: 2026-09-14; working tree, not committed.
