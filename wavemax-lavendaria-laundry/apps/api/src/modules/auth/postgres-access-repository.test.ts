import type { Pool } from "pg";
import { describe, expect, it, vi } from "vitest";

import type { Actor } from "./access-policy.js";
import { PostgresAccessRepository } from "./postgres-access-repository.js";

describe("Postgres workforce scope", () => {
  it("scopes manager employees by store, authenticated manager, and effective time", async () => {
    const query = vi.fn(async (_statement: string, _parameters: readonly unknown[]) => ({
      rows: [{ id: "assigned-employee" }],
    }));
    const repository = new PostgresAccessRepository({ query } as unknown as Pool);
    const manager: Actor = { id: "manager-id", storeId: "store-id", role: "MANAGER" };
    const at = new Date("2026-09-14T12:00:00Z");

    await expect(repository.listVisibleEmployeeIds(manager, at)).resolves.toEqual([
      "assigned-employee",
    ]);

    const [statement, parameters] = query.mock.calls[0]!;
    expect(statement).toContain("assignment.manager_user_id = $2");
    expect(statement).toContain("employee.store_id = $1");
    expect(statement).toContain("assignment.effective_from <= $3");
    expect(parameters).toEqual(["store-id", "manager-id", at]);
  });

  it("uses only store scope for owners", async () => {
    const query = vi.fn(async (_statement: string, _parameters: readonly unknown[]) => ({
      rows: [],
    }));
    const repository = new PostgresAccessRepository({ query } as unknown as Pool);
    const owner: Actor = { id: "owner-id", storeId: "store-id", role: "OWNER" };

    await repository.listVisibleEmployeeIds(owner, new Date("2026-09-14T12:00:00Z"));

    const [statement, parameters] = query.mock.calls[0]!;
    expect(statement).not.toContain("manager_assignments");
    expect(parameters).toEqual(["store-id"]);
  });

  it("scopes employees to their own linked record", async () => {
    const query = vi.fn(async (_statement: string, _parameters: readonly unknown[]) => ({
      rows: [{ id: "own-employee-id" }],
    }));
    const repository = new PostgresAccessRepository({ query } as unknown as Pool);
    const employee: Actor = { id: "user-id", storeId: "store-id", role: "EMPLOYEE" };

    await expect(repository.listVisibleEmployeeIds(employee, new Date())).resolves.toEqual([
      "own-employee-id",
    ]);
    const [statement, parameters] = query.mock.calls[0]!;
    expect(statement).toContain("application_user_id = $2");
    expect(statement).toContain("store_id = $1");
    expect(statement).not.toContain("manager_assignments");
    expect(parameters).toEqual(["store-id", "user-id"]);
  });
});
