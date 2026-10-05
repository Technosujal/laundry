import { unavailableOrderList } from "./order-availability.js";
import type { OrderRepository } from "./order-repository.js";
import type { OrderCoverage, OrderListQuery, OrderListResult } from "./order-types.js";

const unavailableCoverage: OrderCoverage = {
  state: "unavailable",
  reason: "WDF_API_NOT_CONNECTED",
  source: "WDF POS",
  reportedTotal: null,
  returnedCount: 0,
  lastSuccessfulSync: null,
};

export class UnavailableOrderRepository implements OrderRepository {
  public async getCoverage(_storeId: string): Promise<OrderCoverage> {
    return unavailableCoverage;
  }

  public async listOrders(_storeId: string, _query: OrderListQuery): Promise<OrderListResult> {
    return unavailableOrderList();
  }

  public async findOrderById(_storeId: string, _orderId: string): Promise<null> {
    return null;
  }
}
