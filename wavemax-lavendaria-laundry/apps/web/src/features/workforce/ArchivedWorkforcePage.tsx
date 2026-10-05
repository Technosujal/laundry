import { Link, MemoryRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";

import type { AppRole } from "../../app/auth/session-types";
import { AppProvider } from "./archive/src/context/AppContext";
import WorkforceLanding from "./archive/src/pages/workforce/WorkforceLanding";
import WorkforceOverview from "./archive/src/pages/workforce/WorkforceOverview";
import WorkforceCalendarPage from "./archive/src/pages/workforce/WorkforceCalendarPage";
import EmployeeDirectory from "./archive/src/pages/workforce/EmployeeDirectory";
import Scheduling from "./archive/src/pages/workforce/Scheduling";
import Attendance from "./archive/src/pages/workforce/Attendance";
import Timesheets from "./archive/src/pages/workforce/Timesheets";
import LeaveManagement from "./archive/src/pages/workforce/LeaveManagement";
import ShiftCoverage from "./archive/src/pages/workforce/ShiftCoverage";
import CoveragePlanning from "./archive/src/pages/workforce/CoveragePlanning";
import RegistrationApprovals from "./archive/src/pages/RegistrationApprovals";
import Register from "./archive/src/pages/Register";
import RegistrationSubmitted from "./archive/src/pages/RegistrationSubmitted";
import NotificationCenter from "./archive/src/pages/NotificationCenter";

const sections = [
  { path: "/workforce", label: "Home", roles: ["OWNER", "MANAGER", "EMPLOYEE"] },
  { path: "/workforce-overview", label: "Overview", roles: ["OWNER", "MANAGER"] },
  { path: "/workforce/calendar", label: "Calendar", roles: ["OWNER", "MANAGER", "EMPLOYEE"] },
  { path: "/workforce/directory", label: "Directory", roles: ["OWNER", "MANAGER"] },
  { path: "/workforce/scheduling", label: "Scheduling", roles: ["OWNER", "MANAGER", "EMPLOYEE"] },
  { path: "/workforce/attendance", label: "Attendance", roles: ["OWNER", "MANAGER", "EMPLOYEE"] },
  { path: "/workforce/timesheets", label: "Timesheets", roles: ["OWNER", "MANAGER", "EMPLOYEE"] },
  { path: "/workforce/leave", label: "Leave", roles: ["OWNER", "MANAGER", "EMPLOYEE"] },
  { path: "/workforce/shift-coverage", label: "Shift coverage", roles: ["OWNER", "MANAGER"] },
  { path: "/workforce/coverage-planning", label: "Coverage planning", roles: ["OWNER", "MANAGER"] },
  { path: "/workforce/registrations", label: "Approvals", roles: ["OWNER"] },
  { path: "/register", label: "Add staff", roles: ["OWNER"] },
  { path: "/notifications", label: "Notifications", roles: ["OWNER", "MANAGER", "EMPLOYEE"] },
] as const;

function WorkforceNavigation({ role }: { role: AppRole }) {
  const location = useLocation();
  return (
    <nav aria-label="Workforce sections" className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-line bg-white p-3">
      {sections.filter((section) => section.roles.some((allowed) => allowed === role)).map((section) => (
        <Link
          key={section.path}
          to={section.path}
          aria-current={location.pathname === section.path ? "page" : undefined}
          className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${location.pathname === section.path ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"}`}
        >
          {section.label}
        </Link>
      ))}
    </nav>
  );
}

export function ArchivedWorkforcePage({ role }: { role: AppRole }) {
  const previewRole = role.toLowerCase() as "owner" | "manager" | "employee";
  return (
    <div className="min-w-0 pb-12">
      <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-900">
        Sample data · Local workforce preview
      </div>
      <AppProvider previewRole={previewRole}>
        <MemoryRouter initialEntries={["/workforce"]}>
          <WorkforceNavigation role={role} />
          <Routes>
            <Route path="/workforce" element={<WorkforceLanding />} />
            <Route path="/workforce-overview" element={role === "EMPLOYEE" ? <Navigate to="/workforce" replace /> : <WorkforceOverview />} />
            <Route path="/workforce/calendar" element={<WorkforceCalendarPage />} />
            <Route path="/workforce/directory" element={role === "EMPLOYEE" ? <Navigate to="/workforce" replace /> : <EmployeeDirectory />} />
            <Route path="/workforce/scheduling" element={<Scheduling />} />
            <Route path="/workforce/attendance" element={<Attendance />} />
            <Route path="/workforce/timesheets" element={<Timesheets />} />
            <Route path="/workforce/leave" element={<LeaveManagement />} />
            <Route path="/workforce/shift-coverage" element={role === "EMPLOYEE" ? <Navigate to="/workforce" replace /> : <ShiftCoverage />} />
            <Route path="/workforce/coverage-planning" element={role === "EMPLOYEE" ? <Navigate to="/workforce" replace /> : <CoveragePlanning />} />
            <Route path="/workforce/registrations" element={role === "OWNER" ? <RegistrationApprovals /> : <Navigate to="/workforce" replace />} />
            <Route path="/register" element={role === "OWNER" ? <Register /> : <Navigate to="/workforce" replace />} />
            <Route path="/register-submitted" element={role === "OWNER" ? <RegistrationSubmitted /> : <Navigate to="/workforce" replace />} />
            <Route path="/notifications" element={<NotificationCenter />} />
            <Route path="/home" element={<Navigate to="/workforce" replace />} />
            <Route path="*" element={<Navigate to="/workforce" replace />} />
          </Routes>
        </MemoryRouter>
      </AppProvider>
    </div>
  );
}
