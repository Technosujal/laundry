import { useEffect, useMemo, useState, type ReactNode } from "react";

import { EmptyPanel } from "../../components/ui/EmptyPanel";
import type { AnalyticsGateway, OverviewResult, WdfSales } from "./analytics-gateway";
import { CashSection } from "./sections/CashSection";
import { CustomersSection } from "./sections/CustomersSection";
import { MethodologySection } from "./sections/MethodologySection";
import { ProductsSection } from "./sections/ProductsSection";
import { SalesSection } from "./sections/SalesSection";
import { TrendsSection } from "./sections/TrendsSection";
import { LaundroSubjectSection } from "./sections/LaundroSubjectSection";
import { StaffSection } from "./sections/StaffSection";
import { formatBusinessDate, SourceBadge } from "../../components/charts/primitives";
import { FilterBar, useSalesFilter } from "./sales-filter";

const SECTIONS = [
  { id: "sales", label: "Sales", hint: "When and what sells" },
  { id: "trends", label: "Trends", hint: "Movement over time" },
  { id: "products", label: "Products", hint: "Services and items" },
  { id: "cash", label: "Cash & voids", hint: "Payments and corrections" },
  { id: "staff", label: "Staff & ops", hint: "Production and hours" },
  { id: "customers", label: "Customers", hint: "Who drives the business" },
  { id: "method", label: "Methodology", hint: "How every number is made" },
] as const;

export type AnalyticsSectionId = (typeof SECTIONS)[number]["id"];

function isSection(value: string | undefined): value is AnalyticsSectionId {
  return SECTIONS.some((section) => section.id === value);
}

function canonicalSection(value: string | undefined): string | undefined {
  return value?.startsWith("lp-") ? value.slice(3) : value;
}

function SourceSection({
  source,
  description,
  id,
  children,
}: {
  source: "WDF POS" | "LaundroPortal";
  description: string;
  id: string;
  children: ReactNode;
}) {
  return (
    <section className="grid min-w-0 scroll-mt-32 gap-3.5" id={id}>
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
        <div>
          <h3 className="text-[15px] font-semibold tracking-[-0.02em] text-ink">{source}</h3>
          <p className="mt-0.5 text-[10px] text-muted">{description}</p>
        </div>
      </header>
      {children}
    </section>
  );
}

/** Stands in only while the artifact is loading; never rendered. */
const EMPTY_SALES = {
  analytics: { available: false, totals: {} },
  facts: { available: false, row_count: 0 },
} as unknown as WdfSales;

export function AnalyticsPage({
  gateway,
  section: requestedSection,
  showDirectory = false,
}: {
  gateway: AnalyticsGateway;
  section?: string;
  showDirectory?: boolean;
}) {
  const [result, setResult] = useState<OverviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [localSection, setLocalSection] = useState<AnalyticsSectionId>("sales");
  const [activeSource, setActiveSource] = useState<"WDF POS" | "LaundroPortal">("WDF POS");
  const canonicalRequestedSection = canonicalSection(requestedSection);
  const section = showDirectory
    ? isSection(canonicalRequestedSection)
      ? canonicalRequestedSection
      : "sales"
    : localSection;

  useEffect(() => {
    setActiveSource("WDF POS");
  }, [section]);

  function openSection(next: AnalyticsSectionId) {
    if (showDirectory) window.location.assign(`#analytics/${next}`);
    else setLocalSection(next);
  }

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
        setError(cause instanceof Error ? cause.message : "Analytics could not be loaded");
      });
    return () => controller.abort();
  }, [gateway]);

  const sales = useMemo(
    () => (result && result.state === "available" ? result.wdf_sales : null),
    [result],
  );
  // Hooks must run on every render, so the filter is built from a safe placeholder until the
  // artifact has loaded. Nothing is rendered from it before the guards below pass.
  const filter = useSalesFilter(sales ?? EMPTY_SALES);

  if (error) {
    return (
      <EmptyPanel
        description={`${error} No figures are shown until every required source loads.`}
        title="Analytics could not be loaded"
      />
    );
  }
  if (!result) {
    return (
      <EmptyPanel description="Reading the verified source data." title="Loading analytics…" />
    );
  }
  if (result.state === "unavailable") {
    return <EmptyPanel description={result.detail} title="No analytics have been built yet" />;
  }
  if (!sales || !sales.analytics.available) {
    return (
      <EmptyPanel
        description="The analytics artifact was built but contains no dated sales lines to summarise."
        title="No sales activity to report"
      />
    );
  }

  const period = `${formatBusinessDate(sales.analytics.totals.first_day)} to ${formatBusinessDate(sales.analytics.totals.last_day)}`;

  const currentSection = SECTIONS.find((item) => item.id === section) ?? SECTIONS[0];

  function goToSource(source: "WDF POS" | "LaundroPortal") {
    setActiveSource(source);
    const prefix = source === "WDF POS" ? "wdf" : "laundro";
    document.getElementById(`${prefix}-${section}`)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <section>
      {showDirectory ? <h2 className="sr-only">{currentSection.label}</h2> : null}
      {!showDirectory ? (
        <header className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[9px] font-extrabold uppercase tracking-[0.13em] text-brand">
              Business analytics
            </p>
            <h2 className="mt-1 text-[clamp(22px,2.5vw,28px)] font-semibold leading-none tracking-[-0.04em] text-ink">
              {currentSection.label}
            </h2>
            <p className="mt-1 text-[11px] leading-4 text-muted">{currentSection.hint}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            {currentSection.id !== "method" ? <SourceBadge source="WDF POS" /> : null}
            {currentSection.id !== "method" ? <SourceBadge source="LaundroPortal" /> : null}
            <span className="rounded-full border border-line bg-white px-3 py-1.5">{period}</span>
          </div>
        </header>
      ) : null}

      {!showDirectory ? (
        <nav aria-label="Analytics sections" className="-mx-1 mb-5 flex gap-2 overflow-x-auto px-1">
          {SECTIONS.map((item) => (
            <button
              aria-label={item.label}
              aria-current={section === item.id ? "page" : undefined}
              className="shrink-0 rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold text-ink"
              key={item.id}
              onClick={() => openSection(item.id)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </nav>
      ) : null}

      {section !== "method" ? (
        <div className="grid gap-6">
          <div className="sticky top-[60px] z-20 -mx-2 flex justify-start border-b border-line bg-canvas/95 px-2 py-2.5 shadow-[0_8px_16px_rgba(17,19,24,0.025)] backdrop-blur sm:top-[64px]">
            <div
              aria-label="Source section"
              className="inline-flex rounded-lg border border-line bg-white p-0.5 shadow-sm"
              role="group"
            >
              {(["WDF POS", "LaundroPortal"] as const).map((source) => (
                <button
                  aria-pressed={activeSource === source}
                  className={`rounded-md px-3 py-1.5 text-[10px] font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-brand ${activeSource === source ? (source === "WDF POS" ? "bg-[#355f86] text-white" : "bg-[#66556f] text-white") : "text-muted hover:bg-canvas hover:text-ink"}`}
                  key={source}
                  onClick={() => goToSource(source)}
                  type="button"
                >
                  {source}
                </button>
              ))}
            </div>
          </div>
          <SourceSection
            description="Counter sales, orders, products and operating records."
            id={`wdf-${section}`}
            source="WDF POS"
          >
            {section === "sales" || section === "trends" || section === "products" ? (
              <FilterBar state={filter} />
            ) : null}
            {section === "sales" ? <SalesSection filter={filter} sales={filter.view} /> : null}
            {section === "trends" ? <TrendsSection filter={filter} sales={filter.view} /> : null}
            {section === "products" ? (
              <ProductsSection filter={filter} sales={filter.view} />
            ) : null}
            {section === "cash" ? <CashSection sales={sales} /> : null}
            {section === "staff" ? (
              <StaffSection sales={sales} workforce={result.workforce} />
            ) : null}
            {section === "customers" ? <CustomersSection sales={sales} /> : null}
          </SourceSection>

          <SourceSection
            description="Machine, stored-value card and account records where supplied."
            id={`laundro-${section}`}
            source="LaundroPortal"
          >
            <LaundroSubjectSection
              accounts={result.accounts}
              machines={result.machines}
              metrics={result.metrics}
              subject={section}
            />
          </SourceSection>
        </div>
      ) : null}
      {section === "method" ? (
        <MethodologySection
          health={result.health}
          runId={result.run_id}
          sales={sales}
          sources={result.sources}
        />
      ) : null}
    </section>
  );
}
