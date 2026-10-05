import { useState } from "react";

import {
  ChartPanel,
  ColumnChart,
  DoughnutChart,
  LineChart,
  RankedBars,
  formatBusinessDate,
  formatExact,
} from "../../../components/charts/primitives";
import { KpiCard } from "../../../components/charts/KpiCard";
import type { CardAccounts, Machines, Metric, VacLog } from "../analytics-gateway";
import type { AnalyticsGrain } from "../period-label";
import { formatPeriodLabel } from "../period-label";

const metricPresentation: Record<string, { color: string; chart: "column" | "line" }> = {
  accounts_used_total: { color: "#7f7086", chart: "column" },
  card_value_loaded_total: { color: "#66556f", chart: "line" },
  machine_revenue_total: { color: "#594962", chart: "column" },
  management_card_starts_value: { color: "#8f8195", chart: "column" },
  new_cards_total: { color: "#75647d", chart: "column" },
  washer_cycles_total: { color: "#504259", chart: "line" },
};

/**
 * The LaundroPortal side of the business, kept visibly apart from the WDF POS side.
 *
 * WDF POS records what happens at the counter; LaundroPortal records what happens at the
 * machines and on stored-value cards. They count different things and must never be added
 * together into one "revenue", so every figure here carries a LaundroPortal badge and the two
 * systems are never summed on the same axis.
 */
export function MachinesSection({
  machines,
  metrics,
  accounts,
  vac,
}: {
  machines: Machines;
  metrics: Metric[];
  accounts: CardAccounts;
  vac: VacLog;
}) {
  const byId = new Map(metrics.map((metric) => [metric.definition.metric_id, metric]));
  const washer = machines.by_class["WASHER"];
  const dryer = machines.by_class["DRYER"];
  const [grain, setGrain] = useState<AnalyticsGrain>("month");
  const [dayMonth, setDayMonth] = useState(() => metrics[0]?.last_day?.slice(0, 7) ?? "");

  const headline = [
    ["machine_revenue_total", "Machine revenue", "CURRENCY_USD", "Taken at the machines"],
    [
      "card_value_loaded_total",
      "Card value loaded",
      "CURRENCY_USD",
      "Loaded onto stored-value cards",
    ],
    ["washer_cycles_total", "Washer cycles", "COUNT", "Washers only; dryers report no cycles"],
    ["accounts_used_total", "Accounts used", "COUNT", "Card accounts that transacted"],
  ] as const;

  return (
    <div className="grid min-w-0 gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {headline.map(([id, label, unit, context]) => {
          const metric = byId.get(id);
          if (!metric) return null;
          return (
            <KpiCard
              accent="#66556f"
              context={context}
              key={id}
              label={label}
              source="LaundroPortal"
              unit={unit}
              value={metric.total}
            />
          );
        })}
      </div>

      <section className="rounded-2xl border border-line bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-ink">LaundroPortal activity</h3>
            <p className="mt-1 text-xs text-muted">Each measure has its own chart and scale.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <fieldset className="grid grid-cols-3 rounded-xl border border-line bg-canvas p-1">
              <legend className="sr-only">Time view</legend>
              {(["day", "month", "year"] as const).map((item) => (
                <button
                  aria-pressed={grain === item}
                  className={`rounded-lg px-4 py-2 text-xs font-semibold capitalize ${grain === item ? "bg-ink text-white" : "text-muted hover:bg-white"}`}
                  key={item}
                  onClick={() => setGrain(item)}
                  type="button"
                >
                  {item}
                </button>
              ))}
            </fieldset>
            {grain === "day" ? (
              <label className="grid gap-1 text-[9px] font-bold uppercase tracking-[0.07em] text-muted">
                Month shown
                <input
                  className="min-h-10 rounded-xl border border-line bg-white px-3 text-xs font-semibold normal-case tracking-normal text-ink"
                  onChange={(event) => setDayMonth(event.target.value)}
                  type="month"
                  value={dayMonth}
                />
              </label>
            ) : null}
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        {metrics.map((metric) => {
          const series = metric[`by_${grain}`].filter(
            (point) => grain !== "day" || point.period.startsWith(dayMonth),
          );
          const unit = metric.unit === "CURRENCY_USD" ? "CURRENCY_USD" : "COUNT";
          const presentation = metricPresentation[metric.definition.metric_id] ?? {
            color: "#66556f",
            chart: "column",
          };
          const points = series.map((point) => ({
            label: formatPeriodLabel(point.period, grain, true),
            value: Number(point.value),
          }));
          return (
            <ChartPanel
              coverage={metric.source_coverage_note}
              key={metric.definition.metric_id}
              source="LaundroPortal"
              subtitle={metric.business_event}
              title={metric.definition.label}
              unit={unit === "CURRENCY_USD" ? "US dollars" : "count"}
            >
              <div className="overflow-x-auto pb-2">
                <div style={{ minWidth: grain === "day" ? Math.max(520, series.length * 20) : 0 }}>
                  {presentation.chart === "line" ? (
                    <LineChart
                      accent={presentation.color}
                      points={points}
                      seriesLabel={metric.definition.label}
                      showArea={false}
                      unit={unit}
                    />
                  ) : (
                    <ColumnChart
                      accent={presentation.color}
                      labelEvery={grain === "day" ? 2 : 1}
                      points={points}
                      unit={unit}
                    />
                  )}
                </div>
              </div>
            </ChartPanel>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartPanel
          coverage="Washers report cycles; all 30 dryers report revenue with zero cycles, so a revenue-per-cycle figure would be overstated and is deliberately not shown."
          source="LaundroPortal"
          subtitle="How machine revenue divides between washers and dryers."
          title="Machine revenue by class"
          unit="US dollars"
        >
          <DoughnutChart
            segments={[
              { label: "Washers", value: Number(washer?.revenue ?? 0), color: "#66556f" },
              { label: "Dryers", value: Number(dryer?.revenue ?? 0), color: "#c8becb" },
            ]}
            unit="CURRENCY_USD"
          />
          <dl className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <dt className="text-[9px] font-bold uppercase tracking-[0.08em] text-muted">
                Washers
              </dt>
              <dd className="mt-1 text-[13px] font-semibold tabular-nums text-ink">
                {washer?.machine_count ?? 0} machines ·{" "}
                {Number(washer?.cycles ?? 0).toLocaleString("en-US")} cycles
              </dd>
            </div>
            <div>
              <dt className="text-[9px] font-bold uppercase tracking-[0.08em] text-muted">
                Dryers
              </dt>
              <dd className="mt-1 text-[13px] font-semibold tabular-nums text-ink">
                {dryer?.machine_count ?? 0} machines · cycles not reported
              </dd>
            </div>
          </dl>
        </ChartPanel>

        <ChartPanel
          coverage="All supplied machines are ranked."
          source="LaundroPortal"
          subtitle="Highest machine revenue totals."
          title="Highest-earning machines"
          unit="US dollars"
        >
          <RankedBars
            accent="#66556f"
            points={[...machines.machines]
              .sort((a, b) => Number(b.revenue) - Number(a.revenue))
              .slice(0, 10)
              .map((machine) => ({
                label: machine.machine,
                value: Number(machine.revenue),
                caption:
                  Number(machine.cycles) > 0
                    ? `${Number(machine.cycles).toLocaleString("en-US")} cycles`
                    : `${machine.machine_class.toLowerCase()} · cycles not reported`,
              }))}
            unit="CURRENCY_USD"
          />
        </ChartPanel>
      </div>

      {accounts.available ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartPanel
            coverage="Contact details stay private."
            source="LaundroPortal"
            subtitle="Card accounts and balances."
            title="Card accounts"
            unit="accounts"
          >
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Accounts", accounts.account_count.toLocaleString("en-US")],
                ["Balance outstanding", formatExact(accounts.total_balance, "CURRENCY_USD")],
                [
                  "Average balance",
                  accounts.average_balance
                    ? formatExact(accounts.average_balance, "CURRENCY_USD")
                    : "Not supplied",
                ],
                ["Empty cards", accounts.zero_balance.toLocaleString("en-US")],
              ].map(([label, value]) => (
                <div className="rounded-xl border border-line bg-canvas px-3 py-2" key={label}>
                  <dt className="text-[9px] font-bold uppercase tracking-[0.08em] text-muted">
                    {label}
                  </dt>
                  <dd className="mt-1 text-[15px] font-semibold tabular-nums text-ink">{value}</dd>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <RankedBars
                accent="#66556f"
                points={accounts.balance_bands.map((band) => ({
                  label: band.band,
                  value: band.accounts,
                }))}
                unit="COUNT"
              />
            </div>
          </ChartPanel>

          {vac.available ? (
            <ChartPanel
              coverage="Each transaction is counted once."
              source="LaundroPortal"
              subtitle="Completed card reload transactions."
              title="Card reloads"
              unit="US dollars"
            >
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Value loaded", formatExact(vac.value_loaded, "CURRENCY_USD")],
                  ["Transactions", vac.transaction_count.toLocaleString("en-US")],
                  ["Log rows", vac.row_count.toLocaleString("en-US")],
                  ["Paired rows", vac.paired_transactions.toLocaleString("en-US")],
                  ["Raw row total", formatExact(vac.every_row_total, "CURRENCY_USD")],
                  [
                    "Repeated row value",
                    formatExact(vac.double_counted_if_summed_naively, "CURRENCY_USD"),
                  ],
                ].map(([label, value]) => (
                  <div className="rounded-xl border border-line bg-canvas px-3 py-2" key={label}>
                    <dt className="text-[9px] font-bold uppercase tracking-[0.08em] text-muted">
                      {label}
                    </dt>
                    <dd className="mt-1 text-[15px] font-semibold tabular-nums text-ink">
                      {value}
                    </dd>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <RankedBars
                  accent="#66556f"
                  points={vac.by_operation
                    .slice(0, 6)
                    .map((row) => ({ label: row.name, value: row.count }))}
                  unit="COUNT"
                />
              </div>
            </ChartPanel>
          ) : null}
        </div>
      ) : null}

      <ChartPanel
        coverage="Published so the two systems can be compared side by side without being combined. No supplied file establishes how a machine start relates to a counter order, so no combined total is offered."
        source="LaundroPortal"
        subtitle="Every LaundroPortal measure this build publishes, with its own definition and total."
        title="All LaundroPortal measures"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-[11px]">
            <caption className="sr-only">LaundroPortal measures</caption>
            <thead>
              <tr className="border-b border-line text-left text-muted">
                <th className="pb-2 text-[9px] font-bold uppercase tracking-[0.08em]">Measure</th>
                <th className="pb-2 text-[9px] font-bold uppercase tracking-[0.08em]">Period</th>
                <th className="pb-2 text-right text-[9px] font-bold uppercase tracking-[0.08em]">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric) => (
                <tr
                  className="border-b border-line/60 last:border-b-0"
                  key={metric.definition.metric_id}
                >
                  <td className="py-2 pr-3 text-ink">
                    {metric.definition.label}
                    <span className="mt-0.5 block text-[10px] text-muted">
                      {metric.distinct_days} days recorded
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-muted">
                    {metric.first_day ? formatBusinessDate(metric.first_day) : "Unknown"} to{" "}
                    {metric.last_day ? formatBusinessDate(metric.last_day) : "Unknown"}
                  </td>
                  <td className="py-2 text-right font-mono tabular-nums text-ink">
                    {formatExact(
                      metric.total,
                      metric.unit === "CURRENCY_USD" ? "CURRENCY_USD" : "COUNT",
                    )}
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
