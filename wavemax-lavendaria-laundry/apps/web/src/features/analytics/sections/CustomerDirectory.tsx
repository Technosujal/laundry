import { useState } from "react";

import { ChartPanel, formatExact } from "../../../components/charts/primitives";
import type { CustomerRecord } from "../analytics-gateway";

function money(value: string | null): string {
  return value === null ? "Not supplied" : formatExact(value, "CURRENCY_USD");
}

function when(value: string | null): string {
  return value?.trim() || "Not supplied";
}

/**
 * The customers the supplied WDF exports name, and everything those exports say about one.
 *
 * Three narrow sources carry a customer name: the Top Customers Report ranks ten, the Order List
 * displays thirty of 4,319 orders, and the Void Report lists thirty corrections. The sales
 * workbook itself has no customer column, so a customer's full order history does not exist in
 * this data and none is implied. Each record states which sources it was built from, so a reader
 * can see why one customer shows orders and another only a yearly total.
 */
export function CustomerDirectory({ directory }: { directory: CustomerRecord[] }) {
  const [selectedName, setSelectedName] = useState<string | null>(directory[0]?.customer ?? null);
  const selected = directory.find((person) => person.customer === selectedName) ?? directory[0];

  if (directory.length === 0) {
    return (
      <ChartPanel subtitle="No supplied export names a customer." title="Customer directory">
        <p className="text-[11px] leading-[1.6] text-muted">
          None of the WDF exports in this build carries a customer name.
        </p>
      </ChartPanel>
    );
  }

  return (
    <ChartPanel
      coverage="The sales workbook records no customer against an order, so a customer's complete order history cannot be assembled from this data. Names are matched exactly and never merged."
      subtitle="Every customer the supplied exports name. Choose one to see what those exports record about them."
      title="Customer directory"
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
        <ul className="grid max-h-[420px] gap-1.5 overflow-y-auto pr-1" role="list">
          {directory.map((person) => {
            const active = person.customer === selected?.customer;
            return (
              <li key={person.customer}>
                <button
                  aria-current={active ? "true" : undefined}
                  className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-brand ${
                    active
                      ? "border-brand/35 bg-brand-soft"
                      : "border-line bg-canvas hover:border-[#d6d7dc]"
                  }`}
                  onClick={() => setSelectedName(person.customer)}
                  type="button"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[11px] font-semibold text-ink">
                      {person.customer}
                    </span>
                    <span className="mt-0.5 block text-[9px] text-muted">
                      {person.rank === null
                        ? person.sources.join(" · ")
                        : `Rank ${person.rank} by yearly sales`}
                    </span>
                  </span>
                  {person.reported_sales === null ? null : (
                    <span className="shrink-0 text-[11px] font-semibold tabular-nums text-ink">
                      {formatExact(person.reported_sales, "CURRENCY_USD")}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        {selected ? (
          <div className="min-w-0 rounded-2xl border border-line bg-canvas/60 p-4">
            <h4 className="text-[14px] font-semibold tracking-[-0.02em] text-ink">
              {selected.customer}
            </h4>
            <p className="mt-1 text-[10px] text-muted">Built from {selected.sources.join(", ")}.</p>

            <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                [
                  "Reported orders",
                  selected.reported_orders?.toLocaleString("en-US") ?? "Not supplied",
                ],
                ["Reported sales", money(selected.reported_sales)],
                ["Average ticket", money(selected.average_ticket)],
                ["Voided", selected.voids.length ? String(selected.voids.length) : "None"],
              ].map(([label, value]) => (
                <div className="min-w-0" key={label}>
                  <dt className="text-[9px] font-bold uppercase tracking-[0.08em] text-muted">
                    {label}
                  </dt>
                  <dd className="mt-1 truncate text-[13px] font-semibold tabular-nums text-ink">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>

            {selected.reported_orders !== null && selected.orders.length > 0 ? (
              <p className="mt-3 rounded-lg bg-white px-3 py-2 text-[10px] leading-[1.6] text-muted">
                {selected.orders.length} of this customer&apos;s {selected.reported_orders} orders
                appear in the Order List export. The rest are counted in their yearly total but are
                not listed individually anywhere in the supplied data.
              </p>
            ) : null}

            {selected.orders.length > 0 ? (
              <div className="mt-4">
                <h5 className="text-[9px] font-bold uppercase tracking-[0.08em] text-muted">
                  Orders recorded individually
                </h5>
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full min-w-[420px] border-collapse text-[11px]">
                    <caption className="sr-only">Orders listed for {selected.customer}</caption>
                    <thead>
                      <tr className="border-b border-line text-left text-muted">
                        <th className="pb-1.5 text-[9px] font-semibold">Order</th>
                        <th className="pb-1.5 text-[9px] font-semibold">Created</th>
                        <th className="pb-1.5 text-[9px] font-semibold">Stage</th>
                        <th className="pb-1.5 text-[9px] font-semibold">Paid by</th>
                        <th className="pb-1.5 text-right text-[9px] font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.orders.map((order) => (
                        <tr
                          className="border-b border-line/60 last:border-b-0"
                          key={order.order_number}
                        >
                          <td className="py-1.5 pr-2">
                            <a
                              className="font-semibold text-brand no-underline hover:underline"
                              href={`#orders/paid-${order.order_number}`}
                            >
                              # {order.order_number}
                            </a>
                          </td>
                          <td className="py-1.5 pr-2 text-muted">{when(order.created)}</td>
                          <td className="py-1.5 pr-2 text-ink">
                            {order.order_status === "N/A" ? "Not supplied" : order.order_status}
                          </td>
                          <td className="py-1.5 pr-2 text-muted">{order.payment_method || "—"}</td>
                          <td className="py-1.5 text-right font-mono tabular-nums text-ink">
                            {formatExact(order.total, "CURRENCY_USD")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {selected.voids.length > 0 ? (
              <div className="mt-4">
                <h5 className="text-[9px] font-bold uppercase tracking-[0.08em] text-muted">
                  Voided orders
                </h5>
                <ul className="mt-2 grid gap-1.5">
                  {selected.voids.map((entry) => (
                    <li
                      className="flex items-center justify-between gap-3 rounded-lg border border-[#e6d6aa] bg-amber-soft px-3 py-2 text-[10px] text-[#77591d]"
                      key={`${entry.order_number}-${entry.when ?? ""}`}
                    >
                      <span className="min-w-0 truncate">
                        # {entry.order_number} · reason as typed: &ldquo;{entry.reason}&rdquo;
                      </span>
                      <span className="shrink-0 font-mono tabular-nums">
                        {formatExact(entry.amount, "CURRENCY_USD")}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-[10px] text-muted">
                  A void is a correction. It is not evidence of wrongdoing by the customer or the
                  employee who recorded it.
                </p>
              </div>
            ) : null}

            {selected.machine_starts.length > 0 ? (
              <div className="mt-4">
                <h5 className="text-[9px] font-bold uppercase tracking-[0.08em] text-muted">
                  Machine starts bought on their behalf
                </h5>
                <ul className="mt-2 grid gap-1.5">
                  {selected.machine_starts.map((start) => (
                    <li
                      className="flex items-center justify-between gap-3 rounded-lg border border-line bg-white px-3 py-2 text-[10px] text-ink"
                      key={`${start.order_number}-${start.machine_starts}`}
                    >
                      <span className="min-w-0 truncate text-muted"># {start.order_number}</span>
                      <span className="shrink-0 font-mono tabular-nums">
                        {formatExact(start.machine_starts, "CURRENCY_USD")} of{" "}
                        {formatExact(start.order_total, "CURRENCY_USD")}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {selected.orders.length === 0 &&
            selected.voids.length === 0 &&
            selected.machine_starts.length === 0 ? (
              <p className="mt-4 rounded-lg border border-line bg-white px-3 py-2 text-[10px] leading-[1.6] text-muted">
                {selected.reported_orders === null
                  ? `This customer is named only in ${selected.sources.join(" and ")}, with no figures attached. Nothing further about them exists in the supplied data.`
                  : "Only this customer's yearly total is recorded. No supplied export lists their individual orders, so there is nothing further to open."}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </ChartPanel>
  );
}
