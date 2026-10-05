import type { Pool } from "pg";

import type { AccessRepository } from "./access-repository.js";
import type { Actor, AppRole } from "./access-policy.js";

interface ActorRow {
  id: string;
  store_id: string;
  role: AppRole;
}

export class PostgresAccessRepository implements AccessRepository {
  public constructor(private readonly pool: Pool) {}

  public async findActiveActor(externalAuthSubject: string): Promise<Actor | null> {
    const result = await this.pool.query<ActorRow>(
      `SELECT id, store_id, role
       FROM application_users
       WHERE external_auth_subject = $1 AND active = true`,
      [externalAuthSubject],
    );
    const row = result.rows[0];
    return row ? { id: row.id, storeId: row.store_id, role: row.role } : null;
  }

  public async listVisibleEmployeeIds(actor: Actor, at: Date): Promise<readonly string[]> {
    if (actor.role === "OWNER") {
      const result = await this.pool.query<{ id: string }>(
        `SELECT id FROM employees WHERE store_id = $1 AND active = true ORDER BY id`,
        [actor.storeId],
      );
      return result.rows.map((row) => row.id);
    }

    if (actor.role === "EMPLOYEE") {
      const result = await this.pool.query<{ id: string }>(
        `SELECT id FROM employees
         WHERE store_id = $1 AND application_user_id = $2 AND active = true`,
        [actor.storeId, actor.id],
      );
      return result.rows.map((row) => row.id);
    }

    const result = await this.pool.query<{ id: string }>(
      `SELECT employee.id
       FROM employees AS employee
       INNER JOIN manager_assignments AS assignment
         ON assignment.employee_id = employee.id
        AND assignment.store_id = employee.store_id
       WHERE employee.store_id = $1
         AND employee.active = true
         AND assignment.manager_user_id = $2
         AND assignment.effective_from <= $3
         AND (assignment.effective_until IS NULL OR assignment.effective_until > $3)
       ORDER BY employee.id`,
      [actor.storeId, actor.id, at],
    );
    return result.rows.map((row) => row.id);
  }
}
