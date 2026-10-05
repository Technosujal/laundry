import { useState } from "react";
import {
  type EmployeeRegistration,
  loadRegistrations,
} from "./staff-registration-store";
import {
  getResendSettings,
  isResendConfigured,
} from "./resend-service";

interface RegistrationStatusCardProps {
  registration: EmployeeRegistration;
  onRefresh?: (() => void) | undefined;
  onGoToSignIn: () => void;
  onViewManagerEmail?: ((regId: string) => void) | undefined;
  onOpenResendConfig?: (() => void) | undefined;
}

export function RegistrationStatusCard({
  registration: initialReg,
  onRefresh,
  onGoToSignIn,
  onViewManagerEmail,
  onOpenResendConfig,
}: RegistrationStatusCardProps) {
  const [currentReg, setCurrentReg] = useState<EmployeeRegistration>(initialReg);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);

  const resendSettings = getResendSettings();
  const resendActive = isResendConfigured();

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      const all = loadRegistrations();
      const updated = all.find((r) => r.id === currentReg.id) || currentReg;
      setCurrentReg(updated);
      setIsRefreshing(false);
      setRefreshMessage(
        updated.status === "APPROVED"
          ? "Status updated: Your account has been APPROVED by the store manager!"
          : updated.status === "REJECTED"
            ? "Status updated: Manager review complete. Application was rejected."
            : "Status refreshed: Authorization dispatch is still in review with the store manager.",
      );
      if (onRefresh) onRefresh();
    }, 400);
  };

  const isPending = currentReg.status === "PENDING";
  const isApproved = currentReg.status === "APPROVED";
  const isRejected = currentReg.status === "REJECTED";

  return (
    <div className="w-full max-w-[540px] mx-auto">
      {/* Main Card */}
      <div className="relative rounded-[28px] sm:rounded-[34px] border-2 border-[#d0e3fc] bg-white p-6 sm:p-9 shadow-[0_20px_50px_-12px_rgba(37,99,235,0.12),0_0_1px_1px_rgba(37,99,235,0.05)] transition-all">
        {/* Top Header Icon & Status Pill */}
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center gap-3">
            {/* Clock Squircle Icon */}
            <div
              className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-md ${
                isApproved
                  ? "bg-gradient-to-b from-[#10b981] to-[#059669] shadow-emerald-500/25"
                  : isRejected
                    ? "bg-gradient-to-b from-[#ef4444] to-[#dc2626] shadow-red-500/25"
                    : "bg-gradient-to-b from-[#258cfb] to-[#126fe3] shadow-blue-500/25"
              }`}
            >
              {isApproved ? (
                <svg
                  className="h-7 w-7"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : isRejected ? (
                <svg
                  className="h-7 w-7"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg
                  className="h-7 w-7"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              )}
            </div>

            {/* Status Pill */}
            <div
              className={`inline-flex items-center rounded-full border px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider ${
                isApproved
                  ? "border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]"
                  : isRejected
                    ? "border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]"
                    : "border-[#c6ddfd] bg-[#eaf3ff] text-[#1d62c9]"
              }`}
            >
              STATUS: {currentReg.status}
            </div>
          </div>

          {/* Heading */}
          <h1 className="mt-5 text-center text-[25px] font-extrabold tracking-[-0.03em] text-[#0f172a] sm:text-[29px]">
            {isApproved
              ? "Registration Approved!"
              : isRejected
                ? "Registration Rejected"
                : "Registration Submitted Successfully"}
          </h1>

          {/* Subtitle */}
          <p className="mt-2 max-w-[420px] text-center text-[13px] leading-relaxed text-[#64748b] sm:text-[14px]">
            {isApproved
              ? "Your account has been authorized by the store manager. Terminal and timecard access have been activated."
              : isRejected
                ? currentReg.rejectionReason ||
                  "Your registration could not be approved at this time. Please contact your store manager."
                : "Registration submitted successfully. Your account is waiting for manager approval. You will receive an email once your registration has been reviewed."}
          </p>
        </div>

        {/* ONBOARDING PIPELINE PROGRESS */}
        <div className="mt-7 rounded-2xl border border-[#dce8f8] bg-[#f8fbff]/70 p-4 sm:p-5">
          <p className="text-center text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#1e5eb8]">
            ONBOARDING PIPELINE PROGRESS
          </p>

          <div className="mt-5 space-y-4">
            {/* Step 1: Registration Submitted */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1752b5] text-white shadow-sm">
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-[13px] font-bold text-[#0f172a] sm:text-[14px]">
                    1. Registration Submitted
                  </h4>
                  <p className="text-[11px] text-[#64748b] sm:text-[12px]">
                    Account profile created in database
                  </p>
                </div>
              </div>
              <span className="text-[12px] font-bold text-[#1752b5] sm:text-[13px]">Completed</span>
            </div>

            {/* Step 2: Details Validated */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1752b5] text-white shadow-sm">
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-[13px] font-bold text-[#0f172a] sm:text-[14px]">
                    2. Details Validated
                  </h4>
                  <p className="text-[11px] text-[#64748b] sm:text-[12px]">
                    Identity & station geofence checked
                  </p>
                </div>
              </div>
              <span className="text-[12px] font-bold text-[#1752b5] sm:text-[13px]">Completed</span>
            </div>

            {/* Step 3: Waiting for Manager Approval */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white shadow-sm font-bold text-xs ${
                    isApproved
                      ? "bg-[#1752b5]"
                      : isRejected
                        ? "bg-[#dc2626]"
                        : "bg-[#38bdf8]"
                  }`}
                >
                  {isApproved ? (
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : isRejected ? (
                    <svg
                      className="h-3.5 w-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  ) : (
                    "3"
                  )}
                </div>
                <div>
                  <h4 className="text-[13px] font-bold text-[#0f172a] sm:text-[14px]">
                    3. Waiting for Manager Approval
                  </h4>
                  <p className="text-[11px] text-[#64748b] sm:text-[12px]">
                    Authorization dispatch sent to store manager
                  </p>
                </div>
              </div>
              <span
                className={`text-[12px] font-bold sm:text-[13px] ${
                  isApproved
                    ? "text-[#1752b5]"
                    : isRejected
                      ? "text-[#dc2626]"
                      : "text-[#0284c7]"
                }`}
              >
                {isApproved ? "Approved" : isRejected ? "Declined" : "In Review"}
              </span>
            </div>

            {/* Step 4: Ready for Login */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    isApproved
                      ? "bg-[#1752b5] text-white shadow-sm"
                      : "border border-[#cbd5e1] text-[#94a3b8] bg-white"
                  }`}
                >
                  {isApproved ? (
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    "4"
                  )}
                </div>
                <div>
                  <h4
                    className={`text-[13px] sm:text-[14px] font-semibold ${
                      isApproved ? "text-[#0f172a] font-bold" : "text-[#64748b]"
                    }`}
                  >
                    4. Ready for Login
                  </h4>
                  <p className="text-[11px] text-[#94a3b8] sm:text-[12px]">
                    Access granted to terminal & timecard
                  </p>
                </div>
              </div>
              <span
                className={`text-[12px] font-semibold sm:text-[13px] ${
                  isApproved ? "text-[#10b981] font-bold" : "text-[#94a3b8]"
                }`}
              >
                {isApproved ? "Granted" : isRejected ? "Blocked" : "Locked"}
              </span>
            </div>
          </div>
        </div>

        {/* Staff Member Info Box */}
        <div className="mt-6 rounded-2xl border-2 border-[#93c5fd] bg-[#f0f7ff]/70 p-4 sm:p-5">
          <div className="space-y-2.5 text-[13px] sm:text-[14px]">
            <div className="flex items-center justify-between pb-2 border-b border-[#dbeafe]">
              <span className="text-[#64748b]">Staff Member:</span>
              <span className="font-bold text-[#0f172a]">{currentReg.fullName}</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-[#dbeafe]">
              <span className="text-[#64748b]">Username:</span>
              <span className="font-bold text-[#0f172a]">{currentReg.username}</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-[#dbeafe]">
              <span className="text-[#64748b]">Assigned Station:</span>
              <span className="font-bold text-[#0f172a]">{currentReg.station}</span>
            </div>
            <div className="flex items-center justify-between pt-0.5">
              <span className="text-[#64748b]">Request ID:</span>
              <span className="font-bold text-[#0f172a]">#{currentReg.requestIdNumber}</span>
            </div>
          </div>
        </div>

        {/* Refresh Notification message */}
        {refreshMessage && (
          <div className="mt-4 rounded-xl bg-[#eff6ff] border border-[#bfdbfe] px-3.5 py-2.5 text-xs text-[#1e40af] text-center animate-fade-in">
            {refreshMessage}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center justify-center gap-2 rounded-xl border border-[#b8d5fa] bg-white py-3 px-4 text-[13px] font-bold text-[#1d62c9] transition hover:bg-[#eff6ff] active:scale-[0.98] disabled:opacity-50"
          >
            <svg
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            <span>{isRefreshing ? "Checking Status…" : "Refresh Approval Status"}</span>
          </button>

          <button
            type="button"
            onClick={onGoToSignIn}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1752b5] to-[#258cfb] py-3 px-5 text-[13px] font-bold text-white shadow-md shadow-blue-500/20 transition hover:brightness-105 active:scale-[0.98]"
          >
            <span>{isApproved ? "Access Staff Terminal" : "Go to Staff Sign In"}</span>
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      </div>

      {/* Real Manager Gmail Dispatch Notice */}
      <div className="mt-6 rounded-2xl border border-[#bfdbfe] bg-[#f8fbff] p-4 text-xs shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 mb-2.5">
          <div className="flex items-center gap-2">
            <span
              className={`flex h-2.5 w-2.5 rounded-full ${
                isResendConfigured() ? "bg-emerald-500 animate-pulse" : "bg-amber-400"
              }`}
            />
            <strong className="text-[#1e3a8a] text-[13px] font-bold">
              Manager Approval Dispatched to Gmail
            </strong>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#1e40af] bg-[#eff6ff] px-2.5 py-0.5 rounded-full font-semibold border border-[#dbeafe] text-[11px]">
              Recipient: {resendSettings.managerEmail || "Manager Gmail"}
            </span>
            {onOpenResendConfig && (
              <button
                type="button"
                onClick={onOpenResendConfig}
                className="text-[11px] font-bold text-[#2563eb] hover:underline"
              >
                Configure Gmail / Key
              </button>
            )}
          </div>
        </div>

        <p className="text-[#475569] leading-relaxed">
          An authorization email with one-click <strong>Approve</strong> and <strong>Reject</strong> links has been dispatched directly to the store manager&apos;s Gmail inbox. Once the manager approves from their email, this screen will automatically activate terminal credentials.
        </p>

        {!isResendConfigured() && onOpenResendConfig && (
          <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl bg-amber-50 border border-amber-200 p-2.5 text-[11px] text-amber-900">
            <span>
              <strong>Note:</strong> To deliver real emails to your Gmail inbox, configure your free Resend API key and your Gmail address.
            </span>
            <button
              type="button"
              onClick={onOpenResendConfig}
              className="self-start sm:self-auto whitespace-nowrap rounded-lg bg-amber-600 px-3 py-1 font-bold text-white hover:bg-amber-700 transition shadow-xs"
            >
              Set Gmail &amp; Key &rarr;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
