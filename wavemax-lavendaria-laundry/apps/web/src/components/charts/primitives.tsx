import type { ReactNode } from "react";
import { useEffect, useId, useRef, useState } from "react";

/**
 * Small, dependency-free chart primitives.
 *
 * These render values that the analytics service has already computed. They never derive an
 * authoritative figure in the browser; they only position and label what they are given.
 */

/** PERCENT is a signed change; SHARE is a plain proportion and never carries a sign. */
export type Unit = "CURRENCY_USD" | "COUNT" | "POUNDS" | "HOURS" | "PERCENT" | "SHARE";
export type DataView = "visual" | "table";

/**
 * Bright presentation equivalents for the legacy muted chart palette.
 *
 * Report components can keep their established source/category colours while every shared
 * visual renders with the clearer, higher-chroma product palette. This is deliberately a
 * presentation-only translation: values, series order and interaction semantics stay intact.
 */
const BRIGHT_CHART_COLORS: Record<string, string> = {
  "#355f86": "#2563eb",
  "#66556f": "#7c3aed",
  "#49747a": "#0d9488",
  "#4f7462": "#10b981",
  "#906b45": "#f59e0b",
  "#967246": "#f59e0b",
  "#a67f4c": "#f97316",
  "#9a7b60": "#fb923c",
  "#4f7770": "#14b8a6",
  "#6b5b73": "#8b5cf6",
  "#75806f": "#22c55e",
  "#7a6758": "#f97316",
  "#7f7086": "#8b5cf6",
  "#594962": "#6d28d9",
  "#8f8195": "#a78bfa",
  "#75647d": "#9333ea",
  "#504259": "#5b21b6",
  "#8c7698": "#a855f7",
  "#c8becb": "#c4b5fd",
  "#7892a8": "#60a5fa",
  "#567d72": "#10b981",
  "#b1842f": "#f59e0b",
  "#778492": "#3b82f6",
  "#9a6848": "#f97316",
  "#9fb0bf": "#06b6d4",
  "#66717a": "#0ea5e9",
  "#55766f": "#10b981",
  "#6b4e8a": "#7c3aed",
  "#a47742": "#f59e0b",
  "#685a78": "#8b5cf6",
  "#6e557e": "#9333ea",
  "#6d7480": "#06b6d4",
  "#c2410c": "#ef4444",
};

export function brightAccentColor(color: string): string {
  return BRIGHT_CHART_COLORS[color.toLowerCase()] ?? color;
}

export function DataViewToggle({
  value,
  onChange,
  label = "Display",
}: {
  value: DataView;
  onChange: (value: DataView) => void;
  label?: string;
}) {
  return (
    <div
      aria-label={label}
      className="inline-flex rounded-lg border border-line bg-canvas p-0.5"
      role="group"
    >
      {(["visual", "table"] as const).map((option) => (
        <button
          aria-pressed={value === option}
          className={`rounded-md px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.05em] transition ${
            value === option ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"
          }`}
          key={option}
          onClick={() => onChange(option)}
          type="button"
        >
          {option === "visual" ? "Chart" : "Table"}
        </button>
      ))}
    </div>
  );
}

export function PointTable({
  points,
  unit,
  label = "Period",
}: {
  points: Point[];
  unit: Unit;
  label?: string;
}) {
  return (
    <div className="max-h-[280px] overflow-auto">
      <table className="w-full border-collapse text-[11px]">
        <thead className="sticky top-0 bg-white text-left text-muted">
          <tr className="border-b border-line">
            <th className="pb-2 font-semibold">{label}</th>
            <th className="pb-2 text-right font-semibold">Value</th>
            <th className="pb-2 text-right font-semibold">Context</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point, index) => (
            <tr className="border-b border-line/60 last:border-0" key={`${point.label}-${index}`}>
              <td className="py-2 font-medium text-ink">{point.label}</td>
              <td className="py-2 text-right font-semibold tabular-nums text-ink">
                {formatExact(point.value, unit)}
              </td>
              <td className="py-2 text-right text-muted">{point.caption ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function formatValue(value: number | string, unit: Unit): string {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return String(value);
  switch (unit) {
    case "CURRENCY_USD":
      return numeric.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: numeric >= 1000 ? 0 : 2,
      });
    case "PERCENT":
      return `${numeric > 0 ? "+" : ""}${numeric.toFixed(1)}%`;
    case "SHARE":
      return `${numeric.toFixed(1)}%`;
    case "POUNDS":
      return `${numeric.toLocaleString("en-US", { maximumFractionDigits: 0 })} lb`;
    case "HOURS":
      return `${numeric.toLocaleString("en-US", { maximumFractionDigits: 1 })} h`;
    default:
      return numeric.toLocaleString("en-US");
  }
}

export function formatExact(value: number | string, unit: Unit): string {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return String(value);
  if (unit === "CURRENCY_USD") {
    return numeric.toLocaleString("en-US", { style: "currency", currency: "USD" });
  }
  return formatValue(numeric, unit);
}

/** Product-wide calendar label: ISO ordering with an English month name. */
export function formatBusinessDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;
  const [, year, month, day] = match;
  const monthName = new Intl.DateTimeFormat("en-US", {
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${year}-${month}-01T00:00:00Z`));
  return `${year}-${monthName}-${day}`;
}

/**
 * Which vendor export a figure came from.
 *
 * Two systems feed this product and they measure different things: WDF POS records counter
 * sales and orders, LaundroPortal records machine and stored-value activity. A reader who
 * cannot tell them apart can easily read one system's total as the whole business, so every
 * panel says which one it is built from.
 */
export type SourceSystem = "WDF POS" | "LaundroPortal";

const SOURCE_TONES: Record<SourceSystem, string> = {
  "WDF POS": "border-[#bfdbfe] bg-[#eff6ff] text-[#2563eb]",
  LaundroPortal: "border-[#e9d5ff] bg-[#faf5ff] text-[#7c3aed]",
};

export function SourceBadge({ source }: { source: SourceSystem }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.06em] ${SOURCE_TONES[source]}`}
      title={`Every figure in this panel comes from ${source}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {source}
    </span>
  );
}

/** Wraps a chart with its title, plain-English subtitle, coverage and optional action. */
export function ChartPanel({
  title,
  subtitle,
  unit,
  coverage,
  action,
  source,
  children,
  className = "",
}: {
  title: string;
  subtitle: string;
  unit?: string;
  coverage?: string;
  action?: ReactNode;
  /** The vendor export behind every figure in this panel. */
  source?: SourceSystem;
  children: ReactNode;
  className?: string;
}) {
  const panelRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === "undefined");

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      { threshold: 0.12 },
    );
    observer.observe(panel);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      className={`chart-panel motion-panel flex h-full min-w-0 flex-col self-stretch rounded-[14px] border border-line bg-white p-4 shadow-[0_5px_18px_rgba(29,47,78,0.035)] transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:border-[#cbd8e9] hover:shadow-[0_10px_28px_rgba(29,47,78,0.06)] sm:p-[18px] ${className}`}
      data-chart-visible={visible}
      ref={panelRef}
    >
      <header className="mb-3.5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-[15px] font-bold tracking-[-0.025em] text-ink">{title}</h3>
          <p className="mt-1 max-w-[62ch] text-[11px] leading-[1.55] text-muted">{subtitle}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {source ? <SourceBadge source={source} /> : null}
          {unit ? (
            <span className="rounded-full border border-line bg-canvas px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.06em] text-muted">
              {unit}
            </span>
          ) : null}
          {action}
        </div>
      </header>
      {children}
      {coverage ? (
        <p className="mt-auto border-t border-line pt-3 text-[11px] leading-[1.6] text-muted">
          {coverage}
        </p>
      ) : null}
    </section>
  );
}

export interface Point {
  label: string;
  value: number;
  caption?: string;
  /** Optional per-mark colour for ordered highlights such as first, second and third place. */
  color?: string;
  /**
   * The value this point filters on, when it differs from its axis label. A monthly column is
   * labelled "06" but filters on "2025-06"; without this the chip would name a label that no
   * row actually carries.
   */
  filterValue?: string;
}

/**
 * Click-to-filter, shared by every chart type.
 *
 * A chart that is given `onSelect` becomes interactive: clicking a mark filters the whole
 * section by it, and clicking the selected mark again clears it. Charts without `onSelect`
 * stay read-only, so nothing becomes clickable by accident.
 */
export interface Selectable {
  onSelect?: (point: Point) => void;
  /** The currently filtered value on this chart's dimension, or null when unfiltered. */
  selectedValue?: string | null;
}

/** Screen-reader label that says what a click will do, so the affordance is not visual only. */
function selectLabel(point: Point, unit: Unit, interactive: boolean, isSelected: boolean): string {
  const base = `${point.label}: ${formatExact(point.value, unit)}`;
  if (!interactive) return base;
  return `${base}. ${isSelected ? "Selected. Activate to clear the filter" : "Activate to filter by this"}`;
}

/** The value a point filters on: its explicit filter value, else its own label. */
export function filterValueOf(point: Point): string {
  return point.filterValue ?? point.label;
}

function selectionState(
  point: Point,
  selectedValue: string | null | undefined,
  interactive: boolean,
): { isSelected: boolean; dimmed: boolean } {
  if (!interactive || selectedValue === null || selectedValue === undefined) {
    return { isSelected: false, dimmed: false };
  }
  const isSelected = filterValueOf(point) === selectedValue;
  return { isSelected, dimmed: !isSelected };
}

/** Horizontal ranked bars. Used where the category name needs room to be readable. */
export function RankedBars({
  points,
  unit,
  accent = "#355f86",
  max: providedMax,
  onSelect,
  selectedValue,
}: {
  points: Point[];
  unit: Unit;
  accent?: string;
  max?: number;
} & Selectable) {
  const [active, setActive] = useState<number | null>(null);
  if (points.length === 0) return <EmptyChart />;
  const max = providedMax ?? Math.max(...points.map((p) => Math.abs(p.value)), 0);
  const interactive = onSelect !== undefined;
  const resolvedAccent = brightAccentColor(accent);
  return (
    <ul className="grid gap-2.5">
      {points.map((point, index) => {
        const width = max > 0 ? (Math.abs(point.value) / max) * 100 : 0;
        const negative = point.value < 0;
        const isActive = active === index;
        const { isSelected, dimmed } = selectionState(point, selectedValue, interactive);
        return (
          <li className="relative" key={point.label}>
            <button
              aria-label={selectLabel(point, unit, interactive, isSelected)}
              aria-pressed={interactive ? isSelected : undefined}
              className={`grid w-full gap-1 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${interactive ? "cursor-pointer" : "cursor-default"}`}
              onBlur={() => setActive(null)}
              onClick={interactive ? () => onSelect(point) : undefined}
              onFocus={() => setActive(index)}
              onMouseEnter={() => setActive(index)}
              onMouseLeave={() => setActive(null)}
              type="button"
            >
              <span className="flex items-baseline justify-between gap-3">
                <span
                  className={`min-w-0 truncate text-[11px] ${isSelected ? "font-bold" : "font-medium"} ${dimmed ? "text-muted" : "text-ink"}`}
                >
                  {point.label}
                </span>
                <span className="shrink-0 text-[11px] font-semibold tabular-nums text-ink">
                  {formatValue(point.value, unit)}
                </span>
              </span>
              <span className="block h-2 overflow-hidden rounded-full bg-[#eef0f4]">
                <span
                  className="chart-reveal-x block h-full rounded-full transition-[width,opacity] duration-500 motion-reduce:transition-none"
                  style={{
                    width: `${width}%`,
                    background: negative
                      ? "#ef4444"
                      : brightAccentColor(point.color ?? resolvedAccent),
                    opacity: dimmed ? 0.3 : active === null || isActive || isSelected ? 1 : 0.5,
                  }}
                />
              </span>
              {point.caption ? (
                <span className="block text-[10px] text-muted">{point.caption}</span>
              ) : null}
            </button>
            {isActive ? (
              <span className="pointer-events-none absolute right-0 top-0 z-20 -translate-y-[85%] rounded-lg border border-line bg-white px-2.5 py-1.5 text-right shadow-panel">
                <span className="block text-[10px] font-bold text-ink">{point.label}</span>
                <span className="block text-[11px] font-semibold tabular-nums text-ink">
                  {formatExact(point.value, unit)}
                </span>
                {point.caption ? (
                  <span className="mt-0.5 block text-[9px] text-muted">{point.caption}</span>
                ) : null}
              </span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

/** Vertical column chart with hover and keyboard-reachable values. */
export function ColumnChart({
  points,
  unit,
  accent = "#355f86",
  height = 136,
  labelEvery = 1,
  onSelect,
  selectedValue,
}: {
  points: Point[];
  unit: Unit;
  accent?: string;
  height?: number;
  labelEvery?: number;
} & Selectable) {
  const [active, setActive] = useState<number | null>(null);
  if (points.length === 0) return <EmptyChart />;
  const max = Math.max(...points.map((p) => p.value), 0);
  const interactive = onSelect !== undefined;
  const resolvedAccent = brightAccentColor(accent);

  const activePoint = active === null ? null : points[active];
  const activePct =
    activePoint === null || activePoint === undefined
      ? 0
      : max > 0
        ? (activePoint.value / max) * 100
        : 0;
  // A tall column leaves no room above it, so the tooltip drops just inside the column instead
  // of being pushed out of the plot and clipped.
  const tall = activePct > 66;
  // Keep the card inside the plot horizontally: the outermost columns anchor to their own edge
  // rather than centring, which would otherwise hang past the panel.
  const edge =
    active === null
      ? "none"
      : active <= 1
        ? "left"
        : active >= points.length - 2
          ? "right"
          : "none";

  return (
    <div className="min-w-0">
      {/* The tooltip lives outside the clipping row, so it is never cut off by it. */}
      <div className="relative" style={{ height }}>
        <div
          className="flex h-full items-end gap-[3px] overflow-hidden"
          role="img"
          aria-label={`Column chart with ${points.length} periods`}
        >
          {points.map((point, index) => {
            const pct = max > 0 ? (point.value / max) * 100 : 0;
            const isActive = active === index;
            const { isSelected, dimmed } = selectionState(point, selectedValue, interactive);
            return (
              <button
                aria-label={selectLabel(point, unit, interactive, isSelected)}
                aria-pressed={interactive ? isSelected : undefined}
                className={`group relative flex h-full flex-1 flex-col justify-end rounded-t-[3px] outline-none focus-visible:ring-2 focus-visible:ring-brand ${interactive ? "cursor-pointer" : "cursor-default"}`}
                key={`${point.filterValue ?? point.label}-${index}`}
                onBlur={() => setActive(null)}
                onClick={interactive ? () => onSelect(point) : undefined}
                onFocus={() => setActive(index)}
                onMouseEnter={() => setActive(index)}
                onMouseLeave={() => setActive(null)}
                type="button"
              >
                <span
                  className="chart-reveal-y w-full rounded-t-[3px] transition-[height,opacity] duration-500 motion-reduce:transition-none"
                  style={{
                    height: `${Math.max(pct, point.value > 0 ? 1.5 : 0)}%`,
                    background: brightAccentColor(point.color ?? resolvedAccent),
                    opacity: dimmed ? 0.28 : active === null || isActive || isSelected ? 1 : 0.42,
                    outline: isSelected ? `2px solid ${resolvedAccent}` : undefined,
                    outlineOffset: isSelected ? "1px" : undefined,
                  }}
                />
              </button>
            );
          })}
        </div>
        {activePoint ? (
          <span
            className="pointer-events-none absolute z-20 w-max max-w-[200px] rounded-lg border border-line bg-white px-2.5 py-1.5 text-left shadow-panel"
            style={{
              left:
                edge === "left"
                  ? 0
                  : edge === "right"
                    ? "auto"
                    : `${((active! + 0.5) / points.length) * 100}%`,
              right: edge === "right" ? 0 : "auto",
              transform: edge === "none" ? "translateX(-50%)" : undefined,
              ...(tall
                ? { top: `calc(${100 - activePct}% + 8px)` }
                : { bottom: `calc(${activePct}% + 8px)` }),
            }}
          >
            <span className="block text-[10px] font-bold text-ink">{activePoint.label}</span>
            <span className="block text-[11px] font-semibold tabular-nums text-ink">
              {formatExact(activePoint.value, unit)}
            </span>
            {activePoint.caption ? (
              <span className="mt-0.5 block text-[9px] text-muted">{activePoint.caption}</span>
            ) : null}
          </span>
        ) : null}
      </div>
      <div className="mt-2 flex gap-[3px]">
        {points.map((point, index) => (
          <span
            className={`flex-1 truncate text-center text-[8px] ${selectionState(point, selectedValue, interactive).isSelected ? "font-bold text-ink" : "text-muted"}`}
            key={`${point.filterValue ?? point.label}-${index}`}
            aria-hidden="true"
          >
            {index % labelEvery === 0 ? point.label : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

export interface GroupedColumnPoint {
  label: string;
  primary: number;
  comparison: number;
}

/** Two values per period. Use only for measures with the same unit and time grain. */
export function GroupedColumnChart({
  points,
  unit,
  primaryLabel,
  comparisonLabel,
  primaryColor = "#355f86",
  comparisonColor = "#66556f",
  onSelect,
}: {
  points: GroupedColumnPoint[];
  unit: Unit;
  primaryLabel: string;
  comparisonLabel: string;
  primaryColor?: string;
  comparisonColor?: string;
  onSelect?: (point: GroupedColumnPoint) => void;
}) {
  const [active, setActive] = useState<number | null>(null);
  if (points.length === 0) return <EmptyChart />;
  const max = Math.max(...points.flatMap((point) => [point.primary, point.comparison]), 0);
  const minimumWidth = Math.max(440, points.length * 72);
  const resolvedPrimaryColor = brightAccentColor(primaryColor);
  const resolvedComparisonColor = brightAccentColor(comparisonColor);

  return (
    <div className="min-w-0">
      <div className="mb-5 flex flex-wrap gap-x-5 gap-y-2" aria-label="Chart legend">
        {[
          [primaryLabel, resolvedPrimaryColor],
          [comparisonLabel, resolvedComparisonColor],
        ].map(([label, color]) => (
          <span className="flex items-center gap-2 text-[11px] font-medium text-ink" key={label}>
            <span className="h-3 w-3 rounded-[3px]" style={{ background: color }} />
            {label}
          </span>
        ))}
      </div>
      <div className="overflow-x-auto pb-2">
        <div className="relative" style={{ minWidth: minimumWidth }}>
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-[146px]"
            aria-hidden="true"
          >
            {[0, 1, 2, 3, 4].map((line) => (
              <span
                className="absolute inset-x-0 border-t border-[#e5e7ec]"
                key={line}
                style={{ top: `${line * 25}%` }}
              />
            ))}
          </div>
          <div
            className="relative grid h-[176px] items-end gap-3"
            role="img"
            aria-label={`Grouped bar chart comparing ${primaryLabel} and ${comparisonLabel} across ${points.length} periods`}
            style={{ gridTemplateColumns: `repeat(${points.length}, minmax(56px, 1fr))` }}
          >
            {points.map((point, index) => {
              const primaryHeight = max > 0 ? (point.primary / max) * 100 : 0;
              const comparisonHeight = max > 0 ? (point.comparison / max) * 100 : 0;
              return (
                <div
                  className="relative flex h-full min-w-0 flex-col justify-end"
                  key={point.label}
                  onMouseEnter={() => setActive(index)}
                  onMouseLeave={() => setActive(null)}
                >
                  {active === index ? (
                    <div className="pointer-events-none absolute left-1/2 top-1 z-20 w-max max-w-[220px] -translate-x-1/2 rounded-xl border border-line bg-white p-3 shadow-panel">
                      <strong className="block text-[11px] text-ink">{point.label}</strong>
                      <span className="mt-1.5 flex items-center justify-between gap-5 text-[10px] text-muted">
                        {primaryLabel}
                        <b className="tabular-nums text-ink">{formatExact(point.primary, unit)}</b>
                      </span>
                      <span className="mt-1 flex items-center justify-between gap-5 text-[10px] text-muted">
                        {comparisonLabel}
                        <b className="tabular-nums text-ink">
                          {formatExact(point.comparison, unit)}
                        </b>
                      </span>
                    </div>
                  ) : null}
                  <div className="flex h-[146px] items-end justify-center gap-1.5 border-b border-[#cfd3dc]">
                    {[
                      [point.primary, primaryHeight, resolvedPrimaryColor, primaryLabel],
                      [
                        point.comparison,
                        comparisonHeight,
                        resolvedComparisonColor,
                        comparisonLabel,
                      ],
                    ].map(([value, height, color, label]) => (
                      <button
                        aria-label={`${point.label}, ${label}: ${formatExact(Number(value), unit)}${onSelect ? ". Select to drill down." : ""}`}
                        className={`chart-reveal-y w-[38%] max-w-9 origin-bottom rounded-t-[4px] outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ink ${onSelect ? "cursor-pointer" : "cursor-default"}`}
                        key={String(label)}
                        onBlur={() => setActive(null)}
                        onClick={() => onSelect?.(point)}
                        onFocus={() => setActive(index)}
                        style={{
                          background: String(color),
                          height: `${Math.max(Number(height), Number(value) > 0 ? 1.5 : 0)}%`,
                        }}
                        type="button"
                      />
                    ))}
                  </div>
                  <span className="mt-2 truncate text-center text-[10px] font-medium text-muted">
                    {point.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Line chart with an optional comparison series, drawn as SVG. */
export function LineChart({
  points,
  comparison,
  unit,
  height = 144,
  accent = "#355f86",
  comparisonLabel,
  seriesLabel,
  showArea = true,
  showPoints = false,
  backgroundBars = false,
  onSelect,
}: {
  points: Point[];
  comparison?: Point[];
  unit: Unit;
  height?: number;
  accent?: string;
  comparisonLabel?: string;
  seriesLabel?: string;
  showArea?: boolean;
  showPoints?: boolean;
  backgroundBars?: boolean;
} & Pick<Selectable, "onSelect">) {
  const gradientId = useId();
  const [active, setActive] = useState<number | null>(null);
  if (points.length === 0) return <EmptyChart />;
  const interactive = onSelect !== undefined;
  const resolvedAccent = brightAccentColor(accent);

  const all = [...points.map((p) => p.value), ...(comparison ?? []).map((p) => p.value)];
  const max = Math.max(...all, 0);
  const width = 1000;
  const path = (series: Point[]) =>
    series
      .map((point, index) => {
        const x = series.length === 1 ? 0 : (index / (series.length - 1)) * width;
        const y = height - (max > 0 ? (point.value / max) * (height - 16) : 0) - 8;
        return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

  const activePoint = active === null ? null : points[active];
  const activeX = active === null || points.length < 2 ? 0 : (active / (points.length - 1)) * width;
  const activeY =
    activePoint === undefined || activePoint === null
      ? 0
      : height - (max > 0 ? (activePoint.value / max) * (height - 16) : 0) - 8;
  const activeComparison = active === null ? undefined : comparison?.[active];
  const comparisonY =
    activeComparison === undefined
      ? null
      : height - (max > 0 ? (activeComparison.value / max) * (height - 16) : 0) - 8;

  return (
    <div className="min-w-0">
      {(seriesLabel || comparisonLabel) && (
        <div className="mb-2 flex flex-wrap items-center gap-4">
          {seriesLabel ? (
            <span className="flex items-center gap-1.5 text-[10px] text-muted">
              <span className="h-[3px] w-4 rounded-full" style={{ background: resolvedAccent }} />
              {seriesLabel}
            </span>
          ) : null}
          {comparisonLabel ? (
            <span className="flex items-center gap-1.5 text-[10px] text-muted">
              <span className="h-[3px] w-4 rounded-full bg-[#c9ccd4]" />
              {comparisonLabel}
            </span>
          ) : null}
        </div>
      )}
      <div className="relative">
        <svg
          className="w-full"
          height={height}
          preserveAspectRatio="none"
          role="img"
          aria-label={`Line chart over ${points.length} periods`}
          viewBox={`0 0 ${width} ${height}`}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={resolvedAccent} stopOpacity="0.22" />
              <stop offset="100%" stopColor={resolvedAccent} stopOpacity="0" />
            </linearGradient>
          </defs>
          {backgroundBars
            ? points.map((point, index) => {
                const x = points.length === 1 ? width / 2 : (index / (points.length - 1)) * width;
                const barHeight = max > 0 ? (point.value / max) * (height - 18) : 0;
                const barWidth = Math.min(42, width / Math.max(points.length * 1.9, 1));
                return (
                  <rect
                    className="chart-reveal-y"
                    fill={resolvedAccent}
                    height={barHeight}
                    key={`background-${point.filterValue ?? point.label}-${index}`}
                    opacity="0.1"
                    rx="3"
                    width={barWidth}
                    x={Math.max(0, Math.min(width - barWidth, x - barWidth / 2))}
                    y={height - barHeight}
                  />
                );
              })
            : null}
          {showArea ? (
            <path
              className="chart-reveal-area"
              d={`${path(points)} L${width},${height} L0,${height} Z`}
              fill={`url(#${gradientId})`}
            />
          ) : null}
          {comparison ? (
            <path
              d={path(comparison)}
              fill="none"
              stroke="#c9ccd4"
              strokeDasharray="5 5"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
          <path
            className="chart-reveal-line"
            d={path(points)}
            fill="none"
            pathLength={1}
            stroke={resolvedAccent}
            strokeLinecap="round"
            strokeWidth="2.5"
            vectorEffect="non-scaling-stroke"
          />
          {showPoints
            ? points.map((point, index) => {
                const x = points.length === 1 ? width / 2 : (index / (points.length - 1)) * width;
                const y = height - (max > 0 ? (point.value / max) * (height - 16) : 0) - 8;
                return (
                  <circle
                    className="chart-reveal-point"
                    cx={x}
                    cy={y}
                    fill={resolvedAccent}
                    key={`point-${point.label}-${index}`}
                    r="3.25"
                    style={{
                      animationDelay: `${Math.round((index / Math.max(points.length - 1, 1)) * 1000)}ms`,
                    }}
                  />
                );
              })
            : null}
          {activePoint ? (
            <g>
              {/* Crosshair and markers follow the hovered point. */}
              <line
                stroke="#9aa0ab"
                strokeDasharray="3 3"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
                x1={activeX}
                x2={activeX}
                y1={0}
                y2={height}
              />
              {comparisonY === null ? null : (
                <circle cx={activeX} cy={comparisonY} fill="#9aa0ab" r="4" />
              )}
              <circle cx={activeX} cy={activeY} fill={resolvedAccent} r="4.5" />
            </g>
          ) : null}
        </svg>
        <div className="absolute inset-0 flex">
          {points.map((point, index) => (
            <button
              className={`h-full flex-1 outline-none focus-visible:bg-brand/5 ${interactive ? "cursor-pointer" : "cursor-default"}`}
              key={`${point.filterValue ?? point.label}-${index}`}
              onBlur={() => setActive(null)}
              onClick={interactive ? () => onSelect(point) : undefined}
              onFocus={() => setActive(index)}
              onMouseEnter={() => setActive(index)}
              onMouseLeave={() => setActive(null)}
              tabIndex={index % Math.max(1, Math.floor(points.length / 12)) === 0 ? 0 : -1}
              type="button"
              aria-label={selectLabel(point, unit, interactive, false)}
            />
          ))}
        </div>
        {activePoint ? (
          <div
            className="pointer-events-none absolute top-1 rounded-lg border border-line bg-white px-2.5 py-1.5 shadow-panel"
            style={{
              left: `${Math.min(Math.max((active! / Math.max(points.length - 1, 1)) * 100, 6), 84)}%`,
            }}
          >
            <span className="block text-[10px] font-bold text-ink">{activePoint.label}</span>
            <span className="mt-0.5 flex items-center gap-1.5">
              <span className="h-[3px] w-3 rounded-full" style={{ background: resolvedAccent }} />
              <span className="text-[11px] font-semibold tabular-nums text-ink">
                {formatExact(activePoint.value, unit)}
              </span>
            </span>
            {activeComparison ? (
              <span className="mt-0.5 flex items-center gap-1.5">
                <span className="h-[3px] w-3 rounded-full bg-[#c9ccd4]" />
                <span className="text-[11px] tabular-nums text-muted">
                  {formatExact(activeComparison.value, unit)}
                </span>
              </span>
            ) : null}
            {activePoint.caption ? (
              <span className="mt-0.5 block text-[9px] text-muted">{activePoint.caption}</span>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="mt-2 flex justify-between text-[9px] text-muted">
        <span>{points[0]?.label}</span>
        <span>{points[points.length - 1]?.label}</span>
      </div>
    </div>
  );
}

/** Weekday-by-hour intensity grid. */
export function Heatmap({
  cells,
  rows,
  columns,
  accent = "#355f86",
  valueLabel,
  onSelect,
  selectedCell,
}: {
  cells: { row: number; column: number; value: number }[];
  rows: string[];
  columns: string[];
  accent?: string;
  valueLabel: string;
  onSelect?: (cell: { row: number; column: number }) => void;
  selectedCell?: { row: number | null; column: number | null } | null;
}) {
  const interactive = onSelect !== undefined;
  const [active, setActive] = useState<{ row: number; column: number } | null>(null);
  const max = Math.max(...cells.map((c) => c.value), 0);
  const lookup = new Map(cells.map((c) => [`${c.row}:${c.column}`, c.value]));
  const activeValue = active === null ? null : (lookup.get(`${active.row}:${active.column}`) ?? 0);
  const resolvedAccent = brightAccentColor(accent);

  return (
    <div className="min-w-0 overflow-x-auto">
      <div className="min-w-[720px]">
        <div className="flex gap-[3px] pl-[75px]">
          {columns.map((column, index) => (
            <span
              className="flex-1 text-center text-[8px] text-muted"
              key={column}
              aria-hidden="true"
            >
              {index % 3 === 0 ? column : ""}
            </span>
          ))}
        </div>
        <div className="mt-1 grid gap-[3px]">
          {rows.map((row, rowIndex) => (
            <div className="flex items-center gap-[3px]" key={row}>
              <span className="w-[72px] shrink-0 text-[9px] font-medium text-muted">{row}</span>
              {columns.map((column, columnIndex) => {
                const value = lookup.get(`${rowIndex}:${columnIndex}`) ?? 0;
                const intensity = max > 0 ? value / max : 0;
                const isActive = active?.row === rowIndex && active?.column === columnIndex;
                const rowSelected =
                  selectedCell?.row === null || selectedCell?.row === undefined
                    ? null
                    : selectedCell.row === rowIndex;
                const columnSelected =
                  selectedCell?.column === null || selectedCell?.column === undefined
                    ? null
                    : selectedCell.column === columnIndex;
                const matches = [rowSelected, columnSelected].filter(
                  (state): state is boolean => state !== null,
                );
                const dimmed = matches.length > 0 && matches.some((state) => !state);
                return (
                  <button
                    className={`h-6 flex-1 rounded-[3px] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-brand motion-reduce:transition-none ${interactive ? "cursor-pointer" : "cursor-default"}`}
                    key={column}
                    onBlur={() => setActive(null)}
                    onClick={
                      interactive
                        ? () => onSelect({ row: rowIndex, column: columnIndex })
                        : undefined
                    }
                    onFocus={() => setActive({ row: rowIndex, column: columnIndex })}
                    onMouseEnter={() => setActive({ row: rowIndex, column: columnIndex })}
                    onMouseLeave={() => setActive(null)}
                    style={{
                      background:
                        intensity === 0
                          ? "#f1f2f5"
                          : `color-mix(in srgb, ${resolvedAccent} ${Math.round(18 + intensity * 82)}%, #ffffff)`,
                      transform: isActive ? "scale(1.14)" : undefined,
                      opacity: dimmed ? 0.3 : 1,
                    }}
                    title={`${row} ${column}: ${value.toLocaleString("en-US")} ${valueLabel}`}
                    type="button"
                    aria-label={`${row} ${column}: ${value.toLocaleString("en-US")} ${valueLabel}${interactive ? ". Activate to filter by this weekday and hour" : ""}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <p className="mt-3 text-[10px] text-muted" role="status">
        {active !== null
          ? `${rows[active.row]} at ${columns[active.column]} — ${(activeValue ?? 0).toLocaleString("en-US")} ${valueLabel}`
          : interactive
            ? `Hover a cell to read its exact ${valueLabel} count, or click it to filter by that weekday and hour.`
            : `Hover or focus a cell to read its exact ${valueLabel} count.`}
      </p>
    </div>
  );
}

/** Part-to-whole view. Reserved for categories that make up one verified total. */
export function DoughnutChart({
  segments,
  unit,
}: {
  segments: { label: string; value: number; color: string }[];
  unit: Unit;
}) {
  return <MixBar segments={segments} unit={unit} />;
}

/** Proportional mix, drawn as a compact doughnut with filterable legend controls. */
export function MixBar({
  segments,
  unit,
  onSelect,
  selectedValue,
}: {
  segments: { label: string; value: number; color: string; filterValue?: string }[];
  unit: Unit;
} & Selectable) {
  const [active, setActive] = useState<number | null>(null);
  const ringMaskId = `ring-sweep-${useId().replaceAll(":", "")}`;
  const total = segments.reduce((sum, segment) => sum + Math.max(segment.value, 0), 0);
  if (total <= 0) return <EmptyChart />;
  const interactive = onSelect !== undefined;
  const activeSegment = active === null ? null : segments[active];
  const activeShare =
    activeSegment === null || activeSegment === undefined
      ? 0
      : (Math.max(activeSegment.value, 0) / total) * 100;
  const positive = segments.filter((segment) => segment.value > 0);
  const selectedIndex = segments.findIndex(
    (segment) => (segment.filterValue ?? segment.label) === selectedValue,
  );
  const emphasizedIndex = active ?? (selectedIndex >= 0 ? selectedIndex : null);
  const ringSegments = segments.reduce<
    {
      segment: (typeof segments)[number];
      index: number;
      share: number;
      startShare: number;
      endShare: number;
    }[]
  >((items, segment, index) => {
    if (segment.value <= 0) return items;
    const share = Math.max(segment.value, 0) / total;
    const startShare = items.at(-1)?.endShare ?? 0;
    return [...items, { segment, index, share, startShare, endShare: startShare + share }];
  }, []);

  function ringSegmentPath(startShare: number, endShare: number) {
    const outerRadius = 48;
    const innerRadius = 29;
    const startAngle = startShare * Math.PI * 2;
    // SVG cannot draw a full circle with one arc. Leaving an imperceptible fraction of a
    // degree open keeps a one-category mix visible without inventing a second segment.
    const safeEndShare = endShare - startShare >= 1 ? endShare - 0.000001 : endShare;
    const endAngle = safeEndShare * Math.PI * 2;
    const point = (radius: number, angle: number) => ({
      x: 50 + radius * Math.sin(angle),
      y: 50 - radius * Math.cos(angle),
    });
    const outerStart = point(outerRadius, startAngle);
    const outerEnd = point(outerRadius, endAngle);
    const innerEnd = point(innerRadius, endAngle);
    const innerStart = point(innerRadius, startAngle);
    const largeArc = safeEndShare - startShare > 0.5 ? 1 : 0;
    return [
      `M ${outerStart.x} ${outerStart.y}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
      `L ${innerEnd.x} ${innerEnd.y}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
      "Z",
    ].join(" ");
  }

  function activateSegmentAt(clientX: number, clientY: number, target: SVGSVGElement) {
    const bounds = target.getBoundingClientRect();
    const x = clientX - (bounds.left + bounds.width / 2);
    const y = clientY - (bounds.top + bounds.height / 2);
    const radius = Math.hypot(x, y) / (Math.min(bounds.width, bounds.height) / 2);
    if (radius < 0.55 || radius > 1.08) {
      setActive(null);
      return;
    }
    const shareAtPointer = (((Math.atan2(y, x) * 180) / Math.PI + 450) % 360) / 360;
    let threshold = 0;
    const index = segments.findIndex((segment) => {
      threshold += Math.max(segment.value, 0) / total;
      return shareAtPointer <= threshold;
    });
    setActive(index >= 0 ? index : null);
  }

  return (
    <div className="mix-chart grid min-w-0 items-center gap-4 sm:grid-cols-[208px_minmax(0,280px)] sm:justify-center">
      <div className="relative mx-auto aspect-square w-44 sm:w-52">
        <svg
          aria-label={`Pie chart showing ${positive.map((segment) => `${segment.label}: ${formatExact(segment.value, unit)}`).join(", ")}`}
          className="h-full w-full overflow-visible"
          onMouseLeave={() => setActive(null)}
          onMouseMove={(event) =>
            activateSegmentAt(event.clientX, event.clientY, event.currentTarget)
          }
          role="img"
          viewBox="0 0 100 100"
        >
          <defs>
            <mask id={ringMaskId} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
              <circle
                className="chart-reveal-ring-sweep"
                cx="50"
                cy="50"
                fill="none"
                pathLength="1"
                r="38.5"
                stroke="white"
                strokeWidth="20"
              />
            </mask>
          </defs>
          <g mask={`url(#${ringMaskId})`}>
            {ringSegments.map(({ segment, index, share, startShare, endShare }) => {
              const selected = selectionState(segment, selectedValue, interactive).isSelected;
              return (
                <path
                  aria-label={`${segment.label}: ${formatExact(segment.value, unit)}, ${(share * 100).toFixed(1)} percent`}
                  d={ringSegmentPath(startShare, endShare)}
                  fill={brightAccentColor(segment.color)}
                  key={segment.label}
                  onBlur={() => setActive(null)}
                  onClick={interactive ? () => onSelect(segment) : undefined}
                  onFocus={() => setActive(index)}
                  onMouseEnter={() => setActive(index)}
                  onMouseLeave={() => setActive(null)}
                  role={interactive ? "button" : undefined}
                  stroke={selected ? "#ffffff" : "none"}
                  strokeWidth={selected ? 1.5 : 0}
                  style={{
                    cursor: interactive ? "pointer" : "default",
                    opacity: emphasizedIndex === null || emphasizedIndex === index ? 1 : 0.18,
                    pointerEvents: "none",
                    transition: "opacity 180ms ease, stroke-width 180ms ease",
                  }}
                  tabIndex={0}
                />
              );
            })}
          </g>
        </svg>
        <div className="pointer-events-none absolute inset-[29%] grid place-items-center rounded-full bg-white text-center">
          <span>
            <b className="block whitespace-nowrap text-[11px] tabular-nums text-ink sm:text-xs">
              {activeSegment ? `${activeShare.toFixed(1)}%` : formatValue(total, unit)}
            </b>
            <span className="text-[8px] font-bold uppercase tracking-[0.08em] text-muted">
              {activeSegment ? activeSegment.label : "Total"}
            </span>
          </span>
        </div>
      </div>
      <ul className="grid gap-1.5">
        {segments.map((segment, index) => {
          const share = (Math.max(segment.value, 0) / total) * 100;
          const { isSelected, dimmed } = selectionState(segment, selectedValue, interactive);
          return (
            <li key={segment.label}>
              <button
                aria-label={`${selectLabel(segment, unit, interactive, isSelected)}, ${share.toFixed(1)} percent`}
                aria-pressed={interactive ? isSelected : undefined}
                className={`grid w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-2 rounded-lg px-2 py-1.5 text-left outline-none transition-colors hover:bg-canvas focus-visible:ring-2 focus-visible:ring-brand ${dimmed ? "opacity-50" : ""}`}
                onBlur={() => setActive(null)}
                onClick={interactive ? () => onSelect(segment) : undefined}
                onFocus={() => setActive(index)}
                onMouseEnter={() => setActive(index)}
                onMouseLeave={() => setActive(null)}
                style={{
                  background: active === index || isSelected ? "#f4f5f8" : undefined,
                  opacity: emphasizedIndex === null || emphasizedIndex === index ? 1 : 0.42,
                }}
                type="button"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{ background: brightAccentColor(segment.color) }}
                  />
                  <span className="truncate text-[11px] text-ink">{segment.label}</span>
                </span>
                <span className="text-right text-[11px] font-semibold tabular-nums text-ink">
                  {formatValue(segment.value, unit)}
                </span>
                <span className="min-w-[3.1rem] text-right text-[11px] tabular-nums text-muted">
                  {share.toFixed(1)}%
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function EmptyChart({ message = "No values in this period." }: { message?: string }) {
  return (
    <div className="grid h-[140px] place-items-center rounded-xl border border-dashed border-line bg-canvas">
      <p className="text-[11px] text-muted">{message}</p>
    </div>
  );
}
