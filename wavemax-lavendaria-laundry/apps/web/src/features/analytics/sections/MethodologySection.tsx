import { formatExact } from "../../../components/charts/primitives";
import { CoverageBadge } from "../../../components/charts/KpiCard";
import type { AnalyticsSource, DataHealth, WdfSales } from "../analytics-gateway";

function qualityTone(state: DataHealth["results"][number]["display_state"]) {
  if (state === "PASS") return "text-emerald-700";
  if (state === "BLOCK") return "text-red-700";
  if (state === "REVIEW") return "text-amber-700";
  if (state === "NOTE") return "text-blue-700";
  return "text-slate-600";
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-line py-3 last:border-b-0 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-4">
      <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted">{label}</dt>
      <dd className="text-[11px] leading-[1.65] text-ink">{children}</dd>
    </div>
  );
}

function Bullets({ items }: { items: readonly string[] }) {
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

export function MethodologySection({
  sales,
  sources,
  runId,
  health,
}: {
  sales: WdfSales;
  sources: AnalyticsSource[];
  runId: string;
  health?: DataHealth | undefined;
}) {
  const d = sales.definition;
  const activeSources = sources.filter((source) => source.disposition === undefined);
  const reviewCount = health?.results.filter(
    (row) => row.status === "FAIL" && row.action_on_fail === "warn",
  ).length;
  const noteCount = health?.results.filter(
    (row) => row.status === "FAIL" && row.action_on_fail === "log",
  ).length;

  return (
    <div className="grid min-w-0 gap-4">
      {health ? (
        <section className="min-w-0 rounded-2xl border border-line bg-white p-5 shadow-[0_8px_25px_rgba(17,19,24,0.04)] sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-[15px] font-semibold tracking-[-0.02em] text-ink">
                Calculation controls
              </h3>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-[10px] font-bold ${
                health.blocking > 0 ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
              }`}
            >
              {health.blocking > 0 ? `${health.blocking} blocked` : "Publishable"}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:max-w-xl sm:grid-cols-4">
            {[
              ["Passed", health.pass, "text-emerald-700"],
              ["Review", reviewCount ?? 0, "text-amber-700"],
              ["Notes", noteCount ?? 0, "text-blue-700"],
              ["Blocked", health.blocking, "text-red-700"],
            ].map(([label, value, tone]) => (
              <div
                className="rounded-xl border border-line bg-canvas px-3 py-2"
                key={String(label)}
              >
                <span className="block text-[9px] font-bold uppercase tracking-[0.08em] text-muted">
                  {label}
                </span>
                <strong className={`mt-1 block text-[16px] ${tone}`}>{value}</strong>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-2 md:grid-cols-3">
            <div className="rounded-xl border border-line bg-canvas p-3">
              <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-muted">
                Repeated sales lines
              </span>
              <strong className="mt-1 block text-sm text-ink">Included</strong>
              <span className="mt-1 block text-[10px] tabular-nums text-muted">
                {sales.source_quality.duplicate_lines.toLocaleString("en-US")} lines ·{" "}
                {formatExact(sales.source_quality.duplicate_value, "CURRENCY_USD")}
              </span>
              <span className="mt-1 block text-[10px] text-muted">No stable line ID exists.</span>
            </div>
            <div className="rounded-xl border border-line bg-canvas p-3">
              <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-muted">
                Category conflicts
              </span>
              <strong className="mt-1 block text-sm text-ink">Category used</strong>
              <span className="mt-1 block text-[10px] tabular-nums text-muted">
                {sales.source_quality.category_flag_conflicts.toLocaleString("en-US")} lines ·{" "}
                {formatExact(sales.source_quality.category_flag_conflict_value, "CURRENCY_USD")}
              </span>
              <span className="mt-1 block text-[10px] text-muted">
                Category defines service grouping.
              </span>
            </div>
            <div className="rounded-xl border border-line bg-canvas p-3">
              <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-muted">
                Missing line fields
              </span>
              <strong className="mt-1 block text-sm text-ink">Included</strong>
              <span className="mt-1 block text-[10px] tabular-nums text-muted">
                {sales.source_quality.blank_units.toLocaleString("en-US")} units ·{" "}
                {sales.source_quality.blank_categories.toLocaleString("en-US")} categories
              </span>
              <span className="mt-1 block text-[10px] text-muted">
                Blanks remain visibly classified.
              </span>
            </div>
          </div>
          {sales.source_quality.duplicate_rows?.length ? (
            <details className="mt-3 rounded-xl border border-line bg-white">
              <summary className="cursor-pointer px-4 py-3 text-[11px] font-semibold text-ink">
                Review repeated sales lines ({sales.source_quality.duplicate_rows.length})
              </summary>
              <div className="overflow-x-auto border-t border-line px-4 pb-3">
                <table className="w-full min-w-[760px] border-collapse text-[10px]">
                  <caption className="sr-only">Repeated sales-line evidence</caption>
                  <thead>
                    <tr className="border-b border-line text-left text-muted">
                      <th className="py-2 pr-3 font-semibold" scope="col">
                        Source rows
                      </th>
                      <th className="py-2 pr-3 font-semibold" scope="col">
                        Order
                      </th>
                      <th className="py-2 pr-3 font-semibold" scope="col">
                        Paid date
                      </th>
                      <th className="py-2 pr-3 font-semibold" scope="col">
                        Item
                      </th>
                      <th className="py-2 pr-3 font-semibold" scope="col">
                        Category
                      </th>
                      <th className="py-2 text-right font-semibold" scope="col">
                        Included
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.source_quality.duplicate_rows.map((row) => (
                      <tr
                        className="border-b border-line/60 last:border-b-0"
                        key={`${row.original_row}-${row.repeated_row}`}
                      >
                        <td className="py-2 pr-3 tabular-nums text-muted">
                          {row.original_row} → {row.repeated_row}
                        </td>
                        <td className="py-2 pr-3 font-medium text-ink">{row.order_number}</td>
                        <td className="py-2 pr-3 text-muted">{row.paid_date.slice(0, 10)}</td>
                        <td className="py-2 pr-3 text-ink">{row.item_name}</td>
                        <td className="py-2 pr-3 text-muted">{row.category}</td>
                        <td className="py-2 text-right font-semibold tabular-nums text-ink">
                          {formatExact(row.subtotal, "CURRENCY_USD")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          ) : null}
          <div className="mt-4 min-w-0 overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-[10px]">
              <caption className="sr-only">Data-quality validation results</caption>
              <thead>
                <tr className="border-b border-line text-left text-muted">
                  <th className="pb-2 font-semibold" scope="col">
                    Check
                  </th>
                  <th className="pb-2 font-semibold" scope="col">
                    State
                  </th>
                  <th className="pb-2 font-semibold" scope="col">
                    Data use
                  </th>
                  <th className="pb-2 font-semibold" scope="col">
                    Rule reason
                  </th>
                  <th className="pb-2 font-semibold" scope="col">
                    Next step
                  </th>
                  <th className="pb-2 font-semibold" scope="col">
                    Evidence
                  </th>
                </tr>
              </thead>
              <tbody>
                {health.results.map((row) => {
                  return (
                    <tr className="border-b border-line/60 last:border-b-0" key={row.check_id}>
                      <td className="py-2 pr-3 font-medium text-ink">
                        {row.check_id} · {row.check}
                      </td>
                      <td className={`py-2 pr-3 font-bold ${qualityTone(row.display_state)}`}>
                        {row.display_state}
                      </td>
                      <td className="py-2 pr-3 font-semibold text-ink">
                        {row.data_use === "Partial" ? "Limited" : row.data_use}
                      </td>
                      <td className="py-2 pr-3 text-muted">{row.rule_reason}</td>
                      <td className="py-2 pr-3 text-ink">{row.next_step}</td>
                      <td className="py-2 text-muted">{row.detail}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="min-w-0 rounded-2xl border border-line bg-white p-5 shadow-[0_8px_25px_rgba(17,19,24,0.04)] sm:p-7">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-[15px] font-semibold tracking-[-0.02em] text-ink">
            How counter sales are calculated
          </h3>
          <CoverageBadge state={d.coverage_state} label={`${d.coverage_state} coverage`} />
        </div>
        <p className="mt-2 max-w-[74ch] text-[12px] leading-[1.75] text-ink">
          {d.business_meaning}
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {(
            [
              ["Counter sales", formatExact(sales.total, "CURRENCY_USD")],
              ["Order count", sales.order_count.toLocaleString("en-US")],
              ["Line items", sales.line_count.toLocaleString("en-US")],
            ] as const
          ).map(([label, value]) => (
            <div className="rounded-xl border border-line bg-canvas px-4 py-3" key={label}>
              <span className="block text-[9px] font-bold uppercase tracking-[0.08em] text-muted">
                {label}
              </span>
              <strong className="mt-1 block text-[17px] font-semibold tabular-nums text-ink">
                {value}
              </strong>
            </div>
          ))}
        </div>

        <dl className="mt-5">
          <Fact label="Formula">
            <code className="rounded bg-[#f3f4f7] px-2 py-1 text-[10px]">{d.formula}</code>
          </Fact>
          <Fact label="Population">{d.population}</Fact>
          <Fact label="Includes">
            <Bullets items={d.inclusions} />
          </Fact>
          <Fact label="Excludes">
            <Bullets items={d.exclusions} />
          </Fact>
          <Fact label="Known limits">
            <Bullets items={d.known_limitations} />
          </Fact>
          <Fact label="Missing values">{d.null_treatment}</Fact>
          <Fact label="Duplicates">{d.duplicate_treatment}</Fact>
          <Fact label="Rounding">{d.rounding}</Fact>
          <Fact label="Time basis">{d.timezone_basis}</Fact>
          <Fact label="Drill-down">{d.drill_down}</Fact>
          <Fact label="Definition version">{d.definition_version}</Fact>
          <Fact label="Analytics version">{sales.analytics.analytics_version}</Fact>
        </dl>
      </section>

      <section className="min-w-0 rounded-2xl border border-line bg-white p-5 shadow-[0_8px_25px_rgba(17,19,24,0.04)] sm:p-7">
        <h3 className="text-[15px] font-semibold tracking-[-0.02em] text-ink">
          Row accounting and reconciliation
        </h3>
        <p className="mt-1.5 text-[11px] text-muted">
          Paid-sales breakdowns reconcile to the paid-sales population. Other operational exports
          remain separately labelled because their populations and coverage differ.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Line items counted", sales.line_count],
            ["Distinct orders", sales.order_count],
            ["Refund or negative lines", sales.negative_lines],
            ["Zero-value lines", sales.zero_lines],
          ].map(([label, value]) => (
            <div
              className="rounded-xl border border-line bg-canvas px-3.5 py-3"
              key={String(label)}
            >
              <span className="block text-[9px] font-bold uppercase tracking-[0.08em] text-muted">
                {label}
              </span>
              <strong className="mt-1 block text-[15px] font-semibold tabular-nums text-ink">
                {Number(value).toLocaleString("en-US")}
              </strong>
            </div>
          ))}
        </div>
        <p className="mt-4 rounded-xl border border-line bg-canvas px-4 py-3 text-[11px] leading-[1.6] text-muted">
          Negative lines are refunds and discounts. They are retained inside the total rather than
          removed, which is why the figure reconciles exactly to the workbook's own summary sheet.
        </p>
      </section>

      <section className="min-w-0 rounded-2xl border border-line bg-white p-5 shadow-[0_8px_25px_rgba(17,19,24,0.04)] sm:p-7">
        <h3 className="text-[15px] font-semibold tracking-[-0.02em] text-ink">
          Source files behind this dashboard
        </h3>
        <p className="mt-1.5 text-[11px] text-muted">
          WDF POS and LaundroPortal remain separate source systems. Every active source is verified
          by content fingerprint at build time.
        </p>
        <div className="mt-4 min-w-0 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-[10px]">
            <caption className="sr-only">Source files used by this dashboard</caption>
            <thead>
              <tr className="border-b border-line text-left text-muted">
                <th className="pb-2 font-semibold" scope="col">
                  File
                </th>
                <th className="pb-2 font-semibold" scope="col">
                  Source
                </th>
                <th className="pb-2 text-right font-semibold" scope="col">
                  Size
                </th>
                <th className="pb-2 text-right font-semibold" scope="col">
                  SHA-256
                </th>
                <th className="pb-2 text-right font-semibold" scope="col">
                  Parser
                </th>
              </tr>
            </thead>
            <tbody>
              {activeSources.map((source) => (
                <tr className="border-b border-line/60 last:border-b-0" key={source.file}>
                  <td className="py-2 pr-3 text-ink">{source.file}</td>
                  <td className="py-2 pr-3 text-muted">{source.source_system}</td>
                  <td className="py-2 text-right tabular-nums text-muted">
                    {(source.size_bytes / 1024).toFixed(0)} KB
                  </td>
                  <td className="py-2 text-right font-mono text-muted">
                    {source.sha256.slice(0, 12)}…
                  </td>
                  <td className="py-2 text-right font-mono text-muted">{source.parser_version}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-[10px] text-muted">Build reference {runId.slice(0, 16)}</p>
      </section>
    </div>
  );
}
