import { describe, expect, it } from "vitest";

import { orderDetailHash, parseOrderDetailHash } from "./order-route";

describe("exact order routes", () => {
  it("round trips the exact order and typed issue context", () => {
    const hash = orderDetailHash("internal order/id", "ORDER_REQUIRES_REVIEW");

    expect(hash).toBe("#orders/internal%20order%2Fid?issue=ORDER_REQUIRES_REVIEW");
    expect(parseOrderDetailHash(hash.slice(1))).toEqual({
      orderId: "internal order/id",
      issueCode: "ORDER_REQUIRES_REVIEW",
    });
  });

  it("rejects malformed issue context instead of opening a generic queue", () => {
    expect(parseOrderDetailHash("orders/order-id?issue=free form text")).toBeNull();
    expect(parseOrderDetailHash("orders/order-id/extra")).toBeNull();
  });
});
