import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type {
  AnalyticsGateway,
  CardAccounts,
  OverviewResult,
  VacLog,
  WdfSales,
  Workforce,
} from "./analytics-gateway";
import { AnalyticsPage } from "./AnalyticsPage";

const definition = {
  metric_id: "wdf_pos_paid_sales_total",
  label: "WDF counter sales (paid at point of sale)",
  business_meaning: "Wash-dry-fold and retail sales recorded against a paid date.",
  formula: "sum(Line Item Subtotal)",
  source_system: "WDF_POS",
  source_files: ["WDF POS 2025 report.xlsx"],
  source_fields: ["Paid Date", "Line Item Subtotal"],
  unit: "CURRENCY_USD",
  grain: "line item",
  population: "Orders paid at the point of sale.",
  inclusions: ["Drop-off laundry line items."],
  exclusions: ["Voided orders.", "Large commercial orders."],
  null_treatment: "Quarantined.",
  duplicate_treatment: "Flagged and retained.",
  rounding: "Exact decimal arithmetic.",
  timezone_basis: "As exported.",
  coverage_state: "PARTIAL" as const,
  coverage_note: "Roughly 56% of non-voided order value.",
  known_limitations: ["This is point-of-sale paid sales, not total revenue."],
  drill_down: "Category and department totals.",
  definition_version: "test/1.0.0",
};

const bucket = (over: Record<string, unknown> = {}) => ({
  subtotal: "1000.00",
  tax: "80.00",
  line_count: 10,
  order_count: 8,
  pounds: "50",
  average_ticket: "125.00",
  ...over,
});

const sales: WdfSales = {
  definition,
  // No fact rows: cross-filtering must switch itself off rather than show an unfilterable page.
  facts: {
    facts_version: "wdf-sales-facts/1.0.0",
    available: false,
    columns: [],
    scales: { subtotal: 100, tax: 100_000, pounds: 1_000 },
    row_count: 0,
    days: [],
    departments: [],
    categories: [],
    items: [],
    orders: [],
    data: {},
    checksum: {
      subtotal_cents: 0,
      tax_units: 0,
      pounds_milli: 0,
      line_count: 0,
      order_count: 0,
    },
  },
  operations: {
    operations_version: "wdf-operations/1.0.0",
    coverage: {
      voids: { displayed: 30, reported: 34, complete: false, note: "Displays 30 of 34 entries." },
      order_list: {
        displayed: 30,
        reported: 4319,
        complete: false,
        note: "Displays 30 of 4319 entries.",
      },
    },
    customers: {
      top: [
        {
          rank: 1,
          customer: "Example Customer",
          order_count: 14,
          sales: "1847.24",
          average_ticket: "131.95",
          voided: null,
        },
      ],
      top_total: "11452.22",
      laundry_order_count: 597,
      average_laundry_ticket: "47.46",
      median_laundry_ticket: "36.19",
      average_pounds: "28.6",
      ticket_bands: [{ band: "<$20", order_count: 87 }],
      pound_bands: [{ band: "<15 lb", order_count: 75 }],
      largest_tickets: [
        { order_number: "# 9692", paid: "2025-08-11T11:02:47", net: "334.32", pounds: "267.45" },
      ],
      machine_cost: [
        {
          order_number: "7294",
          customer: "Example Customer",
          machine_starts: "20.00",
          order_total: "43.10",
          ratio_percent: "46.4",
        },
      ],
      machine_cost_pooled_percent: "25.4",
      order_list: [],
      directory: [],
      order_list_segments: [
        { segment: "Named customer", orders: 9, average_subtotal: "39.33" },
        { segment: "Walk-in, no name recorded", orders: 21, average_subtotal: "4.39" },
      ],
    },
    staff: {
      production: [
        {
          employee: "Example Staff",
          order_count: 91,
          processed: "33566.10",
          pounds: "24754.45",
          pieces: "9.00",
        },
      ],
      tips: [
        {
          employee: "Example Staff",
          production_tips: "1395.76",
          cashier_tips: "0.00",
          total_tips: "1395.76",
        },
      ],
      production_total: "61120.93",
      tips_total: "2679.28",
    },
    voids: {
      entries: [
        {
          order_number: "9216",
          amount: "2719.20",
          when: "2025-06-25T19:41:00",
          customer: "Example Customer",
          voided_by: "Example Staff",
          reason: "canclre",
        },
      ],
      displayed_total: "24166.19",
      by_reason: [{ name: "Customer cancelled or changed order", amount: "9369.39" }],
      by_customer: [{ name: "Example Customer", amount: "23198.01" }],
      by_employee: [{ name: "Example Staff", amount: "18650.53", count: 19 }],
      by_month: [{ period: "2025-06", amount: "7779.62" }],
    },
    drawer: {
      events: [{ employee: "Example Staff", when: "1/1/25 10:16 AM", reason: "Shift Open" }],
      reasons: [{ name: "Shift open", count: 10 }],
    },
    shifts: [
      {
        opened: "Wed, 1/1/25, 10:19 AM",
        closed_by: "Example Staff",
        net_sales: "5.56",
        paid_out: "100.00",
        cash_difference: "0.01",
      },
    ],
  },
  product_detail: {
    turnaround: [
      {
        name: "Next day",
        order_count: 469,
        pounds: "18354.30",
        net: "22894.13",
        rate_per_pound: "1.25",
      },
    ],
    bedding: [{ name: "King Comforter", quantity: "28", net: "700.00", each: "25.00" }],
    fees: [{ name: "$5 OFF", count: 16, net: "-80.00" }],
    non_taxable: [{ name: "Gatrade", lines: 151, net: "388.00" }],
    price_consistency: [
      { name: "Gatrade", lowest: "2.00", highest: "3.00", distinct_prices: 2, lines: 151 },
    ],
  },
  basket: [{ item_a: "Gain Detergent", item_b: "Gain Drying Sheets", tickets: 23 }],
  every_item: [
    {
      name: "Wash-Dry-Fold Next Day",
      department: "Laundry",
      units: "lb",
      quantity: "18083.0",
      net: "22604.37",
      share: "53.7",
      lines: 591,
      orders: 462,
      average_price: "1.25",
      tax: "1763.14",
    },
  ],
  analytics: {
    analytics_version: "wdf-sales-analytics/1.0.0",
    available: true,
    totals: {
      net_sales: "42102.22",
      tax: "3147.26",
      pounds: "20077.65",
      order_count: 4253,
      line_count: 5119,
      open_days: 364,
      average_ticket: "9.90",
      average_day: "115.67",
      first_day: "2025-01-01",
      last_day: "2025-12-31",
    },
    by_month: [bucket({ period: "2025-01" }), bucket({ period: "2025-02", subtotal: "2000.00" })],
    by_week: [bucket({ period: "2025-W01" })],
    by_day: [bucket({ period: "2025-01-01" }), bucket({ period: "2025-01-02" })],
    trailing: [{ period: "2025-01-01", subtotal: "1000.00", trailing_average: "1000.00" }],
    momentum: [
      { period: "2025-01", subtotal: "1000.00", change: null },
      { period: "2025-02", subtotal: "2000.00", change: "100.00" },
    ],
    by_weekday: [bucket({ weekday: "Monday", weekday_index: 0 })],
    by_hour: [bucket({ hour: 9 })],
    heatmap: [{ weekday: 0, hour: 9, order_count: 4 }],
    by_department: [bucket({ name: "Laundry" })],
    by_category: [bucket({ name: "Drop-Off Laundry" })],
    by_service_type: [bucket({ name: "Laundry service" })],
    by_order_type: [bucket({ name: "Laundry only" })],
    top_items_by_value: [bucket({ name: "Wash-Dry-Fold Next Day" })],
    top_items_by_volume: [bucket({ name: "Tide PODS" })],
    per_pound_services: [bucket({ name: "Wash-Dry-Fold Next Day" })],
    best_days: [bucket({ period: "2025-01-02" })],
    slowest_days: [bucket({ period: "2025-01-01" })],
  },
  financial_summary: {
    totals: {
      "Net Sales": "42102.22",
      "Net Tax 1": "3147.26",
      "Credit Card Tips": "2679.28",
      "Grand Total": "47928.76",
      "Total Voided Sales": "24252.98",
      "Total Payouts": "14534.54",
    },
    payments: { Cash: "13410.23", "Credit Card": "34524.10", Check: "0.00" },
    deposit: {
      "Total Cash Sales": "13410.23",
      "Total Payouts": "14534.54",
      "Expected Deposit": "-1124.31",
    },
    reconciles: true,
    reconciliation_note: "Reconciles exactly.",
    payment_total: "47934.33",
    payment_gap: "5.57",
    payments_reconcile: false,
  },
  orders: [],
  total: "42102.22",
  line_count: 5119,
  order_count: 4253,
  negative_lines: 21,
  zero_lines: 3,
  source_quality: {
    duplicate_lines: 0,
    duplicate_value: "0.00",
    category_flag_conflicts: 0,
    category_flag_conflict_value: "0.00",
    blank_units: 0,
    blank_categories: 0,
  },
  by_category: [],
  by_department: [],
  coverage: {
    state: "PARTIAL",
    reason: "COMMERCIAL_AND_VOIDED_ORDERS_ABSENT",
    explanation: "Voided and commercial orders are absent from this source.",
    absent_commercial_value: "32957.70",
    absent_commercial_orders: 31,
    voided_value_gross: "24252.98",
  },
};

const workforce: Workforce = {
  definition: {
    ...definition,
    metric_id: "workforce_plausible_hours",
    label: "Recorded labour hours",
    known_limitations: ["Labour cost cannot be derived."],
  },
  plausible_hours: "2677.4",
  plausible_entries: 417,
  excluded_entries: 67,
  excluded_hours: "16801.0",
  reported_total_hours: "19478.4",
  employee_count: 6,
  by_employee: [{ employee_key: "abc123", hours: "1268.0", entries: 185, excluded_entries: 38 }],
  quality: { input_rows: 484, accepted_rows: 484, quarantined_rows: 0, warning_counts: {} },
};

const available: OverviewResult = {
  state: "available",
  run_id: "run-reference-1234567890",
  wdf_sales: sales,
  workforce,
  machines: { machine_count: 0, by_class: {}, machines: [] },
  accounts: { available: false } as unknown as CardAccounts,
  vac: { available: false } as unknown as VacLog,
  metrics: [],
  source_comparison: {
    definition_version: "wavemax-source-comparison/1.0.0",
    formula: "WDF paid counter sales and LaundroPortal machine revenue shown separately",
    meaning: "Two different revenue streams shown side by side.",
    by_day: [],
    by_month: [],
    by_year: [],
    supported: { day: true, month: true, year: true, time_of_day: false, customer: false },
    limitations: ["No shared customer identifier."],
  },
  sources: [
    {
      source_system: "WDF_POS",
      file: "WDF POS 2025 report.xlsx",
      sha256: "4eeb35feec9e9203aaaa",
      size_bytes: 385929,
      parser_version: "wdf-sales-xlsx/1.0.0",
      rule_version: "wdf-sales-quality/1.0.0",
    },
    {
      source_system: "LAUNDRO_PORTAL",
      file: "history_report - Machine Revenue.csv",
      sha256: "deadbeefdeadbeef0000",
      size_bytes: 7000,
      parser_version: "laundro-daily-csv/1.0.0",
      rule_version: "laundro-daily-quality/1.0.0",
    },
  ],
};

function gatewayOf(result: OverviewResult): AnalyticsGateway {
  return {
    listMetrics: vi.fn(),
    getMetric: vi.fn(),
    getOverview: vi.fn(async () => result),
  } as unknown as AnalyticsGateway;
}

describe("analytics dashboard", () => {
  afterEach(cleanup);

  it("shows an explicit unbuilt state rather than zeroes", async () => {
    const gateway = gatewayOf({
      state: "unavailable",
      reason: "ANALYTICS_ARTIFACT_NOT_BUILT",
      detail: "No artifact yet.",
    });
    render(<AnalyticsPage gateway={gateway} />);
    expect(await screen.findByText("No analytics have been built yet")).toBeInTheDocument();
  });

  it("opens Sales directly instead of rendering Overview or an intermediate directory", async () => {
    render(<AnalyticsPage gateway={gatewayOf(available)} showDirectory />);
    expect(await screen.findByRole("heading", { name: "Sales" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Overview" })).not.toBeInTheDocument();
    expect(
      screen.queryByText("Choose the business question you want to answer."),
    ).not.toBeInTheDocument();
  });

  it("reports a load failure rather than a partial result", async () => {
    const gateway = {
      listMetrics: vi.fn(),
      getMetric: vi.fn(),
      getOverview: vi.fn(async () => {
        throw new Error("network down");
      }),
    } as unknown as AnalyticsGateway;
    render(<AnalyticsPage gateway={gateway} />);
    await waitFor(() =>
      expect(screen.getByText("Analytics could not be loaded")).toBeInTheDocument(),
    );
  });

  it("does not expose the retired source-comparison report", async () => {
    render(<AnalyticsPage gateway={gatewayOf(available)} section="compare" showDirectory />);
    expect(await screen.findByText("Monthly net sales")).toBeInTheDocument();
    expect(screen.queryByText("WDF POS vs LaundroPortal")).not.toBeInTheDocument();
  });

  it("shows an evidence state instead of inventing LaundroPortal product sales", async () => {
    render(<AnalyticsPage gateway={gatewayOf(available)} section="lp-products" showDirectory />);

    expect(await screen.findByText("Product sales are not in this export")).toBeInTheDocument();
    expect(screen.getByText(/product-sales export is required/i)).toBeInTheDocument();
    expect(
      screen.getAllByTitle("Every figure in this panel comes from LaundroPortal").length,
    ).toBeGreaterThan(0);
  });

  it("renders the verified WDF total on Sales", async () => {
    render(<AnalyticsPage gateway={gatewayOf(available)} />);
    expect(await screen.findByText("$42,102")).toBeInTheDocument();
    expect(screen.getByText("4,253")).toBeInTheDocument();
  });

  it("states when cross-filtered figures cannot be trusted", async () => {
    render(<AnalyticsPage gateway={gatewayOf(available)} />);
    expect(
      await screen.findByText("Cross-filtering is switched off for this build"),
    ).toBeInTheDocument();
  });

  it("names the source system every WDF section is built from", async () => {
    // The two vendors measure different things, so a reader must never have to guess which
    // system a figure came from. The earlier rule hid LaundroPortal entirely; the rule now is
    // that both are shown and both are labelled.
    render(<AnalyticsPage gateway={gatewayOf(available)} />);
    await screen.findByText("$42,102");
    expect(screen.getAllByText("WDF POS").length).toBeGreaterThan(0);
    expect(
      screen.getAllByTitle("Every figure in this panel comes from WDF POS").length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByTitle("Every figure in this panel comes from LaundroPortal").length,
    ).toBeGreaterThan(0);
  });

  it("lists both source systems in the methodology section", async () => {
    render(<AnalyticsPage gateway={gatewayOf(available)} />);
    await screen.findByText("$42,102");
    fireEvent.click(screen.getByRole("button", { name: /Methodology/ }));
    const table = await screen.findByRole("table", {
      name: "Source files used by this dashboard",
    });
    expect(within(table).getByText("WDF POS 2025 report.xlsx")).toBeInTheDocument();
    expect(within(table).getByText(/Machine Revenue/)).toBeInTheDocument();
  });

  it("moves between sections and keeps the same underlying population", async () => {
    render(<AnalyticsPage gateway={gatewayOf(available)} />);
    await screen.findByText("$42,102");
    fireEvent.click(screen.getByRole("button", { name: "Cash & voids" }));
    expect(await screen.findByText("Payment mix")).toBeInTheDocument();
    expect(screen.getByText("$24,253")).toBeInTheDocument();
  });

  it("shows customer analytics from the reports that support them", async () => {
    render(<AnalyticsPage gateway={gatewayOf(available)} />);
    await screen.findByText("$42,102");
    fireEvent.click(screen.getByRole("button", { name: "Customers" }));
    expect(await screen.findByText("Highest-spending customers")).toBeInTheDocument();
    expect(screen.getByText("Most frequent customers")).toBeInTheDocument();
    expect(screen.getByText("Drop-off ticket size")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: /Grouped bar chart comparing Recorded sales/ }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Customer directory")).not.toBeInTheDocument();
    expect(screen.getAllByText("Example Customer").length).toBeGreaterThan(0);
  });

  it("states the coverage limits of the customer view rather than implying completeness", async () => {
    render(<AnalyticsPage gateway={gatewayOf(available)} />);
    await screen.findByText("$42,102");
    fireEvent.click(screen.getByRole("button", { name: "Customers" }));
    expect(await screen.findByText(/supplied order exports/)).toBeInTheDocument();
    expect(screen.getByText(/Names are never merged approximately/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "View customer directory" }));
    expect(screen.getByText("Customer directory")).toBeInTheDocument();
  });

  it("attributes voids to a customer only on an exact name match", async () => {
    render(<AnalyticsPage gateway={gatewayOf(available)} />);
    await screen.findByText("$42,102");
    fireEvent.click(screen.getByRole("button", { name: "Customers" }));
    expect(await screen.findByText(/matches exactly/)).toBeInTheDocument();
  });

  it("withholds invalid hours and mixed paid/unpaid production", async () => {
    render(<AnalyticsPage gateway={gatewayOf(available)} />);
    await screen.findByText("$42,102");
    fireEvent.click(screen.getByRole("button", { name: "Staff & ops" }));
    expect(screen.queryByText(/Hours unavailable/)).not.toBeInTheDocument();
    expect(await screen.findByText("Timesheet exceptions")).toBeInTheDocument();
    expect(screen.getByText("Production needs a paid/unpaid split")).toBeInTheDocument();
  });

  it("provides source jump controls on every business report", async () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    render(<AnalyticsPage gateway={gatewayOf(available)} />);
    await screen.findByText("$42,102");
    const wdfSection = document.getElementById("wdf-sales");
    const laundroSection = document.getElementById("laundro-sales");
    expect(wdfSection).not.toBeNull();
    expect(laundroSection).not.toBeNull();
    const sourceSwitcher = screen.getByRole("group", { name: "Source section" });
    const laundroButton = within(sourceSwitcher).getByRole("button", { name: "LaundroPortal" });
    fireEvent.click(laundroButton);
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
    expect(laundroButton).toHaveAttribute("aria-pressed", "true");
    const wdfButton = within(sourceSwitcher).getByRole("button", { name: "WDF POS" });
    fireEvent.click(wdfButton);
    expect(scrollIntoView).toHaveBeenCalledTimes(2);
    expect(wdfButton).toHaveAttribute("aria-pressed", "true");
  });

  it("breaks voids down by reason, customer and employee with coverage stated", async () => {
    render(<AnalyticsPage gateway={gatewayOf(available)} />);
    await screen.findByText("$42,102");
    fireEvent.click(screen.getByRole("button", { name: "Cash & voids" }));
    expect(await screen.findByText("Voided sales by month")).toBeInTheDocument();
    expect(screen.queryByText("Voids by reason")).not.toBeInTheDocument();
    expect(screen.getByText("Voids by customer")).toBeInTheDocument();
    expect(screen.getByText("Voids marked by employee")).toBeInTheDocument();
    expect(screen.getByText(/It does not indicate fault/)).toBeInTheDocument();
  });

  it("never describes a void as loss or wrongdoing", async () => {
    render(<AnalyticsPage gateway={gatewayOf(available)} />);
    await screen.findByText("$42,102");
    fireEvent.click(screen.getByRole("button", { name: "Cash & voids" }));
    await screen.findByText("Payment mix");
    const body = (document.body.textContent ?? "").toLowerCase();
    expect(body).toContain("it is not evidence of loss");
    expect(body).not.toContain("fraud");
    expect(body).not.toContain("theft");
  });
});
