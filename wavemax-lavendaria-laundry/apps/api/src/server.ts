import { Pool } from "pg";

import { createApp } from "./app/create-app.js";
import { readConfig } from "./app/config.js";
import { clerkIdentityMiddleware } from "./modules/auth/identity-middleware.js";
import { PostgresAccessRepository } from "./modules/auth/postgres-access-repository.js";
import { ArtifactAnalyticsRepository } from "./modules/analytics/artifact-analytics-repository.js";
import { UnavailableOrderRepository } from "./modules/orders/unavailable-order-repository.js";

const config = readConfig(process.env);
const pool = new Pool({ connectionString: config.DATABASE_URL });
const repository = new PostgresAccessRepository(pool);
const app = createApp({
  accessRepository: repository,
  orderRepository: new UnavailableOrderRepository(),
  analyticsRepository: new ArtifactAnalyticsRepository(config.ANALYTICS_ARTIFACT_PATH),
  identityMiddleware: clerkIdentityMiddleware([config.WEB_ORIGIN]),
  webOrigin: config.WEB_ORIGIN,
});

const server = app.listen(config.PORT, () => {
  console.info(JSON.stringify({ event: "service.started", port: config.PORT }));
});

async function shutdown(signal: string) {
  console.info(JSON.stringify({ event: "service.stopping", signal }));
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
