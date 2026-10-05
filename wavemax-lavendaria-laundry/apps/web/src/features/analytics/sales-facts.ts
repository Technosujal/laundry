import type { SalesBucket, WdfSalesAnalytics } from "./analytics-gateway";

/**
 * The line-level fact table published by the analytics service.
 *
 * Every column is a comma-delimited run of integers in the service's own row order, each in a
 * fixed unit named by `scales`. A cross-filtered total is therefore an exact sum of integers
 * rather than a second, divergent calculation.
 */
export interface SalesFacts {
  facts_version: string;
  available: boolean;
  columns: string[];
  /** Integer units per whole unit, per measure, chosen from the source's own precision. */
  scales: { subtotal: number; tax: number; pounds: number };
  row_count: number;
  days: string[];
  departments: string[];
  categories: string[];
  items: string[];
  orders: string[];
  data: Record<string, string>;
  checksum: {
    subtotal_cents: number;
    tax_units: number;
    pounds_milli: number;
    line_count: number;
    order_count: number;
  };
}

export type FilterDimension =
  "month" | "department" | "category" | "weekday" | "item" | "hour" | "service";

export interface SalesFilter {
  dimension: FilterDimension;
  /** The value exactly as the service published it, so a chip always names a real row. */
  value: string;
  /** What to show the reader; equal to `value` unless the axis label differs from the key. */
  label: string;
}

export interface DecodedFacts {
  day: Int32Array;
  hour: Int32Array;
  department: Int32Array;
  category: Int32Array;
  item: Int32Array;
  order: Int32Array;
  subtotalCents: Int32Array;
  taxUnits: Int32Array;
  poundsMilli: Int32Array;
  laundry: Int32Array;
  /** Calendar month index per row, resolved once from the day dictionary. */
  month: Int32Array;
  weekday: Int32Array;
  /** ISO week index per row, into `weeks`. */
  week: Int32Array;
  months: string[];
  weeks: string[];
  weekdays: string[];
  dictionary: SalesFacts;
}

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/** ISO-8601 week key, matching the service's own `_iso_week`. */
function isoWeek(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`);
  // Shift to the Thursday of this ISO week; its calendar year is the ISO week-numbering year.
  const day = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - day + 3);
  const year = date.getUTCFullYear();
  const firstThursday = new Date(Date.UTC(year, 0, 4));
  const firstDay = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDay + 3);
  const week = 1 + Math.round((date.getTime() - firstThursday.getTime()) / (7 * 86400000));
  return `${String(year).padStart(4, "0")}-W${String(week).padStart(2, "0")}`;
}

function toInt32Array(encoded: string | undefined, length: number): Int32Array {
  const out = new Int32Array(length);
  if (!encoded) return out;
  let index = 0;
  let value = 0;
  let negative = false;
  let started = false;
  for (let position = 0; position < encoded.length; position += 1) {
    const code = encoded.charCodeAt(position);
    if (code === 44) {
      out[index] = negative ? -value : value;
      index += 1;
      value = 0;
      negative = false;
      started = false;
      continue;
    }
    if (code === 45 && !started) {
      negative = true;
      started = true;
      continue;
    }
    started = true;
    value = value * 10 + (code - 48);
  }
  if (index < length) out[index] = negative ? -value : value;
  return out;
}

/** Decode once per artifact load; filtering then costs one pass over typed arrays. */
export function decodeFacts(facts: SalesFacts): DecodedFacts {
  const length = facts.row_count;
  const day = toInt32Array(facts.data["day"], length);

  // Day index to month index and weekday index, resolved through the day dictionary so each
  // distinct date is parsed once rather than once per line.
  const monthKeys: string[] = [];
  const weekKeys: string[] = [];
  const monthOfDay = new Int32Array(facts.days.length);
  const weekOfDay = new Int32Array(facts.days.length);
  const weekdayOfDay = new Int32Array(facts.days.length);
  facts.days.forEach((iso, dayIndex) => {
    const key = iso.slice(0, 7);
    let monthIndex = monthKeys.indexOf(key);
    if (monthIndex === -1) monthIndex = monthKeys.push(key) - 1;
    monthOfDay[dayIndex] = monthIndex;

    const weekKey = isoWeek(iso);
    let weekIndex = weekKeys.indexOf(weekKey);
    if (weekIndex === -1) weekIndex = weekKeys.push(weekKey) - 1;
    weekOfDay[dayIndex] = weekIndex;

    // Parsed as UTC so the reader's own timezone can never move a line into another day.
    weekdayOfDay[dayIndex] = (new Date(`${iso}T00:00:00Z`).getUTCDay() + 6) % 7;
  });

  const month = new Int32Array(length);
  const week = new Int32Array(length);
  const weekday = new Int32Array(length);
  for (let row = 0; row < length; row += 1) {
    const dayIndex = day[row] ?? 0;
    month[row] = monthOfDay[dayIndex] ?? 0;
    week[row] = weekOfDay[dayIndex] ?? 0;
    weekday[row] = weekdayOfDay[dayIndex] ?? 0;
  }

  return {
    day,
    hour: toInt32Array(facts.data["hour"], length),
    department: toInt32Array(facts.data["department"], length),
    category: toInt32Array(facts.data["category"], length),
    item: toInt32Array(facts.data["item"], length),
    order: toInt32Array(facts.data["order"], length),
    subtotalCents: toInt32Array(facts.data["subtotal_cents"], length),
    taxUnits: toInt32Array(facts.data["tax_units"], length),
    poundsMilli: toInt32Array(facts.data["pounds_milli"], length),
    laundry: toInt32Array(facts.data["laundry_service"], length),
    month,
    week,
    weekday,
    months: monthKeys,
    weeks: weekKeys,
    weekdays: WEEKDAYS,
    dictionary: facts,
  };
}

function money(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const absolute = Math.abs(cents);
  return `${sign}${Math.floor(absolute / 100)}.${String(absolute % 100).padStart(2, "0")}`;
}

/**
 * Tax travels in hundred-thousandths because the source carries up to 17 decimal places on it.
 * Summing first and rounding once here is what keeps a filtered tax figure equal to the
 * service's own; rounding per line would lose $4.36 across the year.
 */
function taxMoney(units: number): string {
  return money(Math.round(units / 1000));
}

function poundsOf(milli: number): string {
  if (milli % 1000 === 0) return String(milli / 1000);
  const sign = milli < 0 ? "-" : "";
  const absolute = Math.abs(milli);
  const hundredths = Math.round((absolute % 1000) / 10);
  return `${sign}${Math.floor(absolute / 1000)}.${String(hundredths).padStart(2, "0")}`;
}

function columnFor(facts: DecodedFacts, dimension: FilterDimension): Int32Array {
  switch (dimension) {
    case "month":
      return facts.month;
    case "department":
      return facts.department;
    case "category":
      return facts.category;
    case "item":
      return facts.item;
    case "weekday":
      return facts.weekday;
    case "hour":
      return facts.hour;
    case "service":
      return facts.laundry;
  }
}

/** Resolve a filter to the row-level index it selects, or null when the value is unknown. */
function indexFor(facts: DecodedFacts, filter: SalesFilter): number | null {
  if (filter.dimension === "hour") {
    const hour = Number(filter.value);
    return Number.isInteger(hour) ? hour : null;
  }
  if (filter.dimension === "service") {
    const index = ["Retail", "Laundry service"].indexOf(filter.value);
    return index === -1 ? null : index;
  }
  const lookup: Record<Exclude<FilterDimension, "hour" | "service">, string[]> = {
    month: facts.months,
    department: facts.dictionary.departments,
    category: facts.dictionary.categories,
    item: facts.dictionary.items,
    weekday: facts.weekdays,
  };
  const index = lookup[filter.dimension].indexOf(filter.value);
  return index === -1 ? null : index;
}

/**
 * Rows selected by every active filter.
 *
 * Filters on different dimensions intersect, which is what a reader means by clicking March
 * and then Laundry: March, and within it only Laundry.
 */
export function selectRows(facts: DecodedFacts, filters: SalesFilter[]): Int32Array {
  const resolved: { column: Int32Array; index: number }[] = [];
  for (const filter of filters) {
    const index = indexFor(facts, filter);
    // A filter naming a value the source does not contain selects nothing. Skipping it would
    // show the unfiltered total under a chip claiming otherwise, which is the one outcome a
    // reader cannot detect.
    if (index === null) return new Int32Array(0);
    resolved.push({ column: columnFor(facts, filter.dimension), index });
  }

  const length = facts.month.length;
  const selected = new Int32Array(length);
  let count = 0;
  for (let row = 0; row < length; row += 1) {
    let matches = true;
    for (const { column, index } of resolved) {
      if (column[row] !== index) {
        matches = false;
        break;
      }
    }
    if (matches) {
      selected[count] = row;
      count += 1;
    }
  }
  return selected.subarray(0, count);
}

interface Accumulator {
  cents: number;
  tax: number;
  lines: number;
  milli: number;
  orders: Set<number>;
}

function emptyAccumulator(): Accumulator {
  return { cents: 0, tax: 0, lines: 0, milli: 0, orders: new Set<number>() };
}

function add(target: Accumulator, facts: DecodedFacts, row: number): void {
  target.cents += facts.subtotalCents[row] ?? 0;
  target.tax += facts.taxUnits[row] ?? 0;
  target.milli += facts.poundsMilli[row] ?? 0;
  target.lines += 1;
  target.orders.add(facts.order[row] ?? 0);
}

function toBucket(accumulator: Accumulator, key: Partial<SalesBucket>): SalesBucket {
  const orders = accumulator.orders.size;
  return {
    ...key,
    subtotal: money(accumulator.cents),
    tax: taxMoney(accumulator.tax),
    line_count: accumulator.lines,
    order_count: orders,
    pounds: poundsOf(accumulator.milli),
    average_ticket: orders ? money(Math.round(accumulator.cents / orders)) : null,
  } as SalesBucket;
}

function group(
  facts: DecodedFacts,
  rows: Int32Array,
  column: Int32Array,
): Map<number, Accumulator> {
  const groups = new Map<number, Accumulator>();
  for (let position = 0; position < rows.length; position += 1) {
    const row = rows[position] ?? 0;
    const key = column[row] ?? 0;
    let accumulator = groups.get(key);
    if (accumulator === undefined) {
      accumulator = emptyAccumulator();
      groups.set(key, accumulator);
    }
    add(accumulator, facts, row);
  }
  return groups;
}

function byValue(rows: SalesBucket[]): SalesBucket[] {
  return [...rows].sort((a, b) => Number(b.subtotal) - Number(a.subtotal));
}

/**
 * Rebuild the published series over a filtered subset of the same lines.
 *
 * Every measure is summed as integer cents or thousandths of a pound and formatted once at
 * the end, so a filtered figure is exact in the same sense the service's own figure is. Only
 * the series a reader can cross-filter are rebuilt; the rest are carried through from the
 * service unchanged.
 */
export function aggregate(
  facts: DecodedFacts,
  rows: Int32Array,
  base: WdfSalesAnalytics,
): WdfSalesAnalytics {
  const overall = emptyAccumulator();
  const days = new Set<number>();
  for (let position = 0; position < rows.length; position += 1) {
    const row = rows[position] ?? 0;
    add(overall, facts, row);
    days.add(facts.day[row] ?? 0);
  }

  const monthGroups = group(facts, rows, facts.month);
  const dayGroups = group(facts, rows, facts.day);
  const weekdayGroups = group(facts, rows, facts.weekday);
  const hourGroups = group(facts, rows, facts.hour);
  const departmentGroups = group(facts, rows, facts.department);
  const categoryGroups = group(facts, rows, facts.category);
  const itemGroups = group(facts, rows, facts.item);
  const weekGroups = group(facts, rows, facts.week);
  const serviceGroups = group(facts, rows, facts.laundry);
  const orderServiceFlags = new Map<number, Set<number>>();
  for (let position = 0; position < rows.length; position += 1) {
    const row = rows[position] ?? 0;
    const order = facts.order[row] ?? 0;
    let flags = orderServiceFlags.get(order);
    if (!flags) {
      flags = new Set<number>();
      orderServiceFlags.set(order, flags);
    }
    flags.add(facts.laundry[row] ?? 0);
  }
  const orderTypeGroups = new Map<number, Accumulator>();
  for (let position = 0; position < rows.length; position += 1) {
    const row = rows[position] ?? 0;
    const flags = orderServiceFlags.get(facts.order[row] ?? 0) ?? new Set<number>();
    const key = flags.size > 1 ? 2 : flags.has(1) ? 0 : 1;
    let accumulator = orderTypeGroups.get(key);
    if (!accumulator) {
      accumulator = emptyAccumulator();
      orderTypeGroups.set(key, accumulator);
    }
    add(accumulator, facts, row);
  }

  const byMonth = [...monthGroups.entries()]
    .map(([key, value]) => toBucket(value, { period: facts.months[key] ?? "" }))
    .sort((a, b) => ((a.period ?? "") < (b.period ?? "") ? -1 : 1));

  const byDay = [...dayGroups.entries()]
    .map(([key, value]) => toBucket(value, { period: facts.dictionary.days[key] ?? "" }))
    .sort((a, b) => ((a.period ?? "") < (b.period ?? "") ? -1 : 1));

  // Trailing seven-day average over the open days that survive the filter, matching the
  // service's own definition of the window.
  const trailing: WdfSalesAnalytics["trailing"] = [];
  const window: number[] = [];
  for (const point of byDay) {
    window.push(Math.round(Number(point.subtotal) * 100));
    if (window.length > 7) window.shift();
    const sum = window.reduce((total, value) => total + value, 0);
    trailing.push({
      period: point.period ?? "",
      subtotal: point.subtotal,
      trailing_average: money(Math.round(sum / window.length)),
    });
  }

  const momentum: WdfSalesAnalytics["momentum"] = byMonth.map((row, index) => {
    const previous = index === 0 ? null : Number(byMonth[index - 1]?.subtotal ?? 0);
    const current = Number(row.subtotal);
    return {
      period: row.period ?? "",
      subtotal: row.subtotal,
      change:
        previous === null || previous === 0
          ? null
          : (((current - previous) / previous) * 100).toFixed(2),
    };
  });

  const heat = new Map<number, Set<number>>();
  for (let position = 0; position < rows.length; position += 1) {
    const row = rows[position] ?? 0;
    const key = (facts.weekday[row] ?? 0) * 24 + (facts.hour[row] ?? 0);
    let orders = heat.get(key);
    if (orders === undefined) {
      orders = new Set<number>();
      heat.set(key, orders);
    }
    orders.add(facts.order[row] ?? 0);
  }
  const heatmap: WdfSalesAnalytics["heatmap"] = [];
  for (let weekday = 0; weekday < 7; weekday += 1) {
    for (let hour = 0; hour < 24; hour += 1) {
      heatmap.push({ weekday, hour, order_count: heat.get(weekday * 24 + hour)?.size ?? 0 });
    }
  }

  const named = (groups: Map<number, Accumulator>, dictionary: string[]) =>
    byValue(
      [...groups.entries()].map(([key, value]) => toBucket(value, { name: dictionary[key] ?? "" })),
    );

  const items = named(itemGroups, facts.dictionary.items);
  const rankedDays = byValue(byDay);
  const orderCount = overall.orders.size;

  return {
    ...base,
    totals: {
      ...base.totals,
      net_sales: money(overall.cents),
      tax: taxMoney(overall.tax),
      pounds: poundsOf(overall.milli),
      order_count: orderCount,
      line_count: overall.lines,
      open_days: days.size,
      average_ticket: orderCount ? money(Math.round(overall.cents / orderCount)) : null,
      average_day: days.size ? money(Math.round(overall.cents / days.size)) : null,
      first_day: byDay[0]?.period ?? base.totals.first_day,
      last_day: byDay[byDay.length - 1]?.period ?? base.totals.last_day,
    },
    by_month: byMonth,
    by_week: [...weekGroups.entries()]
      .map(([key, value]) => toBucket(value, { period: facts.weeks[key] ?? "" }))
      .sort((a, b) => ((a.period ?? "") < (b.period ?? "") ? -1 : 1)),
    by_day: byDay,
    trailing,
    momentum,
    by_weekday: [...weekdayGroups.entries()]
      .map(([key, value]) => ({
        ...toBucket(value, { weekday: facts.weekdays[key] ?? "" }),
        weekday_index: key,
      }))
      .sort((a, b) => a.weekday_index - b.weekday_index),
    by_hour: [...hourGroups.entries()]
      .map(([key, value]) => toBucket(value, { hour: key }))
      .sort((a, b) => (a.hour ?? 0) - (b.hour ?? 0)),
    heatmap,
    by_department: named(departmentGroups, facts.dictionary.departments),
    by_category: named(categoryGroups, facts.dictionary.categories),
    by_service_type: named(serviceGroups, ["Retail", "Laundry service"]),
    by_order_type: named(orderTypeGroups, ["Laundry only", "Retail only", "Both"]),
    top_items_by_value: items.slice(0, 15),
    top_items_by_volume: [...items].sort((a, b) => b.line_count - a.line_count).slice(0, 15),
    per_pound_services: items.filter((row) => Number(row.pounds) > 0).slice(0, 12),
    best_days: rankedDays.slice(0, 10),
    slowest_days: [...rankedDays].reverse().slice(0, 10),
  };
}
