import { useEffect, useState } from "react";
import {
  getActiveRegistrationId,
  loadRegistrations,
  type EmployeeRegistration,
} from "./staff-registration-store";
import { RegistrationStatusCard } from "./RegistrationStatusCard";
import { EmployeeRegistrationForm } from "./EmployeeRegistrationForm";
import { StaffSignInPage } from "./StaffSignInPage";
import { EmailApprovalActionView } from "./EmailApprovalActionView";
import { ResendConfigModal } from "./ResendConfigModal";
import { isResendConfigured } from "./resend-service";
import type { AppRole } from "../../app/auth/session-types";

export type AuthPortalView = "status" | "register" | "signin" | "approvals";

interface StaffAuthPortalPageProps {
  initialView?: AuthPortalView | undefined;
  onAuthenticated?: ((role: AppRole, staffName: string) => void) | undefined;
  onExitPortal?: (() => void) | undefined;
}

export function StaffAuthPortalPage({
  initialView = "signin",
  onAuthenticated,
  onExitPortal,
}: StaffAuthPortalPageProps) {
  const [view, setView] = useState<AuthPortalView>(initialView);
  const [activeRegId, setActiveRegId] = useState<string>(() => getActiveRegistrationId());
  const [isResendModalOpen, setIsResendModalOpen] = useState(false);
  const [registrations, setRegistrations] = useState<EmployeeRegistration[]>(() =>
    loadRegistrations(),
  );
  const [resendConfigured, setResendConfigured] = useState<boolean>(() => isResendConfigured());

  const refreshState = () => {
    const list = loadRegistrations();
    setRegistrations(list);
    setResendConfigured(isResendConfigured());
  };

  useEffect(() => {
    if (initialView) {
      setView(initialView);
    }
  }, [initialView]);

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.slice(1).toLowerCase();
      const route = hash.split("?")[0] || "";
      if (route === "manager-approvals" || route === "approvals") {
        setView("approvals");
      } else if (route === "staff-register" || route === "register") {
        setView("register");
      } else if (route === "staff-status" || route === "status") {
        setView("status");
      } else if (route === "staff-login" || route === "login" || route === "signin") {
        setView("signin");
      }
    };
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  useEffect(() => {
    refreshState();
  }, [view]);

  // Determine current active registration
  const currentReg =
    registrations.find((r) => r.id === activeRegId) ||
    registrations.find((r) => r.requestIdNumber === 355) ||
    registrations[0];

  const handleRegistrationSuccess = (newReg: EmployeeRegistration) => {
    setActiveRegId(newReg.id);
    refreshState();
    // After submitting registration, immediately transition to the Approval Status screen!
    setView("status");
  };

  const handleShowPendingStatus = (reg: EmployeeRegistration) => {
    setActiveRegId(reg.id);
    setView("status");
  };

  const handleSuccessfulLogin = (staff: { id: string; name: string; station: string }) => {
    if (onAuthenticated) {
      onAuthenticated("EMPLOYEE", staff.name);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8">
      {/* Top Bar with Brand & Navigation */}
      <header className="mx-auto w-full max-w-[860px] flex flex-wrap items-center justify-between gap-3 pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#1752b5] to-[#258cfb] text-white font-black text-lg shadow-sm">
            W
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#2563eb]">
              WAVEMAX LAUNDRY
            </span>
            <h2 className="text-sm font-bold text-[#0f172a]">
              Employee Access &amp; Approval System
            </h2>
          </div>
        </div>

        {/* Header Action Tools */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Resend Email Configuration Button */}
          <button
            type="button"
            onClick={() => setIsResendModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#cbd5e1] bg-white px-3 py-1.5 text-xs font-bold text-[#334155] shadow-xs hover:bg-[#f8fafc] hover:border-[#94a3b8] transition active:scale-[0.98]"
            title="Configure Resend API key and Manager destination email"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                resendConfigured ? "bg-emerald-500 animate-pulse" : "bg-amber-400"
              }`}
            />
            <svg className="h-3.5 w-3.5 text-[#2563eb]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            <span>Resend: {resendConfigured ? "Connected" : "Configure Key"}</span>
          </button>

          {/* Quick Exit to Dashboard if available */}
          {onExitPortal && (
            <button
              type="button"
              onClick={onExitPortal}
              className="inline-flex items-center gap-1 rounded-xl border border-line bg-white px-3 py-1.5 text-xs font-bold text-[#64748b] hover:text-[#0f172a] hover:bg-slate-50 transition"
            >
              <span>Store Hub</span>
              <span aria-hidden="true">&rarr;</span>
            </button>
          )}
        </div>
      </header>

      {/* Segmented Mode Selector: Logical Progression */}
      <nav aria-label="Portal section selector" className="mx-auto mb-6 w-full max-w-[560px] rounded-2xl border border-[#dce4ef] bg-white p-1.5 shadow-xs flex items-center justify-between text-xs font-bold">
        {/* 1. Sign In (Existing Staff) */}
        <button
          type="button"
          onClick={() => {
            setView("signin");
            window.location.hash = "staff-login";
          }}
          className={`flex-1 rounded-xl py-2 px-3 text-center transition ${
            view === "signin"
              ? "bg-[#1752b5] text-white shadow-sm"
              : "text-[#64748b] hover:text-[#0f172a] hover:bg-slate-50"
          }`}
        >
          Staff Sign In
        </button>

        {/* 2. Register (New Employees) */}
        <button
          type="button"
          onClick={() => {
            setView("register");
            window.location.hash = "staff-register";
          }}
          className={`flex-1 rounded-xl py-2 px-3 text-center transition ${
            view === "register"
              ? "bg-[#1752b5] text-white shadow-sm"
              : "text-[#64748b] hover:text-[#0f172a] hover:bg-slate-50"
          }`}
        >
          Staff Register
        </button>

        {/* 3. Live Approval Status (Shown after registration or when checking pending status) */}
        <button
          type="button"
          onClick={() => {
            setView("status");
            window.location.hash = "staff-status";
          }}
          className={`flex-1 rounded-xl py-2 px-3 text-center transition flex items-center justify-center gap-1.5 ${
            view === "status"
              ? "bg-[#1752b5] text-white shadow-sm"
              : "text-[#64748b] hover:text-[#0f172a] hover:bg-slate-50"
          }`}
        >
          <span>Approval Status</span>
          {currentReg && (
            <span
              className={`rounded-full px-1.5 py-0.2 text-[9px] font-black ${
                currentReg.status === "APPROVED"
                  ? "bg-emerald-100 text-emerald-800"
                  : currentReg.status === "REJECTED"
                    ? "bg-red-100 text-red-800"
                    : "bg-blue-100 text-blue-800"
              }`}
            >
              #{currentReg.requestIdNumber}
            </span>
          )}
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center">
        {view === "signin" && (
          <StaffSignInPage
            onSuccessLogin={handleSuccessfulLogin}
            onShowPendingStatus={handleShowPendingStatus}
            onGoToRegister={() => {
              setView("register");
              window.location.hash = "staff-register";
            }}
            onRoleLogin={(role, name) => {
              if (onAuthenticated) onAuthenticated(role, name);
            }}
          />
        )}

        {view === "register" && (
          <EmployeeRegistrationForm
            onSuccess={handleRegistrationSuccess}
            onGoToSignIn={() => {
              setView("signin");
              window.location.hash = "staff-login";
            }}
            onOpenResendConfig={() => setIsResendModalOpen(true)}
          />
        )}

        {view === "status" && currentReg && (
          <RegistrationStatusCard
            registration={currentReg}
            onRefresh={refreshState}
            onGoToSignIn={() => {
              if (currentReg.status === "APPROVED") {
                handleSuccessfulLogin({
                  id: currentReg.id,
                  name: currentReg.fullName,
                  station: currentReg.station,
                });
              } else {
                setView("signin");
                window.location.hash = "staff-login";
              }
            }}
            onOpenResendConfig={() => setIsResendModalOpen(true)}
          />
        )}

        {view === "approvals" && (
          <EmailApprovalActionView
            onGoToSignIn={() => {
              setView("signin");
              window.location.hash = "staff-login";
            }}
            onRefreshRegistrations={refreshState}
          />
        )}
      </main>

      {/* Footer Info */}
      <footer className="mt-8 text-center text-xs text-[#94a3b8]">
        Wavemax Laundry Systems &bull; Employee Registration &amp; Station Authorization Pipeline &bull; Resend Email Integration
      </footer>

      {/* Resend Configuration Modal */}
      <ResendConfigModal
        isOpen={isResendModalOpen}
        onClose={() => {
          setIsResendModalOpen(false);
          refreshState();
        }}
        onSettingsSaved={refreshState}
      />
    </div>
  );
}
