# WaveMAX Lavendaria Laundry

WaveMAX is a one-store laundromat workspace for owners, managers, and employees. It combines business reporting, operations, historical orders, and Workforce Management while preserving source boundaries and role-based access.

## Product areas

- Executive dashboard — owner-only business measures
- Business analytics — source-labelled WDF POS and LaundroPortal reporting
- Orders and transactions — operational order views
- Store operations and inventory
- Workforce Management — directory, scheduling, attendance, timesheets, leave, coverage, approvals, and notifications

Owners see the full store. Managers do not receive Finance or Business Analytics and may access only their direct reports. Employees receive their own workforce records only.

## Technology

- React + TypeScript + Vite frontend
- Node.js + TypeScript API
- Python analytics and data-quality service
- Neon PostgreSQL schema and Clerk authentication boundary

## Requirements

- Node.js 22 or newer
- npm 10 or newer
- Python and `uv` only when running analytics checks

## Install

From this directory:

```powershell
npm.cmd install
```

## Environment files and secrets

Real environment files are deliberately excluded from Git. Only these safe templates are shared:

- `apps/api/.env.example`
- `apps/web/.env.example`

Create your own local files, then fill in only credentials you are authorized to use:

```powershell
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.example apps/web/.env
```

Never commit `.env`, `.env.local`, API keys, Clerk secrets, database URLs with credentials, or certificates. Use the team’s approved secret manager for shared values.

## Local development

Start the frontend role preview:

```powershell
npm.cmd run preview:web
```

Open `http://127.0.0.1:5173`. The local role selector is development-only.

To run the API after creating `apps/api/.env`:

```powershell
npm.cmd run dev:api
```

The API defaults to `http://127.0.0.1:4000`.

## Workforce Management preview

The local preview includes the complete Workforce Management POC: landing and overview, calendar, employee directory, scheduling, attendance, timesheets, leave, shift coverage, coverage planning, staff registration/approvals, and notifications.

Its sample records are local preview data only. They are not production records, do not feed analytics, and are excluded from the production build. Use the role selector to review owner, manager, and employee journeys. Do not enter real employee data into the local POC.

## Analytics preview

The analytics artifact is local-only and contains source-derived detail. Do not deploy it from `apps/web/public`.

To rebuild it when the approved local source folders are available:

```powershell
npm.cmd run analytics:artifact:publish
npm.cmd run preview:web
```

## Verification

Run the standard web and API checks:

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run lint
npm.cmd run format:check
npm.cmd run build
npm.cmd audit --audit-level=high
npm.cmd run contracts:generate
```

Analytics checks require `uv`:

```powershell
$env:UV_CACHE_DIR=".uv-cache"
uv sync --project services/analytics --all-groups --frozen
npm.cmd run analytics:test
npm.cmd run analytics:lint
npm.cmd run analytics:format:check
npm.cmd run analytics:typecheck
```

## Current limits

- No production vendor API is connected.
- Live Clerk invitations and Neon migrations still require authorized credentials.
- Workforce POC records are not a production workforce repository.
- The public analytics artifact remains a release blocker until it is moved behind authentication.

## Contributor notes

Read `AGENTS.md`, `AGENT_START.md`, `PROJECT_STATE.md`, and `AGENT_HANDOFF.md` before changing application code. Preserve source data, never fabricate business values, and never add AI-generated business output. The product uses deterministic calculations and fixed product copy only.
