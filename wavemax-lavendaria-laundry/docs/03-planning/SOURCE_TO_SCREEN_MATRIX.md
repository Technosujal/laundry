# Source-to-Screen Matrix

Recorded 2026-09-15 for the dashboard and Orders presentation upgrade.

## Governing decision

Client-facing dashboards display **WDF-derived values only**. LaundroPortal ingestion, artifacts, evidence and repository code are preserved unchanged behind their existing boundary; they are simply not published to client-facing dashboards until separately approved.

## Baseline contradiction found

Before this upgrade, every published metric card was LaundroPortal-derived:

| Metric | Source | Disposition |
|---|---|---|
| `machine_revenue_total` | LAUNDRO_PORTAL | Withdrawn from client display |
| `washer_cycles_total` | LAUNDRO_PORTAL | Withdrawn from client display |
| `card_value_loaded_total` | LAUNDRO_PORTAL | Withdrawn from client display |
| `accounts_used_total` | LAUNDRO_PORTAL | Withdrawn from client display |
| `new_cards_total` | LAUNDRO_PORTAL | Withdrawn from client display |
| `management_card_starts_value` | LAUNDRO_PORTAL | Withdrawn from client display |
| `machines` panel | LAUNDRO_PORTAL | Withdrawn from client display |
| `wdf_pos_paid_sales_total` | WDF_POS | Retained and expanded |
| `workforce_plausible_hours` | WDF_POS | Retained and expanded |

The ingestion, parsers, tests, artifact sections and fingerprints for LaundroPortal remain in place and continue to run. Only client publication changed.

## WDF fields available

From `WDF POS 2025 report -2025-01-01 to 2025-12-31.xlsx`:

- `Sales Breakdown` (5,119 rows): Paid Date **including time of day**, Order #, Store, Category, Department, Line Item Name, Quantity, Units, Line Item Subtotal, Tax 1–3, Line Item Note, Laundry Service Item.
- `Financial Summary`: net sales, tax, credit-card tips, grand total, payouts, total voided sales, payment-type split.
- `AR Summary (On Account)`: header only, no rows.

From `Timesheet 2025-01-01 to 2025-12-31.csv`: employee, clock in/out, duration.

The time component of Paid Date is what unlocks weekday, hour-of-day and heatmap analysis.

## Reference translation

Reference information architecture (`wavemax-colerain-2025`): overview, sales, trends, products, staff, customers, cash, method.

| Reference component | WDF support | Decision |
|---|---|---|
| Net sales by month | Paid Date + subtotal | Implemented |
| Sales mix by department/category | Department, Category | Implemented |
| When the store sells (hour of day) | Paid Date time | Implemented |
| Tickets by weekday | Paid Date weekday | Implemented |
| Weekday-by-hour heatmap | Paid Date | Implemented |
| Weekly / daily net sales | Paid Date | Implemented |
| Trailing 7-day average | Paid Date | Implemented |
| Month-over-month change | Paid Date | Implemented |
| Best and slowest days | Paid Date | Implemented |
| Top items by net sales and by units | Line Item Name, Quantity | Implemented |
| Per-pound services | Units = lb | Implemented |
| Pounds processed | Quantity where Units = lb | Implemented |
| Average ticket | subtotal ÷ distinct orders | Implemented |
| Laundry vs retail | Laundry Service Item flag | Implemented |
| Payment mix | Financial Summary sheet | Implemented |
| Voided sales value | Financial Summary sheet | Implemented as a single verified total |
| Cash reconciliation | Financial Summary payouts and expected deposit | Implemented |
| Credit card tips | Financial Summary | Implemented |
| Clock hours, timesheet reliability | Timesheet | Implemented |
| Void reason grouping, void-by-customer, void-by-employee | Void Report PDF, 30 of 34 entries | **Implemented.** The PDF is parsed at build time; the employee is identified using staff names the other exports establish. Coverage is stated on every void panel |
| Customers, top customers, average ticket per customer | Top Customers report plus per-order aggregation of the workbook | **Implemented.** The ten-row subset is labelled as such; ticket-size and pounds distributions describe orders, not people |
| Drop-off ticket size and pounds distributions | Workbook, aggregated per order | **Implemented** |
| Machine cost on laundry orders | Machine Starts report, 30 of 559 | **Implemented** with coverage stated |
| Production by employee, pounds by employee, tips | Production and Credit Card Tips reports | **Implemented** |
| Shift close sample, drawer events, why the drawer opens | Shift and Open Drawer reports | **Implemented** with coverage stated |
| Same day vs next day, bedding, fees, non-taxable, price consistency | Workbook line items | **Implemented** |
| Bought-together affinity | Retail lines sharing a ticket | **Implemented.** Pairs seen only once are excluded |
| Every item table | Workbook line items | **Implemented** as the exact-record table behind the rankings |

### Correction, 2026-09-15

An earlier pass of this upgrade wrongly dismissed the Top Customers, Production, Void, Tips, Machine Starts, Open Drawer and Shift exports as unusable because several are text-extraction artifacts that display only part of their report. That reasoning was wrong: the reference project uses them and states their coverage. They are now ingested, and every panel built from them carries its own coverage note. Partial coverage is disclosed, not used as a reason to omit the analysis.
| Year-over-year | Only one year of data exists | **Not implemented**, as instructed |

## Orders

Reference: LaundryOps-AI. Its order vocabulary is `status`, `priority`, `dueAt`, `estimatedReadyAt`, `assignedTo`, `machine`, `progress`, `isRush`.

**None of those fields exist in the WDF workbook.** This confirms the existing truth boundary rather than challenging it.

| Element | Decision |
|---|---|
| Historical paid orders | Improved presentation: search, filters, summary, card and table behaviour |
| Live operational queue | Remains explicitly unavailable. Visual treatment improved only |
| Status badges, progress bars, due times, assignment | **Not implemented.** WDF supplies none of them; rendering them would be fabrication |
| Individual order detail | Improved hierarchy using only supplied fields, with missing fields named as not supplied |
