import type { ProductArea, Session } from "../../app/auth/session-types";

export interface NavigationItem {
  area: ProductArea;
  label: string;
  shortLabel: string;
  group: "Workspace" | "People" | "Control";
  description: string;
  launchOnly?: boolean;
}

const navigation: readonly NavigationItem[] = [
  {
    area: "command-center",
    label: "Command center",
    shortLabel: "Command",
    group: "Workspace",
    description: "The operating view for the store right now.",
  },
  {
    area: "executive",
    label: "Executive dashboard",
    shortLabel: "Executive",
    group: "Workspace",
    description: "The owner view across WDF POS and LaundroPortal.",
  },
  {
    area: "analytics",
    label: "Business analytics",
    shortLabel: "Analytics",
    group: "Workspace",
    description: "Sales, finance, trends, and calculation evidence.",
  },
  {
    area: "orders",
    label: "Orders",
    shortLabel: "Orders",
    group: "Workspace",
    description: "Search, inspect, schedule, and track customer orders.",
  },
  {
    area: "operations",
    label: "Store operations",
    shortLabel: "Operations",
    group: "Workspace",
    description: "Workload, busy periods, and volume through the store.",
  },
  {
    area: "inventory",
    label: "Inventory",
    shortLabel: "Inventory",
    group: "Workspace",
    description: "Supplies, stock levels, and usage controls.",
  },
  {
    area: "workforce",
    label: "Workforce management",
    shortLabel: "Workforce",
    group: "People",
    description: "Schedules, attendance, time, coverage, and approvals.",
  },
  {
    area: "data-sources",
    label: "Data sources",
    shortLabel: "Sources",
    group: "Control",
    description: "Every ingested file, with its verified fingerprint.",
  },
];

export function navigationFor(session: Session): readonly NavigationItem[] {
  return navigation.filter(
    (item) => !item.launchOnly && session.permittedAreas.includes(item.area),
  );
}

export function findNavigationItem(area: ProductArea): NavigationItem {
  return navigation.find((item) => item.area === area) ?? navigation[0]!;
}
