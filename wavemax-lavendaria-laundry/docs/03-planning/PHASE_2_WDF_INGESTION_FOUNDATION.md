# Phase 2 - WDF Ingestion Foundation

## Control

- Revision: 1
- Status: ACCEPTED
- Approved scope revision: 1
- Approved by/date: owner, 2026-09-14 (`lets move to next phase`)
- Repair attempt limit: 3

## Objective

- User outcome: prove that a real supplied WDF sales export can enter Wavemax without changing the original, losing a row, inventing a value, or becoming a misleading order dashboard.
- Requirements: REQ-019-REQ-022, NFR-002-NFR-005, NFR-008, NFR-009.

## Evidence boundary

- The current complete WDF evidence is the 2025 annual workbook Sales Breakdown sheet with 5,119 data rows.
- The supplied Order List contains only 30 displayed rows out of 4,319 reported orders and cannot populate a complete order queue.
- The WDF API contract and credentials have not been received. API pagination, change tracking, identifiers, reversals, and production completeness remain blocked.
- Phase 2 therefore implements a file-based POC ingestion path and a separate future connector boundary. It does not claim that the workbook schema is the API schema.

## Scope

- In scope: Python analytics-service foundation; streamed SHA-256 fingerprinting; content-addressed local POC source retention; workbook schema recognition; raw row capture; typed WDF sales-line parsing; validation; accepted/quarantined outcomes; full row accounting; idempotent run identity; privacy-safe stage logs; PostgreSQL ingestion/lineage schema; read-only execution against the supplied annual workbook; reproducible tests and reconciliation evidence.
- Out of scope: WDF API calls, uploads through the UI, Cloudflare R2 or another production object store, live Neon migration, order status/customer workflows, canonical order creation, dashboard metrics, LaundroPortal ingestion, cross-source reconciliation, forecasting, recommendations, and any fabricated application data.
- Deferred: production object-storage provider and retention controls; live database credentials; vendor API contract; authoritative store timezone.

## Data contract

- Source type: `wdf_annual_sales_xlsx`.
- Required sheet: `Sales Breakdown`.
- Required fields are matched by exact source header and retained with their original names in the immutable raw representation.
- A source data row is every worksheet row after the header, including blank, malformed, repeated, zero-value, and negative-value rows.
- Every source data row ends as `ACCEPTED` or `QUARANTINED`; warnings never remove a row.
- Exact repeated content is recorded as a warning and retained because no immutable WDF line-item identifier is present.
- Negative and zero monetary values are retained. They are not defects without an approved business rule.
- Typed money uses `Decimal` in Python and `numeric` in PostgreSQL; binary floating point is not persisted.
- File identity is content SHA-256. Reprocessing the same bytes reuses the file identity and deterministic row identities.
- No raw field value or customer/order identifier may appear in logs, test output, Project Brain, or Git.

## Local POC storage boundary

- Original source bytes may be copied only into the ignored `data/raw/` directory using a content-addressed filename.
- An existing content-addressed object is verified byte-for-byte by hash and never overwritten.
- Run summaries may be written under ignored `data/ingestion-runs/`; they contain counts, hashes, versions, durations, and reason totals but no raw rows.
- This local adapter is not the production storage decision. A future object-storage adapter must satisfy the same immutable interface.

## Tasks

| ID | Task | Requirement | Expected components | Verification | Status |
|---|---|---|---|---|---|
| P02-T001 | Establish the Python analytics-service boundary | NFR-008, NFR-009 | `services/analytics`, package metadata, module ownership | Structure, import, lint, and type review | COMPLETE |
| P02-T002 | Preserve and fingerprint the source | REQ-019, REQ-021 | Fingerprint and immutable local POC store | Hash, collision, overwrite, and repeat tests | COMPLETE |
| P02-T003 | Parse the WDF sales workbook | REQ-020 | Workbook recognizer and typed row parser | Schema, missing-sheet, missing-header, and value tests | COMPLETE |
| P02-T004 | Enforce row outcomes and safe logs | REQ-020, NFR-002, NFR-005 | Validation, quarantine reasons, run summary, structured events | Accounting and log-content tests | COMPLETE |
| P02-T005 | Define PostgreSQL ingestion and lineage storage | REQ-019-REQ-021, NFR-003, NFR-004 | Additive migration with file, run, raw row, outcome, and typed line tables | Constraint and migration review | COMPLETE_WITHOUT_LIVE_DATABASE |
| P02-T006 | Execute the read-only WDF POC audit | REQ-019-REQ-021 | Local retained copy and privacy-safe run summary | Source hash, 5,119-row accounting, repeat-run equivalence | COMPLETE |
| P02-T007 | Complete broad verification and handoff | All phase requirements | Commands, evidence, limitations, Project Brain state | Applicable full checks | COMPLETE |

## Acceptance criteria

1. The supplied annual WDF workbook remains unchanged and its source hash matches the Phase 0 fingerprint.
2. A retained POC copy is addressed by content hash, never overwritten, and verifies to the same hash.
3. Exactly 5,119 Sales Breakdown data rows receive a terminal accepted or quarantined outcome.
4. `input_rows = accepted_rows + quarantined_rows` is enforced in code, database constraints, and tests.
5. Repeating the same file produces the same file identity and source-row identities without a second retained object.
6. Missing sheets, changed headers, malformed values, blank rows, and unsupported workbooks fail or quarantine explicitly without losing rows.
7. Repeated, negative, and zero-value source rows remain visible in accounting and are not silently removed.
8. Logs and committed evidence contain no raw customer, order, employee, contact, payment, or note values.
9. No order, customer, operational, or analytical value is published to the web application.
10. Python tests, lint, formatting, type checks, database constraint review, existing Node/web checks, and dependency checks pass.

## Verification and rollback

- Unit: fingerprints, immutable store, schema recognition, typed parsing, reason codes, accounting, identifiers, money, and safe event payloads.
- Integration: complete workbook processing through the local adapter and summary writer, including a repeated run.
- Database: SQL constraints and idempotency keys reviewed; live Neon execution remains credential-gated and must not be claimed.
- Reconciliation: workbook source row count equals accepted plus quarantined; phase totals are recorded only in privacy-safe aggregate form.
- UI and accessibility: not applicable because no Phase 2 results enter the UI.
- Security and privacy: source rows remain outside Git; logs and summaries are field-allowlisted.
- Rollback: remove the isolated Python service, additive migration, and ignored local POC artifacts without touching supplied source files or Phase 1.

## Human gate

- `APPROVED_IN_PROGRESS -> READY_FOR_REVIEW`: agent after acceptance evidence is complete.
- `READY_FOR_REVIEW -> ACCEPTED`: owner only.

## Acceptance

- Accepted by/date: owner, 2026-09-14 (`lets move to next phase`).
