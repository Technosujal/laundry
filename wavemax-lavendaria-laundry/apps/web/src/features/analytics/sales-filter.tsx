import { useCallback, useMemo, useState } from "react";

import type { Point } from "../../components/charts/primitives";
import { filterValueOf } from "../../components/charts/primitives";
import type { WdfSales, WdfSalesAnalytics } from "./analytics-gateway";
import {
  aggregate,
  decodeFacts,
  selectRows,
  type FilterDimension,
  type SalesFilter,
} from "./sales-facts";

const DIMENSION_LABELS: Record<FilterDimension, string> = {
  month: "Month",
  department: "Department",
  category: "Category",
  weekday: "Weekday",
  item: "Item",
  hour: "Hour",
  service: "Service",
};

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * A chip has to read as the thing the reader clicked, not as the axis tick they clicked on.
 * A monthly column is labelled "03" for space; the chip says "March 2025".
 */
function chipLabel(dimension: FilterDimension, value: string, pointLabel: string): string {
  if (dimension === "month") {
    const [year, month] = value.split("-");
    const name = MONTH_NAMES[Number(month) - 1];
    if (name !== undefined && year !== undefined) return `${name} ${year}`;
  }
  if (dimension === "hour") {
    const hour = Number(value);
    if (Number.isInteger(hour)) {
      const suffix = hour < 12 ? "am" : "pm";
      const display = hour % 12 === 0 ? 12 : hour % 12;
      return `${display}${suffix}`;
    }
  }
  return pointLabel;
}

export interface SalesFilterState {
  /** The active filters, in the order the reader applied them. */
  filters: SalesFilter[];
  /** Apply a filter, or clear it when the same value is chosen again. */
  toggle: (dimension: FilterDimension, point: Point) => void;
  remove: (dimension: FilterDimension) => void;
  clear: () => void;
  /** The currently selected value on a dimension, for a chart to highlight. */
  valueOn: (dimension: FilterDimension) => string | null;
  isFiltered: boolean;
  /** The sales view the sections should render: filtered when filters are active. */
  view: WdfSales;
  /**
   * The series a chart on `dimension` should plot: everything except its own filter.
   *
   * A chart never filters itself away. Clicking March must leave the other eleven months on
   * screen, dimmed, so the reader can see what March is being compared against and can switch
   * to another month without first clearing the filter.
   */
  analyticsExcept: (dimension: FilterDimension) => WdfSalesAnalytics;
  /** Lines selected by the active filters, out of the artifact's total. */
  selectedLines: number;
  totalLines: number;
  /**
   * Whether the browser's own sum of the unfiltered fact table still equals the analytics
   * service's published total. False means the two disagree and nothing filtered can be
   * trusted, so the interface says so rather than showing a figure.
   */
  reconciles: boolean;
  /** Source-backed choices used by the visible report slicers. */
  availableMonths: string[];
  availableServices: string[];
}

/**
 * Cross-filtering over the published line-level facts.
 *
 * Clicking a mark on any chart filters every chart in the section. Filters on different
 * dimensions intersect. Every filtered figure is a sum of the analytics service's own integer
 * line values, so it agrees with the service to the cent rather than being a second estimate.
 */
export function useSalesFilter(sales: WdfSales): SalesFilterState {
  const [filters, setFilters] = useState<SalesFilter[]>([]);

  const decoded = useMemo(
    () => (sales.facts?.available ? decodeFacts(sales.facts) : null),
    [sales.facts],
  );

  // Proven once per load: with no filter applied, the browser's arithmetic must reproduce the
  // service's published total exactly. This is the same check the test suite makes, kept at
  // runtime so a future artifact change cannot quietly break a filtered figure.
  const reconciles = useMemo(() => {
    if (!decoded) return false;
    const everything = aggregate(decoded, selectRows(decoded, []), sales.analytics);
    return everything.totals.net_sales === sales.analytics.totals.net_sales;
  }, [decoded, sales.analytics]);

  const rows = useMemo(
    () => (decoded && filters.length > 0 ? selectRows(decoded, filters) : null),
    [decoded, filters],
  );

  const view = useMemo<WdfSales>(() => {
    if (!decoded || rows === null || !reconciles) return sales;
    return { ...sales, analytics: aggregate(decoded, rows, sales.analytics) };
  }, [decoded, rows, reconciles, sales]);

  // One aggregation per filtered dimension, built as a whole inside the memo rather than
  // filled in lazily during render: mutating a memoised value as a side effect of rendering is
  // exactly the pattern that breaks under concurrent rendering.
  const exceptViews = useMemo(() => {
    const views = new Map<FilterDimension, WdfSalesAnalytics>();
    if (!decoded || !reconciles) return views;
    for (const filter of filters) {
      const others = filters.filter((other) => other.dimension !== filter.dimension);
      views.set(
        filter.dimension,
        others.length === 0
          ? sales.analytics
          : aggregate(decoded, selectRows(decoded, others), sales.analytics),
      );
    }
    return views;
  }, [decoded, filters, reconciles, sales.analytics]);

  const analyticsExcept = useCallback(
    (dimension: FilterDimension): WdfSalesAnalytics => {
      if (!decoded || !reconciles) return sales.analytics;
      // A dimension with no filter of its own already sees everything the others allow.
      return exceptViews.get(dimension) ?? view.analytics;
    },
    [decoded, exceptViews, reconciles, sales.analytics, view.analytics],
  );

  const toggle = useCallback((dimension: FilterDimension, point: Point) => {
    const value = filterValueOf(point);
    setFilters((current) => {
      const existing = current.find((filter) => filter.dimension === dimension);
      if (existing?.value === value) {
        return current.filter((filter) => filter.dimension !== dimension);
      }
      const label = `${DIMENSION_LABELS[dimension]}: ${chipLabel(dimension, value, point.label)}`;
      return [
        ...current.filter((filter) => filter.dimension !== dimension),
        { dimension, value, label },
      ];
    });
  }, []);

  const remove = useCallback((dimension: FilterDimension) => {
    setFilters((current) => current.filter((filter) => filter.dimension !== dimension));
  }, []);

  const clear = useCallback(() => setFilters([]), []);

  const valueOn = useCallback(
    (dimension: FilterDimension) =>
      filters.find((filter) => filter.dimension === dimension)?.value ?? null,
    [filters],
  );

  return {
    filters,
    toggle,
    remove,
    clear,
    valueOn,
    analyticsExcept,
    isFiltered: filters.length > 0 && reconciles,
    view,
    selectedLines: rows?.length ?? sales.facts?.row_count ?? 0,
    totalLines: sales.facts?.row_count ?? 0,
    reconciles,
    availableMonths:
      decoded?.months ?? sales.analytics.by_month?.map((row) => row.period ?? "") ?? [],
    availableServices: (sales.analytics.by_service_type ?? [])
      .map((row) => row.name ?? "")
      .filter(Boolean),
  };
}

/** The active-filter chips, and the only place a filter can be read back and removed. */
function ExpandedFilterBar({ state }: { state: SalesFilterState }) {
  if (!state.reconciles) {
    return (
      <div className="mb-4 rounded-2xl border border-[#ead8a7] bg-[#fff8e5] px-5 py-4">
        <strong className="block text-[12px] text-[#77591d]">
          Cross-filtering is switched off for this build
        </strong>
        <p className="mt-1 text-[11px] leading-[1.6] text-[#77591d]">
          The published line-level figures do not sum to the analytics service&apos;s own total, so
          a filtered figure could not be trusted. Every unfiltered figure below is the
          service&apos;s own and is unaffected.
        </p>
      </div>
    );
  }

  const share =
    state.totalLines > 0 ? Math.round((state.selectedLines / state.totalLines) * 100) : 0;

  return (
    <div className="mb-5 rounded-2xl border border-line bg-white p-4 shadow-[0_8px_25px_rgba(17,19,24,0.035)] sm:p-5">
      <div className="flex flex-wrap items-start gap-x-7 gap-y-4">
        <fieldset className="min-w-0">
          <legend className="mb-2 text-[11px] font-bold uppercase tracking-[0.09em] text-muted">
            Month
          </legend>
          <div className="flex max-w-full flex-wrap gap-1.5">
            {state.availableMonths.map((month) => {
              const label = MONTH_NAMES[Number(month.slice(5)) - 1]?.slice(0, 3) ?? month;
              const active = state.valueOn("month") === month;
              return (
                <button
                  aria-pressed={active}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-brand ${active ? "border-brand bg-brand text-white" : "border-line bg-canvas text-ink hover:border-brand/40 hover:bg-brand-soft"}`}
                  key={month}
                  onClick={() => state.toggle("month", { label, filterValue: month, value: 0 })}
                  type="button"
                >
                  {label}
                </button>
              );
            })}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-2 text-[11px] font-bold uppercase tracking-[0.09em] text-muted">
            Service
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {state.availableServices.map((service) => {
              const active = state.valueOn("service") === service;
              return (
                <button
                  aria-pressed={active}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-brand ${active ? "border-brand bg-brand text-white" : "border-line bg-canvas text-ink hover:border-brand/40 hover:bg-brand-soft"}`}
                  key={service}
                  onClick={() => state.toggle("service", { label: service, value: 0 })}
                  type="button"
                >
                  {service}
                </button>
              );
            })}
          </div>
        </fieldset>
        <div className="ml-auto self-end text-right">
          <p className="text-xs text-muted">
            {state.filters.length > 0
              ? `${state.selectedLines.toLocaleString("en-US")} of ${state.totalLines.toLocaleString("en-US")} lines (${share}%)`
              : `${state.totalLines.toLocaleString("en-US")} lines · full period`}
          </p>
          {state.filters.length > 0 ? (
            <button
              className="mt-1 text-xs font-bold text-brand hover:underline"
              onClick={state.clear}
              type="button"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      </div>
      {state.filters.length > 0 ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3">
          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
            Active
          </span>
          {state.filters.map((filter) => (
            <button
              className="group inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand-soft px-3 py-1.5 text-xs font-semibold text-[#2759c8] outline-none transition hover:border-brand focus-visible:ring-2 focus-visible:ring-brand"
              key={filter.dimension}
              onClick={() => state.remove(filter.dimension)}
              type="button"
            >
              {filter.label} <span aria-hidden="true">&times;</span>
              <span className="sr-only">Remove this filter</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** Compact report control: detailed slicers stay out of the executive view until requested. */
export function FilterBar({ state }: { state: SalesFilterState }) {
  const [open, setOpen] = useState(false);

  if (!state.reconciles) {
    return <ExpandedFilterBar state={state} />;
  }

  const share =
    state.totalLines > 0 ? Math.round((state.selectedLines / state.totalLines) * 100) : 0;

  return (
    <div className="mb-4">
      <div className="flex min-h-11 flex-wrap items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 shadow-[0_6px_20px_rgba(17,19,24,0.025)]">
        <button
          aria-controls="analytics-filter-panel"
          aria-expanded={open}
          className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[#bccbd6] bg-[#f3f7f9] px-3 text-xs font-bold text-[#294f6c] outline-none transition hover:border-[#7295ad] hover:bg-[#eaf1f5] focus-visible:ring-2 focus-visible:ring-brand"
          onClick={() => setOpen((current) => !current)}
          type="button"
        >
          <svg
            aria-hidden="true"
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            viewBox="0 0 24 24"
          >
            <path d="M4 5h16M7 12h10M10 19h4" strokeLinecap="round" />
          </svg>
          Filters
          {state.filters.length > 0 ? (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#355f7d] px-1 text-[10px] text-white">
              {state.filters.length}
            </span>
          ) : null}
          <svg
            aria-hidden="true"
            className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="m7 10 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {state.filters.map((filter) => (
          <button
            className="inline-flex items-center gap-1.5 rounded-full border border-[#a9bdca] bg-[#eef3f6] px-2.5 py-1.5 text-[11px] font-semibold text-[#294f6c] outline-none transition hover:border-[#7295ad] focus-visible:ring-2 focus-visible:ring-brand"
            key={filter.dimension}
            onClick={() => state.remove(filter.dimension)}
            type="button"
          >
            {filter.label} <span aria-hidden="true">&times;</span>
            <span className="sr-only">Remove this filter</span>
          </button>
        ))}
        {state.filters.length > 0 ? (
          <button
            className="text-[11px] font-bold text-[#355f7d] hover:underline"
            onClick={state.clear}
            type="button"
          >
            Clear all
          </button>
        ) : null}
        <p className="ml-auto text-[11px] text-muted">
          {state.filters.length > 0
            ? `${state.selectedLines.toLocaleString("en-US")} of ${state.totalLines.toLocaleString("en-US")} lines (${share}%)`
            : `${state.totalLines.toLocaleString("en-US")} lines · full period`}
        </p>
      </div>
      {open ? (
        <div id="analytics-filter-panel" className="mt-2">
          <ExpandedFilterBar state={state} />
        </div>
      ) : null}
    </div>
  );
}
