import { clerkMiddleware, getAuth } from "@clerk/express";
import type { NextFunction, Request, RequestHandler, Response } from "express";

import { sendProblem } from "../../app/problem.js";

export type IdentityMiddleware = RequestHandler;

export function clerkIdentityMiddleware(
  authorizedParties: readonly string[],
): readonly RequestHandler[] {
  return [
    clerkMiddleware({ authorizedParties: [...authorizedParties] }),
    (request: Request, response: Response, next: NextFunction) => {
      const auth = getAuth(request);
      if (!auth.isAuthenticated || !auth.userId) {
        sendProblem(response, 401, "Authentication required", response.locals.correlationId);
        return;
      }
      response.locals.externalAuthSubject = auth.userId;
      next();
    },
  ];
}
