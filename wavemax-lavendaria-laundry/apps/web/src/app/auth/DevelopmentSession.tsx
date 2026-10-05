import { useEffect, useMemo, useState } from "react";

import { createStaticAnalyticsGateway } from "../../features/analytics/analytics-gateway";
import { createStaticOrdersGateway } from "../../features/orders/static-orders-gateway";
import { AppShell } from "../../features/shell/AppShell";
import {
  loadPreviewWorkforce,
  PREVIEW_EMPLOYEE_ID,
  PREVIEW_MANAGER_ID,
  savePreviewWorkforce,
} from "../../features/workforce/preview-workforce";
import {
  StaffAuthPortalPage,
  type AuthPortalView,
} from "../../features/auth/StaffAuthPortalPage";
import { developmentSessions, type AppRole } from "./session-types";

const SESSION_STORAGE_KEY = "wavemax.authenticated-session.v1";

interface ActiveSessionUser {
  role: AppRole;
  staffName: string;
}

function getPortalViewFromHash(): AuthPortalView {
  const hash = window.location.hash.slice(1).toLowerCase();
  const route = hash.split("?")[0] || "";
  if (route === "staff-register" || route === "register") return "register";
  if (route === "staff-status" || route === "status") return "status";
  if (route === "manager-approvals" || route === "approvals") return "approvals";
  return "signin";
}

export function DevelopmentSession() {
  const [currentUser, setCurrentUser] = useState<ActiveSessionUser | null>(() => {
    try {
      const stored = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<ActiveSessionUser>;
        if (parsed.role && parsed.staffName) {
          return parsed as ActiveSessionUser;
        }
      }
    } catch {}
    return { role: "OWNER", staffName: "Store Owner" };
  });

  const [portalView, setPortalView] = useState<AuthPortalView>(() => getPortalViewFromHash());
  const [role, setRole] = useState<AppRole>(() => currentUser?.role || "OWNER");
  const [workforce, setWorkforce] = useState(() =>
    loadPreviewWorkforce(new Intl.DateTimeFormat("sv-SE").format(new Date())),
  );

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1).toLowerCase();
      const route = hash.split("?")[0] || "";
      if (
        [
          "staff-status",
          "status",
          "staff-register",
          "register",
          "staff-login",
          "login",
          "signin",
          "manager-approvals",
          "approvals",
        ].includes(route)
      ) {
        setPortalView(getPortalViewFromHash());
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => savePreviewWorkforce(workforce), [workforce]);

  const analyticsGateway = useMemo(
    () => createStaticAnalyticsGateway("/analytics-artifact.json"),
    [],
  );
  const ordersGateway = useMemo(() => createStaticOrdersGateway("/analytics-artifact.json"), []);

  const handleAuthenticated = (newRole: AppRole, staffName: string) => {
    const sessionUser: ActiveSessionUser = { role: newRole, staffName };
    setCurrentUser(sessionUser);
    setRole(newRole);
    try {
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionUser));
    } catch {}
    window.location.hash = newRole === "EMPLOYEE" ? "workforce" : "command-center";
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    try {
      window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {}
    setPortalView("signin");
    window.location.hash = "staff-login";
  };

  const currentRoute = window.location.hash.slice(1).toLowerCase().split("?")[0] || "";
  const isPortalRoute = [
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
  ].includes(currentRoute);

  // If on a staff portal route:
  if (isPortalRoute) {
    return (
      <StaffAuthPortalPage
        initialView={portalView}
        onAuthenticated={handleAuthenticated}
        onExitPortal={() => {
          window.location.hash = "command-center";
          setRole("OWNER");
        }}
      />
    );
  }

  return (
    <AppShell
      session={developmentSessions[role]}
      preview={{
        role,
        onRoleChange: (r) => {
          setRole(r);
          setCurrentUser((curr) => (curr ? { ...curr, role: r } : null));
        },
      }}
      previewWorkforce={{
        state: workforce,
        setState: setWorkforce,
        employeeId: PREVIEW_EMPLOYEE_ID,
        managerId: PREVIEW_MANAGER_ID,
      }}
      analyticsGateway={analyticsGateway}
      ordersGateway={ordersGateway}
      onOpenStaffPortal={(view) => {
        if (view) setPortalView(view);
        setCurrentUser(null);
      }}
      onSignOut={handleSignOut}
    />
  );
}
