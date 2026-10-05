export type AppRole = "OWNER" | "MANAGER" | "EMPLOYEE";

export type ProductArea =
  | "command-center"
  | "executive"
  | "orders"
  | "operations"
  | "analytics"
  | "finance"
  | "workforce"
  | "inventory"
  | "data-sources";

export interface Session {
  role: AppRole;
  permittedAreas: readonly ProductArea[];
}

export const developmentSessions: Record<AppRole, Session> = {
  OWNER: {
    role: "OWNER",
    permittedAreas: [
      "command-center",
      "executive",
      "orders",
      "operations",
      "analytics",
      "finance",
      "workforce",
      "inventory",
      "data-sources",
    ],
  },
  MANAGER: {
    role: "MANAGER",
    permittedAreas: ["command-center", "orders", "operations", "workforce", "inventory"],
  },
  EMPLOYEE: {
    role: "EMPLOYEE",
    permittedAreas: ["command-center", "workforce"],
  },
};
