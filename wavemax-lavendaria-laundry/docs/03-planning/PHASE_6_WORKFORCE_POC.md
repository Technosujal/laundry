# Phase 6 - Workforce POC

## Control

- Status: APPROVED_IN_PROGRESS
- Approved by/date: owner, 2026-09-20
- Requirements: REQ-004, REQ-006, REQ-017, REQ-018, NFR-001, NFR-005, NFR-006
- Owner outcome: owner, manager and employee can sign in and use role-scoped workforce workflows in the existing WaveMAX visual system.

## Scope

- Keep Clerk invitation-only sign-in for the POC. Do not copy the reference's mock-password, quick-login, or open-registration behavior. A separate employee sign-in experience is deferred.
- Add `EMPLOYEE` as a third application role. Employees may read and act only on their own workforce records. Managers may read and act only on effective-dated direct reports. Owners may see the store workforce.
- Copy the owner-supplied archive's complete Workforce Management module into the development-only preview, including its employee directory, scheduling, attendance, timesheets, leave, coverage, approval, notification, calendar and overview behavior. Keep the WaveMAX shell, production routes and other product areas unchanged.
- The owner approved sample workforce records for the POC on 2026-09-20. Keep a small, unmistakably labelled sample set inside the development-only local preview. It must not feed analytics, leave the preview, or enter the production bundle. Owner-created preview records are local to the browser. Production remains source-backed/user-entered through authenticated APIs, with no seed fallback.
- No seeded staffing targets, machine states, AI copy, or pretend production approvals.
- Preserve the existing one-store scope and server/database authorization boundary. Every write must have an audit event and role-denial test.

## Implementation order

| ID | Task | Status |
|---|---|---|
| P06-T001 | Add employee role to session, database access scope, POC preview and navigation without granting finance, analytics, orders or other staff records | IN_PROGRESS |
| P06-T002 | Build isolated sample-data workforce interactions for the local three-role POC, then define production identity mapping, records, audit and API contracts | IN_PROGRESS |
| P06-T003 | Build owner/manager directory and effective-dated manager assignment | NOT_STARTED |
| P06-T004 | Build schedules and shift coverage with role-scoped actions | NOT_STARTED |
| P06-T005 | Build attendance and timesheet review with exact source and correction history | NOT_STARTED |
| P06-T006 | Build leave requests, decisions and employee self-service notifications | NOT_STARTED |
| P06-T007 | Verify three-role journeys, cross-manager/self-only denial, responsive screens and regression suite | NOT_STARTED |

P06-T001 is code-complete but remains `IN_PROGRESS` until a rendered responsive review and a live Clerk/Neon path can be checked. Its current tests prove the API area denials and the employee self-only database query shape; they do not prove a deployed login or populated workforce workflow.

P06-T002 has the complete archive Workforce module in the local-only preview: overview, calendar, directory, scheduling, attendance, timesheets, leave, shift coverage, coverage planning, registration approval/add-staff and notifications. The archive's sample records, persistence, deterministic calculations and workflow actions are retained. WaveMAX applies owner, direct-report manager and self-only employee scope around that module. It is intentionally not the production repository/API implementation; the archive's mock-password login is not used.

To inspect locally, run `npm.cmd run preview:web` and use the Owner, Manager and Employee role control. The sample records are labelled on the Workforce page and persist only in that browser's `wavemax.workforce-poc.v1` storage. Do not enter real employee information into this preview.

## External limits

- Neon and live Clerk credentials are unavailable here. Database migrations and live invitation/sign-in cannot be exercised against those services yet.
- The supplied WDF timesheet does not map source employees to Clerk users or managers. It cannot populate self-service or manager views until the owner creates or verifies those links.
- No future staffing target or live schedule source has been supplied. Coverage gaps must be based on approved, entered requirements, not on the reference's fixed numbers.
- The native-app and in-app-browser visual review could not attach to an available browser surface in this environment; responsive visual acceptance remains open even though tests and build pass.
