# Data Sources and Handling

## WDF POS

- Location: outside the repository under the supplied Documents folder.
- Contains XLSX, CSV, PDF, and HTML reports for orders, sales, production, shifts, timesheets, tips, customers, machines, drawers, voids, and inventory.
- Some CSVs are conversions containing source metadata and source text; they require reconciliation with the original report.
- `__MACOSX` entries are packaging metadata, not business records.

## Laundro Portal

- Location: outside the repository under the supplied Documents folder.
- Contains account, card/payment, daily history, machine totals, value-add transaction, and financial-summary data.
- The account data contains sensitive customer information.
- Structural availability is confirmed; semantic quality and authoritative keys remain under review.
- Official Laundroworks documentation identifies `portal.mitechisys.com` as LaundroPortal for the Laundroworks card system.
- The owner confirmed LaundroPortal and Laundrolux refer to the same project source. Use `laundro_portal` as the internal evidenced connector name and retain Laundrolux as an alias until the API contract supplies its canonical vendor name.

## Production connector intent

- Connector 1: WDF API for complete order, item, customer, payment, status, void/refund, scheduling, assignment, and change-event data.
- Connector 2: LaundroPortal/Laundrolux. Vendor identity is settled for project planning; implementation waits for its API documentation and credentials.
- Current files are POC inputs only and do not prove API completeness, pagination, identifiers, update semantics, rate limits, or deletion/reversal behavior.
- Neither connector is a universal source of truth. Canonical records preserve source-specific events and reconcile only through approved mappings.

## Handling rules

- Never copy raw source data into Git.
- Store only safe source descriptions in Project Brain.
- Fingerprint original files before parsing.
- Preserve every original field and raw row in controlled storage.
- Normalize into new records; never rewrite the raw representation.
- Quarantine with reasons rather than deleting.
- Record source coverage and known preview/incomplete exports.
