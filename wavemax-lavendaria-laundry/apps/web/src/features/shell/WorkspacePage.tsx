import { lazy, Suspense } from "react";

import type { ProductArea, Session } from "../../app/auth/session-types";
import { EmptyPanel } from "../../components/ui/EmptyPanel";
import { PageFrame } from "../../components/ui/PageFrame";
import { DataSourcesPage } from "../data-sources/DataSourcesPage";
import { AnalyticsPage } from "../analytics/AnalyticsPage";
import { ExecutiveDashboardPage } from "../executive/ExecutiveDashboardPage";
import type { AnalyticsGateway } from "../analytics/analytics-gateway";
import { OperationsPage } from "../operations/OperationsPage";
import { FinancePage } from "../finance/FinancePage";
import { OrderQueuePage } from "../orders/OrderQueuePage";
import { OrderDetailPage } from "../orders/OrderDetailPage";
import type { OrdersGateway } from "../orders/orders-gateway";
import { WorkforcePage } from "../workforce/WorkforcePage";
import type { PreviewWorkforceControls } from "../workforce/preview-workforce-controls";
import { CommandCenterHome } from "./CommandCenterHome";

const ArchivedWorkforcePage = import.meta.env.DEV
  ? lazy(() => import("../workforce/ArchivedWorkforcePage").then((module) => ({ default: module.ArchivedWorkforcePage })))
  : null;

const content: Record<
  Exclude<ProductArea, "data-sources" | "finance">,
  { title: string; description: string; panelTitle: string; panelDescription: string }
> = {
  "command-center": {
    title: "Command center",
    description: "A focused operating view of what needs attention across the store.",
    panelTitle: "There is no operating activity to show yet",
    panelDescription:
      "Priorities will appear only when verified WDF or LaundroPortal records identify a specific order, machine, or workforce issue.",
  },
  executive: {
    title: "Executive dashboard",
    description: "The owner view across WDF POS and LaundroPortal.",
    panelTitle: "No executive measures have been published",
    panelDescription: "Verified source measures will appear here when available.",
  },
  operations: {
    title: "Store operations",
    description: "Workload, busy periods, and volume through the store.",
    panelTitle: "No operational activity has been published",
    panelDescription:
      "Operational volumes appear once verified WDF lines are ingested. No placeholder workload is shown.",
  },
  orders: {
    title: "Orders & transactions",
    description:
      "Find exact WDF orders and inspect LaundroPortal machine and card activity without mixing the two sources.",
    panelTitle: "Order access is waiting for WDF",
    panelDescription:
      "The supplied order export is only a 30-row preview. Complete order search and individual order views will be enabled after the WDF API contract is available.",
  },
  analytics: {
    title: "Business analytics",
    description: "Sales, finance, operating trends, and the records behind every calculation.",
    panelTitle: "No calculation has been published",
    panelDescription:
      "Analytics will be added one verified measure at a time. Every value will include its formula, source, quality warnings, drill-down, and matching export.",
  },
  workforce: {
    title: "Workforce management",
    description: "Schedules, attendance, time, coverage, and approvals within your permitted team.",
    panelTitle: "Workforce records are not yet available",
    panelDescription:
      "Managers will see only employees assigned to them by the owner. Current timesheet anomalies must be resolved before hours or performance are displayed.",
  },
  inventory: {
    title: "Inventory",
    description: "Supplies, stock movement, and the records behind every quantity.",
    panelTitle: "The supplied inventory file contains no stock records",
    panelDescription:
      "The saved WDF inventory HTML and CSV contain the web page shell, but no item, SKU, quantity, supplier, reorder, or stock-movement rows. An export downloaded from inside the WDF inventory screen is required; showing quantities from this file would invent data.",
  },
};

export function WorkspacePage({
  area,
  session,
  ordersGateway,
  analyticsGateway,
  orderId,
  issueCode,
  analyticsSection,
  previewWorkforce,
}: {
  area: ProductArea;
  session: Session;
  ordersGateway: OrdersGateway;
  analyticsGateway: AnalyticsGateway;
  orderId?: string;
  issueCode?: string;
  analyticsSection?: string;
  previewWorkforce?: PreviewWorkforceControls;
}) {
  if (area === "command-center") {
    return <CommandCenterHome analyticsGateway={analyticsGateway} role={session.role} />;
  }
  if (area === "data-sources") {
    return (
      <PageFrame
        title="Data sources"
        description="Connection status for the two systems that supply the store’s operating picture."
        dataState="sourced"
        scopeNote="Two source systems · 31 supplied files accounted for and fingerprinted · APIs not connected"
      >
        <DataSourcesPage gateway={analyticsGateway} />
      </PageFrame>
    );
  }
  if (area === "analytics") {
    return (
      <div className="pt-1">
        <h1 className="sr-only">Business analytics</h1>
        <AnalyticsPage
          gateway={analyticsGateway}
          showDirectory
          section={analyticsSection ?? "sales"}
        />
      </div>
    );
  }
  if (area === "executive") {
    return <ExecutiveDashboardPage gateway={analyticsGateway} />;
  }
  if (area === "finance") {
    return (
      <PageFrame
        title="Revenue & loss"
        description="Verified revenue, payments, cash movements and corrections—with unknown costs left unknown."
        dataState="partial"
        scopeNote="One store · 2025 WDF financial summary · operating costs not supplied"
      >
        <FinancePage gateway={analyticsGateway} />
      </PageFrame>
    );
  }
  if (area === "workforce") {
    if (previewWorkforce && ArchivedWorkforcePage) {
      return (
        <Suspense fallback={<div className="p-5 text-sm text-muted">Loading workforce preview…</div>}>
          <ArchivedWorkforcePage role={session.role} />
        </Suspense>
      );
    }
    const page = content.workforce;
    return (
      <PageFrame
        title={page.title}
        description={page.description}
        dataState={session.role === "OWNER" ? "partial" : "none"}
        scopeNote={
          session.role === "OWNER"
            ? "One store · 2025 timesheet · over-length entries excluded and counted"
            : session.role === "MANAGER"
              ? "Direct reports only · assignment required"
              : "Your own workforce records"
        }
      >
        <WorkforcePage gateway={analyticsGateway} role={session.role} />
      </PageFrame>
    );
  }
  if (area === "operations") {
    return (
      <div className="pt-1">
        <h1 className="sr-only">Store operations</h1>
        <OperationsPage gateway={analyticsGateway} />
      </div>
    );
  }
  if (area === "orders") {
    if (orderId) {
      return <OrderDetailPage gateway={ordersGateway} orderId={orderId} issueCode={issueCode} />;
    }
    return (
      <div className="pt-1">
        <h1 className="sr-only">Orders and transactions</h1>
        <OrderQueuePage analyticsGateway={analyticsGateway} gateway={ordersGateway} />
      </div>
    );
  }
  if (area === "inventory") {
    const page = content.inventory;
    return (
      <div className="pt-1">
        <h1 className="sr-only">Inventory</h1>
        <EmptyPanel title={page.panelTitle} description={page.panelDescription} />
      </div>
    );
  }
  return null;
}
