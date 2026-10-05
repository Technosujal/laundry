import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

import { ProductIcon } from "../../components/ui/ProductIcon";
import {
  ChartPanel,
  ColumnChart,
  DoughnutChart,
  RankedBars,
  SourceBadge,
} from "../../components/charts/primitives";
import type { AnalyticsGateway, OverviewResult } from "../analytics/analytics-gateway";
import type {
  OrderListQuery,
  OrderListResponse,
  OrdersGateway,
  OrderSummary,
} from "./orders-gateway";
import { orderDetailHash } from "./order-route";
import { orderExtras } from "./static-orders-gateway";

type ViewState =
  | { status: "loading" }
  | { status: "ready"; data: OrderListResponse; items: OrderSummary[] }
  | { status: "error"; message: string; correlationId: string | null };
type Source = "wdf" | "laundro";

const ORDER_STATUSES = ["Paid", "Done", "Returned to Customer", "Voided"] as const;
const SERVICE_TYPES = ["Laundry service", "Retail"] as const;
const PAGE_SIZE = 24;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function displayValue(value: string | null, fallback = "Not supplied") {
  return value?.trim() || fallback;
}

function money(value: string | null | undefined, currency = "USD") {
  if (value === null || value === undefined || value === "") return "Not supplied";
  return Number(value).toLocaleString("en-US", { style: "currency", currency });
}

function formatMoney(order: OrderSummary) {
  return order.total.amount !== null && order.total.currency
    ? money(order.total.amount, order.total.currency)
    : "Not supplied";
}

function formatDate(value: string | null) {
  if (!value) return "Not supplied";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="h-full min-w-0 rounded-2xl border border-line bg-white p-4 shadow-[0_8px_24px_rgba(17,19,24,0.035)]">
      <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted">{label}</p>
      <strong className="mt-1.5 block truncate text-xl font-semibold tracking-[-0.03em] text-ink">
        {value}
      </strong>
      <p className="mt-0.5 text-[10px] leading-4 text-muted">{hint}</p>
    </div>
  );
}

function SourceSwitch({
  source,
  onChange,
}: {
  source: Source;
  onChange: (source: Source) => void;
}) {
  return (
    <div className="sticky top-[68px] z-20 -mx-2 mb-4 flex justify-start border-b border-line bg-canvas/95 px-2 py-2.5 shadow-[0_8px_16px_rgba(17,19,24,0.025)] backdrop-blur sm:top-[76px]">
      <div
        aria-label="Order section"
        className="inline-flex rounded-lg border border-line bg-white p-0.5 shadow-sm"
        role="group"
      >
        <button
          aria-pressed={source === "wdf"}
          className={`rounded-md px-3 py-1.5 text-[10px] font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-brand ${source === "wdf" ? "bg-[#37658e] text-white" : "text-muted hover:bg-canvas hover:text-ink"}`}
          onClick={() => onChange("wdf")}
          type="button"
        >
          Counter orders
        </button>
        <button
          aria-pressed={source === "laundro"}
          className={`rounded-md px-3 py-1.5 text-[10px] font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-brand ${source === "laundro" ? "bg-[#6e557e] text-white" : "text-muted hover:bg-canvas hover:text-ink"}`}
          onClick={() => onChange("laundro")}
          type="button"
        >
          Machine & cards
        </button>
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  description,
  source,
}: {
  title: string;
  description: string;
  source: "WDF POS" | "LaundroPortal";
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
      <div>
        <h2 className="text-xl font-semibold tracking-[-0.025em] text-ink">{title}</h2>
        <p className="mt-1 text-xs leading-5 text-muted">{description}</p>
      </div>
      <SourceBadge source={source} />
    </header>
  );
}

function orderWeight(order: OrderSummary) {
  const pounds = (orderExtras(order.id)?.lines ?? []).reduce(
    (sum, line) => sum + (line.units === "lb" ? Number(line.quantity) || 0 : 0),
    0,
  );
  return pounds > 0 ? `${pounds.toLocaleString("en-US", { maximumFractionDigits: 2 })} lb` : "—";
}

function StatusPill({ value }: { value: string | null }) {
  const label = displayValue(value, "Not supplied");
  const voided = label.toLowerCase() === "voided";
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-bold ${voided ? "bg-[#fdeee7] text-[#9a3412]" : "bg-[#e9f1f8] text-[#315f88]"}`}
    >
      {label}
    </span>
  );
}

function OrderCard({ order }: { order: OrderSummary }) {
  const extra = orderExtras(order.id);
  return (
    <a
      className="group block rounded-2xl border border-line bg-white p-4 shadow-[0_8px_24px_rgba(17,19,24,0.04)] outline-none transition hover:border-[#b8cee1] hover:shadow-md focus-visible:ring-2 focus-visible:ring-brand"
      href={orderDetailHash(order.id)}
    >
      <div className="flex items-start justify-between gap-3">
        <strong className="truncate text-sm text-ink">{order.sourceReference}</strong>
        <StatusPill value={order.sourceStatus} />
      </div>
      <strong className="mt-3 block text-xl tracking-[-0.03em] text-ink">
        {formatMoney(order)}
      </strong>
      <p className="mt-1 text-[10px] text-muted">{formatDate(order.createdAt)}</p>
      <div className="mt-3 flex justify-between border-t border-line pt-3 text-[10px] text-muted">
        <span>{extra?.serviceType ?? "Service not supplied"}</span>
        <span>{extra?.lineCount ?? 0} lines</span>
      </div>
      <span className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-brand">
        Open exact order <span className="transition-transform group-hover:translate-x-1">→</span>
      </span>
    </a>
  );
}

function OrdersTable({ items }: { items: OrderSummary[] }) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-2xl border border-line bg-white shadow-[0_10px_30px_rgba(17,19,24,0.04)] md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead className="bg-[#f7f8fa] text-[9px] font-bold uppercase tracking-[0.1em] text-muted">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Paid / recorded</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Lines</th>
                <th className="px-4 py-3 text-right">Weight</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="w-12 px-4 py-3">
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((order) => {
                const extra = orderExtras(order.id);
                return (
                  <tr className="border-t border-line hover:bg-[#f7fafc]" key={order.id}>
                    <td className="px-4 py-3">
                      <a
                        className="font-semibold text-brand outline-none focus-visible:underline"
                        href={orderDetailHash(order.id)}
                      >
                        {order.sourceReference}
                      </a>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-muted">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="max-w-[180px] truncate px-4 py-3 text-xs text-ink">
                      {displayValue(order.customer.displayName, "Not named in source")}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-ink">
                      {extra?.serviceType ?? "Not supplied"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill value={order.sourceStatus} />
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-muted">
                      {extra?.lineCount ?? 0}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-muted">
                      {orderWeight(order)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-ink">
                      {formatMoney(order)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <a
                        aria-label={`Open order ${order.sourceReference}`}
                        className="text-lg text-brand"
                        href={orderDetailHash(order.id)}
                      >
                        →
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <section aria-label="Orders" className="grid gap-3 md:hidden">
        {items.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </section>
    </>
  );
}

function LaundroView({ overview }: { overview: OverviewResult | null }) {
  if (!overview)
    return <div className="h-48 animate-pulse rounded-2xl border border-line bg-white" />;
  if (overview.state === "unavailable")
    return (
      <section className="rounded-2xl border border-line bg-white p-6">
        <h2 className="text-lg font-bold text-ink">LaundroPortal activity is unavailable</h2>
        <p className="mt-2 text-sm text-muted">{overview.detail}</p>
      </section>
    );
  const metric = (id: string) => overview.metrics.find((item) => item.definition.metric_id === id);
  const operations = overview.vac.by_operation;
  const failures = overview.vac.by_result
    .filter((item) => !["OK", "APPROVED"].includes(item.name))
    .reduce((sum, item) => sum + item.count, 0);
  return (
    <div>
      <section className="mb-4 rounded-2xl border border-[#ddd0e4] bg-[#faf7fc] p-4">
        <p className="text-xs font-bold text-[#5f4770]">
          Machine and card activity—not customer orders
        </p>
        <p className="mt-1 text-xs leading-5 text-muted">
          LaundroPortal does not supply the WDF order ledger. Its values stay separate so machine
          revenue, card loads and cycles are not misrepresented as POS orders.
        </p>
      </section>
      <section
        aria-label="LaundroPortal activity summary"
        className="grid auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-3"
      >
        <Metric
          label="Machine revenue"
          value={money(metric("machine_revenue_total")?.total)}
          hint={`${overview.machines.machine_count} machines`}
        />
        <Metric
          label="Card value loaded"
          value={money(metric("card_value_loaded_total")?.total)}
          hint="Deposits onto laundry cards"
        />
        <Metric
          label="Washer cycles"
          value={Number(metric("washer_cycles_total")?.total ?? 0).toLocaleString("en-US")}
          hint="Dryer cycles absent from export"
        />
        <Metric
          label="Card accounts"
          value={overview.accounts.account_count.toLocaleString("en-US")}
          hint={`${overview.accounts.zero_balance.toLocaleString("en-US")} zero-balance accounts`}
        />
        <Metric
          label="Recent VAC activity"
          value={overview.vac.transaction_count.toLocaleString("en-US")}
          hint={`${failures} failed or declined results`}
        />
      </section>
      <div className="mt-4 grid items-stretch gap-4 lg:grid-cols-2">
        <ChartPanel
          coverage="Each transaction is counted once."
          subtitle="Card terminal results by type."
          title="Card terminal activity"
          unit="Transactions"
        >
          <RankedBars
            accent="#6e557e"
            points={operations.map((item) => ({ label: item.name, value: item.count }))}
            unit="COUNT"
          />
        </ChartPanel>
        <ChartPanel
          coverage="All supplied machines are included."
          subtitle="Machine revenue by washer and dryer."
          title="Machine revenue by type"
          unit="US dollars"
        >
          <DoughnutChart
            segments={Object.entries(overview.machines.by_class)
              .map(([name, value]) => ({
                label: name,
                value: Number(value.revenue),
                color: name.toLowerCase().includes("wash") ? "#66556f" : "#c8becb",
              }))
              .sort((a, b) => b.value - a.value)}
            unit="CURRENCY_USD"
          />
        </ChartPanel>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.45fr)]">
        <ChartPanel
          coverage="Failures include declined, aborted, timed-out and card-read error results exactly as recorded."
          subtitle="Successful and unsuccessful results from the recent VAC activity window."
          title="Card terminal results"
          unit="Results"
        >
          <DoughnutChart
            segments={[
              {
                label: "Successful results",
                value: overview.vac.by_result
                  .filter((item) => ["OK", "APPROVED"].includes(item.name))
                  .reduce((sum, item) => sum + item.count, 0),
                color: "#567d72",
              },
              {
                label: "Unsuccessful results",
                value: failures,
                color: "#c2410c",
              },
            ]}
            unit="COUNT"
          />
        </ChartPanel>
        <section className="rounded-2xl border border-line bg-white p-5 shadow-[0_10px_30px_rgba(17,19,24,0.04)]">
          <h2 className="text-lg font-bold text-ink">Laundro transaction details</h2>
          <p className="mt-2 text-xs leading-5 text-muted">
            Not from the current export. It provides grouped machine and VAC activity, but no
            complete transaction-level record comparable to a WDF order.
          </p>
          <dl className="mt-5 space-y-3 border-t border-line pt-4 text-xs">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">VAC rows supplied</dt>
              <dd className="font-bold text-ink">
                {overview.vac.row_count.toLocaleString("en-US")}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Transactions identified</dt>
              <dd className="font-bold text-ink">
                {overview.vac.transaction_count.toLocaleString("en-US")}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Paired records</dt>
              <dd className="font-bold text-ink">
                {overview.vac.paired_transactions.toLocaleString("en-US")}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}

function WdfOrderCharts({
  overview,
}: {
  overview: Extract<OverviewResult, { state: "available" }>;
}) {
  const analytics = overview.wdf_sales.analytics;
  return (
    <div className="grid items-stretch gap-4 lg:grid-cols-12">
      <ChartPanel
        className="lg:col-span-8"
        coverage="Each column counts distinct paid WDF tickets in that calendar month."
        subtitle="Monthly volume shows when the counter is busiest and where order demand rises or falls."
        title="Monthly order volume"
        unit="Orders"
      >
        <ColumnChart
          accent="#355f86"
          height={170}
          points={analytics.by_month.map((row) => ({
            label: MONTHS[Number(row.period?.slice(5)) - 1] ?? row.period ?? "Unknown",
            value: row.order_count,
            caption: `${money(row.subtotal)} net sales · ${Number(row.pounds).toLocaleString("en-US", { maximumFractionDigits: 0 })} lb`,
          }))}
          unit="COUNT"
        />
      </ChartPanel>
      <ChartPanel
        className="lg:col-span-4"
        coverage="Every paid ticket is assigned to the service grouping recorded in the WDF sales analysis."
        subtitle="Order counts separate laundry-service demand from retail-only tickets."
        title="Order type mix"
        unit="Orders"
      >
        <DoughnutChart
          segments={analytics.by_service_type
            .map((row) => ({
              label: row.name ?? "Unclassified",
              value: row.order_count,
              color: row.name === "Laundry service" ? "#355f86" : "#a67f4c",
            }))
            .sort((a, b) => b.value - a.value)}
          unit="COUNT"
        />
      </ChartPanel>
    </div>
  );
}

export function OrderQueuePage({
  gateway,
  analyticsGateway,
}: {
  gateway: OrdersGateway;
  analyticsGateway?: AnalyticsGateway;
}) {
  const [source, setSource] = useState<Source>("wdf");
  const [view, setView] = useState<ViewState>({ status: "loading" });
  const [overview, setOverview] = useState<OverviewResult | null>(null);
  const [search, setSearch] = useState("");
  const [sourceStatus, setSourceStatus] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const [ledgerOpen, setLedgerOpen] = useState(false);

  const load = useCallback(
    (query: OrderListQuery, signal?: AbortSignal) =>
      gateway.listOrders(query, signal).then(
        (data) => setView({ status: "ready", data, items: data.items }),
        (error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") return;
          const details = error as { message?: string; correlationId?: string | null };
          setView({
            status: "error",
            message: details.message ?? "Orders could not be loaded.",
            correlationId: details.correlationId ?? null,
          });
        },
      ),
    [gateway],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load({ limit: PAGE_SIZE }, controller.signal);
    if (analyticsGateway)
      void analyticsGateway.getOverview(controller.signal).then(setOverview, () =>
        setOverview({
          state: "unavailable",
          reason: "ANALYTICS_ARTIFACT_NOT_BUILT",
          detail: "The source summary could not be read.",
        }),
      );
    return () => controller.abort();
  }, [analyticsGateway, load]);

  const query = useMemo<OrderListQuery>(
    () => ({
      limit: PAGE_SIZE,
      ...(search.trim() ? { search: search.trim() } : {}),
      ...(sourceStatus ? { sourceStatus } : {}),
      ...(serviceType ? { paymentStatus: serviceType } : {}),
    }),
    [search, sourceStatus, serviceType],
  );
  function submit(event: FormEvent) {
    event.preventDefault();
    setView({ status: "loading" });
    void load(query);
  }
  async function loadMore() {
    if (view.status !== "ready" || !view.data.page.nextCursor) return;
    setLoadingMore(true);
    try {
      const next = await gateway.listOrders({ ...query, cursor: view.data.page.nextCursor });
      setView({ status: "ready", data: next, items: [...view.items, ...next.items] });
    } finally {
      setLoadingMore(false);
    }
  }

  const analytics = overview?.state === "available" ? overview : null;
  const reportedOrders = view.status === "ready" ? (view.data.coverage.reportedTotal ?? 0) : 0;
  const paidOrders = analytics?.wdf_sales.analytics.totals.order_count ?? reportedOrders;

  function goToSource(next: Source) {
    setSource(next);
    document
      .getElementById(next === "wdf" ? "counter-orders" : "machine-card-activity")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  }

  return (
    <div className="mt-3 grid gap-8">
      <SourceSwitch source={source} onChange={goToSource} />

      <section className="grid scroll-mt-32 gap-4" id="counter-orders">
        <SectionHeader
          description="Paid tickets, customer order detail and service demand recorded at the counter."
          source="WDF POS"
          title="Counter orders"
        />
        <div>
          <section
            aria-label="WDF order summary"
            className="grid auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            <Metric
              label="Paid orders"
              value={paidOrders.toLocaleString("en-US")}
              hint="Paid WDF order records"
            />
            <Metric
              label="Net sales"
              value={money(analytics?.wdf_sales.analytics.totals.net_sales)}
              hint="Paid line values in the workbook"
            />
            <Metric
              label="Average order"
              value={money(analytics?.wdf_sales.analytics.totals.average_ticket)}
              hint="Net sales ÷ paid orders"
            />
            <Metric
              label="Laundry orders"
              value={(
                analytics?.wdf_sales.operations.customers.laundry_order_count ?? 0
              ).toLocaleString("en-US")}
              hint="Orders containing a laundry line"
            />
            <Metric
              label="Refund lines"
              value={(analytics?.wdf_sales.negative_lines ?? 0).toLocaleString("en-US")}
              hint="Included in net sales"
            />
          </section>
          {analytics ? (
            <div className="mt-4">
              <WdfOrderCharts overview={analytics} />
            </div>
          ) : null}
          <section className="mt-4 overflow-hidden rounded-2xl border border-line bg-white shadow-[0_8px_28px_rgba(17,19,24,0.04)]">
            <div
              className={`flex flex-wrap items-center justify-between gap-3 px-4 py-4 ${ledgerOpen ? "border-b border-line" : ""}`}
            >
              <div>
                <h2 className="text-lg font-bold text-ink">Find and open an exact order</h2>
                <p className="mt-1 text-xs text-muted">
                  Answer who ordered, what service was used, when it happened and how much was
                  recorded.
                </p>
              </div>
              <div className="flex items-center gap-3">
                {view.status === "ready" ? (
                  <p className="text-[10px] font-semibold text-muted">
                    {view.data.coverage.reportedTotal?.toLocaleString("en-US") ?? "Unknown"} records
                  </p>
                ) : null}
                <button
                  aria-expanded={ledgerOpen}
                  className="inline-flex min-w-[118px] items-center justify-center gap-2 rounded-xl border border-[#b9cad8] bg-[#f4f8fb] px-4 py-2.5 text-xs font-bold text-[#315f88] outline-none transition hover:bg-[#e9f1f8] focus-visible:ring-2 focus-visible:ring-brand"
                  onClick={() => setLedgerOpen((open) => !open)}
                  type="button"
                >
                  {ledgerOpen ? "Hide orders" : "Open orders"}
                  <span
                    aria-hidden="true"
                    className={`transition-transform ${ledgerOpen ? "rotate-180" : ""}`}
                  >
                    ⌄
                  </span>
                </button>
              </div>
            </div>
            {ledgerOpen ? (
              <form
                aria-label="Order search and filters"
                className="grid gap-3 p-4 lg:grid-cols-[minmax(260px,1fr)_190px_190px_auto]"
                onSubmit={submit}
              >
                <label className="relative">
                  <span className="sr-only">Search orders</span>
                  <ProductIcon
                    area="orders"
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                  />
                  <input
                    className="h-11 w-full rounded-xl border border-line bg-canvas pl-10 pr-3 text-sm outline-none placeholder:text-[#929399] focus:border-brand"
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Order number or customer"
                    value={search}
                  />
                </label>
                <label>
                  <span className="sr-only">Order status</span>
                  <select
                    aria-label="Order status"
                    className="h-11 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-brand"
                    onChange={(event) => setSourceStatus(event.target.value)}
                    value={sourceStatus}
                  >
                    <option value="">All order statuses</option>
                    {ORDER_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="sr-only">Service type</span>
                  <select
                    aria-label="Service type"
                    className="h-11 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-brand"
                    onChange={(event) => setServiceType(event.target.value)}
                    value={serviceType}
                  >
                    <option value="">All service types</option>
                    {SERVICE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className="h-11 rounded-xl bg-ink px-5 text-xs font-bold text-white transition hover:bg-[#303238]"
                  type="submit"
                >
                  Apply filters
                </button>
              </form>
            ) : null}
          </section>
          {ledgerOpen && view.status === "loading" ? (
            <section aria-label="Loading orders" className="mt-4 grid gap-3">
              {[0, 1, 2].map((item) => (
                <div
                  className="h-16 animate-pulse rounded-2xl border border-line bg-white"
                  key={item}
                />
              ))}
            </section>
          ) : null}
          {view.status === "error" ? (
            <section className="mt-4 rounded-2xl border border-[#efc2c2] bg-[#fff5f5] p-6">
              <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#ad3838]">
                ORDERS COULD NOT BE READ
              </p>
              <h2 className="mt-2 text-xl font-bold text-ink">{view.message}</h2>
              <p className="mt-2 text-xs leading-5 text-muted">
                No orders are shown because a failed read must never be presented as the
                store&apos;s history.{view.correlationId ? ` Reference: ${view.correlationId}` : ""}
              </p>
              <button
                className="mt-4 rounded-xl bg-ink px-4 py-2.5 text-xs font-bold text-white"
                onClick={() => {
                  setView({ status: "loading" });
                  void load({ limit: PAGE_SIZE });
                }}
                type="button"
              >
                Try again
              </button>
            </section>
          ) : null}
          {ledgerOpen && view.status === "ready" && view.items.length === 0 ? (
            <section className="mt-4 grid min-h-[240px] place-items-center rounded-2xl border border-dashed border-[#d7d9df] bg-white/60 px-6 text-center">
              <div>
                <h2 className="text-xl font-bold text-ink">No orders match these filters</h2>
                <p className="mt-2 text-sm text-muted">
                  Adjust the search or filters to widen the result set.
                </p>
              </div>
            </section>
          ) : null}
          {ledgerOpen && view.status === "ready" && view.items.length > 0 ? (
            <div className="mt-4">
              <OrdersTable items={view.items} />
              {view.data.page.hasMore ? (
                <div className="mt-4 grid place-items-center">
                  <button
                    className="rounded-xl border border-line bg-white px-5 py-2.5 text-xs font-bold text-ink hover:border-brand hover:text-brand disabled:opacity-50"
                    disabled={loadingMore}
                    onClick={() => void loadMore()}
                    type="button"
                  >
                    {loadingMore ? "Loading…" : "Load more orders"}
                  </button>
                </div>
              ) : null}
              <p className="mt-3 text-[10px] leading-4 text-muted">
                Customer and order-status fields appear only where the supplied Order List names
                them. Open any row for its exact line items and source evidence.
              </p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="grid scroll-mt-32 gap-4" id="machine-card-activity">
        <SectionHeader
          description="Machine revenue, cycles, stored-value cards and terminal activity. These are not POS customer orders."
          source="LaundroPortal"
          title="Machine & card activity"
        />
        <LaundroView overview={overview} />
      </section>
    </div>
  );
}
