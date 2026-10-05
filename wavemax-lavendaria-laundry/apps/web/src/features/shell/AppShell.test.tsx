import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { vi } from "vitest";

import { developmentSessions } from "../../app/auth/session-types";
import { DevelopmentSession } from "../../app/auth/DevelopmentSession";
import type { OrdersGateway } from "../orders/orders-gateway";
import { AppShell } from "./AppShell";

describe("role-correct navigation", () => {
  afterEach(cleanup);

  beforeEach(() => {
    window.location.hash = "#command-center";
  });

  it("shows the approved owner launch tiles on the command center, with no side rail", () => {
    render(<AppShell session={developmentSessions.OWNER} />);
    expect(screen.getByRole("heading", { name: "Owner workspace" })).toBeInTheDocument();
    expect(screen.queryByText("Recommendations")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Executive dashboard/ })).toHaveAttribute(
      "href",
      "#executive",
    );
    expect(screen.getByRole("link", { name: /Business analytics/ })).toHaveAttribute(
      "href",
      "#analytics",
    );
    expect(screen.getByRole("link", { name: /Inventory/ })).toHaveAttribute("href", "#inventory");
    // The rail is not rendered at all on the hub: it only appears once an area is open.
    expect(screen.queryByRole("link", { name: "Data sources" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Open navigation" })).not.toBeInTheDocument();
  });

  it("does not expose owner-only launch tiles to managers", () => {
    render(<AppShell session={developmentSessions.MANAGER} />);
    expect(screen.getByRole("heading", { name: "Manager workspace" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Employee details/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Inventory/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Revenue & loss/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Business analytics/ })).not.toBeInTheDocument();
  });

  it("reveals the side rail, scoped to the role, once an area is open", () => {
    window.location.hash = "#orders";
    render(<AppShell session={developmentSessions.OWNER} />);
    const analytics = screen.getByRole("link", { name: "Business analytics" });
    expect(analytics).toHaveAttribute("href", "#analytics");
    expect(screen.getByRole("link", { name: "Data sources" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Workforce management" })).toBeInTheDocument();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("keeps analytics navigation direct instead of creating a report flyout", () => {
    window.location.hash = "#orders";
    render(<AppShell session={developmentSessions.OWNER} />);
    expect(screen.getByRole("link", { name: "Business analytics" })).toHaveAttribute(
      "href",
      "#analytics",
    );
    expect(screen.queryByRole("menuitem")).not.toBeInTheDocument();
  });

  it("places the analytics report index in the rail while analytics is open", () => {
    window.location.hash = "#analytics/sales";
    render(<AppShell session={developmentSessions.OWNER} />);
    expect(screen.queryByRole("link", { name: "Overview" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sales" })).toHaveAttribute(
      "href",
      "#analytics/sales",
    );
    expect(screen.queryByRole("link", { name: "Compare sources" })).not.toBeInTheDocument();
    const businessLinks = screen.getByRole("navigation", { name: "Business reports navigation" });
    expect([...businessLinks.querySelectorAll("a")].map((link) => link.getAttribute("href"))).toEqual([
      "#analytics/sales",
      "#analytics/trends",
      "#analytics/products",
      "#analytics/cash",
      "#analytics/staff",
      "#analytics/customers",
    ]);
    const evidenceLinks = screen.getByRole("navigation", {
      name: "Evidence navigation",
    });
    expect(
      [...evidenceLinks.querySelectorAll("a")].map((link) => link.getAttribute("href")),
    ).toEqual(["#analytics/method"]);

    const analyticsLink = screen.getByRole("link", { name: "Business analytics" });
    expect(analyticsLink).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(analyticsLink);
    expect(screen.queryByRole("navigation", { name: "Business reports navigation" })).not.toBeInTheDocument();
    expect(analyticsLink).toHaveAttribute("aria-expanded", "false");
  });

  it("keeps the requested owner areas in their exact rail groups and order", () => {
    window.location.hash = "#executive";
    render(<AppShell session={developmentSessions.OWNER} />);

    const workspace = screen.getByRole("navigation", { name: "Workspace navigation" });
    expect([...workspace.querySelectorAll("a")].map((link) => link.textContent?.trim())).toEqual([
      "Executive dashboard",
      "Business analytics",
      "Orders",
      "Store operations",
      "Inventory",
    ]);
    const people = screen.getByRole("navigation", { name: "People navigation" });
    expect(people).toHaveTextContent("Workforce management");
  });

  it("scopes the rail to permitted areas for a manager inside a section", () => {
    window.location.hash = "#orders";
    render(<AppShell session={developmentSessions.MANAGER} />);
    expect(screen.getByRole("link", { name: "Orders" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Workforce management" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Business analytics" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Data sources" })).not.toBeInTheDocument();
  });

  it("returns to command center when a preview role loses access to the open area", () => {
    window.location.hash = "#analytics";
    render(<DevelopmentSession />);
    expect(screen.getByRole("heading", { name: "Business analytics" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Manager" }));
    expect(screen.getByRole("heading", { name: "Manager workspace" })).toBeInTheDocument();
    expect(window.location.hash).toBe("#command-center");
  });

  it("closes mobile navigation with the Escape key while inside a section", () => {
    window.location.hash = "#orders";
    render(<AppShell session={developmentSessions.OWNER} />);
    fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
    expect(screen.getByRole("button", { name: "Close navigation" })).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("button", { name: "Close navigation" })).not.toBeInTheDocument();
  });

  it("opens the separate revenue and loss report for the owner", async () => {
    window.location.hash = "#finance";
    render(<AppShell session={developmentSessions.OWNER} />);
    expect(screen.getByRole("heading", { name: "Revenue & loss" })).toBeInTheDocument();
    expect(window.location.hash).toBe("#finance");
  });

  it("routes an exact encoded order identifier into the detail request", async () => {
    const getOrder = vi.fn(async () => {
      throw new Error("Exact order request reached the detail boundary");
    });
    const ordersGateway: OrdersGateway = {
      listOrders: vi.fn(),
      getOrder,
    };
    window.location.hash = "#orders/exact%20order";

    render(<AppShell session={developmentSessions.OWNER} ordersGateway={ordersGateway} />);

    await waitFor(() =>
      expect(getOrder).toHaveBeenCalledWith("exact order", expect.any(AbortSignal)),
    );
    expect(
      await screen.findByRole("heading", {
        name: "Exact order request reached the detail boundary",
      }),
    ).toBeInTheDocument();
  });
});
