import { useEffect, useState } from "react";

import {
  ChartPanel,
  ColumnChart,
  MixBar,
  RankedBars,
  formatExact,
} from "../../components/charts/primitives";
import { KpiCard } from "../../components/charts/KpiCard";
import { EmptyPanel } from "../../components/ui/EmptyPanel";
import type { AnalyticsGateway, OverviewResult } from "../analytics/analytics-gateway";

function StatementRow({
  label,
  value,
  explanation,
  tone = "normal",
}: {
  label: string;
  value: string;
  explanation: string;
  tone?: "normal" | "warning" | "total";
}) {
  return (
    <div
      className={`grid gap-2 rounded-xl border px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center ${
        tone === "warning"
          ? "border-[#efd2c2] bg-[#fff5ef]"
          : tone === "total"
            ? "border-[#bfe3cd] bg-[#effaf3]"
            : "border-line bg-canvas/70"
      }`}
    >
      <div>
        <strong className="block text-xs text-ink">{label}</strong>
        <span className="mt-1 block text-[10px] leading-4 text-muted">{explanation}</span>
      </div>
      <strong className="text-lg font-semibold tabular-nums tracking-[-0.025em] text-ink">
        {formatExact(value, "CURRENCY_USD")}
      </strong>
    </div>
  );
}

export function FinancePage({ gateway }: { gateway: AnalyticsGateway }) {
  const [result, setResult] = useState<OverviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    gateway
      .getOverview(controller.signal)
      .then((loaded) => {
        setResult(loaded);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setError(
          cause instanceof Error ? cause.message : "The financial report could not be loaded",
        );
      });
    return () => controller.abort();
  }, [gateway]);

  if (error) {
    return <EmptyPanel title="Revenue and loss report could not be loaded" description={error} />;
  }
  if (!result) {
    return (
      <EmptyPanel
        title="Loading the financial report…"
        description="Reading the verified WDF financial summary."
      />
    );
  }
  if (result.state === "unavailable" || !result.wdf_sales.analytics.available) {
    return (
      <EmptyPanel
        title="No financial report is available"
        description={
          result.state === "unavailable" ? result.detail : "No dated WDF sales lines were supplied."
        }
      />
    );
  }

  const sales = result.wdf_sales;
  const summary = sales.financial_summary;
  const totals = summary.totals;
  const payments = Object.entries(summary.payments)
    .filter(([, value]) => Number(value) > 0)
    .map(([label, value], index) => ({
      label,
      value: Number(value),
      color: ["#4f7462", "#355f86", "#6b5b73", "#967246"][index] ?? "#66717a",
    }));
  const voids = sales.operations.voids;
  const voidCoverage = sales.operations.coverage.voids;

  return (
    <section className="mt-6 grid gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          accent="#4f7462"
          context="Sales after discounts and refunds, before tax and tips"
          coverage="PARTIAL"
          label="Recorded net sales"
          precision="exact"
          unit="CURRENCY_USD"
          value={totals["Net Sales"] ?? sales.analytics.totals.net_sales}
        />
        <KpiCard
          accent="#355f86"
          context="Net sales plus tax, tips and surcharges"
          coverage="COMPLETE"
          label="Grand total collected"
          precision="exact"
          unit="CURRENCY_USD"
          value={totals["Grand Total"] ?? "0"}
        />
        <KpiCard
          accent="#49747a"
          context="Tax recorded by the WDF financial summary"
          label="Sales tax"
          precision="exact"
          unit="CURRENCY_USD"
          value={totals["Net Tax 1"] ?? "0"}
        />
        <KpiCard
          accent="#6b5b73"
          context="Tips recorded on credit-card payments"
          label="Card tips"
          precision="exact"
          unit="CURRENCY_USD"
          value={totals["Credit Card Tips"] ?? "0"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <ChartPanel
          coverage={summary.reconciliation_note}
          subtitle="A plain-language view of the major movements recorded by WDF."
          title="Revenue and cash movement statement"
          unit="US dollars"
        >
          <div className="grid gap-2.5">
            <StatementRow
              label="Recorded net sales"
              value={totals["Net Sales"] ?? "0"}
              explanation="Customer sales before tax and tips, after recorded discounts and refunds."
              tone="total"
            />
            <StatementRow
              label="Voided sales"
              value={totals["Total Voided Sales"] ?? "0"}
              explanation="Orders reversed at the register. Shown separately and not deducted again from net sales."
              tone="warning"
            />
            <StatementRow
              label="Cash payouts"
              value={totals["Total Payouts"] ?? "0"}
              explanation="Cash removed from the drawer and recorded by WDF; the business purpose is not fully supplied."
            />
            <StatementRow
              label="Cash sales less payouts"
              value={summary.deposit["Expected Deposit"] ?? "0"}
              explanation="Cash sales minus recorded payouts, using the workbook's own financial summary."
              tone="warning"
            />
          </div>
        </ChartPanel>

        <ChartPanel
          coverage="Payment values are read directly from the WDF Financial Summary sheet."
          subtitle="How the recorded grand total was paid."
          title="Payment mix"
          unit="US dollars"
        >
          <MixBar segments={payments} unit="CURRENCY_USD" />
        </ChartPanel>
      </div>

      {voidCoverage?.complete ? (
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <ChartPanel
            coverage={sales.operations.coverage.voids?.note ?? "Void detail is shown as supplied."}
            subtitle="When the supplied voided value was recorded."
            title="Voided sales by month"
            unit="US dollars"
          >
            <ColumnChart
              accent="#c2410c"
              points={voids.by_month.map((row) => ({
                label: row.period.slice(5),
                value: Number(row.amount),
                caption: row.period,
              }))}
              unit="CURRENCY_USD"
            />
          </ChartPanel>
          <ChartPanel
            coverage="Reasons remain based on the wording entered at the register. Unmatched wording stays in Other reason."
            subtitle="Why staff recorded the supplied voids."
            title="Voids by recorded reason"
            unit="US dollars"
          >
            <RankedBars
              accent="#c2410c"
              points={voids.by_reason.map((row) => ({
                label: row.name,
                value: Number(row.amount),
              }))}
              unit="CURRENCY_USD"
            />
          </ChartPanel>
        </div>
      ) : (
        <dl className="grid gap-2 rounded-2xl border border-line bg-white p-5 text-[11px] sm:grid-cols-3">
          <div>
            <dt className="text-muted">Void detail</dt>
            <dd className="font-semibold text-ink">Excluded</dd>
          </div>
          <div>
            <dt className="text-muted">Rows supplied</dt>
            <dd className="font-semibold tabular-nums text-ink">{voidCoverage?.displayed ?? 0}</dd>
          </div>
          <div>
            <dt className="text-muted">Rows required</dt>
            <dd className="font-semibold tabular-nums text-ink">
              {voidCoverage?.reported ?? "Unknown"}
            </dd>
          </div>
        </dl>
      )}

      <div className="rounded-2xl border border-line bg-white p-5 sm:p-6">
        <div className="grid gap-5 md:grid-cols-3">
          <div>
            <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted">
              Source
            </span>
            <strong className="mt-1 block text-xs text-ink">WDF POS financial summary</strong>
          </div>
          <div>
            <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted">
              Reconciliation
            </span>
            <strong className="mt-1 block text-xs text-ink">
              {summary.reconciles ? "Passed exactly" : "Needs review"}
            </strong>
          </div>
          <div>
            <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted">
              Coverage
            </span>
            <strong className="mt-1 block text-xs text-ink">
              Revenue only · operating costs absent
            </strong>
          </div>
        </div>
      </div>
    </section>
  );
}
