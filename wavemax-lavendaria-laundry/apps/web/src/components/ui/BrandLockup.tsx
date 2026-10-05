interface BrandLockupProps {
  compact?: boolean;
  inverse?: boolean;
}

export function BrandLockup({ compact = false, inverse = false }: BrandLockupProps) {
  return (
    <span
      className={`brand-lockup relative inline-flex items-center rounded-xl ${inverse ? "bg-white px-2 py-1" : ""}`}
    >
      <img
        alt="WaveMAX Laundry"
        className={`brand-logo ${compact ? "h-7" : "h-8 sm:h-11"} w-auto max-w-[172px] object-contain`}
        src="/wavemax-signage-logo.png"
      />
    </span>
  );
}
