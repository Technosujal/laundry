import { useEffect, useState } from "react";

import { EmptyPanel } from "../../components/ui/EmptyPanel";
import { formatBusinessDate } from "../../components/charts/primitives";
import type { AnalyticsGateway, Metric, MetricDetailResult } from "./analytics-gateway";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-line py-3 last:border-b-0 sm:grid-cols-[190px_minmax(0,1fr)] sm:gap-4">
      <dt className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted">{label}</dt>
      <dd className="text-[12px] leading-[1.6] text-ink">{children}</dd>
    </div>
  );
}

function List({ items }: { items: readonly string[] }) {
  if (items.length === 0) return <span className="text-muted">None recorded.</span>;
  return (
    <ul className="grid gap-1.5">
      {items.map((item) => (
        <li className="flex gap-2" key={item}>
          <span aria-hidden="true" className="text-muted">
            ·
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function formatAmount(value: string, unit: string): string {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return value;
  return unit === "CURRENCY_USD"
    ? numeric.toLocaleString("en-US", { style: "currency", currency: "USD" })
    : numeric.toLocaleString("en-US");
}

function MonthlyBreakdown({ metric }: { metric: Metric }) {
  if (metric.by_month.length === 0) return null;
  const values = metric.by_month.map((m) => Number(m.value)).filter(Number.isFinite);
  const peak = values.length ? Math.max(...values) : 0;
  return (
    <div className="mt-6 rounded-2xl border border-line bg-white p-5">
      <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted">
        Monthly breakdown
      </h3>
      <p className="mt-1 text-[11px] text-muted">
        These months sum to the total above. Source days are used exactly as exported.
      </p>
      <div className="mt-4 grid gap-2">
        {metric.by_month.map((point) => {
          const numeric = Number(point.value);
          const width = peak > 0 && Number.isFinite(numeric) ? (numeric / peak) * 100 : 0;
          return (
            <div
              className="grid grid-cols-[72px_minmax(0,1fr)_auto] items-center gap-3"
              key={point.period}
            >
              <span className="text-[11px] font-semibold text-muted">
                {formatBusinessDate(point.period)}
              </span>
              <span className="h-2 overflow-hidden rounded-full bg-[#eef0f4]">
                <span
                  className="block h-full rounded-full bg-brand/70"
                  style={{ width: `${Math.max(width, 0)}%` }}
                />
              </span>
              <span className="text-right text-[11px] font-semibold tabular-nums text-ink">
                {formatAmount(point.value, metric.unit)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MetricDetail({
  gateway,
  metricId,
  onBack,
}: {
  gateway: AnalyticsGateway;
  metricId: string;
  onBack(): void;
}) {
  const [result, setResult] = useState<MetricDetailResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // The parent remounts this component per metric, so no synchronous reset is needed here.
  useEffect(() => {
    const controller = new AbortController();
    gateway
      .getMetric(metricId, controller.signal)
      .then((loaded) => {
        setResult(loaded);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setError(cause instanceof Error ? cause.message : "The measure could not be loaded");
      });
    return () => controller.abort();
  }, [gateway, metricId]);

  const back = (
    <button
      className="mb-4 inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-[11px] font-semibold text-ink outline-none focus-visible:ring-2 focus-visible:ring-brand"
      onClick={onBack}
    >
      ← All measures
    </button>
  );

  if (error) {
    return (
      <section className="mt-7">
        {back}
        <EmptyPanel title="This measure could not be loaded" description={error} />
      </section>
    );
  }

  if (!result) {
    return (
      <section className="mt-7">
        {back}
        <EmptyPanel title="Loading measure…" description="Reading the verified source data." />
      </section>
    );
  }

  if (result.state === "unavailable") {
    return (
      <section className="mt-7">
        {back}
        <EmptyPanel title="No analytics have been built yet" description={result.detail} />
      </section>
    );
  }

  const { metric } = result;
  const d = metric.definition;
  const partial = d.coverage_state === "PARTIAL";

  return (
    <section className="mt-7">
      {back}
      <div className="rounded-2xl border border-line bg-white p-5 sm:p-7">
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-brand">
          {d.source_system}
        </p>
        <h2 className="mt-2 text-[clamp(22px,2.4vw,30px)] font-semibold tracking-[-0.04em] text-ink">
          {d.label}
        </h2>
        <strong className="mt-3 block text-[clamp(28px,3.4vw,42px)] font-semibold tracking-[-0.045em] text-ink">
          {formatAmount(metric.total, metric.unit)}
        </strong>
        <p className="mt-1.5 text-[11px] text-muted">
          {metric.first_day && metric.last_day
            ? `${formatBusinessDate(metric.first_day)} to ${formatBusinessDate(metric.last_day)} · ${metric.distinct_days} days of data`
            : "No dated coverage"}
        </p>
        <p className="mt-4 max-w-[70ch] text-[12px] leading-[1.7] text-ink">{d.business_meaning}</p>

        {partial ? (
          <div className="mt-5 rounded-xl border border-[#e6d6aa] bg-amber-soft px-4 py-3">
            <strong className="block text-[11px] font-bold text-[#77591d]">Source limits</strong>
            <p className="mt-1.5 text-[11px] leading-[1.6] text-[#77591d]">{d.coverage_note}</p>
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-[#bfe3cd] bg-[#e8f7ee] px-4 py-3">
            <strong className="block text-[11px] font-bold text-[#1c6238]">
              Complete coverage
            </strong>
            <p className="mt-1.5 text-[11px] leading-[1.6] text-[#1c6238]">{d.coverage_note}</p>
          </div>
        )}
      </div>

      <MonthlyBreakdown metric={metric} />

      <div className="mt-6 rounded-2xl border border-line bg-white p-5 sm:p-7">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted">
          Calculation details
        </h3>
        <dl className="mt-3">
          <Row label="Formula">
            <code className="rounded bg-[#f3f4f7] px-2 py-1 text-[11px]">{d.formula}</code>
          </Row>
          <Row label="Population">{d.population}</Row>
          <Row label="Includes">
            <List items={d.inclusions} />
          </Row>
          <Row label="Excludes">
            <List items={d.exclusions} />
          </Row>
          <Row label="Known limits">
            <List items={d.known_limitations} />
          </Row>
          <Row label="Source files">
            <List items={d.source_files} />
          </Row>
          <Row label="Fields used">{d.source_fields.join(", ")}</Row>
          <Row label="Missing values">{d.null_treatment}</Row>
          <Row label="Duplicates">{d.duplicate_treatment}</Row>
          <Row label="Rounding">{d.rounding}</Row>
          <Row label="Time basis">{d.timezone_basis}</Row>
          <Row label="Drill-down">{d.drill_down}</Row>
          <Row label="Definition version">{d.definition_version}</Row>
        </dl>
      </div>

      <div className="mt-6 rounded-2xl border border-line bg-white p-5 sm:p-7">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted">
          Row accounting
        </h3>
        <p className="mt-1 text-[11px] text-muted">
          Every input row is accounted for. Rows that could not be parsed are quarantined with a
          reason and are never silently dropped.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            ["Input rows", metric.quality.input_rows],
            ["Accepted", metric.quality.accepted_rows],
            ["Quarantined", metric.quality.quarantined_rows],
          ].map(([label, value]) => (
            <div className="rounded-xl border border-line bg-canvas px-4 py-3" key={String(label)}>
              <span className="block text-[10px] font-bold uppercase tracking-[0.08em] text-muted">
                {label}
              </span>
              <strong className="mt-1 block text-lg font-semibold tabular-nums text-ink">
                {Number(value).toLocaleString("en-US")}
              </strong>
            </div>
          ))}
        </div>
        {Object.keys(metric.quality.warning_counts).length > 0 ? (
          <div className="mt-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted">
              Warnings retained
            </span>
            <ul className="mt-2 grid gap-1.5">
              {Object.entries(metric.quality.warning_counts).map(([code, count]) => (
                <li className="flex justify-between gap-4 text-[11px] text-ink" key={code}>
                  <span className="font-mono">{code}</span>
                  <span className="tabular-nums">{count}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
