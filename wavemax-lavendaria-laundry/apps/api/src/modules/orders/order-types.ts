export type OrderCoverage =
  | {
      state: "unavailable";
      reason: "WDF_API_NOT_CONNECTED";
      source: "WDF POS";
      reportedTotal: null;
      returnedCount: 0;
      lastSuccessfulSync: null;
    }
  | {
      state: "partial";
      reason: "SOURCE_PARTIAL";
      source: "WDF POS";
      reportedTotal: number | null;
      returnedCount: number;
      lastSuccessfulSync: string | null;
    }
  | {
      state: "complete";
      reason: "COMPLETE_SOURCE_RECONCILED";
      source: "WDF POS";
      reportedTotal: number;
      returnedCount: number;
      lastSuccessfulSync: string;
    };

export interface NullableMoney {
  amount: string | null;
  currency: string | null;
}

export interface CustomerContext {
  identityState: "verified" | "explicitly_mapped" | "source_only" | "unresolved";
  displayName: string | null;
  email: string | null;
  phone: string | null;
}

export interface OrderPayment {
  sourceStatus: string | null;
  sourceMethod: string | null;
}

export interface OrderSummary {
  id: string;
  sourceReference: string;
  createdAt: string | null;
  sourceStatus: string | null;
  customer: CustomerContext;
  payment: OrderPayment;
  total: NullableMoney;
}

export interface OrderEvent {
  id: string;
  sourceType: string;
  sourceLabel: string;
  occurredAt: string | null;
  actorDisplayName: string | null;
}

export interface OrderDetail extends OrderSummary {
  serviceType: string | null;
  channel: string | null;
  subtotal: NullableMoney;
  tax: NullableMoney;
  tip: NullableMoney;
  surcharge: NullableMoney;
  promise: {
    promisedReadyAt: string | null;
    promisedDeliveryAt: string | null;
  };
  assignment: {
    employeeId: string | null;
    employeeDisplayName: string | null;
    machineReference: string | null;
  };
  instructions: string | null;
  notes: string | null;
  events: readonly OrderEvent[];
  lineage: {
    source: "WDF POS";
    ingestionRunId: string;
    sourceRecordId: string;
    parserVersion: string;
    ruleVersion: string;
    sourceUpdatedAt: string | null;
  };
  unavailableFields: readonly string[];
}

export interface OrderListQuery {
  search?: string;
  sourceStatus?: string;
  paymentStatus?: string;
  createdFrom?: string;
  createdTo?: string;
  cursor?: string;
  limit: number;
}

export interface OrderListResult {
  items: readonly OrderSummary[];
  coverage: OrderCoverage;
  page: {
    nextCursor: string | null;
    hasMore: boolean;
  };
}

export interface ScopedOrderDetail {
  storeId: string;
  order: OrderDetail;
}
