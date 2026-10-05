import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { loadArtifact } from "../../test/artifact";
import type { AnalyticsGateway, OverviewResult } from "../analytics/analytics-gateway";
import { ExecutiveDashboardPage } from "./ExecutiveDashboardPage";

const artifact = loadArtifact<{
  run_id: string;
  wdf_sales: unknown;
  workforce: unknown;
  sources: unknown;
  machines: unknown;
  accounts: unknown;
  vac: unknown;
  metrics: Record<string, unknown>;
  source_comparison: unknown;
  health: unknown;
}>();

const overview = {
  state: "available",
  run_id: artifact.run_id,
  wdf_sales: artifact.wdf_sales,
  workforce: artifact.workforce,
  sources: artifact.sources,
  machines: artifact.machines,
  accounts: artifact.accounts,
  vac: artifact.vac,
  metrics: Object.values(artifact.metrics),
  source_comparison: artifact.source_comparison,
  health: artifact.health,
} as OverviewResult;

function gateway(): AnalyticsGateway {
  return {
    listMetrics: vi.fn(),
    getMetric: vi.fn(),
    getOverview: vi.fn(async () => overview),
  } as unknown as AnalyticsGateway;
}

describe("executive dashboard", () => {
  afterEach(cleanup);

  it("leads with whole-business recorded-revenue totals", async () => {
    render(<ExecutiveDashboardPage gateway={gateway()} />);

    expect(
      await screen.findByRole("heading", { name: "Recorded business totals" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Total recorded revenue")).toBeInTheDocument();
    expect(screen.getByText("Average monthly revenue")).toBeInTheDocument();
    expect(screen.getByText("Latest recorded-day revenue")).toBeInTheDocument();
    expect(screen.getByText("WDF paid orders")).toBeInTheDocument();
    expect(screen.getByText("WDF average ticket")).toBeInTheDocument();
    expect(screen.getByText("Recorded service events")).toBeInTheDocument();
    expect(screen.getByText("74,656")).toBeInTheDocument();
    expect(screen.getByText("Rolling 7-day")).toBeInTheDocument();
    expect(screen.getByText("Month over month")).toBeInTheDocument();
    expect(screen.getByText("Year over year")).toBeInTheDocument();
    expect(screen.getByText("Only one complete year")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Owner review" })).toBeInTheDocument();
    expect(screen.getByText("Production orders missing from paid sales")).toBeInTheDocument();
    expect(screen.getByText("Open 31 records")).toBeInTheDocument();
    expect(screen.getByText("Payment unknown")).toBeInTheDocument();
    expect(screen.getByText("Production value")).toBeInTheDocument();
    expect(screen.getByText("Cash sales less payouts")).toBeInTheDocument();
    expect(screen.getByText("Signals to verify")).toBeInTheDocument();
    expect(screen.getByText("Normal operating ranges are not configured")).toBeInTheDocument();
    expect(screen.queryByText("Investigate")).not.toBeInTheDocument();
    expect(screen.getByText("Repeated sales lines")).toBeInTheDocument();
    expect(screen.getByText("Missing sales fields")).toBeInTheDocument();
  });

  it("uses combined revenue and does not duplicate the source-specific analytics", async () => {
    render(<ExecutiveDashboardPage gateway={gateway()} />);

    await screen.findByRole("heading", { name: "Revenue trends" });
    expect(screen.getByText("Monthly revenue by source")).toBeInTheDocument();
    expect(screen.getByText("Revenue by source")).toBeInTheDocument();
    expect(screen.getByText("Quarterly recorded revenue")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Data coverage" })).toBeInTheDocument();
    expect(screen.queryByText("Machine revenue")).not.toBeInTheDocument();
    expect(screen.getByText("Card value loaded")).toBeInTheDocument();
    expect(screen.getByText("Average washer cycles per day")).toBeInTheDocument();
    expect(screen.getByText("Washer revenue per cycle")).toBeInTheDocument();
    expect(screen.getByText("Average daily card activity")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /reports$/i })).not.toBeInTheDocument();
    expect(screen.queryByText("Top products and services")).not.toBeInTheDocument();
    expect(screen.queryByText(/AI-generated/i)).not.toBeInTheDocument();
  });

  it("calculates year-over-year from supplied years", async () => {
    const multiYear = structuredClone(overview);
    if (multiYear.state !== "available") throw new Error("Expected available overview");
    multiYear.source_comparison.by_year = [
      {
        period: "2024",
        wdf_counter_sales: "40000.00",
        laundro_machine_revenue: "400000.00",
      },
      {
        period: "2025",
        wdf_counter_sales: "42102.22",
        laundro_machine_revenue: "453200.85",
      },
    ];
    const multiYearGateway = {
      ...gateway(),
      getOverview: vi.fn(async () => multiYear),
    } as AnalyticsGateway;

    render(<ExecutiveDashboardPage gateway={multiYearGateway} />);

    expect(await screen.findByText("2025 versus 2024")).toBeInTheDocument();
    expect(screen.getByText("+12.6%")).toBeInTheDocument();
  });

  it("lets owners inspect longer daily and monthly ranges", async () => {
    render(<ExecutiveDashboardPage gateway={gateway()} />);

    const dailyRange = await screen.findByRole("group", { name: "Daily range" });
    fireEvent.click(within(dailyRange).getByRole("button", { name: "90D" }));
    expect(within(dailyRange).getByRole("button", { name: "90D" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("img", { name: "Line chart over 90 periods" })).toBeInTheDocument();

    const monthlyRange = screen.getByRole("group", { name: "Monthly range" });
    fireEvent.click(within(monthlyRange).getByRole("button", { name: "6M" }));
    expect(screen.getByRole("img", { name: "Line chart over 6 periods" })).toBeInTheDocument();
  });
});
