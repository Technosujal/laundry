import type { CSSProperties } from "react";

import type { ProductArea } from "../../app/auth/session-types";

const paths: Record<ProductArea, readonly string[]> = {
  "command-center": ["M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"],
  executive: ["M4 16a8 8 0 0 1 16 0", "M12 16l4-4", "M5 20h14", "M7 12l-2-2M17 12l2-2M12 8V5"],
  orders: ["M6 3h12v18H6z", "M9 8h6M9 12h6M9 16h4"],
  operations: ["M12 8v4l3 2", "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z"],
  analytics: ["M4 20V10M10 20V4M16 20v-7M22 20H2"],
  finance: ["M4 19V9M10 19V5M16 19v-7M2 19h20"],
  workforce: [
    "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    "M2 21a7 7 0 0 1 14 0M17 4a3 3 0 0 1 0 6M17 14a5 5 0 0 1 5 5",
  ],
  inventory: ["M4 8l8-4 8 4-8 4z", "M4 8v9l8 4 8-4V8M12 12v9"],
  "data-sources": [
    "M4 5c0 1.7 3.6 3 8 3s8-1.3 8-3-3.6-3-8-3-8 1.3-8 3z",
    "M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6",
  ],
};

export function ProductIcon({
  area,
  className = "h-5 w-5",
  style,
}: {
  area: ProductArea;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[area].map((path) => (
        <path d={path} key={path} />
      ))}
    </svg>
  );
}
