export function StoreIdentity({
  accessLabel,
  variant = "plain",
}: {
  accessLabel?: string;
  variant?: "plain" | "chip";
}) {
  return (
    <span
      className={`flex min-w-0 items-center gap-2.5 ${variant === "chip" ? "rounded-xl border border-line bg-[#f8faff] px-2.5 py-1.5" : ""}`}
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px] bg-[#eaf2ff] text-[#2563eb]">
        <svg
          aria-hidden="true"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
        >
          <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
          <circle cx="12" cy="10" r="2.4" />
        </svg>
      </span>
      <span className="min-w-0">
        <strong className="block truncate text-[11px] font-bold leading-tight text-ink">
          Colerain store
        </strong>
        <small className="mt-0.5 block truncate text-[9px] leading-tight text-muted">
          {accessLabel ?? "Single location"}
        </small>
      </span>
      {variant === "chip" ? (
        <svg
          aria-hidden="true"
          className="h-3.5 w-3.5 shrink-0 text-[#71819a]"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
        >
          <path d="m7 10 5 5 5-5" />
        </svg>
      ) : null}
    </span>
  );
}
