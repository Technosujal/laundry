import { useState } from "react";

import {
  ChartPanel,
  DataViewToggle,
  LineChart,
  PointTable,
  RankedBars,
  formatBusinessDate,
  formatExact,
} from "../../../components/charts/primitives";
import { KpiCard } from "../../../components/charts/KpiCard";
import type { SalesBucket, WdfSales } from "../analytics-gateway";
import type { SalesFilterState } from "../sales-filter";

function DayTable({ rows, title, tone }: { rows: SalesBucket[]; title: string; tone: string }) {
  return (
    <div className="min-w-0">
      <h4 className="text-[10px] font-bold uppercase tracking-[0.09em] text-muted">{title}</h4>
      <ul className="mt-2.5 grid gap-1.5">
        {rows.map((row, index) => (
          <li
            className="flex items-center justify-between gap-3 rounded-lg border border-line bg-canvas px-3 py-2"
            key={row.period}
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <span
                className="grid h-5 w-5 shrink-0 place-items-center rounded-md text-[9px] font-bold text-white"
                style={{ background: tone }}
              >
                {index + 1}
              </span>
              <span className="truncate text-[11px] text-ink">
                {row.period ? formatBusinessDate(row.period) : "Unknown date"}
              </span>
            </span>
            <span className="shrink-0 text-[11px] font-semibold tabular-nums text-ink">
              {formatExact(row.subtotal, "CURRENCY_USD")}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatMonth(period: string): string {
  const date = new Date(`${period}-01T00:00:00Z`);
  return Number.isNaN(date.getTime())
    ? period
    : new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(
        date,
      );
}

export function TrendsSection({ filter, sales }: { filter: SalesFilterState; sales: WdfSales }) {
  const [weeklyView, setWeeklyView] = useState<"visual" | "table">("visual");
  const [daysView, setDaysView] = useState<"visual" | "table">("visual");
  const a = sales.analytics;
  const weeks = [...a.by_week].sort(
    (first, second) => Number(second.subtotal) - Number(first.subtotal),
  );
  const bestWeek = weeks[0];
  const averageWeek = weeks.length ? Number(a.totals.net_sales) / weeks.length : 0;
  const selectedMonth = filter.valueOn("month");
  const firstDate = new Date(`${a.totals.first_day}T00:00:00Z`);
  const lastDate = new Date(`${a.totals.last_day}T00:00:00Z`);
  const calendarDays =
    Number.isNaN(firstDate.getTime()) || Number.isNaN(lastDate.getTime())
      ? a.totals.open_days
      : Math.max(0, Math.round((lastDate.getTime() - firstDate.getTime()) / 86400000) + 1);
  const daysWithoutSales = Math.max(0, calendarDays - a.totals.open_days);

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:order-0 xl:col-span-2 xl:grid-cols-4">
        <KpiCard
          label="Average week"
          value={averageWeek}
          unit="CURRENCY_USD"
          context={`${weeks.length} ISO weeks`}
        />
        <KpiCard
          label="Best week"
          value={bestWeek?.subtotal ?? "0"}
          unit="CURRENCY_USD"
          context={bestWeek?.period ?? "No week recorded"}
          accent="#355f86"
        />
        <KpiCard
          label="Average open day"
          value={a.totals.average_day ?? "0"}
          unit="CURRENCY_USD"
          context={`${a.totals.open_days} days with sales`}
          accent="#355f86"
        />
        <KpiCard
          label="Days with no sales"
          value={daysWithoutSales}
          unit="COUNT"
          context={`${calendarDays} calendar days in view`}
          accent="#355f86"
        />
      </div>

      <ChartPanel
        action={<DataViewToggle onChange={setWeeklyView} value={weeklyView} />}
        className="xl:order-1"
        coverage="ISO weeks include boundary dates."
        subtitle="Weekly totals show the direction and turning points without crowding 53 separate bars."
        title="Weekly net sales"
        unit="US dollars"
      >
        {weeklyView === "table" ? (
          <PointTable
            label="ISO week"
            points={a.by_week.map((row) => ({
              label: row.period!.replace("-", " "),
              value: Number(row.subtotal),
              caption: `${row.order_count.toLocaleString("en-US")} orders`,
            }))}
            unit="CURRENCY_USD"
          />
        ) : (
          <LineChart
            accent="#355f86"
            height={190}
            points={a.by_week.map((row) => ({
              label: row.period!.replace("-", " "),
              value: Number(row.subtotal),
              caption: `${row.order_count.toLocaleString("en-US")} orders`,
            }))}
            seriesLabel="Weekly net sales"
            showArea={false}
            showPoints={false}
            unit="CURRENCY_USD"
          />
        )}
      </ChartPanel>

      {selectedMonth ? (
        <div className="xl:order-3 xl:col-span-2 max-w-[760px]">
          <ChartPanel
            coverage="The trailing average uses the seven most recent trading days, so early days average over a shorter window."
            subtitle={`Daily counter sales for ${formatMonth(selectedMonth)} with a seven-day trailing average.`}
            title="Daily sales drill-down"
            unit="US dollars"
          >
            <LineChart
              comparison={a.trailing.map((row) => ({
                label: row.period,
                value: Number(row.trailing_average),
              }))}
              comparisonLabel="7-day trailing average"
              points={a.by_day.map((row) => ({
                label: row.period!,
                value: Number(row.subtotal),
                caption: `${row.order_count.toLocaleString("en-US")} orders`,
              }))}
              seriesLabel="Daily sales"
              showArea={false}
              showPoints={false}
              unit="CURRENCY_USD"
            />
          </ChartPanel>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-line bg-canvas px-5 py-4 text-xs text-muted xl:order-3 xl:col-span-2">
          Select a month in Filters to open the daily sales and seven-day-average drill-down.
        </div>
      )}

      <ChartPanel
        className="xl:order-2"
        coverage="A change is shown only where a prior month exists, so January has none."
        subtitle="How each month compares with the month before it."
        title="Month-over-month change"
        unit="percent"
      >
        <ul className="grid gap-2 sm:grid-cols-2">
          {filter.analyticsExcept("month").momentum.map((row) => {
            const change = row.change === null ? null : Number(row.change);
            const positive = change !== null && change > 0;
            return (
              <li key={row.period}>
                <button
                  aria-pressed={filter.valueOn("month") === row.period}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-brand ${
                    filter.valueOn("month") === row.period
                      ? "border-brand/40 bg-brand-soft"
                      : "border-line bg-canvas hover:border-[#d6d7dc]"
                  }`}
                  onClick={() =>
                    filter.toggle("month", { label: row.period, value: Number(row.subtotal) })
                  }
                  type="button"
                >
                  <span className="text-[11px] font-medium text-ink">
                    {row.period ? formatMonth(row.period) : "Unknown month"}
                  </span>
                  <span className="flex items-center gap-2.5">
                    <span className="text-[11px] tabular-nums text-muted">
                      {formatExact(row.subtotal, "CURRENCY_USD")}
                    </span>
                    {change === null ? (
                      <span className="rounded-full border border-line bg-white px-2 py-0.5 text-[9px] font-bold text-muted">
                        No prior month
                      </span>
                    ) : (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-bold tabular-nums ${
                          positive ? "bg-[#e8f7ee] text-[#1c6238]" : "bg-[#fdeee7] text-[#9a3412]"
                        }`}
                      >
                        {positive ? "+" : ""}
                        {change.toFixed(1)}%
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </ChartPanel>

      <ChartPanel
        action={<DataViewToggle onChange={setDaysView} value={daysView} />}
        className="xl:order-4 xl:col-span-2"
        coverage={`Ranked from the ${a.totals.open_days.toLocaleString("en-US")} days that recorded at least one paid line. Days with no sales are not ranked.`}
        subtitle="The strongest and weakest trading days of the year."
        title="Five strongest and weakest days"
      >
        {daysView === "table" ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <DayTable rows={a.best_days} title="Ten best days" tone="#718078" />
            <DayTable rows={a.slowest_days} title="Ten slowest trading days" tone="#8d7252" />
          </div>
        ) : (
          <div className="grid items-start gap-6 lg:grid-cols-2">
            <div>
              <h4 className="mb-3 text-[10px] font-bold uppercase tracking-[0.09em] text-muted">
                Five strongest days
              </h4>
              <RankedBars
                accent="#55766f"
                points={a.best_days.slice(0, 5).map((row) => ({
                  label: row.period ? formatBusinessDate(row.period) : "Unknown date",
                  value: Number(row.subtotal),
                }))}
                unit="CURRENCY_USD"
              />
            </div>
            <div>
              <h4 className="mb-3 text-[10px] font-bold uppercase tracking-[0.09em] text-muted">
                Five weakest trading days
              </h4>
              <RankedBars
                accent="#9a7b60"
                points={a.slowest_days.slice(0, 5).map((row) => ({
                  label: row.period ? formatBusinessDate(row.period) : "Unknown date",
                  value: Number(row.subtotal),
                }))}
                unit="CURRENCY_USD"
              />
            </div>
          </div>
        )}
      </ChartPanel>
    </div>
  );
}
