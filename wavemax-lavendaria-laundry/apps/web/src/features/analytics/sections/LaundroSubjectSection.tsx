import { useState } from "react";

import {
  ChartPanel,
  ColumnChart,
  DataViewToggle,
  LineChart,
  MixBar,
  PointTable,
  SourceBadge,
} from "../../../components/charts/primitives";
import { KpiCard } from "../../../components/charts/KpiCard";
import type { CardAccounts, Machines, Metric } from "../analytics-gateway";

type Subject = "sales" | "trends" | "products" | "cash" | "staff" | "customers";

function metricOf(metrics: Metric[], id: string): Metric | undefined {
  return metrics.find((metric) => metric.definition.metric_id === id);
}

function month(period: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(
    new Date(`${period}-01T00:00:00Z`),
  );
}

function EvidenceState({ title, detail }: { title: string; detail: string }) {
  return (
    <section className="rounded-2xl border border-[#e9d5ff] bg-[#faf5ff] p-5 shadow-[0_8px_24px_rgba(124,58,237,0.06)] sm:p-6">
      <div className="flex items-center gap-2">
        <SourceBadge source="LaundroPortal" />
      </div>
      <h3 className="mt-4 text-lg font-semibold tracking-[-0.025em] text-ink">{title}</h3>
      <p className="mt-2 max-w-[72ch] text-xs leading-5 text-muted">{detail}</p>
    </section>
  );
}

function MetricTrend({
  metric,
  title,
  subtitle,
  chart = "line",
  wide = false,
}: {
  metric: Metric;
  title: string;
  subtitle: string;
  chart?: "line" | "column" | "track";
  wide?: boolean;
}) {
  const [view, setView] = useState<"visual" | "table">("visual");
  const points = metric.by_month.map((row) => ({
    label: month(row.period),
    value: Number(row.value),
  }));
  const unit = metric.unit === "CURRENCY_USD" ? "CURRENCY_USD" : "COUNT";
  return (
    <ChartPanel
      action={<DataViewToggle onChange={setView} value={view} />}
      className={`metric-trend-card ${wide ? "chart-panel-wide" : ""}`}
      source="LaundroPortal"
      subtitle={subtitle}
      title={title}
      unit={metric.unit === "CURRENCY_USD" ? "US dollars" : "count"}
    >
      {view === "table" ? (
        <PointTable label="Month" points={points} unit={unit} />
      ) : chart === "column" ? (
        <ColumnChart accent="#6B4E8A" height={128} points={points} unit={unit} />
      ) : (
        <LineChart
          accent="#6B4E8A"
          backgroundBars={chart === "track"}
          height={128}
          points={points}
          showArea={chart === "line"}
          showPoints={chart !== "track"}
          unit={unit}
        />
      )}
    </ChartPanel>
  );
}

export function LaundroSubjectSection({
  accounts,
  machines,
  metrics,
  subject,
}: {
  accounts: CardAccounts;
  machines: Machines;
  metrics: Metric[];
  subject: Subject;
}) {
  const revenue = metricOf(metrics, "machine_revenue_total");
  const loads = metricOf(metrics, "card_value_loaded_total");
  const cycles = metricOf(metrics, "washer_cycles_total");
  const cards = metricOf(metrics, "new_cards_total");
  const activity = metricOf(metrics, "accounts_used_total");
  const starts = metricOf(metrics, "management_card_starts_value");
  const activeDays = activity?.by_day.filter((row) => Number(row.value) > 0).length ?? 0;
  const averageDailyAccounts =
    activity && activeDays > 0 ? (Number(activity.total) / activeDays).toFixed(0) : null;
  const machineMix = Object.entries(machines.by_class).map(([label, row], index) => ({
    label: label.charAt(0) + label.slice(1).toLowerCase(),
    value: Number(row.revenue),
    color: index === 0 ? "#66556f" : "#9a7b60",
  }));

  if (subject === "products") {
    return (
      <EvidenceState
        title="Product sales are not in this export"
        detail="The supplied LaundroPortal files describe machines, card activity and stored-value accounts. They do not contain product, item, SKU or department sales, so this report intentionally contains no product chart. A LaundroPortal product-sales export is required."
      />
    );
  }
  if (subject === "staff") {
    return (
      <div className="grid gap-4">
        <EvidenceState
          title="Staff identity and hours are not supplied"
          detail="Management-card starts are machine events, not employee productivity or time worked. They remain visible below as a separate operating signal and are never attributed to staff."
        />
        {starts ? (
          <div>
            <MetricTrend
              metric={starts}
              title="Management-card start value"
              subtitle="Cycle value started on management cards. Its accounting treatment is still an open client decision."
              wide
            />
          </div>
        ) : null}
      </div>
    );
  }
  if (subject === "cash") {
    return (
      <div className="grid gap-4">
        <EvidenceState
          title="No cash or void export"
          detail="Card loads outside the reporting period are excluded."
        />
        {loads ? (
          <div>
            <MetricTrend
              metric={loads}
              title="Card value loaded"
              subtitle="Card deposits by month."
              wide
            />
          </div>
        ) : null}
      </div>
    );
  }
  if (subject === "customers") {
    return (
      <div className="grid gap-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            accent="#6B4E8A"
            context="Stored-value account register snapshot"
            label="Registered card accounts"
            source="LaundroPortal"
            unit="COUNT"
            value={accounts.account_count}
          />
          <KpiCard
            accent="#6B4E8A"
            context="Daily counts may repeat accounts"
            label="Average daily active accounts"
            source="LaundroPortal"
            unit="COUNT"
            value={averageDailyAccounts ?? "0"}
          />
          <KpiCard
            accent="#6B4E8A"
            context="Snapshot balance; not period revenue"
            label="Outstanding card balance"
            source="LaundroPortal"
            unit="CURRENCY_USD"
            value={accounts.total_balance}
          />
          <KpiCard
            accent="#6B4E8A"
            context="Cards issued; replacements cannot be separated"
            coverage="PARTIAL"
            label="New cards dispensed"
            source="LaundroPortal"
            unit="COUNT"
            value={cards?.total ?? "0"}
          />
        </div>
        <EvidenceState
          title="Accounts are not proven unique customers"
          detail="The supplied sources contain no safe shared customer key. Daily account activity counts visits, and returning accounts repeat across days. Cross-source customer comparison remains unavailable."
        />
        <div className="grid gap-4 lg:grid-cols-2">
          {activity ? (
            <MetricTrend
              metric={activity}
              title="Monthly account activity"
              subtitle="Daily active-account counts summed by month. Returning accounts can repeat across days."
            />
          ) : null}
          {cards ? (
            <MetricTrend
              metric={cards}
              title="New cards dispensed"
              subtitle="Cards issued by month. Replacements cannot be separated from first-time cards."
            />
          ) : null}
        </div>
      </div>
    );
  }
  if (subject === "trends") {
    const trendReports = [
      revenue ? { metric: revenue, chart: "line" as const, title: "Machine revenue" } : undefined,
      loads ? { metric: loads, chart: "column" as const, title: "Card value loaded" } : undefined,
      cycles ? { metric: cycles, chart: "track" as const, title: "Washer cycles" } : undefined,
    ].filter(
      (report): report is { metric: Metric; chart: "line" | "column" | "track"; title: string } =>
        report !== undefined,
    );
    return (
      <div className="grid items-start gap-4 lg:grid-cols-2">
        {trendReports.map((report, index) => (
          <div
            className={
              index === trendReports.length - 1 && trendReports.length % 2 === 1
                ? "lg:col-span-2"
                : undefined
            }
            key={report.metric.definition.metric_id}
          >
            <MetricTrend
              chart={report.chart}
              metric={report.metric}
              title={report.title}
              subtitle={report.metric.definition.business_meaning}
              wide={index === trendReports.length - 1 && trendReports.length % 2 === 1}
            />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          accent="#6B4E8A"
          context="Value spent at all supplied machines"
          label="Machine revenue"
          source="LaundroPortal"
          unit="CURRENCY_USD"
          value={revenue?.total ?? "0"}
        />
        <KpiCard
          accent="#6B4E8A"
          context="Value loaded is not machine revenue"
          label="Card value loaded"
          source="LaundroPortal"
          unit="CURRENCY_USD"
          value={loads?.total ?? "0"}
        />
        <KpiCard
          accent="#6B4E8A"
          context="Washer-only export; dryers are excluded"
          coverage="PARTIAL"
          label="Washer cycles"
          source="LaundroPortal"
          unit="COUNT"
          value={cycles?.total ?? "0"}
        />
      </div>
      {revenue ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <MetricTrend
            metric={revenue}
            title="Monthly machine revenue"
            subtitle="The exact LaundroPortal machine-revenue total for each month."
          />
          <ChartPanel
            coverage="All supplied machines are included."
            source="LaundroPortal"
            subtitle="Washer and dryer contributions to the supplied machine-revenue total."
            title="Machine revenue mix"
            unit="US dollars"
          >
            <MixBar segments={machineMix} unit="CURRENCY_USD" />
          </ChartPanel>
        </div>
      ) : null}
    </div>
  );
}
