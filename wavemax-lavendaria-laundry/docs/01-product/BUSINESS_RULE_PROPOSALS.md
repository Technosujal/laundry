# Business Rule Proposals

## Status

- Revision: 1
- Status: APPROVED
- Approved by/date: owner, 2026-09-14
- Approval required before implementation: COMPLETE

## Manager and team ownership

### Proposed rule

- The owner assigns every employee to one primary manager.
- An assignment has an effective start time and optional end time so transfers preserve history.
- Only the owner may create, replace, or end a manager assignment.
- A manager may see and approve records only when the employee has an active assignment to that manager for the relevant time.
- A manager cannot grant access, assign employees to themselves, or view another manager’s team.
- Employees without an active assignment remain visible to the owner and inaccessible to managers.
- Every assignment change and denied cross-manager attempt is audited.

### Proposed data ownership

The application database owns manager assignments because neither current source has been shown to provide an authoritative reporting hierarchy. Vendor employee identifiers remain attached for lineage but do not decide authorization by themselves.

## On-time orders

### Proposed rule

On-time performance must be channel-specific:

- Store pickup/drop-off order: `ready_at <= promised_ready_at`.
- Delivery order: `delivered_at <= promised_delivery_at`.
- Late completed order: the applicable completion event occurs after the applicable promise.
- Open overdue order: the promise has passed and the applicable completion event has not occurred.
- Not measurable: cancelled orders, missing/invalid promise time, missing required completion event, or an unsupported channel. These records remain visible in a separate data-quality count and are never silently removed.

### Required display

- Show on-time completed, late completed, open overdue, and not measurable separately.
- The percentage denominator contains only measurable completed orders.
- Drill-down lists the exact contributing orders and the promise/completion timestamps.
- Export uses the same filters and records as the displayed calculation.
- Do not calculate this metric until the WDF API confirms event meanings and timestamps.

## Store calendar

- Current operating assumption: open 24 hours per day, seven days per week.
- Proposed timezone: `America/New_York`, based on the supplied Cincinnati, Ohio location evidence.
- Holiday closures, temporary closures, and reduced hours are unknown and must be configurable rather than hardcoded.

## Login and hosting recommendation

### Authentication

Authentication means how the system verifies who is logging in. Authorization means what that verified person is permitted to see or change.

Recommended POC choice: Clerk with invitation-only email accounts. Clerk handles passwords, sessions, reset flows, and invitations. Wavemax’s own database remains responsible for owner/manager roles, manager assignments, and all record-level authorization. Multi-factor authentication should be required before production; the selected Clerk production plan must support it.

Do not write a custom password system.

### Deployment

Deployment means the online services where the frontend, APIs, background data processing, and database run.

Proposed split:

- Frontend: Vercel.
- Node.js operational API: Railway or Render.
- Python ingestion/analytics workers: the same backend provider as the Node.js API where practical.
- PostgreSQL: Neon, already selected.
- Source files: private object storage selected before production ingestion.

The final backend host and object-storage provider can wait until API access clarifies job duration, schedules, file volume, and networking requirements.

## Deferred owner inputs

- API credentials, scopes, documentation, sample responses, and rate limits.
- Production personal-data retention, export, and deletion policy.
- Official brand assets.
- Holiday and exceptional closure schedule.
- Approval or amendment of the manager-assignment and on-time rules above.
