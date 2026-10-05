export function EmptyPanel({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: string;
}) {
  return (
    <section className="mt-[18px] grid min-h-0 grid-cols-1 items-center gap-9 overflow-hidden rounded-[18px] border border-line bg-white p-6 shadow-panel sm:p-10 lg:min-h-[390px] lg:grid-cols-[minmax(240px,0.85fr)_minmax(300px,1.15fr)] lg:gap-[clamp(34px,6vw,86px)] lg:p-[clamp(30px,5vw,66px)]">
      <div
        className="empty-chart-grid relative grid h-[170px] w-full max-w-[480px] grid-cols-3 items-end gap-3.5 rounded-2xl border border-[#dfe5f2] p-7 sm:h-[220px]"
        aria-hidden="true"
      >
        <span className="relative min-h-[58px] rounded-t-[7px] bg-gradient-to-b from-[#7891a5] to-brand opacity-25" />
        <span className="relative min-h-[124px] rounded-t-[7px] bg-gradient-to-b from-[#7891a5] to-brand opacity-25" />
        <span className="relative min-h-[88px] rounded-t-[7px] bg-gradient-to-b from-[#7891a5] to-brand opacity-25" />
      </div>
      <div>
        <p className="text-[9px] font-extrabold uppercase tracking-[0.13em] text-brand">
          WAITING FOR VERIFIED DATA
        </p>
        <h3 className="mt-3 text-[clamp(20px,2.2vw,29px)] font-bold tracking-[-0.025em] text-ink">
          {title}
        </h3>
        <p className="mt-2.5 max-w-[580px] text-[13px] leading-[1.72] text-muted">{description}</p>
        {action ? (
          <button
            className="mt-[22px] rounded-[9px] border-0 bg-[#222326] px-3.5 py-2.5 text-[11px] font-bold text-white outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            type="button"
          >
            {action}
          </button>
        ) : null}
      </div>
    </section>
  );
}
