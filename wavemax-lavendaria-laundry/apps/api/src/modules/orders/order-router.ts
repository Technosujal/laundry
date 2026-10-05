import { Router, type NextFunction, type Request, type Response } from "express";

import { sendProblem } from "../../app/problem.js";
import {
  OrderNotFoundError,
  OrderScopeError,
  OrderSourceUnavailableError,
} from "./order-errors.js";
import { parseOrderId, parseOrderListQuery } from "./order-query.js";
import type { OrderService } from "./order-service.js";

function sendOrderError(error: unknown, response: Response): boolean {
  if (error instanceof OrderSourceUnavailableError) {
    sendProblem(response, 503, error.message, response.locals.correlationId);
    return true;
  }
  if (error instanceof OrderNotFoundError) {
    sendProblem(response, 404, error.message, response.locals.correlationId);
    return true;
  }
  if (error instanceof OrderScopeError) {
    sendProblem(response, 403, error.message, response.locals.correlationId);
    return true;
  }
  return false;
}

export function createOrderRouter(service: OrderService) {
  const router = Router();

  router.get("/", async (request: Request, response: Response, next: NextFunction) => {
    const query = parseOrderListQuery(request.query);
    if (!query) {
      sendProblem(response, 400, "Order query is invalid", response.locals.correlationId);
      return;
    }
    try {
      response.json(await service.listOrders(response.locals.actor!, query));
    } catch (error) {
      next(error);
    }
  });

  router.get("/:orderId", async (request: Request, response: Response, next: NextFunction) => {
    const orderId = parseOrderId(request.params.orderId);
    if (!orderId) {
      sendProblem(response, 400, "Order identifier is invalid", response.locals.correlationId);
      return;
    }
    try {
      response.json(await service.getOrder(response.locals.actor!, orderId));
    } catch (error) {
      if (!sendOrderError(error, response)) next(error);
    }
  });

  return router;
}
