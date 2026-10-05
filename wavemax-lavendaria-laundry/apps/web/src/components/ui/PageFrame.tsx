import type { ReactNode } from "react";

/**
 * `dataState` describes what this page can actually show:
 *  - "none"    no verified source is connected for this area
 *  - "partial" verified data exists but does not cover the whole business question
 *  - "sourced" every figure on the page is traceable to a verified source
 */
export type PageDataState = "none" | "partial" | "sourced";

const badges: Record<PageDataState, { label: string; className: string; dot: string }> = {
  none: {
    label: "No data connected",
    className: "border-[#e6d6aa] bg-amber-soft text-[#77591d]",
    dot: "bg-[#c58a1d] shadow-[0_0_0_4px_rgba(197,138,29,0.13)]",
  },
  partial: {
    label: "Source limits",
    className: "border-[#e6d6aa] bg-amber-soft text-[#77591d]",
    dot: "bg-[#c58a1d] shadow-[0_0_0_4px_rgba(197,138,29,0.13)]",
  },
  sourced: {
    label: "Sourced from verified files",
    className: "border-[#cce4bb] bg-[#edf8e6] text-[#315f27]",
    dot: "bg-[#73b649] shadow-[0_0_0_4px_rgba(115,182,73,0.13)]",
  },
};

export function PageFrame({
  title,
  description,
  children,
  dataState = "none",
  scopeNote = "One store · Open 24 hours · Eastern Time proposed",
  compact = false,
}: {
  title: string;
  description: string;
  children: ReactNode;
  dataState?: PageDataState;
  scopeNote?: string;
  /** Uses the same hierarchy with tighter spacing for information-dense workspaces. */
  compact?: boolean;
}) {
  const badge = badges[dataState];
  return (
    <>
      <header
        className={`flex flex-col items-start sm:flex-row sm:items-end sm:justify-between ${compact ? "gap-3" : "gap-6"}`}
      >
        <div>
          <p className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-brand">
            WAVEMAX · COLERAIN
          </p>
          <h1
            className={`${compact ? "mt-1.5 text-[24px] sm:text-[29px]" : "mt-2.5 text-[27px] sm:text-[clamp(27px,3vw,36px)]"} font-bold tracking-[-0.045em] text-ink`}
          >
            {title}
          </h1>
          <p
            className={`${compact ? "mt-1 text-[13px] leading-5" : "mt-2 text-sm leading-6"} max-w-[690px] text-muted`}
          >
            {description}
          </p>
        </div>
        <div
          className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-[10px] font-bold ${badge.className}`}
        >
          <span className={`h-[7px] w-[7px] rounded-full ${badge.dot}`} />
          {badge.label}
        </div>
      </header>
      <div
        className={`${compact ? "mt-4 px-3.5 py-2.5" : "mt-7 px-4 py-3"} flex flex-col items-start gap-1 rounded-xl border border-line bg-white text-[11px] text-muted shadow-[0_4px_14px_rgba(29,47,78,0.025)] sm:flex-row sm:items-center sm:gap-3`}
      >
        <strong className="text-ink">Current scope</strong>
        <span>{scopeNote}</span>
      </div>
      {children}
    </>
  );
}
