import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { OrderQueuePage } from "./OrderQueuePage";
import { OrdersGatewayError, type OrderListResponse, type OrdersGateway } from "./orders-gateway";

const available: OrderListResponse = {
  items: [
    {
      id: "exact-order-id",
      sourceReference: "source-order-reference",
      createdAt: null,
      sourceStatus: "Paid",
      customer: { identityState: "unresolved", displayName: null, email: null, phone: null },
      payment: { sourceStatus: "Paid", sourceMethod: null },
      total: { amount: "10.00", currency: "USD" },
    },
  ],
  coverage: {
    state: "partial",
    reason: "SOURCE_PARTIAL",
    source: "WDF POS",
    reportedTotal: 1,
    returnedCount: 1,
    lastSuccessfulSync: null,
  },
  page: { nextCursor: null, hasMore: false },
};

function gateway(response: OrderListResponse): OrdersGateway {
  return { listOrders: vi.fn(async () => response), getOrder: vi.fn() };
}

describe("order queue", () => {
  afterEach(cleanup);

  it("opens the exact selected order and sends one shared filter context", async () => {
    const ordersGateway = gateway(available);
    render(<OrderQueuePage gateway={ordersGateway} />);

    fireEvent.click(await screen.findByRole("button", { name: "Open orders" }));
    const orderLinks = await screen.findAllByRole("link", { name: /source-order-reference/i });
    expect(orderLinks.every((link) => link.getAttribute("href") === "#orders/exact-order-id")).toBe(
      true,
    );

    fireEvent.change(screen.getByPlaceholderText("Order number or customer"), {
      target: { value: "  exact  " },
    });
    fireEvent.change(screen.getByLabelText("Order status"), { target: { value: "Voided" } });
    fireEvent.change(screen.getByLabelText("Service type"), {
      target: { value: "Laundry service" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));

    await waitFor(() => {
      expect(ordersGateway.listOrders).toHaveBeenLastCalledWith(
        {
          limit: 24,
          search: "exact",
          sourceStatus: "Voided",
          paymentStatus: "Laundry service",
        },
        undefined,
      );
    });
  });

  it("offers every status the source records, not only those on the current page", async () => {
    render(<OrderQueuePage gateway={gateway(available)} />);

    fireEvent.click(await screen.findByRole("button", { name: "Open orders" }));
    await screen.findAllByRole("link", { name: /source-order-reference/i });
    // The loaded page holds only a Paid order, but Voided must still be selectable.
    const statuses = screen.getByLabelText("Order status");
    expect(statuses).toHaveTextContent("Paid");
    expect(statuses).toHaveTextContent("Voided");
  });

  it("shows nothing at all when the source cannot be read", async () => {
    const failing: OrdersGateway = {
      listOrders: vi.fn(async () => {
        throw new OrdersGatewayError(503, "The order source could not be read", null);
      }),
      getOrder: vi.fn(),
    };
    render(<OrderQueuePage gateway={failing} />);

    expect(await screen.findByText("ORDERS COULD NOT BE READ")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Open exact order/i })).not.toBeInTheDocument();
    // A failed read must never be dressed up as an empty store.
    expect(screen.queryByText("No orders match these filters")).not.toBeInTheDocument();
  });

  it("keeps the exact-order ledger collapsed until the owner opens it", async () => {
    render(<OrderQueuePage gateway={gateway(available)} />);

    const toggle = await screen.findByRole("button", { name: "Open orders" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByPlaceholderText("Order number or customer")).not.toBeInTheDocument();

    fireEvent.click(toggle);
    expect(screen.getByRole("button", { name: "Hide orders" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByPlaceholderText("Order number or customer")).toBeInTheDocument();
  });
});
