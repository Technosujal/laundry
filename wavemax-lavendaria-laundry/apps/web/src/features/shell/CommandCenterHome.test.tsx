import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AnalyticsGateway, OverviewResult } from "../analytics/analytics-gateway";
import { CommandCenterHome } from "./CommandCenterHome";
import { arrange, loadPreferences, moveTo, reorder } from "./launch-preferences";

/** The tiles are rendered as <strong>, not headings, so read them positionally instead. */
function titlesInOrder(): string[] {
  const grid = screen.getByLabelText(/workspace areas/);
  return [...grid.querySelectorAll("strong")].map((node) => node.textContent?.trim() ?? "");
}

describe("command center customization", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(cleanup);

  it("does not offer tile controls until customizing is switched on", () => {
    render(<CommandCenterHome role="OWNER" />);

    expect(screen.getByRole("button", { name: "Customize" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Move / })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Hide / })).not.toBeInTheDocument();
    // Tiles navigate normally until then.
    expect(screen.getByRole("link", { name: /Executive dashboard/ })).toHaveAttribute(
      "href",
      "#executive",
    );
  });

  it("shows the latest common recorded day without calling it live activity", async () => {
    const result = {
      state: "available",
      wdf_sales: {
        analytics: {
          available: true,
          by_day: [
            { period: "2025-12-30", subtotal: "140.00", order_count: 8 },
            { period: "2025-12-31", subtotal: "175.42", order_count: 11 },
          ],
        },
      },
      metrics: [
        {
          definition: { metric_id: "machine_revenue_total" },
          by_day: [
            { period: "2025-12-30", value: "510.00" },
            { period: "2025-12-31", value: "681.95" },
          ],
        },
        {
          definition: { metric_id: "washer_cycles_total" },
          by_day: [
            { period: "2025-12-30", value: "91" },
            { period: "2025-12-31", value: "104" },
          ],
        },
      ],
    } as unknown as OverviewResult;
    const gateway = {
      getOverview: async () => result,
    } as AnalyticsGateway;

    render(<CommandCenterHome analyticsGateway={gateway} role="OWNER" />);

    expect(await screen.findByRole("heading", { name: "Latest recorded day" })).toBeInTheDocument();
    expect(screen.getByText("$175.42")).toBeInTheDocument();
    expect(screen.getByText("$681.95")).toBeInTheDocument();
    expect(screen.getByText("2025-December-31 · Historical")).toBeInTheDocument();
    expect(screen.queryByText(/today/i)).not.toBeInTheDocument();
  });

  it("does not request owner activity for a manager", () => {
    const getOverview = vi.fn();
    render(
      <CommandCenterHome
        analyticsGateway={{ getOverview } as unknown as AnalyticsGateway}
        role="MANAGER"
      />,
    );

    expect(getOverview).not.toHaveBeenCalled();
    expect(screen.queryByRole("heading", { name: "Latest recorded day" })).not.toBeInTheDocument();
  });

  it("shows employees only their own workforce launch", () => {
    const getOverview = vi.fn();
    render(
      <CommandCenterHome
        analyticsGateway={{ getOverview } as unknown as AnalyticsGateway}
        role="EMPLOYEE"
      />,
    );
    expect(screen.getByRole("link", { name: /My workforce/ })).toHaveAttribute(
      "href",
      "#workforce",
    );
    expect(screen.queryByRole("link", { name: /Executive dashboard/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Order management/ })).not.toBeInTheDocument();
    expect(getOverview).not.toHaveBeenCalled();
  });

  it("reveals the controls and stops tiles navigating while customizing", () => {
    render(<CommandCenterHome role="OWNER" />);
    fireEvent.click(screen.getByRole("button", { name: "Customize" }));

    expect(screen.getByRole("button", { name: "Done" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hide Executive dashboard" })).toBeInTheDocument();
    // A tile being rearranged must not also be a link that navigates away mid-edit.
    expect(screen.queryByRole("link", { name: /Executive dashboard/ })).not.toBeInTheDocument();
  });

  it("moves a tile and keeps the new order after customizing ends", () => {
    render(<CommandCenterHome role="OWNER" />);
    expect(titlesInOrder()[0]).toBe("Executive dashboard");

    fireEvent.click(screen.getByRole("button", { name: "Customize" }));
    fireEvent.click(screen.getByRole("button", { name: "Move Business analytics earlier" }));
    fireEvent.click(screen.getByRole("button", { name: "Done" }));

    expect(titlesInOrder().slice(0, 2)).toEqual(["Business analytics", "Executive dashboard"]);
    expect(loadPreferences("OWNER").order[0]).toBe("analytics");
  });

  it("cannot move the first tile earlier or the last tile later", () => {
    render(<CommandCenterHome role="OWNER" />);
    fireEvent.click(screen.getByRole("button", { name: "Customize" }));

    expect(screen.getByRole("button", { name: "Move Executive dashboard earlier" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Move Inventory later" })).toBeDisabled();
  });

  it("hides a tile from the Command Center but keeps it restorable while customizing", () => {
    render(<CommandCenterHome role="OWNER" />);
    fireEvent.click(screen.getByRole("button", { name: "Customize" }));
    fireEvent.click(screen.getByRole("button", { name: "Hide Inventory" }));

    // Still listed while customizing, so it can be brought back.
    expect(screen.getByRole("button", { name: "Show Inventory" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(titlesInOrder()).not.toContain("Inventory");
    expect(loadPreferences("OWNER").hidden).toContain("inventory");
  });

  it("restores the shipped arrangement on reset", () => {
    render(<CommandCenterHome role="OWNER" />);
    fireEvent.click(screen.getByRole("button", { name: "Customize" }));
    fireEvent.click(screen.getByRole("button", { name: "Hide Inventory" }));
    fireEvent.click(screen.getByRole("button", { name: "Reset to default" }));
    fireEvent.click(screen.getByRole("button", { name: "Done" }));

    expect(titlesInOrder()).toEqual([
      "Executive dashboard",
      "Business analytics",
      "Order management",
      "Store operations",
      "Employee details",
      "Inventory",
    ]);
    expect(loadPreferences("OWNER")).toEqual({ order: [], hidden: [], sizes: {} });
  });

  it("resizes a tile and remembers the chosen width", () => {
    render(<CommandCenterHome role="OWNER" />);
    fireEvent.click(screen.getByRole("button", { name: "Customize" }));
    fireEvent.click(screen.getByRole("button", { name: "Full width Inventory" }));

    expect(screen.getByRole("button", { name: "Full width Inventory" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(loadPreferences("OWNER").sizes["inventory"]).toBe("large");
  });

  it("returns a tile to its automatic width when the same size is chosen again", () => {
    render(<CommandCenterHome role="OWNER" />);
    fireEvent.click(screen.getByRole("button", { name: "Customize" }));
    fireEvent.click(screen.getByRole("button", { name: "Small Inventory" }));
    fireEvent.click(screen.getByRole("button", { name: "Small Inventory" }));

    expect(loadPreferences("OWNER").sizes["inventory"]).toBeUndefined();
  });

  it("reorders on a drag from one tile onto another", () => {
    render(<CommandCenterHome role="OWNER" />);
    fireEvent.click(screen.getByRole("button", { name: "Customize" }));

    const tiles = screen.getAllByRole("listitem");
    const inventory = tiles[tiles.length - 1] as HTMLElement;
    const first = tiles[0] as HTMLElement;

    // jsdom supplies no transfer object, so stand one in to exercise the real handler.
    const dataTransfer = {
      effectAllowed: "",
      dropEffect: "",
      setData: () => {},
      getData: () => "",
    };
    fireEvent.dragStart(inventory, { dataTransfer });
    fireEvent.dragOver(first, { dataTransfer });
    fireEvent.dragEnd(inventory, { dataTransfer });

    expect(titlesInOrder()[0]).toBe("Inventory");
    expect(loadPreferences("OWNER").order[0]).toBe("inventory");
  });

  it("ignores a stored width the build does not recognise", () => {
    window.localStorage.setItem(
      "wavemax.launch-tiles.OWNER",
      JSON.stringify({ order: [], hidden: [], sizes: { inventory: "gigantic" } }),
    );
    render(<CommandCenterHome role="OWNER" />);
    expect(loadPreferences("OWNER").sizes["inventory"]).toBeUndefined();
  });

  it("keeps one role's arrangement out of the other's", () => {
    const { unmount } = render(<CommandCenterHome role="OWNER" />);
    fireEvent.click(screen.getByRole("button", { name: "Customize" }));
    fireEvent.click(screen.getByRole("button", { name: "Hide Order management" }));
    unmount();

    render(<CommandCenterHome role="MANAGER" />);
    expect(titlesInOrder()).toContain("Order management");
  });

  it("never lets a stored arrangement widen what a role can see", () => {
    // A manager whose stored layout names owner-only tiles must still not be shown them.
    window.localStorage.setItem(
      "wavemax.launch-tiles.MANAGER",
      JSON.stringify({ order: ["finance", "analytics", "orders"], hidden: [] }),
    );
    render(<CommandCenterHome role="MANAGER" />);

    const titles = titlesInOrder();
    expect(titles).not.toContain("Revenue & loss");
    expect(titles).not.toContain("Business analytics");
    expect(titles[0]).toBe("Order management");
  });

  it("ignores a corrupt or unreadable stored arrangement", () => {
    window.localStorage.setItem("wavemax.launch-tiles.OWNER", "not json at all");
    render(<CommandCenterHome role="OWNER" />);
    expect(titlesInOrder()[0]).toBe("Executive dashboard");
  });
});

describe("launch preference rules", () => {
  const available = [{ id: "a" }, { id: "b" }, { id: "c" }];

  it("drops saved ids the build no longer has", () => {
    const result = arrange(available, { order: ["c", "gone", "a"], hidden: [], sizes: {} });
    expect(result.map((item) => item.id)).toEqual(["c", "a", "b"]);
  });

  it("keeps tiles added since the arrangement was saved", () => {
    // "c" shipped after this viewer customised; it must still appear rather than vanish.
    const result = arrange(available, { order: ["b", "a"], hidden: [], sizes: {} });
    expect(result.map((item) => item.id)).toEqual(["b", "a", "c"]);
  });

  it("moves a tile to an exact position, or nowhere when the position is invalid", () => {
    expect(moveTo(["a", "b", "c"], "c", 0)).toEqual(["c", "a", "b"]);
    expect(moveTo(["a", "b", "c"], "a", 2)).toEqual(["b", "c", "a"]);
    expect(moveTo(["a", "b", "c"], "a", 0)).toEqual(["a", "b", "c"]);
    expect(moveTo(["a", "b", "c"], "a", 9)).toEqual(["a", "b", "c"]);
    expect(moveTo(["a", "b", "c"], "missing", 1)).toEqual(["a", "b", "c"]);
  });

  it("refuses to move a tile past either end", () => {
    expect(reorder(["a", "b", "c"], "a", -1)).toEqual(["a", "b", "c"]);
    expect(reorder(["a", "b", "c"], "c", 1)).toEqual(["a", "b", "c"]);
    expect(reorder(["a", "b", "c"], "b", -1)).toEqual(["b", "a", "c"]);
  });
});
