import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { AnalyticsGateway, Workforce } from "../analytics/analytics-gateway";
import { WorkforcePage } from "./WorkforcePage";

const workforce: Workforce = {
  definition: {
    metric_id: "workforce_plausible_hours",
    label: "Recorded labour hours (plausible entries)",
    business_meaning: "Hours worked from credible clock entries.",
    formula: "sum(duration_minutes) / 60",
    source_system: "WDF_POS",
    source_files: ["Timesheet.csv"],
    source_fields: ["duration_minutes"],
    unit: "HOURS",
    grain: "time entry",
    population: "Clock entries.",
    inclusions: ["Entries up to 16 hours."],
    exclusions: ["Entries longer than 16 hours."],
    null_treatment: "Quarantined.",
    duplicate_treatment: "None applied.",
    rounding: "Exact minutes.",
    timezone_basis: "As reported.",
    coverage_state: "PARTIAL",
    coverage_note: "Over-length entries dominate the raw total.",
    known_limitations: ["Labour cost cannot be derived, as no pay rate exists."],
    drill_down: "Per employee.",
    definition_version: "test/1.0.0",
  },
  plausible_hours: "2677.4",
  plausible_entries: 417,
  excluded_entries: 67,
  excluded_hours: "16801.0",
  reported_total_hours: "19478.4",
  employee_count: 6,
  by_employee: [
    { employee_key: "9cafb99151e2c6c7", hours: "1268.0", entries: 185, excluded_entries: 38 },
  ],
  quality: {
    input_rows: 484,
    accepted_rows: 484,
    quarantined_rows: 0,
    warning_counts: { IMPLAUSIBLE_SHIFT_LENGTH: 61 },
  },
};

const gateway = {
  listMetrics: vi.fn(),
  getMetric: vi.fn(),
  getOverview: vi.fn(async () => ({
    state: "available" as const,
    run_id: "run",
    wdf_sales: {} as never,
    workforce,
    sources: [],
  })),
} as unknown as AnalyticsGateway;

describe("workforce access and honesty", () => {
  afterEach(cleanup);

  it("never shows store-wide hours to a manager", async () => {
    render(<WorkforcePage gateway={gateway} role="MANAGER" />);
    expect(await screen.findByText("Your team's hours are not available yet")).toBeInTheDocument();
    expect(screen.queryByText(/2,677/)).not.toBeInTheDocument();
    expect(screen.queryByText(/19,478/)).not.toBeInTheDocument();
  });

  it("shows no store-wide hours to an unlinked employee", () => {
    render(<WorkforcePage gateway={gateway} role="EMPLOYEE" />);
    expect(screen.getByText("Your workforce records are not linked yet")).toBeInTheDocument();
    expect(screen.queryByText(/2,677/)).not.toBeInTheDocument();
  });

  it("shows the owner plausible hours, not the inflated raw total", async () => {
    render(<WorkforcePage gateway={gateway} role="OWNER" />);
    expect(await screen.findByText("2,677.4 hours")).toBeInTheDocument();
  });

  it("states the excluded entries rather than hiding them", async () => {
    render(<WorkforcePage gateway={gateway} role="OWNER" />);
    expect(await screen.findByText(/The raw timesheet total is not usable/)).toBeInTheDocument();
    expect(screen.getByText(/19,478.4 hours/)).toBeInTheDocument();
    expect(screen.getByText(/16,801 hours/)).toBeInTheDocument();
  });

  it("publishes no employee names", async () => {
    render(<WorkforcePage gateway={gateway} role="OWNER" />);
    expect(await screen.findByText("9cafb99151e2c6c7")).toBeInTheDocument();
  });

  it("repeats what the measure cannot tell you", async () => {
    render(<WorkforcePage gateway={gateway} role="OWNER" />);
    expect(
      await screen.findByText("Labour cost cannot be derived, as no pay rate exists."),
    ).toBeInTheDocument();
  });
});
