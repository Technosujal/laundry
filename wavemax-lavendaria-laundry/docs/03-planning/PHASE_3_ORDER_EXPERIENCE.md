# Phase 3 - Order Experience

## Control

- Revision: 1
- Status: APPROVED_IN_PROGRESS
- Approved scope revision: 1
- Approved by/date: owner, 2026-09-14 (`lets move to next phase`)
- Repair attempt limit: 3

## Objective

- User outcome: let an authorized owner or manager find an order, open that exact order, understand its customer and operating state, and follow a specific Command Center priority to the affected order.
- Requirements: REQ-005, REQ-007-REQ-009, REQ-014, NFR-001, NFR-003-NFR-006, NFR-008, NFR-009.

## Evidence boundary

- The supplied WDF Order List exposes only 30 displayed rows out of 4,319 reported orders and covers only 2025-12-29 through 2025-12-31.
- The preview may prove labels, source-field shapes, parsing risks, and interaction design. It cannot be shown or described as the complete order queue.
- The WDF API contract, credentials, pagination behavior, immutable identifiers, status history, promise semantics, and change tracking have not been received.
- The WDF annual sales workbook provides sales-line evidence, not a complete operational order lifecycle.
- LaundryOps-AI supplies order interaction patterns only. Its seeded records, AI claims, calculations, and business rules are not Wavemax data or authority.

## Scope

- In scope: evidence-backed order field inventory; canonical read-contract proposal; explicit source-coverage state; authorized list/detail API boundaries; owner and manager order-price/payment access; search/filter interaction; individual-order layout; customer-context boundary; exact priority-to-order route contract; loading, empty, unavailable, incomplete-source, not-found, forbidden, and service-error states; contract, component, authorization, privacy, and responsive tests.
- Out of scope: fabricating missing orders or events; presenting the 30-row preview as complete; WDF API connector implementation without vendor documentation; on-time calculation; order mutation, scheduling writes, customer identity auto-merge, notifications, recommendations, AI-generated outputs, LaundroPortal reconciliation, production personal-data retention, and production deployment.
- Deferred: publishing real order/customer records until the WDF API contract and production personal-data handling policy are approved.

## Order read contract requirements

- Every response identifies the configured store and reports its coverage state as `complete`, `partial`, or `unavailable` with an evidence reason and last source time when known.
- List and detail responses use immutable application IDs while preserving vendor identifiers in protected lineage, never as browser-authoritative access scope.
- Available fields remain independently nullable. Missing customer, payment, promise, stage, assignment, instruction, note, or event data is not converted into a default or inferred value.
- Money uses exact minor units or decimal serialization with a declared currency; managers may view order amount and payment state without gaining Analytics or Finance access.
- Customer identity uses source IDs, verified contact identifiers, or explicit reviewed mappings. Names alone never merge people.
- Every list row links to one exact detail identifier. A priority link includes the exact order identifier and issue context; it never opens a generic queue.
- Detail lineage identifies source, ingestion run, source record, parser/rule version, and source update time without exposing internal raw payloads.

## Tasks

| ID | Task | Requirement | Expected components | Verification | Status |
|---|---|---|---|---|---|
| P03-T001 | Prove source fields and freeze the order read contract | REQ-007, REQ-008, REQ-014 | Privacy-safe field matrix, coverage semantics, API schemas, unresolved API questions | Source-to-contract review; no invented field semantics | COMPLETE |
| P03-T002 | Build authorized order list and detail service boundaries | REQ-005, REQ-007, REQ-008 | Order module transport/service/repository interfaces and typed unavailable states | Owner/manager allow tests, store-scope denial, not-found and failure tests | COMPLETE |
| P03-T003 | Build the data-free order queue interaction | REQ-005, REQ-007 | Search, filters, coverage notice, result states, exact row navigation | Component, keyboard, empty/error/incomplete tests | COMPLETE |
| P03-T004 | Build the individual order experience | REQ-005, REQ-008, REQ-014 | Customer, service, payment, promise, stage, assignment, instructions, notes, timeline, and lineage sections | Field-presence, missingness, privacy, and responsive tests | COMPLETE |
| P03-T005 | Define exact priority drill-down | REQ-009 | Typed issue context and order-detail deep link | Specific-entity routing and unauthorized-access tests | COMPLETE |
| P03-T006 | Complete broad verification and handoff | All phase requirements | Commands, evidence, limitations, Project Brain state | Full applicable checks and rendered review | BLOCKED_WDF_API_AND_POLICY |

## Acceptance criteria

1. Owner and manager can search/filter only when a source explicitly reports usable coverage; unavailable or partial data is unmistakably labelled.
2. A selected list result and a Command Center priority open the exact order detail, not a generic list.
3. Individual order detail renders every supplied contract area and preserves missing values as unavailable rather than inventing content.
4. Managers can see order amount and payment state, while Analytics and Finance remain denied by the server.
5. Every API query is scoped to the authenticated actor's configured store; browser parameters cannot widen scope.
6. Names alone never merge customer identities; unresolved identity remains visible and reviewable.
7. Source coverage, order lineage, errors, and correlation IDs are clear without logging or committing sensitive record values.
8. No fake order, customer, promise, status, payment, priority, or timeline data enters the product or test fixtures presented as business data.
9. Contracts, generated artifacts, types, lint, tests, production build, role checks, and relevant responsive/accessibility inspection pass.
10. Phase 3 cannot be marked complete until a complete WDF source proves the queue population and selected-order round trip end to end.

## Verification and rollback

- Unit: query validation, coverage-state handling, money serialization, missingness, identity safety, and route construction.
- Integration/API: owner/manager allow paths; unauthenticated, wrong-store, not-found, invalid-query, repository-failure, and incomplete-source paths.
- Data reconciliation: returned count and pagination controls reconcile to the connected complete source before the `complete` coverage state is allowed.
- UI/accessibility: keyboard search/filter, exact row opening, focus restoration, narrow/normal/wide layouts, and all non-success states.
- Security/privacy: server-derived store scope; no raw source payloads or sensitive log values; manager finance denial unchanged.
- Rollback: Phase 3 order modules and additive contracts can be removed without touching Phase 1, Phase 2, or supplied source files.

## Hard gate

- P03-T001 through data-free interaction states may proceed using proven source structure and approved patterns.
- Real order publication, complete-coverage status, and Phase 3 completion require the WDF API contract or an independently verified complete order export plus approved production personal-data handling.

## Human gate

- `APPROVED_IN_PROGRESS -> READY_FOR_REVIEW`: agent only after all acceptance evidence is complete.
- `READY_FOR_REVIEW -> ACCEPTED`: owner only.
