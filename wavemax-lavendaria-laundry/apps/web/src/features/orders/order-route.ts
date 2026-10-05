export interface OrderIssueContext {
  orderId: string;
  issueCode?: string;
}

const issueCodePattern = /^[A-Z][A-Z0-9_]{2,63}$/;

export function orderDetailHash(orderId: string, issueCode?: string) {
  const path = `#orders/${encodeURIComponent(orderId)}`;
  return issueCode ? `${path}?issue=${encodeURIComponent(issueCode)}` : path;
}

export function parseOrderDetailHash(value: string): OrderIssueContext | null {
  const [path, queryString = ""] = value.split("?", 2);
  const [area, encodedOrderId, ...unexpected] = path?.split("/") ?? [];
  if (area !== "orders" || !encodedOrderId || unexpected.length) return null;

  try {
    const orderId = decodeURIComponent(encodedOrderId).trim();
    if (!orderId || orderId.length > 128) return null;
    const issueCode = new URLSearchParams(queryString).get("issue");
    if (issueCode && !issueCodePattern.test(issueCode)) return null;
    return issueCode ? { orderId, issueCode } : { orderId };
  } catch {
    return null;
  }
}
