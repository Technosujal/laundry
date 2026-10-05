import { useEffect, useMemo, useState } from "react";

import {
  ChartPanel,
  ColumnChart,
  formatBusinessDate,
  Heatmap,
  MixBar,
  RankedBars,
} from "../../components/charts/primitives";
import { KpiCard } from "../../components/charts/KpiCard";
import { EmptyPanel } from "../../components/ui/EmptyPanel";
import type { AnalyticsGateway, OverviewResult, WdfSales } from "../analytics/analytics-gateway";
import { FilterBar, useSalesFilter } from "../analytics/sales-filter";

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const HOURS = Array.from({ length: 24 }, (_, hour) =>
  hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`,
);

/**
 * Store operations, measured in orders and pounds rather than money.
 *
 * A manager may not see store-wide counter sales, so nothing on this page is a currency value.
 * Everything here answers an operational question a shift lead actually has: when is the store
 * busy, what share of the work is laundry rather than retail, and how much weight moves through
 * in a month. All of it comes from the same verified WDF lines the owner's analytics use.
 */
/** Stands in only while the artifact is loading; never rendered. */
const EMPTY_SALES = {
  analytics: { available: false, totals: {} },
  facts: { available: false, row_count: 0 },
} as unknown as WdfSales;

export function OperationsPage({ gateway }: { gateway: AnalyticsGateway }) {
  const [result, setResult] = useState<OverviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    gateway
      .getOverview(controller.signal)
      .then((loaded) => {
        setResult(loaded);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setError(cause instanceof Error ? cause.message : "Operations data could not be loaded");
      });
    return () => controller.abort();
  }, [gateway]);

  const sales = result && result.state === "available" ? result.wdf_sales : null;
  // The same cross-filter the owner's analytics use, over the same verified lines. Hooks must
  // run on every render, so a placeholder stands in until the artifact has loaded.
  const filter = useSalesFilter(sales ?? EMPTY_SALES);
  const analytics = sales ? filter.view.analytics : null;
  const selectedDepartment = filter.valueOn("department");

  const busiest = useMemo(() => {
    if (!analytics) return null;
    const peak = Math.max(...analytics.heatmap.map((row) => row.order_count), 0);
    if (peak === 0) return null;
    const ties = analytics.heatmap.filter((row) => row.order_count === peak);
    return {
      label: ties
        .map(
          (row) =>
            `${WEEKDAYS[row.weekday] ?? "Unknown day"}, ${HOURS[row.hour] ?? "Unknown time"}`,
        )
        .join(" and "),
      count: peak,
    };
  }, [analytics]);

  if (error) {
    return (
      <EmptyPanel
        description={`${error} No operational figures are shown until every required source loads.`}
        title="Operations could not be loaded"
      />
    );
  }
  if (!result) {
    return (
      <EmptyPanel description="Reading the verified source data." title="Loading operations…" />
    );
  }
  if (result.state === "unavailable" || !analytics?.available) {
    return (
      <EmptyPanel
        description="No operational activity has been published from the verified source yet."
        title="Nothing to show yet"
      />
    );
  }

  const totals = analytics.totals;
  const busiestWeekday = [...analytics.by_weekday].sort((a, b) => b.order_count - a.order_count)[0];

  return (
    <div className="mt-6 grid gap-4">
      <FilterBar state={filter} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          accent="#49747a"
          context={`${formatBusinessDate(totals.first_day)} to ${formatBusinessDate(totals.last_day)}`}
          label="Orders handled"
          unit="COUNT"
          value={totals.order_count}
        />
        <KpiCard
          accent="#685a78"
          context="Weighed wash-dry-fold lines only"
          label="Pounds processed"
          unit="POUNDS"
          value={totals.pounds}
        />
        <KpiCard
          accent="#4f7462"
          context={`Across ${totals.open_days.toLocaleString("en-US")} trading days`}
          label="Orders per trading day"
          unit="COUNT"
          value={Math.round(totals.order_count / Math.max(totals.open_days, 1))}
        />
        <KpiCard
          accent="#906b45"
          context={
            busiest
              ? `${busiest.count.toLocaleString("en-US")} orders at each listed time`
              : "No activity recorded"
          }
          label="Busiest hour"
          unit="COUNT"
          value={busiest?.label ?? "None"}
        />
      </div>

      <ChartPanel
        coverage="Each order is counted once."
        subtitle="Paid orders by weekday and hour."
        title="Orders by weekday and hour"
        unit="orders"
      >
        <Heatmap
          accent="#49747a"
          cells={analytics.heatmap.map((cell) => ({
            row: cell.weekday,
            column: cell.hour,
            value: cell.order_count,
          }))}
          columns={HOURS}
          onSelect={(cell) => {
            filter.toggle("weekday", { label: WEEKDAYS[cell.row]!, value: 0 });
            filter.toggle("hour", {
              label: HOURS[cell.column]!,
              filterValue: String(cell.column),
              value: 0,
            });
          }}
          rows={WEEKDAYS}
          selectedCell={{
            row:
              filter.valueOn("weekday") === null
                ? null
                : WEEKDAYS.indexOf(filter.valueOn("weekday")!),
            column: filter.valueOn("hour") === null ? null : Number(filter.valueOn("hour")),
          }}
          valueLabel="orders"
        />
      </ChartPanel>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartPanel
          {...(busiestWeekday
            ? {
                coverage: "Each order is counted once.",
              }
            : {})}
          subtitle="Order volume by day of the week, summed across the year."
          title="Workload by weekday"
          unit="orders"
        >
          <ColumnChart
            accent="#49747a"
            onSelect={(point) => filter.toggle("weekday", point)}
            points={filter.analyticsExcept("weekday").by_weekday.map((row) => ({
              label: row.weekday!.slice(0, 3),
              filterValue: row.weekday!,
              value: row.order_count,
              caption: `${Number(row.pounds).toLocaleString("en-US", { maximumFractionDigits: 0 })} lb processed`,
            }))}
            selectedValue={filter.valueOn("weekday")}
            unit="COUNT"
          />
        </ChartPanel>

        <ChartPanel
          subtitle="How the workload splits between laundry service and retail, counted in orders."
          title="Work type mix"
          unit="orders"
        >
          <MixBar
            segments={(analytics.by_order_type ?? analytics.by_service_type).map((row) => {
              const colors: Record<string, string> = {
                "Laundry only": "#355f86",
                "Laundry service": "#355f86",
                "Retail only": "#a47742",
                Retail: "#a47742",
                Both: "#4f7770",
              };
              return {
                label: row.name!,
                value: row.order_count,
                color: colors[row.name!] ?? "#778492",
              };
            })}
            unit="COUNT"
          />
        </ChartPanel>
      </div>

      <ChartPanel
        coverage="Counts orders, not money, so a manager sees the shape of the work rather than its value."
        subtitle="Which parts of the store the work sits in. Click one to filter this page by it."
        title="Workload by department"
        unit="orders"
      >
        <RankedBars
          accent="#4f7462"
          onSelect={(point) => filter.toggle("department", point)}
          points={[...filter.analyticsExcept("department").by_department]
            .sort((a, b) => b.order_count - a.order_count)
            .slice(0, 5)
            .map((row) => ({
              label: row.name!,
              value: row.order_count,
              caption: `${row.line_count.toLocaleString("en-US")} lines · ${Number(row.pounds).toLocaleString("en-US", { maximumFractionDigits: 0 })} lb`,
            }))}
          selectedValue={filter.valueOn("department")}
          unit="COUNT"
        />
      </ChartPanel>

      {selectedDepartment ? (
        <ChartPanel
          className="chart-panel-wide"
          coverage="This drill-down uses the same selected WDF department population as the Top 5 ranking."
          subtitle={`Monthly order volume for ${selectedDepartment}. Clear the department filter to return to the store view.`}
          title={`${selectedDepartment} workload by month`}
          unit="orders"
        >
          <ColumnChart
            accent="#4f7462"
            points={filter.view.analytics.by_month.map((row) => ({
              label: row.period!.slice(5),
              value: row.order_count,
              caption: `${row.line_count.toLocaleString("en-US")} lines`,
            }))}
            unit="COUNT"
          />
        </ChartPanel>
      ) : null}

      <ChartPanel
        className="chart-panel-wide"
        coverage="Pounds are counted only where the source records a line in pounds."
        subtitle="Weighed volume through the machines each month, to plan staffing and supplies."
        title="Pounds processed by month"
        unit="pounds"
      >
        <ColumnChart
          accent="#685a78"
          onSelect={(point) => filter.toggle("month", point)}
          points={filter.analyticsExcept("month").by_month.map((row) => ({
            label: row.period!.slice(5),
            filterValue: row.period!,
            value: Number(row.pounds),
            caption: `${row.order_count.toLocaleString("en-US")} orders`,
          }))}
          selectedValue={filter.valueOn("month")}
          unit="POUNDS"
        />
      </ChartPanel>

      <p className="text-[10px] leading-[1.6] text-muted">
        Operational volumes only. Sales values, wages and store financials are not shown here,
        because they are outside a manager&apos;s permitted scope.
      </p>
    </div>
  );
}
