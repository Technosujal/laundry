import { ChartPanel, ColumnChart, MixBar, RankedBars } from "../../../components/charts/primitives";
import { KpiCard } from "../../../components/charts/KpiCard";
import type { WdfSales } from "../analytics-gateway";
import type { SalesFilterState } from "../sales-filter";

const HOURS = (hour: number) =>
  hour === 0 ? "12am" : hour < 12 ? `${hour}am` : hour === 12 ? "12pm" : `${hour - 12}pm`;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function SalesSection({ filter, sales }: { filter: SalesFilterState; sales: WdfSales }) {
  const a = sales.analytics;
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Net sales"
          value={a.totals.net_sales}
          unit="CURRENCY_USD"
          context="After discounts and refunds"
        />
        <KpiCard
          label="Orders"
          value={a.totals.order_count}
          unit="COUNT"
          context="Distinct paid tickets"
          accent="#355f86"
        />
        <KpiCard
          label="Average ticket"
          value={a.totals.average_ticket ?? "0"}
          unit="CURRENCY_USD"
          context="Net sales ÷ distinct orders"
          accent="#355f86"
        />
        <KpiCard
          label="Laundry weight"
          value={a.totals.pounds}
          unit="POUNDS"
          context="Lines recorded by weight"
          accent="#355f86"
        />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-12">
        <ChartPanel
          className="lg:col-span-8"
          coverage="Each month is the exact sum of the paid line values in that calendar month."
          subtitle="Compare sales through the year. Select a month to filter every report visual."
          title="Monthly net sales"
          unit="US dollars"
        >
          <ColumnChart
            accent="#355f86"
            onSelect={(point) => filter.toggle("month", point)}
            points={filter.analyticsExcept("month").by_month.map((row) => ({
              label: MONTHS[Number(row.period!.slice(5)) - 1] ?? row.period!,
              filterValue: row.period!,
              value: Number(row.subtotal),
              caption: `${row.order_count.toLocaleString("en-US")} orders · ${Number(row.pounds).toLocaleString("en-US", { maximumFractionDigits: 0 })} lb`,
            }))}
            selectedValue={filter.valueOn("month")}
            unit="CURRENCY_USD"
          />
        </ChartPanel>

        <ChartPanel
          className="lg:col-span-4"
          subtitle="Counter sales split between laundry service and retail."
          title="Service mix"
          unit="US dollars"
        >
          <MixBar
            segments={a.by_service_type.map((row) => ({
              label: row.name!,
              value: Number(row.subtotal),
              color: row.name === "Laundry service" ? "#355f86" : "#967246",
            }))}
            unit="CURRENCY_USD"
          />
        </ChartPanel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartPanel
          coverage="Weekday totals sum exactly to annual counter sales."
          subtitle="Which days of the week earn most across the whole year."
          title="Sales by weekday"
          unit="US dollars"
        >
          <ColumnChart
            accent="#355f86"
            onSelect={(point) => filter.toggle("weekday", point)}
            points={filter.analyticsExcept("weekday").by_weekday.map((row) => ({
              label: row.weekday!.slice(0, 3),
              filterValue: row.weekday!,
              value: Number(row.subtotal),
              caption: `${row.order_count.toLocaleString("en-US")} orders · avg ticket ${Number(row.average_ticket ?? 0).toLocaleString("en-US", { style: "currency", currency: "USD" })}`,
            }))}
            selectedValue={filter.valueOn("weekday")}
            unit="CURRENCY_USD"
          />
        </ChartPanel>

        <ChartPanel
          coverage="Hours with no recorded sales are absent rather than shown as zero."
          subtitle="Trading pattern across the day, summed over the year."
          title="Sales by hour of day"
          unit="US dollars"
        >
          <ColumnChart
            accent="#355f86"
            labelEvery={2}
            onSelect={(point) => filter.toggle("hour", point)}
            points={filter.analyticsExcept("hour").by_hour.map((row) => ({
              label: HOURS(row.hour!),
              filterValue: String(row.hour!),
              value: Number(row.subtotal),
              caption: `${row.order_count.toLocaleString("en-US")} orders`,
            }))}
            selectedValue={filter.valueOn("hour")}
            unit="CURRENCY_USD"
          />
        </ChartPanel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartPanel
          coverage="The five highest-value departments are shown here. Products retains the complete category and item records."
          subtitle="Top departments ranked by value, with orders and line volume retained as context."
          title="Top five departments by sales"
          unit="US dollars"
        >
          <RankedBars
            accent="#355f86"
            onSelect={(point) => filter.toggle("department", point)}
            points={filter
              .analyticsExcept("department")
              .by_department.filter((row) => Number(row.subtotal) > 0)
              .sort((first, second) => Number(second.subtotal) - Number(first.subtotal))
              .slice(0, 5)
              .map((row) => ({
                label: row.name!,
                value: Number(row.subtotal),
                caption: `${row.order_count.toLocaleString("en-US")} orders · ${row.line_count.toLocaleString("en-US")} lines`,
              }))}
            selectedValue={filter.valueOn("department")}
            unit="CURRENCY_USD"
          />
        </ChartPanel>

        <ChartPanel
          coverage="Pounds are counted only where the source records a line in pounds."
          subtitle="Weighed wash-dry-fold volume processed each month."
          title="Pounds processed by month"
          unit="pounds"
        >
          <ColumnChart
            accent="#55766f"
            height={180}
            onSelect={(point) => filter.toggle("month", point)}
            points={filter.analyticsExcept("month").by_month.map((row) => ({
              label: MONTHS[Number(row.period!.slice(5)) - 1] ?? row.period!,
              filterValue: row.period!,
              value: Number(row.pounds),
              caption: `${Number(row.subtotal).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })} sales`,
            }))}
            selectedValue={filter.valueOn("month")}
            unit="POUNDS"
          />
        </ChartPanel>
      </div>
    </div>
  );
}
