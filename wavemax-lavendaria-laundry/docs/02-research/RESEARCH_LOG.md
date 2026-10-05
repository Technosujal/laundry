# Research Log

Research remains a proposal until explicitly approved.

| ID | Question | Source and access date | Finding | Confidence | Impact | Status |
|---|---|---|---|---|---|---|
| RES-001 | What visual system does Omrix provide? | Framer Marketplace and public preview, 2026-09-14 | General Sans/Inter, responsive SaaS layout, consistent cards, charts, activity, and workflow surfaces; it is primarily a marketing template | HIGH | Use visual language, not product content | REVIEWED |
| RES-002 | What interaction patterns are useful from LaundryOps-AI? | Supplied archive, 2026-09-14 | Order queue/detail and people operations provide useful patterns; seeded values and several AI/coverage displays are not reliable product logic | HIGH | Rebuild behavior from approved rules and real data | REVIEWED |
| RES-003 | What does the Colerain project contribute? | Supplied archive, 2026-09-14 | Provides analytics UI, source files, calculation methodology, Power BI measures, drillable categories, and documented source limitations | HIGH | Treat as analytics evidence and reference | REVIEWED |
| RES-004 | What source data currently exists? | WDF POS and Laundro Portal folders, 2026-09-14 | 31 business files were fingerprinted and profiled; WDF mixes full and preview reports, while Laundro provides complete 2025 daily series plus snapshots outside that period | HIGH | Use the Phase 0 source audit as the POC evidence boundary | REVIEWED |
| RES-005 | What location does the supplied data represent? | Supplied Laundro financial PDF and official WaveMAX location page, 2026-09-14 | Location 2900001 is the Colerain store at 8449 Colerain Ave, Cincinnati, OH 45239 | HIGH | One-store key can be proposed; timezone still needs authoritative confirmation | REVIEWED |
| RES-006 | What platform produced the supplied Laundro files? | Supplied PDF URL/branding, official Laundroworks documentation, and owner clarification, 2026-09-14 | `portal.mitechisys.com` is LaundroPortal for the Laundroworks card system; the owner uses Laundrolux as a name for the same project source | HIGH | Use one connector with an internal evidenced name and retain the alias | REVIEWED |
| RES-007 | Do public API materials settle both connectors? | Official WDF POS support and CCI/FasCard documentation, 2026-09-14 | Public CCI WDF ProLink material documents order and machine-start endpoints, but it does not prove that these are the exact owner credentials/contracts; no confirmed second-connector contract was supplied | MEDIUM | Require vendor-issued credentials, base URLs, scopes, and sample responses before implementation | OPEN |
| RES-008 | Does `stack-2.docx` require an architecture change? | Owner-supplied `stack-2.docx`, SHA-256 `C561E403F8AE15FFD9B4E257866D8A09BCE659CC97807C754621489C0A1EE934`, reviewed 2026-09-14 | Its React, Node, Neon, Clerk, repository-boundary, immutable-source, and layered-data recommendations align with the current direction. Cloudflare Pages conflicts with the later Vercel POC decision; R2, workers, external observability, and notifications remain phase-specific proposals. | HIGH | Keep as external research; use `STACK_2_ASSESSMENT.md` to promote only approved parts | REVIEWED |

## Research rules

- Prefer original files, official vendor documentation, and reproducible calculations.
- Record conflicts and uncertainty.
- Never copy secrets or personal records into this document.
- A finding does not silently become a requirement or architecture decision.
