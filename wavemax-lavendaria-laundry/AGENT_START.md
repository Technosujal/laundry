# Wavemax Agent Operating Contract

This is the mandatory entry point for every coding-agent session.

## First action

Read, in order:

1. `PROJECT_STATE.md`
2. `AGENT_HANDOFF.md`
3. `docs/ENGINEERING_STANDARD.md`
4. `docs/01-product/PROJECT_BRIEF.md`
5. `docs/01-product/REQUIREMENTS.md`
6. `docs/03-planning/REPOSITORY_STRUCTURE.md`
7. The active phase referenced by `PROJECT_STATE.md`, if any
8. `docs/03-planning/LOOP_POLICY.md`
9. `docs/03-planning/ESCALATION_POLICY.md`
10. `docs/04-quality/DEFINITION_OF_DONE.md`
11. `docs/05-bugs/BUG_INDEX.md`
12. `docs/05-bugs/PREVENTION_RULES.md`

Report the lifecycle state, approved scope, contradictions, blocking unknowns, latest verification evidence, and next permitted action before working.

## Authority order

When sources conflict, follow:

1. Latest explicit human decision
2. Approved phase scope and acceptance criteria
3. Approved requirements and architecture decisions
4. `PROJECT_STATE.md`
5. Tests and current repository behavior
6. Research notes and proposals
7. Chat summaries

Report contradictions. Never resolve them silently.

## State and approval gates

`IDEA -> DISCOVERY -> RESEARCH -> PLANNING -> AWAITING_APPROVAL -> DEVELOPMENT -> READY_FOR_REVIEW -> ACCEPTED`

Only the human owner may approve a phase or accept its completion. No application code may change during `DISCOVERY`, `RESEARCH`, `PLANNING`, or `AWAITING_APPROVAL`.

## Project invariants

- One store in the current product scope.
- Roles are OWNER and MANAGER for the current scope.
- Managers see Command Center, Orders, and Workforce Management.
- Managers do not see or access Business Analytics or Finance.
- A manager may view and approve only direct reports assigned to that manager, primarily at one location.
- Managers may see order price and payment status.
- Owners may see the complete store, analytics, finance, and workforce.
- Original WDF POS and Laundro Portal files remain immutable.
- Data-quality handling uses validation and quarantine, never silent deletion.
- Every input row receives a documented outcome.
- Dashboard values must have calculation lineage and record-level drill-down.
- No demonstration data appears in the application.
- Recommendations and AI-generated business outputs are currently out of scope.
- Frontend, Node API, Python analytics, database, and generated contracts remain separate as defined in `docs/03-planning/REPOSITORY_STRUCTURE.md`.
- Domain logic belongs to its domain module. Shared helpers are created only after genuine cross-domain reuse is proven.

## Completion response

Every implementation completion must include the task and requirement IDs, exact changes, files changed, verification actually run, visual checks actually performed, documentation updated, remaining risks, and next permitted action.

Before any usage-limit or agent-transfer stop, update `AGENT_HANDOFF.md` and the machine-readable state files exactly as its procedure requires.
