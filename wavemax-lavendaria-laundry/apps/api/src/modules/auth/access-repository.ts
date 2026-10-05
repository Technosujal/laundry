import type { Actor } from "./access-policy.js";

export interface AccessRepository {
  findActiveActor(externalAuthSubject: string): Promise<Actor | null>;
  listVisibleEmployeeIds(actor: Actor, at: Date): Promise<readonly string[]>;
}
