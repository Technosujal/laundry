# Phase 5 - Cross-source analytics

## Control

- Status: APPROVED_IN_PROGRESS
- Approved by/date: owner, 2026-09-15
- Requirements: REQ-010, REQ-012, REQ-013, REQ-024, NFR-002-NFR-005

## Owner outcome

The owner can inspect WDF POS and LaundroPortal separately, compare their recorded revenue streams
at the day, month, and year grain, and see why unsupported comparisons remain unavailable.

## Evidence rules

- Never sum WDF paid counter sales and LaundroPortal machine revenue into one revenue figure.
- No numeric difference or combined total is published because the sources record different business
  events. Comparison preserves the two values side by side for matched calendar periods.
- Hourly comparison remains unavailable because LaundroPortal supplies calendar dates without a
  time-of-day field.
- Customer comparison remains unavailable because the sources contain no safe shared customer key.
- Every supplied file is fingerprinted and classified. Every tabular file is fully scanned for a
  privacy-safe row and populated-cell count. Scanning a cell does not make it a valid metric input.
- The two supplied inventory files remain `NO_RECORDS`: they are saved application shells and contain
  no inventory rows.
- Cross-source time comparisons use grouped columns only: WDF POS is blue and LaundroPortal is purple.
- A day selection resolves to one actual calendar date; it must not silently retain an annual total.
- LaundroPortal measures with different units or business meanings use separate charts and scales.
- Doughnut charts are allowed only for verified part-to-whole populations, such as washer-versus-dryer
  contribution to total machine revenue.

## Tasks

| ID | Task | Status |
|---|---|---|
| P05-T001 | Publish deterministic day/month/year WDF-versus-LaundroPortal comparison | COMPLETE |
| P05-T002 | Add separate WDF, LaundroPortal, comparison, and calculation-evidence views | COMPLETE |
| P05-T003 | Add day/month/year exploration for every LaundroPortal daily series | COMPLETE |
| P05-T004 | Account for every supplied file and scan every supplied tabular cell | COMPLETE |
| P05-T005 | Complete responsive browser review and scoped export parity | IN_PROGRESS |
| P05-T006 | Apply the Elera-inspired visual system while preserving behavior and chart motion | IN_PROGRESS |

## Latest implementation evidence

- Bright accents now extend beyond chart marks to source switchers, badges, KPI rules and icons, category rankings, information panels, filters and semantic statuses. The migration keeps neutral text and white report surfaces quiet for legibility while replacing matte source/category accents throughout the application.
- The report palette now uses bright, stable semantic colors through the shared chart primitives. WDF remains blue and LaundroPortal remains purple; other established categories translate to teal, green, amber, orange, cyan or red without changing values, order, legends, filters or chart types. The Executive stacked source chart follows the same mapping. Browser-computed styles confirm the full existing bar, line, area, point and clockwise ring-sweep motion set remains active.
- Plain-language copy uses noun-phrase headings rather than questions across the application. The owner-review card distinguishes production value from payment status: 31 records lack a paid-sales match, while payment remains unconfirmed. Responsive review also removed the Executive monthly-source chart's fixed mobile minimum width.
- The source-comparison line/area chart was replaced by paired bars with stable vendor colours.
- The 365-option day dropdown was replaced with a native calendar-day control; month and year have
  grain-appropriate controls and every displayed period is formatted in English.
- Six unlike LaundroPortal measures no longer share one selectable chart; each now has an independent
  column chart and scale, with daily browsing bounded by a chosen calendar month.
- The narrative LaundroPortal callout was removed. Machine revenue by class now uses a doughnut because
  washer and dryer revenue are parts of the same verified total.
- Verification on 2026-09-17: 78 web tests, 27 API tests, 75 analytics tests, workspace TypeScript,
  ESLint, Ruff, mypy, formatting, contract generation, dependency audit, and the production build pass. Browser
  inspection remains outstanding because no browser surface was available in this environment.
- The analytics shell, KPI cards and chart panels now use a compact hierarchy. Source identity is
  carried by a stable two-colour system: WDF bright blue and LaundroPortal bright purple. Different
  measures no longer receive arbitrary rainbow colours.
- Charts animate once when mounted and stop. Reduced-motion preferences disable the visible motion;
  there are no simulated refreshes or changing values.
- Browser geometry checks pass at 1440 x 1000 and 390 x 844 with no horizontal page overflow. Staff &
  Ops was visually inspected at both widths. The remaining report pages still require a full visual
  sweep before P05-T005 can close.
- The redundant generic analytics header is gone; reports begin at the selected report title. Chart
  plots are shorter, and proportional mix bars were replaced by compact interactive doughnuts without
  changing their exact values or filter callbacks.
- Entrance motion is intersection-triggered. A chart below the fold remains paused until its panel is
  on screen, then runs once. The palette now uses multiple bright business colours across the
  application while vendor comparison colours remain stable.
- The rail-level umbrella menu was removed by owner direction. Business Analytics remains one direct
  area link; while that area is active, a static nested report index appears beneath it. The duplicate
  source and report rows were removed from the canvas, with no hover overlay or connector geometry.
- Executive Dashboard is now a separate owner area above Business Analytics. Business Analytics has
  no Overview report and opens Sales directly. The executive surface carries four source-labelled
  headline KPIs and separate WDF POS and LaundroPortal lanes for all six requested business subjects.
- Unsupported semantics remain explicit: the LaundroPortal machine export is not relabelled as product
  sales, and management-card activity is not presented as employee identity or staffing coverage.
- Month and service slicers start collapsed behind a Filters disclosure. Opening it reveals the
  existing exact cross-filter controls; active selections remain visible and removable when closed.
  Desktop and 390-pixel browser checks confirmed the behavior without horizontal overflow.
- The disclosure, source badge and long-form English period now live in the active Analytics rail;
  the selected report name occupies the application top bar and the duplicate canvas heading is gone.
- Doughnuts use a larger reserved plot column and a viewport-triggered clockwise 0-to-360-degree
  reveal with constant opacity, eliminating centre-label collisions and fade-in/fade-out behavior.
- Browser inspection at 1440 x 1000 and 390 x 844 confirms the exact requested Workspace order,
  two visibly distinct source lanes, 470px desktop source charts, and no horizontal page overflow.
  The earlier browser evidence remains historical. Current code checks pass, but the 2026-09-17 audit
  remediation still needs a fresh visual review because the computer-use inventory returned no browsers.
- Executive Dashboard now follows a fixed owner decision sequence instead of repeating twelve equal
  source-summary cards. Six source-labelled KPIs lead into trading-day, month-over-month and honest
  unavailable year-over-year context; five compact visuals cover source trends, WDF products,
  day/hour order activity and LaundroPortal machine-class revenue. A deterministic five-row exception
  queue links to exact detailed reports; it contains no generated prose or recommendation.
- The current executive revision was rendered headlessly at 1440 x 1000, 820 x 1000 and 390 x 844
  after computer-use returned no browser surface. All three widths have zero horizontal overflow and
  no console errors. Desktop trend and driver rows align exactly, and the web regression suite now
  passes 80 tests. TypeScript, ESLint, Prettier and the 123-module production build also pass.
- The contextual rail now exposes one subject-based report index instead of duplicating WDF and
  LaundroPortal links. Each of the six subject routes contains separate, labelled source sections;
  legacy `lp-*` URLs canonicalize to the matching subject. Report changes reset the document to the
  top.
- The WDF Customers default is a compact decision view with independent Top 5 spend and order-count
  rankings. Gold, silver and bronze mark the leading three positions. Detailed distributions and the
  grouped sales-versus-matched-void comparison remain visible; only Customer directory is disclosed.
  LaundroPortal customer evidence stays in the same route and does not claim card accounts are unique
  people.
- Headless Chromium verified the unified rail and Customers route at 1440 x 1000 and 390 x 844 with
  zero horizontal overflow and zero console errors. The desktop rankings share exact row bounds,
  each contains five customers, the detail disclosure works, and cross-report navigation resets
  scroll to zero. All 81 web tests, web TypeScript and the 123-module production build pass.
- Every subject now has one sticky, left-aligned source switcher for moving between WDF POS and
  LaundroPortal; the source headings themselves are static. The active Business Analytics rail item collapses and reopens its nested report
  index. Standalone LaundroPortal line/area cards use the full content width; the line and area reveal
  together from left to right and reduced-motion remains supported.
- The Staff & Ops Hours unavailable narrative was removed. Customers keeps the ticket and pound
  distributions visible, replaces the complete detail table with a grouped dollar chart for recorded
  sales versus exact-name-matched void value, and hides only the customer directory.
- Verification after this pass: 81 web tests and the 123-module production build pass. Chromium at
  1440px and 390px confirmed the sticky source controls, rail collapse/reopen, 1092px standalone chart
  inside a 1160px content region, grouped customer chart, zero horizontal overflow and zero console
  errors.
- Doughnuts are responsive SVG ring-sector paths with stable category colours, direct percentage/value
  legends, hover/focus selection, non-active dimming and active percentage in the centre. The obsolete
  conic mask and narrow-card width override were removed after they produced clipped C-shaped rings. Store
  Operations shows only the five leading departments and opens a monthly drill-down for the selected
  department. Standalone operations charts fill the content width.
- The sticky source control is one left-aligned two-button WDF POS/LaundroPortal switcher; source
  headings are static. Line and area charts draw
  left-to-right over 1.2 seconds. Executive KPI labels avoid repeating their source badges; badges do
  not overflow narrow cards, rail icons illuminate on hover and Executive uses distinct gauge
  iconography. Product-detail cards share row bounds; fees default to five lines with full disclosure.
- Verification after the visualization pass: 82 web tests and the 123-module production build pass.
  Chromium at 1440px and 390px confirmed all interaction and geometry above, zero horizontal overflow
  and zero console errors.

## Remaining acceptance work

- 2026-09-18: Workspace cards no longer print `Open...` action text. A single right-aligned arrow carries the navigation cue. Module icons use bright, controlled area colors with white linework and hover/focus illumination; the real WaveMAX wordmark retains a restrained blue halo. General route/card/table motion is shorter, while graph motion is untouched. All 89 web tests and the 124-module build pass; changed-file lint and formatting pass. Fifteen browser checks across Command Center, Executive and Orders at five widths found no overflow or console errors.
- 2026-09-18: The owner approved the mature white preview and the first shared-system implementation is complete. The WaveMAX logo, store and role controls, complete role-authorized module set, routes, report controls, calculations and chart interactions remain intact. White/soft-blue tokens, blue navigation states, navy identity controls, quieter shared panels and larger white launch cards now apply across the application. All 89 web tests, web typecheck and the 124-module production build pass. A Playwright matrix covering Command Center, Executive, Sales, Orders, Store Operations, Inventory, Workforce and Data Sources at 1440, 1309, 1024, 820 and 390 pixels found zero overflow and zero console errors. Existing bar, line and doughnut animation names were verified unchanged. Report-level refinement remains in progress.
- 2026-09-18: P05-T006 shared-system pass is implemented. The application uses a compact lime-active rail, shorter top bar, warm neutral canvas, flatter shared cards and responsive spacing derived from the supplied reference video. Header, route and launch-card motion were added without modifying chart mark animation. All 89 web tests, web typecheck and the 124-module build pass. Headless Chromium reviewed Command Center, Executive, Sales, Orders and Operations at 1440, 1024 and 390 pixels with no overflow or console errors. Computed animation names confirm vertical, line and ring chart motion remains intact. Report-specific refinement remains in progress.
- 2026-09-18: Orders, Store operations and Inventory now use the same compact application-header
  hierarchy as Executive and Business analytics; duplicate oversized canvas headings and scope strips
  were removed. Doughnuts again use a one-time viewport-triggered ring reveal with reduced-motion
  support. Store operations shows full weekday and 12-hour time labels in its busiest-period KPI and
  heatmap. Chromium verified Operations at 1440 and 390 pixels, all three routes at both widths, and
  zero horizontal overflow. All 89 web tests and the production web build pass.
- 2026-09-18: Executive revenue comparisons now use two large report columns with year-over-year
  spanning the next row. Rolling and monthly cards show the comparison rate without repeating a
  second currency total. Visible `Partial` labels were replaced by `Source limits` and exact coverage
  facts. Helper copy defines each measure with fixed wording; calculated values remain separate and
  refresh deterministically. Headless Chromium verified 1440, 1309, 1024 and 390 pixel widths with no
  horizontal overflow. All 88 web tests and 77 analytics tests pass; the web production build passes.

- Complete the remaining report-by-report visual review at tablet and wide widths.
- Add export of the exact selected comparison population before claiming REQ-011 complete.
- Do not mark customer, hourly, inventory, or full-business revenue comparison complete without new
  source evidence.
