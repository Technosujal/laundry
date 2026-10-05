import { useMemo, useState } from "react";

import { ChartPanel, LineChart, formatExact } from "../../../components/charts/primitives";
import type { SourceComparison, SourceComparisonPoint } from "../analytics-gateway";
import type { AnalyticsGrain } from "../period-label";
import { formatPeriodLabel } from "../period-label";

const grains: { id: AnalyticsGrain; label: string }[] = [
  { id: "day", label: "Day" },
  { id: "month", label: "Month" },
  { id: "year", label: "Year" },
];

function total(rows: SourceComparisonPoint[], field: keyof SourceComparisonPoint): number {
  return rows.reduce((sum, row) => sum + Number(row[field]), 0);
}

function quarterTotals(rows: SourceComparisonPoint[]) {
  const values = Array.from({ length: 4 }, () => ({ wdf: 0, laundro: 0 }));
  rows.forEach((row) => {
    const month = Number(row.period.slice(5, 7));
    const quarter = Math.floor((month - 1) / 3);
    if (quarter >= 0 && quarter < 4) {
      values[quarter]!.wdf += Number(row.wdf_counter_sales);
      values[quarter]!.laundro += Number(row.laundro_machine_revenue);
    }
  });
  return values;
}

export function SourceComparisonSection({
  comparison,
  onOpenSection,
}: {
  comparison: SourceComparison;
  onOpenSection?: (
    section: "products" | "customers" | "staff" | "lp-sales" | "lp-trends" | "lp-customers",
  ) => void;
}) {
  const [grain, setGrain] = useState<AnalyticsGrain>("month");
  const [period, setPeriod] = useState("all");
  const available = comparison[`by_${grain}`];
  const rows = useMemo(
    () => (period === "all" ? available : available.filter((row) => row.period === period)),
    [available, period],
  );
  const wdf = total(rows, "wdf_counter_sales");
  const laundro = total(rows, "laundro_machine_revenue");
  const wdfBase = Number(rows[0]?.wdf_counter_sales ?? 0);
  const laundroBase = Number(rows[0]?.laundro_machine_revenue ?? 0);
  const quarters = quarterTotals(comparison.by_month);

  function changeGrain(next: AnalyticsGrain) {
    const nextRows = comparison[`by_${next}`];
    setGrain(next);
    setPeriod(next === "day" ? (nextRows.at(-1)?.period ?? "all") : "all");
  }

  const selectedLabel =
    period === "all"
      ? grain === "month"
        ? "All months"
        : `All ${grain}s`
      : formatPeriodLabel(period, grain);

  return (
    <div className="grid min-w-0 gap-4">
      <section className="rounded-2xl border border-[#d8dce7] bg-white p-4 shadow-[0_8px_25px_rgba(17,19,24,0.04)] sm:p-6">
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-lg font-semibold tracking-[-0.025em] text-ink">
              WDF POS vs LaundroPortal
            </h3>
            <p className="mt-1 text-xs leading-5 text-muted">
              Paid counter sales and machine revenue, compared for the same calendar period. No
              combined total is calculated because the files record different business events.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <details className="group rounded-xl border border-line bg-canvas">
              <summary className="cursor-pointer list-none px-4 py-2.5 text-xs font-semibold text-ink">
                Filters <span aria-hidden="true">⌄</span>
              </summary>
              <div className="grid gap-3 border-t border-line p-3 sm:grid-cols-[auto_minmax(180px,auto)] sm:items-end">
                <fieldset className="grid grid-cols-3 rounded-xl border border-line bg-white p-1">
                  <legend className="sr-only">Time view</legend>
                  {grains.map((item) => (
                    <button
                      aria-pressed={grain === item.id}
                      className={`rounded-lg px-4 py-2.5 text-xs font-semibold ${grain === item.id ? "bg-ink text-white" : "text-muted hover:bg-canvas"}`}
                      key={item.id}
                      onClick={() => changeGrain(item.id)}
                      type="button"
                    >
                      {item.label}
                    </button>
                  ))}
                </fieldset>
                <PeriodControl
                  available={available}
                  grain={grain}
                  period={period}
                  setPeriod={setPeriod}
                />
              </div>
            </details>
            <span className="rounded-full border border-line bg-white px-3 py-1.5 text-[10px] font-semibold text-muted">
              {grain === "month" ? "Month" : grain === "day" ? "Day" : "Year"}: {selectedLabel}
            </span>
            {period !== "all" ? (
              <button
                className="text-[10px] font-bold text-[#355f86] hover:underline"
                onClick={() => setPeriod("all")}
                type="button"
              >
                Clear all
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {[
          ["WDF paid counter sales", wdf, "#355f86"],
          ["LaundroPortal machine revenue", laundro, "#66556f"],
        ].map(([label, value, accent]) => (
          <div className="rounded-2xl border border-line bg-white p-5" key={String(label)}>
            <span className="block h-1 w-10 rounded-full" style={{ background: String(accent) }} />
            <p className="mt-4 text-xs font-semibold text-muted">{label}</p>
            <strong className="mt-1 block text-2xl font-semibold tabular-nums text-ink">
              {formatExact(Number(value), "CURRENCY_USD")}
            </strong>
            <p className="mt-2 text-[10px] leading-4 text-muted">{selectedLabel}</p>
          </div>
        ))}
      </div>

      <div className="max-w-[760px]">
        <ChartPanel
          coverage="This index compares movement, not dollars. Each source begins at 100 because the source values record different business events and cannot be added or treated as a reconciliation."
          subtitle="Each source starts at 100 so relative movement remains readable despite the different dollar scales."
          title={`Source movement index — ${selectedLabel}`}
          unit="First period = 100"
        >
          <LineChart
            accent="#355f86"
            comparison={rows.map((row) => ({
              label: formatPeriodLabel(row.period, grain, rows.length > 6),
              value: laundroBase ? (Number(row.laundro_machine_revenue) / laundroBase) * 100 : 0,
            }))}
            comparisonLabel="LaundroPortal machine revenue"
            onSelect={(point) => {
              const selected = available.find(
                (row) => formatPeriodLabel(row.period, grain, rows.length > 6) === point.label,
              );
              if (selected) setPeriod(selected.period);
            }}
            points={rows.map((row) => ({
              label: formatPeriodLabel(row.period, grain, rows.length > 6),
              filterValue: row.period,
              value: wdfBase ? (Number(row.wdf_counter_sales) / wdfBase) * 100 : 0,
            }))}
            seriesLabel="WDF paid counter sales"
            showArea={false}
            showPoints
            unit="COUNT"
          />
        </ChartPanel>
      </div>

      <ChartPanel
        coverage="Quarter values retain their own source definitions. No combined total or cross-source percentage is calculated."
        subtitle="Exact quarterly values for each source, kept on separate numeric columns."
        title="Quarterly source values"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-xs">
            <thead className="text-left text-muted">
              <tr className="border-b border-line">
                <th className="py-2">Quarter</th>
                <th className="py-2 text-right text-[#355f86]">WDF POS</th>
                <th className="py-2 text-right text-[#66556f]">LaundroPortal</th>
              </tr>
            </thead>
            <tbody>
              {quarters.map((quarter, index) => (
                <tr className="border-b border-line/60" key={`Q${index + 1}`}>
                  <td className="py-2 font-semibold">Q{index + 1}</td>
                  <td className="py-2 text-right tabular-nums">
                    {formatExact(quarter.wdf, "CURRENCY_USD")}
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {formatExact(quarter.laundro, "CURRENCY_USD")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartPanel>

      <section className="rounded-2xl border border-line bg-white p-5 sm:p-6">
        <header>
          <h3 className="text-base font-semibold text-ink">Comparison coverage by subject</h3>
          <p className="mt-1 text-xs text-muted">
            Every subject is listed; unsupported comparisons are not replaced with estimated data.
          </p>
        </header>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[
            ["Sales", "Compared", "Day, month, year and quarterly share", "overview", "#496f6a"],
            [
              "Trends",
              "Compared",
              "Matched calendar periods for both sources",
              "lp-trends",
              "#496f6a",
            ],
            [
              "Products",
              "WDF only",
              "LaundroPortal supplies no product fields",
              "products",
              "#355f86",
            ],
            [
              "Customers",
              "Separate only",
              "No safe customer key exists between sources",
              "customers",
              "#66556f",
            ],
            [
              "Staff & ops",
              "WDF only",
              "No matching LaundroPortal staff population",
              "staff",
              "#355f86",
            ],
            [
              "Machines & cards",
              "LaundroPortal only",
              "WDF supplies no matching machine/card series",
              "lp-sales",
              "#66556f",
            ],
          ].map(([label, status, detail, target, color]) => (
            <button
              className="group rounded-2xl border border-line bg-canvas p-4 text-left outline-none transition hover:-translate-y-0.5 hover:bg-white hover:shadow-panel focus-visible:ring-2 focus-visible:ring-ink"
              key={label}
              onClick={() =>
                onOpenSection?.(
                  target as
                    "products" | "customers" | "staff" | "lp-sales" | "lp-trends" | "lp-customers",
                )
              }
              type="button"
            >
              <span className="block h-1 w-9 rounded-full" style={{ background: color }} />
              <strong className="mt-3 block text-sm text-ink">{label}</strong>
              <span
                className="mt-1 block text-[10px] font-bold uppercase tracking-[0.07em]"
                style={{ color }}
              >
                {status}
              </span>
              <span className="mt-2 block text-[11px] leading-5 text-muted">{detail}</span>
            </button>
          ))}
        </div>
      </section>

      <ChartPanel
        coverage="Each row compares the same calendar period. Values remain separate because the supplied files do not establish that these revenue streams overlap."
        subtitle="The exact figures behind every pair of bars."
        title="Period-by-period values"
      >
        <div className="max-h-[480px] overflow-auto">
          <table className="w-full min-w-[520px] border-collapse text-xs">
            <thead className="sticky top-0 bg-white text-left text-muted">
              <tr className="border-b border-line">
                <th className="py-2">Period</th>
                <th className="py-2 text-right">WDF POS</th>
                <th className="py-2 text-right">LaundroPortal</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr className="border-b border-line/60" key={row.period}>
                  <td className="py-2 font-semibold text-ink">
                    {formatPeriodLabel(row.period, grain)}
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {formatExact(row.wdf_counter_sales, "CURRENCY_USD")}
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {formatExact(row.laundro_machine_revenue, "CURRENCY_USD")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartPanel>
    </div>
  );
}

function PeriodControl({
  available,
  grain,
  period,
  setPeriod,
}: {
  available: SourceComparisonPoint[];
  grain: AnalyticsGrain;
  period: string;
  setPeriod: (period: string) => void;
}) {
  if (grain === "day") {
    return (
      <label className="grid gap-1 text-[10px] font-bold uppercase tracking-[0.06em] text-muted">
        Calendar day
        <input
          className="min-h-11 rounded-xl border border-line bg-white px-3 text-xs font-semibold normal-case tracking-normal text-ink"
          max={available.at(-1)?.period}
          min={available[0]?.period}
          onChange={(event) => setPeriod(event.target.value)}
          type="date"
          value={period === "all" ? "" : period}
        />
      </label>
    );
  }
  if (grain === "month") {
    return (
      <div className="grid grid-cols-[auto_1fr] gap-2">
        <button
          aria-pressed={period === "all"}
          className={`min-h-11 rounded-xl border px-3 text-xs font-semibold ${period === "all" ? "border-[#b9aebd] bg-[#f3eff4] text-[#66556f]" : "border-line bg-white text-muted"}`}
          onClick={() => setPeriod("all")}
          type="button"
        >
          All months
        </button>
        <label className="grid gap-1">
          <span className="sr-only">Exact month</span>
          <input
            className="min-h-11 min-w-0 rounded-xl border border-line bg-white px-3 text-xs font-semibold text-ink"
            max={available.at(-1)?.period}
            min={available[0]?.period}
            onChange={(event) => setPeriod(event.target.value || "all")}
            type="month"
            value={period === "all" ? "" : period}
          />
        </label>
      </div>
    );
  }
  return (
    <label className="grid gap-1 text-[10px] font-bold uppercase tracking-[0.06em] text-muted">
      Calendar year
      <select
        className="min-h-11 rounded-xl border border-line bg-white px-3 text-xs font-semibold normal-case tracking-normal text-ink"
        onChange={(event) => setPeriod(event.target.value)}
        value={period}
      >
        <option value="all">All years</option>
        {available.map((row) => (
          <option key={row.period} value={row.period}>
            {row.period}
          </option>
        ))}
      </select>
    </label>
  );
}
