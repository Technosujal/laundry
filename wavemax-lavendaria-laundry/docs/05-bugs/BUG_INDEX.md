# Bug Index

Search this index before investigating a failure. Similar symptoms do not prove the same root cause.

| ID | Title | Fingerprint | Severity | Status | Root-cause class | Regression protection | Record |
|---|---|---|---|---|---|---|---|
| BUG-001 | Command Center rendered an empty state instead of the approved role landing page | Login/default hash reached `WorkspacePage`, which returned `EmptyPanel`; shell used an unapproved dark-green palette | HIGH | RESOLVED | Missing acceptance contract | Owner/manager launch-card tests and rendered review | [BUG-001](BUG-001-MISSING-ROLE-LANDING.md) |
| BUG-002 | Source-derived analytics artifact is copied into the unauthenticated production web bundle | `apps/web/public/analytics-artifact.json` is copied by Vite into `dist` and contains order/customer/employee details | CRITICAL | NEW | Preview data crossed the deployment boundary | Release build must assert no business artifact or personal record exists in public assets | Pending |

Statuses: `NEW`, `REPRODUCED`, `DIAGNOSING`, `FIX_IN_PROGRESS`, `VERIFYING`, `RESOLVED`, `BLOCKED`, `REOPENED`.
