import type { Actor } from "../auth/access-policy.js";
import {
  OrderNotFoundError,
  OrderScopeError,
  OrderSourceUnavailableError,
} from "./order-errors.js";
import type { OrderRepository } from "./order-repository.js";
import type { OrderListQuery, OrderListResult } from "./order-types.js";

export class OrderService {
  public constructor(private readonly repository: OrderRepository) {}

  public async listOrders(actor: Actor, query: OrderListQuery): Promise<OrderListResult> {
    const result = await this.repository.listOrders(actor.storeId, query);
    if (result.coverage.returnedCount !== result.items.length) {
      throw new Error("Order repository returned an inconsistent result count");
    }
    return result;
  }

  public async getOrder(actor: Actor, orderId: string) {
    const coverage = await this.repository.getCoverage(actor.storeId);
    if (coverage.state === "unavailable") {
      throw new OrderSourceUnavailableError();
    }

    const scopedOrder = await this.repository.findOrderById(actor.storeId, orderId);
    if (!scopedOrder) {
      if (coverage.state === "partial") throw new OrderSourceUnavailableError();
      throw new OrderNotFoundError();
    }
    if (scopedOrder.storeId !== actor.storeId) throw new OrderScopeError();

    return { order: scopedOrder.order, coverage };
  }
}
