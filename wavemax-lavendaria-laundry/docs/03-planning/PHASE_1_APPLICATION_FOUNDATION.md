# Phase 1 — Application and Access Foundation

## Control

- Revision: 2
- Status: ACCEPTED
- Approved scope revision: 1
- Approved by/date: owner, 2026-09-14 (`start building where you left from`)
- Repair attempt limit: 3

## Objective

- User outcome: provide a production-shaped, data-free Wavemax application foundation with distinct owner and manager experiences.
- Requirements: REQ-001–REQ-006, REQ-015–REQ-017, NFR-001, NFR-005, NFR-006, NFR-008, NFR-009.

## Scope

- In scope: React/TypeScript web shell, Node/TypeScript API shell, versioned contracts, database access schema, Clerk-compatible authentication boundary, application-owned authorization, role-correct navigation, empty/loading/error/configuration states, and automated access tests.
- Out of scope: vendor API calls, ingestion, customer/order/workforce records, analytics calculations, forecasting, file upload, recommendations, and fabricated business data.
- Deferred: live Clerk, Neon, WDF, and LaundroPortal credentials; live deployment; production object storage.

## Data and authorization contract

- One configured store; no store switcher or multi-store route.
- Roles are `OWNER` and `MANAGER`.
- Owner navigation: Command Center, Orders, Business Analytics/Finance, Workforce Management, Data Sources.
- Manager navigation: Command Center, Orders, Workforce Management. Analytics/Finance and Data Sources are denied by the API, not merely hidden.
- Manager workforce scope is derived from owner-controlled, effective-dated primary-manager assignments.
- No business values are embedded in frontend source, test fixtures, or API responses.
- Clerk verifies identity; Wavemax database records determine application role and row scope.

## Tasks

| ID | Task | Requirement | Expected components | Verification | Status |
|---|---|---|---|---|---|
| P01-T001 | Establish workspace and dependency boundaries | REQ-001, NFR-008, NFR-009 | Root workspace, web, API, contracts, database | Build and boundary review | COMPLETE |
| P01-T002 | Create authentication/session boundary | REQ-002, REQ-003 | Clerk adapter, local UI-review adapter, session contract | Unit and configuration tests | COMPLETE |
| P01-T003 | Enforce owner/manager access | REQ-003–REQ-006, NFR-001 | API policy and scoped repository contracts | Allow/deny tests | COMPLETE |
| P01-T004 | Build role-correct React shell | REQ-001–REQ-003, REQ-015–REQ-017 | Navigation and data-free pages | Component, keyboard, responsive visual checks | COMPLETE |
| P01-T005 | Verify and document execution | All phase requirements | CI scripts, README, evidence | Full applicable checks | COMPLETE |
| P01-R001 | Repair missing shared landing page and rejected color treatment | DEC-003, DEC-008, DEC-021, DEC-022 | Role-correct Command Center launch cards and Omrix-aligned light visual tokens | Component tests and owner/manager rendered inspection | COMPLETE |

## Acceptance criteria

1. The application starts through documented commands and contains separate web and API packages.
2. Production mode requires an external verified identity; no built-in production bypass exists.
3. Owner and manager navigation matches the approved product areas.
4. Manager requests for Analytics/Finance, Data Sources, or another manager’s workforce are rejected server-side and tested.
5. The interface contains no recommendations feature and no fabricated business record or metric.
6. Missing credentials, loading, empty, unauthorized, and service-error states are explicit.
7. Type checking, tests, builds, formatting checks, dependency-boundary review, and responsive visual inspection pass.
8. Command Center is the first owner and manager workspace; it exposes only role-authorized, clickable product areas and contains no fabricated business values.
9. The application shell follows the approved Omrix light-neutral, black, blue-accent, and pastel-card visual language.

## Verification and rollback

- Unit: navigation policy, access policy, configuration parsing, and frontend role rendering.
- Integration/API: authenticated allow/deny routes with injected identity and repository boundaries; no live vendor data.
- Data reconciliation: not applicable; no business records are processed.
- End-to-end: local development role-preview journeys only; production authentication remains credential-gated.
- Visual/accessibility: keyboard navigation and normal/narrow/wide rendered inspection.
- Security/privacy: no sensitive fixtures; production build cannot enable the local role-preview adapter.
- Rollback: Phase 1 files are isolated by package and may be reverted without touching supplied source files.

## Human gate

- `APPROVED_IN_PROGRESS -> READY_FOR_REVIEW`: agent after acceptance evidence is complete.
- `READY_FOR_REVIEW -> ACCEPTED`: owner only.

## Acceptance

- Accepted by/date: owner, 2026-09-14 (`lets move to next phase`).
