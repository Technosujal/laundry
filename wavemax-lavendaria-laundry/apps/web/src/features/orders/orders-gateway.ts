import type { components, operations } from "@wavemax/contracts";

export type OrderListResponse = components["schemas"]["OrderListResponse"];
export type OrderDetailResponse = components["schemas"]["OrderDetailResponse"];
export type OrderSummary = components["schemas"]["OrderSummary"];
export type OrderListQuery = NonNullable<operations["listOrders"]["parameters"]["query"]>;

export interface OrdersGateway {
  listOrders(query: OrderListQuery, signal?: AbortSignal): Promise<OrderListResponse>;
  getOrder(orderId: string, signal?: AbortSignal): Promise<OrderDetailResponse>;
}

const unavailableList: OrderListResponse = {
  items: [],
  coverage: {
    state: "unavailable",
    reason: "WDF_API_NOT_CONNECTED",
    source: "WDF POS",
    reportedTotal: null,
    returnedCount: 0,
    lastSuccessfulSync: null,
  },
  page: { nextCursor: null, hasMore: false },
};

export const unavailableOrdersGateway: OrdersGateway = {
  async listOrders() {
    return unavailableList;
  },
  async getOrder() {
    throw new OrdersGatewayError(503, "Order details are unavailable until WDF is connected", null);
  },
};

export class OrdersGatewayError extends Error {
  public constructor(
    public readonly status: number,
    message: string,
    public readonly correlationId: string | null,
  ) {
    super(message);
    this.name = "OrdersGatewayError";
  }
}

export function createHttpOrdersGateway(
  apiUrl: string,
  getToken: () => Promise<string | null>,
): OrdersGateway {
  async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
    const token = await getToken();
    const response = await fetch(`${apiUrl}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      ...(signal === undefined ? {} : { signal }),
    });
    const payload = (await response.json()) as unknown;
    if (!response.ok) {
      const problem = payload as Partial<components["schemas"]["Problem"]>;
      throw new OrdersGatewayError(
        response.status,
        problem.title ?? "The order request could not be completed",
        problem.correlationId ?? null,
      );
    }
    return payload as T;
  }

  return {
    async listOrders(query, signal) {
      const parameters = new URLSearchParams();
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined) parameters.set(key, String(value));
      });
      const suffix = parameters.size ? `?${parameters.toString()}` : "";
      return request<OrderListResponse>(`/orders${suffix}`, signal);
    },
    async getOrder(orderId, signal) {
      return request<OrderDetailResponse>(`/orders/${encodeURIComponent(orderId)}`, signal);
    },
  };
}
