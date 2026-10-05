import { useEffect, useState } from "react";
import {
  type EmployeeRegistration,
  loadRegistrations,
  approveEmployeeRegistration,
  rejectEmployeeRegistration,
} from "./staff-registration-store";
import { sendEmployeeDecisionEmail } from "./resend-service";

import { getResendSettings } from "./resend-service";

interface EmailApprovalActionViewProps {
  onGoToSignIn: () => void;
  onRefreshRegistrations?: () => void;
}

export function EmailApprovalActionView({
  onGoToSignIn,
  onRefreshRegistrations,
}: EmailApprovalActionViewProps) {
  const [processed, setProcessed] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | "none">("none");
  const [targetReg, setTargetReg] = useState<EmployeeRegistration | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const resendSettings = getResendSettings();

  const processEmailAction = () => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const hash = window.location.hash;
      const qIndex = hash.indexOf("?");
      const hashParams =
        qIndex !== -1 ? new URLSearchParams(hash.slice(qIndex + 1)) : new URLSearchParams();

      const targetId = hashParams.get("id") || searchParams.get("id");
      const action = hashParams.get("action") || searchParams.get("action");

      if (!targetId || !action) {
        setActionType("none");
        setProcessed(true);
        return;
      }

      const all = loadRegistrations();
      const found =
        all.find((r) => r.id === targetId || r.requestIdNumber.toString() === targetId) || null;

      if (!found) {
        setErrorNotice(`Registration #${targetId} was not found in the records.`);
        setProcessed(true);
        return;
      }

      setTargetReg(found);

      if (action === "approve") {
        setActionType("approve");
        if (found.status !== "APPROVED") {
          const res = approveEmployeeRegistration(found.id, "Store Manager (via Gmail Link)");
          if (res.registration) {
            setTargetReg(res.registration);
            void sendEmployeeDecisionEmail(res.registration, true);
            if (onRefreshRegistrations) onRefreshRegistrations();
          }
        }
      } else if (action === "reject") {
        setActionType("reject");
        if (found.status !== "REJECTED") {
          const res = rejectEmployeeRegistration(
            found.id,
            "Manager declined onboarding authorization via email action.",
            "Store Manager (via Gmail Link)",
          );
          if (res.registration) {
            setTargetReg(res.registration);
            void sendEmployeeDecisionEmail(
              res.registration,
              false,
              "Declined via Manager email review.",
            );
            if (onRefreshRegistrations) onRefreshRegistrations();
          }
        }
      }
      setProcessed(true);
    } catch {
      setErrorNotice("An error occurred while processing the email authorization link.");
      setProcessed(true);
    }
  };

  useEffect(() => {
    processEmailAction();
    window.addEventListener("hashchange", processEmailAction);
    return () => window.removeEventListener("hashchange", processEmailAction);
  }, []);

  return (
    <div className="w-full max-w-[560px] mx-auto p-4 animate-fade-in">
      <div className="rounded-[30px] border-2 border-[#d0e3fc] bg-white p-7 sm:p-9 shadow-[0_20px_50px_-12px_rgba(37,99,235,0.12)] text-center">
        {actionType === "approve" && targetReg && (
          <div>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/25">
              <svg className="h-9 w-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <span className="mt-4 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-emerald-800">
              EMAIL AUTHORIZATION VERIFIED
            </span>

            <h1 className="mt-3 text-2xl font-black text-[#0f172a] sm:text-3xl">
              Registration Approved!
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-[#64748b]">
              You have successfully approved this employee via your manager email. Terminal credentials and station access are now fully activated.
            </p>

            <div className="mt-6 rounded-2xl border border-emerald-100 bg-[#f8fdf9] p-4 text-left text-xs space-y-2">
              <div className="flex justify-between border-b border-emerald-100/60 pb-2">
                <span className="text-[#64748b]">Employee Name:</span>
                <strong className="text-[#0f172a] font-bold">{targetReg.fullName}</strong>
              </div>
              <div className="flex justify-between border-b border-emerald-100/60 pb-2">
                <span className="text-[#64748b]">Assigned Station:</span>
                <strong className="text-[#1d4ed8] font-bold">{targetReg.station}</strong>
              </div>
              <div className="flex justify-between border-b border-emerald-100/60 pb-2">
                <span className="text-[#64748b]">Terminal Login:</span>
                <span className="font-mono font-bold text-[#0f172a]">{targetReg.username}</span>
              </div>
              <div className="flex justify-between pt-1 text-[11px]">
                <span className="text-[#64748b]">Authorized Via:</span>
                <span className="font-semibold text-emerald-700">✓ Manager Gmail Link (One-Click)</span>
              </div>
            </div>

            <div className="mt-7">
              <button
                type="button"
                onClick={onGoToSignIn}
                className="w-full rounded-xl bg-gradient-to-r from-[#1752b5] to-[#258cfb] py-3.5 px-4 text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:brightness-105 transition active:scale-[0.99]"
              >
                Go to Staff Sign In &rarr;
              </button>
            </div>
          </div>
        )}

        {actionType === "reject" && targetReg && (
          <div>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/25">
              <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>

            <span className="mt-4 inline-flex items-center rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-red-800">
              EMAIL DECISION RECORDED
            </span>

            <h1 className="mt-3 text-2xl font-black text-[#0f172a]">
              Registration Declined
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-[#64748b]">
              The employee registration for <strong>{targetReg.fullName}</strong> was declined. A notification email has been dispatched to the applicant.
            </p>

            <div className="mt-7">
              <button
                type="button"
                onClick={onGoToSignIn}
                className="w-full rounded-xl border border-line bg-white py-3 px-4 text-xs font-bold text-[#64748b] hover:text-[#0f172a] hover:bg-slate-50 transition"
              >
                Return to Staff Portal
              </button>
            </div>
          </div>
        )}

        {actionType === "none" && processed && (
          <div>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-[#1d4ed8]">
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>

            <h1 className="mt-4 text-xl font-black text-[#0f172a]">
              Manager Email Approval Required
            </h1>
            <p className="mt-2 text-xs text-[#64748b] leading-relaxed">
              Manual manager approval through this screen is disabled. To approve an employee, please open the authorization email sent to your store manager email address (<strong>{resendSettings.managerEmail || "sujaldhar666@gmail.com"}</strong>) and click <strong>Approve Employee</strong>.
            </p>

            {errorNotice && (
              <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-2.5 text-xs text-red-700">
                {errorNotice}
              </div>
            )}

            <div className="mt-6">
              <button
                type="button"
                onClick={onGoToSignIn}
                className="w-full rounded-xl bg-[#1752b5] py-3 px-4 text-xs font-bold text-white shadow-sm hover:bg-[#15469e] transition"
              >
                Go to Staff Sign In &rarr;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
