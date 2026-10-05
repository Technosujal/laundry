import { describe, expect, it } from "vitest";

import { loadArtifact } from "../../test/artifact";
import type { OverviewResult } from "../analytics/analytics-gateway";
import { deriveExecutiveMetrics } from "./executive-metrics";

const artifact = loadArtifact<Record<string, unknown>>();
const overview = {
  state: "available",
  ...artifact,
  metrics: Object.values(artifact.metrics as Record<string, unknown>),
} as Extract<OverviewResult, { state: "available" }>;

describe("executive metrics", () => {
  it("combines paid counter orders with washer cycles as recorded service events", () => {
    const metrics = deriveExecutiveMetrics(overview);

    expect(metrics.paidOrders).toBe(4253);
    expect(metrics.washerCycles).toBe(70403);
    expect(metrics.recordedServiceEvents).toBe(74656);
  });

  it("keeps compatible machine and stored-value calculations separate", () => {
    const metrics = deriveExecutiveMetrics(overview);

    expect(metrics.washerRevenuePerCycle).toBeCloseTo(5.49, 2);
    expect(metrics.averageDailyWasherCycles).toBeCloseTo(192.88, 2);
    expect(metrics.loadSpendGap).toBeCloseTo(21275.15, 2);
    expect(metrics.outstandingCardBalance).toBeCloseTo(88372.45, 2);
  });
});
