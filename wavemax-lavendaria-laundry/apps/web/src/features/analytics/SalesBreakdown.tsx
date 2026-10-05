import { useEffect, useState } from "react";

import type { AnalyticsGateway, OverviewResult, SalesGroup } from "./analytics-gateway";

function money(value: string): string {
  const numeric = Number(value);
  return Number.isFinite(numeric)
    ? numeric.toLocaleString("en-US", { style: "currency", currency: "USD" })
    : value;
}

function GroupTable({ title, groups }: { title: string; groups: SalesGroup[] }) {
  const peak = Math.max(...groups.map((g) => Math.abs(Number(g.subtotal)) || 0), 0);
  return (
    <div className="min-w-0">
      <h4 className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">{title}</h4>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse text-[11px]">
          <thead>
            <tr className="border-b border-line text-left text-muted">
              <th className="pb-2 font-semibold">Name</th>
              <th className="pb-2 text-right font-semibold">Subtotal</th>
              <th className="pb-2 text-right font-semibold">Lines</th>
              <th className="pb-2 text-right font-semibold">Orders</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => {
              const numeric = Number(group.subtotal);
              const width = peak > 0 ? (Math.abs(numeric) / peak) * 100 : 0;
              return (
                <tr className="border-b border-line/60 last:border-b-0" key={group.name}>
                  <td className="py-2 pr-3">
                    <span className="block font-semibold text-ink">{group.name}</span>
                    <span className="mt-1 block h-1.5 max-w-[220px] overflow-hidden rounded-full bg-[#eef0f4]">
                      <span
                        className={`block h-full rounded-full ${numeric < 0 ? "bg-[#c2410c]/60" : "bg-brand/60"}`}
                        style={{ width: `${width}%` }}
                      />
                    </span>
                  </td>
                  <td className="py-2 text-right font-semibold tabular-nums text-ink">
                    {money(group.subtotal)}
                  </td>
                  <td className="py-2 text-right tabular-nums text-muted">
                    {group.line_count.toLocaleString("en-US")}
                  </td>
                  <td className="py-2 text-right tabular-nums text-muted">
                    {group.order_count.toLocaleString("en-US")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SalesBreakdown({ gateway }: { gateway: AnalyticsGateway }) {
  const [result, setResult] = useState<OverviewResult | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    gateway
      .getOverview(controller.signal)
      .then(setResult)
      .catch(() => setResult(null));
    return () => controller.abort();
  }, [gateway]);

  if (!result || result.state === "unavailable") return null;

  const sales = result.wdf_sales;
  const coverage = sales.coverage;

  return (
    <section className="mt-6 rounded-2xl border border-line bg-white p-5 sm:p-7">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-brand">WDF POS</p>
          <h3 className="mt-1.5 text-[clamp(18px,2vw,24px)] font-semibold tracking-[-0.03em] text-ink">
            {sales.definition.label}
          </h3>
        </div>
        <strong className="text-[clamp(22px,2.6vw,30px)] font-semibold tracking-[-0.04em] text-ink">
          {money(sales.total)}
        </strong>
      </div>

      <div className="mt-4 rounded-xl border border-[#e6d6aa] bg-amber-soft px-4 py-3">
        <strong className="block text-[11px] font-bold text-[#77591d]">
          This is not total revenue
        </strong>
        <p className="mt-1.5 text-[11px] leading-[1.6] text-[#77591d]">{coverage.explanation}</p>
        <ul className="mt-2.5 grid gap-1 text-[11px] text-[#77591d]">
          <li>
            Commercial orders processed but absent from this source:{" "}
            <strong>{money(coverage.absent_commercial_value)}</strong> across{" "}
            {coverage.absent_commercial_orders} orders.
          </li>
          <li>
            Voided orders, gross: <strong>{money(coverage.voided_value_gross)}</strong>.
          </li>
        </ul>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Line items", sales.line_count],
          ["Orders", sales.order_count],
          ["Negative lines", sales.negative_lines],
          ["Zero lines", sales.zero_lines],
        ].map(([label, value]) => (
          <div className="rounded-xl border border-line bg-canvas px-3 py-2.5" key={String(label)}>
            <span className="block text-[9px] font-bold uppercase tracking-[0.08em] text-muted">
              {label}
            </span>
            <strong className="mt-0.5 block text-base font-semibold tabular-nums text-ink">
              {Number(value).toLocaleString("en-US")}
            </strong>
          </div>
        ))}
      </div>

      <div className="mt-6 grid min-w-0 gap-6 lg:grid-cols-2">
        <GroupTable title="By category" groups={sales.by_category} />
        <GroupTable title="By department" groups={sales.by_department.slice(0, 10)} />
      </div>
      <p className="mt-4 text-[10px] leading-[1.6] text-muted">
        Negative lines are refunds and discounts and are retained, not removed. Every one of the{" "}
        {sales.line_count.toLocaleString("en-US")} supplied rows is counted.
      </p>
    </section>
  );
}
