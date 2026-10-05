# Prototype Build Ledger

Running record of the autonomous prototype build authorised on 2026-09-15 under DEC-026 through DEC-028.
This file is the resumption point if a session is interrupted. Update it as work completes; never mark an item done before its verification has actually run.

## Operating rules for this build

1. A measure ships only with a real, stated definition traceable to source rows. Otherwise the feature is not built.
2. Every data path sits behind a repository interface so a vendor API can replace the file-backed implementation later.
3. Partial coverage is disclosed in the UI. It is never hidden or presented as complete.
4. Original source files are never modified.
5. No customer or employee personal data reaches logs, artifacts, or documents.

## Status legend

`TODO` not started · `WIP` in progress · `DONE` complete and verified · `NOT_BUILT` deliberately not built, with reason

## Ledger

| # | Item | Status | Notes |
|---|---|---|---|
| 1 | Decisions DEC-026/027/028 recorded | DONE | Local-file data source, artifact path, honesty rule |
| 2 | LaundroPortal daily-series ingestion (6 series, 2025) | DONE | 365/365 rows accepted per series; all six totals match independently verified figures |
| 3 | LaundroPortal machine-breakdown ingestion | DONE | 56 machines classified; 30 dryers flagged `REVENUE_WITHOUT_CYCLES` |
| 4 | Metric definition registry with lineage | DONE | 7 measures, each carrying formula, population, exclusions, coverage state and limitations; enforced by tests |
| 5 | Deterministic analytics artifact emission | DONE | Byte-identical across repeat runs; `run_id` derived from source fingerprints |
| 6 | Node API analytics repository + endpoints | DONE | `AnalyticsRepository` interface with artifact-backed implementation; 3 endpoints; OpenAPI extended first; manager denial tested server-side. Also fixed pre-existing undefined `BadRequest`/`NotFound` contract responses |
| 7 | Analytics UI with methodology and drill-down | DONE | Six measures with coverage badges; drill-down shows formula, includes/excludes, limits, time basis and row accounting. Verified in browser at 1440px |
| 8 | WDF sales breakdown (category/department) | DONE | $42,102.22 with category and department tables; commercial gap ($32,957.70 / 31 orders) and voids stated on the panel |
| 9 | Workforce hours with data-quality rule | DONE | 2,677.4 plausible hours from 417 entries; 67 over-length/zero entries excluded, counted and shown. Employee names pseudonymised before leaving the parser. Manager is shown nothing store-wide, by design |
| 10 | Orders view from combined WDF evidence | DONE | 4,253 historical paid orders, summing exactly to $42,102.22, presented explicitly as history rather than a live queue. The live queue remains unavailable |
| 11 | Data Sources page reflecting real state | DONE | Shows both truths: no live API, and nine files ingested with SHA-256 fingerprints and parser versions |
| 12 | Full verification sweep | DONE | 27 API tests, 24 web tests, 45 Python tests, workspace typecheck, ESLint, Prettier, Ruff, mypy, production build, stable contract regeneration, zero vulnerabilities |
| 14 | WDF-only client-display policy | DONE | Six LaundroPortal metric cards withdrawn from client display; LaundroPortal ingestion, tests and artifact sections preserved. Enforced by a regression test asserting no LaundroPortal figure or label renders |
| 15 | Sectioned analytics dashboard | DONE | Overview, Sales, Trends, Products, Cash and voids, Workforce, Customers, Methodology. Translated from the Colerain reference architecture |
| 16 | WDF time-based measures | DONE | Month, week, day, weekday, hour, weekday-by-hour heatmap, trailing average, month-over-month, best and slowest days, item rankings, per-pound services, average ticket, pounds. All reconcile to $42,102.22 |
| 17 | Financial summary ingestion | DONE | The workbook's own `Financial Summary` sheet now supplies payment mix, voids, tips and payouts, and self-reconciles |
| 18 | Chart primitives | DONE | Dependency-free accessible SVG and CSS: ranked bars, columns, line with comparison, heatmap, mix bar. Bundle impact 0.08 kB |
| 19 | Orders presentation upgrade | DONE | Historical orders gained summary KPIs, month and type filters, per-month distribution and a card layout. The live queue remains explicitly unavailable |
| 13 | Environment repair | DONE | An OS-locked `.pytest-tmp` directory was breaking pytest, ESLint and Prettier for the whole repo. Pytest basetemp moved and linters scoped to real source roots; the locked directory cannot be removed without elevated rights |
| 14 | Generated commentary removed | DONE | The Overview's "What stands out" panel wrote prose from thresholds, so it read as machine-written rather than sourced. Replaced by "Year at a glance", which prints the workbook's own Financial Summary sheet row for row |
| 15 | Expected Deposit Breakdown ingested | DONE | The financial-summary parser now reads the sheet's third section, publishing Total Cash Sales, Total Payouts, Total Expected Cash, Total Check Sales and Expected Deposit instead of discarding them |
| 16 | Value-on-hover across the application | DONE | Line charts gained a dashed crosshair and a dot marker per series with a period-and-values tooltip; ranked bars and mix-bar segments became focusable and report their value, count or share; column charts report value and caption. Printing values above columns was tried here and withdrawn in row 17 |
| 17 | Printed chart values removed | DONE | Values are reported on hover and focus only, across every chart in the application; the `showValues` option no longer exists |
| 18 | Click-to-filter across charts | DONE | Clicking a column, bar, mix segment, heatmap cell or line point filters every chart on the page. Filters intersect across dimensions, chips name and remove them, and no chart filters its own dimension away |
| 19 | Line-level fact table | DONE | The analytics service publishes every accepted line as integer facts, so a filtered figure is an exact sum rather than a second calculation. Tax travels in hundred-thousandths because the source carries up to 17 decimal places on it |
| 20 | Browser-versus-service reconciliation | DONE | Unfiltered browser aggregation must reproduce the service's totals, months, ISO weeks, departments, weekdays, all 364 days and all 168 heatmap cells exactly. Checked in tests and again at page load; cross-filtering disables itself if it ever fails |
| 21 | Orders served from the real source | DONE | 4,253 paid and 30 voided orders behind the existing gateway interface, with search, status and service filters, paging, summary figures and void reasons as typed. The duplicated history block was removed |
| 22 | "API not connected" removed as a state | DONE | Data sources leads with the verified file ingestion that every figure actually comes from, stated factually rather than as a warning. No source is marked connected |
| 23 | Manager area: Store operations | DONE | Volumes, busy periods and workload split for managers, in counts and weights only. A regression test asserts no currency value renders on the page |
| 24 | Business Analytics report library | DONE | The owner now enters an eight-report responsive directory before opening a sheet. Every card uses existing WDF results and routes directly to its report; no metric formula changed |
| 25 | Separate Revenue & Loss report | DONE | Owner-only financial destination using the WDF Financial Summary: revenue, collection, tax, tips, payouts, expected deposit, payment mix and supplied void analysis. The UI states that profit and true loss cannot be calculated without operating costs |

## Phase position after this build

| Phase | Objective | Position |
|---|---|---|
| Phase 0 | Source profiling and architecture | Complete. Both source folders fully profiled and reconciled. |
| Phase 1 | Shell, authentication, roles, navigation | Accepted previously; unchanged. |
| Phase 2 | WDF ingestion with row accounting | Accepted previously; extended with the timesheet under the same pattern. |
| Phase 3 | Order experience | Delivered to the limit of the evidence: historical paid orders are published; the live queue is not, and cannot be, until a complete order source exists. |
| Phase 4 | One verified metric with lineage, drill-down | Delivered and exceeded: seven measures, each with a full definition, drill-down and row accounting. |
| Phase 5 | Business analytics and period comparison | Delivered for the supplied data: yearly, monthly and daily aggregation with a monthly breakdown per measure. |
| Phase 6 | Manager-scoped workforce management | Delivered for the owner. Manager scoping is deliberately withheld, because the timesheet carries no manager-assignment mapping and a store-wide view would breach the access rule. |
| Phase 7 | LaundroPortal integration | Delivered as file ingestion: six daily series and the machine breakdown. Live API integration remains open and the repository interfaces are ready for it. |
| Phase 8 | Forecasting | Not built. See below. |

## Deliberately not built

| Item | Reason |
|---|---|
| Live order queue with status tracking | The Orders area now serves all 4,253 paid and 30 voided orders from the verified source, with search, filters and detail. What remains unbuilt is *live status tracking*: no supplied file carries a status history or a promise/completion event, so a work-in-progress queue cannot be made truthful. |
| On-time performance metric | No promise or completion timestamps exist in any supplied file. |
| Cross-system customer identity | Proven unachievable: 56.4% of card accounts carry no contact value and shared values reach 24 accounts each. |
| Full void drill-down | The supplied report displays 30 of 34 entries; 4 are unavailable. |
| Forecasting | Method and target are unapproved (BU-005) and a forecast would be an invented business claim. |
