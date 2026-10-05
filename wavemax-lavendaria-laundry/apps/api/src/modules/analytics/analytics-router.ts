import { Router, type Request, type Response } from "express";

import { sendProblem } from "../../app/problem.js";
import type { AnalyticsService } from "./analytics-service.js";

const METRIC_ID = /^[a-z0-9_]{1,64}$/;

export function createAnalyticsRouter(service: AnalyticsService) {
  const router = Router();

  router.get("/", async (_request: Request, response: Response) => {
    response.json(await service.getOverview(response.locals.actor!));
  });

  router.get("/metrics", async (_request: Request, response: Response) => {
    response.json(await service.listMetrics(response.locals.actor!));
  });

  router.get("/metrics/:metricId", async (request: Request, response: Response) => {
    const metricId = String(request.params.metricId ?? "");
    if (!METRIC_ID.test(metricId)) {
      sendProblem(response, 400, "Metric identifier is invalid", response.locals.correlationId);
      return;
    }
    const result = await service.getMetric(response.locals.actor!, metricId);
    if (result.state === "not_found") {
      sendProblem(response, 404, "Metric not found", response.locals.correlationId);
      return;
    }
    response.json(result);
  });

  return router;
}
