export type CoverageState = "COMPLETE" | "PARTIAL";

export interface MetricDefinition {
  metric_id: string;
  label: string;
  business_meaning: string;
  formula: string;
  source_system: string;
  source_files: readonly string[];
  source_fields: readonly string[];
  unit: string;
  grain: string;
  population: string;
  inclusions: readonly string[];
  exclusions: readonly string[];
  null_treatment: string;
  duplicate_treatment: string;
  rounding: string;
  timezone_basis: string;
  coverage_state: CoverageState;
  coverage_note: string;
  known_limitations: readonly string[];
  drill_down: string;
  definition_version: string;
}

export interface PeriodValue {
  period: string;
  value: string;
  day_count: number;
}

export interface MetricQuality {
  input_rows: number;
  accepted_rows: number;
  quarantined_rows: number;
  reason_counts: Record<string, number>;
  warning_counts: Record<string, number>;
}

export interface Metric {
  definition: MetricDefinition;
  unit: string;
  machine_scope: string;
  business_event: string;
  source_coverage_note: string;
  total: string;
  first_day: string | null;
  last_day: string | null;
  distinct_days: number;
  by_year: readonly PeriodValue[];
  by_month: readonly PeriodValue[];
  by_day: readonly PeriodValue[];
  quality: MetricQuality;
}

export interface MachineRow {
  machine: string;
  machine_class: string;
  revenue: string;
  cycles: string;
}

export interface MachineBreakdown {
  machine_count: number;
  by_class: Record<string, { machine_count: number; revenue: string; cycles: string }>;
  machines: readonly MachineRow[];
  quality: { input_rows: number; accepted_rows: number; quarantined_rows: number } & {
    warning_counts: Record<string, number>;
  };
  scope_warning: string;
}

export interface SalesGroup {
  name: string;
  subtotal: string;
  line_count: number;
  order_count: number;
}

export interface WdfSales {
  definition: MetricDefinition;
  total: string;
  line_count: number;
  order_count: number;
  negative_lines: number;
  zero_lines: number;
  by_category: readonly SalesGroup[];
  by_department: readonly SalesGroup[];
  coverage: {
    state: string;
    reason: string;
    explanation: string;
    absent_commercial_value: string;
    absent_commercial_orders: number;
    voided_value_gross: string;
  };
}

export interface AnalyticsSource {
  source_system: string;
  file: string;
  sha256: string;
  size_bytes: number;
  parser_version: string;
  rule_version: string;
  disposition?: "REFERENCE_COPY" | "NO_RECORDS";
  row_count?: number;
  non_empty_cells?: number;
  sheet_count?: number;
}

export interface SourceComparisonPoint {
  period: string;
  wdf_counter_sales: string;
  laundro_machine_revenue: string;
}

export interface SourceComparison {
  definition_version: string;
  formula: string;
  meaning: string;
  by_day: readonly SourceComparisonPoint[];
  by_month: readonly SourceComparisonPoint[];
  by_year: readonly SourceComparisonPoint[];
  supported: {
    day: boolean;
    month: boolean;
    year: boolean;
    time_of_day: boolean;
    customer: boolean;
  };
  limitations: readonly string[];
}

export interface AnalyticsArtifact {
  artifact_version: string;
  run_id: string;
  sources: readonly AnalyticsSource[];
  metrics: Record<string, Metric>;
  machines: MachineBreakdown;
  wdf_sales: WdfSales;
  source_comparison: SourceComparison;
  health: {
    checks: number;
    pass: number;
    fail: number;
    not_evaluated: number;
    blocking: number;
    results: readonly {
      check_id: string;
      check: string;
      status: "PASS" | "FAIL" | "NOT_EVALUATED";
      action_on_fail: "block" | "warn" | "log";
      detail: string;
    }[];
  };
}

/** Returned when no artifact has been built, so the UI can say so rather than show nothing. */
export interface AnalyticsUnavailable {
  state: "unavailable";
  reason: "ANALYTICS_ARTIFACT_NOT_BUILT";
  detail: string;
}

export type AnalyticsResult = ({ state: "available" } & AnalyticsArtifact) | AnalyticsUnavailable;
