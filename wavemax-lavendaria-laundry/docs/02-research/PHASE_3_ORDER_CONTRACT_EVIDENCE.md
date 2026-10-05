# Phase 3 Order Contract Evidence

## Boundary

- Reviewed source: supplied WDF Order List converted CSV, read-only.
- Reviewed interaction reference: LaundryOps-AI order list/detail types and API shape, read-only.
- Privacy: no customer name, contact value, order number, free text, or raw source row is reproduced here.
- Authority: WDF fields are POC source evidence. LaundryOps-AI fields are layout and interaction ideas only.
- Completeness: the converted CSV contains 49 parsed rows: 30 order-detail rows and 19 report summary/payment/financial rows. The source itself reports 4,319 orders, so the 30 detail rows are a partial preview.

## WDF field evidence

| Source field | Detail presence | Safe contract meaning | Decision |
|---|---:|---|---|
| `order_number` | 30/30 | Source display reference | Expose as `sourceReference`; do not treat as immutable API identity until verified |
| `created_date_time` | 30/30 | Source-created timestamp | Expose as nullable `createdAt`; timezone remains unconfirmed |
| `order_status` | 30/30 | Source status label | Preserve as `sourceStatus`; do not infer workflow percentage or completion event |
| `payment_status` | 30/30 | Source payment label | Preserve separately from order status |
| `payment_method` | 29/30 | Source payment-method label | Nullable; missing stays missing |
| `customer` | 9/30 | Source customer display label | Nullable display only; never use for identity merge |
| `subtotal`, `tax`, `cc_tip`, `cc_surcharge`, `total` | 30/30 | Source monetary components | Exact decimal strings; currency remains configuration/API-confirmed |
| `order_type` | Report-level value on all rows | Report population label | Do not treat as an individual service or channel |
| `record_type` | 49/49 | Distinguishes detail from report summary rows | Only `detail` rows are order candidates; other rows remain accounted for |

Observed non-personal categories are limited to three source-status labels, two payment-status labels, and two payment-method labels. They are source labels, not canonical Wavemax enums.

## Required fields not proven by the preview

| Contract area | Current evidence | Handling |
|---|---|---|
| Immutable WDF order identifier | Not proven | Use an internal application ID only after canonical storage exists; retain source reference in lineage |
| Service type and sales channel | Not present per order | Nullable/unavailable; do not derive from report title |
| Promise time | Not present | Nullable; blocks on-time classification |
| Ready/delivered/completed event | No complete event history | Nullable; blocks on-time classification and lifecycle assertions |
| Assignment and machine | Not present | Nullable |
| Instructions and notes | Not present | Nullable; never manufacture text |
| Customer email and phone | Not present in order preview | Nullable and privacy-gated |
| Customer identity link | Not proven | `unresolved` unless a source ID, verified contact key, or reviewed mapping exists |
| Event timeline | Not present | Empty with explicit coverage, not generated from current status |
| Priority and priority score | LaundryOps-AI-only presentation fields | Excluded until Wavemax owns a deterministic, approved issue rule |
| Estimated-ready time and progress | LaundryOps-AI-only generated fields | Excluded until supplied by WDF or calculated under an approved rule |

## Contract decisions

1. List responses always include source coverage. `complete` is forbidden until count/pagination reconciliation proves the connected source is complete.
2. The current API returns `unavailable` with zero items because no complete operational source is connected.
3. Partial source data may be audited internally but cannot silently appear as the production queue.
4. Source status and payment labels remain separate strings until the WDF API establishes semantics and an approved mapping exists.
5. Missing values remain nullable. No unknown timestamp, amount component, customer field, or event becomes zero, empty text, or a guessed value.
6. The list and detail contracts reserve every required UI section while explicitly representing unavailable fields.
7. Exact priority drill-down will use an internal order ID plus a typed issue code. Priority values are not accepted from presentation-only reference data.
8. Owners and managers share the same order read contract. Server authorization still prevents that access from granting Analytics or Finance permissions.

## LaundryOps-AI pattern retained or rejected

| Pattern | Decision | Reason |
|---|---|---|
| Search and filters | RETAIN | Required by REQ-007 |
| List row opens exact detail | RETAIN | Required by REQ-007 and REQ-009 |
| Customer/service/status/payment context | RETAIN_AS_LAYOUT | Required by REQ-008, but values must come from verified WDF data |
| Timeline section | RETAIN_AS_LAYOUT | Useful when genuine events exist |
| Numeric priority score | REJECT_FOR_NOW | No approved Wavemax calculation or source field |
| Estimated ready time | REJECT_FOR_NOW | No current source or approved calculation |
| Progress percentage | REJECT_FOR_NOW | No deterministic stage-to-percentage rule |
| Seeded orders and mutations | REJECT | No demonstration data; order writes are outside Phase 3 |

## Remaining WDF API questions

1. Which field is the immutable order ID, and can order numbers be reused or reformatted?
2. How are complete pages enumerated, and what total/checkpoint proves completeness?
3. Which fields distinguish service type, intake channel, pickup, and delivery?
4. Which timestamps carry offsets, and what store timezone is authoritative?
5. What are the authoritative promise, ready, returned, delivered, cancelled, void, and refund events?
6. Are payment method and payment state order-level or transaction-level, and how are split payments represented?
7. Which customer identifier is stable, and what contact fields may the POC retain and display?
8. Are assignments, machines, instructions, notes, and full status history available?

## P03-T001 conclusion

The evidence is sufficient to version a conservative read contract and explicit unavailable/partial coverage states. It is not sufficient to populate or complete the order experience. P03-T002 may implement the authorized empty/unavailable service boundary; real list/detail publication remains hard-gated.
