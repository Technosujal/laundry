# Phase 0 — Source and Contract Verification

## Control

- Revision: 1
- Status: APPROVED_IN_PROGRESS
- Approved scope revision: 1
- Approved by/date: owner, 2026-09-14
- Repair attempt limit: 3

## Objective

- User outcome: establish what the supplied WDF and Laundro files can prove before any product logic or dashboard number is built.
- Requirements: REQ-001, REQ-007–REQ-015, REQ-018–REQ-024, NFR-002–NFR-005, NFR-007.

## Scope

- In scope: read-only inventory, fingerprints, structural profiling, coverage checks, privacy-safe quality findings, candidate source mappings, API-contract questions, and architecture/phase recommendations.
- Out of scope: application code, database creation, source mutation, production ingestion, UI changes, fabricated records, and publishing unapproved metrics.
- Deferred: credentials, live API calls, authentication selection, production retention policy, direct-report configuration, and forecasting method.

## Data and authorization contract

- Source fields and lineage: current files are immutable POC evidence with unknown completeness; production field contracts must be confirmed against the two vendor APIs.
- Data-quality rules: retain every raw row, distinguish report totals from detail rows, distinguish preview exports from complete exports, quarantine rather than delete, and reconcile before publication.
- Role allow/deny matrix: not exercised during read-only profiling; future operational and analytical access remains owner/manager scoped.
- Personal-data handling: profiling may inspect sensitive fields locally, but documentation and logs contain only schemas, counts, ratios, date ranges, aggregates, and redacted identifiers.

## Tasks

| ID | Task | Requirement | Expected components | Verification | Status |
|---|---|---|---|---|---|
| P00-T001 | Inventory and fingerprint supplied source files | REQ-019 | Source manifest | SHA-256 generated without modifying inputs | COMPLETE |
| P00-T002 | Profile structure, coverage, dates, and row types | REQ-020 | Source audit | Reproducible aggregate checks | COMPLETE |
| P00-T003 | Identify safe joins, conflicts, and reconciliation boundaries | REQ-010, REQ-014, REQ-024 | Source mapping | Cross-source count and aggregate comparisons | IN_PROGRESS |
| P00-T004 | Confirm WDF and LaundroPortal/Laundrolux API field contracts | REQ-022, REQ-023 | API contracts | Official documentation plus credentialed sample responses | IDENTITY_COMPLETE_ACCESS_BLOCKED |
| P00-T005 | Approve architecture and Phase 1 contract | REQ-001–REQ-006 | Architecture decision and Phase 1 plan | Owner review | NOT_STARTED |

## Acceptance criteria

1. Every supplied business file has an immutable fingerprint and source classification.
2. Preview-only and incomplete reports are clearly marked and cannot be mistaken for full-year detail.
3. Each proposed dashboard domain is classified as supported, partially supported, or blocked.
4. Conflicting totals, repeated rows, invalid fields, and ambiguous semantics are recorded without deleting records.
5. The names and responsibilities of both production APIs are confirmed before connector implementation.
6. No raw personal data or credentials appear in Project Brain, logs, or Git.

## Verification and rollback

- Unit: not applicable; no application code is in scope.
- Integration/API: deferred until vendor access is supplied.
- Data reconciliation: aggregate and row-count checks recorded in `docs/02-research/PHASE_0_SOURCE_AUDIT.md`.
- End-to-end: not applicable.
- Visual/accessibility: not applicable.
- Security/privacy: outputs reviewed for customer, employee, account, card, and credential values.
- Rollback: documentation-only changes can be reverted independently; original inputs remain outside Git and unchanged.

## Completion evidence

- Commands and results: PowerShell file inventory/SHA-256, pandas/openpyxl structural profiling, and pypdf page/text verification completed locally on 2026-09-14.
- Visual evidence: not applicable.
- Reconciliation evidence: source audit.
- Requirements satisfied: pending Phase 0 completion.
- Bugs and limitations: current exports are a mixture of full reports, preview reports, converted report rows, and later snapshots.

## Human gate

- `APPROVED_IN_PROGRESS -> READY_FOR_REVIEW`: agent after all non-external tasks and evidence are complete.
- `READY_FOR_REVIEW -> ACCEPTED`: owner only.
