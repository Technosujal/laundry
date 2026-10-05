import type { Actor } from "../modules/auth/access-policy.js";

declare global {
  namespace Express {
    interface Locals {
      correlationId: string;
      externalAuthSubject?: string;
      actor?: Actor;
    }
  }
}

export {};
