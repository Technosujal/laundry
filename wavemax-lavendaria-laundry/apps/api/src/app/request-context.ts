import { randomUUID } from "node:crypto";

import type { NextFunction, Request, Response } from "express";

export function requestContext(request: Request, response: Response, next: NextFunction) {
  const correlationId = request.header("x-correlation-id") ?? randomUUID();
  response.locals.correlationId = correlationId;
  response.setHeader("x-correlation-id", correlationId);

  const startedAt = performance.now();
  console.info(JSON.stringify({ event: "request.started", correlationId, method: request.method }));

  response.on("finish", () => {
    console.info(
      JSON.stringify({
        event: "request.completed",
        correlationId,
        method: request.method,
        status: response.statusCode,
        durationMs: Math.round(performance.now() - startedAt),
      }),
    );
  });
  next();
}
