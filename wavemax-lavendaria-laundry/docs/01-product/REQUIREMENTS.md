# Wavemax Requirements

## Functional requirements

| ID | Requirement | Priority | Acceptance criteria | Status | Phase |
|---|---|---|---|---|---|
| REQ-001 | One-store product scope | MUST | Every operational query is scoped to the configured store; no multi-store UI is exposed | DRAFT | UNASSIGNED |
| REQ-002 | Owner navigation | MUST | Owner sees Command Center, Orders, Business Analytics/Finance, and Workforce Management | DRAFT | UNASSIGNED |
| REQ-003 | Manager navigation and authorization | MUST | Manager sees Command Center, Orders, and Workforce Management; Analytics/Finance UI and APIs deny access | DRAFT | UNASSIGNED |
| REQ-004 | Direct-report workforce boundary | MUST | Manager can read and act only on people assigned through an owner-controlled, effective-dated primary-manager assignment | APPROVED | PHASE_1 |
| REQ-005 | Manager order-value visibility | MUST | Authorized manager can see order price and payment status without receiving finance-dashboard access | APPROVED | PHASE_3 |
| REQ-006 | Scoped manager approvals | MUST | Manager can approve eligible requests only for direct reports; cross-manager attempts are rejected and audited | DRAFT | UNASSIGNED |
| REQ-007 | Complete order queue | MUST | User can search/filter orders and open the exact selected order | APPROVED | PHASE_3 |
| REQ-008 | Individual order view | MUST | Order view exposes all available customer, service, channel, amount, payment, promise, stage, assignment, instruction, note, timeline, and lineage fields | APPROVED | PHASE_3 |
| REQ-009 | Specific priority drill-down | MUST | Selecting a priority opens its exact affected entity and issue context, never a generic queue | APPROVED | PHASE_3 |
| REQ-010 | Calculation transparency | MUST | Every displayed metric exposes meaning, formula, sources, fields, filters, numerator/denominator, exclusions, quality warnings, version, contributing records, and calculation time | DRAFT | UNASSIGNED |
| REQ-011 | Scoped export | MUST | Export contains exactly the records behind the selected metric/chart/filter and includes calculation context | DRAFT | UNASSIGNED |
| REQ-012 | Period analysis | MUST | Approved metrics support day-over-day, week-over-week, month-over-month, and year-over-year comparison when sufficient data exists, using the configured store timezone | APPROVED | PHASE_5 |
| REQ-013 | Interactive analytics | MUST | Metric/date filters update KPIs, graph, hover detail, drill-down, and export using one shared filter context | DRAFT | UNASSIGNED |
| REQ-014 | Customer identity without a card | MUST | Source ID, verified phone/email, and explicit mappings are used; names alone never auto-merge customers; unresolved customers remain visible | APPROVED | PHASE_3 |
| REQ-015 | Connection status | MUST | Data Sources shows only source name, connected/not connected, last successful check, and applicable connection error | DRAFT | UNASSIGNED |
| REQ-016 | No product demonstration data | MUST | Production and user-visible development builds contain no fabricated business records or calculated claims | DRAFT | UNASSIGNED |
| REQ-017 | No AI integration | MUST | Business values use deterministic code; visible explanations and actions use fixed product copy or deterministic templates; no LLM, AI-generated narrative, recommendation, diagnosis, or confidence appears in the product | APPROVED | PHASE_5 |
| REQ-025 | Evidence-backed warnings | MUST | A warning opens exact source-backed evidence; when affected records are unavailable, the UI names the coverage gap and required export instead of offering a generic investigation action | APPROVED | PHASE_5 |
| REQ-026 | Compact card copy | MUST | Supporting copy inside cards contains at most five words; titles, values, badges, evidence tables, and methodology definitions are exempt | APPROVED | PHASE_5 |
| REQ-027 | Complete-source calculations | MUST | Incomplete paged exports are retained only as coverage evidence and never feed calculations, charts, rankings, order records, or owner decisions; complete replacement exports become eligible automatically | APPROVED | PHASE_5 |
| REQ-028 | Plain-language headings | MUST | Visible headings use short, understandable noun phrases and never use question-style wording | APPROVED | PHASE_5 |
| REQ-029 | Refresh-safe report copy | MUST | Values, statuses, periods, and evidence refresh through deterministic calculations; helper copy defines the report with fixed wording and never inserts a changing result or generated interpretation | APPROVED | PHASE_5 |
| REQ-030 | Preserve chart motion | MUST | UI redesigns retain the established chart motion language: vertical bars grow from their baseline, horizontal bars reveal left-to-right, line and area series draw left-to-right with their points, and doughnuts sweep clockwise from 0% to 100%; visual tokens and timing may change, reduced-motion remains supported, and animations run once when the chart enters the viewport | APPROVED | PHASE_5 |
| REQ-018 | Workforce management | MUST | Authorized users can view schedules, attendance, time entries, time off, coverage, and linked order work within their role scope | DRAFT | UNASSIGNED |
| REQ-019 | Immutable source ingestion | MUST | Original WDF POS and Laundro Portal files are fingerprinted and retained; processing never overwrites them | APPROVED | PHASE_2 |
| REQ-020 | Full row accounting | MUST | Every parsed input row is accepted or quarantined with an explicit reason and source lineage | APPROVED | PHASE_2 |
| REQ-021 | Idempotent ingestion | MUST | Reprocessing the same source file does not duplicate canonical records | APPROVED | PHASE_2 |
| REQ-022 | WDF API connector | MUST | Complete WDF orders and changes are ingested with pagination, immutable vendor identifiers, retries, checkpoints, rate-limit handling, lineage, and observable connection status | BLOCKED_API_ACCESS | PHASE_2 |
| REQ-023 | LaundroPortal/Laundrolux API connector | MUST | The confirmed second-platform API ingests accounts/cards, payments, machine events, failures/reversals, and metadata with the same integrity controls | BLOCKED_API_ACCESS | PHASE_7 |
| REQ-024 | Cross-source reconciliation without forced precedence | MUST | Each business event retains both source observations; only verified keys/rules map records, differences remain visible, and no source silently overwrites another | DRAFT | PHASE_0 |

## Non-functional requirements

| ID | Area | Measurable requirement | Verification | Status |
|---|---|---|---|---|
| NFR-001 | Authorization | Every protected endpoint has owner/manager allow-and-deny integration tests including cross-manager access | Automated integration tests | DRAFT |
| NFR-002 | Data integrity | Input row count equals accepted plus quarantined count for every ingestion run | Reconciliation test | DRAFT |
| NFR-003 | Lineage | Every canonical record and metric contribution resolves to source file, source row, run, parser, and rule version | Integration test | DRAFT |
| NFR-004 | Money | Persisted money uses integer minor units or exact decimal with explicit rounding tests | Schema and unit tests | DRAFT |
| NFR-005 | Privacy | Logs and errors contain no raw customer/employee contact, card/account data, or credentials | Log-content security test | DRAFT |
| NFR-006 | Accessibility | Approved screens meet WCAG 2.2 AA for keyboard, focus, names, contrast, and responsive use | Automated and manual checks | DRAFT |
| NFR-007 | Performance | Targets remain UNKNOWN until source profiling establishes realistic volumes and operations | Benchmark plan | BLOCKED |
| NFR-008 | Maintainability | New code follows the approved repository structure; architecture tests reject forbidden cross-layer imports | Structure review and dependency tests | DRAFT |
| NFR-009 | Modularity | Domain behavior has one owner; duplicated business calculations and catch-all helper modules are prohibited | Code review and focused unit tests | DRAFT |

## Traceability

Every approved requirement must link to an approved phase task, implementation, automated verification, visual evidence where applicable, and related bugs before release.
