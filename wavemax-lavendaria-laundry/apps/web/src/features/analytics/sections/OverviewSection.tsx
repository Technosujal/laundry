import { useState } from "react";

import { ChartPanel, LineChart, MixBar, type Point } from "../../../components/charts/primitives";
import { KpiCard } from "../../../components/charts/KpiCard";
import type { SalesBucket, WdfSales } from "../analytics-gateway";
import type { SalesFilterState } from "../sales-filter";

type ExecutiveMetric = "revenue" | "orders" | "ticket" | "pounds";

function MetricIcon({ metric }: { metric: ExecutiveMetric }) {
  const paths: Record<ExecutiveMetric, string[]> = {
    revenue: ["M4 19V9M10 19V5M16 19v-7M2 19h20"],
    orders: ["M6 3h12v18H6z", "M9 8h6M9 12h6M9 16h4"],
    ticket: ["M4 7h16v10H4z", "M8 11h3M15 11h1"],
    pounds: ["M8 8a4 4 0 1 1 8 0", "M6 8h12l2 12H4z"],
  };
  return (
    <svg
      aria-hidden="true"
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
      viewBox="0 0 24 24"
    >
      {paths[metric].map((path) => (
        <path d={path} key={path} />
      ))}
    </svg>
  );
}

function monthlyChange(
  months: SalesBucket[],
  valueOf: (month: SalesBucket) => number,
): { value: string; label: string; direction: "up" | "down" | "flat" } {
  const ordered = [...months]
    .filter((row) => row.period)
    .sort((a, b) => a.period!.localeCompare(b.period!));
  const current = ordered.at(-1);
  const previous = ordered.at(-2);
  const currentValue = current ? valueOf(current) : 0;
  const previousValue = previous ? valueOf(previous) : 0;
  const formatter = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" });
  const periodName = (period: string) => formatter.format(new Date(`${period}-01T00:00:00Z`));
  if (!current?.period || !previous?.period || previousValue === 0) {
    return { value: "—", label: "No comparable prior month", direction: "flat" };
  }
  const change = ((currentValue - previousValue) / Math.abs(previousValue)) * 100;
  return {
    value: `${change > 0 ? "+" : ""}${change.toFixed(1)}%`,
    label: `${periodName(current.period)} versus ${periodName(previous.period)}`,
    direction: change > 0 ? "up" : change < 0 ? "down" : "flat",
  };
}

function monthLabel(period: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(
    new Date(`${period}-01T00:00:00Z`),
  );
}

export function OverviewSection({
  filter,
  sales,
  onExplain,
}: {
  filter: SalesFilterState;
  sales: WdfSales;
  onExplain: () => void;
}) {
  const analytics = sales.analytics;
  const totals = analytics.totals;
  const fullYear = filter.analyticsExcept("month");
  const months = fullYear.by_month;
  const busiestWeekday = [...analytics.by_weekday].sort((a, b) => b.order_count - a.order_count)[0];
  const busiestHour = [...analytics.by_hour].sort((a, b) => b.order_count - a.order_count)[0];
  const topItem = analytics.top_items_by_value[0];
  const [trendGrain, setTrendGrain] = useState<"quarter" | "month" | "day">("quarter");
  const [selectedQuarter, setSelectedQuarter] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const hourLabel = (hour: number) =>
    hour === 0 ? "12 am" : hour < 12 ? `${hour} am` : hour === 12 ? "12 pm" : `${hour - 12} pm`;

  const quarterPoints: Point[] = [0, 1, 2, 3].map((quarter) => {
    const rows = months.slice(quarter * 3, quarter * 3 + 3);
    return {
      label: `Q${quarter + 1}`,
      filterValue: `Q${quarter + 1}`,
      value: rows.reduce((sum, row) => sum + Number(row.subtotal), 0),
      caption: `${rows.reduce((sum, row) => sum + row.order_count, 0).toLocaleString("en-US")} orders`,
    };
  });
  const monthPoints: Point[] = months
    .filter((_, index) => {
      if (!selectedQuarter) return true;
      return Math.floor(index / 3) + 1 === Number(selectedQuarter.slice(1));
    })
    .map((row) => ({
      label: monthLabel(row.period!),
      filterValue: row.period!,
      value: Number(row.subtotal),
      caption: `${row.order_count.toLocaleString("en-US")} orders`,
    }));
  const monthForDays = selectedMonth ?? months.at(-1)?.period ?? "";
  const dayPoints: Point[] = fullYear.by_day
    .filter((row) => row.period?.startsWith(monthForDays))
    .map((row) => ({
      label: row.period ? row.period.slice(8) : "",
      filterValue: row.period ?? "",
      value: Number(row.subtotal),
      caption: `${row.order_count.toLocaleString("en-US")} orders`,
    }));
  const trendPoints =
    trendGrain === "quarter" ? quarterPoints : trendGrain === "month" ? monthPoints : dayPoints;

  function changeTrendGrain(next: "quarter" | "month" | "day") {
    setTrendGrain(next);
    if (next === "quarter") {
      setSelectedQuarter(null);
      setSelectedMonth(null);
      if (filter.valueOn("month")) filter.remove("month");
    }
    if (next === "month") setSelectedMonth(null);
  }

  function drillTrend(point: Point) {
    if (trendGrain === "quarter") {
      setSelectedQuarter(point.filterValue ?? point.label);
      setTrendGrain("month");
      return;
    }
    if (trendGrain === "month") {
      setSelectedMonth(point.filterValue ?? "");
      filter.toggle("month", point);
      setTrendGrain("day");
    }
  }

  const trendAction = (
    <div
      aria-label="Revenue trend detail"
      className="inline-flex rounded-lg border border-line bg-canvas p-0.5"
    >
      {(["quarter", "month", "day"] as const).map((grain) => (
        <button
          aria-pressed={trendGrain === grain}
          className={`rounded-md px-2 py-1 text-[9px] font-bold capitalize transition ${trendGrain === grain ? "bg-[#355f86] text-white" : "text-muted hover:bg-white hover:text-ink"}`}
          key={grain}
          onClick={() => changeTrendGrain(grain)}
          type="button"
        >
          {grain}
        </button>
      ))}
    </div>
  );

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          accent="#355f86"
          context={`${totals.open_days} trading days`}
          coverage="PARTIAL"
          icon={<MetricIcon metric="revenue" />}
          label="Counter sales"
          onExplain={onExplain}
          trend={monthlyChange(months, (row) => Number(row.subtotal))}
          unit="CURRENCY_USD"
          value={totals.net_sales}
        />
        <KpiCard
          accent="#4f7770"
          context={`${totals.line_count.toLocaleString("en-US")} line items`}
          icon={<MetricIcon metric="orders" />}
          label="Orders"
          trend={monthlyChange(months, (row) => row.order_count)}
          unit="COUNT"
          value={totals.order_count}
        />
        <KpiCard
          accent="#6b5b73"
          context="Counter sales divided by distinct orders"
          icon={<MetricIcon metric="ticket" />}
          label="Average ticket"
          trend={monthlyChange(months, (row) => Number(row.average_ticket ?? 0))}
          unit="CURRENCY_USD"
          value={totals.average_ticket ?? "0"}
        />
        <KpiCard
          accent="#967246"
          context="Weighed wash-dry-fold line items only"
          icon={<MetricIcon metric="pounds" />}
          label="Pounds processed"
          trend={monthlyChange(months, (row) => Number(row.pounds))}
          unit="POUNDS"
          value={totals.pounds}
        />
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-[#e6d6aa] bg-amber-soft px-3.5 py-2.5 text-[10px] leading-4 text-[#77591d]">
        <strong className="shrink-0">Coverage note</strong>
        <span>{sales.coverage.explanation}</span>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <ChartPanel
          action={trendAction}
          coverage={
            trendGrain === "quarter"
              ? "Select a quarter to open its three months."
              : trendGrain === "month"
                ? "Select a month to open its recorded trading days and filter the executive cards."
                : `Showing recorded days in ${monthLabel(monthForDays)}.`
          }
          subtitle="Quarter first, with month and day detail available on demand."
          title="Revenue trend"
          unit="US dollars"
        >
          <LineChart
            accent="#355f86"
            height={108}
            points={trendPoints}
            seriesLabel={`${trendGrain === "quarter" ? "Quarterly" : trendGrain === "month" ? "Monthly" : "Daily"} counter sales`}
            showPoints
            unit="CURRENCY_USD"
            {...(trendGrain === "day" ? {} : { onSelect: drillTrend })}
          />
        </ChartPanel>

        <ChartPanel
          subtitle="How recorded counter sales divide across the leading departments."
          title="Revenue mix"
          unit="US dollars"
        >
          <MixBar
            onSelect={(point) => filter.toggle("department", point)}
            segments={filter
              .analyticsExcept("department")
              .by_department.slice(0, 6)
              .map((row, index) => ({
                label: row.name!,
                value: Number(row.subtotal),
                color:
                  ["#355f86", "#4f7770", "#6b5b73", "#967246", "#7a6758", "#75806f"][index] ??
                  "#66717a",
              }))}
            selectedValue={filter.valueOn("department")}
            unit="CURRENCY_USD"
          />
        </ChartPanel>

        <ChartPanel
          className="lg:col-span-2"
          subtitle="The three operating signals an owner is most likely to need at a glance."
          title="Operating snapshot"
        >
          <dl className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-[#c6d5d5] bg-[#edf3f3] p-3">
              <dt className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#49747a]">
                Busiest weekday
              </dt>
              <dd className="mt-2 text-lg font-semibold text-ink">
                {busiestWeekday?.weekday ?? "Unavailable"}
              </dd>
              <span className="mt-1 block text-[10px] text-muted">
                {busiestWeekday
                  ? `${busiestWeekday.order_count.toLocaleString("en-US")} orders`
                  : "No orders recorded"}
              </span>
            </div>
            <div className="rounded-xl border border-[#d2c9d7] bg-[#f2eef4] p-3">
              <dt className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#6b5b73]">
                Peak hour
              </dt>
              <dd className="mt-2 text-lg font-semibold text-ink">
                {busiestHour?.hour === undefined ? "Unavailable" : hourLabel(busiestHour.hour)}
              </dd>
              <span className="mt-1 block text-[10px] text-muted">
                {busiestHour
                  ? `${busiestHour.order_count.toLocaleString("en-US")} orders`
                  : "No orders recorded"}
              </span>
            </div>
            <div className="rounded-xl border border-[#dacdbb] bg-[#f4f0e9] p-3">
              <dt className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#80613f]">
                Leading item
              </dt>
              <dd className="mt-2 truncate text-sm font-semibold text-ink" title={topItem?.name}>
                {topItem?.name ?? "Unavailable"}
              </dd>
              <span className="mt-1 block text-[10px] text-muted">
                {topItem
                  ? Number(topItem.subtotal).toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD",
                    })
                  : "No item sales recorded"}
              </span>
            </div>
          </dl>
        </ChartPanel>
      </div>
    </div>
  );
}
