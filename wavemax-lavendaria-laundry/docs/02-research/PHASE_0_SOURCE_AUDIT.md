# Phase 0 Source Audit

## Audit boundary

- Audit date: 2026-09-14
- Inputs: the supplied `WDF POS` and `Laundro Portal` folders outside the repository.
- Purpose: POC source verification only. Completeness and production API equivalence are not assumed.
- Privacy: this document intentionally excludes names, contact details, account/card identifiers, order identifiers, and credentials.
- Mutation: no source file was changed, renamed, moved, or copied into Git.

## Source identity

The supplied Laundro financial PDF identifies location `2900001` at 8449 Colerain Ave, Cincinnati, Ohio. The report itself spells the locality differently, while the official WaveMAX page identifies the address as Cincinnati, OH 45239. Use `America/New_York` only as a proposed timezone until the owner or API configuration confirms it.

The supplied exports are branded LaundroPortal and point to `portal.mitechisys.com`. Official Laundroworks documentation states that LaundroPortal manages the Laundroworks card system. The owner confirmed LaundroPortal and Laundrolux refer to the same project source. Internally, use the evidenced `laundro_portal` connector name and retain Laundrolux as an alias until the API contract confirms its canonical vendor naming.

## Inventory summary

| Source | Business files | Packaging metadata ignored | Formats | Sensitive content |
|---|---:|---:|---|---|
| WDF POS | 21 | 12 `__MACOSX` files | CSV, PDF, XLSX, HTML | Customer, employee, order, time, and financial data |
| Laundro Portal | 10 | 10 `__MACOSX` files | CSV, PDF | Customer account/contact, card/payment, machine, and financial data |

All 31 business files were fingerprinted with SHA-256. Exact hashes are stored in `.agent-system/source-fingerprints.json`.

## WDF findings

| Report | Observed usable detail | Coverage judgment | Important finding |
|---|---:|---|---|
| Annual sales workbook | 5,119 line items; 4,253 order numbers; full 2025 dates | Best current annual sales evidence | Line subtotal is $42,102.22 and Tax 1 is $3,147.26; 21 negative and 3 zero subtotal rows must remain visible |
| Order List | 30 displayed of 4,319 reported orders | Preview only | Detail covers only 2025-12-29 through 2025-12-31; it cannot power a complete queue or annual status metric |
| Machine Starts | 30 displayed of 559 reported entries | Preview only | It cannot support full-year machine-to-order utilization |
| Open Drawer | 30 displayed of 2,652 reported entries | Preview only | One converted date field includes the report footer and requires quarantine/repair, not deletion |
| Shift Report | 8 displayed of 790 reported entries | Preview only | Converted open/close values need an explicit date-time parser |
| Void Report | 30 displayed of 34 reported entries | Nearly complete preview, still incomplete | No CSV is supplied; the missing four details prevent complete void drill-down |
| Production | 625 order-contribution rows plus summaries | Substantial but not complete relative to sales | One order appears twice because two employees each receive 50% credit; it is a legitimate split, not a duplicate |
| Timesheet | 484 time entries plus summaries | Full-year-labelled, quality-gated | 3 clock-outs occur in 2026, 61 durations exceed 16 hours, 53 exceed 24 hours, and 6 are zero/negative |
| Credit-card tips | 6 employee summaries plus a total | Aggregate-only | Useful for an aggregate cross-check, not order-level attribution |
| Top Customers | 10 rows | Deliberate top-ten subset | Cannot describe all customers or retention |
| Inventory CSV | 452 HTML/script lines | Not inventory records | This is a representation of page source and must not be ingested as 452 inventory items |

### WDF duplicate and reconciliation controls

- The sales workbook contains 34 groups of exact repeated line content: 70 rows participate and 36 are additional occurrences. Those additional occurrences represent $196.76 subtotal and $12.64 Tax 1. They are candidates for investigation, not automatic deletion, because the export has no immutable line-item identifier.
- After format-only order-number normalization, 593 of 624 production order numbers match the annual sales workbook; 31 do not. The order preview matches 25 of 30, and the machine-start preview matches 27 of 30. These are candidate joins only until the API confirms identifiers.
- The annual financial PDF contains two conflicting net-sales presentations: its detailed breakdown and workbook support $42,102.22, while the summary area shows $42,105.00. Tax also differs between detailed and summary presentations. A dashboard must expose the chosen basis and reconciliation difference rather than silently selecting one.

### 2026-09-15 addendum — net-sales discrepancy explained, not resolved

- **Verified fact.** The two figures are not a PDF-vs-XLSX disagreement; both appear inside the same PDF. Page 1 prints a summary-block "Net Sales $42,105.00"; page 3 prints a "Net Sales: $42,102.22" computed by summing every category subtotal shown in the page 1–3 itemized breakdown (Drop-Off Laundry, Retail Sales, refunds).
- **Verified fact, independently recomputed.** Summing the `Line Item Subtotal` column directly from the source `.xlsx` (`Sales Breakdown` sheet, all 5,119 rows, exact `Decimal` arithmetic, no float rounding) yields exactly `42102.22`, matching the PDF's itemized-breakdown figure and the existing Phase 0/Phase 2 evidence. This is the second independent calculation path required by the calculation standard; it did not disagree with the first.
- **Evidence-supported inference, not proven.** The page-1 summary-block figure ($42,105.00) is not a line-item sum; it behaves like a payment/transaction-derived aggregate. `Cash ($13,410.23) + Credit Card ($34,524.10) = Grand Total ($47,934.33)` exactly. `Grand Total − (Net Sales_summary $42,105.00 + Net Tax 1 $3,150.08) = $2,679.25`, which is close to but not exactly equal to the printed Credit Card Tips ($2,679.28, a $0.03 residual). This is consistent with the summary block being built from POS transaction/payment records rather than the itemized product/category export, but the $0.03 gap means the exact formula is not proven — do not treat this as a confirmed formula.
- **Hypothesis, unconfirmed.** The $2.78 difference between the two Net Sales figures is coincidentally close to one retail line item's price ("Booster Rehausseur," $2.78, 1 unit) but nothing ties that specific item to the gap; treat this as coincidence, not causation, until the WDF API or vendor documentation defines both "Net Sales" fields explicitly.
- **Human decision required.** Which figure (if either) is the product's authoritative "Net Sales" — the line-item/category breakdown (which is what the current ingestion pipeline and `wdf_sales_line_items` table are built from) or the POS's own transaction-summary figure — is a business decision, not an engineering one. Until decided, any future Net Sales metric must display both the chosen basis and this reconciliation difference rather than silently picking one, per the existing rule above.
- **Prevention control.** The current ingestion pipeline (`services/analytics/app/ingestion/wdf_sales.py`) only ever parses the `Sales Breakdown` sheet's row-level data — it does not read or trust either PDF summary figure — so this ambiguity has no way to leak into `wdf_sales_line_items` today. It becomes relevant only if/when a Net Sales aggregate metric is proposed under Phase 4.

### 2026-09-15 addendum — WDF CSV provenance: derived artifacts, not vendor exports

- **Verified fact.** All nine WDF `.csv` files are derivative text-extraction artifacts, not independent exports from the WDF POS. Every one carries converter-generated columns that no POS vendor would emit: `report_title`, `period_start`, `period_end`, `store_filter`, `employee_filter`, `generated_at`, `source_page_count`, `source_page`, `record_type`, and in most cases a `source_text` column holding the raw rendered PDF line. `Wash-Dry-Fold POS Inventory.csv` is the clearest case, with columns `document_title`, `record_type`, `line_number`, `raw_html_line`, `text_without_tags` — an HTML line dump, not inventory records.
- **Verified fact, provenance by timestamp.** The vendor-native files (all PDFs, the `.xlsx`, and the `.html`) were written in a single burst at `2026-09-03 21:51:36–37`. All nine CSVs were written in a separate burst at `2026-09-04 20:36:24`, roughly 23 hours later. The Void Report has a PDF but no CSV, consistent with a conversion pass that did not cover it.
- **Downstream impact.** A PDF-versus-CSV agreement check proves nothing about WDF's correctness — it only measures the converter's fidelity, because the CSV *is* the PDF. The only vendor-native machine-readable WDF artifact in the supplied set is the `.xlsx`. Treat CSV and PDF as one evidence item per report, never as two corroborating sources.
- **Verified fact, converter fidelity spot-check (Order List).** The CSV's 30 `record_type=detail` rows carry exactly the 30 order numbers shown in the PDF (`11438`–`11467`, contiguous, no duplicates), and their `subtotal`/`tax` values match the PDF rows. For this report the conversion is faithful; fidelity of the other eight conversions is **unverified**.
- **Privacy note.** The `source_text` column denormalizes raw rendered report lines onto every row, which embeds customer name and phone number together in free text. Any future ingestion of these CSVs must split and redact that column rather than storing it verbatim.

### 2026-09-15 addendum — XLSX is more trustworthy than the PDF summary

- **Verified fact.** The workbook contains three sheets, not one: `Financial Summary`, `Sales Breakdown`, and `AR Summary (On Account)`. Only `Sales Breakdown` has ever been ingested. `AR Summary (On Account)` contains a header row and zero data rows, consistent with the reported On Account total of $0.00.
- **Verified fact.** The XLSX `Financial Summary` sheet reconciles internally with exact decimal arithmetic: Net Sales `42102.22` + Net Tax 1 `3147.26` + Credit Card Tips `2679.28` = Grand Total `47928.76`, exactly as printed in that sheet.
- **Verified fact.** The PDF summary block does **not** reconcile internally: its own Net Sales `42,105.00` + Net Tax 1 `3,150.08` + Credit Card Tips `2,679.28` = `47,934.36`, but it prints Grand Total `47,934.33` — a $0.03 internal inconsistency. The XLSX and PDF also disagree on Grand Total ($47,928.76 vs $47,934.33, a $5.57 difference) and on Net Tax 1 ($3,147.26 vs $3,150.08, a $2.82 difference).
- **Conclusion for field-level authority.** For net sales, tax, and grand total, the XLSX is the better artifact: it agrees with the row-level line items and is internally consistent. The PDF summary block is internally inconsistent and must not be used as a financial source. This is a field-level authority judgment, not a declaration that WDF as a whole is authoritative.
- **Verified fact, timezone evidence (relates to BU-007).** The XLSX `Financial Summary` sheet states `Start Date 2025-01-01 01:00:00` and `End Date 2026-01-01 00:59:00` — a window offset by one hour rather than midnight-to-midnight. This is direct evidence that the export boundary is expressed in a timezone offset from the store's local day, and it means year-boundary orders can fall in or out of the window depending on interpretation. Do not ship day/week/month/year bucketing until the authoritative timezone is confirmed.
- **Verified fact, identifier format.** `Order #` values carry a display prefix and a space (`# 7149`), confirming the normalization hazard already recorded in `docs/05-bugs/FAILED_APPROACHES.md`. Raw values must be retained; only format-normalized copies may be used for joins.

### 2026-09-15 addendum — record-level order reconciliation and an unresolved coverage gap

- **Verified fact, record-level reconciliation.** For the 30 orders where the Order List preview and the annual `Sales Breakdown` workbook overlap (`11438`–`11467`), aggregating workbook line items per order and comparing against the Order List gives: **25 exact matches on both subtotal and tax, 0 value mismatches, and 5 orders entirely absent from the workbook.** Where an order exists in both sources, the sources agree perfectly — this is a genuinely reassuring result for per-order fidelity.
- **Verified fact, composition of the 5 absences.** Two are payment-status `Voided`. Three are payment-status `Paid` and are missing from the workbook anyway.
- **Evidence-supported inference, not proven.** All three absent paid orders were created in the final two days of the reporting year. The workbook is keyed on `Paid Date` while the Order List is keyed on `Created Date`, so orders created in late December but settled after the workbook's `2026-01-01 00:59` cutoff would appear in one source and not the other. This is the leading explanation, but it is not proven and must be confirmed against the API's date semantics.
- **Unknown — material, and it blocks revenue metrics.** The two reports disagree on aggregate scale for the identical period and filters, and the cause is not established:

  | Measure | Order List report | Annual workbook / Sales Breakdown | Gap |
  |---|---:|---:|---:|
  | Order subtotals | $97,526.72 | $42,102.22 | 2.32× |
  | Distinct orders | 4,319 | 4,253 | 66 |
  | Laundry weight | 61,087 lbs | ≈20,000 lbs of weighed WDF line items | ≈3× |
  | Cash payments | $13,396.76 | $13,410.23 | −$13.47 |
  | Credit card payments | $34,717.04 | $34,524.10 | +$192.94 |
  | Voided sales | $24,252.98 | $24,252.98 | exact match |

  A 1.5% difference in order count cannot produce a 2.32× difference in value, and per-order values agree exactly where both sources carry the order. Voids reconcile to the cent across both reports, so the two are not unrelated extracts. Candidate explanations — that Order List "Subtotals" is a different measure, that the workbook is filtered to a subset of order types, or that the date basis shifts materially more volume than the year-boundary sample suggests — are **unverified**. Do not choose one.
- **Downstream impact.** `PROJECT_STATE.md` describes the annual workbook as the best current annual sales evidence. That remains true relative to the other supplied files, but it must not be described as complete annual revenue coverage until this gap is explained: on WDF's own Order List figures the workbook may represent well under half of gross order value.
- **Prevention control required.** No revenue, average-order-value, or laundry-weight metric may ship until this discrepancy is resolved against the vendor API or vendor documentation, with the chosen measure's definition recorded in the calculation catalogue. This is an additional hard gate beyond the existing Phase 3 order-source gate.

### 2026-09-15 addendum — BU-009 substantially resolved from local evidence: the workbook omits commercial orders

The gap above was closed to 0.52% using only the supplied files, by profiling the Production Report, which had not previously been reconciled against the workbook.

- **Verified fact.** The Production Report carries 625 order rows covering 624 distinct orders (one order appears twice because two employees each receive 50% credit — a legitimate split, already recorded). Of those 624 orders, **593 are present in the annual `Sales Breakdown` workbook and 31 are absent**, confirming the earlier count and now attaching a value to it.
- **Verified fact, the absent orders are not ordinary.** The 31 absent orders total **$32,957.70 and 24,415.55 lbs**, averaging **$1,063.15 and 787.6 lbs each**. The 594 present orders average **$47.47 and 33.6 lbs**. The absent orders are therefore roughly 22× the value and 23× the weight of a typical order, and 17 of them individually exceed $1,000.
- **Verified fact, this is systematic rather than a year-boundary artifact.** The absent order numbers span 7148 to 11440 across six distinct 500-number blocks of the year; only two fall in the final hundred order numbers. 25 of the 31 belong to a single production employee whose summary line is itself anomalous (91 orders, $33,566.10, 24,754.45 lbs, against colleagues averaging roughly $50 per order).
- **Verified fact, the reconciliation now closes.** Starting from the Order List's own figures:

  | Step | Amount |
  |---|---:|
  | Order List subtotals | $97,526.72 |
  | less approximate voided subtotal (voids × subtotal/grand-total) | −$21,959.53 |
  | less commercial orders absent from the workbook | −$32,957.70 |
  | **expected workbook-visible sales** | **$42,609.49** |
  | actual workbook net sales | $42,102.22 |
  | **residual** | **$507.27 (0.52% of order subtotals)** |

- **Evidence-supported inference, not proven.** These appear to be commercial or wholesale orders billed on account rather than paid at the point of sale, which is why a workbook keyed on `Paid Date` does not contain them. Four independent signals support this: the Production Report's own note states it is "Displaying paid and unpaid orders"; the workbook's `AR Summary (On Account)` sheet exists but is empty; both the XLSX and PDF report `On Account $0.00`; and the PDF breakdown shows a `Hilton Hotel` department carrying only $47.59 of recorded sales for the entire year, which is implausible for a hotel contract given the volumes above. The precise mechanism — on-account billing, deferred payment, or another exclusion rule — is **not proven** and requires vendor confirmation.
- **Unknown.** The remaining $507.27 residual is unexplained. It is small enough to be void-subtotal approximation error (voids were apportioned by ratio, not measured directly) but this has not been demonstrated.
- **Business impact, and it is significant.** Any revenue view built on the annual workbook alone excludes the store's largest orders entirely. On these figures the workbook represents roughly 56% of non-voided order value, and the omitted segment is precisely the high-value commercial work. A dashboard that reported workbook sales as "revenue" would understate the business by approximately $33,000 for 2025 and would render the commercial customer segment invisible. This must be raised with the owner as a business finding, not merely a data-quality note.
- **Prevention control.** The gate above stands: no revenue, average-order-value, or weight metric may ship from the workbook alone. Any such metric must either incorporate an on-account/commercial source or state explicitly that it covers point-of-sale paid orders only.

### 2026-09-15 addendum — Void Report, tips corroboration, and the BU-009 reconciliation tightened to 0.06%

- **Verified fact, the voided and absent populations are disjoint.** This was checked because an overlap would have meant the BU-009 reconciliation subtracted the same orders twice. It does not: of the 30 displayed voided orders and the 31 production orders absent from the workbook, **the overlap is zero**. Further, **none of the 30 voided orders appears in the sales workbook, and none appears in the Production Report** — voided orders are cleanly excluded from both sales and production, which is internally consistent behaviour.
- **Verified fact, the Voids figure is independently corroborated.** The 30 displayed void entries sum to $24,166.19 against the reported $24,252.98, leaving $86.79 to be accounted for by the 4 undisplayed entries — an average of $21.70 each, consistent with the smaller voids on the displayed page.
- **Verified fact, the reconciliation tightens.** Apportioning the gross Voids figure by the tax-only ratio (subtotals ÷ (subtotals + taxes) = 0.9288) rather than by a ratio that also includes tips gives a void subtotal of $22,526.95, and the reconciliation becomes:

  | Step | Amount |
  |---|---:|
  | Order List subtotals | $97,526.72 |
  | less void subtotal (tax-only apportionment) | −$22,526.95 |
  | less commercial orders absent from the workbook | −$32,957.70 |
  | **expected workbook-visible sales** | **$42,042.07** |
  | actual workbook net sales | $42,102.22 |
  | **residual** | **−$60.15 (−0.06%)** |

  BU-009 is therefore reconciled to within six hundredths of one percent. The earlier $507.27 residual was an artifact of apportioning voids by a ratio that included credit-card tips.

- **Verified fact, voids are also dominated by commercial-scale orders.** Thirteen of the 30 displayed voids are $500 or more and total $22,765.33 — 94% of the displayed void value. The recorded void reasons are operational free text such as cancellations, changes of mind, and "no laundry", and one customer recurs across the majority of the large voids. Combined with the absent-order finding, this means the store has **two separate populations of high-value commercial orders that never reach sales**: roughly $33,000 processed but unbilled in the sales export, and roughly $23,000 voided outright.
- **Verified fact, Credit Card Tips are corroborated 3:1.** The standalone Credit Card Tips Report totals **$2,679.28**, matching both the XLSX and PDF Financial Summary exactly, and its six employee lines sum to that total internally ($2,654.86 production + $24.42 cashier). The Order List's $2,713.11 is therefore the outlier, by $33.83. This is a second instance of the Order List reporting a larger figure than the paid-sales reports, consistent with it including orders the sales reports exclude.

### 2026-09-15 addendum — the LaundroPortal summary PDF answers two open questions

Reading the supplied `Financial Summary last month.pdf` (July 2026) resolved two items that had been recorded as unknowns.

- **Verified fact — "Free Starts" means management-card starts.** The page 2 location table reports `Free Starts 3462` and `Free Start Total $4,350.40`. The page 1 summary reports `Number of Management Card Starts: 3462` and `Management Card Total Cycle Amount: $4,350.40`. The values are identical, so the history export's `Free Starts` series is the management/comp card start value. Whether it should be treated as a cost, a discount, or excluded from revenue remains a client decision, but the field's meaning is no longer unknown.
- **Verified fact — dryer cycle data exists; the supplied CSV was simply filtered.** The PDF's `User Cycle Breakdown` reports cycles for both machine classes: washers 5,329 full ($30,048.35); dryers 387 full plus 18,246 top-off ($9,234.50); total 23,962 cycles ($39,282.85), which sums exactly. LaundroPortal therefore **does** track dryer cycles, distinguishing full cycles from top-off cycles. The daily history CSV omits them because that export is scoped to washers, as its own filename states. This changes the ask: dryer cycles do not need to be created, only exported.
- **Consequence for the metric trap (PR-012).** The omission is larger than first measured. In this July 2026 sample, top-off dryer cycles alone are 18,246 of 23,962 total cycles — **76% of all cycles**. A washer-only denominator therefore excludes roughly three quarters of machine activity, not merely the dryer share of revenue. Full-cycle and top-off cycles are also not equivalent units and must not be added into a single "cycles" figure without a stated definition.
- **Verified fact, location spelling.** This report names the location `2900001 - 8449 Colerain Ave, Grosbeck, OH`, a variant spelling of Groesbeck, Ohio, a Cincinnati locality. This is consistent with the earlier address evidence and supports, without confirming, a US Eastern timezone. Confirmation remains a client decision.
- **Verified fact, payment structure.** July 2026 payments split as cash 3,757 transactions / $16,055.00 and credit-debit 1,339 transactions / $24,697.00, totalling 5,096 / $40,752.00, with new-card payments of $181.50 giving net payments of $40,570.50. This is a later-period snapshot and cannot corroborate any 2025 figure.

### 2026-09-15 addendum — Timesheet deep profile: arithmetic is sound, meaning is not

- **Verified fact, row accounting is internally perfect.** The file holds 484 time entries, 6 employee totals and 1 report total. The 484 entries sum to 1,168,701 minutes, which equals the sum of the 6 employee totals and equals the stated report total exactly. Every employee subtotal also matches its own entries to the minute. The source faithfully sums its own data; the problem is what the data means, not its arithmetic.
- **Verified fact, 85.4% of recorded labour time comes from 53 broken entries.** Of 19,478.3 recorded hours, **16,633.4 hours (85.4%) come from the 53 entries longer than 24 hours**. Entries within a plausible 0–16 hour shift number 417 of 484 (86.2% of entries) but account for only 2,677.3 hours. The headline total is therefore inflated roughly sevenfold, and the plausible remainder is the only defensible basis for any labour measure.
- **Verified fact, three entries dominate everything.** Three entries alone contribute 14,505.6 hours — **74.5% of all recorded time** — spanning 155, 223 and 226 days respectively. All three are the only entries whose clock-out falls in 2026. They are consistent with a missed clock-out later closed by hand, but the cause is not proven.
- **Verified fact, 6 entries have exactly zero duration; none is negative.** The earlier note of "6 zero/negative" resolves to six zeros and no negatives.
- **Verified fact, durations cannot be recomputed from the displayed timestamps.** Recomputing `clock_out − clock_in` from the displayed values disagrees with the stated duration on **125 of 484 entries (25.8%)**: 57 by −1 minute, 66 by +1 minute, and 2 by exactly ±60 minutes. The ±1 minute spread is consistent with seconds being truncated from the displayed times while the stated duration is computed at full precision. **Any labour-hours calculation must use the reported duration, never a recomputation from displayed clock times**, until seconds-precision timestamps are available from the API.
- **Verified fact, the two 60-minute disagreements are daylight-saving artifacts, and this is evidence for BU-007.** Both are explained exactly by DST transitions:
  - the entry spanning 2025-08-03 → 2026-01-05 crosses the 2025-11-02 fall-back, and its stated duration is 60 minutes **longer** than naive wall-clock subtraction, as real elapsed time must be when an hour repeats;
  - the entry spanning 2025-12-29 → 2026-08-12 crosses the 2026-03-08 spring-forward, and its stated duration is 60 minutes **shorter**, as real elapsed time must be when an hour is skipped.

  This proves the WDF POS records durations as true elapsed time while displaying wall-clock local times in a zone that **observes US daylight saving**. It rules out a fixed UTC offset. It does not by itself identify which DST-observing zone, so BU-007 still requires client confirmation, but the DST question is now settled. It also offers a plausible reading of the workbook's `01:00 → 00:59` window as a DST-offset boundary artifact, which remains an inference.
- **Verified fact, population mismatch.** The timesheet covers 6 employees while the Production Report covers 7. The two reports do not describe the same staff population and must not be joined without an identifier mapping.
- **Downstream impact.** Workforce hours, labour cost, productivity, and any revenue-per-labour-hour measure remain blocked. Publishing the report total would overstate labour by roughly 7×.
- **Prevention control.** Any labour measure must state its treatment of over-length entries, must use reported durations rather than recomputed ones, and must present excluded entries in a visible data-quality count rather than dropping them. The entries are preserved, not deleted.

## Laundro Portal findings

| Report | Observed usable detail | Coverage judgment | Important finding |
|---|---:|---|---|
| Accounts | 17,177 unique account rows | Lifetime snapshot; only 26.4% used during 2025 | Last-used dates range from 2022-08-23 to 2026-08-23; `Account Status` is a sparse `Banned` flag (1,156 set), not a 93.3% data gap |
| Daily machine cycles | 365 unique days; 70,403 cycles | Complete for calendar 2025, but **washers only** | No missing, duplicate, or invalid days found; covers the 26 `W*` machines only, so it is not a denominator for all-machine revenue |
| Daily machine revenue | 365 unique days; $453,200.85 | Complete for calendar 2025 | Exactly reconciles to individual-machine revenue totals |
| Daily payments | 365 unique days; $474,476.00 | Complete for calendar 2025 | Payments are value loaded; they are not the same business event as machine revenue |
| Daily accounts used | 365 unique days; 31,652 | Complete for calendar 2025 | Counts activity, not unique annual customers |
| Daily new cards | 365 unique days; 4,434 | Complete for calendar 2025 | Does not by itself identify the customer behind each card |
| Daily free starts | 365 unique days; $41,380.50 reported value | Complete dates; meaning needs contract | July 2026 summary evidence calls this a management-card/free-start amount; API definition is still required |
| Machine breakdown | 56 unique machines (26 washers, 30 dryers) | Complete relative to daily totals | Revenue and cycles each reconcile exactly to their daily series, but to **different machine populations**: all 30 dryers report revenue with zero cycles |
| VAC log | 506 rows over 2026-08-22 to 2026-08-23 | Later two-day operational snapshot; outside 2025 | 394 transaction IDs; all 112 twice-used IDs proven to be exactly one VAC + one payment-processing row agreeing on amount — paired events, not duplicates |
| July 2026 financial PDF | 2 pages | One-month later snapshot | Confirms payment, cycle revenue, card, management-start, and payment-type concepts but is outside the 2025 comparison window |

### Laundro quality controls

- Account status is absent for about 93.3% of account rows.
- Email is present on 3,369 rows and phone on 7,468. Repeated contact values occur and may represent shared household contact details; names or contact values alone must never auto-merge identities.
- The VAC log contains 15 non-success results: 5 declined transactions and 10 technical failures. Operation text also embeds a payment descriptor on a second line, so parsing must split and redact it before logging.

### 2026-09-15 addendum — LaundroPortal deep profile

**Provenance asymmetry (verified fact).** Unlike the WDF CSVs, all eight LaundroPortal CSVs are native vendor exports: clean domain column names, no converter artifacts, no `source_page`/`source_text`. LaundroPortal is therefore the only source in the supplied set providing genuinely machine-readable, vendor-native detail. WDF's sole vendor-native machine-readable artifact is its `.xlsx`.

**Cycle and revenue denominators do not cover the same machines (verified fact; corrects an earlier reading).** The prior note that "revenue and cycles exactly reconcile to their respective daily-history totals" is true but incomplete, and reading it as "these two series are comparable" would be wrong.

- The cycles file is scoped to washers — its own filename says `All Washers`. Only the 26 `W*` machines report cycles, totalling 70,403.
- Revenue covers all 56 machines: washers $386,523.35 plus 30 dryers $66,677.50 = $453,200.85.
- All 30 `D*` dryers report revenue with **zero** cycles. Dryer cycle counts do not exist anywhere in the supplied evidence, so dryer utilisation is currently unmeasurable.
- Independent reconciliation confirms both series are internally sound: daily machine revenue equals the machine-breakdown revenue exactly ($453,200.85), and daily cycles equal washer cycles exactly (70,403).
- **Metric trap, quantified.** A naive revenue-per-cycle of all-machine revenue ÷ washer cycles gives **$6.44**; the defensible washer-only figure is **$5.49**. The naive form overstates by $0.95 per cycle, or 17.25%. No revenue-per-cycle, utilisation, or machine-efficiency metric may be published without stating its machine scope.

**Account status is a sparse flag, not missing data (verified fact; corrects the earlier framing).** The only non-blank `Account Status` value in the entire file is `Banned`, on 1,156 accounts; the remaining 16,021 are blank. This is not a 93.3% data-quality gap — it is a flag column that is populated only when set. Blank must not be rendered as "unknown", and treating blank as "active" is an inference that still requires vendor confirmation. Two further columns, `Promo Email Opt-in` and `Promo SMS Opt-in`, are blank on all 17,177 rows and carry no information at all.

**The account file is a lifetime snapshot, not a 2025 dataset (verified fact).** `Last Used` spans 2022-08-23 to 2026-08-23. Only 4,540 accounts (26.4%) were used during 2025, while 4,924 were used during 2026 — after the analysis window. Account counts must never be compared against the 2025 daily series without an explicit date filter. Account identifiers are fully unique (17,177 of 17,177, zero duplicates) and balances are complete and non-negative.

**Identity bridging is not viable on contact values (verified fact, quantified).** 437 email values and 1,042 phone values are each shared by more than one account; the most-reused email covers 22 accounts and the most-reused phone 24. Merging on a shared contact value would silently collapse up to 24 distinct accounts into one. Separately, 9,687 accounts (56.4%) carry neither email nor phone, so the majority of card accounts are effectively anonymous and cannot be bridged to WDF customers by any supplied field. 104 phone values are not ten digits. This closes the question for the current evidence: a WDF-to-LaundroPortal customer bridge is not achievable without a vendor-supplied shared identifier.

**VAC paired-event hypothesis is now proven (verified fact).** The earlier note that repeated transaction IDs "appear to pair" VAC and payment-processing events is confirmed exactly: of 394 distinct transaction IDs, 112 appear twice and **all 112 pairs consist of exactly one `vac` row and one `payment processing` row, with both rows agreeing on `Amount`**. No transaction ID appears more than twice. These are paired observations of one business event, not duplicates, and neither row may be discarded.

- **Double-count exposure, quantified.** Summing `Amount` naively across all 506 rows yields $5,884.00; the `vac` rows alone total $3,458.00. A naive sum therefore overstates value loaded by $2,426.00, a **41.2% overstatement**. Any VAC-derived measure must state which side of the pair it counts.
- The 127 `payment processing` rows carry `N/A` in both balance columns, which is structural rather than missing data.
- Embedded newlines affect both `Operation` (117 rows, 23.1%) and `Result`, which carries host/response detail on a second line. Both must be split, with the payment descriptor redacted, before any logging.
- The log covers only 2026-08-22 to 2026-08-23 and is entirely outside the 2025 window; it cannot corroborate any 2025 figure.

**Four money measures that must never be summed together (verified fact).** For calendar 2025: card value loaded $474,476.00; value spent at machines $453,200.85; free/management starts $41,380.50. Loaded exceeds spent by $21,275.15. Separately, the account snapshot carries $88,372.45 of outstanding card balances — a customer liability, not revenue. Any dashboard presenting these must label each measure and must not add them.
- Balance fields are complete and numeric in the account snapshot; 1,793 accounts have zero balance and 15,384 have positive balance.

## What the POC can support now

| Product area | Current evidence | Status |
|---|---|---|
| Annual WDF sales and line-item mix | Full-year sales workbook, with duplicate/reconciliation warnings | CONDITIONALLY_SUPPORTED |
| Annual WDF revenue totals, average order value, laundry weight | Workbook disagrees with WDF's own Order List by 2.32× on subtotals and ≈3× on weight; cause unexplained (2026-09-15 addendum) | BLOCKED_BY_UNRESOLVED_CROSS_REPORT_GAP |
| Daily/weekly/monthly/yearly machine revenue and cycles for 2025 | Complete daily histories plus machine-total reconciliation | SUPPORTED_FOR_POC |
| Daily/weekly/monthly/yearly card payments for 2025 | Complete daily payments history | SUPPORTED_FOR_POC, but must not be labelled sales |
| Individual current order, status timeline, scheduling, or priority issue | Only 30-row order preview and no complete status history | BLOCKED_BY_WDF_API |
| On-time order calculation | Promise/completion event contract is not present in complete files | BLOCKED_BY_WDF_API_AND_DEFINITION |
| Full void drill-down | PDF preview omits 4 of 34 entries | BLOCKED_BY_COMPLETE_EXPORT_OR_API |
| Workforce hours/performance | Timesheet and production data exist but contain severe duration anomalies and partial order coverage | QUALITY_BLOCKED |
| Customer view without a card | WDF customer identity and Laundro account/card identity lack an approved deterministic bridge | IDENTITY_MAPPING_BLOCKED |
| Cross-system customer identity bridge | Closed on current evidence: 56.4% of card accounts carry neither email nor phone, and shared contact values reach 24 accounts each, so no supplied field can safely join the systems | BLOCKED_PENDING_VENDOR_SHARED_IDENTIFIER |
| Machine utilisation and revenue-per-cycle | Cycles cover washers only; all 30 dryers report revenue with no cycle data | BLOCKED_BY_MISSING_DRYER_CYCLES |
| Connection status | Requires credentialed health/sync checks from both APIs | BLOCKED_BY_API_ACCESS |
| Forecasting | Historical machine/payment series exist, but target, horizon, closures, holidays, and weather inputs are unapproved | DEFERRED |

## Required reconciliation model

Neither source automatically overrides the other. They represent different business events:

1. WDF POS records wash-dry-fold orders, sale line items, payments, production credit, shifts, and time entries.
2. Laundro Portal records stored-value payments, card/account activity, machine cycles, and machine revenue.
3. A canonical result must preserve both observations, label the event type, map only on verified keys, and retain unresolved differences.
4. “Payments,” “sales,” “machine revenue,” “WDF order value,” and “cash/card deposits” must remain distinct measures unless an approved equation reconciles them.

## Open contract questions

1. What WDF API exposes complete orders, items, customer identifiers, promise times, status events, payment status, void/refund state, assignments, and update timestamps?
2. What LaundroPortal/Laundrolux API exposes immutable transaction IDs, accounts/cards, value loads, machine cycles, failures/reversals, machine metadata, and pagination/change tracking?
3. What API field or configuration is the authoritative store timezone?
4. Which events can be linked across systems by a vendor-generated shared identifier, and which require an explicit reviewed mapping?
5. What exactly does the Order List "Subtotals" figure measure, and why is it 2.32× the summed `Sales Breakdown` line-item subtotals for the identical period, store, and employee filters? (Raised 2026-09-15; blocks all revenue metrics.)
6. Is the `Sales Breakdown` export filtered to a subset of order types or payment states, and does it use `Paid Date` while the Order List uses `Created Date`? What is each report's authoritative date basis?
7. Why does the Order List report 61,087 lbs of laundry weight when the weighed WDF line items in the workbook total roughly a third of that, and which figure should drive a weight-based metric?
8. Which WDF field is the authoritative "Net Sales", given the XLSX `Financial Summary` sheet and the PDF summary block disagree by $2.78 on net sales, $2.82 on Tax 1, and $5.57 on Grand Total?

## Phase 0 conclusion so far

The files are sufficient to build a truthful POC for annual WDF sales and 2025 Laundro machine/payment trends, but not a trustworthy live order command center, on-time metric, complete void workflow, workforce performance view, customer identity bridge, or connection status. Those areas must wait for full API contracts and quality rules; filling the gaps with invented records is prohibited.

## External references

- WaveMAX Cincinnati location: https://www.wavemaxlaundry.com/cincinnati-oh/seo-tidal-wave/286/laundromat-in-cincinnati-oh-8443-colerain-rd-cincinnati-oh-45239-united-states/
- Laundroworks — Using the Laundro Portal: https://support.laundroworks.com/portal/en/kb/articles/getting-started
- WDF POS official support documentation: https://support.washdryfoldpos.com/
- CCI/FasCard WDF ProLink API introduction: https://cardconceptsinc.atlassian.net/wiki/spaces/FCD/pages/1307246594/WDF+ProLink+-+API+Introduction
