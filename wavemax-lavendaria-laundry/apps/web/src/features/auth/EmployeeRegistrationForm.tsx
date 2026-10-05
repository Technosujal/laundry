import { useState, type FormEvent } from "react";
import {
  STATIONS,
  type StationName,
  submitEmployeeRegistration,
  type EmployeeRegistration,
} from "./staff-registration-store";
import { sendManagerApprovalEmail, getResendSettings, isResendConfigured } from "./resend-service";

interface EmployeeRegistrationFormProps {
  onSuccess: (reg: EmployeeRegistration) => void;
  onGoToSignIn: () => void;
  onOpenResendConfig?: () => void;
}

export function EmployeeRegistrationForm({
  onSuccess,
  onGoToSignIn,
  onOpenResendConfig,
}: EmployeeRegistrationFormProps) {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [station, setStation] = useState<StationName>("Commercial Wash Bay");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);

  const resendSettings = getResendSettings();
  const resendActive = isResendConfigured();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!username.trim()) {
      setError("Please enter a desired username.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    setDispatchStatus("Submitting registration & dispatching approval email...");

    try {
      const result = submitEmployeeRegistration({
        fullName,
        username,
        email,
        password,
        station,
        notes,
      });

      // Dispatch real email via Resend to the Manager
      const emailResult = await sendManagerApprovalEmail(result.registration);

      if (emailResult.success) {
        setDispatchStatus(
          `Approval email sent to manager (${resendSettings.managerEmail || "manager inbox"}) via Resend!`,
        );
      } else {
        setDispatchStatus("Registration submitted! Email recorded for manager review.");
      }

      setTimeout(() => {
        setIsSubmitting(false);
        onSuccess(result.registration);
      }, 500);
    } catch {
      setIsSubmitting(false);
      setError("Failed to submit registration. Please try again.");
    }
  };

  const prefillSample = () => {
    setFullName("dd d");
    setUsername("we2");
    setEmail("we2@wavemaxstaff.com");
    setPassword("password123");
    setConfirmPassword("password123");
    setStation("Commercial Wash Bay");
    setNotes("Ready for morning wash cycle shift.");
  };

  return (
    <div className="w-full max-w-[540px] mx-auto">
      <div className="relative rounded-[28px] sm:rounded-[34px] border-2 border-[#d0e3fc] bg-white p-6 sm:p-9 shadow-[0_20px_50px_-12px_rgba(37,99,235,0.12)]">
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] text-white font-black text-xl shadow-md shadow-blue-500/25">
            W
          </div>
          <span className="mt-3 block text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#2563eb]">
            WAVEMAX ONBOARDING TERMINAL
          </span>
          <h1 className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-[#0f172a]">
            Staff Member Registration
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-[#64748b]">
            Submit your profile for manager approval to receive terminal &amp; timecard access.
          </p>
        </div>

        {/* Demo Helper Banner */}
        <div className="mt-5 flex items-center justify-between rounded-xl border border-blue-100 bg-[#f0f7ff] p-3 text-xs">
          <span className="text-[#1e40af] font-medium">Quick Demo Preset:</span>
          <button
            type="button"
            onClick={prefillSample}
            className="rounded-lg bg-[#2563eb] px-3 py-1 font-bold text-white hover:bg-[#1d4ed8] transition"
          >
            Pre-fill Screenshot Data (dd d / we2)
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 animate-fade-in">
            {error}
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#334155] mb-1.5">
              Staff Member (Full Name) *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. dd d or Jane Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-[#cbd5e1] bg-white px-3.5 py-2.5 text-sm text-[#0f172a] placeholder-slate-400 outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#334155] mb-1.5">
                Username *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. we2"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-[#cbd5e1] bg-white px-3.5 py-2.5 text-sm text-[#0f172a] placeholder-slate-400 outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#334155] mb-1.5">
                Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="employee@wavemaxstaff.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[#cbd5e1] bg-white px-3.5 py-2.5 text-sm text-[#0f172a] placeholder-slate-400 outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#334155] mb-1.5">
              Assigned Station *
            </label>
            <select
              value={station}
              onChange={(e) => setStation(e.target.value as StationName)}
              className="w-full rounded-xl border border-[#cbd5e1] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#0f172a] outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 transition"
            >
              {STATIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-[11px] text-[#64748b]">
              Geofence and terminal access will be bound to this workstation.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#334155] mb-1.5">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-[#cbd5e1] bg-white px-3.5 py-2.5 text-sm text-[#0f172a] placeholder-slate-400 outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#334155] mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-[#cbd5e1] bg-white px-3.5 py-2.5 text-sm text-[#0f172a] placeholder-slate-400 outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#334155] mb-1.5">
              Shift Preference / Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Available for Morning & Afternoon shifts"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-[#cbd5e1] bg-white px-3.5 py-2.5 text-sm text-[#0f172a] placeholder-slate-400 outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 transition"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-gradient-to-r from-[#1752b5] to-[#258cfb] py-3.5 px-4 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition hover:brightness-105 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" strokeDasharray="30" strokeDashoffset="0" />
                  </svg>
                  <span>Dispatching to Store Manager…</span>
                </>
              ) : (
                <>
                  <span>Submit Registration &amp; Request Approval</span>
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>
          </div>

          {dispatchStatus && (
            <div className="rounded-xl bg-blue-50 border border-blue-200 p-2.5 text-xs text-blue-800 text-center animate-fade-in font-medium">
              {dispatchStatus}
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] text-[#64748b] px-1 pt-1">
            <span className="flex items-center gap-1.5">
              <span
                className={`h-2 w-2 rounded-full ${resendActive ? "bg-green-500" : "bg-amber-400"}`}
              />
              <span>
                Resend Email:{" "}
                <strong className="text-slate-700">
                  {resendActive
                    ? `Active (${resendSettings.managerEmail || "to manager"})`
                    : "Key Needed (Click Configure)"}
                </strong>
              </span>
            </span>
            {onOpenResendConfig && (
              <button
                type="button"
                onClick={onOpenResendConfig}
                className="text-[#2563eb] hover:underline font-semibold"
              >
                Configure Resend &rarr;
              </button>
            )}
          </div>
        </form>

        {/* Footer switch to Sign In */}
        <div className="mt-6 text-center text-xs text-[#64748b]">
          Already have an approved account?{" "}
          <button
            type="button"
            onClick={onGoToSignIn}
            className="font-bold text-[#2563eb] hover:underline"
          >
            Go to Staff Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
