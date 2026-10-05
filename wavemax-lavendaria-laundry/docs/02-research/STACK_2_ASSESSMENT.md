# Stack 2 Architecture Assessment

## Conclusion

`stack-2.docx` is a useful planning reference, but Wavemax does not need it as a runtime dependency or a second source of architectural truth. The current Project Brain and Phase 1 implementation already cover its core application boundaries. Keep the document as external evidence and promote individual recommendations only through an approved phase or architecture decision.

## Source control

- Source: `C:/Users/ankus/Downloads/stack-2.docx`
- Reviewed: 2026-09-14
- SHA-256: `C561E403F8AE15FFD9B4E257866D8A09BCE659CC97807C754621489C0A1EE934`
- Scope: MVP hosting, storage, authentication, observability, notifications, environments, data layers, background work, deployment, and estimated operating costs.
- Authority: research input only. Later explicit owner decisions and approved phase documents take precedence.

## Comparison with the current system

| Document recommendation | Current Wavemax position | Decision |
|---|---|---|
| React, TypeScript, and Vite frontend | Implemented in `apps/web` during Phase 1 | Already covered |
| Node.js and TypeScript REST API | Implemented in `apps/api` during Phase 1 | Already covered |
| Neon PostgreSQL | Approved by DEC-007 and access schema created in `packages/database` | Already covered; live connection deferred |
| Clerk for identity and application-owned authorization | Approved by DEC-020 and implemented as the Phase 1 boundary | Already covered |
| One repository with separate frontend, backend, data, contracts, and tests | Governed by `REPOSITORY_STRUCTURE.md`; web, API, contracts, and database boundaries exist | Already covered |
| Raw, normalized, and analytics data layers | Consistent with the planned ingestion, quality, lineage, and metrics boundaries | Adopt when Phase 2 is approved; no tables should be invented early |
| Immutable original files in Cloudflare R2 | Supports REQ-019, but the storage provider and lifecycle policy are not yet approved | Retain as a Phase 2 proposal |
| Separate background worker and upload queue | Appropriate for long-running imports, but prohibited until an approved ingestion requirement proves the need | Evaluate in Phase 2, not Phase 1 |
| Cloudflare Pages frontend hosting | Conflicts with later approved DEC-020, which selects Vercel for the POC | Do not adopt unless the owner changes DEC-020 |
| Railway backend hosting | One of the DEC-020 candidates alongside Render | Decide before deployment using requirements, cost, limits, and operational evidence |
| Sentry and Axiom | The logging requirements already exist; external vendors are not yet approved | Add only when deployment/observability scope is approved |
| Resend and Twilio | Notifications are outside the current approved product phase | Defer until a notification requirement exists |
| Platform admin, employee, driver, and customer roles | Current approved product roles are OWNER and MANAGER only | Do not add speculative roles or screens |
| Multiple organizations and locations | Current product scope is one store | Do not add multi-store UI or authorization complexity |
| AI recommendations and approvals | Recommendations and generated business claims are explicitly out of scope | Do not adopt |
| Development, staging, and production separation | Consistent with engineering practice and source-data safety | Apply when environments are provisioned |

## What this document adds

The document adds useful implementation candidates for the ingestion phase: content-addressed original-file storage, import metadata, direct object-storage uploads, independently running jobs, explicit row outcomes, environment isolation, and privacy-safe observability. These are not gaps in the current Phase 1 foundation because Phase 1 deliberately contains no ingestion or business data.

## Required future decisions

Before adopting the deferred parts, the applicable phase must define and approve:

- the object-storage provider, region, encryption, retention, deletion, and access controls;
- whether a separate worker is required and how jobs remain idempotent and recoverable;
- hosting choice and cost limits for the API and worker;
- observability retention, redaction, access, and alert ownership;
- notification events, recipients, consent, delivery fallback, and cost controls;
- development, staging, and production ownership and data-movement restrictions.

Pricing quoted in `stack-2.docx` is time-sensitive and must be rechecked against official provider sources immediately before a purchase or deployment decision.
