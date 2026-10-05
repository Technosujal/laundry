import { useState } from "react";

import {
  ChartPanel,
  ColumnChart,
  GroupedColumnChart,
  RankedBars,
  formatExact,
} from "../../../components/charts/primitives";
import { KpiCard } from "../../../components/charts/KpiCard";
import type { WdfSales } from "../analytics-gateway";
import { CustomerDirectory } from "./CustomerDirectory";

const RANK_COLOURS = ["#b1842f", "#778492", "#9a6848", "#7892a8", "#9fb0bf"];

function LeaderCard({
  label,
  customer,
  value,
  detail,
}: {
  label: string;
  customer: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-line bg-white p-3.5 shadow-[0_5px_18px_rgba(17,19,24,0.035)]">
      <span className="text-[9px] font-extrabold uppercase tracking-[0.08em] text-muted">
        {label}
      </span>
      <strong className="mt-2 block truncate text-base font-semibold text-ink">{customer}</strong>
      <span className="mt-1 block text-sm font-semibold tabular-nums text-[#355f86]">{value}</span>
      <span className="mt-1 block text-[10px] leading-4 text-muted">{detail}</span>
    </div>
  );
}

export function CustomersSection({ sales }: { sales: WdfSales }) {
  const [showDirectory, setShowDirectory] = useState(false);
  const c = sales.operations.customers;
  const coverage = sales.operations.coverage;
  const topBySales = c.top.slice(0, 5);
  const topByOrders = [...c.top]
    .sort((a, b) => b.order_count - a.order_count || Number(b.sales) - Number(a.sales))
    .slice(0, 5);
  const highestSpender = topBySales[0];
  const mostOrders = topByOrders[0];

  return (
    <div className="grid min-w-0 gap-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          accent="#355f86"
          context="Supplied Top Customers report"
          coverage="PARTIAL"
          label="Ranked-customer sales"
          unit="CURRENCY_USD"
          value={c.top_total}
        />
        <KpiCard
          accent="#4f7770"
          context={`Median ${formatExact(c.median_laundry_ticket ?? "0", "CURRENCY_USD")}`}
          label="Average drop-off ticket"
          unit="CURRENCY_USD"
          value={c.average_laundry_ticket ?? "0"}
        />
        <LeaderCard
          customer={highestSpender?.customer ?? "Unavailable"}
          detail={`${highestSpender?.order_count ?? 0} reported orders`}
          label="Highest customer spend"
          value={formatExact(highestSpender?.sales ?? "0", "CURRENCY_USD")}
        />
        <LeaderCard
          customer={mostOrders?.customer ?? "Unavailable"}
          detail={`${formatExact(mostOrders?.sales ?? "0", "CURRENCY_USD")} reported sales`}
          label="Most reported orders"
          value={`${mostOrders?.order_count.toLocaleString("en-US") ?? "0"} orders`}
        />
      </div>

      <div className="grid items-stretch gap-4 xl:grid-cols-2">
        <ChartPanel
          coverage={coverage.top_customers?.note ?? "Top Customers report subset."}
          subtitle="Top five customers ranked by recorded sales. Gold, silver and bronze identify the first three ranks."
          title="Highest-spending customers"
          unit="US dollars"
        >
          <RankedBars
            points={topBySales.map((row, index) => ({
              label: row.customer,
              value: Number(row.sales),
              color: RANK_COLOURS[index] ?? "#7892a8",
              caption: `${row.order_count.toLocaleString("en-US")} orders · avg ${formatExact(row.average_ticket ?? "0", "CURRENCY_USD")}`,
            }))}
            unit="CURRENCY_USD"
          />
        </ChartPanel>

        <ChartPanel
          coverage="Ranked only within the supplied Top Customers report; it is not a complete customer population."
          subtitle="Top five customers ranked by reported order count, independent of their sales rank."
          title="Most frequent customers"
          unit="orders"
        >
          <RankedBars
            accent="#4f7770"
            points={topByOrders.map((row, index) => ({
              label: row.customer,
              value: row.order_count,
              color: RANK_COLOURS[index] ?? "#7892a8",
              caption: `${formatExact(row.sales, "CURRENCY_USD")} sales · avg ${formatExact(row.average_ticket ?? "0", "CURRENCY_USD")}`,
            }))}
            unit="COUNT"
          />
        </ChartPanel>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartPanel
            coverage="Counts every order with a laundry line, across the full year."
            subtitle="Recorded drop-off orders grouped by ticket value."
            title="Drop-off ticket size"
            unit="orders"
          >
            <ColumnChart
              accent="#355f86"
              points={c.ticket_bands.map((row) => ({
                label: row.band,
                value: row.order_count,
              }))}
              unit="COUNT"
            />
          </ChartPanel>
          <ChartPanel
            coverage="Only orders carrying a line measured in pounds are counted."
            subtitle="Recorded drop-off orders grouped by laundry weight."
            title="Pounds per drop-off order"
            unit="orders"
          >
            <ColumnChart
              accent="#4f7770"
              points={c.pound_bands.map((row) => ({
                label: row.band,
                value: row.order_count,
              }))}
              unit="COUNT"
            />
          </ChartPanel>
        </div>

        <ChartPanel
          className="chart-panel-wide"
          coverage="Void amounts are attributed only where the customer name matches exactly. Names are never merged approximately."
          subtitle="Recorded sales and exact-name-matched void value for the complete supplied top-ten ranking. Orders and average ticket remain available in each bar tooltip."
          title="Ranked-customer sales and matched voids"
          unit="US dollars"
        >
          <GroupedColumnChart
            comparisonColor="#c2410c"
            comparisonLabel="Matched void value"
            points={c.top.map((row) => ({
              label: row.customer,
              primary: Number(row.sales),
              comparison: Number(row.voided ?? 0),
            }))}
            primaryColor="#355f86"
            primaryLabel="Recorded sales"
            unit="CURRENCY_USD"
          />
          <div className="mt-3 grid gap-1 text-[10px] text-muted sm:grid-cols-2 xl:grid-cols-5">
            {c.top.map((row) => (
              <p
                className="truncate"
                key={row.customer}
                title={`${row.customer}: ${row.order_count} orders, average ${formatExact(row.average_ticket ?? "0", "CURRENCY_USD")}`}
              >
                <strong className="text-ink">{row.customer}</strong>: {row.order_count} orders ·{" "}
                {formatExact(row.average_ticket ?? "0", "CURRENCY_USD")} avg
              </p>
            ))}
          </div>
        </ChartPanel>

        <div className="flex flex-col gap-2 rounded-xl border border-[#c7d5df] bg-[#eef4f7] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[10px] leading-4 text-[#355f86]">
            Customer names come from the top-ten report and supplied order exports. The sales
            workbook has no customer field.
          </p>
          <button
            aria-expanded={showDirectory}
            className="min-h-9 shrink-0 rounded-lg border border-[#afc2d0] bg-white px-3 text-[10px] font-bold text-[#355f86] outline-none hover:border-[#7892a8] focus-visible:ring-2 focus-visible:ring-brand"
            onClick={() => setShowDirectory((current) => !current)}
            type="button"
          >
            {showDirectory ? "Hide customer directory" : "View customer directory"}
          </button>
        </div>

        {showDirectory ? <CustomerDirectory directory={c.directory} /> : null}
      </div>
    </div>
  );
}
