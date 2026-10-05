# Wavemax Agent Instructions

This file is loaded automatically by Codex and other `AGENTS.md`-aware agents.

## Mandatory start

Before planning, editing, or running application code, read completely and in this order:

1. `AGENT_START.md`
2. `PROJECT_STATE.md`
3. `AGENT_HANDOFF.md`
4. `docs/ENGINEERING_STANDARD.md`
5. `docs/01-product/REQUIREMENTS.md`
6. `docs/03-planning/REPOSITORY_STRUCTURE.md`
7. The active phase named in `PROJECT_STATE.md`, if one exists
8. `docs/03-planning/LOOP_POLICY.md`
9. `docs/03-planning/ESCALATION_POLICY.md`
10. `docs/04-quality/DEFINITION_OF_DONE.md`
11. `docs/05-bugs/BUG_INDEX.md`
12. `docs/05-bugs/PREVENTION_RULES.md`

Then report the current lifecycle state, approved scope, contradictions, blockers, and next permitted action.

## Binding rules

- Application code may change only inside an explicitly approved phase.
- Never use fabricated or presentation-only data in the product.
- Never silently delete, exclude, repair, merge, or overwrite source records.
- Every dashboard result must be traceable to its definition and contributing records.
- Role restrictions must be enforced by the API and database query, not only hidden in the UI.
- Deterministic business logic owns calculations. An LLM cannot create, alter, or approve a business result.
- The product has no AI integration. All visible labels, explanations, statuses, and actions are fixed product copy or deterministic templates; never generate narrative text from business data.
- Card helper copy is limited to five words. Titles, values, badges, source evidence, tables, and methodology definitions are exempt.
- Visible headings use short, plain noun phrases. Do not use question-style headings.
- A warning action must open exact source-backed evidence. If exact affected records are unavailable, show the coverage gap and required source export instead of a generic investigation link.
- Incomplete paged exports may be retained as coverage evidence but must not feed calculations, charts, rankings, order records, or owner decisions. A complete replacement becomes eligible automatically after ingestion.
- Keep frontend, operational API, analytics service, contracts, and database code in their documented boundaries. Do not create catch-all files or duplicate helpers.
- Protect customer and employee data. Never put source data, secrets, or credentials in project-brain documents.
- Inspect before editing, make the smallest correct change, verify it, and record truthful evidence.

The complete operating standard is `docs/ENGINEERING_STANDARD.md`.

Before stopping for a usage limit, context limit, interruption, or agent transfer, complete the durable continuation procedure in `AGENT_HANDOFF.md`.
