import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { loadArtifact } from "../../test/artifact";
import type { AnalyticsGateway, OverviewResult } from "../analytics/analytics-gateway";
import { OperationsPage } from "./OperationsPage";

/**
 * Operations is the one analytics-derived page a manager may open, so the access rule it has to
 * honour is tested against the real artifact rather than a trimmed fixture: a manager must never
 * see a store-wide money figure.
 */
const artifact = loadArtifact<{
  run_id: string;
  wdf_sales: unknown;
  workforce: unknown;
  sources: unknown;
}>();

const overview = {
  state: "available",
  run_id: artifact.run_id,
  wdf_sales: artifact.wdf_sales,
  workforce: artifact.workforce,
  sources: artifact.sources,
} as OverviewResult;

function gateway(): AnalyticsGateway {
  return {
    listMetrics: vi.fn(),
    getMetric: vi.fn(),
    getOverview: vi.fn(async () => overview),
  } as unknown as AnalyticsGateway;
}

describe("store operations", () => {
  afterEach(cleanup);

  it("reports operational volumes from the verified source", async () => {
    const { container } = render(<OperationsPage gateway={gateway()} />);

    expect(await screen.findByText("Orders handled")).toBeInTheDocument();
    expect(screen.getByText("Pounds processed")).toBeInTheDocument();
    expect(screen.getByText("Orders by weekday and hour")).toBeInTheDocument();
    expect(screen.getByText("Sunday, 2 PM and Sunday, 5 PM")).toBeInTheDocument();
    expect(container.querySelector('[aria-label^="Sunday 2 PM:"]')).toBeInTheDocument();
    // 4,253 orders is the service's own count, shown here as a volume rather than a value.
    expect(screen.getAllByText("4,253").length).toBeGreaterThan(0);
  });

  it("shows no money anywhere, because a manager may not see store financials", async () => {
    const { container } = render(<OperationsPage gateway={gateway()} />);

    await screen.findByText("Orders handled");
    expect(container.textContent).not.toMatch(/\$\s?\d/);
    expect(container.textContent).not.toMatch(/counter sales/i);
  });

  it("limits department ranking to five and opens a monthly drill-down on selection", async () => {
    render(<OperationsPage gateway={gateway()} />);
    const heading = await screen.findByText("Workload by department");
    const panel = heading.closest("section");
    expect(panel).not.toBeNull();
    const bars = within(panel!).getAllByRole("button");
    expect(bars).toHaveLength(5);
    fireEvent.click(bars[0]!);
    expect(await screen.findByText(/workload by month/i)).toBeInTheDocument();
  });
});
