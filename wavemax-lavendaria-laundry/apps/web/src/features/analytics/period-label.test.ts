import { describe, expect, it } from "vitest";

import { formatPeriodLabel } from "./period-label";

describe("analytics period labels", () => {
  it("renders service date keys as readable English without timezone conversion", () => {
    expect(formatPeriodLabel("2025-01-01", "day")).toBe("January 1, 2025");
    expect(formatPeriodLabel("2025-03", "month")).toBe("March 2025");
    expect(formatPeriodLabel("2025", "year")).toBe("2025");
  });

  it("supports compact chart-axis labels", () => {
    expect(formatPeriodLabel("2025-12-31", "day", true)).toBe("Dec 31");
    expect(formatPeriodLabel("2025-09", "month", true)).toBe("Sep");
  });
});
