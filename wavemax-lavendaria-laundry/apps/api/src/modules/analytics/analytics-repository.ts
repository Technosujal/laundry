import type { AnalyticsResult } from "./analytics-types.js";

/**
 * Source of analytics data.
 *
 * The file-backed implementation reads the artifact produced by the Python service. A
 * vendor-API-backed implementation can replace it without changing the service or routes.
 */
export interface AnalyticsRepository {
  getAnalytics(storeId: string): Promise<AnalyticsResult>;
}
