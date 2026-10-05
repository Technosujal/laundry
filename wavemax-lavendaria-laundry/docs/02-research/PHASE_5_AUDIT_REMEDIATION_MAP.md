# Phase 5 audit remediation map

Date: 2026-09-17

Evidence reviewed: all six files in `wavemax md files for data analyst.zip`, including every
worksheet in the reconciliation workbook. Statuses below describe the repository after the
2026-09-17 remediation pass. `Blocked` means the supplied export cannot support a correct result.

## Data flow

```text
source exports
→ services/analytics ingestion and audit_validator.py
→ Decimal-based metric builders
→ data/analytics/analytics-artifact.json
→ Node AnalyticsRepository / typed contract
→ web analytics gateway
→ source-labelled React report
→ KPI, chart, evidence table, or explicit unavailable state
```

## DQ-01–DQ-16

| ID | Current owner | Status | Resolution / remaining work | Required proof |
|---|---|---|---|---|
| DQ-01 | `wdf_coverage.py`, Executive, Staff | Done | 31 orders / $32,957.70 are separate `Processed, not paid`; never added to paid sales. | Reconciliation and Executive tests |
| DQ-02 | `audit_validator.py`, Cash | Done | Void concentration is an explicit failed health check; customer detail remains partial. | V10 and Cash tests |
| DQ-03 | Production/Void sources | Blocked | Overlap is recorded by the audit but no complete common order population is supplied. No inferred waterfall is published. | Full exports with stable Order # |
| DQ-04 | timesheet parser, validator, Staff | Done | 67 exceptions remain visible; hour/productivity KPIs are withheld. | Timesheet and Staff tests |
| DQ-05 | `wdf_reports.py`, Calculation evidence | Done | Displayed/reported coverage retained for every paged export; incomplete views are labelled. | V05 and coverage tests |
| DQ-06 | VAC parser, Laundro Cash | Done | 2026 VAC data is excluded from 2025 cash/void results and shown only as unavailable evidence. | V04 and LP Cash test |
| DQ-07 | `wdf_financial_summary.py`, Cash | Done | $5.57 payment gap is calculated and displayed; no false reconciliation banner. | V07 and financial tests |
| DQ-08 | Source evidence | Open | XLSX remains authoritative for current calculations; PDF mismatch is recorded but PDF values are not mixed in. | Client source-of-truth decision |
| DQ-09 | financial summary, Cash | Done | Expected deposit is Cash − Payouts and displays −$1,124.31 as an exception. | V20 and Cash tests |
| DQ-10 | workbook scan, validator | Done | All raw workbook columns participate in exact-duplicate detection; 36 / $196.76 is reported. | V12 validator test |
| DQ-11 | workbook scan, service rule | Done | Conflicts remain a health warning; Category is now the single service-split business rule. | V13 and service-mix tests |
| DQ-12 | workbook scan | Open | 138 blank units and 5 blank categories are reported. Item-name normalization is intentionally not inferred. | V14; approved normalization rules |
| DQ-13 | machine parser, validator | Done | W113 and 30 dryer zero-cycle records remain visible health failures; no cycles are invented. | V16/V17 tests |
| DQ-14 | Laundro Customers | Done | Account balance is labelled as a snapshot, not 2025 revenue or unique customers. | LP Customers test |
| DQ-15 | daily validator | Done | 2025-January-06 remains a recorded zero-activity exception. | V18 test |
| DQ-16 | Orders, Sales, validator | Done | 4,253 paid and 4,319 created remain separately labelled; partial-page status KPIs were removed. | V21 and Orders tests |

## APP-01–APP-24

| ID | Component / service | Status | Resolution / conflict | Required proof |
|---|---|---|---|---|
| APP-01 | Executive KPI cards | Done | Removed annual cards carrying December-vs-November badges. | Executive test |
| APP-02 | Executive, LP Customers | Done | Sum-of-daily `Accounts used` headline removed; report calculates average daily active accounts. | LP Customers test |
| APP-03 | Executive | Partial | Paid, processed-unpaid and voided are separate. A created→voided→unpaid→paid waterfall is blocked by DQ-03/full-row coverage. | Reconciliation test |
| APP-04 | Staff | Done | Mixed production value is withheld; paid/unpaid split requirement is explicit. | Staff test |
| APP-05 | Staff | Done | Hours and sales/hour are hidden while 67 timesheet exceptions exist. | Staff test |
| APP-06 | Cash | Done | Card label explicitly means Credit Card; cash is separate. | Cash test |
| APP-07 | Cash | Done | $5.57 gap is visible; success wording is conditional. | Financial test |
| APP-08 | Cash | Done | Monthly void chart always contains January–December, including zero months. | Cash test |
| APP-09 | Void parser | Open | Exact raw reason is preserved, but wrapped PDF row recovery needs a CSV/full export. | Parser fixture |
| APP-10 | Cash | Done | Drawer sample visualization was removed. | Cash absence test |
| APP-11 | `wdf_operations.py`, Customers | Done | Uses the 559-order total row; 30-row pooled sample calculation removed. | Operations metric test |
| APP-12 | Decimal metric builder | Already correct | Half-up calculation is performed once in Python. | Rounding test |
| APP-13 | `build_product_detail` | Done | Same/next-day matching is symmetric; per-pound rate uses pound-denominated lines. | Product-detail test |
| APP-14 | sales analytics, Store operations | Done | Order mix uses exclusive Laundry only / Retail only / Both buckets. | Aggregate reconciliation test |
| APP-15 | Store operations | Done | Departments are sorted by descending distinct orders. | Operations UI test |
| APP-16 | Store operations | Done | All peak-hour ties are shown. | Tie fixture test |
| APP-17 | account parser | Done | Balance bands use exact inclusive labels such as `$0.01–$5.00`. | Account parser test |
| APP-18 | Laundro Cash | Done | 2026 VAC values are excluded from 2025; card loads use the 2025 history series. | Period test |
| APP-19 | Orders | Done | Page-derived Paid/Voided/Value KPI cards removed; matched and loaded populations are explicit. | Orders test |
| APP-20 | Compare Sources | Superseded | Audit suggestion to combine unrelated revenue conflicts with the approved prompt. No difference or combined total is calculated. | Source-comparison test |
| APP-21 | Executive | Superseded | Parallel source lanes remain because the approved prompt requires six subjects per source; meanings and unavailable states are explicit. | Executive links test |
| APP-22 | Shared charts | Partial | Period/source/unit and exact hover values exist; final browser review remains required. | Accessibility/browser checks |
| APP-23 | Shared palette | Done | WDF blue-grey and Laundro muted plum remain stable; red/green/amber are semantic. | Snapshot/browser checks |
| APP-24 | Customers | Open | Existing unequal histogram bins require replacement with equal bins. | Histogram test |

## M01–M31

| ID | Implementation | Status | Notes / blocker | Required proof |
|---|---|---|---|---|
| M01 | `build_artifact._build_wdf_sales` | Done | Paid counter sales $42,102.22. | V06 |
| M02 | daily metrics / machine breakdown | Done | Machine revenue $453,200.85. | V15 |
| M03 | — | Blocked | Combined revenue is forbidden without evidence that source populations are mutually exclusive. | Client/source contract |
| M04 | Order List summary | Partial | Created-work summary is available; row drill-down is blocked by 30/4,319 coverage. | Coverage test |
| M05 | WDF coverage | Done | $32,957.70 / 31 orders separate from paid sales. | Coverage reconciliation |
| M06 | financial summary | Done | $24,252.98 voided sales. | Financial test |
| M07 | validator | Done | 57.60% exception, not a performance narrative. | V11 |
| M08 | validator | Partial | 95.99% is explicitly based on the displayed void sample. | V10 |
| M09 | paid sales orders | Done | 4,253 distinct paid orders. | Sales test |
| M10 | sales analytics | Done | Paid sales ÷ paid orders. | Decimal test |
| M11 | WDF operations | Done | Category-based drop-off population and half-up rounding. | Customer metric test |
| M12 | sales analytics | Done | Pounds only where Units = lb. | Sales test |
| M13 | sales analytics | Done | Category is the single service rule. | Service reconciliation |
| M14 | sales analytics | Done | Weekday averages available from daily/weekday series. | Analytics test |
| M15 | financial summary | Done | Cash and card remain separate. | Financial test |
| M16 | financial summary | Done | Payouts and expected deposit exposed. | V20 |
| M17 | LP metric / validator | Done | Management-card/free-start value remains separately named and monthly thresholded. | V19 |
| M18 | LP daily metric | Done | 2025 card value loaded. | Daily metric test |
| M19 | account snapshot | Partial | Outstanding balance is shown as snapshot; dormant rule needs approved as-of basis. | Client date decision |
| M20 | LP Customers | Done | Average over days with positive recorded activity. | UI/calculation test |
| M21 | machine breakdown | Done | Washer cycles and machine revenue retained; dryer cycle limitation explicit. | Machine parser test |
| M22 | LP daily metric | Done | New cards; replacements cannot be separated. | Daily metric test |
| M23 | workforce | Blocked | Hours stay hidden until timesheet exceptions are resolved. | V09 |
| M24 | workforce / validator | Done | 67 exceptions. | Timesheet tests |
| M25 | Staff | Blocked | Safe paid/unpaid staff split is not published until production coverage is complete. | Complete production export |
| M26 | Staff | Done | Credit-card tips by staff and total. | Staff test |
| M27 | Customers | Done | Top-customer supplied-report total remains coverage-labelled. | Customer test |
| M28 | sales analytics | Done | Paid orders per open trading day. | Operations test |
| M29 | heatmap / Store operations | Done | Distinct orders by weekday/hour; ties preserved. | Heatmap test |
| M30 | `wdf_operations.py` | Done | Full report total row; 27.4% displayed after half-up formatting. | Operations test |
| M31 | `audit_validator.py`, Calculation evidence | Done | Coverage check and every displayed/reported pair exposed. | V05 / health table |

## Known decision blockers

- Store timezone remains unconfirmed; timestamps stay as exported and no timezone conversion is
  invented.
- Production personal-data policy remains unconfirmed; no access boundary is widened.
- The full paged exports are required for complete order, drawer, shift, machine-start and void
  drill-down.
- Original source exports were read only and were not modified.
