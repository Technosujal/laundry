import {
  ChartPanel,
  ColumnChart,
  MixBar,
  RankedBars,
  formatBusinessDate,
  formatExact,
} from "../../../components/charts/primitives";
import { KpiCard } from "../../../components/charts/KpiCard";
import type { WdfSales } from "../analytics-gateway";

export function CashSection({ sales }: { sales: WdfSales }) {
  const fs = sales.financial_summary;
  const totals = fs.totals;
  const payments = fs.payments;
  const v = sales.operations.voids;
  const voidComplete = sales.operations.coverage.voids?.complete === true;
  const voidCoverage =
    sales.operations.coverage.voids?.note ?? "Void detail comes from the report as supplied.";
  const voidYear =
    v.by_month[0]?.period.slice(0, 4) ?? sales.analytics.totals.first_day.slice(0, 4);

  const paymentSegments = Object.entries(payments)
    .filter(([, value]) => Number(value) > 0)
    .map(([label, value], index) => ({
      label,
      value: Number(value),
      color: ["#355f86", "#4f7770", "#6b5b73", "#967246", "#75806f"][index] ?? "#66717a",
    }));

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          accent="#4f7770"
          context="Net sales plus tax, tips and surcharges"
          coverage="COMPLETE"
          label="Grand total taken"
          unit="CURRENCY_USD"
          value={totals["Grand Total"] ?? "0"}
        />
        <KpiCard
          accent="#6b5b73"
          context="Credit card only; cash is reported separately"
          label="Card payments"
          unit="CURRENCY_USD"
          value={payments["Credit Card"] ?? "0"}
        />
        <KpiCard
          accent="#355f86"
          context="Tips recorded against card payments"
          label="Credit card tips"
          unit="CURRENCY_USD"
          value={totals["Credit Card Tips"] ?? "0"}
        />
        <KpiCard
          accent="#c2410c"
          context="Recorded as voided by the point of sale"
          label="Voided sales"
          unit="CURRENCY_USD"
          value={totals["Total Voided Sales"] ?? "0"}
        />
        <KpiCard
          accent="#B42318"
          context="Cash collected minus payouts"
          label="Cash sales less payouts"
          unit="CURRENCY_USD"
          value={fs.deposit["Expected Deposit"] ?? "0"}
        />
        <KpiCard
          accent={fs.payments_reconcile ? "#067647" : "#B42318"}
          context="Payment types minus reported grand total"
          label="Reconciliation gap"
          unit="CURRENCY_USD"
          value={fs.payment_gap}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartPanel
          coverage="Payment types are read directly from the workbook's own financial summary sheet."
          subtitle="How customers paid across the year."
          title="Payment mix"
          unit="US dollars"
        >
          <MixBar segments={paymentSegments} unit="CURRENCY_USD" />
        </ChartPanel>

        <ChartPanel
          coverage={fs.reconciliation_note}
          subtitle="The workbook's own financial summary, checked against itself."
          title="Cash reconciliation"
          unit="US dollars"
        >
          <dl className="grid gap-2">
            {[
              ["Net sales", totals["Net Sales"]],
              ["Tax", totals["Net Tax 1"]],
              ["Credit card tips", totals["Credit Card Tips"]],
              ["Grand total", totals["Grand Total"]],
              ["Payment types total", fs.payment_total],
              ["Reconciliation gap", fs.payment_gap],
              ["Total payouts", totals["Total Payouts"]],
            ]
              .filter(([, value]) => value !== undefined)
              .map(([label, value], index, list) => (
                <div
                  className={`flex items-center justify-between gap-3 rounded-lg px-3.5 py-2.5 ${
                    index === list.length - 2
                      ? "border border-line bg-canvas font-semibold"
                      : "bg-canvas/60"
                  }`}
                  key={label as string}
                >
                  <dt className="text-[11px] text-ink">{label}</dt>
                  <dd className="text-[11px] font-semibold tabular-nums text-ink">
                    {formatExact(value as string, "CURRENCY_USD")}
                  </dd>
                </div>
              ))}
          </dl>
          <div
            className={`mt-3 rounded-xl border px-4 py-3 ${
              fs.payments_reconcile
                ? "border-[#bfe3cd] bg-[#e8f7ee]"
                : "border-[#efc2bd] bg-[#fff1ef]"
            }`}
          >
            <strong
              className={`block text-[10px] font-bold ${fs.payments_reconcile ? "text-[#1c6238]" : "text-[#B42318]"}`}
            >
              {fs.payments_reconcile ? "Payment types reconcile" : "Payment types do not reconcile"}
            </strong>
            <p
              className={`mt-1.5 text-[10px] leading-[1.6] ${fs.payments_reconcile ? "text-[#1c6238]" : "text-[#B42318]"}`}
            >
              The workbook reports {formatExact(fs.payment_total, "CURRENCY_USD")} in payment types
              and {formatExact(totals["Grand Total"] ?? "0", "CURRENCY_USD")} as its grand total.
              The {formatExact(fs.payment_gap, "CURRENCY_USD")} gap remains visible.
            </p>
          </div>
        </ChartPanel>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <ChartPanel
          coverage={voidCoverage}
          subtitle="When voided value occurred across the year."
          title="Voided sales by month"
          unit="US dollars"
        >
          <ColumnChart
            accent="#c2410c"
            points={
              voidComplete
                ? Array.from({ length: 12 }, (_, index) => {
                    const period = `${voidYear}-${String(index + 1).padStart(2, "0")}`;
                    const row = v.by_month.find((entry) => entry.period === period);
                    return {
                      label: new Intl.DateTimeFormat("en-US", {
                        month: "short",
                        timeZone: "UTC",
                      }).format(new Date(`${period}-01T00:00:00Z`)),
                      value: Number(row?.amount ?? 0),
                    };
                  })
                : []
            }
            unit="CURRENCY_USD"
          />
        </ChartPanel>
        <ChartPanel
          coverage="Customer names come from the void report itself. No name is matched approximately."
          subtitle="Voided value recorded against each customer."
          title="Voids by customer"
          unit="US dollars"
        >
          <RankedBars
            accent="#c2410c"
            points={v.by_customer.slice(0, 5).map((row) => ({
              label: row.name,
              value: Number(row.amount),
            }))}
            unit="CURRENCY_USD"
          />
        </ChartPanel>

        <ChartPanel
          coverage="A void is a POS correction; it is not evidence of loss or wrongdoing. It does not indicate fault."
          subtitle="Which staff member recorded each void."
          title="Voids marked by employee"
          unit="US dollars"
        >
          <RankedBars
            accent="#355f86"
            points={v.by_employee.slice(0, 5).map((row) => ({
              label: row.name,
              value: Number(row.amount),
              caption: `${row.count} ${row.count === 1 ? "void" : "voids"}`,
            }))}
            unit="CURRENCY_USD"
          />
        </ChartPanel>
      </div>

      {voidComplete ? (
        <details className="group rounded-xl border border-line bg-white p-4 shadow-[0_5px_18px_rgba(17,19,24,0.035)]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-ink">
            Void log
            <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-muted group-open:hidden">
              Open records
            </span>
            <span className="hidden text-[10px] font-bold uppercase tracking-[0.06em] text-muted group-open:inline">
              Close records
            </span>
          </summary>
          <p className="mt-1 text-[11px] text-muted">{voidCoverage}</p>
          <div className="mt-4 min-w-0 overflow-x-auto">
            <table className="w-full min-w-[620px] border-collapse text-[11px]">
              <caption className="sr-only">Void log</caption>
              <thead>
                <tr className="border-b border-line text-left text-muted">
                  <th className="pb-2 font-semibold" scope="col">
                    Order
                  </th>
                  <th className="pb-2 font-semibold" scope="col">
                    Date
                  </th>
                  <th className="pb-2 font-semibold" scope="col">
                    Customer
                  </th>
                  <th className="pb-2 font-semibold" scope="col">
                    Voided by
                  </th>
                  <th className="pb-2 font-semibold" scope="col">
                    Reason as typed
                  </th>
                  <th className="pb-2 text-right font-semibold" scope="col">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...v.entries]
                  .sort((a, b) => Number(b.amount) - Number(a.amount))
                  .map((row) => (
                    <tr className="border-b border-line/60 last:border-b-0" key={row.order_number}>
                      <td className="py-2 font-mono font-semibold text-ink">{row.order_number}</td>
                      <td className="py-2 tabular-nums text-muted">
                        {row.when ? formatBusinessDate(row.when.slice(0, 10)) : "—"}
                      </td>
                      <td className="py-2 text-ink">{row.customer || "—"}</td>
                      <td className="py-2 text-muted">{row.voided_by || "—"}</td>
                      <td className="py-2 italic text-muted">{row.reason || "—"}</td>
                      <td className="py-2 text-right font-semibold tabular-nums text-[#c2410c]">
                        {formatExact(row.amount, "CURRENCY_USD")}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </details>
      ) : (
        <dl className="grid gap-2 rounded-xl border border-line bg-white p-4 text-[11px] sm:grid-cols-3">
          <div>
            <dt className="text-muted">Void detail</dt>
            <dd className="font-semibold text-ink">Excluded</dd>
          </div>
          <div>
            <dt className="text-muted">Rows supplied</dt>
            <dd className="font-semibold tabular-nums text-ink">
              {sales.operations.coverage.voids?.displayed ?? 0}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Rows required</dt>
            <dd className="font-semibold tabular-nums text-ink">
              {sales.operations.coverage.voids?.reported ?? "Unknown"}
            </dd>
          </div>
        </dl>
      )}
    </div>
  );
}
