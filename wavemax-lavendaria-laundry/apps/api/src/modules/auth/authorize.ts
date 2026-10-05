import type { NextFunction, Request, RequestHandler, Response } from "express";

import { sendProblem } from "../../app/problem.js";
import type { AccessRepository } from "./access-repository.js";
import { canAccessArea, type ProductArea } from "./access-policy.js";

export function loadActor(repository: AccessRepository): RequestHandler {
  return async (_request: Request, response: Response, next: NextFunction) => {
    const subject: unknown = response.locals.externalAuthSubject;
    if (typeof subject !== "string") {
      sendProblem(response, 401, "Authentication required", response.locals.correlationId);
      return;
    }

    const actor = await repository.findActiveActor(subject);
    if (!actor) {
      sendProblem(
        response,
        403,
        "Account is not assigned to Wavemax",
        response.locals.correlationId,
      );
      return;
    }
    response.locals.actor = actor;
    next();
  };
}

export function requireArea(area: ProductArea): RequestHandler {
  return (_request: Request, response: Response, next: NextFunction) => {
    const actor = response.locals.actor;
    if (!actor || !canAccessArea(actor.role, area)) {
      sendProblem(
        response,
        403,
        "You do not have access to this area",
        response.locals.correlationId,
      );
      return;
    }
    next();
  };
}
