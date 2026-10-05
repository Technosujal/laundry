import type {
  OrderDetailResponse,
  OrderListQuery,
  OrderListResponse,
  OrderSummary,
  OrdersGateway,
} from "./orders-gateway";
import { OrdersGatewayError } from "./orders-gateway";

/**
 * Serves the orders the analytics service published, behind the same interface the HTTP
 * gateway implements.
 *
 * Every order here is a real record from the complete WDF paid-sales workbook. Nothing is
 * generated: an order carries only the fields its source supplied, and a field the source did
 * not supply stays null rather than being filled in with a plausible value. Swapping in the
 * HTTP gateway replaces this wholesale; no page knows which one it is talking to.
 */

interface ArtifactOrder {
  order_number: string;
  paid_date: string | null;
  subtotal: string;
  line_count: number;
  categories: string[];
  laundry_service: boolean;
}

/** One line of an order, as the sales workbook recorded it. */
export interface OrderLine {
  item: string;
  department: string;
  quantity: string;
  units: string | null;
  subtotal: string;
  tax: string;
}

/** A row of the Order List export, which carries fields the sales workbook does not. */
interface ArtifactListedOrder {
  order_number: string;
  customer: string;
  created: string;
  order_status: string;
  payment_status: string;
  payment_method: string;
  subtotal: string;
  tax: string;
  cc_tip: string;
  total: string;
}

interface ArtifactFacts {
  available: boolean;
  row_count: number;
  days: string[];
  departments: string[];
  items: string[];
  orders: string[];
  data: Record<string, string>;
}

interface OrdersArtifact {
  run_id: string;
  wdf_sales: {
    orders: ArtifactOrder[];
    facts: ArtifactFacts;
    operations: {
      coverage: Record<string, { complete: boolean }>;
      customers: { order_list: ArtifactListedOrder[] };
    };
  };
}

/** Everything the order pages need that the shared OrderSummary shape has no room for. */
export interface OrderExtras {
  lineCount: number;
  categories: string[];
  serviceType: string;
  voidReason: string | null;
  voidedBy: string | null;
  /** Every line the workbook recorded against this order. */
  lines: OrderLine[];
  /** Fields only the Order List carries, for the 30 orders it displays. */
  listed: ArtifactListedOrder | null;
}

const extras = new Map<string, OrderExtras>();

export function orderExtras(id: string): OrderExtras | null {
  return extras.get(id) ?? null;
}

function identifier(reference: string): string {
  return reference.replace(/[^0-9a-zA-Z]+/g, "").toLowerCase();
}

/**
 * Group the published line-level facts by order number.
 *
 * The workbook records every order as its individual lines, so an order's contents are already
 * in the artifact; they only needed grouping. Nothing here is computed beyond that grouping, so
 * a line shows exactly the quantity and money the workbook recorded against it.
 */
function linesByOrder(facts: ArtifactFacts): Map<string, OrderLine[]> {
  const grouped = new Map<string, OrderLine[]>();
  if (!facts?.available) return grouped;
  const column = (name: string) =>
    (facts.data[name] ?? "").split(",").map((value) => Number(value));
  const order = column("order");
  const item = column("item");
  const department = column("department");
  const subtotal = column("subtotal_cents");
  const tax = column("tax_units");
  const pounds = column("pounds_milli");

  for (let row = 0; row < facts.row_count; row += 1) {
    const key = facts.orders[order[row] ?? 0] ?? "";
    const weighed = (pounds[row] ?? 0) > 0;
    const line: OrderLine = {
      item: facts.items[item[row] ?? 0] ?? "Unnamed item",
      department: facts.departments[department[row] ?? 0] ?? "No department",
      quantity: weighed ? ((pounds[row] ?? 0) / 1000).toFixed(2) : "1",
      units: weighed ? "lb" : null,
      subtotal: ((subtotal[row] ?? 0) / 100).toFixed(2),
      tax: ((tax[row] ?? 0) / 100000).toFixed(2),
    };
    const existing = grouped.get(key);
    if (existing) existing.push(line);
    else grouped.set(key, [line]);
  }
  return grouped;
}

function toPaidOrder(
  order: ArtifactOrder,
  lines: OrderLine[],
  listed: ArtifactListedOrder | null,
): OrderSummary {
  const id = `paid-${identifier(order.order_number)}`;
  extras.set(id, {
    lineCount: order.line_count,
    categories: order.categories,
    serviceType: order.laundry_service ? "Laundry service" : "Retail",
    voidReason: null,
    voidedBy: null,
    lines,
    listed,
  });
  return {
    id,
    sourceReference: order.order_number.trim(),
    createdAt: order.paid_date,
    // The Order List names a status for the thirty orders it displays; the workbook does not,
    // so every other order is simply "Paid" rather than being given an invented status.
    sourceStatus:
      listed?.order_status && listed.order_status !== "N/A" ? listed.order_status : "Paid",
    customer: listed?.customer
      ? { identityState: "source_only", displayName: listed.customer, email: null, phone: null }
      : { identityState: "unresolved", displayName: null, email: null, phone: null },
    payment: {
      sourceStatus: listed?.payment_status || "Paid",
      sourceMethod: listed?.payment_method || null,
    },
    total: { amount: order.subtotal, currency: "USD" },
  };
}

function matches(order: OrderSummary, query: OrderListQuery): boolean {
  if (query.search) {
    const needle = query.search.trim().toLowerCase();
    const haystack = [
      order.sourceReference,
      order.customer.displayName ?? "",
      order.total.amount ?? "",
      orderExtras(order.id)?.categories.join(" ") ?? "",
    ]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(needle)) return false;
  }
  if (query.sourceStatus && order.sourceStatus !== query.sourceStatus) return false;
  if (query.paymentStatus && orderExtras(order.id)?.serviceType !== query.paymentStatus) {
    return false;
  }
  if (query.createdFrom && (order.createdAt ?? "") < query.createdFrom) return false;
  if (query.createdTo && (order.createdAt ?? "") > query.createdTo) return false;
  return true;
}

export function createStaticOrdersGateway(url: string): OrdersGateway {
  let loaded: Promise<OrderSummary[]> | null = null;

  async function all(): Promise<OrderSummary[]> {
    // The artifact is fetched once and shared by every caller. Deliberately not tied to any one
    // caller's abort signal: React runs effects twice in development, and the first run's
    // cleanup would otherwise poison the cache with an aborted promise that never resolves.
    loaded ??= (async () => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new OrdersGatewayError(503, "The order source could not be read", null);
      }
      const text = await response.text();
      if (!text || text.trim().startsWith("<")) {
        throw new OrdersGatewayError(503, "The order source was not found or is not built yet", null);
      }
      const artifact = JSON.parse(text) as OrdersArtifact;
      const lines = linesByOrder(artifact.wdf_sales.facts);
      const orderListComplete = artifact.wdf_sales.operations.coverage.order_list?.complete;
      const listedByNumber = new Map(
        orderListComplete
          ? artifact.wdf_sales.operations.customers.order_list.map((row) => [
              identifier(row.order_number),
              row,
            ])
          : [],
      );
      const orders = artifact.wdf_sales.orders.map((order) =>
        toPaidOrder(
          order,
          lines.get(order.order_number) ?? [],
          listedByNumber.get(identifier(order.order_number)) ?? null,
        ),
      );
      // Newest first, matching how a counter team reads a day's work back.
      orders.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
      return orders;
    })().catch((cause: unknown) => {
      // A failed read must not be cached, or every later retry replays the same failure.
      loaded = null;
      throw cause;
    });
    return loaded;
  }

  return {
    async listOrders(query) {
      const orders = await all();
      const filtered = orders.filter((order) => matches(order, query));
      const limit = query.limit ?? 25;
      const start = query.cursor ? Number(query.cursor) : 0;
      const page = filtered.slice(start, start + limit);
      const next = start + limit;
      return {
        items: page,
        coverage: {
          state: "complete",
          reason: "COMPLETE_SOURCE_RECONCILED",
          source: "WDF POS",
          reportedTotal: filtered.length,
          returnedCount: page.length,
          lastSuccessfulSync: null,
        },
        page: {
          nextCursor: next < filtered.length ? String(next) : null,
          hasMore: next < filtered.length,
        },
      } satisfies OrderListResponse;
    },

    async getOrder(orderId) {
      const orders = await all();
      const order = orders.find((candidate) => candidate.id === orderId);
      if (!order) {
        throw new OrdersGatewayError(404, "That order is not present in the verified source", null);
      }
      const detail = orderExtras(order.id);
      return {
        order: {
          ...order,
          serviceType: detail?.serviceType ?? null,
          channel: null,
          subtotal: order.total,
          // The per-order tax, tip and surcharge split is not carried in the order export, so
          // these stay null instead of being derived from an annual rate.
          tax: { amount: null, currency: null },
          tip: { amount: null, currency: null },
          surcharge: { amount: null, currency: null },
          promise: { promisedReadyAt: null, promisedDeliveryAt: null },
          assignment: {
            employeeId: null,
            employeeDisplayName: detail?.voidedBy ?? null,
            machineReference: null,
          },
          instructions: null,
          notes: detail?.voidReason ?? null,
          events: order.createdAt
            ? [
                {
                  id: `${order.id}-recorded`,
                  sourceType: order.sourceStatus === "Voided" ? "VOIDED" : "PAID",
                  sourceLabel:
                    order.sourceStatus === "Voided"
                      ? "Marked voided in the Void Report"
                      : "Recorded as paid in the sales export",
                  occurredAt: order.createdAt,
                  actorDisplayName: detail?.voidedBy ?? null,
                },
              ]
            : [],
          lineage: {
            source: "WDF POS",
            ingestionRunId: "static-artifact",
            sourceRecordId: order.sourceReference,
            parserVersion: "wdf-sales-xlsx",
            ruleVersion: "wdf-sales-quality",
            sourceUpdatedAt: null,
          },
          unavailableFields: [
            "promisedReadyAt",
            "promisedDeliveryAt",
            "channel",
            "machineReference",
            ...(order.sourceStatus === "Voided" ? [] : ["customerDisplayName"]),
          ],
        },
        coverage: {
          state: "complete",
          reason: "COMPLETE_SOURCE_RECONCILED",
          source: "WDF POS",
          reportedTotal: orders.length,
          returnedCount: 1,
          lastSuccessfulSync: null,
        },
      } as OrderDetailResponse;
    },
  };
}
