# Wavemax Agent Handoff

This file is the durable continuation point for Codex, Claude Code, and any future coding agent. Repository evidence remains authoritative over chat history.

## Current handoff

- On 2026-09-26 the owner directed an exact Workforce Management copy from `LaundryAI - Copy.zip`. The archive's full workforce source and sample dataset now live under `apps/web/src/features/workforce/archive/` and are composed by `ArchivedWorkforcePage.tsx` only in the development/local-preview path. The current WaveMAX shell, Clerk production path and all non-workforce areas are unchanged. Owner navigation exposes every archive Workforce screen; managers are limited to matching direct reports; employees receive their own records and no directory, overview, coverage-planning, shift-coverage, approval or add-staff route. The archive login is not used.
- Latest checks: 35 API tests and 102 web tests pass; web TypeScript, scoped ESLint and the 126-module production build pass. The production bundle was scanned and contains none of the archive sample employee/location identifiers. Visual responsive review, live Clerk invitations and Neon migration execution have not run.
- Owner approved sample data for Workforce Management only. The development-only POC now includes owner-created staff/manager assignment, sample shifts, attendance, time review, leave, shift coverage, seven-day calendar, target-free coverage counts and fixed-label activity notices. The POC is rendered only when `DevelopmentSession` passes its browser-local workforce store; Clerk-backed production retains the existing source-honest workforce page. The production build was scanned and contains no sample staff name, POC banner or workforce POC storage key. Do not treat the preview as production persistence or authorization.
- Latest checks: 35 API tests, 100 web tests, workspace TypeScript, scoped ESLint, changed-file Prettier and 126-module build pass. The repository-wide ESLint failure at `AnalyticsPage.tsx:87` predates Phase 6. No browser surface was available for visual review; live Clerk/Neon and the additive migration remain unexercised. Next: real workforce repository/API, account linking and audit-backed approvals; keep the sample store isolated to local preview.
- Phase 6 workforce POC began with owner approval on 2026-09-20. DEC-036 approves three roles in the existing WaveMAX shell, with employee-only workforce scope and separate employee login deferred. `docs/03-planning/PHASE_6_WORKFORCE_POC.md` lists seven tasks. P06-T001 is partly implemented: API/web/OpenAPI `EMPLOYEE` role, additive employee-account migration, self-only Postgres scope, employee launch card, local preview switch and explicit unlinked-account state. It does not yet implement archive-equivalent workforce records, actions or notifications. Do not describe it as a finished workforce feature.
- Latest checks: 35 API tests, 93 web tests, workspace TypeScript, scoped ESLint, changed-file Prettier and production build pass. Repository-wide ESLint fails only at the previously existing `AnalyticsPage.tsx:87` set-state-in-effect finding. No Neon migration, live Clerk sign-in, or responsive browser review was performed. Next: rendered three-role review and P06-T002 record/API design. Preserve all pre-existing dirty-tree edits and BUG-002 local-only release restriction.
- Latest-day owner strip, 2026-09-20: Command Center receives the existing analytics gateway and renders four owner-only cards from the latest common source date: WDF sales, WDF paid orders, LaundroPortal machine revenue and LaundroPortal washer cycles. The strip says `Latest recorded day`, shows the exact date, and marks it historical; it never calls supplied records today or live. A common-date intersection prevents mixed-day figures, unavailable analytics renders no placeholder, and the manager role does not request the owner snapshot. All 91 web tests, TypeScript, scoped ESLint, production build and desktop/phone browser checks pass.
- Application-wide bright palette, 2026-09-18: matte source and semantic accents are normalized at the shared UI layer. Source controls, badges, KPI rules/icons, category ranking colors, information panels, filters and statuses now align with the bright chart palette. WDF remains blue, LaundroPortal purple, positive green, warning amber and error red. Neutral content and white surfaces remain restrained to preserve hierarchy and contrast. All 89 web tests pass with one worker after a resource-contention retry; web typecheck, scoped ESLint, Prettier and the 124-module build pass. Twelve routes at desktop and phone widths have zero overflow and zero console errors.
- Bright graph palette, 2026-09-18: the shared dependency-free chart layer converts the legacy matte colors to a saturated but stable report palette at render time. This covers bars, columns, grouped columns, lines, areas, heatmaps and SVG doughnuts without changing source data or individual report definitions. The Executive stacked source chart is aligned to the same WDF blue and LaundroPortal purple. All chart animations, interactions, filters, legends and reduced-motion behavior are preserved. Web tests: 89; web typecheck and 124-module build pass. Headless Chromium found no console errors or horizontal overflow across Executive, Sales, Products, Cash, Trends, Operations and Orders; Sales also fits at 390px.
- Bright workspace refinement, 2026-09-18: the six module cards use saturated, stable area colors for their icons, white icon linework and controlled hover/focus illumination. Card footers contain only a right-aligned directional arrow; no `Open dashboard`, `Open analytics` or similar action copy remains. The real WaveMAX wordmark keeps a restrained blue halo. Route, card and row motion is shorter, but graph animation classes, viewport triggers and reduced-motion behavior are unchanged. All 89 web tests and the 124-module build pass; changed-file ESLint and Prettier pass. Fifteen browser checks across Command Center, Executive and Orders at 1440, 1309, 1024, 820 and 390 pixels report zero overflow and zero console errors.
- Mature white shared-system pass, 2026-09-18: the owner approved the white preview and directed implementation while preserving every existing product item. The real WaveMAX asset remains in both shell locations; store, role and authorized-user controls remain visible. Global tokens now use a white/soft-blue canvas, WaveMAX blue interaction states and navy identity controls. The contextual rail, selected report index, shared KPI/chart panels, PageFrame surfaces and all six launch modules use the quieter white system. No route, role rule, calculation, data population, source label, filter, drill-down or graph interaction changed.
- Verification for this pass: all 89 web tests, web TypeScript and the 124-module production build pass. Playwright visually reviewed Command Center, Executive and Orders. A 40-case matrix covered Command Center, Executive, Sales, Orders, Store Operations, Inventory, Workforce and Data Sources at 1440, 1309, 1024, 820 and 390 pixels with exact viewport-width documents and no console errors. Computed graph animations remain `chart-grow-y`, `chart-line-reveal` and `chart-ring-sweep`. Report-specific white-theme refinement remains in progress; do not delete or simplify existing modules to match the preview.
- Visible motion follow-up, 2026-09-18: `AppShell` now keys the route surface by area/order/report, so navigation visibly replays the 620ms page reveal instead of reusing one mounted node. The active rail item has a sliding marker; KPI cards and chart panels enter in sequence; table rows and open disclosures animate. Chart panels below the fold keep `surface-enter` paused until the same `IntersectionObserver` marks them visible. Browser checks captured route motion in progress at 183ms and a scrolled panel at 66ms, with no overflow or console errors. Graph animation classes and reduced-motion behavior remain intact.
- Elera-inspired redesign pass, 2026-09-18: the shared application shell now uses a compact 236px rail, lime active navigation, a 64px header, warm neutral canvas, flatter KPI/chart panels, refined launch cards and responsive spacing. Non-chart motion adds header settling, route settling, staggered launch cards and pressed-control feedback. Chart motion is unchanged: bars grow from their baseline, lines reveal left-to-right and doughnuts sweep clockwise through the existing viewport observer.
- Verification for this pass: 89 web tests, web TypeScript and the 124-module production build pass. Headless Chromium rendered Command Center, Executive, Sales, Orders and Operations at 1440, 1024 and 390 pixels with exact viewport-width documents and no console errors. Computed animation names are `route-settle`, `chart-grow-y`, `chart-line-reveal` and `chart-ring-sweep`. Computer-use exposed no Chrome or in-app browser, so Chromium supplied the rendered review. Scoped ESLint still reports only the already-recorded `AnalyticsPage.tsx` set-state-in-effect finding.

- Plain-language wording update, 2026-09-18: visible question-style headings were replaced with short noun phrases across Executive Dashboard, Orders, Store Operations, Order Details, Workforce and calculation detail. The production evidence card now says “Production orders missing from paid sales,” labels the amount “Production value,” and states “Payment unknown / Not confirmed.” It does not claim the customers failed to pay.
- Responsive review found and fixed a pre-existing 390px Executive overflow: the 12-column monthly source chart required 424px because every column had a 28px minimum. Columns now shrink within the plot and use three-letter phone labels. Headless Chromium reports document width 390 at a 390px viewport with no console errors; Orders also has no overflow at 390px.
- Visualization-system refinement, 2026-09-17: operational work mix uses stable category colours; every part-to-whole visual now uses one responsive SVG ring-sector primitive with direct value/percentage legends, segment hover/focus, non-active dimming and active percentage in the centre. The old conic mask and narrow-card SVG width override were removed because together they clipped the ring into a false C shape. Department workload is Top 5 and opens a monthly source-filtered drill-down on selection. Standalone operations charts fill the content width.
- Source navigation is one sticky, left-aligned WDF POS/LaundroPortal segmented control per subject page. Source headings themselves are static, so WDF POS cannot remain pinned after jumping to LaundroPortal. Line and area entrance drawing is consistently 1.2 seconds. Executive KPI labels do not repeat source names, source badges remain inside cards, rail icons illuminate on hover, and Executive Dashboard uses a distinct gauge icon.
- Product-detail cards share exact desktop row bounds. Fees, discounts and refunds defaults to five lines and exposes the full seven through an explicit button, preserving the evidence without making that card dominate the row.
- Latest verification: all 82 web tests and the 123-module production build pass. Chromium at 1440px confirmed complete doughnuts in Products, Sales, Cash and LaundroPortal machine mix; exact shared bounds for the three product-detail cards; a left-aligned source switcher whose active state changes correctly; static source headings; zero horizontal overflow and zero console errors. The 820px and 390px sweeps also report zero overflow.
- Source-navigation and customer-detail update, 2026-09-17: every business report has sticky WDF POS/LaundroPortal source headers with direct scroll controls; clicking the active Business Analytics rail item collapses or expands the report index. The removed Hours unavailable narrative is no longer rendered. Standalone LaundroPortal line/area cards use the full available content width and both line and area marks reveal left-to-right.
- Customers now keeps the ticket-size, pound-band and complete ranked-customer evidence visible by default. The ranked comparison is a grouped bar chart limited to comparable dollar measures—recorded sales and exact-name-matched void value—while order count and average ticket remain labels. Only Customer directory is disclosed on demand.
- Verification for this pass: all 81 web tests and the 123-module production build pass. Headless Chromium confirmed the sticky controls, rail collapse/reopen, 1092px standalone chart inside a 1160px main region, grouped customer chart, hidden directory, zero horizontal overflow at 1440px and 390px, and zero console errors.
- Unified analytics navigation update, 2026-09-17: the duplicated WDF and LaundroPortal report menus are replaced by one Business reports list containing Sales, Trends, Products, Cash & Voids, Staff & Ops and Customers, plus a separate Evidence link. Legacy `lp-*` hashes resolve to the canonical subject, and every subject page contains clearly labelled WDF POS and LaundroPortal sections. Changing subjects resets the document to the top.
- Customer decision-view update, 2026-09-17: WDF Customers defaults to five highest-spending customers and five most-frequent customers as separate, aligned rankings. The first three positions use gold, silver and bronze. Ticket and pound distributions plus the grouped ranked-customer comparison remain visible; only the directory is disclosed. LaundroPortal remains on the same Customers page and states the missing shared customer identity instead of inventing a comparison.
- Verification for this update: all 81 web tests, web TypeScript and the 123-module production build pass. Headless Chromium rendered Customers at 1440 x 1000 and 390 x 844 with zero horizontal overflow and zero console errors; both desktop Top 5 panels share exact top and bottom bounds, the directory disclosure works, and switching reports from the bottom resets scroll to zero. Computer-use returned no browser surface, so Playwright supplied the rendered review.
- Executive-dashboard update, 2026-09-17: the owner view now answers five business questions in order: how much each source recorded, whether sales are moving, what drives performance, what needs review, and what people/customer context is available. It publishes six source-labelled KPIs, latest-versus-previous trading-day values, the Python-published month-over-month change, an explicit one-year/YoY unavailable state, five aligned charts, a deterministic exception queue, and direct links to the same six detailed subjects for WDF POS and LaundroPortal.
- No AI-written business summary, recommendation, combined cross-source revenue, fabricated current-day value, or year-over-year result was added. The WDF figure is labelled as workbook-basis paid counter sales; LaundroPortal machine revenue remains separate.
- Current verification: 27 API tests and 82 web tests pass. Workspace TypeScript, ESLint, Prettier, and the 123-module production build pass. Headless Chromium rendered the executive dashboard at 1440 x 1000, 820 x 1000 and 390 x 844 with zero horizontal overflow and zero console errors. The two trend panels and all three driver panels have exact shared row bounds at desktop width. Computer-use itself returned no available browser surface, so the rendered review used the installed Playwright browser.
- Audit remediation update, 2026-09-17: the supplied data-analyst audit is mapped item-by-item in `docs/02-research/PHASE_5_AUDIT_REMEDIATION_MAP.md`. The analytics builder now runs 21 configured data-quality checks before publication; all checks are evaluated, blocking failures stop publication, and non-blocking failures appear in Calculation Evidence.
- WDF and LaundroPortal now each expose the same six report destinations: Sales, Trends, Products, Cash & Voids, Staff & Ops, and Customers. Unsupported LaundroPortal concepts remain explicit unavailable states. Compare Sources and Calculation Evidence identify both vendors and never publish a combined total or misleading difference.
- Current verified commands: 27 API tests, 78 web tests, and 75 analytics tests pass. Workspace TypeScript, ESLint, Prettier, Ruff, mypy, Ruff formatting, OpenAPI generation, the 125-module production build, and `npm audit --omit=dev` all pass; the audit reports zero vulnerabilities.
- Current visual-review constraint: the preview started successfully at `http://localhost:5173`, but computer-use reported no Chrome, in-app browser, app, or other browser surface. Do not claim a fresh visual acceptance for the 2026-09-17 changes. The next agent should perform desktop, tablet, and phone review when a browser becomes available.
- Release remains blocked: `apps/web/public/analytics-artifact.json` is a local-preview artifact containing source-derived detail and must not be deployed through the public asset path.

- Active phase is now `PHASE_5_CROSS_SOURCE_ANALYTICS`, explicitly directed by the owner on 2026-09-15. DEC-034 supersedes the earlier WDF-only client-publication rule.
- Business Analytics has explicit WDF POS, LaundroPortal, Compare Sources, and Calculation Evidence views. LaundroPortal can plot all six daily series by day, month, or year. Compare Sources uses the Python artifact's 365-day aligned series and never sums the two vendors.
- All 31 supplied files are fingerprinted and classified. Tabular files include privacy-safe row and non-empty-cell scan counts; alternate renderings do not double-count values. Both WDF inventory files are classified `NO_RECORDS` because they contain only a saved application shell.
- Latest UI pass, 2026-09-16: analytics uses a compact presentation hierarchy and a mature source palette. WDF uses one blue-grey family (`#355f86`), LaundroPortal uses one muted-plum family (`#66556f`), and comparison charts preserve those two colours. Bright rainbow accents and unnecessary hover movement were removed; warning and negative colours remain semantic.
- Follow-up UI pass, 2026-09-16: the duplicate PageFrame analytics introduction was removed, so a report now starts directly with its report name, source switcher and filters. The Owner Command Center uses a compact three-column by two-row desktop grid; all six operating areas are visible together. Standard chart plots are shorter, and every former horizontal `MixBar` now renders as a compact interactive doughnut while retaining its existing filtering behavior.
- Chart entrance motion is viewport-triggered through `IntersectionObserver`: marks stay paused below the fold, run once when their panel enters view, and remain effectively instant under reduced-motion. Browser verification on Sales found one visible chart panel and six waiting below the fold before scrolling, proving the animation is not running eagerly.
- The application palette now uses mature, desaturated area colours across Command Center, navigation, Finance, Operations, analytics mixes and empty states—not a one-colour dashboard and not the earlier bright rainbow.
- KPI cards, report navigation and chart panels are denser without changing any metric, filter, authorization rule, route, source boundary or calculation. Charts animate once on entry and honor `prefers-reduced-motion`; there is no fake live-update behavior.
- Latest executive-dashboard pass, 2026-09-16: Executive Dashboard is now its own owner-only product area and the first Workspace rail item. Business Analytics opens Sales directly and no longer contains Overview. The Workspace order is Executive Dashboard, Business Analytics, Orders, Store Operations and Inventory; Workforce Management is isolated under People.
- Executive Dashboard uses four source-labelled headline KPIs and two visibly distinct source lanes. Both WDF POS and LaundroPortal show Sales, Trends, Products, Cash & Voids, Staff & Ops and Customers; absent semantics are stated explicitly rather than substituted with unrelated data.
- Each source lane owns a compact 96px monthly revenue visual. At 1440px the plots are 470px wide side by side; at 390px the document exactly matches the viewport width. Doughnuts use a viewport-triggered 0-to-360-degree clockwise reveal with constant opacity, not a fade.
- Latest verification: 77/77 web tests, TypeScript, ESLint and the production web build pass. Browser checks at 1440 x 1000 and 390 x 844 confirmed exact rail order, source separation, compact chart geometry, no horizontal overflow, Sales as the analytics default, and Overview absent from the rail.
- Next work: add export for the exact selected comparison population and complete visual inspection of the remaining report pages at tablet and wide widths. Do not claim hourly, customer, or inventory comparison without new source fields.

- Latest navigation change, 2026-09-16: the standalone `#analytics` directory/library page is gone and the route opens Sales directly. Overview is not part of Business Analytics.
- Business Analytics is now a normal link in the contextual rail. Do not restore a hover/focus flyout, radial menu, umbrella, SVG connectors or report-card overlay; the owner explicitly removed that interaction on 2026-09-16.
- Latest screenshot-led cleanup, 2026-09-15: analytics report text and controls are legible, a direct Back control exists on operational screens and a larger report-library back control exists inside reports, the prose-heavy Finance hero was removed, and all animated spinner/pulse treatments were removed. No visible AI-generated/thinking labels exist.
- The desktop Business Analytics rail item now reveals eight responsive report cards on hover or keyboard focus; the active analytics area exposes a two-column mobile report grid. The in-report selector uses the same larger card language across all eight sections.
- Sales, Trends and Products begin with source-backed KPI cards. Sales adds monthly sales; Trends adds weekly sales and best/slowest/average context; Products makes item/category visuals filterable. Month and service slicers apply consistently to those supported WDF reports through the existing integer fact table.
- Latest checks: 50/50 web tests passed, including a new service-filter reconciliation; workspace TypeScript type checking, ESLint and web production build passed. Visual inspection did not run because both available computer-use browser targets were unavailable. No preview server was left running.
- Latest owner-approved UI change, 2026-09-15: Revenue & Loss is now a separate owner-only `#finance` destination with WDF revenue, collection, tax, tip, payout, expected-deposit, payment-mix and void panels. Business Analytics now opens a responsive eight-report library at `#analytics`; each card routes to `#analytics/{report}` and the existing calculations/sections remain unchanged.
- Files added: `apps/web/src/features/analytics/AnalyticsHub.tsx`, `apps/web/src/features/finance/FinancePage.tsx`, and `apps/web/src/features/finance/FinancePage.test.tsx`. Shell routing, workspace composition, analytics routing and relevant regression tests were updated.
- Latest checks: 27 API tests and 49 web tests passed; TypeScript, ESLint and production build passed. Visual inspection of the new surfaces did not run because the computer-use environment returned no available browser. Do not claim responsive visual acceptance until a browser review occurs.
- Known release blocker from the code audit: the real analytics artifact is under `apps/web/public` and is copied into `dist`, exposing source-derived order/customer/employee information without the application auth boundary if deployed. Keep the prototype local and move preview data out of deployable public assets before release.

- Updated: 2026-09-16
- Lifecycle: DEVELOPMENT
- Active phase: PHASE_5_CROSS_SOURCE_ANALYTICS
- Phase status: APPROVED_IN_PROGRESS
- Active task: exact-population comparison export and remaining report-by-report tablet/wide review.
- Dashboard upgrade, 2026-09-16 (DEC-034 to DEC-035): client-facing owner analytics publishes WDF POS and LaundroPortal in explicitly separated source views. Never add the vendors together or substitute an unsupported population.
- Business Analytics is sectioned into WDF reports, LaundroPortal, Compare Sources and Methodology. Executive Dashboard is a separate top-level area containing the compact two-source overview.
- Charts are dependency-free SVG/CSS primitives in `apps/web/src/components/charts/`. Do not swap in a charting library without re-reviewing bundle and accessibility; this approach cost 0.08 kB.
- Prototype build, 2026-09-15: the product now publishes real figures from the supplied files under DEC-026 to DEC-028. Python ingests six LaundroPortal daily series, the machine breakdown, the WDF workbook and the WDF timesheet, emitting a deterministic fingerprinted artifact. The Node API serves it behind an `AnalyticsRepository` interface so a vendor API can replace the file source later. Seven measures publish with full definitions and drill-down. Rebuild with `npm run analytics:artifact:publish`.
- To run the local preview with real data from the repository root: `npm.cmd run analytics:artifact:publish`, then `npm.cmd run preview:web`. From inside `apps/web`, the same artifact command is now forwarded to the repository root; follow it with `npm.cmd run preview`. Do not run `cd apps/web` when already inside that folder. The preview reads the published artifact directly and remains development-only.
- Completed outcome: P03-T001 through P03-T005 are complete. The order contract, validated API router, service/repository boundary, authenticated store scoping, responsive queue, exact-order route, individual-order layout, and typed issue-context route are implemented. Unavailable WDF coverage still returns zero records and exact detail returns 503, so the UI remains honest and data-free. The Command Center is now a full-width, role-correct launch workspace; the contextual, area-colored navigation rail mounts only inside an operating area and becomes a bounded drawer below desktop width.
- Completed outcome, 2026-09-15 source analysis: a full read-only analysis pass over both supplied source folders is **complete**. No application code was changed and no source file was modified (fingerprints re-verified). Findings are recorded in `docs/02-research/PHASE_0_SOURCE_AUDIT.md` as five dated addenda, with new prevention rules PR-012 through PR-014. Headlines: all nine WDF CSVs are derived text-extraction artifacts rather than vendor exports; the XLSX is more trustworthy than the PDF summary, which fails its own internal sum; BU-009 is reconciled to −0.06% and explained by voided plus processed-but-unbilled commercial orders; LaundroPortal cycle data is washer-scoped while revenue is all-machine; the VAC paired-event hypothesis is proven; the cross-system customer identity bridge is closed as unachievable on current evidence; the Timesheet total is inflated roughly sevenfold by 53 over-length entries; and daylight-saving behaviour is proven, narrowing BU-007. Do not redo this analysis.
- Source analysis is finished: every substantive file in both folders has been profiled. What remains unprofiled is only thin previews (Open Drawer 30/2,652, Shift 8/790, Machine Starts detail, Top Customers, the Inventory HTML dump) whose sole finding — that they cannot support a metric — is already recorded.
- Next permitted action: after receiving the WDF API contract and credentials plus the production personal-data handling policy, implement the repository adapter, ingest/reconcile the complete order source, and verify that queue totals, filters, selected-order detail, and lineage agree end to end.
- Nothing further can be learned from the supplied files. The binding constraint is now external: client answers to `docs/01-product/CLIENT_QUESTIONS.md` (items A, B, C and G are hard gates) and vendor API access. Do not manufacture progress by re-profiling sources or by inventing metric definitions that questions A, B, C and G exist to settle.
- Candidate work that is unblocked but **not yet authorized**: ingesting the five LaundroPortal 2025 daily-history series, which are proven complete for the calendar year and whose semantics are now established. This is outside Phase 3 scope and requires a new approved phase before any code is written.
- Blocking external inputs: live Clerk and Neon credentials; WDF and LaundroPortal API contracts; confirmed store timezone; production personal-data retention policy.
- Open client questions: registered in `docs/01-product/CLIENT_QUESTIONS.md`. The delivery team does not own the source data and cannot answer business questions about it; they must be put to the client. Items A, B, C and G there are hard gates on any published figure. Do not guess, default, or silently resolve them.
- Observed Git baseline: `abfdcb4`; the extensive working-tree changes above it are uncommitted and must be preserved.
- Running processes: none verified at handoff time. Start a fresh development server when previewing the application.
- Do not redo: Phase 0 source profiling, Phase 1 foundation, the Phase 1 landing repair, or the Phase 2 WDF workbook run unless new evidence or a failing regression requires it. Do not present the 30-row order preview as a complete queue.

## Claude Code continuation brief

### Product contract

- This is a purpose-built operating workspace for one laundromat store, not a generic CRM and not a multi-store product.
- The owner sees the complete store. Managers see Orders and Workforce only within their authorization scope; they never receive Analytics or Finance access.
- A manager's employee access is derived on the server from effective-dated `manager_assignments` tied to the authenticated actor. Never accept a browser-supplied manager or store identifier as access scope.
- Managers may see order price and payment state without gaining access to financial dashboards.
- The Command Center is the full-width post-login launch surface. It has no duplicate side rail. The contextual rail mounts only after entering an area and becomes a bounded drawer on phone/tablet widths.
- UI quality is a product requirement: modern, editorial, responsive, keyboard-usable, visually coherent, and clearly specific to laundromat operations. Preserve the Omrix light-neutral/black-identity/pastel-card language and the area-specific accent mapping in `area-theme.ts`.

### Data and evidence contract

- Never add user-visible demo records, fabricated totals, placeholder KPIs, invented statuses, AI recommendations, or implied connection success.
- Every displayed record or number must be traceable to a verified source. A missing or incomplete source must remain visibly unavailable or partial.
- Original WDF POS and Laundro Portal files are immutable evidence. Fingerprint and retain them; never normalize by overwriting or deleting the originals.
- Every ingested row must end as accepted or quarantined with an explicit reason and lineage. Quarantine is not deletion, and quality improvements must not be achieved by silently dropping difficult records.
- Preserve nullable fields as unknown. Do not replace missing customer, payment, promise, stage, assignment, note, or event values with assumptions.
- Names alone never merge customers. Use source IDs, verified contact identifiers, or an explicitly reviewed mapping; unresolved identities remain visible.
- LaundryOps-AI is an interaction-pattern reference only. Its seeded records, AI claims, calculations, and business rules are not Wavemax authority.
- The Colerain artifact is an analytics/methodology reference only. No metric may ship until its definition, filters, exclusions, time basis, source coverage, lineage, drill-down, and export population are approved and proven.
- Data Sources must report connection truth only: source name, connected/not connected, last successful check when known, and applicable error. WDF and LaundroPortal are currently not connected.

### Current implementation boundary

- P03-T001 through P03-T005 are complete. The present Orders experience proves contracts, authorization, routing, responsive states, and honest unavailable behavior; it does not publish a complete live queue.
- The supplied WDF Order List contains only 30 displayed rows from a reported 4,319 orders and covers 2025-12-29 through 2025-12-31. It must never be described or rendered as complete operational coverage.
- The annual WDF sales workbook proves 5,119 accounted sales rows, not a complete order lifecycle.
- The Python ingestion service is currently an offline batch boundary. It is not connected to the Node API or Neon.
- Database migrations are designed and tested but have not been executed against Neon. Do not report the database as populated.
- Analytics, Finance, Inventory, and most Workforce presentation surfaces remain data-free until their source and phase rules are approved.
- Phase 4 and later work is not implicitly authorized by access to the repository. The current permission remains bounded to approved Phase 3 work and explicitly requested repairs within that scope.

### Unresolved decisions and hard gates

- `BU-008` must be surfaced, not silently resolved: DEC-021 gives managers an Inventory launch card, while the server authorization policy does not grant manager Inventory access.
- Production order publication and Phase 3 completion require the WDF API contract/credentials or another independently verified complete export, plus an approved production personal-data handling policy.
- Store timezone is unconfirmed. Evidence suggests Cincinnati/`America/New_York`, but it is not authoritative; do not ship day/week/month/year bucketing as final until confirmed.
- Forecasting target and method remain unapproved. Do not implement or label Holt-Winters forecasts as authoritative.
- LaundroPortal/Laundrolux API integration is Phase 7 and blocked on vendor access. In project language they refer to the same second platform; the evidenced vendor identity is LaundroPortal/Laundroworks.

### Safe first actions for the receiving agent

1. Follow `AGENT_START.md` completely and report lifecycle state, active scope, contradictions, blockers, verification evidence, and next permitted action before editing.
2. Inspect `git status` before touching files. The working tree intentionally contains a large uncommitted replacement of earlier dummy-data-heavy code; preserve all user changes and do not reset, restore, or mass-delete it.
3. If the required WDF contract, credentials, and privacy policy are still absent, do not simulate the repository adapter or mark P03-T006 complete. Work only on a newly explicit, in-scope human request.
4. Keep OpenAPI as the contract source of truth, generated artifacts generated, and the Web -> contracts -> API -> service/repository dependency direction intact.
5. After any implementation, run the applicable commands below, perform real responsive/accessibility inspection for UI changes, and update `PROJECT_STATE.md`, the active phase document, `AGENT_HANDOFF.md`, and `.agent-system/*` with only evidence that actually ran.
6. Never commit secrets, credentials, raw personal records, retained source files, or generated business claims. Never guess around a contradiction or missing business rule; record and escalate it.

## Last verified commands

Run from the repository root:

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run lint
npm.cmd run format:check
npm.cmd run build
npm.cmd audit --audit-level=high
npm.cmd run contracts:generate
npm.cmd run analytics:test
npm.cmd run analytics:lint
npm.cmd run analytics:format:check
npm.cmd run analytics:typecheck
```

For a local, data-free role preview:

```powershell
npm.cmd run preview:web
```

The role preview is development-only. It must remain excluded from production behavior and must never be treated as authentication evidence.

Latest results on 2026-09-15: 27 API tests and 49 web tests passed; workspace TypeScript checks, ESLint and API/web production builds passed. Earlier application surfaces were reviewed responsively, but the new report-library and Revenue & Loss layouts still require browser inspection. The analytics suite separately passed all 70 tests using a fresh basetemp; the default script can fail when OneDrive locks its fixed `.pytest-basetemp` directory. Neon migration execution, live operational-order ingestion, and populated Phase 3 reconciliation remain unverified because credentials, the WDF API contract, and the production personal-data policy are unavailable.

Latest Phase 5 chart-cleanup result on 2026-09-15: 75 web tests, workspace TypeScript, ESLint, and the API/web production build pass. Source comparison now uses responsive grouped columns (WDF blue, LaundroPortal purple), grain-specific calendar controls, and English period labels. LaundroPortal measures use separate column charts and scales; machine-class revenue uses the only new doughnut, a verified part-to-whole view. The previous source narrative and both relevant line/area charts are gone. No browser target was available, so phone/tablet/desktop visual inspection is still required before P05-T005 can close.

Latest analytics-navigation result on 2026-09-16: the active Analytics area owns a static report index in the left rail, grouped into WDF reports and Sources & evidence. The duplicated page-level source and report tab rows are gone. Month and service slicers are collapsed behind a compact Filters disclosure, while active filters remain visible and removable. Browser checks at 1440 x 1000 and 390 x 844 found no horizontal overflow; the slicers were hidden initially and visible after disclosure. Web tests, typecheck, ESLint and the 125-module production build pass.

Latest Executive Dashboard refinement on 2026-09-16: the overview moved out of Business Analytics into `#executive`. The new page uses source-labelled headline KPIs and distinct WDF POS and LaundroPortal lanes for the six requested subjects, with compact source-owned trend charts. Business Analytics opens Sales directly. Doughnuts reveal clockwise from zero only on viewport entry with constant opacity. Browser checks at 1440 x 1000 and 390 x 844 found no overflow; all 77 web tests, TypeScript, ESLint and the production web build pass.

Latest refresh-safe Executive revision on 2026-09-18: revenue comparisons are no longer three small
cards in one row. Rolling and monthly reports share a large two-column row and the yearly coverage
report spans the next row; plots are 190 pixels high. The ambiguous negative-deposit label is now
`Cash sales less payouts`, with both inputs shown. Visible `Partial` wording is replaced by `Source
limits` and exact coverage facts. Dynamic interpretive paragraphs were replaced by fixed metric
definitions, while values and evidence remain deterministic. Chromium at 1440, 1309, 1024 and 390
pixels found no horizontal overflow or visible `Partial` label. All 88 web tests, 77 analytics tests,
the production web build, scoped ESLint, scoped Prettier and Ruff pass. Repository-wide ESLint still
reports the two previously existing React Compiler findings in `primitives.tsx` and
`AnalyticsPage.tsx`.

Latest shell and chart repair on 2026-09-18: Orders, Store operations and Inventory now use the same
compact top-bar hierarchy as Executive and Business analytics; their oversized duplicate canvas
headings and scope strips are gone. Doughnut charts animate once on viewport entry with an SVG mask
that sweeps clockwise from 0% to 100%, with reduced-motion preserved. Store operations uses full weekday and 12-hour
labels in both the busiest-period KPI and heatmap. Chromium verified 1440px and 390px layouts with no
overflow or duplicate visible H1. All 89 web tests and the production build pass; scoped ESLint and
Prettier pass.

UI redesign constraint recorded on 2026-09-18: preserve the current chart motion semantics across the
planned Elera-inspired redesign. Vertical bars grow from the baseline, horizontal bars reveal from
left to right, line and area series draw from left to right with their points, and doughnuts sweep
clockwise from 0% to 100%. Colours and timing may follow the new visual system, but the motion types,
one-time viewport trigger and reduced-motion behavior must remain.

## Usage limit and agent transfer procedure

Before stopping because of a usage limit, context limit, agent transfer, or interrupted session:

1. Update `PROJECT_STATE.md`, `.agent-system/task-state.json`, and the active phase task table with the exact truthful state.
2. Replace the Current handoff section above with the active task, completed work, incomplete work, changed files, last successful command, latest failure, next exact command, blockers, running process IDs, and anything that must not be repeated.
3. Update `.agent-system/verification-results.json` with only checks that actually ran.
4. Record reusable failed approaches in `docs/05-bugs/FAILED_APPROACHES.md` and validated defects in `docs/05-bugs/BUG_INDEX.md`.
5. Never place secrets, credentials, personal records, raw source rows, or unverified claims in the handoff.
6. If code is mid-edit or checks are failing, say so explicitly. Never describe unfinished work as complete.

The receiving agent must read `AGENT_START.md` and all mandatory Project Brain files, then this handoff, inspect the working tree, and resume from the listed next action.
