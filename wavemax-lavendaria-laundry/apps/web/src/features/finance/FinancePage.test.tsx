import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { loadArtifact } from "../../test/artifact";
import type {
  AnalyticsGateway,
  AnalyticsSource,
  CardAccounts,
  Machines,
  Metric,
  OverviewResult,
  SourceComparison,
  VacLog,
  WdfSales,
  Workforce,
} from "../analytics/analytics-gateway";
import { FinancePage } from "./FinancePage";

interface ArtifactSlice {
  run_id: string;
  wdf_sales: WdfSales;
  workforce: Workforce;
  sources: AnalyticsSource[];
  machines: Machines;
  metrics: Record<string, Metric>;
  accounts: CardAccounts;
  vac: VacLog;
  source_comparison: SourceComparison;
}

function gatewayFromArtifact(): AnalyticsGateway {
  const artifact = loadArtifact<ArtifactSlice>();
  const result: OverviewResult = {
    state: "available",
    ...artifact,
    metrics: Object.values(artifact.metrics),
  };
  return {
    listMetrics: vi.fn(),
    getMetric: vi.fn(),
    getOverview: vi.fn(async () => result),
  } as unknown as AnalyticsGateway;
}

describe("revenue and loss report", () => {
  afterEach(cleanup);

  it("shows the reconciled WDF financial totals as a dedicated report", async () => {
    render(<FinancePage gateway={gatewayFromArtifact()} />);

    expect(await screen.findByText("Revenue and cash movement statement")).toBeInTheDocument();
    expect(screen.getAllByText("$42,102.22").length).toBeGreaterThan(0);
    expect(screen.getAllByText("$47,928.76").length).toBeGreaterThan(0);
    expect(screen.getByText("Void detail")).toBeInTheDocument();
    expect(screen.getByText("Excluded")).toBeInTheDocument();
  });

  it("does not present voids as proven loss", async () => {
    render(<FinancePage gateway={gatewayFromArtifact()} />);
    await screen.findByText("Revenue and cash movement statement");
    expect(document.body.textContent).toContain("Orders reversed at the register");
    expect(document.body.textContent).toContain("operating costs absent");
  });
});
