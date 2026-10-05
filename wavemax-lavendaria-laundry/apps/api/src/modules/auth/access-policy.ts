export const roles = ["OWNER", "MANAGER", "EMPLOYEE"] as const;
export type AppRole = (typeof roles)[number];

export const areas = [
  "command-center",
  "orders",
  "analytics",
  "finance",
  "workforce",
  "data-sources",
] as const;
export type ProductArea = (typeof areas)[number];

export interface Actor {
  id: string;
  storeId: string;
  role: AppRole;
}

const permissions: Record<AppRole, readonly ProductArea[]> = {
  OWNER: areas,
  MANAGER: ["command-center", "orders", "workforce"],
  EMPLOYEE: ["command-center", "workforce"],
};

export function permittedAreas(role: AppRole): readonly ProductArea[] {
  return permissions[role];
}

export function canAccessArea(role: AppRole, area: ProductArea): boolean {
  return permissions[role].includes(area);
}
