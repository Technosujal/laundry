import type { ReactNode } from "react";

import {
  brightAccentColor,
  formatExact,
  formatValue,
  SourceBadge,
  type SourceSystem,
  type Unit,
} from "./primitives";

export function CoverageBadge({ state, label }: { state: "COMPLETE" | "PARTIAL"; label?: string }) {
  const partial = state === "PARTIAL";
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[9px] font-bold ${
        partial
          ? "border-[#e6d6aa] bg-amber-soft text-[#77591d]"
          : "border-[#cce4bb] bg-[#edf8e6] text-[#315f27]"
      }`}
    >
      <span
        className={`h-[5px] w-[5px] rounded-full ${partial ? "bg-[#c58a1d]" : "bg-[#2f9e5f]"}`}
      />
      {label ?? (partial ? "Source limits" : "Complete")}
    </span>
  );
}

export function KpiCard({
  label,
  value,
  unit,
  context,
  accent = "#355f86",
  coverage,
  onExplain,
  emphasis = false,
  precision = "compact",
  source,
  icon,
  trend,
}: {
  label: string;
  value: number | string;
  unit: Unit;
  context?: ReactNode;
  accent?: string;
  coverage?: "COMPLETE" | "PARTIAL";
  onExplain?: () => void;
  emphasis?: boolean;
  precision?: "compact" | "exact";
  /** The vendor export this figure came from. */
  source?: SourceSystem;
  /** Optional executive-card icon. Decorative content should be passed with aria-hidden. */
  icon?: ReactNode;
  /** A verified comparison whose period is named in the accessible label and tooltip. */
  trend?: { value: string; label: string; direction: "up" | "down" | "flat" };
}) {
  const resolvedAccent = brightAccentColor(accent);
  const trendTone =
    trend?.direction === "up"
      ? "border-[#16a34a] bg-[#16a34a] text-white shadow-[0_3px_10px_rgba(22,163,74,0.22)]"
      : trend?.direction === "down"
        ? "border-[#dc2626] bg-[#dc2626] text-white shadow-[0_3px_10px_rgba(220,38,38,0.22)]"
        : "border-line bg-canvas text-muted";

  return (
    <div
      className={`motion-card group relative flex min-w-0 flex-col overflow-hidden rounded-[14px] border border-line bg-white p-4 shadow-[0_5px_18px_rgba(29,47,78,0.035)] transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:border-[#cbd8e9] hover:shadow-[0_10px_28px_rgba(29,47,78,0.065)] sm:p-[18px] ${
        emphasis ? "sm:col-span-2" : ""
      }`}
    >
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-[2px] opacity-85"
        style={{ background: resolvedAccent }}
      />
      <div className="flex flex-wrap items-start justify-between gap-2">
        {icon ? (
          <span
            className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] transition-[transform,filter,box-shadow] duration-200 group-hover:brightness-105"
            style={{ background: `${resolvedAccent}18`, color: resolvedAccent }}
          >
            {icon}
          </span>
        ) : (
          <span className="min-w-0 text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
            {label}
          </span>
        )}
        <span className="flex shrink-0 items-center gap-1.5">
          {trend ? (
            <span
              aria-label={`${trend.value}, ${trend.label}`}
              className={`rounded-full border px-2 py-1 text-[9px] font-bold tabular-nums ${trendTone}`}
              title={trend.label}
            >
              {trend.value}{" "}
              {trend.direction === "up" ? "↗" : trend.direction === "down" ? "↘" : "→"}
            </span>
          ) : null}
          {source ? <SourceBadge source={source} /> : null}
          {coverage ? <CoverageBadge state={coverage} /> : null}
        </span>
      </div>
      {icon ? (
        <span className="mt-3 text-[10px] font-bold uppercase tracking-[0.08em] text-muted">
          {label}
        </span>
      ) : null}
      <strong
        className={`${icon ? "mt-1" : "mt-2.5"} block font-semibold tracking-[-0.045em] text-ink ${
          emphasis ? "text-[clamp(28px,3.2vw,40px)]" : "text-[clamp(22px,2.1vw,28px)]"
        }`}
      >
        {precision === "exact" ? formatExact(value, unit) : formatValue(value, unit)}
      </strong>
      {context ? (
        <span className="mt-1 block text-[11px] leading-[1.45] text-muted">{context}</span>
      ) : null}
      {onExplain ? (
        <button
          className="mt-auto pt-2.5 text-left text-[11px] font-semibold text-brand outline-none focus-visible:underline"
          onClick={onExplain}
          type="button"
        >
          View calculation →
        </button>
      ) : null}
    </div>
  );
}
