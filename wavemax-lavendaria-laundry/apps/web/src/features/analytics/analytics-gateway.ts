import type { components } from "@wavemax/contracts";

import type { SalesFacts } from "./sales-facts";

export type MetricSummary = components["schemas"]["MetricSummary"];
export type Metric = components["schemas"]["Metric"];
export type MetricDefinition = components["schemas"]["MetricDefinition"];
export type AnalyticsUnavailable = components["schemas"]["AnalyticsUnavailableResponse"];

export type MetricListResult =
  { state: "available"; run_id: string; metrics: MetricSummary[] } | AnalyticsUnavailable;

export type MetricDetailResult =
  { state: "available"; run_id: string; metric: Metric } | AnalyticsUnavailable;

export interface SalesGroup {
  name: string;
  subtotal: string;
  line_count: number;
  order_count: number;
}

export interface HistoricalOrder {
  order_number: string;
  paid_date: string | null;
  subtotal: string;
  line_count: number;
  categories: string[];
  laundry_service: boolean;
}

export interface SalesBucket {
  period?: string;
  name?: string;
  weekday?: string;
  weekday_index?: number;
  hour?: number;
  subtotal: string;
  tax: string;
  line_count: number;
  order_count: number;
  pounds: string;
  average_ticket: string | null;
  units_sold?: string;
}

export interface WdfSalesAnalytics {
  analytics_version: string;
  available: boolean;
  totals: {
    net_sales: string;
    tax: string;
    pounds: string;
    order_count: number;
    line_count: number;
    open_days: number;
    average_ticket: string | null;
    average_day: string | null;
    first_day: string;
    last_day: string;
  };
  by_month: SalesBucket[];
  by_week: SalesBucket[];
  by_day: SalesBucket[];
  trailing: { period: string; subtotal: string; trailing_average: string }[];
  momentum: { period: string; subtotal: string; change: string | null }[];
  by_weekday: SalesBucket[];
  by_hour: SalesBucket[];
  heatmap: { weekday: number; hour: number; order_count: number }[];
  by_department: SalesBucket[];
  by_category: SalesBucket[];
  by_service_type: SalesBucket[];
  by_order_type: SalesBucket[];
  top_items_by_value: SalesBucket[];
  top_items_by_volume: SalesBucket[];
  per_pound_services: SalesBucket[];
  best_days: SalesBucket[];
  slowest_days: SalesBucket[];
}

export interface FinancialSummary {
  totals: Record<string, string>;
  payments: Record<string, string>;
  deposit: Record<string, string>;
  reconciles: boolean;
  reconciliation_note: string;
  payment_total: string;
  payment_gap: string;
  payments_reconcile: boolean;
}

export interface QualityResult {
  check_id: string;
  check: string;
  status: "PASS" | "FAIL" | "NOT_EVALUATED";
  action_on_fail: "block" | "warn" | "log";
  detail: string;
  display_state: "PASS" | "N/A" | "BLOCK" | "REVIEW" | "NOTE";
  data_use: "Block" | "Included" | "Excluded" | "Separate" | "Limited" | "Partial";
  rule_reason: string;
  next_step: string;
}

export interface DataHealth {
  checks: number;
  pass: number;
  fail: number;
  not_evaluated: number;
  blocking: number;
  results: QualityResult[];
}

export interface CoverageNote {
  displayed: number;
  reported: number | null;
  complete: boolean;
  note: string;
}

export interface NamedAmount {
  name: string;
  amount: string;
  count?: number;
}

export interface ListedOrder {
  order_number: string;
  customer: string;
  created: string;
  order_status: string;
  payment_status: string;
  payment_method: string;
  subtotal: string;
  tax: string;
  cc_tip: string;
  total: string;
}

export interface CustomerRecord {
  customer: string;
  rank: number | null;
  reported_orders: number | null;
  reported_sales: string | null;
  average_ticket: string | null;
  orders: ListedOrder[];
  voids: { order_number: string; amount: string; when: string | null; reason: string }[];
  machine_starts: { order_number: string; machine_starts: string; order_total: string }[];
  sources: string[];
}

export interface WdfOperations {
  operations_version: string;
  coverage: Record<string, CoverageNote>;
  customers: {
    top: {
      rank: number;
      customer: string;
      order_count: number;
      sales: string;
      average_ticket: string | null;
      voided: string | null;
    }[];
    top_total: string;
    laundry_order_count: number;
    average_laundry_ticket: string | null;
    median_laundry_ticket: string | null;
    average_pounds: string | null;
    ticket_bands: { band: string; order_count: number }[];
    pound_bands: { band: string; order_count: number }[];
    largest_tickets: {
      order_number: string;
      paid: string | null;
      net: string;
      pounds: string;
    }[];
    machine_cost: {
      order_number: string;
      customer: string;
      machine_starts: string;
      order_total: string;
      ratio_percent: string;
    }[];
    machine_cost_pooled_percent: string | null;
    order_list_segments: { segment: string; orders: number; average_subtotal: string | null }[];
    /** The Order List's own rows: 30 of 4,319, carrying fields the workbook does not. */
    order_list: ListedOrder[];
    /** Every customer any supplied export names, with what that export says about them. */
    directory: CustomerRecord[];
  };
  staff: {
    production: {
      employee: string;
      order_count: number;
      processed: string;
      pounds: string;
      pieces: string;
    }[];
    tips: {
      employee: string;
      production_tips: string;
      cashier_tips: string;
      total_tips: string;
    }[];
    production_total: string;
    tips_total: string;
  };
  voids: {
    entries: {
      order_number: string;
      amount: string;
      when: string | null;
      customer: string;
      voided_by: string;
      reason: string;
    }[];
    displayed_total: string;
    by_reason: NamedAmount[];
    by_customer: NamedAmount[];
    by_employee: NamedAmount[];
    by_month: { period: string; amount: string }[];
  };
  drawer: {
    events: { employee: string; when: string; reason: string }[];
    reasons: { name: string; count: number }[];
  };
  shifts: {
    opened: string;
    closed_by: string;
    net_sales: string;
    paid_out: string;
    cash_difference: string;
  }[];
}

export interface ProductDetail {
  turnaround: {
    name: string;
    order_count: number;
    pounds: string;
    net: string;
    rate_per_pound: string | null;
  }[];
  bedding: { name: string; quantity: string; net: string; each: string | null }[];
  fees: { name: string; count: number; net: string }[];
  non_taxable: { name: string; lines: number; net: string }[];
  price_consistency: {
    name: string;
    lowest: string;
    highest: string;
    distinct_prices: number;
    lines: number;
  }[];
}

export interface EveryItem {
  name: string;
  department: string;
  units: string;
  quantity: string;
  net: string;
  share: string;
  lines: number;
  orders: number;
  average_price: string | null;
  tax: string;
}

export interface WdfSales {
  definition: MetricDefinition;
  analytics: WdfSalesAnalytics;
  /** Line-level facts, so a reader can cross-filter without the browser inventing a figure. */
  facts: SalesFacts;
  operations: WdfOperations;
  product_detail: ProductDetail;
  basket: { item_a: string; item_b: string; tickets: number }[];
  every_item: EveryItem[];
  financial_summary: FinancialSummary;
  orders: HistoricalOrder[];
  total: string;
  line_count: number;
  order_count: number;
  negative_lines: number;
  zero_lines: number;
  source_quality: {
    duplicate_lines: number;
    duplicate_value: string;
    duplicate_rows?: {
      original_row: number;
      repeated_row: number;
      order_number: string;
      paid_date: string;
      item_name: string;
      category: string;
      subtotal: string;
    }[];
    category_flag_conflicts: number;
    category_flag_conflict_value: string;
    blank_units: number;
    blank_categories: number;
  };
  by_category: SalesGroup[];
  by_department: SalesGroup[];
  coverage: {
    state: string;
    reason: string;
    explanation: string;
    absent_commercial_value: string;
    absent_commercial_orders: number;
    absent_commercial_records?: {
      order_number: string;
      employee: string;
      amount: string;
      pounds: string;
      pieces: string;
      tip: string;
      credit_percent: string;
    }[];
    voided_value_gross: string;
  };
}

export interface Workforce {
  definition: MetricDefinition;
  plausible_hours: string;
  plausible_entries: number;
  excluded_entries: number;
  excluded_hours: string;
  reported_total_hours: string;
  employee_count: number;
  by_employee: { employee_key: string; hours: string; entries: number; excluded_entries: number }[];
  quality: {
    input_rows: number;
    accepted_rows: number;
    quarantined_rows: number;
    warning_counts: Record<string, number>;
  };
}

export interface Machines {
  machine_count: number;
  by_class: Record<string, { cycles: string; machine_count: number; revenue: string }>;
  machines: { machine: string; machine_class: string; cycles: string; revenue: string }[];
}

export interface CardAccounts {
  available: boolean;
  account_count: number;
  total_balance: string;
  average_balance: string | null;
  zero_balance: number;
  balance_bands: { band: string; accounts: number }[];
  by_type: { name: string; accounts: number }[];
  by_device: { name: string; accounts: number }[];
  by_status: { name: string; accounts: number }[];
  contactable: number;
  with_email: number;
  with_phone: number;
  named: number;
  opt_ins: { name: string; accounts: number }[];
  first_used: string | null;
  last_used: string | null;
}

export interface VacLog {
  available: boolean;
  row_count: number;
  transaction_count: number;
  paired_transactions: number;
  value_loaded: string;
  every_row_total: string;
  double_counted_if_summed_naively: string;
  overstatement_percent: string | null;
  by_operation: { name: string; count: number }[];
  by_device: { name: string; count: number }[];
  by_result: { name: string; count: number }[];
  first_seen: string | null;
  last_seen: string | null;
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
  by_day: SourceComparisonPoint[];
  by_month: SourceComparisonPoint[];
  by_year: SourceComparisonPoint[];
  supported: {
    day: boolean;
    month: boolean;
    year: boolean;
    time_of_day: boolean;
    customer: boolean;
  };
  limitations: string[];
}

export interface AnalyticsSource {
  source_system: string;
  file: string;
  sha256: string;
  size_bytes: number;
  parser_version: string;
  rule_version: string;
  /** Plain words for what this file actually feeds, so provenance is readable. */
  feeds?: string;
  disposition?: "REFERENCE_COPY" | "NO_RECORDS";
  row_count?: number;
  non_empty_cells?: number;
  sheet_count?: number;
}

export type OverviewResult =
  | {
      state: "available";
      run_id: string;
      wdf_sales: WdfSales;
      workforce: Workforce;
      sources: AnalyticsSource[];
      /** LaundroPortal machine activity, kept separate from the WDF counter-sales figures. */
      machines: Machines;
      metrics: Metric[];
      accounts: CardAccounts;
      vac: VacLog;
      source_comparison: SourceComparison;
      health?: DataHealth | undefined;
    }
  | AnalyticsUnavailable;

export interface AnalyticsGateway {
  listMetrics(signal?: AbortSignal): Promise<MetricListResult>;
  getMetric(metricId: string, signal?: AbortSignal): Promise<MetricDetailResult>;
  getOverview(signal?: AbortSignal): Promise<OverviewResult>;
}

export class AnalyticsGatewayError extends Error {
  public constructor(
    public readonly status: number,
    message: string,
    public readonly correlationId: string | null,
  ) {
    super(message);
    this.name = "AnalyticsGatewayError";
  }
}

const notBuilt: AnalyticsUnavailable = {
  state: "unavailable",
  reason: "ANALYTICS_ARTIFACT_NOT_BUILT",
  detail:
    "No analytics artifact has been built yet. Run the analytics build command to generate it from the supplied source files.",
};

/** Default used until a real gateway is supplied, so the interface never invents values. */
export const unavailableAnalyticsGateway: AnalyticsGateway = {
  async listMetrics() {
    return notBuilt;
  },
  async getMetric() {
    return notBuilt;
  },
  async getOverview() {
    return notBuilt;
  },
};

/**
 * Development-only gateway that reads a published artifact file directly.
 *
 * It exists so the local preview can show real figures without Clerk and Neon credentials. It
 * performs field projection only and computes nothing: every value it returns was produced by
 * the analytics service. It must never be used in a production build, where the API and its
 * role checks are the only permitted path.
 */
export function createStaticAnalyticsGateway(url: string): AnalyticsGateway {
  async function load(
    signal?: AbortSignal,
  ): Promise<{ state: "available"; artifact: StaticArtifact } | AnalyticsUnavailable> {
    try {
      const response = await fetch(url, signal === undefined ? {} : { signal });
      if (!response.ok) return notBuilt;
      const text = await response.text();
      if (!text || text.trim().startsWith("<")) return notBuilt;
      return { state: "available", artifact: JSON.parse(text) as StaticArtifact };
    } catch {
      return notBuilt;
    }
  }

  return {
    async listMetrics(signal) {
      const loaded = await load(signal);
      if (loaded.state === "unavailable") return loaded;
      const { artifact } = loaded;
      return {
        state: "available",
        run_id: artifact.run_id,
        metrics: Object.values(artifact.metrics).map((metric) => ({
          metric_id: metric.definition.metric_id,
          label: metric.definition.label,
          unit: metric.unit,
          total: metric.total,
          first_day: metric.first_day,
          last_day: metric.last_day,
          distinct_days: metric.distinct_days,
          coverage_state: metric.definition.coverage_state,
          coverage_note: metric.definition.coverage_note,
          known_limitations: metric.definition.known_limitations,
          quarantined_rows: metric.quality.quarantined_rows,
        })),
      };
    },
    async getMetric(metricId, signal) {
      const loaded = await load(signal);
      if (loaded.state === "unavailable") return loaded;
      const metric = loaded.artifact.metrics[metricId];
      if (!metric) return notBuilt;
      return { state: "available", run_id: loaded.artifact.run_id, metric };
    },
    async getOverview(signal) {
      const loaded = await load(signal);
      if (loaded.state === "unavailable") return loaded;
      return {
        state: "available",
        run_id: loaded.artifact.run_id,
        wdf_sales: loaded.artifact.wdf_sales,
        workforce: loaded.artifact.workforce,
        sources: loaded.artifact.sources,
        machines: loaded.artifact.machines,
        accounts: loaded.artifact.accounts,
        vac: loaded.artifact.vac,
        metrics: Object.values(loaded.artifact.metrics),
        source_comparison: loaded.artifact.source_comparison,
        health: loaded.artifact.health,
      };
    },
  };
}

interface StaticArtifact {
  run_id: string;
  metrics: Record<string, Metric>;
  wdf_sales: WdfSales;
  workforce: Workforce;
  sources: AnalyticsSource[];
  machines: Machines;
  accounts: CardAccounts;
  vac: VacLog;
  source_comparison: SourceComparison;
  health?: DataHealth | undefined;
}

export function createHttpAnalyticsGateway(
  apiUrl: string,
  getToken: () => Promise<string | null>,
): AnalyticsGateway {
  async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
    const token = await getToken();
    const response = await fetch(`${apiUrl}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      ...(signal === undefined ? {} : { signal }),
    });
    const payload = (await response.json()) as unknown;
    if (!response.ok) {
      const problem = payload as Partial<components["schemas"]["Problem"]>;
      throw new AnalyticsGatewayError(
        response.status,
        problem.title ?? "The analytics request could not be completed",
        problem.correlationId ?? null,
      );
    }
    return payload as T;
  }

  return {
    async listMetrics(signal) {
      return request<MetricListResult>("/analytics/metrics", signal);
    },
    async getMetric(metricId, signal) {
      return request<MetricDetailResult>(
        `/analytics/metrics/${encodeURIComponent(metricId)}`,
        signal,
      );
    },
    async getOverview(signal) {
      const result = await request<
        | (Omit<Extract<OverviewResult, { state: "available" }>, "metrics"> & {
            metrics: Record<string, Metric>;
          })
        | AnalyticsUnavailable
      >("/analytics", signal);
      if (result.state === "unavailable") return result;
      return { ...result, metrics: Object.values(result.metrics) };
    },
  };
}
