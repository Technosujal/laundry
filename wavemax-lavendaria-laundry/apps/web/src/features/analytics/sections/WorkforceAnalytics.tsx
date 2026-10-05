import { ChartPanel, RankedBars } from "../../../components/charts/primitives";
import { KpiCard } from "../../../components/charts/KpiCard";
import type { Workforce } from "../analytics-gateway";

export function WorkforceAnalytics({ workforce }: { workforce: Workforce }) {
  const w = workforce;
  const staffed = w.by_employee.filter((row) => Number(row.hours) > 0);

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          accent="#355f86"
          context={`From ${w.plausible_entries.toLocaleString("en-US")} credible clock entries`}
          coverage="PARTIAL"
          label="Recorded labour hours"
          unit="HOURS"
          value={w.plausible_hours}
        />
        <KpiCard
          accent="#355f86"
          context="Staff with at least one clock entry"
          label="Staff recorded"
          unit="COUNT"
          value={w.employee_count}
        />
        <KpiCard
          accent="#c2410c"
          context="Longer than 16 hours, zero, or negative"
          label="Entries excluded"
          unit="COUNT"
          value={w.excluded_entries}
        />
        <KpiCard
          accent="#355f86"
          context="What the raw source claims before exclusions"
          label="Raw source total"
          unit="HOURS"
          value={w.reported_total_hours}
        />
      </div>

      <div className="rounded-2xl border border-[#e6d6aa] bg-amber-soft px-5 py-4">
        <strong className="block text-[11px] font-bold text-[#77591d]">
          The raw timesheet total cannot be used as it stands
        </strong>
        <p className="mt-1.5 max-w-[80ch] text-[11px] leading-[1.7] text-[#77591d]">
          The source reports {Number(w.reported_total_hours).toLocaleString("en-US")} hours, but{" "}
          {w.excluded_entries} entries account for{" "}
          {Number(w.excluded_hours).toLocaleString("en-US")} of those hours on their own. They are
          almost certainly missed clock-outs. They are excluded from the published figure, counted
          here, and never deleted from the record.
        </p>
      </div>

      <ChartPanel
        coverage="Staff are identified by a stable reference. Employee names are never published to the interface."
        subtitle="Recorded hours per person, after excluding implausible entries."
        title="Hours by staff member"
        unit="hours"
      >
        <RankedBars
          accent="#355f86"
          points={staffed.map((row) => ({
            label: row.employee_key,
            value: Number(row.hours),
            caption: `${row.entries} entries${row.excluded_entries ? ` · ${row.excluded_entries} excluded` : ""}`,
          }))}
          unit="HOURS"
        />
      </ChartPanel>

      <ChartPanel
        subtitle="Every input row is accounted for, with warnings retained rather than dropped."
        title="Timesheet reliability"
      >
        <div className="grid grid-cols-3 gap-3">
          {[
            ["Input rows", w.quality.input_rows],
            ["Accepted", w.quality.accepted_rows],
            ["Quarantined", w.quality.quarantined_rows],
          ].map(([label, value]) => (
            <div
              className="rounded-xl border border-line bg-canvas px-3.5 py-3"
              key={String(label)}
            >
              <span className="block text-[9px] font-bold uppercase tracking-[0.08em] text-muted">
                {label}
              </span>
              <strong className="mt-1 block text-[16px] font-semibold tabular-nums text-ink">
                {Number(value).toLocaleString("en-US")}
              </strong>
            </div>
          ))}
        </div>
        {Object.keys(w.quality.warning_counts).length > 0 ? (
          <ul className="mt-4 grid gap-1.5">
            {Object.entries(w.quality.warning_counts).map(([code, count]) => (
              <li
                className="flex items-center justify-between gap-4 rounded-lg bg-canvas px-3.5 py-2 text-[11px]"
                key={code}
              >
                <span className="text-ink">{code.replaceAll("_", " ").toLowerCase()}</span>
                <span className="font-semibold tabular-nums text-ink">{count}</span>
              </li>
            ))}
          </ul>
        ) : null}
        <ul className="mt-4 grid gap-2">
          {w.definition.known_limitations.map((item) => (
            <li className="flex gap-2 text-[11px] leading-[1.6] text-muted" key={item}>
              <span aria-hidden="true">·</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </ChartPanel>
    </div>
  );
}
