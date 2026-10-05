import { ChartPanel, RankedBars, formatExact } from "../../../components/charts/primitives";
import { KpiCard } from "../../../components/charts/KpiCard";
import type { WdfSales, Workforce } from "../analytics-gateway";

export function StaffSection({ sales, workforce }: { sales: WdfSales; workforce: Workforce }) {
  const staff = sales.operations.staff;

  return (
    <div className="grid min-w-0 gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard
          accent="#355f86"
          context="Credit card tips report"
          label="Tips paid"
          unit="CURRENCY_USD"
          value={staff.tips_total}
        />
        <KpiCard
          accent="#B42318"
          context="Over 16 hours, non-positive, or crossing the period"
          label="Timesheet exceptions"
          unit="COUNT"
          value={workforce.excluded_entries}
        />
        <KpiCard
          accent="#6B7280"
          context="People represented in the supplied timesheet"
          label="Staff in timesheet"
          unit="COUNT"
          value={workforce.employee_count}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartPanel
          coverage="Tips are reported against production and cashier duties separately by the source."
          subtitle="Credit card tips recorded for each person."
          title="Credit card tips"
          unit="US dollars"
        >
          <RankedBars
            accent="#355f86"
            points={staff.tips.map((row) => ({
              label: row.employee,
              value: Number(row.total_tips),
              caption:
                Number(row.cashier_tips) > 0
                  ? `${formatExact(row.production_tips, "CURRENCY_USD")} production · ${formatExact(row.cashier_tips, "CURRENCY_USD")} cashier`
                  : "all from production",
            }))}
            unit="CURRENCY_USD"
          />
        </ChartPanel>

        <section className="rounded-2xl border border-line bg-white p-5 sm:p-6">
          <h3 className="text-sm font-semibold text-ink">Production needs a paid/unpaid split</h3>
          <p className="mt-2 text-[11px] leading-5 text-muted">
            The production export includes 31 processed orders absent from paid sales. The combined
            $61,121 value is not shown as revenue or performance. Staff production can publish only
            after the analytics layer separates paid and processed-but-unpaid orders.
          </p>
        </section>
      </div>

      <section className="rounded-2xl border border-[#e6d6aa] bg-amber-soft px-5 py-4">
        <strong className="block text-[11px] font-bold text-[#77591d]">Source limits</strong>
        <p className="mt-1.5 max-w-[86ch] text-[11px] leading-[1.7] text-[#77591d]">
          The shift export contains only 8 of 790 shifts, so the prior shift-close sample is not
          presented as a yearly finding. No pay-rate source exists, so labour cost is unavailable.
        </p>
      </section>
    </div>
  );
}
