import { describe, expect, it } from "vitest";

import { loadArtifact } from "../../test/artifact";
import type { WdfSales } from "./analytics-gateway";
import { aggregate, decodeFacts, selectRows, type SalesFacts } from "./sales-facts";

/**
 * These tests run against the published artifact rather than a fixture.
 *
 * Cross-filtering recomputes series in the browser, so the guarantee that matters is that the
 * browser's arithmetic and the analytics service's arithmetic agree on the same lines. With no
 * filter applied the two must produce identical strings; anything less means a filtered figure
 * cannot be trusted either.
 */
const artifact = loadArtifact<{ wdf_sales: WdfSales & { facts: SalesFacts } }>();

const facts = artifact.wdf_sales.facts;
const published = artifact.wdf_sales.analytics;
const decoded = decodeFacts(facts);
const allRows = selectRows(decoded, []);

describe("published fact table", () => {
  it("carries one row per accepted line", () => {
    expect(facts.available).toBe(true);
    expect(facts.row_count).toBe(published.totals.line_count);
    expect(allRows.length).toBe(published.totals.line_count);
  });

  it("agrees with the service's own checksum", () => {
    expect(facts.checksum.subtotal_cents).toBe(
      Math.round(Number(published.totals.net_sales) * 100),
    );
    expect(facts.checksum.order_count).toBe(published.totals.order_count);
  });
});

describe("unfiltered browser aggregation", () => {
  const rebuilt = aggregate(decoded, allRows, published);

  it("reproduces the service's headline totals exactly", () => {
    expect(rebuilt.totals.net_sales).toBe(published.totals.net_sales);
    expect(rebuilt.totals.tax).toBe(published.totals.tax);
    expect(rebuilt.totals.pounds).toBe(published.totals.pounds);
    expect(rebuilt.totals.order_count).toBe(published.totals.order_count);
    expect(rebuilt.totals.line_count).toBe(published.totals.line_count);
    expect(rebuilt.totals.open_days).toBe(published.totals.open_days);
    expect(rebuilt.totals.average_ticket).toBe(published.totals.average_ticket);
    expect(rebuilt.totals.first_day).toBe(published.totals.first_day);
    expect(rebuilt.totals.last_day).toBe(published.totals.last_day);
  });

  it("reproduces every monthly row exactly", () => {
    expect(rebuilt.by_month).toHaveLength(published.by_month.length);
    rebuilt.by_month.forEach((row, index) => {
      const expected = published.by_month[index];
      expect(row.period).toBe(expected?.period);
      expect(row.subtotal).toBe(expected?.subtotal);
      expect(row.order_count).toBe(expected?.order_count);
      expect(row.line_count).toBe(expected?.line_count);
      expect(row.pounds).toBe(expected?.pounds);
    });
  });

  it("reproduces every department and weekday row exactly", () => {
    published.by_department.forEach((expected) => {
      const row = rebuilt.by_department.find((candidate) => candidate.name === expected.name);
      expect(row?.subtotal).toBe(expected.subtotal);
      expect(row?.order_count).toBe(expected.order_count);
    });
    published.by_weekday.forEach((expected) => {
      const row = rebuilt.by_weekday.find((candidate) => candidate.weekday === expected.weekday);
      expect(row?.subtotal).toBe(expected.subtotal);
      expect(row?.order_count).toBe(expected.order_count);
    });
  });

  it("reproduces the weekly and service-type series exactly", () => {
    expect(rebuilt.by_week).toHaveLength(published.by_week.length);
    rebuilt.by_week.forEach((row, index) => {
      expect(row.period).toBe(published.by_week[index]?.period);
      expect(row.subtotal).toBe(published.by_week[index]?.subtotal);
    });
    published.by_service_type.forEach((expected) => {
      const row = rebuilt.by_service_type.find((candidate) => candidate.name === expected.name);
      expect(row?.subtotal).toBe(expected.subtotal);
      expect(row?.order_count).toBe(expected.order_count);
    });
  });

  it("reproduces the daily series and the activity heatmap exactly", () => {
    expect(rebuilt.by_day).toHaveLength(published.by_day.length);
    rebuilt.by_day.forEach((row, index) => {
      expect(row.subtotal).toBe(published.by_day[index]?.subtotal);
    });
    expect(rebuilt.heatmap).toHaveLength(published.heatmap.length);
    rebuilt.heatmap.forEach((cell, index) => {
      expect(cell.order_count).toBe(published.heatmap[index]?.order_count);
    });
  });
});

describe("cross-filtering", () => {
  it("restricts a month filter to that month and keeps the service's own subtotal", () => {
    const month = published.by_month[2];
    const rows = selectRows(decoded, [
      { dimension: "month", value: month?.period ?? "", label: "" },
    ]);
    const filtered = aggregate(decoded, rows, published);
    expect(filtered.totals.net_sales).toBe(month?.subtotal);
    expect(filtered.totals.order_count).toBe(month?.order_count);
    expect(filtered.by_month).toHaveLength(1);
  });

  it("restricts a department filter to the service's own department subtotal", () => {
    const department = published.by_department[0];
    const rows = selectRows(decoded, [
      { dimension: "department", value: department?.name ?? "", label: "" },
    ]);
    const filtered = aggregate(decoded, rows, published);
    expect(filtered.totals.net_sales).toBe(department?.subtotal);
    expect(filtered.by_department).toHaveLength(1);
  });

  it("restricts a service filter to the published laundry or retail subtotal", () => {
    const service = published.by_service_type.find((row) => row.name === "Laundry service");
    const rows = selectRows(decoded, [
      { dimension: "service", value: service?.name ?? "", label: "" },
    ]);
    const filtered = aggregate(decoded, rows, published);
    expect(filtered.totals.net_sales).toBe(service?.subtotal);
    expect(filtered.by_service_type).toHaveLength(1);
    expect(filtered.by_service_type[0]?.name).toBe("Laundry service");
  });

  it("intersects filters across dimensions rather than combining them", () => {
    const month = published.by_month[5]?.period ?? "";
    const department = published.by_department[0]?.name ?? "";
    const both = aggregate(
      decoded,
      selectRows(decoded, [
        { dimension: "month", value: month, label: "" },
        { dimension: "department", value: department, label: "" },
      ]),
      published,
    );
    const monthOnly = aggregate(
      decoded,
      selectRows(decoded, [{ dimension: "month", value: month, label: "" }]),
      published,
    );
    const inMonth = monthOnly.by_department.find((row) => row.name === department);
    expect(both.totals.net_sales).toBe(inMonth?.subtotal);
    expect(Number(both.totals.net_sales)).toBeLessThanOrEqual(Number(monthOnly.totals.net_sales));
  });

  it("every monthly subtotal still sums to the published year total", () => {
    const summed = published.by_month.reduce(
      (total, row) => total + Math.round(Number(row.subtotal) * 100),
      0,
    );
    expect(summed).toBe(Math.round(Number(published.totals.net_sales) * 100));
  });

  it("returns an empty, not a fabricated, result for a value that does not exist", () => {
    const rows = selectRows(decoded, [
      { dimension: "department", value: "No such department", label: "" },
    ]);
    // An unknown value selects nothing rather than silently falling back to everything.
    expect(rows.length).toBe(0);
    expect(aggregate(decoded, rows, published).totals.net_sales).toBe("0.00");
  });
});
