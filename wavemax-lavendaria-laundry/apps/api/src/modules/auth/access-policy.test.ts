import { describe, expect, it } from "vitest";

import { canAccessArea, permittedAreas } from "./access-policy.js";

describe("access policy", () => {
  it("gives the owner every approved product area", () => {
    expect(permittedAreas("OWNER")).toEqual([
      "command-center",
      "orders",
      "analytics",
      "finance",
      "workforce",
      "data-sources",
    ]);
  });

  it("keeps analytics, finance, and data sources inaccessible to managers", () => {
    expect(permittedAreas("MANAGER")).toEqual(["command-center", "orders", "workforce"]);
    expect(canAccessArea("MANAGER", "analytics")).toBe(false);
    expect(canAccessArea("MANAGER", "finance")).toBe(false);
    expect(canAccessArea("MANAGER", "data-sources")).toBe(false);
  });

  it("limits employees to their own workforce area", () => {
    expect(permittedAreas("EMPLOYEE")).toEqual(["command-center", "workforce"]);
    for (const area of ["orders", "analytics", "finance", "data-sources"] as const) {
      expect(canAccessArea("EMPLOYEE", area)).toBe(false);
    }
  });
});
