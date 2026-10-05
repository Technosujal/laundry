import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { loadArtifact } from "../../../test/artifact";
import type { AnalyticsSource, DataHealth, WdfSales } from "../analytics-gateway";
import { MethodologySection } from "./MethodologySection";

const artifact = loadArtifact<{
  run_id: string;
  wdf_sales: WdfSales;
  sources: AnalyticsSource[];
  health: DataHealth;
}>();

describe("calculation evidence", () => {
  afterEach(cleanup);

  it("separates publish blockers from review and note states", () => {
    render(
      <MethodologySection
        health={artifact.health}
        runId={artifact.run_id}
        sales={artifact.wdf_sales}
        sources={artifact.sources}
      />,
    );

    expect(screen.getByText("Publishable")).toBeInTheDocument();
    expect(screen.getAllByText("REVIEW").length).toBeGreaterThan(0);
    expect(screen.getAllByText("NOTE").length).toBeGreaterThan(0);
    expect(screen.queryByText("FAIL")).not.toBeInTheDocument();
    expect(screen.getByText("Export every page")).toBeInTheDocument();
    expect(screen.getByText("Reconcile cash and payouts")).toBeInTheDocument();
    expect(screen.getByText("Calculation controls")).toBeInTheDocument();
    expect(screen.getByText("Repeated sales lines")).toBeInTheDocument();
    expect(screen.getAllByText("No stable line ID exists.")).toHaveLength(2);
    expect(screen.getByText("Verify repeated source rows")).toBeInTheDocument();
    expect(artifact.health.results.find((row) => row.check_id === "V12")).toMatchObject({
      data_use: "Included",
      display_state: "NOTE",
      rule_reason: "No stable line ID exists.",
      next_step: "Verify repeated source rows",
    });
    expect(artifact.health.results.find((row) => row.check_id === "V08")).toMatchObject({
      data_use: "Separate",
      display_state: "REVIEW",
      rule_reason: "Production records lack paid-sale match.",
      next_step: "Review unmatched production orders",
    });
    expect(screen.getByText("Review repeated sales lines (36)")).toBeInTheDocument();
    expect(screen.getAllByText("# 7201").length).toBeGreaterThan(0);
  });
});
