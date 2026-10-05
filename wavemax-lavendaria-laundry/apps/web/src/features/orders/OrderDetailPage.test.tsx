import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { OrderDetailPage } from "./OrderDetailPage";
import type { OrderDetailResponse, OrdersGateway } from "./orders-gateway";

const response: OrderDetailResponse = {
  coverage: {
    state: "complete",
    reason: "COMPLETE_SOURCE_RECONCILED",
    source: "WDF POS",
    reportedTotal: 1,
    returnedCount: 1,
    lastSuccessfulSync: "2026-09-14T12:00:00Z",
  },
  order: {
    id: "exact-order-id",
    sourceReference: "source-order-reference",
    createdAt: "2026-09-14T10:00:00Z",
    sourceStatus: "Ready",
    customer: {
      identityState: "source_only",
      displayName: null,
      email: null,
      phone: null,
    },
    payment: { sourceStatus: "Paid", sourceMethod: null },
    total: { amount: "10.00", currency: "USD" },
    serviceType: null,
    channel: null,
    subtotal: { amount: null, currency: null },
    tax: { amount: null, currency: null },
    tip: { amount: null, currency: null },
    surcharge: { amount: null, currency: null },
    promise: { promisedReadyAt: null, promisedDeliveryAt: null },
    assignment: {
      employeeId: null,
      employeeDisplayName: null,
      machineReference: null,
    },
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
    unavailableFields: ["customer.displayName", "serviceType"],
  },
};

describe("individual order view", () => {
  afterEach(cleanup);

  it("shows every contract area and preserves unavailable source fields", async () => {
    const gateway: OrdersGateway = {
      listOrders: vi.fn(),
      getOrder: vi.fn(async () => response),
    };

    render(<OrderDetailPage gateway={gateway} orderId="exact-order-id" />);

    expect(
      await screen.findByRole("heading", { name: "Order source-order-reference" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Customer" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Payment" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Promise and assignment" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Order history" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Source evidence" })).toBeInTheDocument();
    expect(screen.getAllByText("Not supplied by source").length).toBeGreaterThan(1);
    expect(screen.getByText(/2 fields were not supplied/)).toBeInTheDocument();
    expect(screen.getByText("No event history was supplied by the source.")).toBeInTheDocument();
  });
});
