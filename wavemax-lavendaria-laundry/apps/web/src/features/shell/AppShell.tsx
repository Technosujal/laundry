import { useEffect, useMemo, useState } from "react";

import type { AppRole, ProductArea, Session } from "../../app/auth/session-types";
import { BrandLockup } from "../../components/ui/BrandLockup";
import { ProductIcon } from "../../components/ui/ProductIcon";
import { StoreIdentity } from "../../components/ui/StoreIdentity";
import { unavailableAnalyticsGateway, type AnalyticsGateway } from "../analytics/analytics-gateway";
import { unavailableOrdersGateway, type OrdersGateway } from "../orders/orders-gateway";
import { parseOrderDetailHash } from "../orders/order-route";
import { WorkspacePage } from "./WorkspacePage";
import type { PreviewWorkforceControls } from "../workforce/preview-workforce-controls";
import { areaTheme } from "./area-theme";
import { findNavigationItem, navigationFor } from "./navigation";

interface PreviewControls {
  role: AppRole;
  onRoleChange(role: AppRole): void;
}

interface WorkspaceLocation {
  area: ProductArea;
  orderId?: string;
  issueCode?: string;
  analyticsSection?: string;
}

const ANALYTICS_REPORTS = [
  { id: "sales", label: "Sales", group: "Business reports" },
  { id: "trends", label: "Trends", group: "Business reports" },
  { id: "products", label: "Products", group: "Business reports" },
  { id: "cash", label: "Cash & voids", group: "Business reports" },
  { id: "staff", label: "Staff & ops", group: "Business reports" },
  { id: "customers", label: "Customers", group: "Business reports" },
  { id: "method", label: "Calculation evidence", group: "Evidence" },
] as const;

function canonicalAnalyticsSection(section: string | undefined): string {
  return section?.startsWith("lp-") ? section.slice(3) : (section ?? "sales");
}

function locationFromHash(): WorkspaceLocation {
  const value = window.location.hash.slice(1);
  if (!value) return { area: "command-center" };
  const orderRoute = parseOrderDetailHash(value);
  if (orderRoute) return { area: "orders", ...orderRoute };
  const [area, detail] = value.split("/");
  return {
    area: area as ProductArea,
    ...(area === "analytics" && detail ? { analyticsSection: detail } : {}),
  };
}

function isStaffPortalHash(raw: string): boolean {
  const clean = raw.replace(/^#/, "").toLowerCase();
  return [
    "staff-status",
    "status",
    "staff-register",
    "register",
    "staff-login",
    "login",
    "signin",
    "manager-approvals",
    "approvals",
    "staff-portal",
  ].includes(clean);
}

export function AppShell({
  session,
  preview,
  previewWorkforce,
  ordersGateway = unavailableOrdersGateway,
  analyticsGateway = unavailableAnalyticsGateway,
  onOpenStaffPortal,
  onSignOut,
}: {
  session: Session;
  preview?: PreviewControls;
  previewWorkforce?: PreviewWorkforceControls;
  ordersGateway?: OrdersGateway;
  analyticsGateway?: AnalyticsGateway;
  onOpenStaffPortal?: ((view?: "status" | "register" | "signin" | "approvals") => void) | undefined;
  onSignOut?: (() => void) | undefined;
}) {
  const permittedNavigation = useMemo(() => navigationFor(session), [session]);
  const [location, setLocation] = useState<WorkspaceLocation>(() => locationFromHash());
  const [menuOpen, setMenuOpen] = useState(false);
  const [analyticsReportsOpen, setAnalyticsReportsOpen] = useState(true);

  useEffect(() => {
    const onHashChange = () => {
      const nextLocation = locationFromHash();
      setLocation(nextLocation);
      if (nextLocation.area === "command-center") setMenuOpen(false);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  const permitted = session.permittedAreas.includes(location.area);
  const visibleArea = permitted ? location.area : "command-center";
  const isHub = visibleArea === "command-center";

  useEffect(() => {
    if (visibleArea !== "analytics") return;
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [location.analyticsSection, visibleArea]);

  useEffect(() => {
    if (
      !permitted &&
      window.location.hash !== "#command-center" &&
      !isStaffPortalHash(window.location.hash)
    ) {
      window.location.hash = "command-center";
    }
  }, [permitted]);

  const activeItem = findNavigationItem(visibleArea);
  const activeTheme = areaTheme[visibleArea];
  const activeAnalyticsReport =
    visibleArea === "analytics"
      ? (ANALYTICS_REPORTS.find(
          (report) => report.id === canonicalAnalyticsSection(location.analyticsSection),
        ) ?? ANALYTICS_REPORTS[0])
      : null;
  const routeMotionKey = [
    visibleArea,
    location.orderId ?? "",
    location.issueCode ?? "",
    location.analyticsSection ?? "",
  ].join(":");

  return (
    <div
      className={`app-shell min-h-screen bg-canvas text-ink ${isHub ? "" : "lg:grid lg:grid-cols-[244px_minmax(0,1fr)]"}`}
    >
      <a
        className="fixed -top-16 left-4 z-[100] rounded-lg bg-brand px-3.5 py-2.5 text-sm font-semibold text-white focus:top-3"
        href="#main-content"
      >
        Skip to content
      </a>
      {!isHub ? (
        <aside
          className={`workspace-sidebar rail-enter fixed inset-y-0 left-0 z-50 flex h-screen w-[min(286px,calc(100vw-20px))] flex-col overflow-y-auto px-4 pb-4 pt-5 transition-transform duration-300 lg:sticky lg:top-0 lg:z-40 lg:w-[244px] lg:translate-x-0 ${menuOpen ? "translate-x-0 shadow-[24px_0_60px_rgba(17,24,39,0.18)]" : "-translate-x-full"}`}
        >
          <a
            className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            href="#command-center"
            onClick={() => setMenuOpen(false)}
          >
            <BrandLockup />
          </a>
          {(["Workspace", "People", "Control"] as const).map((group) => {
            const items = permittedNavigation.filter(
              (item) => item.group === group && item.area !== "command-center",
            );
            if (!items.length) return null;
            return (
              <div className="mt-7" key={group}>
                <p className="mx-2.5 mb-2 text-[9px] font-bold uppercase tracking-[0.15em] text-[#8b9ab4]">
                  {group}
                </p>
                <nav className="grid gap-1" aria-label={`${group} navigation`}>
                  {items.map((item) => {
                    const itemTheme = areaTheme[item.area];
                    const isActive = visibleArea === item.area;
                    return (
                      <div className="relative" key={item.area}>
                        <a
                          className={`nav-item group flex min-h-11 items-center gap-2.5 rounded-xl border px-2 py-1.5 text-[12px] font-semibold no-underline outline-none transition focus-visible:ring-2 focus-visible:ring-offset-2 ${isActive ? "nav-item-active border-[#d8e5fb] bg-[#edf4ff] text-[#1748b8]" : "border-transparent text-[#5f6f86] hover:bg-[#f7f9fc] hover:text-ink"}`}
                          href={`#${item.area}`}
                          onClick={(event) => {
                            if (item.area === "analytics" && isActive) {
                              event.preventDefault();
                              setAnalyticsReportsOpen((current) => !current);
                              return;
                            }
                            if (item.area === "analytics") setAnalyticsReportsOpen(true);
                            setMenuOpen(false);
                          }}
                          aria-current={isActive ? "page" : undefined}
                          aria-expanded={
                            item.area === "analytics" && isActive ? analyticsReportsOpen : undefined
                          }
                          style={{
                            ["--tw-ring-color" as string]: isActive ? "#2563eb" : itemTheme.accent,
                          }}
                        >
                          <span
                            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-[background-color,color,box-shadow,transform] duration-200 group-hover:bg-[var(--area-accent)] group-hover:text-white"
                            style={{
                              background: isActive ? "#dceaff" : itemTheme.soft,
                              color: isActive ? "#1748b8" : itemTheme.accent,
                              ["--area-accent" as string]: itemTheme.accent,
                            }}
                          >
                            <ProductIcon area={item.area} className="h-[17px] w-[17px]" />
                          </span>
                          <span>{item.label}</span>
                        </a>
                        {item.area === "analytics" && isActive && analyticsReportsOpen ? (
                          <div className="ml-4 mt-2 border-l border-[#dce4ef] pl-2.5">
                            {(["Business reports", "Evidence"] as const).map((reportGroup) => (
                              <div className="mb-3 last:mb-0" key={reportGroup}>
                                <p className="mb-1 px-2 text-[8px] font-bold uppercase tracking-[0.12em] text-[#8a8d93]">
                                  {reportGroup}
                                </p>
                                <nav
                                  aria-label={`${reportGroup} navigation`}
                                  className="grid gap-0.5"
                                >
                                  {ANALYTICS_REPORTS.filter(
                                    (report) => report.group === reportGroup,
                                  ).map((report) => {
                                    const selected =
                                      canonicalAnalyticsSection(location.analyticsSection) ===
                                      report.id;
                                    return (
                                      <a
                                        aria-current={selected ? "page" : undefined}
                                        className={`flex min-h-8 items-center rounded-lg px-2 text-[11px] font-semibold no-underline outline-none transition focus-visible:ring-2 focus-visible:ring-brand ${selected ? "bg-[#edf4ff] text-[#1748b8]" : "text-[#66758b] hover:bg-[#f7f9fc] hover:text-ink"}`}
                                        href={`#analytics/${report.id}`}
                                        key={report.id}
                                        onClick={() => setMenuOpen(false)}
                                      >
                                        {report.label}
                                      </a>
                                    );
                                  })}
                                </nav>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </nav>
              </div>
            );
          })}
          <div className="mt-auto border-t border-line px-2 pb-0.5 pt-4">
            <StoreIdentity />
          </div>
        </aside>
      ) : null}
      {!isHub && menuOpen ? (
        <button
          className="fixed inset-0 z-40 border-0 bg-ink/50 lg:hidden"
          aria-label="Close navigation"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}
      <div className="min-w-0">
        <header
          className={`app-header sticky top-0 z-30 overflow-x-clip border-b border-line bg-white/98 backdrop-blur-xl ${isHub ? "w-screen" : "w-full"}`}
        >
          <div
            className={`mx-auto flex min-h-[68px] w-full items-center gap-3 px-3.5 sm:min-h-[72px] sm:px-5 ${isHub ? "max-w-[min(1540px,100vw)] lg:px-10 2xl:px-14" : "lg:px-7"}`}
          >
            {!isHub ? (
              <button
                className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[10px] border border-line bg-white text-ink outline-none focus-visible:ring-2 focus-visible:ring-brand lg:hidden"
                aria-label="Open navigation"
                onClick={() => setMenuOpen(true)}
              >
                <svg
                  className="h-[18px] w-[18px]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              </button>
            ) : (
              <a
                className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                href="#command-center"
              >
                <BrandLockup />
              </a>
            )}
            {!isHub ? (
              <div className="flex min-w-0 items-center gap-3">
                <a
                  className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-[11px] font-bold text-ink no-underline outline-none transition hover:border-[#a9c4f7] hover:bg-[#f3f7ff] focus-visible:ring-2 focus-visible:ring-brand"
                  href="#command-center"
                >
                  <span aria-hidden="true">←</span>
                  <span className="hidden md:inline">Back</span>
                </a>
                <div className="min-w-0">
                  <p
                    className="text-[9px] font-bold uppercase tracking-[0.1em]"
                    style={{ color: activeTheme.accent }}
                  >
                    {activeAnalyticsReport?.label ?? activeItem.shortLabel}
                  </p>
                  <strong className="mt-0.5 hidden truncate text-[11px] font-semibold sm:block">
                    {activeAnalyticsReport
                      ? `Business analytics · ${activeAnalyticsReport.group}`
                      : activeItem.description}
                  </strong>
                </div>
              </div>
            ) : null}
            <div className="ml-auto flex min-w-0 items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (onOpenStaffPortal) onOpenStaffPortal("signin");
                  window.location.hash = "staff-login";
                }}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#1752b5] to-[#258cfb] px-3.5 py-1.5 text-[11px] font-bold text-white shadow-md shadow-blue-500/25 hover:brightness-105 transition active:scale-[0.98]"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                <span>Staff Sign In / Register</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onOpenStaffPortal) onOpenStaffPortal("status");
                  window.location.hash = "staff-status";
                }}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-[#93c5fd] bg-[#eff6ff] px-3 py-1.5 text-[11px] font-bold text-[#1d4ed8] shadow-xs hover:bg-[#dbeafe] transition"
                title="Employee registration, live status pipeline (#355), and manager email approval system"
              >
                <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-ping" />
                <span className="hidden sm:inline">Status (#355)</span>
              </button>
              <div className="hidden xl:block">
                <StoreIdentity variant="chip" />
              </div>
              {preview ? (
                <select
                  aria-label="Local role preview"
                  className="min-h-9 max-w-[124px] rounded-lg border border-line bg-[#f6f8fb] px-2 text-[11px] font-bold text-ink sm:hidden"
                  onChange={(event) => preview.onRoleChange(event.target.value as AppRole)}
                  value={preview.role}
                >
                  <option value="OWNER">Owner</option>
                  <option value="MANAGER">Manager</option>
                  <option value="EMPLOYEE">Employee</option>
                </select>
              ) : null}
              {preview ? (
                <div className="hidden items-center gap-0.5 rounded-xl border border-line bg-[#f6f8fb] p-1 sm:flex">
                  <button
                    className={`min-h-8 rounded-lg border-0 px-3 text-[10px] font-bold transition-colors ${preview.role === "OWNER" ? "bg-[#11203a] text-white shadow-sm" : "bg-transparent text-[#66758b] hover:text-ink"}`}
                    onClick={() => preview.onRoleChange("OWNER")}
                  >
                    Owner
                  </button>
                  <button
                    className={`min-h-8 rounded-lg border-0 px-3 text-[10px] font-bold transition-colors ${preview.role === "MANAGER" ? "bg-[#11203a] text-white shadow-sm" : "bg-transparent text-[#66758b] hover:text-ink"}`}
                    onClick={() => preview.onRoleChange("MANAGER")}
                  >
                    Manager
                  </button>
                  <button
                    className={`min-h-8 rounded-lg border-0 px-3 text-[10px] font-bold transition-colors ${preview.role === "EMPLOYEE" ? "bg-[#11203a] text-white shadow-sm" : "bg-transparent text-[#66758b] hover:text-ink"}`}
                    onClick={() => preview.onRoleChange("EMPLOYEE")}
                  >
                    Employee
                  </button>
                </div>
              ) : null}
              <div className="hidden items-center gap-2.5 rounded-xl border border-line bg-white py-1 pl-1 pr-2.5 md:flex">
                <span className="grid h-8 w-8 place-items-center rounded-[9px] bg-[#11203a] text-[11px] font-bold text-white">
                  {session.role.charAt(0)}
                </span>
                <div>
                  <strong className="block text-[10px] font-bold leading-tight">
                    {session.role === "OWNER"
                      ? "Owner"
                      : session.role === "MANAGER"
                        ? "Manager"
                        : "Employee"}
                  </strong>
                  <small className="mt-0.5 block text-[8px] leading-tight text-muted">
                    Authorized
                  </small>
                </div>
              </div>
              {onSignOut ? (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="inline-flex min-h-8 items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/70 px-3 py-1 text-xs font-bold text-red-600 hover:bg-red-100 hover:text-red-700 transition"
                  title="Sign out of current terminal and return to Employee Login page"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span>Sign Out</span>
                </button>
              ) : null}
            </div>
          </div>
        </header>
        <main
          className={`app-content mx-auto w-full px-3.5 pb-10 outline-none sm:px-5 sm:pb-12 lg:pb-14 ${isHub ? "max-w-[1540px] pt-5 sm:pt-6 lg:px-10 lg:pt-7 2xl:px-14" : `max-w-[1480px] ${["analytics", "executive", "operations", "orders", "inventory"].includes(visibleArea) ? "pt-3 sm:pt-4 lg:pt-5" : "pt-5 sm:pt-6 lg:pt-7"} lg:px-7`}`}
          id="main-content"
          tabIndex={-1}
        >
          <div className="route-view" key={routeMotionKey}>
            <WorkspacePage
              area={visibleArea as Exclude<ProductArea, "finance">}
              session={session}
              ordersGateway={ordersGateway}
              analyticsGateway={analyticsGateway}
              {...(previewWorkforce ? { previewWorkforce } : {})}
              {...(permitted && visibleArea === "orders" && location.orderId
                ? {
                    orderId: location.orderId,
                    ...(location.issueCode ? { issueCode: location.issueCode } : {}),
                  }
                : {})}
              {...(permitted && visibleArea === "analytics" && location.analyticsSection
                ? { analyticsSection: location.analyticsSection }
                : {})}
            />
          </div>
        </main>
      </div>

      {/* Floating Quick Access Button for Staff Portal */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          type="button"
          onClick={() => {
            if (onOpenStaffPortal) onOpenStaffPortal("signin");
            window.location.hash = "staff-login";
          }}
          className="flex items-center gap-2.5 rounded-full bg-gradient-to-r from-[#1752b5] to-[#258cfb] py-3 px-5 text-xs font-extrabold text-white shadow-[0_10px_25px_rgba(37,99,235,0.4)] hover:scale-105 active:scale-95 transition ring-4 ring-blue-500/20"
        >
          <span className="flex h-2.5 w-2.5 rounded-full bg-white animate-ping" />
          <span>Staff Login &amp; Registration (Status #355)</span>
        </button>
      </div>
    </div>
  );
}
