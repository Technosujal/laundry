import { readFile } from "node:fs/promises";

import type { AnalyticsRepository } from "./analytics-repository.js";
import type { AnalyticsArtifact, AnalyticsResult } from "./analytics-types.js";

/**
 * Reads the deterministic artifact emitted by the Python analytics service.
 *
 * A missing artifact is reported as an explicit unavailable state rather than an error or an
 * empty success, so the interface can distinguish "not built yet" from "built and empty".
 */
export class ArtifactAnalyticsRepository implements AnalyticsRepository {
  public constructor(private readonly artifactPath: string) {}

  public async getAnalytics(_storeId: string): Promise<AnalyticsResult> {
    let raw: string;
    try {
      raw = await readFile(this.artifactPath, "utf8");
    } catch {
      return {
        state: "unavailable",
        reason: "ANALYTICS_ARTIFACT_NOT_BUILT",
        detail:
          "No analytics artifact is present. Run the analytics build command to generate it from the supplied source files.",
      };
    }

    const artifact = JSON.parse(raw) as AnalyticsArtifact;
    return { state: "available", ...artifact };
  }
}
