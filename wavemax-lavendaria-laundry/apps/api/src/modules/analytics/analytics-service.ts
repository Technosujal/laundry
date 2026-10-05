import type { Actor } from "../auth/access-policy.js";
import type { AnalyticsRepository } from "./analytics-repository.js";
import type { AnalyticsResult, Metric, MetricDefinition } from "./analytics-types.js";

export interface MetricSummary {
  metric_id: string;
  label: string;
  unit: string;
  total: string;
  first_day: string | null;
  last_day: string | null;
  distinct_days: number;
  coverage_state: string;
  coverage_note: string;
  known_limitations: readonly string[];
  quarantined_rows: number;
}

export class AnalyticsService {
  public constructor(private readonly repository: AnalyticsRepository) {}

  public async getOverview(actor: Actor): Promise<AnalyticsResult> {
    return this.repository.getAnalytics(actor.storeId);
  }

  /** Compact list for the overview page. The full definition stays available per metric. */
  public async listMetrics(
    actor: Actor,
  ): Promise<
    | { state: "available"; run_id: string; metrics: MetricSummary[] }
    | Extract<AnalyticsResult, { state: "unavailable" }>
  > {
    const result = await this.repository.getAnalytics(actor.storeId);
    if (result.state === "unavailable") return result;
    return {
      state: "available",
      run_id: result.run_id,
      metrics: Object.values(result.metrics).map(summarise),
    };
  }

  public async getMetric(
    actor: Actor,
    metricId: string,
  ): Promise<
    | { state: "available"; run_id: string; metric: Metric }
    | Extract<AnalyticsResult, { state: "unavailable" }>
    | { state: "not_found" }
  > {
    const result = await this.repository.getAnalytics(actor.storeId);
    if (result.state === "unavailable") return result;
    const metric = result.metrics[metricId];
    if (!metric) return { state: "not_found" };
    return { state: "available", run_id: result.run_id, metric };
  }
}

function summarise(metric: Metric): MetricSummary {
  const definition: MetricDefinition = metric.definition;
  return {
    metric_id: definition.metric_id,
    label: definition.label,
    unit: metric.unit,
    total: metric.total,
    first_day: metric.first_day,
    last_day: metric.last_day,
    distinct_days: metric.distinct_days,
    coverage_state: definition.coverage_state,
    coverage_note: definition.coverage_note,
    known_limitations: definition.known_limitations,
    quarantined_rows: metric.quality.quarantined_rows,
  };
}
