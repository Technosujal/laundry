# ATLAS Data Analyst — Audit and Dashboard Roadmap

Audit date: 2026-09-03

## Executive conclusion

ATLAS currently has a strong lossless intake and audit foundation, but it is not yet a Power BI replacement. It can preserve, fingerprint, row-account, profile, and preview files. The model graph can propose and independently verify calculations, but it is CLI-only, its AI dependencies are not installed by the reader setup, and it is not connected to the browser UI.

The correct architecture is deterministic-first: code performs ingestion, relationships, calculations, pivots, statistics, and charts; an optional LLM translates questions into approved operations and explains only verified outputs. The LLM must never calculate dashboard values itself.

## Upload failure root causes and corrections

1. Five stale Python servers were simultaneously bound to port 7070. Windows distributed uploads between different code versions. Corrected with exclusive port binding and a clear already-running error.
2. Spreadsheet dependencies were absent. `pandas`, `openpyxl`, `pyarrow`, and `xlrd` are now installed locally and captured in `requirements-reader.txt`.
3. Folder uploads contained macOS AppleDouble files such as `._report.pdf`. These are metadata sidecars, not PDFs. They are now preserved and reported as metadata-only rather than sent to the PDF parser.
4. Unexpected backend failures previously returned only a generic message. They now receive an error ID, session ID, rotating server traceback log, and retained per-session process log.
5. PDF extraction produces page text, not reliable table cells. This is sufficient for discovery but not for financial aggregation. PDF tables need a dedicated layout parser and OCR fallback before their figures are eligible for dashboard measures.

## Uploaded-data findings relevant to the dashboard

The retained files show four high-value structured sources:

- `WDF POS ...xlsx`: Financial Summary, Sales Breakdown, and AR Summary sheets. Sales Breakdown contains paid date, order number, store, category, department, item, quantity, units, subtotal, taxes, note, and laundry-service indicator.
- `accounts_report-2.csv`: customer/account identity, account type/device/status, balance, last-used date, contact fields, and marketing permissions. This contains personal data and should not be sent to a hosted free LLM.
- Daily history CSVs: payments, machine revenue, machine cycles, free starts, new cards, accounts used, each using day and amount.
- Machine breakdown CSV: machine, total revenue, and total cycles.

The PDF set adds operational reports for orders, shifts, production, timesheets, credit-card tips, machine starts, open-drawer events, voids, top customers, and financial summaries. These are valuable, but structured exports should be preferred over PDFs whenever available.

The uploaded HTML file is a Bubble application shell, not a data export; it contains scripts and page bootstrap markup rather than an inventory table.

## Current capability matrix

| Capability | Current state | Required for production |
|---|---|---|
| Immutable intake and fingerprints | Implemented | Retention policy and encrypted storage |
| Row ledger and quarantine | Implemented | Cross-file batch ledger |
| File/folder queue | Implemented | Pause, retry, cancel, resumable uploads |
| CSV/JSON/text profiling | Implemented | Schema versioning |
| XLS/XLSX/Parquet reading | Implemented | Streaming/chunked workbook strategy |
| PDF/DOCX discovery | Partial | Table extraction, OCR, layout confidence |
| Automatic business analysis | Not implemented | Deterministic analysis engine |
| Pivot tables | Not implemented | Pivot API and field-builder UI |
| Charts and dashboards | Not implemented | Visual grammar, saved layouts, exports |
| Filters/slicers/drill-down | Not implemented | Shared filter context and drill paths |
| Multi-table relationships | Not implemented | Semantic model and join validation |
| Calculated measures | Not implemented | Versioned metric definitions |
| Forecasting/anomaly detection | Not implemented | Validated statistical jobs and backtests |
| Natural-language questions | CLI prototype only | Local-model adapter and UI integration |
| Independent result verification | Contract implemented | End-to-end model/runtime tests |
| Access control and sharing | Not implemented | Authentication, roles, row-level security |

## Target dashboard modules

1. Executive overview: net sales, orders, average order value, tax, tips, payouts, expected deposit, variances, and period comparisons.
2. Sales analysis: day/week/month/quarter/year trends, category and item mix, store comparison, payment mix, discount/void/return impact.
3. Machine performance: revenue, cycles, revenue per cycle, utilization, free starts, downtime proxies, and underperforming machines.
4. Customer analysis: active accounts, new/returning customers, frequency, recency, spend, cohorts, churn risk, balances, and consent-safe segmentation.
5. Staff operations: hours, labor productivity, processed pounds/pieces, tips, shifts, drawer events, and exceptions.
6. Reconciliation and controls: POS-to-payment totals, cash difference, duplicates, missing dates, unmatched records, void reasons, and source quality.
7. Data-source health: connection state, last refresh, rows received, rows quarantined, freshness, completeness, and schema changes.

## Power BI–style deterministic feature plan

### Phase 1 — semantic dataset and pivot engine

- Register datasets and fields with stable IDs and inferred roles: dimension, measure, date, identifier, or text.
- Define table relationships and reject joins that unexpectedly multiply rows.
- Provide sum, count, distinct count, average, median, minimum, maximum, standard deviation, variance, percentile, and weighted-average measures.
- Add rows, columns, values, filters, sorting, subtotals, grand totals, and date grouping to a pivot API and UI.
- Save calculation lineage, filter context, source fingerprints, and row counts with every result.

### Phase 2 — interactive dashboards

- KPI cards, tables, matrix/pivot, line, bar, stacked bar, area, scatter, histogram, box plot, heatmap, and cohort views.
- Global date range, source, store, category, customer, employee, machine, payment, and status slicers.
- Cross-filtering, drill-down, drill-through, tooltips, bookmarks, saved views, CSV/XLSX export, and printable reports.

### Phase 3 — data science

- Distribution diagnostics, correlations, significance tests, effect sizes, confidence intervals, segmentation, anomaly/change-point detection, and forecasting.
- Time-aware validation and backtesting; no forecast is released without holdout accuracy and uncertainty bounds.
- Model registry containing data fingerprint, features, parameters, metrics, limitations, and approval state.

### Phase 4 — governed natural-language analyst

- Local LLM converts a question into a constrained analysis specification; deterministic services execute it.
- Analyst and verifier use separate sessions and evidence IDs.
- Only verified result IDs enter explanations. Unsupported questions return `CANNOT DETERMINE`.
- Personal fields are excluded from model context unless explicitly authorized and locally processed.

## Recommended free LLM

Use Ollama locally with `qwen3:8b` as the initial practical model. It supports tool calling, runs without per-request fees, and keeps uploaded business/customer data on the machine. Use a smaller Qwen model if the computer lacks memory; use a larger one only after measuring latency and tool-call reliability.

The LLM is optional for all calculations. It should be used for intent parsing, measure selection, narrative explanations, and follow-up suggestions. Pivots, joins, statistics, forecasts, and dashboard numbers must continue to be computed and verified by deterministic code.

## Definition of ready

ATLAS should not be described as a Power BI alternative until a user can import multiple related files, define or approve relationships, create a saved pivot, apply shared filters, drill from a KPI to source rows, build and save charts, refresh the same dataset, export results, and reproduce every number from its lineage record.
