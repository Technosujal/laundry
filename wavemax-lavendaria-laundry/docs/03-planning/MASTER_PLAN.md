# Wavemax Master Plan

## Status

- Revision: 1
- Status: DRAFT
- Approved by: NONE
- Approval date: NONE

## Delivery strategy

Build vertical slices one at a time. Each slice begins with source and business definitions, then data-quality rules, storage, API authorization, UI behavior, drill-down/export, and end-to-end verification.

## Proposed phases

| Phase | Objective | Requirements | Status | Approval |
|---|---|---|---|---|
| Phase 0 | Complete source profiling, resolve blockers, and approve architecture/contracts | REQ-001–REQ-024 | IN_PROGRESS | OWNER, 2026-09-14 |
| Phase 1 | Establish React shell, authentication, roles, and owner/manager navigation | REQ-001–REQ-006, REQ-015–REQ-017 | ACCEPTED | OWNER, 2026-09-14 |
| Phase 2 | Ingest WDF order data with immutable inputs, validation, quarantine, lineage, and row accounting | REQ-019–REQ-021 | ACCEPTED | OWNER, 2026-09-14 |
| Phase 3 | Deliver order queue, individual order, customer context, and priority drill-down | REQ-005, REQ-007–REQ-009, REQ-014 | APPROVED_IN_PROGRESS | OWNER, 2026-09-14 |
| Phase 4 | Add one verified metric with calculation explanation, drill-down, and export | REQ-010–REQ-011 | PROPOSED | NONE |
| Phase 5 | Expand business analytics and period comparisons | REQ-010–REQ-013, REQ-024 | APPROVED_IN_PROGRESS | Owner, 2026-09-15 |
| Phase 6 | Add three-role workforce POC with employee self-service | REQ-004, REQ-006, REQ-018 | APPROVED_IN_PROGRESS | OWNER, 2026-09-20 |
| Phase 7 | Profile and integrate Laundro Portal machine/account/payment data | REQ-014, REQ-019–REQ-021 | PROPOSED | NONE |
| Phase 8 | Add approved forecasting and remaining operational modules | Future approved requirements | DEFERRED | NONE |

## Global gates

- No application code before explicit phase approval.
- No metric before its definition and source-quality rules are approved.
- No source publication without full row accounting and reconciliation evidence.
- No manager feature without cross-manager denial tests.
- No UI completion without rendered responsive and accessibility verification.
- No release with unresolved blocking data-integrity or authorization defects.

## Current next step

Phase 3 tasks P03-T001 through P03-T005 are complete. Finish P03-T006 after receiving the WDF API contract and credentials plus the approved production personal-data handling policy, then reconcile the complete queue and exact selected-order detail before requesting Phase 3 acceptance. Phase 4 metric work remains proposed and requires an approved first metric definition and quality gate.
