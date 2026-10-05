import type { OverviewResult } from "../analytics/analytics-gateway";

type AvailableOverview = Extract<OverviewResult, { state: "available" }>;

function numeric(value: string | number | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function deriveExecutiveMetrics(result: AvailableOverview) {
  const metric = (id: string) =>
    result.metrics.find((candidate) => candidate.definition.metric_id === id);
  const washerCycleMetric = metric("washer_cycles_total");
  const accountActivityMetric = metric("accounts_used_total");
  const cardLoadedMetric = metric("card_value_loaded_total");
  const machineRevenueMetric = metric("machine_revenue_total");
  const managementStartsMetric = metric("management_card_starts_value");
  const newCardsMetric = metric("new_cards_total");

  const paidOrders = result.wdf_sales.analytics.totals.order_count;
  const washerCycles = numeric(washerCycleMetric?.total);
  const washerRevenue = numeric(result.machines.by_class.WASHER?.revenue);
  const cardValueLoaded = numeric(cardLoadedMetric?.total);
  const machineRevenue = numeric(machineRevenueMetric?.total);
  const managementStarts = numeric(managementStartsMetric?.total);

  return {
    paidOrders,
    washerCycles,
    recordedServiceEvents: paidOrders + washerCycles,
    averageDailyWasherCycles: washerCycles / Math.max(washerCycleMetric?.distinct_days ?? 0, 1),
    washerRevenue,
    washerRevenuePerCycle: washerCycles > 0 ? washerRevenue / washerCycles : 0,
    accountActivity: numeric(accountActivityMetric?.total),
    averageDailyCardActivity:
      numeric(accountActivityMetric?.total) /
      Math.max(accountActivityMetric?.distinct_days ?? 0, 1),
    cardValueLoaded,
    machineRevenue,
    loadSpendGap: cardValueLoaded - machineRevenue,
    loadSpendGapPercent:
      cardValueLoaded > 0 ? ((cardValueLoaded - machineRevenue) / cardValueLoaded) * 100 : 0,
    managementStarts,
    managementStartsShare: machineRevenue > 0 ? (managementStarts / machineRevenue) * 100 : 0,
    outstandingCardBalance: numeric(result.accounts.total_balance),
    newCards: numeric(newCardsMetric?.total),
    paymentGap: numeric(result.wdf_sales.financial_summary.payment_gap),
    washerCyclesByMonth:
      washerCycleMetric?.by_month.map((point) => ({
        period: point.period,
        value: numeric(point.value),
      })) ?? [],
    accountActivityByMonth:
      accountActivityMetric?.by_month.map((point) => ({
        period: point.period,
        value: numeric(point.value),
      })) ?? [],
  };
}
