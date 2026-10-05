# Repository Structure and Code Ownership

## Status

- Revision: 1
- Status: APPROVED DIRECTION
- Decision: DEC-009
- Application directories are created only by an approved implementation phase.

## Intended top-level structure

```text
wavemax-lavendaria-laundry/
├── apps/
│   ├── web/                    React and TypeScript browser application
│   └── api/                    Node.js and TypeScript operational API
├── services/
│   └── analytics/              Python analytics and data-quality service
├── packages/
│   ├── contracts/              OpenAPI source and generated clients/types
│   ├── database/               Neon PostgreSQL schema and migrations
│   └── test-support/           Test-only builders; never product data
├── docs/                       Project Brain and architecture evidence
├── scripts/                    Small repository-level operational scripts only
├── AGENTS.md                   Codex entry point
├── CLAUDE.md                   Claude entry point
├── AGENT_START.md              Shared agent contract
└── PROJECT_STATE.md            Current approved state
```

Do not create empty speculative packages. Add a directory only when an approved task needs it.

## Frontend ownership

```text
apps/web/src/
├── app/                        Application boot, routing, providers, role gates
├── features/
│   ├── command-center/
│   ├── orders/
│   ├── analytics/
│   └── workforce/
├── components/
│   └── ui/                     Reusable presentation primitives only
├── lib/                        Domain-neutral browser infrastructure
├── styles/                     Tokens, foundations, and global styles
└── main.tsx
```

Each feature owns its pages, components, hooks, queries, types, tests, and formatting that is specific to that feature. Do not put business calculations in React components. Do not fetch directly from arbitrary components; feature query modules call the generated API client.

Reusable UI primitives contain no Wavemax business rules. A component becomes shared only when multiple features use the same stable behavior.

## Node API ownership

```text
apps/api/src/
├── app/                        Server construction, middleware, errors, configuration
├── modules/
│   ├── auth/
│   ├── orders/
│   ├── workforce/
│   ├── command-center/
│   ├── analytics-access/
│   └── data-sources/
├── infrastructure/             Database/client adapters and external boundaries
└── server.ts                   Process entry point only
```

Within a module, separate transport, validation, service/business rules, repository/data access, policies, and tests when those responsibilities exist. Routes parse validated input and return responses. Services own operational rules. Repositories own database queries. Authorization policies run before protected data is loaded.

Do not import another module's repository directly. Use its public service or an explicit contract.

## Python analytics ownership

```text
services/analytics/
├── app/
│   ├── api/                    FastAPI routes and request/response schemas
│   ├── ingestion/              File inventory, fingerprints, parsers, row outcomes
│   ├── quality/                Validation, quarantine, scorecards, reconciliation
│   ├── metrics/                Versioned definitions and deterministic calculations
│   ├── forecasting/            Approved statistical models and back-tests
│   ├── storage/                Controlled database/object-storage adapters
│   └── observability/          Safe structured logging and run evidence
├── tests/                      Mirrors the application domains
└── pyproject.toml
```

API routes do not contain calculations. Parsers preserve source meaning and produce typed row outcomes. Quality rules never delete rows. Metric modules own formulas and calculation lineage. Forecasting remains separate from historical actuals.

## Contract ownership

- OpenAPI is the source of truth for HTTP contracts.
- Generated TypeScript and Python artifacts are never hand-edited.
- Contract generation and drift checks run in verification.
- Internal database models are not exposed directly as public API responses.
- Dates, timezones, money, identifiers, pagination, errors, and missing values have explicit serialized forms.

## Database ownership

- `packages/database` owns schema definitions and migrations.
- Node owns transactional operational writes.
- Python writes only to explicitly assigned ingestion, quality, lineage, and analytical tables or through an approved interface.
- Shared-table write ownership requires an architecture decision and concurrency tests.
- Migrations are additive where possible, reviewed, reversible where practical, and never generated or applied casually.

## Dependency direction

```text
Web -> generated contracts -> Node API
Node modules -> database package / approved analytics client
Python API -> analytics domains -> storage adapters
Database and contracts do not depend on application features
```

Forbidden dependencies include web code importing server/database internals, routes importing another module's repository, database code importing UI/API code, and shared packages importing application packages.

## Helper-function policy

Use this order:

1. Keep one-use logic in the owning function when it remains clear.
2. Extract feature-specific reuse beside that feature.
3. Extract domain-level reuse inside that domain module.
4. Promote only genuinely domain-neutral reuse to a shared package.

Every extracted helper needs a clear name, narrow inputs/outputs, defined null/error behavior, and focused tests when it carries logic. Do not create generic `utils.ts`, `helpers.py`, `common`, or `misc` dumping grounds.

Formatting and mapping helpers must not silently implement financial, authorization, identity, or data-quality policy.

## File and function discipline

- One file has one clear reason to change.
- Entry-point files only assemble dependencies and start the application.
- Split by responsibility before a file becomes difficult to review; do not split merely to satisfy a line-count rule.
- Prefer explicit names such as `calculate_on_time_rate.py` over vague names such as `processor.py`.
- Public module exports are deliberate; internal files remain internal.
- Avoid circular dependencies and hidden mutable global state.
- Configuration comes from validated environment/configuration modules, never scattered environment reads.
- Errors use typed/domain-specific categories and preserve the original cause.

## Refactoring rule

Refactoring is not automatically included with feature work. Refactor only when the approved task requires it or when the current structure prevents a safe implementation. State the evidence, bounded scope, behavioral invariants, tests, and rollback before starting.

Prefer small preparatory changes with no behavior change, verified separately, instead of combining a large restructure with new business logic.

## Enforcement

As the codebase is created, add:

- TypeScript and Python format/lint/type checks.
- Import-boundary/dependency tests.
- Contract-generation drift checks.
- Tests preventing duplicated metric definitions.
- File-level ownership documented through module entry points.
- CI that runs only the applicable complete checks and rejects uncommitted generated drift.

These controls must be introduced with the first approved phase that creates the affected code, not postponed until after architecture drift occurs.
