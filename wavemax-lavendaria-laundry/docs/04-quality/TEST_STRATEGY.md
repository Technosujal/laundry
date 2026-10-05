# Test Strategy

| Layer | Purpose | Required when |
|---|---|---|
| Static | Formatting, lint, types, dependency and contract consistency | Every code change |
| Unit | Calculation, validation, parsing, permission, and state-transition rules | Logic changes |
| Data contract | Source schemas, missing fields, duplicates, date/money parsing, and parser versions | Ingestion changes |
| Reconciliation | Row accounting and totals against independent source controls | Data/analytics changes |
| Integration | Node, Python, Neon, storage, and API boundaries | Boundary changes |
| Authorization | Owner/manager allow and deny, direct-report and cross-manager access | Every protected feature |
| End to end | Critical owner and manager journeys | User-facing feature changes |
| Visual/accessibility | Responsive layout, hover, focus, keyboard, empty/error/permission states | UI changes |
| Security/privacy | Upload, injection, secret, PII, export, and logging risks | Sensitive changes |

## Evidence rules

- Record exact command, environment, date, result, and relevant output.
- Use controlled test fixtures only in automated tests; never present them as user data.
- Independently calculate representative metrics from their contributing records.
- Test blank versus zero, missing/duplicate IDs, invalid amounts, period boundaries, timezones, refunds/voids, incomplete sources, and unauthorized access.
- Never claim a check that was not run.
