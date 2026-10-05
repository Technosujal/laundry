import type { NextFunction, Request, Response } from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";

import type { AnalyticsRepository } from "../modules/analytics/analytics-repository.js";
import type { AccessRepository } from "../modules/auth/access-repository.js";
import type { Actor } from "../modules/auth/access-policy.js";
import type { OrderRepository } from "../modules/orders/order-repository.js";
import type { OrderDetail, OrderListResult } from "../modules/orders/order-types.js";
import { UnavailableOrderRepository } from "../modules/orders/unavailable-order-repository.js";
import { createApp } from "./create-app.js";
import { sendProblem } from "./problem.js";

const owner: Actor = { id: "owner-id", storeId: "store-id", role: "OWNER" };
const manager: Actor = { id: "manager-id", storeId: "store-id", role: "MANAGER" };
const employee: Actor = { id: "employee-user-id", storeId: "store-id", role: "EMPLOYEE" };

const sampleArtifact = {
  artifact_version: "test/1.0.0",
  run_id: "run-id",
  sources: [],
  metrics: {
    sample_metric: {
      definition: {
        metric_id: "sample_metric",
        label: "Sample metric",
        business_meaning: "A measure used only in tests.",
        formula: "sum(Amount)",
        source_system: "TEST",
        source_files: ["sample.csv"],
        source_fields: ["Day", "Amount"],
        unit: "CURRENCY_USD",
        grain: "day",
        population: "Test rows.",
        inclusions: ["Something included."],
        exclusions: ["Something excluded."],
        null_treatment: "Quarantined.",
        duplicate_treatment: "Flagged.",
        rounding: "Exact decimal.",
        timezone_basis: "As exported.",
        coverage_state: "PARTIAL",
        coverage_note: "Sample coverage note.",
        known_limitations: ["Sample limitation."],
        drill_down: "Daily values.",
        definition_version: "test/1.0.0",
      },
      unit: "CURRENCY_USD",
      machine_scope: "NOT_MACHINE_SCOPED",
      business_event: "Test event.",
      source_coverage_note: "Sample coverage note.",
      total: "123.45",
      first_day: "2025-01-01",
      last_day: "2025-01-02",
      distinct_days: 2,
      by_year: [],
      by_month: [],
      by_day: [],
      quality: {
        input_rows: 4,
        accepted_rows: 2,
        quarantined_rows: 2,
        reason_counts: {},
        warning_counts: {},
      },
    },
  },
} as const;

function analyticsRepositoryWith(artifact: unknown): AnalyticsRepository {
  return {
    getAnalytics: async () =>
      ({ state: "available", ...(artifact as object) }) as Awaited<
        ReturnType<AnalyticsRepository["getAnalytics"]>
      >,
  };
}

const completeCoverage = {
  state: "complete",
  reason: "COMPLETE_SOURCE_RECONCILED",
  source: "WDF POS",
  reportedTotal: 1,
  returnedCount: 1,
  lastSuccessfulSync: "2026-09-14T12:00:00Z",
} as const;

const orderDetail: OrderDetail = {
  id: "order-id",
  sourceReference: "source-reference",
  createdAt: "2026-09-14T10:00:00Z",
  sourceStatus: "Ready",
  customer: {
    identityState: "source_only",
    displayName: null,
    email: null,
    phone: null,
  },
  payment: { sourceStatus: "Paid", sourceMethod: null },
  total: { amount: "24.50", currency: "USD" },
  serviceType: null,
  channel: null,
  subtotal: { amount: null, currency: null },
  tax: { amount: null, currency: null },
  tip: { amount: null, currency: null },
  surcharge: { amount: null, currency: null },
  promise: { promisedReadyAt: null, promisedDeliveryAt: null },
  assignment: { employeeId: null, employeeDisplayName: null, machineReference: null },
  instructions: null,
  notes: null,
  events: [],
  lineage: {
    source: "WDF POS",
    ingestionRunId: "test-run",
    sourceRecordId: "test-record",
    parserVersion: "test-parser",
    ruleVersion: "test-rules",
    sourceUpdatedAt: null,
  },
  unavailableFields: [],
};

function availableOrderRepository(overrides: Partial<OrderRepository> = {}): OrderRepository {
  const listResult: OrderListResult = {
    items: [orderDetail],
    coverage: completeCoverage,
    page: { nextCursor: null, hasMore: false },
  };
  return {
    getCoverage: vi.fn(async () => completeCoverage),
    listOrders: vi.fn(async () => listResult),
    findOrderById: vi.fn(async () => ({ storeId: "store-id", order: orderDetail })),
    ...overrides,
  };
}

function buildApp(
  actor: Actor | null,
  orderRepository: OrderRepository = new UnavailableOrderRepository(),
  analyticsRepository: AnalyticsRepository = {
    getAnalytics: async () => ({
      state: "unavailable",
      reason: "ANALYTICS_ARTIFACT_NOT_BUILT",
      detail: "No analytics artifact is present in this test.",
    }),
  },
) {
  const listVisibleEmployeeIds = vi.fn(async (_actor: Actor, _at: Date) => [
    "assigned-employee-id",
  ]);
  const repository: AccessRepository = {
    findActiveActor: vi.fn(async () => actor),
    listVisibleEmployeeIds,
  };
  const identityMiddleware = [
    (_request: Request, response: Response, next: NextFunction) => {
      if (!actor) {
        sendProblem(response, 401, "Authentication required", response.locals.correlationId);
        return;
      }
      response.locals.externalAuthSubject = "verified-subject";
      next();
    },
  ];
  return {
    app: createApp({
      accessRepository: repository,
      orderRepository,
      analyticsRepository,
      identityMiddleware,
      webOrigin: "http://localhost:5173",
    }),
    listVisibleEmployeeIds,
  };
}

describe("application access boundaries", () => {
  it("returns 401 when identity is absent", async () => {
    const { app } = buildApp(null);
    await request(app).get("/v1/session").expect(401);
  });

  it("returns only manager-permitted navigation", async () => {
    const { app } = buildApp(manager);
    const response = await request(app).get("/v1/session").expect(200);
    expect(response.body).toEqual({
      role: "MANAGER",
      permittedAreas: ["command-center", "orders", "workforce"],
    });
  });

  it("serves an employee session without owner or manager areas", async () => {
    const { app } = buildApp(employee);
    const response = await request(app).get("/v1/session").expect(200);
    expect(response.body).toEqual({
      role: "EMPLOYEE",
      permittedAreas: ["command-center", "workforce"],
    });
  });

  it("passes the authenticated employee to the workforce scope query", async () => {
    const { app, listVisibleEmployeeIds } = buildApp(employee);
    await request(app).get("/v1/workforce").expect(200);
    expect(listVisibleEmployeeIds).toHaveBeenCalledOnce();
    expect(listVisibleEmployeeIds.mock.calls[0]?.[0]).toEqual(employee);
  });

  it.each(["orders", "analytics", "finance", "data-sources"])(
    "denies employee access to %s on the server",
    async (area) => {
      const { app } = buildApp(employee);
      await request(app).get(`/v1/${area}`).expect(403);
    },
  );

  it.each(["analytics", "finance", "data-sources"])(
    "denies manager access to %s on the server",
    async (area) => {
      const { app } = buildApp(manager);
      await request(app).get(`/v1/${area}`).expect(403);
    },
  );

  it("reports an unbuilt analytics artifact explicitly rather than as empty success", async () => {
    const { app } = buildApp(owner);
    const response = await request(app).get("/v1/analytics").expect(200);
    expect(response.body).toEqual({
      state: "unavailable",
      reason: "ANALYTICS_ARTIFACT_NOT_BUILT",
      detail: "No analytics artifact is present in this test.",
    });
  });

  it("serves metric summaries carrying coverage and limitations when an artifact exists", async () => {
    const { app } = buildApp(owner, undefined, analyticsRepositoryWith(sampleArtifact));
    const response = await request(app).get("/v1/analytics/metrics").expect(200);
    expect(response.body.state).toBe("available");
    expect(response.body.run_id).toBe("run-id");
    expect(response.body.metrics).toHaveLength(1);
    expect(response.body.metrics[0]).toMatchObject({
      metric_id: "sample_metric",
      total: "123.45",
      coverage_state: "PARTIAL",
      known_limitations: ["Sample limitation."],
      quarantined_rows: 2,
    });
  });

  it("returns the full definition for a named metric so a value can be defended", async () => {
    const { app } = buildApp(owner, undefined, analyticsRepositoryWith(sampleArtifact));
    const response = await request(app).get("/v1/analytics/metrics/sample_metric").expect(200);
    expect(response.body.metric.definition.formula).toBe("sum(Amount)");
    expect(response.body.metric.definition.exclusions).toEqual(["Something excluded."]);
  });

  it("returns 404 for an unknown metric rather than an empty result", async () => {
    const { app } = buildApp(owner, undefined, analyticsRepositoryWith(sampleArtifact));
    await request(app).get("/v1/analytics/metrics/does_not_exist").expect(404);
  });

  it("rejects a malformed metric identifier", async () => {
    const { app } = buildApp(owner, undefined, analyticsRepositoryWith(sampleArtifact));
    await request(app).get("/v1/analytics/metrics/BAD-ID!").expect(400);
  });

  it("denies a manager access to analytics at the server, not only in the interface", async () => {
    const { app } = buildApp(manager, undefined, analyticsRepositoryWith(sampleArtifact));
    await request(app).get("/v1/analytics").expect(403);
    await request(app).get("/v1/analytics/metrics").expect(403);
    await request(app).get("/v1/analytics/metrics/sample_metric").expect(403);
  });

  it.each([owner, manager])(
    "returns an explicit unavailable order source to $role without inventing records",
    async (actor) => {
      const { app } = buildApp(actor);
      const response = await request(app).get("/v1/orders").expect(200);
      expect(response.body).toEqual({
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
      });
    },
  );

  it("does not report an order as missing when the complete source is unavailable", async () => {
    const { app } = buildApp(owner);
    const response = await request(app).get("/v1/orders/unverified-order-id").expect(503);
    expect(response.body.title).toBe("Order details are unavailable until WDF is connected");
  });

  it("validates list queries and derives store scope only from the authenticated actor", async () => {
    const orderRepository = availableOrderRepository();
    const { app } = buildApp(owner, orderRepository);

    await request(app).get("/v1/orders?search=%20ready%20&limit=50").expect(200);

    expect(orderRepository.listOrders).toHaveBeenCalledWith("store-id", {
      search: "ready",
      limit: 50,
    });
  });

  it("rejects browser-supplied store scope before repository access", async () => {
    const orderRepository = availableOrderRepository();
    const { app } = buildApp(owner, orderRepository);

    await request(app).get("/v1/orders?storeId=another-store").expect(400);

    expect(orderRepository.listOrders).not.toHaveBeenCalled();
  });

  it("returns a proven not-found result only when source coverage is complete", async () => {
    const orderRepository = availableOrderRepository({
      findOrderById: vi.fn(async () => null),
    });
    const { app } = buildApp(owner, orderRepository);

    await request(app).get("/v1/orders/missing-order").expect(404);
    expect(orderRepository.findOrderById).toHaveBeenCalledWith("store-id", "missing-order");
  });

  it("denies a repository result that does not belong to the actor's store", async () => {
    const orderRepository = availableOrderRepository({
      findOrderById: vi.fn(async () => ({ storeId: "another-store", order: orderDetail })),
    });
    const { app } = buildApp(owner, orderRepository);

    await request(app).get("/v1/orders/order-id").expect(403);
  });

  it("allows a manager to read source-backed order amount and payment status", async () => {
    const { app } = buildApp(manager, availableOrderRepository());

    const response = await request(app).get("/v1/orders/order-id").expect(200);

    expect(response.body.order.total).toEqual({ amount: "24.50", currency: "USD" });
    expect(response.body.order.payment).toEqual({ sourceStatus: "Paid", sourceMethod: null });
  });

  it("routes repository failures through the privacy-safe service error boundary", async () => {
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const orderRepository = availableOrderRepository({
      listOrders: vi.fn(async () => {
        throw new Error("database details that must not reach the response");
      }),
    });
    const { app } = buildApp(owner, orderRepository);

    const response = await request(app).get("/v1/orders").expect(500);

    expect(response.body.title).toBe("The service could not complete the request");
    expect(JSON.stringify(response.body)).not.toContain("database details");
    errorLog.mockRestore();
  });

  it("passes the authenticated manager to the scoped workforce repository", async () => {
    const { app, listVisibleEmployeeIds } = buildApp(manager);
    await request(app).get("/v1/workforce").expect(200);
    expect(listVisibleEmployeeIds).toHaveBeenCalledOnce();
    expect(listVisibleEmployeeIds.mock.calls[0]?.[0]).toEqual(manager);
  });
});
