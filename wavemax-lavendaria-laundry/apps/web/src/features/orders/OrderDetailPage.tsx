import { useEffect, useState, type ReactNode } from "react";

import { ProductIcon } from "../../components/ui/ProductIcon";
import type { OrderDetailResponse, OrdersGateway } from "./orders-gateway";
import { orderExtras } from "./static-orders-gateway";

type DetailState =
  | { status: "loading" }
  | { status: "ready"; data: OrderDetailResponse }
  | { status: "error"; message: string; statusCode: number | null; correlationId: string | null };

function text(value: string | null, fallback = "Not supplied by source") {
  return value?.trim() || fallback;
}

function dateTime(value: string | null) {
  if (!value) return "Not supplied by source";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function money(amount: string | null, currency: string | null) {
  return amount && currency ? `${currency} ${amount}` : "Not supplied by source";
}

function DetailPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5 shadow-[0_10px_30px_rgba(17,19,24,0.04)] sm:p-6">
      <h2 className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-muted">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  const unavailable = value === "Not supplied by source";
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.06em] text-muted">{label}</dt>
      <dd
        className={`mt-1.5 break-words text-sm font-semibold ${unavailable ? "text-[#929399]" : "text-ink"}`}
      >
        {value}
      </dd>
    </div>
  );
}

export function OrderDetailPage({
  gateway,
  orderId,
  issueCode,
}: {
  gateway: OrdersGateway;
  orderId: string;
  issueCode?: string | undefined;
}) {
  const [view, setView] = useState<DetailState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setView({ status: "loading" });
      try {
        setView({ status: "ready", data: await gateway.getOrder(orderId, controller.signal) });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        const details = error as {
          message?: string;
          status?: number;
          correlationId?: string | null;
        };
        setView({
          status: "error",
          message: details.message ?? "This order could not be loaded.",
          statusCode: details.status ?? null,
          correlationId: details.correlationId ?? null,
        });
      }
    }
    void load();
    return () => controller.abort();
  }, [gateway, orderId]);

  if (view.status === "loading") {
    return (
      <div aria-live="polite">
        <a className="text-xs font-bold text-brand" href="#orders">
          ← Back to orders
        </a>
        <div className="mt-6 h-10 w-64 rounded-xl bg-[#e7e8eb]" />
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {[0, 1, 2, 3].map((item) => (
            <div className="h-52 rounded-2xl border border-line bg-white" key={item} />
          ))}
        </div>
      </div>
    );
  }

  if (view.status === "error") {
    const unavailable = view.statusCode === 503;
    return (
      <div>
        <a className="text-xs font-bold text-brand" href="#orders">
          ← Back to orders
        </a>
        <section className="mt-6 grid min-h-[420px] place-items-center rounded-3xl border border-line bg-white p-6 text-center shadow-panel">
          <div className="max-w-lg">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-soft text-brand">
              <ProductIcon area="orders" className="h-7 w-7" />
            </span>
            <p className="mt-6 text-[9px] font-extrabold uppercase tracking-[0.13em] text-brand">
              {unavailable ? "WAITING FOR VERIFIED ORDER DATA" : "ORDER COULD NOT BE OPENED"}
            </p>
            <h1 className="mt-3 text-[clamp(26px,4vw,40px)] font-bold tracking-[-0.04em] text-ink">
              {view.message}
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted">
              {unavailable
                ? "The exact order cannot be verified until WDF is connected. No placeholder customer, payment, or timeline information is shown."
                : "Return to the order queue and try again after the service is restored."}
            </p>
            {view.correlationId ? (
              <p className="mt-4 text-[10px] font-semibold text-muted">
                Support reference: {view.correlationId}
              </p>
            ) : null}
          </div>
        </section>
      </div>
    );
  }

  const { order, coverage } = view.data;
  const lines = orderExtras(order.id)?.lines ?? [];
  // Summed as whole cents so the footer agrees with the workbook to the cent.
  const linesTotal =
    lines.reduce((total, line) => total + Math.round(Number(line.subtotal) * 100), 0) / 100;
  return (
    <div>
      <a className="text-xs font-bold text-brand" href="#orders">
        ← Back to orders
      </a>
      <header className="mt-6 flex flex-col gap-5 border-b border-line pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[9px] font-extrabold uppercase tracking-[0.13em] text-brand">
            VERIFIED ORDER VIEW
          </p>
          <h1 className="mt-2 text-[clamp(30px,4vw,46px)] font-bold tracking-[-0.045em] text-ink">
            Order {order.sourceReference}
          </h1>
          <p className="mt-2 text-sm text-muted">Created {dateTime(order.createdAt)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-brand-soft px-3 py-2 text-[10px] font-bold text-[#2759c8]">
            {text(order.sourceStatus, "Status unavailable")}
          </span>
          <span className="rounded-full border border-line bg-white px-3 py-2 text-[10px] font-bold text-ink">
            {coverage.state} coverage
          </span>
        </div>
      </header>

      {issueCode ? (
        <section
          className="mt-5 flex flex-col gap-2 rounded-2xl border border-[#bfd3fa] bg-[#f2f6ff] p-4 sm:flex-row sm:items-center sm:justify-between"
          aria-label="Command Center issue context"
        >
          <div>
            <strong className="block text-sm text-ink">Opened from Command Center</strong>
            <p className="mt-1 text-xs text-muted">
              This order is the exact record connected to the selected issue.
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-bold text-[#2759c8]">
            Issue reference: {issueCode}
          </span>
        </section>
      ) : null}

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-4 md:grid-cols-2">
          <DetailPanel title="Customer">
            <dl className="grid gap-5 sm:grid-cols-2">
              <Field label="Name" value={text(order.customer.displayName)} />
              <Field label="Identity" value={order.customer.identityState.replaceAll("_", " ")} />
              <Field label="Phone" value={text(order.customer.phone)} />
              <Field label="Email" value={text(order.customer.email)} />
            </dl>
          </DetailPanel>
          <DetailPanel title="Service and workflow">
            <dl className="grid gap-5 sm:grid-cols-2">
              <Field label="Service" value={text(order.serviceType)} />
              <Field label="Channel" value={text(order.channel)} />
              <Field label="Stage" value={text(order.sourceStatus)} />
              <Field label="Machine" value={text(order.assignment.machineReference)} />
            </dl>
          </DetailPanel>
          <DetailPanel title="Payment">
            <dl className="grid gap-5 sm:grid-cols-2">
              <Field label="Total" value={money(order.total.amount, order.total.currency)} />
              <Field label="Payment state" value={text(order.payment.sourceStatus)} />
              <Field label="Method" value={text(order.payment.sourceMethod)} />
              <Field
                label="Subtotal"
                value={money(order.subtotal.amount, order.subtotal.currency)}
              />
              <Field label="Tax" value={money(order.tax.amount, order.tax.currency)} />
              <Field label="Tip" value={money(order.tip.amount, order.tip.currency)} />
              <Field
                label="Surcharge"
                value={money(order.surcharge.amount, order.surcharge.currency)}
              />
            </dl>
          </DetailPanel>
          <DetailPanel title="Promise and assignment">
            <dl className="grid gap-5 sm:grid-cols-2">
              <Field label="Ready promise" value={dateTime(order.promise.promisedReadyAt)} />
              <Field label="Delivery promise" value={dateTime(order.promise.promisedDeliveryAt)} />
              <Field label="Assigned employee" value={text(order.assignment.employeeDisplayName)} />
              <Field label="Instructions" value={text(order.instructions)} />
            </dl>
          </DetailPanel>

          <DetailPanel title="Order items">
            {lines.length ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[420px] border-collapse text-xs">
                    <caption className="sr-only">Line items recorded against this order</caption>
                    <thead>
                      <tr className="border-b border-line text-left text-muted">
                        <th className="pb-2 text-[9px] font-bold uppercase tracking-[0.08em]">
                          Item
                        </th>
                        <th className="pb-2 text-right text-[9px] font-bold uppercase tracking-[0.08em]">
                          Quantity
                        </th>
                        <th className="pb-2 text-right text-[9px] font-bold uppercase tracking-[0.08em]">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {lines.map((line, index) => (
                        <tr
                          className="border-b border-line/60 last:border-b-0"
                          key={`${line.item}-${index}`}
                        >
                          <td className="py-2 pr-3 text-ink">
                            {line.item}
                            <span className="mt-0.5 block text-[10px] text-muted">
                              {line.department}
                            </span>
                          </td>
                          <td className="py-2 text-right tabular-nums text-muted">
                            {line.quantity}
                            {line.units ? ` ${line.units}` : ""}
                          </td>
                          <td className="py-2 text-right font-mono tabular-nums text-ink">
                            {Number(line.subtotal).toLocaleString("en-US", {
                              style: "currency",
                              currency: "USD",
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-line">
                        <td className="pt-2 text-[10px] font-bold uppercase tracking-[0.08em] text-muted">
                          {lines.length} {lines.length === 1 ? "line" : "lines"}
                        </td>
                        <td />
                        <td className="pt-2 text-right font-mono text-sm font-semibold tabular-nums text-ink">
                          {linesTotal.toLocaleString("en-US", {
                            style: "currency",
                            currency: "USD",
                          })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <p className="mt-3 border-t border-line pt-3 text-[10px] leading-[1.5] text-muted">
                  Every line as the sales workbook recorded it. The lines sum to the order subtotal
                  shown above.
                </p>
              </>
            ) : (
              <p className="text-sm leading-6 text-muted">
                This order has no line items in the sales workbook. Voided orders are recorded in
                the Void Report as a single corrected amount, without their original lines.
              </p>
            )}
          </DetailPanel>
        </div>

        <div className="grid content-start gap-4">
          <DetailPanel title="Order history">
            {order.events.length ? (
              <ol className="grid gap-5">
                {order.events.map((event) => (
                  <li className="relative border-l-2 border-[#dce6fd] pl-5" key={event.id}>
                    <span className="absolute -left-[6px] top-1 h-2.5 w-2.5 rounded-full bg-brand" />
                    <strong className="block text-sm text-ink">{event.sourceLabel}</strong>
                    <span className="mt-1 block text-xs text-muted">
                      {dateTime(event.occurredAt)} · {text(event.actorDisplayName)}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm leading-6 text-muted">
                No event history was supplied by the source.
              </p>
            )}
          </DetailPanel>
          <DetailPanel title="Notes">
            <p className="text-sm leading-6 text-muted">{text(order.notes)}</p>
          </DetailPanel>
          <DetailPanel title="Source evidence">
            <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <Field label="Source" value={order.lineage.source} />
              <Field label="Source updated" value={dateTime(order.lineage.sourceUpdatedAt)} />
              <Field label="Parser version" value={order.lineage.parserVersion} />
              <Field label="Rule version" value={order.lineage.ruleVersion} />
            </dl>
            {order.unavailableFields.length ? (
              <p className="mt-5 rounded-xl bg-amber-soft p-3 text-xs leading-5 text-[#72551c]">
                {order.unavailableFields.length} fields were not supplied. Missing values remain
                visible and were not replaced.
              </p>
            ) : null}
          </DetailPanel>
        </div>
      </div>
    </div>
  );
}
