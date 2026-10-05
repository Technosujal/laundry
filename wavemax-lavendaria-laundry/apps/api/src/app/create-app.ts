import cors from "cors";
import express, {
  type NextFunction,
  type Request,
  type RequestHandler,
  type Response,
} from "express";
import helmet from "helmet";

import type { AccessRepository } from "../modules/auth/access-repository.js";
import { permittedAreas } from "../modules/auth/access-policy.js";
import { loadActor, requireArea } from "../modules/auth/authorize.js";
import { createEmployeeApprovalRouter } from "../modules/auth/employee-approval-router.js";
import type { AnalyticsRepository } from "../modules/analytics/analytics-repository.js";
import { createAnalyticsRouter } from "../modules/analytics/analytics-router.js";
import { AnalyticsService } from "../modules/analytics/analytics-service.js";
import type { OrderRepository } from "../modules/orders/order-repository.js";
import { createOrderRouter } from "../modules/orders/order-router.js";
import { OrderService } from "../modules/orders/order-service.js";
import { sendProblem } from "./problem.js";
import { requestContext } from "./request-context.js";

export interface AppDependencies {
  accessRepository: AccessRepository;
  orderRepository: OrderRepository;
  analyticsRepository: AnalyticsRepository;
  identityMiddleware: readonly RequestHandler[];
  webOrigin: string;
}

export function createApp(dependencies: AppDependencies) {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({ origin: dependencies.webOrigin, credentials: true }));
  app.use(express.json({ limit: "64kb" }));
  app.use(requestContext);

  app.get("/v1/health", (_request, response) => response.json({ status: "ok" }));

  app.use("/v1/auth", createEmployeeApprovalRouter());

  app.use("/v1", ...dependencies.identityMiddleware, loadActor(dependencies.accessRepository));

  app.get("/v1/session", (_request, response) => {
    const actor = response.locals.actor!;
    response.json({ role: actor.role, permittedAreas: permittedAreas(actor.role) });
  });

  app.use(
    "/v1/orders",
    requireArea("orders"),
    createOrderRouter(new OrderService(dependencies.orderRepository)),
  );

  app.get("/v1/workforce", requireArea("workforce"), async (_request, response) => {
    const employeeIds = await dependencies.accessRepository.listVisibleEmployeeIds(
      response.locals.actor!,
      new Date(),
    );
    response.json({
      items: employeeIds,
      state: employeeIds.length ? "available" : "not_connected",
    });
  });

  app.use(
    "/v1/analytics",
    requireArea("analytics"),
    createAnalyticsRouter(new AnalyticsService(dependencies.analyticsRepository)),
  );

  app.get("/v1/finance", requireArea("finance"), (_request, response) => {
    response.json({ state: "not_connected", reason: "No approved finance source is connected." });
  });

  app.get("/v1/data-sources", requireArea("data-sources"), (_request, response) => {
    response.json({
      sources: [
        { source: "WDF POS", connected: false, lastSuccessfulCheck: null },
        {
          source: "LaundroPortal / Laundrolux",
          connected: false,
          lastSuccessfulCheck: null,
        },
      ],
    });
  });

  app.use((_request, response) => {
    sendProblem(response, 404, "Resource not found", response.locals.correlationId);
  });

  app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    console.error(
      JSON.stringify({
        event: "request.failed",
        correlationId: response.locals.correlationId,
        errorType: error instanceof Error ? error.name : "UnknownError",
      }),
    );
    sendProblem(
      response,
      500,
      "The service could not complete the request",
      response.locals.correlationId,
    );
  });

  return app;
}
