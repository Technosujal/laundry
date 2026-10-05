import type {
  OrderCoverage,
  OrderListQuery,
  OrderListResult,
  ScopedOrderDetail,
} from "./order-types.js";

export interface OrderRepository {
  getCoverage(storeId: string): Promise<OrderCoverage>;
  listOrders(storeId: string, query: OrderListQuery): Promise<OrderListResult>;
  findOrderById(storeId: string, orderId: string): Promise<ScopedOrderDetail | null>;
}
