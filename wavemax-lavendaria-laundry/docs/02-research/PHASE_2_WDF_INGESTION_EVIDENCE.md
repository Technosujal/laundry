# Phase 2 WDF Ingestion Evidence

## Result

The supplied WDF annual sales workbook completed the Phase 2 file-ingestion path with full row accounting and no source mutation. This result proves the supplied workbook can be retained, recognized, parsed, and structurally validated; it does not prove API compatibility, complete order history, customer identity, or business-metric correctness.

## Controlled source

- Source kind: `wdf_annual_sales_xlsx`
- Source SHA-256: `4eeb35feec9e920335eb85ea86dc086a00324863d16a50e877faf78e91703baa`
- Source bytes: 385,929
- Sheet: `Sales Breakdown`
- Parser: `wdf-sales-xlsx/1.0.0`
- Quality rules: `wdf-sales-quality/1.0.0`
- Deterministic run identity: `09a9d549b186db1658971ca6a97d480fb1f2938f369168988ceb77c712afb7ce`

The source hash matches `.agent-system/source-fingerprints.json`. The ignored retained POC copy has the same hash and uses the content-addressed storage key recorded in the local run summary.

## Row accounting

| Outcome | Count |
|---|---:|
| Input rows | 5,119 |
| Accepted rows | 5,119 |
| Quarantined rows | 0 |
| Accounting difference | 0 |

`5,119 input = 5,119 accepted + 0 quarantined`.

Zero quarantined rows means that every row satisfied the current structural schema and type rules. It is not a statement that every business value is correct.

## Preserved quality observations

| Observation | Count | Treatment |
|---|---:|---|
| Additional exact-content repetitions | 36 | Accepted with `EXACT_CONTENT_REPEAT`; not removed because no immutable line-item identifier is supplied |
| Negative line-item subtotals | 21 | Accepted and retained; no approved rule defines them as invalid |
| Zero line-item subtotals | 3 | Accepted and retained; no approved rule defines them as invalid |

These counts independently reproduce the Phase 0 audit findings. No row was discarded to improve the result.

## Idempotency evidence

- First execution created one ignored content-addressed retained object.
- Later executions reported `retained_copy_created=false`.
- Source hash, storage key, parser version, rule version, run identity, row count, outcome counts, and warning counts remained the same.
- Source and retained object hashes were compared after execution and were identical.

## Observability evidence

Successful runs emitted allowlisted JSON events for:

1. `ingestion.started`
2. `source.retained`
3. `parse.completed`
4. `validation.completed`
5. `ingestion.completed`

Events include source/run identity, parser/rule version, counts, warnings, retained-object state, and duration. Failure paths emit `ingestion.failed` with a controlled exception class and no exception message or source values. Automated tests assert that sample order and note values cannot appear in logs or summaries.

## Limitations

- No Neon connection was available, so migration `0002_ingestion_foundation.sql` was reviewed and contract-tested but not executed against PostgreSQL.
- No WDF API contract or credential was available. `REQ-022` remains blocked, and this workbook parser must not be reused as an assumed API parser.
- The supplied Order List remains an incomplete 30-row preview. Phase 2 data must not populate a complete Orders screen.
- Business validity beyond current structural rules remains unproven. Exact repetitions, negative amounts, zero amounts, and future vendor-specific reversals remain visible for later rules and reconciliation.
