# Development Loop Policy

## Normal loop

`Approved task -> inspect -> trace -> specify smallest change -> implement -> narrow tests -> broad verification -> visual review -> diff review -> acceptance check -> evidence update`

## Data-logic loop

`Metric definition -> source-field proof -> edge cases -> reference calculation -> failing tests -> implementation -> independent reconciliation -> drill-down/export equivalence -> approval`

## Repair loop

`Failure -> capture evidence -> reproduce -> search bug memory -> hypotheses -> failing regression test -> minimal fix -> verify -> prevent -> record`

## Rules

- Work on one bounded approved task at a time.
- Default maximum is three evidence-driven attempts for the same failure.
- Each new attempt requires new evidence or a meaningfully different hypothesis.
- Record failed approaches.
- Do not broaden scope, weaken tests, change expected values, discard rows, or hide an error to obtain a pass.

## Exit conditions

- Acceptance criteria met: record evidence and continue within the approved phase.
- Approval required, unsafe action, contradiction, or material unknown: stop and escalate.
- Three failed repair attempts: create an escalation report and stop.
