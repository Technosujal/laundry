import { useEffect, useState } from "react";

import type { AnalyticsGateway, OverviewResult } from "../analytics/analytics-gateway";

const vendors = [
  {
    name: "WDF POS",
    system: "WDF_POS",
    purpose: "Orders, payments, production, shifts, and customer service activity.",
  },
  {
    name: "LaundroPortal / Laundrolux",
    system: "LAUNDRO_PORTAL",
    purpose: "Machine cycles, stored-value payments, cards, accounts, and machine activity.",
  },
] as const;

function Pill({ tone, children }: { tone: "warn" | "ok" | "info"; children: React.ReactNode }) {
  const style =
    tone === "ok"
      ? "border-[#bfe3cd] bg-[#e8f7ee] text-[#1c6238]"
      : tone === "info"
        ? "border-[#bfd3fa] bg-[#f2f6ff] text-[#2759c8]"
        : "border-[#e6d6aa] bg-amber-soft text-[#815c15]";
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2 py-1 text-[8px] font-extrabold uppercase ${style}`}
    >
      {children}
    </span>
  );
}

export function DataSourcesPage({ gateway }: { gateway: AnalyticsGateway }) {
  const [result, setResult] = useState<OverviewResult | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    gateway
      .getOverview(controller.signal)
      .then(setResult)
      .catch(() => setResult(null));
    return () => controller.abort();
  }, [gateway]);

  const sources = result && result.state === "available" ? result.sources : [];

  return (
    <div className="mt-[18px] grid gap-3">
      <div className="rounded-[15px] border border-line bg-white/75 px-5 py-4 text-[11px] leading-[1.6] text-muted">
        <strong className="text-ink">Every supplied file is accounted for below.</strong> Files used
        in calculations are marked “Used in analysis.” Alternate PDF/CSV renderings are retained
        without double-counting, and files containing no usable records are stated plainly. Every
        file is verified by content fingerprint.
      </div>

      {vendors.map((vendor) => {
        const files = sources.filter((source) => source.source_system === vendor.system);
        return (
          <article
            className="overflow-hidden rounded-[15px] border border-line bg-white p-[18px] shadow-[0_8px_25px_rgba(17,19,24,0.04)] sm:p-6"
            key={vendor.name}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[13px] bg-brand-soft text-[11px] font-extrabold text-[#222326]">
                  {vendor.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[15px] font-bold text-ink">{vendor.name}</h3>
                    <Pill tone="info">Verified file ingestion</Pill>
                    {files.length > 0 ? (
                      <Pill tone="ok">{files.length} files accounted for</Pill>
                    ) : (
                      <Pill tone="warn">No files ingested</Pill>
                    )}
                  </div>
                  <p className="mt-2 text-[11px] leading-4 text-muted">{vendor.purpose}</p>
                </div>
              </div>
              <dl className="grid shrink-0 grid-cols-2 gap-5 border-t border-line pt-3 sm:border-0 sm:pt-0">
                <div>
                  <dt className="text-[9px] text-muted">Data path</dt>
                  <dd className="mt-1 text-[10px] font-bold text-ink">Vendor export files</dd>
                </div>
                <div>
                  <dt className="text-[9px] text-muted">Integrity</dt>
                  <dd className="mt-1 text-[10px] font-bold text-ink">
                    {files.length > 0 ? "SHA-256 verified" : "Nothing ingested"}
                  </dd>
                </div>
              </dl>
            </div>

            {files.length > 0 ? (
              <div className="mt-4 border-t border-line pt-4">
                <h4 className="text-[9px] font-bold uppercase tracking-[0.08em] text-muted">
                  Supplied files, use, and verified fingerprint
                </h4>
                <div className="mt-2.5 overflow-x-auto">
                  <table className="w-full min-w-[760px] border-collapse text-[10px]">
                    <thead>
                      <tr className="border-b border-line text-left text-muted">
                        <th className="pb-1.5 font-semibold">File</th>
                        <th className="pb-1.5 font-semibold">Use</th>
                        <th className="pb-1.5 text-right font-semibold">Rows scanned</th>
                        <th className="pb-1.5 text-right font-semibold">Cells scanned</th>
                        <th className="pb-1.5 text-right font-semibold">Size</th>
                        <th className="pb-1.5 text-right font-semibold">SHA-256</th>
                        <th className="pb-1.5 text-right font-semibold">Parser</th>
                      </tr>
                    </thead>
                    <tbody>
                      {files.map((file) => (
                        <tr className="border-b border-line/60 last:border-b-0" key={file.file}>
                          <td className="py-1.5 pr-3 text-ink">{file.file}</td>
                          <td className="py-1.5 pr-3 text-muted">
                            {file.disposition === "NO_RECORDS"
                              ? "Reviewed · no records"
                              : file.disposition === "REFERENCE_COPY"
                                ? "Reference copy"
                                : "Used in analysis"}
                          </td>
                          <td className="py-1.5 text-right tabular-nums text-muted">
                            {file.row_count === undefined
                              ? "Not tabular"
                              : file.row_count.toLocaleString("en-US")}
                          </td>
                          <td className="py-1.5 text-right tabular-nums text-muted">
                            {file.non_empty_cells === undefined
                              ? "Not tabular"
                              : file.non_empty_cells.toLocaleString("en-US")}
                          </td>
                          <td className="py-1.5 text-right tabular-nums text-muted">
                            {(file.size_bytes / 1024).toFixed(0)} KB
                          </td>
                          <td className="py-1.5 text-right font-mono text-muted">
                            {file.sha256.slice(0, 12)}…
                          </td>
                          <td className="py-1.5 text-right font-mono text-muted">
                            {file.parser_version}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </article>
        );
      })}

      {result && result.state === "available" ? (
        <p className="text-[10px] text-muted">Build reference {result.run_id.slice(0, 16)}</p>
      ) : null}
    </div>
  );
}
