export class OrderSourceUnavailableError extends Error {
  public constructor() {
    super("Order details are unavailable until WDF is connected");
    this.name = "OrderSourceUnavailableError";
  }
}

export class OrderNotFoundError extends Error {
  public constructor() {
    super("Order not found");
    this.name = "OrderNotFoundError";
  }
}

export class OrderScopeError extends Error {
  public constructor() {
    super("You do not have access to this order");
    this.name = "OrderScopeError";
  }
}
