import { useEffect, useState } from "react";

import type { AppRole } from "../../app/auth/session-types";
import { EmptyPanel } from "../../components/ui/EmptyPanel";
import type { AnalyticsGateway, OverviewResult } from "../analytics/analytics-gateway";

export function WorkforcePage({ gateway, role }: { gateway: AnalyticsGateway; role: AppRole }) {
  const [result, setResult] = useState<OverviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (role !== "OWNER") return;
    const controller = new AbortController();
    gateway
      .getOverview(controller.signal)
      .then(setResult)
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setError(cause instanceof Error ? cause.message : "Workforce data could not be loaded");
      });
    return () => controller.abort();
  }, [gateway, role]);

  if (role === "EMPLOYEE") {
    return (
      <EmptyPanel
        title="Your workforce records are not linked yet"
        description="An owner must link your invited account to an employee record before your schedule, time, and leave can be shown."
      />
    );
  }

  // A manager may only see their own direct reports. The supplied timesheet carries no
  // manager-assignment mapping, so a per-manager view cannot be produced truthfully. Showing
  // store-wide hours to a manager would breach the access rule, so nothing is shown instead.
  if (role !== "OWNER") {
    return (
      <EmptyPanel
        title="Your team's hours are not available yet"
        description={
          "A manager may only see employees assigned to them. The supplied timesheet has no " +
          "manager-assignment mapping, so a correctly scoped team view cannot be produced from " +
          "it. Store-wide hours are deliberately not shown here, because that would exceed your " +
          "permitted scope."
        }
      />
    );
  }

  if (error) {
    return <EmptyPanel title="Workforce data could not be loaded" description={error} />;
  }
  if (!result) {
    return (
      <EmptyPanel title="Loading workforce data…" description="Reading the timesheet source." />
    );
  }
  if (result.state === "unavailable") {
    return <EmptyPanel title="No workforce data has been built yet" description={result.detail} />;
  }

  const w = result.workforce;
  const d = w.definition;

  return (
    <section className="mt-7">
      <div className="rounded-2xl border border-line bg-white p-5 sm:p-7">
        <p className="text-xs font-bold uppercase tracking-[0.1em] text-brand">WDF POS</p>
        <h3 className="mt-1.5 text-[clamp(18px,2.2vw,26px)] font-semibold tracking-[-0.03em] text-ink">
          {d.label}
        </h3>
        <strong className="mt-3 block text-[clamp(28px,3.4vw,40px)] font-semibold tracking-[-0.045em] text-ink">
          {Number(w.plausible_hours).toLocaleString("en-US")} hours
        </strong>
        <p className="mt-1.5 text-sm leading-6 text-muted">
          From {w.plausible_entries.toLocaleString("en-US")} credible clock entries across{" "}
          {w.employee_count} staff.
        </p>

        <div className="mt-5 rounded-xl border border-[#e6d6aa] bg-amber-soft px-4 py-3">
          <strong className="block text-sm font-bold text-[#77591d]">
            The raw timesheet total is not usable
          </strong>
          <p className="mt-1.5 text-sm leading-6 text-[#77591d]">
            The source reports{" "}
            <strong>{Number(w.reported_total_hours).toLocaleString("en-US")} hours</strong>, but{" "}
            {w.excluded_entries} entries are longer than 16 hours, exactly zero, or negative, and
            those alone account for{" "}
            <strong>{Number(w.excluded_hours).toLocaleString("en-US")} hours</strong>. They are
            almost certainly missed clock-outs. They are excluded from the figure above, counted
            here, and never deleted.
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-line bg-white p-5 sm:p-7">
        <h4 className="text-xs font-bold uppercase tracking-[0.1em] text-muted">
          Hours by employee
        </h4>
        <p className="mt-1 text-sm leading-6 text-muted">
          Staff are shown by a stable reference rather than by name; the timesheet's personal data
          is never published to the interface.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left text-muted">
                <th className="pb-2 font-semibold">Staff reference</th>
                <th className="pb-2 text-right font-semibold">Hours</th>
                <th className="pb-2 text-right font-semibold">Entries</th>
                <th className="pb-2 text-right font-semibold">Excluded</th>
              </tr>
            </thead>
            <tbody>
              {w.by_employee.map((row) => (
                <tr className="border-b border-line/60 last:border-b-0" key={row.employee_key}>
                  <td className="py-2 font-mono text-[11px] text-ink">{row.employee_key}</td>
                  <td className="py-2 text-right font-semibold tabular-nums text-ink">
                    {Number(row.hours).toLocaleString("en-US")}
                  </td>
                  <td className="py-2 text-right tabular-nums text-muted">{row.entries}</td>
                  <td className="py-2 text-right tabular-nums text-[#77591d]">
                    {row.excluded_entries || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-line bg-white p-5 sm:p-7">
        <h4 className="text-xs font-bold uppercase tracking-[0.1em] text-muted">Data limits</h4>
        <ul className="mt-3 grid gap-2">
          {d.known_limitations.map((item) => (
            <li className="flex gap-2 text-sm leading-6 text-ink" key={item}>
              <span aria-hidden="true" className="text-muted">
                ·
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            ["Input rows", w.quality.input_rows],
            ["Accepted", w.quality.accepted_rows],
            ["Quarantined", w.quality.quarantined_rows],
          ].map(([label, value]) => (
            <div
              className="rounded-xl border border-line bg-canvas px-3 py-2.5"
              key={String(label)}
            >
              <span className="block text-[9px] font-bold uppercase tracking-[0.08em] text-muted">
                {label}
              </span>
              <strong className="mt-0.5 block text-base font-semibold tabular-nums text-ink">
                {Number(value).toLocaleString("en-US")}
              </strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
