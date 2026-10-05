import { useState } from "react";

import {
  ChartPanel,
  DataViewToggle,
  MixBar,
  RankedBars,
  formatExact,
} from "../../../components/charts/primitives";
import { KpiCard } from "../../../components/charts/KpiCard";
import type { WdfSales } from "../analytics-gateway";
import type { SalesFilterState } from "../sales-filter";

export function ProductsSection({ sales, filter }: { sales: WdfSales; filter: SalesFilterState }) {
  const [detailView, setDetailView] = useState<"visual" | "table">("visual");
  const [showAllFees, setShowAllFees] = useState(false);
  const a = sales.analytics;
  const pd = sales.product_detail;
  const topItem = a.top_items_by_value[0];
  const topShare = Number(a.totals.net_sales)
    ? (Number(topItem?.subtotal ?? 0) / Number(a.totals.net_sales)) * 100
    : 0;
  const averageLine = a.totals.line_count ? Number(a.totals.net_sales) / a.totals.line_count : 0;

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <KpiCard
          label="Net sales in view"
          value={a.totals.net_sales}
          unit="CURRENCY_USD"
          context="Across the selected products and services"
        />
        <KpiCard
          label="Order lines"
          value={a.totals.line_count}
          unit="COUNT"
          context="Each recorded item or service line"
          accent="#355f86"
        />
        <KpiCard
          label="Orders"
          value={a.totals.order_count}
          unit="COUNT"
          context="Distinct tickets containing those lines"
          accent="#355f86"
        />
        <KpiCard
          label="Laundry weight"
          value={a.totals.pounds}
          unit="POUNDS"
          context="Only weight-based service lines"
          accent="#355f86"
        />
        <KpiCard
          label="Top item share"
          value={topShare}
          unit="SHARE"
          context={topItem?.name ?? "No item recorded"}
          accent="#355f86"
        />
        <KpiCard
          label="Average per line"
          value={averageLine}
          unit="CURRENCY_USD"
          context="Net sales ÷ recorded lines"
          accent="#355f86"
        />
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-12">
        <ChartPanel
          className="xl:col-span-7"
          coverage="The default view shows the five highest-value items. Revenue, orders and line volume stay together; the complete ledger remains in Supporting product records."
          subtitle="The services and products that earned the most across the selected period."
          title="Product performance"
          unit="US dollars"
        >
          <RankedBars
            onSelect={(point) => filter.toggle("item", point)}
            points={filter
              .analyticsExcept("item")
              .top_items_by_value.slice(0, 5)
              .map((row) => {
                const volume = filter
                  .analyticsExcept("item")
                  .top_items_by_volume.find((candidate) => candidate.name === row.name);
                return {
                  label: row.name!,
                  value: Number(row.subtotal),
                  caption: `${row.order_count.toLocaleString("en-US")} orders · ${(volume?.line_count ?? row.line_count).toLocaleString("en-US")} lines`,
                };
              })}
            selectedValue={filter.valueOn("item")}
            unit="CURRENCY_USD"
          />
        </ChartPanel>
        <ChartPanel
          className="xl:col-span-5"
          coverage="Only lines the source records in pounds are counted here."
          subtitle="Services sold by weight, ranked by pounds processed."
          title="Per-pound services"
          unit="pounds"
        >
          <RankedBars
            accent="#355f86"
            onSelect={(point) => filter.toggle("item", point)}
            points={filter.analyticsExcept("item").per_pound_services.map((row) => ({
              label: row.name!,
              value: Number(row.pounds),
              caption: `${formatExact(row.subtotal, "CURRENCY_USD")} · ${row.line_count.toLocaleString("en-US")} lines`,
            }))}
            selectedValue={filter.valueOn("item")}
            unit="POUNDS"
          />
        </ChartPanel>
      </div>

      <div className="flex flex-col gap-1 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-ink">Product record detail</h3>
          <p className="mt-1 text-xs leading-5 text-muted">
            {filter.isFiltered
              ? "The filters above apply to rankings and headline figures. Price, tax and basket tables remain full-period because those source fields are not present in the filter fact table."
              : "Price, tax and basket tables use the complete source period."}
          </p>
        </div>
        <div className="mt-2 flex items-center gap-2 sm:mt-0">
          <span className="w-fit rounded-full border border-line bg-white px-3 py-1.5 text-[11px] font-bold text-muted">
            Full-period source detail
          </span>
          <DataViewToggle
            label="Product detail display"
            onChange={setDetailView}
            value={detailView}
          />
        </div>
      </div>

      <div className="grid items-stretch gap-4 xl:grid-cols-12">
        <ChartPanel
          className="xl:col-span-4"
          subtitle="Wash-dry-fold turnaround mix and effective rate."
          title="Same day vs next day"
        >
          {detailView === "visual" ? (
            <div className="grid gap-4">
              <MixBar
                segments={pd.turnaround.map((row, index) => ({
                  label: row.name,
                  value: row.order_count,
                  color: index === 0 ? "#355f86" : "#9a7b60",
                }))}
                unit="COUNT"
              />
              <dl className="grid grid-cols-2 gap-2">
                {pd.turnaround.map((row) => (
                  <div className="rounded-lg bg-canvas px-3 py-2" key={row.name}>
                    <dt className="text-[9px] font-bold uppercase tracking-[0.06em] text-muted">
                      {row.name}
                    </dt>
                    <dd className="mt-1 text-[11px] font-semibold tabular-nums text-ink">
                      {formatExact(row.net, "CURRENCY_USD")}
                    </dd>
                    <dd className="mt-0.5 text-[9px] text-muted">
                      {Number(row.pounds).toLocaleString("en-US", { maximumFractionDigits: 0 })} lb
                      {row.rate_per_pound
                        ? ` · ${formatExact(row.rate_per_pound, "CURRENCY_USD")}/lb`
                        : ""}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : (
            <table className="w-full border-collapse text-[11px]">
              <caption className="sr-only">Turnaround comparison</caption>
              <thead>
                <tr className="border-b border-line text-left text-muted">
                  <th className="pb-2 font-semibold" scope="col">
                    Measure
                  </th>
                  {pd.turnaround.map((row) => (
                    <th className="pb-2 text-right font-semibold" key={row.name} scope="col">
                      {row.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(
                  [
                    [
                      "Orders",
                      (r: (typeof pd.turnaround)[number]) => r.order_count.toLocaleString("en-US"),
                    ],
                    [
                      "Pounds",
                      (r: (typeof pd.turnaround)[number]) =>
                        Number(r.pounds).toLocaleString("en-US", { maximumFractionDigits: 0 }),
                    ],
                    [
                      "Net",
                      (r: (typeof pd.turnaround)[number]) => formatExact(r.net, "CURRENCY_USD"),
                    ],
                    [
                      "Rate per lb",
                      (r: (typeof pd.turnaround)[number]) =>
                        r.rate_per_pound ? formatExact(r.rate_per_pound, "CURRENCY_USD") : "—",
                    ],
                  ] as const
                ).map(([label, render]) => (
                  <tr className="border-b border-line/60 last:border-b-0" key={label}>
                    <td className="py-2 text-muted">{label}</td>
                    {pd.turnaround.map((row) => (
                      <td
                        className="py-2 text-right font-semibold tabular-nums text-ink"
                        key={row.name}
                      >
                        {render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </ChartPanel>

        <ChartPanel
          className="xl:col-span-4"
          subtitle="Piece-priced bedding items, ranked by net sales."
          title="Bedding"
        >
          {detailView === "visual" ? (
            <RankedBars
              accent="#55766f"
              points={pd.bedding.map((row) => ({
                label: row.name,
                value: Number(row.net),
                caption: `${Number(row.quantity).toLocaleString("en-US")} sold · ${row.each ? `${formatExact(row.each, "CURRENCY_USD")} each` : "unit price unavailable"}`,
              }))}
              unit="CURRENCY_USD"
            />
          ) : (
            <table className="w-full border-collapse text-[11px]">
              <caption className="sr-only">Bedding items</caption>
              <thead>
                <tr className="border-b border-line text-left text-muted">
                  <th className="pb-2 font-semibold" scope="col">
                    Item
                  </th>
                  <th className="pb-2 text-right font-semibold" scope="col">
                    Qty
                  </th>
                  <th className="pb-2 text-right font-semibold" scope="col">
                    Net
                  </th>
                  <th className="pb-2 text-right font-semibold" scope="col">
                    Each
                  </th>
                </tr>
              </thead>
              <tbody>
                {pd.bedding.map((row) => (
                  <tr className="border-b border-line/60 last:border-b-0" key={row.name}>
                    <td className="py-2 text-ink">{row.name}</td>
                    <td className="py-2 text-right tabular-nums text-muted">
                      {Number(row.quantity).toLocaleString("en-US")}
                    </td>
                    <td className="py-2 text-right font-semibold tabular-nums text-ink">
                      {formatExact(row.net, "CURRENCY_USD")}
                    </td>
                    <td className="py-2 text-right tabular-nums text-muted">
                      {row.each ? formatExact(row.each, "CURRENCY_USD") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </ChartPanel>

        <ChartPanel
          className="xl:col-span-4"
          coverage="Negative values are discounts and refunds, retained inside the sales total."
          subtitle="Non-product lines on customer orders."
          title="Fees, discounts and refunds"
        >
          {detailView === "visual" ? (
            <div className="grid gap-3">
              <RankedBars
                accent="#6d7480"
                points={pd.fees.slice(0, showAllFees ? undefined : 5).map((row) => ({
                  label: row.name,
                  value: Number(row.net),
                  caption: `${row.count.toLocaleString("en-US")} recorded lines`,
                }))}
                unit="CURRENCY_USD"
              />
              {pd.fees.length > 5 ? (
                <button
                  aria-expanded={showAllFees}
                  className="justify-self-start rounded-lg border border-line bg-white px-3 py-1.5 text-[10px] font-bold text-ink outline-none hover:border-[#9babb8] focus-visible:ring-2 focus-visible:ring-brand"
                  onClick={() => setShowAllFees((current) => !current)}
                  type="button"
                >
                  {showAllFees ? "Show top five" : `View all ${pd.fees.length} lines`}
                </button>
              ) : null}
            </div>
          ) : (
            <table className="w-full border-collapse text-[11px]">
              <caption className="sr-only">Fee and discount lines</caption>
              <thead>
                <tr className="border-b border-line text-left text-muted">
                  <th className="pb-2 font-semibold" scope="col">
                    Line
                  </th>
                  <th className="pb-2 text-right font-semibold" scope="col">
                    Count
                  </th>
                  <th className="pb-2 text-right font-semibold" scope="col">
                    Net
                  </th>
                </tr>
              </thead>
              <tbody>
                {pd.fees.map((row) => (
                  <tr className="border-b border-line/60 last:border-b-0" key={row.name}>
                    <td className="py-2 text-ink">{row.name}</td>
                    <td className="py-2 text-right tabular-nums text-muted">{row.count}</td>
                    <td
                      className={`py-2 text-right font-semibold tabular-nums ${Number(row.net) < 0 ? "text-[#c2410c]" : "text-ink"}`}
                    >
                      {formatExact(row.net, "CURRENCY_USD")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </ChartPanel>
      </div>

      <details className="group rounded-xl border border-line bg-white p-4 shadow-[0_5px_18px_rgba(17,19,24,0.035)]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-ink">
          Supporting product records
          <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-muted group-open:hidden">
            Open detail
          </span>
          <span className="hidden text-[10px] font-bold uppercase tracking-[0.06em] text-muted group-open:inline">
            Close detail
          </span>
        </summary>
        <p className="mt-1 text-[11px] text-muted">
          Price checks, basket pairs, tax treatment, category totals and the complete item ledger.
        </p>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <ChartPanel
            coverage="A single item sold at more than one unit price is not necessarily an error, but it is worth knowing about."
            subtitle="Items recorded at more than one unit price during the year."
            title="Price consistency"
          >
            {pd.price_consistency.length === 0 ? (
              <p className="text-[11px] text-muted">Every item held a single unit price.</p>
            ) : (
              <table className="w-full border-collapse text-[11px]">
                <caption className="sr-only">Items sold at more than one price</caption>
                <thead>
                  <tr className="border-b border-line text-left text-muted">
                    <th className="pb-2 font-semibold" scope="col">
                      Item
                    </th>
                    <th className="pb-2 text-right font-semibold" scope="col">
                      Lowest
                    </th>
                    <th className="pb-2 text-right font-semibold" scope="col">
                      Highest
                    </th>
                    <th className="pb-2 text-right font-semibold" scope="col">
                      Prices
                    </th>
                    <th className="pb-2 text-right font-semibold" scope="col">
                      Lines
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pd.price_consistency.map((row) => (
                    <tr className="border-b border-line/60 last:border-b-0" key={row.name}>
                      <td className="py-2 text-ink">{row.name}</td>
                      <td className="py-2 text-right tabular-nums text-muted">
                        {formatExact(row.lowest, "CURRENCY_USD")}
                      </td>
                      <td className="py-2 text-right tabular-nums text-muted">
                        {formatExact(row.highest, "CURRENCY_USD")}
                      </td>
                      <td className="py-2 text-right tabular-nums text-[#77591d]">
                        {row.distinct_prices}
                      </td>
                      <td className="py-2 text-right tabular-nums text-muted">{row.lines}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </ChartPanel>

          <ChartPanel
            coverage="Pairs are counted from retail lines appearing on the same ticket. Pairs seen only once are not listed."
            subtitle="Retail items most often bought on the same ticket."
            title="Bought together"
          >
            <div className="max-h-[320px] min-w-0 overflow-auto">
              <table className="w-full min-w-[420px] border-collapse text-[11px]">
                <caption className="sr-only">Items bought together</caption>
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-line text-left text-muted">
                    <th className="pb-2 font-semibold" scope="col">
                      Item A
                    </th>
                    <th className="pb-2 font-semibold" scope="col">
                      Item B
                    </th>
                    <th className="pb-2 text-right font-semibold" scope="col">
                      Tickets
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sales.basket.map((row) => (
                    <tr
                      className="border-b border-line/60 last:border-b-0"
                      key={`${row.item_a}-${row.item_b}`}
                    >
                      <td className="py-2 text-ink">{row.item_a}</td>
                      <td className="py-2 text-ink">{row.item_b}</td>
                      <td className="py-2 text-right font-semibold tabular-nums text-ink">
                        {row.tickets}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartPanel>
        </div>

        <ChartPanel
          coverage="Drinks and service charges carry no tax in this export."
          subtitle="Lines recorded with no tax applied."
          title="Non-taxable lines"
        >
          <RankedBars
            accent="#355f86"
            points={pd.non_taxable.map((row) => ({
              label: row.name,
              value: Number(row.net),
              caption: `${row.lines.toLocaleString("en-US")} lines`,
            }))}
            unit="CURRENCY_USD"
          />
        </ChartPanel>

        <ChartPanel
          subtitle="Every recorded category, with its share of counter sales."
          title="Category contribution"
          unit="US dollars"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[460px] border-collapse text-[11px]">
              <caption className="sr-only">Counter sales by category</caption>
              <thead>
                <tr className="border-b border-line text-left text-muted">
                  <th className="pb-2 font-semibold" scope="col">
                    Category
                  </th>
                  <th className="pb-2 text-right font-semibold" scope="col">
                    Sales
                  </th>
                  <th className="pb-2 text-right font-semibold" scope="col">
                    Orders
                  </th>
                  <th className="pb-2 text-right font-semibold" scope="col">
                    Lines
                  </th>
                  <th className="pb-2 text-right font-semibold" scope="col">
                    Avg ticket
                  </th>
                </tr>
              </thead>
              <tbody>
                {filter.analyticsExcept("category").by_category.map((row) => (
                  <tr
                    className={`border-b border-line/60 transition hover:bg-brand-soft/50 last:border-b-0 ${filter.valueOn("category") === row.name ? "bg-brand-soft" : ""}`}
                    key={row.name}
                  >
                    <td className="py-2 font-medium text-ink">
                      <button
                        aria-pressed={filter.valueOn("category") === row.name}
                        className="rounded-md text-left font-medium text-ink outline-none hover:text-brand focus-visible:ring-2 focus-visible:ring-brand"
                        onClick={() =>
                          filter.toggle("category", {
                            label: row.name!,
                            value: Number(row.subtotal),
                          })
                        }
                        type="button"
                      >
                        {row.name}
                      </button>
                    </td>
                    <td className="py-2 text-right font-semibold tabular-nums text-ink">
                      {formatExact(row.subtotal, "CURRENCY_USD")}
                    </td>
                    <td className="py-2 text-right tabular-nums text-muted">
                      {row.order_count.toLocaleString("en-US")}
                    </td>
                    <td className="py-2 text-right tabular-nums text-muted">
                      {row.line_count.toLocaleString("en-US")}
                    </td>
                    <td className="py-2 text-right tabular-nums text-muted">
                      {row.average_ticket ? formatExact(row.average_ticket, "CURRENCY_USD") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartPanel>

        <ChartPanel
          coverage="This is the exact-record table behind every ranking above. Sorted by net sales."
          subtitle={`All ${sales.every_item.length} line items sold during the year.`}
          title="Every item"
        >
          <div className="max-h-[520px] min-w-0 overflow-auto">
            <table className="w-full min-w-[720px] border-collapse text-[11px]">
              <caption className="sr-only">Every item sold</caption>
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-line text-left text-muted">
                  <th className="pb-2 font-semibold" scope="col">
                    Item
                  </th>
                  <th className="pb-2 font-semibold" scope="col">
                    Department
                  </th>
                  <th className="pb-2 text-right font-semibold" scope="col">
                    Qty
                  </th>
                  <th className="pb-2 text-right font-semibold" scope="col">
                    Net
                  </th>
                  <th className="pb-2 text-right font-semibold" scope="col">
                    Share
                  </th>
                  <th className="pb-2 text-right font-semibold" scope="col">
                    Lines
                  </th>
                  <th className="pb-2 text-right font-semibold" scope="col">
                    Avg price
                  </th>
                  <th className="pb-2 text-right font-semibold" scope="col">
                    Tax
                  </th>
                </tr>
              </thead>
              <tbody>
                {sales.every_item.map((row) => (
                  <tr className="border-b border-line/60 last:border-b-0" key={row.name}>
                    <td className="py-2 pr-3 font-medium text-ink">{row.name}</td>
                    <td className="py-2 pr-3 text-muted">{row.department}</td>
                    <td className="py-2 text-right tabular-nums text-muted">
                      {Number(row.quantity).toLocaleString("en-US", { maximumFractionDigits: 1 })}
                      {row.units ? ` ${row.units}` : ""}
                    </td>
                    <td className="py-2 text-right font-semibold tabular-nums text-ink">
                      {formatExact(row.net, "CURRENCY_USD")}
                    </td>
                    <td className="py-2 text-right tabular-nums text-muted">{row.share}%</td>
                    <td className="py-2 text-right tabular-nums text-muted">{row.lines}</td>
                    <td className="py-2 text-right tabular-nums text-muted">
                      {row.average_price ? formatExact(row.average_price, "CURRENCY_USD") : "—"}
                    </td>
                    <td className="py-2 text-right tabular-nums text-muted">
                      {formatExact(row.tax, "CURRENCY_USD")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartPanel>
      </details>
    </div>
  );
}
