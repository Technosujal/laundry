# Prevention Rules

Prefer executable prevention over documentation.

| ID | Failure class | Mandatory prevention | Enforcement | Origin bug | Scope | Status |
|---|---|---|---|---|---|---|
| PR-001 | Silent data loss | Every ingestion run must prove `input = accepted + quarantined`; no discarded state exists | Database constraint and reconciliation test | Project invariant | All ingestion | ACTIVE |
| PR-002 | Cross-manager data access | Every workforce query derives scope from authenticated manager assignment; client-supplied manager/team IDs cannot widen scope | API integration tests and query review | DEC-004/006 | Workforce | ACTIVE |
| PR-003 | Fabricated analytics | Every displayed value requires an approved metric definition and stored calculation lineage | Metric registry and contract test | DEC-008 | Analytics/UI | ACTIVE |
| PR-004 | Drill-down mismatch | KPI, hover, drill-down, and export share one server-side filter/calculation context | End-to-end reconciliation test | REQ-010/011/013 | Analytics | ACTIVE |
| PR-005 | Unsafe identity merge | Names alone cannot auto-merge customers; uncertain matches remain separate and reviewable | Identity rule tests | REQ-014 | Customer identity | ACTIVE |
| PR-006 | Sensitive log exposure | Structured logs prohibit raw email, phone, card/account value, credentials, and source-row payloads | Redaction and log-content tests | NFR-005 | All services | ACTIVE |
| PR-007 | Presentation-only authorization | Every hidden/disabled role action has a matching server denial test | Authorization test matrix | DEC-003/006 | UI/API | ACTIVE |
| PR-008 | Architecture erosion | Frontend, API, analytics, contracts, and database imports must follow the approved dependency direction | Import-boundary tests and review | DEC-009 | Repository | ACTIVE |
| PR-009 | Helper dumping ground | Shared helpers require proven cross-domain reuse and must not own domain policy | Module ownership review and unit tests | DEC-009 | Repository | ACTIVE |
| PR-010 | Repeated broad refactoring | Refactoring requires approved scope, stated invariants, focused regression coverage, and separate verification where practical | Phase gate and diff review | DEC-009 | Repository | ACTIVE |
| PR-011 | Design-reference drift | Every approved reference must be translated into explicit page structure, role visibility, color, type, spacing, and responsive acceptance checks before implementation is accepted | Component assertions plus owner/manager rendered review | BUG-001 | Web UI | ACTIVE |
| PR-012 | Mismatched measure scope | A numerator and denominator may be combined only when both are proven to cover the same population; every ratio metric must declare its scope (machine type, order type, payment state) in its definition | Metric definition requires explicit scope fields plus a scope-agreement test | Phase 0 addendum: all-machine revenue over washer-only cycles overstates by 17.25% | Analytics/metrics | ACTIVE |
| PR-013 | Paired-event double counting | Where one business event is recorded as two linked rows, a measure must declare which side it counts; naive summation across both sides is prohibited | Reconciliation test asserting paired-ID handling and a deduplicated control total | Phase 0 addendum: naive VAC summation overstates value loaded by 41.2% | Ingestion/analytics | ACTIVE |
| PR-014 | Sparse flag read as missing data | A column populated only when a condition is set must be modelled as a flag with a defined default, never rendered as "unknown" or counted as a completeness defect | Field profile records flag semantics before the field is displayed or scored | Phase 0 addendum: `Account Status` is a `Banned` flag, not a 93.3% gap | Data quality | ACTIVE |

Add new rules only when evidence proves a reusable failure class.
