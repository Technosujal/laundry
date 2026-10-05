# Wavemax Idea Intake

## Facts

- Product: a one-store laundromat operations and business-analytics platform.
- Current users: owner and manager.
- Current UI: static, data-free shell in `apps/web`.
- Owner areas: Command Center, Orders, Business Analytics/Finance, Workforce Management.
- Manager areas: Command Center, Orders, Workforce Management.
- Managers may see order price and payment status.
- Managers may see and approve only people working under them, primarily at one location.
- Manager access to Analytics and Finance is prohibited.
- Real data sources currently supplied for the POC: WDF POS and Laundro Portal files, with unknown completeness.
- Production is expected to use two vendor APIs: WDF and LaundroPortal/Laundrolux. The owner confirmed those two names refer to the same second platform for this project; supplied evidence uses LaundroPortal/Laundroworks branding.
- The supplied financial report identifies the one-store location as the Colerain location in Cincinnati, Ohio; timezone remains pending confirmation.
- Visual reference: Omrix.
- Workflow references: LaundryOps-AI orders and people operations.
- Analytics reference: Wavemax Colerain 2025 project.
- No demonstration data may appear in the product.
- Data quality and original records must remain intact.

## Decisions

- Use React/TypeScript for the frontend.
- Use Node.js/TypeScript for authentication and operational APIs.
- Use Python for ingestion, data quality, analytics, and forecasting.
- Use Neon PostgreSQL.
- Build and verify one logical slice at a time.
- Do not show AI-generated recommendations in the current product.

## Explicitly out of scope until separately approved

- Multi-store operation.
- AI-generated recommendations or autonomous actions.
- Fabricated product data.
- Unapproved forecasting.
- Generic CRM functionality unrelated to laundromat operations.

## Unknowns

1. Authoritative direct-report assignment mechanism.
2. Exact LaundroPortal/Laundrolux API contract, credentials, scopes, and limits.
3. Authentication provider and login method.
4. Production personal-data retention, masking, download, and deletion policy.
5. First approved forecast target and whether Holt-Winters is required.
6. Hosting and production deployment environment beyond Neon.
7. Authoritative store timezone; current evidence suggests `America/New_York`.

## First-release success

Success criteria remain `UNKNOWN` until the owner approves a Phase 1 proposal with measurable acceptance criteria.
