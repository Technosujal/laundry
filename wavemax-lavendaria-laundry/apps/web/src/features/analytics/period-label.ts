export type AnalyticsGrain = "day" | "month" | "year";

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** Formats service period keys without letting the browser's timezone move a date. */
export function formatPeriodLabel(period: string, grain: AnalyticsGrain, compact = false): string {
  if (grain === "year") return period;
  const [year, month, day] = period.split("-").map(Number);
  if (!year || !month || month < 1 || month > 12) return period;
  const fullMonthName = monthNames[month - 1];
  if (!fullMonthName) return period;
  const monthName = compact ? fullMonthName.slice(0, 3) : fullMonthName;
  if (grain === "month") return compact ? monthName : `${monthName} ${year}`;
  if (!day) return period;
  return compact ? `${monthName} ${day}` : `${monthName} ${day}, ${year}`;
}
