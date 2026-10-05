import { useEffect, useState, type ReactNode } from "react";

import {
  ChartPanel,
  ColumnChart,
  DoughnutChart,
  formatBusinessDate,
  formatExact,
  formatValue,
  LineChart,
  RankedBars,
} from "../../components/charts/primitives";
import { KpiCard } from "../../components/charts/KpiCard";
import { EmptyPanel } from "../../components/ui/EmptyPanel";
import type { AnalyticsGateway, OverviewResult } from "../analytics/analytics-gateway";
import { deriveExecutiveMetrics } from "./executive-metrics";

function monthName(period: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(
    new Date(`${period}-01T00:00:00Z`),
  );
}

function monthYearName(period: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  }).format(new Date(`${period}-01T00:00:00Z`));
}

function shortDate(period: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${period}T00:00:00Z`));
}

function sumMoney(...values: (string | number)[]) {
  const cents = values.reduce<number>((sum, value) => sum + Math.round(Number(value) * 100), 0);
  return (cents / 100).toFixed(2);
}

function averageMoney(values: string[]) {
  if (values.length === 0) return "0.00";
  const cents = values.reduce((sum, value) => sum + Math.round(Number(value) * 100), 0);
  return (cents / values.length / 100).toFixed(2);
}

function SectionHeading({
  eyebrow,
  title,
  note,
}: {
  eyebrow: string;
  title: string;
  note?: string;
}) {
  return (
    <header>
      <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-muted">{eyebrow}</p>
      <h2 className="mt-1 text-[22px] font-semibold tracking-[-0.035em] text-ink">{title}</h2>
      {note ? <p className="mt-1 max-w-3xl text-[11px] leading-5 text-muted">{note}</p> : null}
    </header>
  );
}

function MetricLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      className="block h-full min-w-0 rounded-xl no-underline outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 [&>div]:h-full"
      href={href}
    >
      {children}
    </a>
  );
}

function ComparisonCard({
  label,
  primary,
  secondary,
  status,
  tone = "neutral",
  chart,
  controls,
  className = "",
}: {
  label: string;
  primary: string;
  secondary: string;
  status: "available" | "unavailable";
  tone?: "positive" | "negative" | "neutral";
  chart: ReactNode;
  controls?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex min-w-0 flex-col rounded-[14px] border border-line bg-white p-5 shadow-[0_6px_20px_rgba(23,26,22,0.035)] ${className}`}
      data-chart-visible="true"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[9px] font-extrabold uppercase tracking-[0.08em] text-muted">
          {label}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[8px] font-extrabold uppercase ${status === "available" ? "bg-[#edf8e6] text-[#315f27]" : "bg-[#f0f1ee] text-[#5b6058]"}`}
        >
          {status}
        </span>
      </div>
      <strong
        className={`mt-2 block text-sm font-semibold ${tone === "positive" ? "text-[#17613a]" : tone === "negative" ? "text-[#b63b2b]" : "text-ink"}`}
      >
        {primary}
      </strong>
      <span className="mt-1 block text-[10px] leading-4 text-muted">{secondary}</span>
      {controls ? <div className="mt-3">{controls}</div> : null}
      <div className="mt-3 border-t border-line pt-3">{chart}</div>
    </div>
  );
}

function RangeToggle({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div
      aria-label={label}
      className="inline-flex max-w-full rounded-lg border border-line bg-[#f5f6f2] p-0.5"
      role="group"
    >
      {options.map((option) => (
        <button
          aria-pressed={value === option.value}
          className={`rounded-md px-2 py-1 text-[9px] font-bold transition-colors ${
            value === option.value
              ? "bg-[#dff5cf] text-[#294f20] shadow-sm"
              : "text-muted hover:text-ink"
          }`}
          key={option.value}
          onClick={() => onChange(option.value)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function RevenueTrend({
  accent,
  points,
  seriesLabel,
  height = 190,
}: {
  accent: string;
  points: { label: string; value: number }[];
  seriesLabel: string;
  height?: number;
}) {
  const max = Math.max(...points.map((point) => point.value), 0);
  return (
    <div className="min-w-0">
      <div className="mb-2 flex items-center gap-1.5 text-[10px] text-muted">
        <span className="h-[3px] w-4 rounded-full" style={{ background: accent }} />
        {seriesLabel}
      </div>
      <div className="grid min-w-0 grid-cols-[48px_minmax(0,1fr)] gap-2">
        <div
          aria-label="Revenue axis in US dollars"
          className="flex flex-col justify-between text-right text-[8px] tabular-nums text-muted"
          style={{ height }}
        >
          <span>{formatValue(max, "CURRENCY_USD")}</span>
          <span>{formatValue(max / 2, "CURRENCY_USD")}</span>
          <span>$0</span>
        </div>
        <LineChart
          accent={accent}
          height={height}
          points={points}
          showPoints={points.length <= 14}
          unit="CURRENCY_USD"
        />
      </div>
    </div>
  );
}

function YearCoverageChart({ currentYear }: { currentYear: string }) {
  const previousYear = String(Number(currentYear) - 1);
  return (
    <div
      aria-label={`Year-over-year coverage: ${previousYear} unavailable, ${currentYear} available`}
      className="grid h-[160px] grid-cols-2 items-end gap-4"
      role="img"
    >
      <div className="grid gap-1.5">
        <div className="grid h-20 place-items-center rounded-md border border-dashed border-[#cfd2d8] bg-[#f7f8fa] text-[9px] font-bold text-muted">
          No data
        </div>
        <span className="text-center text-[9px] text-muted">{previousYear}</span>
      </div>
      <div className="grid gap-1.5">
        <div className="grid h-32 place-items-center rounded-md bg-[#dce9e2] text-[9px] font-bold text-[#35614f]">
          Available
        </div>
        <span className="text-center text-[9px] text-muted">{currentYear}</span>
      </div>
    </div>
  );
}

function StackedRevenueChart({
  points,
}: {
  points: { label: string; wdf: number; laundro: number }[];
}) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(...points.map((point) => point.wdf + point.laundro), 1);
  const ticks = [max, max / 2, 0];
  return (
    <div className="min-w-0">
      <div
        className="mb-3 flex flex-wrap gap-4 text-[10px] font-semibold text-ink"
        aria-label="Chart legend"
      >
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-[#2563eb]" />
          WDF counter sales
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-[#a855f7]" />
          LaundroPortal machine revenue
        </span>
      </div>
      <div className="grid grid-cols-[54px_minmax(0,1fr)] gap-2">
        <div className="flex h-[210px] flex-col justify-between pb-6 text-right text-[9px] tabular-nums text-muted">
          {ticks.map((tick) => (
            <span key={tick}>{formatValue(tick, "CURRENCY_USD")}</span>
          ))}
        </div>
        <div className="relative h-[210px]">
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-[184px] border-y border-[#dfe2e7] bg-[linear-gradient(to_bottom,transparent_49.5%,#e4e6eb_50%,transparent_50.5%)]"
          />
          <div
            className="relative grid h-full items-end gap-1 sm:gap-2"
            style={{ gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))` }}
          >
            {points.map((point, index) => {
              const total = point.wdf + point.laundro;
              const height = (total / max) * 184;
              const wdfShare = total > 0 ? (point.wdf / total) * 100 : 0;
              return (
                <button
                  aria-label={`${point.label}: WDF ${formatExact(point.wdf, "CURRENCY_USD")}, LaundroPortal ${formatExact(point.laundro, "CURRENCY_USD")}, total ${formatExact(total, "CURRENCY_USD")}`}
                  className="relative flex h-full min-w-0 flex-col justify-end outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  key={point.label}
                  onBlur={() => setActive(null)}
                  onFocus={() => setActive(index)}
                  onMouseEnter={() => setActive(index)}
                  onMouseLeave={() => setActive(null)}
                  type="button"
                >
                  {active === index ? (
                    <span className="pointer-events-none absolute left-1/2 top-1 z-20 w-max -translate-x-1/2 rounded-lg border border-line bg-white px-3 py-2 text-left text-[10px] shadow-panel">
                      <b className="block text-ink">
                        {point.label} · {formatExact(total, "CURRENCY_USD")}
                      </b>
                      <span className="mt-1 block text-muted">
                        WDF {formatExact(point.wdf, "CURRENCY_USD")}
                      </span>
                      <span className="block text-muted">
                        LaundroPortal {formatExact(point.laundro, "CURRENCY_USD")}
                      </span>
                    </span>
                  ) : null}
                  <span
                    className="chart-reveal-y flex w-full max-w-12 flex-col self-center overflow-hidden rounded-t-[4px] transition-opacity"
                    style={{ height, opacity: active === null || active === index ? 1 : 0.28 }}
                  >
                    <span className="bg-[#2563eb]" style={{ height: `${wdfShare}%` }} />
                    <span className="flex-1 bg-[#a855f7]" />
                  </span>
                  <span className="mt-2 text-[8px] text-muted sm:text-[9px]">
                    <span className="sm:hidden">{point.label.slice(0, 3)}</span>
                    <span className="hidden sm:inline">{point.label}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <p className="mt-2 text-[9px] text-muted">Y-axis: recorded revenue in US dollars.</p>
    </div>
  );
}

function ActionCard({
  label,
  value,
  valueLabel,
  href,
  rank,
  facts,
  action,
  records,
  statusLabel,
}: {
  label: string;
  value: string;
  valueLabel?: string;
  href?: string;
  rank: number;
  facts: { label: string; value: string }[];
  action?: string;
  records?: {
    order_number: string;
    employee: string;
    amount: string;
    pounds: string;
    pieces: string;
  }[];
  statusLabel?: string;
}) {
  const body = (
    <>
      <span className="absolute inset-y-0 left-0 w-1 bg-[#c8512f]" aria-hidden="true" />
      <span className="grid h-8 w-8 place-items-center rounded-full bg-[#fff0e8] text-xs font-extrabold text-[#9a3d10]">
        {rank}
      </span>
      <span className="min-w-0">
        <span className="text-[9px] font-extrabold uppercase tracking-[0.08em] text-[#9a3d10]">
          Review now
        </span>
        <strong className="mt-1 block text-sm font-semibold text-ink">{label}</strong>
        <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
          {facts.map((fact) => (
            <div key={fact.label}>
              <dt className="text-[8px] font-bold uppercase tracking-[0.06em] text-muted">
                {fact.label}
              </dt>
              <dd className="mt-0.5 text-[10px] font-semibold tabular-nums text-ink">
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>
      </span>
      <span className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1">
        {valueLabel ? (
          <span className="text-[8px] font-bold uppercase tracking-[0.06em] text-muted">
            {valueLabel}
          </span>
        ) : null}
        <strong className="text-lg font-semibold tabular-nums text-[#9a2f1c]">{value}</strong>
        {action ? (
          <span className="text-[10px] font-bold text-brand group-hover:underline">
            {action} <span aria-hidden="true">→</span>
          </span>
        ) : (
          <span className="rounded-full bg-[#fff4db] px-2 py-1 text-[8px] font-bold uppercase text-[#77591d]">
            {statusLabel ?? (records?.length ? "Records available" : "Source gap")}
          </span>
        )}
      </span>
      {records?.length ? (
        <details className="min-w-0 max-w-full sm:col-span-3">
          <summary className="cursor-pointer text-[10px] font-bold text-brand">
            Open {records.length} records
          </summary>
          <div className="mt-3 max-h-64 w-full max-w-full overflow-auto rounded-lg border border-line">
            <table className="w-full min-w-[620px] border-collapse text-[10px]">
              <thead className="sticky top-0 bg-canvas text-left text-muted">
                <tr>
                  <th className="px-3 py-2 font-semibold" scope="col">
                    Order
                  </th>
                  <th className="px-3 py-2 font-semibold" scope="col">
                    Employee
                  </th>
                  <th className="px-3 py-2 text-right font-semibold" scope="col">
                    Amount
                  </th>
                  <th className="px-3 py-2 text-right font-semibold" scope="col">
                    Pounds
                  </th>
                  <th className="px-3 py-2 text-right font-semibold" scope="col">
                    Pieces
                  </th>
                </tr>
              </thead>
              <tbody>
                {records.map((record, index) => (
                  <tr className="border-t border-line" key={`${record.order_number}-${index}`}>
                    <td className="px-3 py-2 font-semibold text-ink">{record.order_number}</td>
                    <td className="px-3 py-2 text-muted">{record.employee || "—"}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-ink">
                      {formatExact(record.amount, "CURRENCY_USD")}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-muted">
                      {record.pounds}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-muted">
                      {record.pieces}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      ) : null}
    </>
  );

  const className =
    "group relative grid min-w-0 gap-4 overflow-hidden rounded-xl border border-[#ecc9ba] bg-white p-4 no-underline shadow-[0_5px_18px_rgba(17,19,24,0.035)] outline-none transition-[border-color,box-shadow] sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center";
  return href ? (
    <a
      className={`${className} hover:border-[#d88564] hover:shadow-[0_9px_24px_rgba(17,19,24,0.065)] focus-visible:ring-2 focus-visible:ring-[#b94d2b]`}
      href={href}
    >
      {body}
    </a>
  ) : (
    <div className={className}>{body}</div>
  );
}

function MonitorCard({
  label,
  value,
  detail,
  href,
  status,
}: {
  label: string;
  value: string;
  detail: string;
  href?: string;
  status: "Monitor" | "Verify" | "Review";
}) {
  const body = (
    <>
      <span className="flex items-start justify-between gap-3">
        <strong className="text-xs font-semibold text-ink">{label}</strong>
        <span className="rounded-full bg-[#edf2f6] px-2 py-1 text-[8px] font-extrabold uppercase tracking-[0.05em] text-[#355f86]">
          {status}
        </span>
      </span>
      <strong className="mt-3 text-xl font-semibold tabular-nums text-ink">{value}</strong>
      <span className="mt-1 text-[10px] leading-4 text-muted">{detail}</span>
      <span
        className={`mt-auto pt-3 text-[10px] font-bold ${href ? "text-brand group-hover:underline" : "text-[#77591d]"}`}
      >
        {href ? "Open facts" : "Need full export"} {href ? <span aria-hidden="true">→</span> : null}
      </span>
    </>
  );
  const className =
    "group flex min-w-0 flex-col rounded-xl border border-line bg-white p-4 no-underline shadow-[0_4px_14px_rgba(17,19,24,0.025)] outline-none transition-[border-color,box-shadow]";
  return href ? (
    <a
      className={`${className} hover:border-black/15 hover:shadow-[0_8px_20px_rgba(17,19,24,0.055)] focus-visible:ring-2 focus-visible:ring-brand`}
      href={href}
    >
      {body}
    </a>
  ) : (
    <div className={className}>{body}</div>
  );
}

export function ExecutiveDashboardPage({ gateway }: { gateway: AnalyticsGateway }) {
  const [result, setResult] = useState<OverviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dayRange, setDayRange] = useState("30");
  const [monthRange, setMonthRange] = useState("12");

  useEffect(() => {
    const controller = new AbortController();
    gateway
      .getOverview(controller.signal)
      .then(setResult)
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setError(cause instanceof Error ? cause.message : "Executive measures could not be loaded");
      });
    return () => controller.abort();
  }, [gateway]);

  if (error)
    return <EmptyPanel title="Executive dashboard could not be loaded" description={error} />;
  if (!result)
    return (
      <EmptyPanel
        title="Loading executive dashboard…"
        description="Calculating the verified whole-business totals."
      />
    );
  if (result.state === "unavailable")
    return <EmptyPanel title="No executive measures are available" description={result.detail} />;

  const sales = result.wdf_sales;
  const ownerMetrics = deriveExecutiveMetrics(result);
  const combinedMonths = result.source_comparison.by_month.map((row) => ({
    period: row.period,
    value: sumMoney(row.wdf_counter_sales, row.laundro_machine_revenue),
  }));
  const combinedDays = result.source_comparison.by_day.map((row) => ({
    period: row.period,
    value: sumMoney(row.wdf_counter_sales, row.laundro_machine_revenue),
  }));
  const combinedYears = result.source_comparison.by_year.map((row) => ({
    period: row.period,
    value: sumMoney(row.wdf_counter_sales, row.laundro_machine_revenue),
  }));
  const visibleDays = combinedDays.slice(-Number(dayRange));
  const visibleMonths =
    monthRange === "all" ? combinedMonths : combinedMonths.slice(-Number(monthRange));
  const totalRecordedRevenue = sumMoney(...combinedYears.map((row) => row.value));
  const wdfRevenue = sumMoney(
    ...result.source_comparison.by_year.map((row) => row.wdf_counter_sales),
  );
  const laundroRevenue = sumMoney(
    ...result.source_comparison.by_year.map((row) => row.laundro_machine_revenue),
  );
  const averageMonthlyRevenue = averageMoney(combinedMonths.map((row) => row.value));
  const trendMonths = result.source_comparison.by_month.slice(-12);
  const latestDay = combinedDays.at(-1);
  const latestSevenDays = combinedDays.slice(-7);
  const priorSevenDays = combinedDays.slice(-14, -7);
  const latestSevenTotal = sumMoney(...latestSevenDays.map((row) => row.value));
  const priorSevenTotal = sumMoney(...priorSevenDays.map((row) => row.value));
  const rollingSevenChange =
    Number(priorSevenTotal) !== 0
      ? ((Number(latestSevenTotal) - Number(priorSevenTotal)) / Number(priorSevenTotal)) * 100
      : undefined;
  const latestMonth = combinedMonths.at(-1);
  const previousMonth = combinedMonths.at(-2);
  const latestMonthChange =
    latestMonth && previousMonth && Number(previousMonth.value) !== 0
      ? ((Number(latestMonth.value) - Number(previousMonth.value)) / Number(previousMonth.value)) *
        100
      : undefined;
  const latestMonthTrend =
    latestMonth && latestMonthChange !== undefined
      ? {
          value: `${latestMonthChange > 0 ? "+" : ""}${latestMonthChange.toFixed(1)}%`,
          label: `${monthName(latestMonth.period)} versus ${previousMonth ? monthName(previousMonth.period) : "prior month"}`,
          direction: latestMonthChange > 0 ? "up" : latestMonthChange < 0 ? "down" : "flat",
        }
      : undefined;
  const latestYear = combinedYears.at(-1);
  const previousYear = combinedYears.at(-2);
  const latestYearChange =
    latestYear && previousYear && Number(previousYear.value) !== 0
      ? ((Number(latestYear.value) - Number(previousYear.value)) / Number(previousYear.value)) * 100
      : undefined;
  const latestYearMonths = latestYear
    ? combinedMonths.filter((row) => row.period.startsWith(latestYear.period))
    : [];
  const incompleteReports = Object.values(sales.operations.coverage).filter(
    (coverage) => !coverage.complete,
  ).length;
  const quarters = [0, 1, 2, 3].map((quarter) => ({
    label: `Q${quarter + 1}`,
    value: Number(
      sumMoney(...latestYearMonths.slice(quarter * 3, quarter * 3 + 3).map((row) => row.value)),
    ),
  }));
  const expectedDeposit = sales.financial_summary.deposit["Expected Deposit"] ?? "0";

  return (
    <div className="grid min-w-0 gap-6">
      <h1 className="sr-only">Executive dashboard</h1>

      <section className="order-1 grid gap-3">
        <SectionHeading
          eyebrow="Whole-business totals"
          title="Recorded business totals"
          note="WDF sales plus machine revenue."
        />
        <div className="grid auto-rows-fr gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricLink href="#analytics/sales">
            <KpiCard
              accent="#355f86"
              context="WDF sales plus machine revenue"
              coverage="PARTIAL"
              label="Total recorded revenue"
              unit="CURRENCY_USD"
              value={totalRecordedRevenue}
            />
          </MetricLink>
          <MetricLink href="#analytics/trends">
            <KpiCard
              accent="#355f86"
              context="Revenue per supplied month"
              label="Average monthly revenue"
              unit="CURRENCY_USD"
              value={averageMonthlyRevenue}
            />
          </MetricLink>
          <MetricLink href="#analytics/trends">
            <KpiCard
              accent="#4f7770"
              context={latestDay ? formatBusinessDate(latestDay.period) : "No recorded day"}
              label="Latest recorded-day revenue"
              unit="CURRENCY_USD"
              value={latestDay?.value ?? "Unavailable"}
            />
          </MetricLink>
          <MetricLink href="#orders">
            <KpiCard
              accent="#4f7770"
              context="Paid orders plus washer cycles"
              coverage="PARTIAL"
              label="Recorded service events"
              unit="COUNT"
              value={ownerMetrics.recordedServiceEvents}
            />
          </MetricLink>
        </div>
      </section>

      <section className="order-3 grid gap-3">
        <SectionHeading
          eyebrow="Operating demand"
          title="Business activity"
          note="Recorded service activity."
        />
        <div className="grid auto-rows-fr gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <MetricLink href="#analytics/machines">
            <KpiCard
              accent="#66556f"
              context="Washer cycles per supplied day"
              coverage="PARTIAL"
              label="Average washer cycles per day"
              source="LaundroPortal"
              unit="COUNT"
              value={ownerMetrics.averageDailyWasherCycles.toFixed(1)}
            />
          </MetricLink>
          <MetricLink href="#analytics/machines">
            <KpiCard
              accent="#66556f"
              context="Revenue per washer cycle"
              coverage="PARTIAL"
              label="Washer revenue per cycle"
              source="LaundroPortal"
              unit="CURRENCY_USD"
              value={ownerMetrics.washerRevenuePerCycle.toFixed(2)}
            />
          </MetricLink>
          <MetricLink href="#analytics/customers">
            <KpiCard
              accent="#4f7770"
              context="Active cards per supplied day"
              label="Average daily card activity"
              source="LaundroPortal"
              unit="COUNT"
              value={ownerMetrics.averageDailyCardActivity.toFixed(1)}
            />
          </MetricLink>
        </div>
        <div className="grid items-stretch gap-4 lg:grid-cols-2">
          <ChartPanel
            coverage="Monthly washer cycle records."
            source="LaundroPortal"
            subtitle="Washer cycles by month."
            title="Monthly washer demand"
            unit="Cycles"
          >
            <ColumnChart
              accent="#66556f"
              height={170}
              points={ownerMetrics.washerCyclesByMonth.slice(-12).map((point) => ({
                label: monthYearName(point.period),
                value: point.value,
              }))}
              unit="COUNT"
            />
          </ChartPanel>
          <ChartPanel
            coverage="Daily card use grouped monthly."
            source="LaundroPortal"
            subtitle="Active card accounts by month."
            title="Monthly card activity"
            unit="Account-use days"
          >
            <LineChart
              accent="#4f7770"
              height={170}
              points={ownerMetrics.accountActivityByMonth.slice(-12).map((point) => ({
                label: monthYearName(point.period),
                value: point.value,
              }))}
              seriesLabel="Card activity"
              showPoints
              unit="COUNT"
            />
          </ChartPanel>
        </div>
      </section>

      <section className="order-4 grid gap-3">
        <SectionHeading
          eyebrow="Stored-value position"
          title="Customer card balances"
          note="Card deposits and machine spending."
        />
        <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]">
          <ChartPanel
            action={
              <span className="rounded-full bg-[#fff4db] px-2.5 py-1 text-[9px] font-bold text-[#77591d]">
                {formatExact(ownerMetrics.loadSpendGap, "CURRENCY_USD")} difference
              </span>
            }
            coverage="Deposits versus machine revenue."
            source="LaundroPortal"
            subtitle="Loaded value and machine spending."
            title="Loaded value versus machine spend"
            unit="US dollars"
          >
            <RankedBars
              points={[
                {
                  label: "Card value loaded",
                  value: ownerMetrics.cardValueLoaded,
                  color: "#4f7770",
                },
                {
                  label: "Machine value spent",
                  value: ownerMetrics.machineRevenue,
                  color: "#66556f",
                },
              ]}
              unit="CURRENCY_USD"
            />
          </ChartPanel>
          <div className="grid auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <MetricLink href="#analytics/customers">
              <KpiCard
                accent="#4f7770"
                context="Balance on supplied card accounts"
                label="Outstanding card balance"
                precision="exact"
                unit="CURRENCY_USD"
                value={ownerMetrics.outstandingCardBalance.toFixed(2)}
              />
            </MetricLink>
            <MetricLink href="#analytics/machines">
              <KpiCard
                accent="#c07b32"
                context="Management-card machine activity"
                label="Management-card starts"
                precision="exact"
                unit="CURRENCY_USD"
                value={ownerMetrics.managementStarts.toFixed(2)}
              />
            </MetricLink>
          </div>
        </div>
      </section>

      <section className="order-5 grid gap-3">
        <SectionHeading
          eyebrow="Source context"
          title="Source details"
          note="Source measures behind business totals."
        />
        <div className="grid auto-rows-fr gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricLink href="#orders">
            <KpiCard
              accent="#355f86"
              context="WDF paid sales transactions"
              label="WDF paid orders"
              source="WDF POS"
              unit="COUNT"
              value={ownerMetrics.paidOrders}
            />
          </MetricLink>
          <MetricLink href="#orders">
            <KpiCard
              accent="#355f86"
              context="Net sales per paid order"
              label="WDF average ticket"
              source="WDF POS"
              unit="CURRENCY_USD"
              value={sales.analytics.totals.average_ticket ?? "Unavailable"}
            />
          </MetricLink>
          <MetricLink href="#orders">
            <KpiCard
              accent="#c07b32"
              context="Included in net sales"
              label="Refund and discount lines"
              source="WDF POS"
              unit="COUNT"
              value={sales.negative_lines}
            />
          </MetricLink>
          <MetricLink href="#analytics/customers">
            <KpiCard
              accent="#66556f"
              context="Issued cards; replacements combined"
              label="New laundry cards"
              source="LaundroPortal"
              unit="COUNT"
              value={ownerMetrics.newCards}
            />
          </MetricLink>
        </div>
      </section>

      <section className="order-2 grid gap-3">
        <SectionHeading eyebrow="Whole-business movement" title="Revenue trends" />
        <div className="grid gap-4 xl:grid-cols-2">
          <ComparisonCard
            chart={
              visibleDays.length > 1 ? (
                <RevenueTrend
                  accent="#4f7770"
                  points={visibleDays.map((point) => ({
                    label: shortDate(point.period),
                    value: Number(point.value),
                  }))}
                  seriesLabel="Daily revenue"
                />
              ) : (
                <div className="grid h-[92px] place-items-center text-[10px] text-muted">
                  No comparable days
                </div>
              )
            }
            controls={
              <RangeToggle
                label="Daily range"
                onChange={setDayRange}
                options={[
                  { label: "14D", value: "14" },
                  { label: "30D", value: "30" },
                  { label: "90D", value: "90" },
                  { label: "1Y", value: "365" },
                ]}
                value={dayRange}
              />
            }
            label="Rolling 7-day"
            primary={
              rollingSevenChange !== undefined
                ? `${rollingSevenChange > 0 ? "+" : ""}${rollingSevenChange.toFixed(1)}%`
                : "Unavailable"
            }
            secondary={
              latestSevenDays.length === 7
                ? `${shortDate(latestSevenDays[0]!.period)} to ${shortDate(latestSevenDays[6]!.period)}`
                : "Fourteen comparable days are required"
            }
            status={rollingSevenChange !== undefined ? "available" : "unavailable"}
            tone={
              rollingSevenChange === undefined
                ? "neutral"
                : rollingSevenChange < 0
                  ? "negative"
                  : "positive"
            }
          />
          <ComparisonCard
            chart={
              visibleMonths.length > 1 ? (
                <RevenueTrend
                  accent="#355f86"
                  points={visibleMonths.map((point) => ({
                    label: monthYearName(point.period),
                    value: Number(point.value),
                  }))}
                  seriesLabel="Monthly revenue"
                />
              ) : (
                <div className="grid h-[92px] place-items-center text-[10px] text-muted">
                  No comparable months
                </div>
              )
            }
            controls={
              <RangeToggle
                label="Monthly range"
                onChange={setMonthRange}
                options={[
                  { label: "6M", value: "6" },
                  { label: "12M", value: "12" },
                  { label: "24M", value: "24" },
                  { label: "ALL", value: "all" },
                ]}
                value={monthRange}
              />
            }
            label="Month over month"
            primary={latestMonthTrend ? latestMonthTrend.value : "Unavailable"}
            secondary={latestMonthTrend?.label ?? "Two comparable months are required"}
            status={latestMonthTrend ? "available" : "unavailable"}
            tone={
              latestMonthChange === undefined
                ? "neutral"
                : latestMonthChange < 0
                  ? "negative"
                  : "positive"
            }
          />
          <ComparisonCard
            className="xl:col-span-2"
            chart={
              latestYear && previousYear && latestYearChange !== undefined ? (
                <ColumnChart
                  accent="#66556f"
                  height={180}
                  labelEvery={combinedYears.length > 6 ? 2 : 1}
                  points={combinedYears.map((point) => ({
                    label: point.period,
                    value: Number(point.value),
                  }))}
                  unit="CURRENCY_USD"
                />
              ) : (
                <YearCoverageChart
                  currentYear={latestYear?.period ?? String(new Date().getUTCFullYear())}
                />
              )
            }
            label="Year over year"
            primary={
              latestYear && latestYearChange !== undefined
                ? `${latestYearChange > 0 ? "+" : ""}${latestYearChange.toFixed(1)}%`
                : "Not available"
            }
            secondary={
              latestYear && previousYear && latestYearChange !== undefined
                ? `${latestYear.period} versus ${previousYear.period}`
                : "Only one complete year"
            }
            status={latestYearChange === undefined ? "unavailable" : "available"}
            tone={
              latestYearChange === undefined
                ? "neutral"
                : latestYearChange < 0
                  ? "negative"
                  : "positive"
            }
          />
        </div>
        <ChartPanel
          action={
            latestMonthTrend ? (
              <span
                className={`rounded-full px-2 py-1 text-[9px] font-bold text-white ${latestMonthTrend.direction === "up" ? "bg-[#16824c]" : latestMonthTrend.direction === "down" ? "bg-[#c2412d]" : "bg-[#6b7280]"}`}
              >
                {latestMonthTrend.value}
              </span>
            ) : null
          }
          coverage="WDF sales plus machine revenue."
          className="chart-panel-wide w-full"
          subtitle="Monthly revenue by source."
          title="Monthly revenue by source"
          unit="US dollars"
        >
          <StackedRevenueChart
            points={trendMonths.map((row) => ({
              label: monthYearName(row.period),
              wdf: Number(row.wdf_counter_sales),
              laundro: Number(row.laundro_machine_revenue),
            }))}
          />
        </ChartPanel>
        <div className="grid items-stretch gap-4 lg:grid-cols-2">
          <ChartPanel
            coverage="Same sources as total revenue."
            subtitle="Revenue share by source."
            title="Revenue by source"
            unit="Share of revenue"
          >
            <DoughnutChart
              segments={[
                { label: "WDF counter sales", value: Number(wdfRevenue), color: "#355f86" },
                {
                  label: "LaundroPortal machine revenue",
                  value: Number(laundroRevenue),
                  color: "#8c7698",
                },
              ]}
              unit="CURRENCY_USD"
            />
          </ChartPanel>
          <ChartPanel
            coverage="Three calendar months per quarter."
            subtitle="Revenue by quarter."
            title="Quarterly recorded revenue"
            unit="US dollars"
          >
            <ColumnChart accent="#4f7770" height={180} points={quarters} unit="CURRENCY_USD" />
          </ChartPanel>
        </div>
      </section>

      <section className="order-6 grid gap-3">
        <SectionHeading eyebrow="Owner attention" title="Owner review" />
        <div className="grid gap-3 lg:grid-cols-2">
          <ActionCard
            facts={[
              {
                label: "Records",
                value: sales.coverage.absent_commercial_orders.toLocaleString("en-US"),
              },
              { label: "Payment", value: "Not confirmed" },
            ]}
            label="Production orders missing from paid sales"
            rank={1}
            records={sales.coverage.absent_commercial_records ?? []}
            statusLabel="Payment unknown"
            value={formatExact(sales.coverage.absent_commercial_value, "CURRENCY_USD")}
            valueLabel="Production value"
          />
          <ActionCard
            action="View cash facts"
            facts={[
              {
                label: "Cash sales",
                value: formatExact(
                  sales.financial_summary.deposit["Total Cash Sales"] ?? 0,
                  "CURRENCY_USD",
                ),
              },
              {
                label: "Payouts",
                value: formatExact(
                  sales.financial_summary.deposit["Total Payouts"] ?? 0,
                  "CURRENCY_USD",
                ),
              },
            ]}
            href="#analytics/cash"
            label="Cash sales less payouts"
            rank={2}
            value={formatExact(expectedDeposit, "CURRENCY_USD")}
          />
        </div>

        <div className="mt-1">
          <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-muted">
            Signals to verify
          </h3>
          <p className="mt-1 text-[10px] leading-4 text-muted">Not confirmed losses.</p>
        </div>
        <div className="grid auto-rows-fr gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MonitorCard
            detail="Review monthly usage"
            href="#analytics/machines"
            label="Management-card usage"
            status="Verify"
            value={formatExact(ownerMetrics.managementStarts, "CURRENCY_USD")}
          />
          <MonitorCard
            detail="Retained in sales totals"
            href="#analytics/method"
            label="Repeated sales lines"
            status="Review"
            value={sales.source_quality.duplicate_lines.toLocaleString("en-US")}
          />
          <MonitorCard
            detail="Payment totals differ"
            href="#analytics/cash"
            label="Payment reconciliation difference"
            status="Monitor"
            value={formatExact(ownerMetrics.paymentGap, "CURRENCY_USD")}
          />
          <MonitorCard
            detail="Retained with source labels"
            href="#analytics/method"
            label="Missing sales fields"
            status="Review"
            value={(
              sales.source_quality.blank_units + sales.source_quality.blank_categories
            ).toLocaleString("en-US")}
          />
        </div>

        <a
          className="mt-1 flex flex-col gap-3 rounded-xl border border-[#e6d6aa] bg-[#fffaf0] p-4 no-underline outline-none transition-colors hover:bg-[#fff7e5] focus-visible:ring-2 focus-visible:ring-[#a36b08] sm:flex-row sm:items-center sm:justify-between"
          href="#analytics/method"
        >
          <span>
            <strong className="block text-sm font-semibold text-ink">
              Normal operating ranges are not configured
            </strong>
            <span className="mt-1 block text-[10px] leading-4 text-muted">
              Set targets before alerts.
            </span>
          </span>
          <span className="shrink-0 text-[10px] font-bold text-[#77591d]">
            Configure methodology <span aria-hidden="true">→</span>
          </span>
        </a>
      </section>

      <section className="order-7 grid gap-3">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <SectionHeading
            eyebrow="Data coverage"
            title="Data coverage"
            note="Included and excluded source records."
          />
          <span className="rounded-full border border-[#e6d6aa] bg-amber-soft px-3 py-1 text-[9px] font-bold uppercase text-[#77591d]">
            Source limits
          </span>
        </header>
        <div className="grid gap-3 lg:grid-cols-3">
          <div className="rounded-xl border border-line bg-white p-4">
            <h3 className="text-sm font-semibold text-ink">Included in revenue</h3>
            <ul className="mt-3 grid gap-2 text-[11px] leading-5 text-muted">
              <li>WDF paid counter sales: {formatExact(wdfRevenue, "CURRENCY_USD")}</li>
              <li>LaundroPortal machine revenue: {formatExact(laundroRevenue, "CURRENCY_USD")}</li>
              <li>All supplied calendar periods aligned by date</li>
            </ul>
          </div>
          <div className="rounded-xl border border-line bg-white p-4">
            <h3 className="text-sm font-semibold text-ink">Excluded from revenue</h3>
            <ul className="mt-3 grid gap-2 text-[11px] leading-5 text-muted">
              <li>Card value loaded—it is a deposit, not revenue</li>
              <li>Voided orders</li>
              <li>Commercial/on-account work missing from paid sales</li>
              <li>Costs and expenses, which were not supplied</li>
            </ul>
          </div>
          <div className="rounded-xl border border-line bg-white p-4">
            <h3 className="text-sm font-semibold text-ink">Coverage reasons</h3>
            <ul className="mt-3 grid gap-2 text-[11px] leading-5 text-muted">
              <li>
                WDF paid sales omit {sales.coverage.absent_commercial_orders} commercial orders
              </li>
              <li>
                The void export displays {sales.operations.coverage.voids?.displayed ?? 0} of{" "}
                {sales.operations.coverage.voids?.reported ?? "Unknown"} entries
              </li>
              <li>{incompleteReports} WDF report extracts do not contain every row</li>
              <li>LaundroPortal machine revenue itself is complete</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
