import { useState, type FormEvent } from "react";
import {
  loadRegistrations,
  type EmployeeRegistration,
  setActiveRegistrationId,
} from "./staff-registration-store";

interface StaffSignInPageProps {
  onSuccessLogin: (staff: { id: string; name: string; station: string }) => void;
  onShowPendingStatus: (reg: EmployeeRegistration) => void;
  onGoToRegister: () => void;
  onRoleLogin?: ((role: "MANAGER" | "OWNER", name: string) => void) | undefined;
}

export function StaffSignInPage({
  onSuccessLogin,
  onShowPendingStatus,
  onGoToRegister,
  onRoleLogin,
}: StaffSignInPageProps) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignIn = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const query = identifier.trim().toLowerCase();
    if (!query) {
      setError("Please enter your username or registered email.");
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      const all = loadRegistrations();

      // Look up matching registration
      const match = all.find(
        (r) =>
          r.username.toLowerCase() === query ||
          r.email.toLowerCase() === query ||
          r.fullName.toLowerCase() === query,
      );

      if (!match) {
        // Fallback for default preview staff
        if (query === "sample-staff-a" || query === "employee") {
          onSuccessLogin({
            id: "sample-staff-a",
            name: "Sample Staff A",
            station: "Commercial Wash Bay",
          });
          return;
        }
        setError("Account not found. Please register first or verify your username.");
        return;
      }

      // Check status
      if (match.status === "PENDING") {
        setActiveRegistrationId(match.id);
        onShowPendingStatus(match);
        return;
      }

      if (match.status === "REJECTED") {
        setError(
          `Access Denied: Your registration was declined by the manager (${match.rejectionReason || "Position closed"}). Please submit a new registration or contact the manager.`,
        );
        return;
      }

      if (match.status === "APPROVED") {
        onSuccessLogin({
          id: match.id,
          name: match.fullName,
          station: match.station,
        });
      }
    }, 350);
  };

  const handleTestPending = () => {
    const all = loadRegistrations();
    const reg355 = all.find((r) => r.requestIdNumber === 355);
    if (reg355) {
      setActiveRegistrationId(reg355.id);
      onShowPendingStatus(reg355);
    } else {
      setIdentifier("we2");
    }
  };

  return (
    <div className="w-full max-w-[500px] mx-auto">
      <div className="relative rounded-[28px] sm:rounded-[34px] border-2 border-[#d0e3fc] bg-white p-6 sm:p-9 shadow-[0_20px_50px_-12px_rgba(37,99,235,0.12)]">
        {/* Brand Lockup */}
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1752b5] to-[#258cfb] text-white font-black text-xl shadow-md shadow-blue-500/25">
            W
          </div>
          <span className="mt-3 block text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#2563eb]">
            WAVEMAX TERMINAL ACCESS
          </span>
          <h1 className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-[#0f172a]">
            Staff Sign In
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-[#64748b]">
            Sign in to access your station terminal, timecard &amp; active shift tasks.
          </p>
        </div>

        {/* Demo Fast Presets */}
        <div className="mt-5 rounded-xl border border-blue-100 bg-[#f0f7ff] p-3 text-xs">
          <p className="font-semibold text-[#1e40af] mb-2">Quick Test Accounts:</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleTestPending}
              className="rounded-lg border border-[#bfdbfe] bg-white px-2.5 py-1.5 text-left font-medium text-[#1d4ed8] hover:bg-[#eff6ff] transition"
            >
              <strong className="block text-[11px]">dd d (we2)</strong>
              <span className="text-[10px] text-[#64748b]">Status: Pending Approval</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIdentifier("mvance");
                setPassword("password123");
              }}
              className="rounded-lg border border-[#bfdbfe] bg-white px-2.5 py-1.5 text-left font-medium text-[#1d4ed8] hover:bg-[#eff6ff] transition"
            >
              <strong className="block text-[11px]">Marcus Vance</strong>
              <span className="text-[10px] text-[#16a34a]">Status: Approved Staff</span>
            </button>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 animate-fade-in">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSignIn} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#334155] mb-1.5">
              Username or Staff Email
            </label>
            <input
              type="text"
              required
              placeholder="e.g. we2 or mvance@wavemaxstaff.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full rounded-xl border border-[#cbd5e1] bg-white px-3.5 py-2.5 text-sm text-[#0f172a] placeholder-slate-400 outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 transition"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#334155]">
                Password
              </label>
              <span className="text-[11px] text-[#64748b]">Store Terminal Key</span>
            </div>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" strokeDasharray="30" strokeDashoffset="0" />
                  </svg>
                  <span>Verifying Terminal Credentials…</span>
                </>
              ) : (
                <>
                  <span>Sign In to Terminal</span>
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Link to Register */}
        <div className="mt-6 text-center text-xs text-[#64748b]">
          New employee awaiting assignment?{" "}
          <button
            type="button"
            onClick={onGoToRegister}
            className="font-bold text-[#2563eb] hover:underline"
          >
            Register Here
          </button>
        </div>

        {onRoleLogin && (
          <div className="mt-6 pt-5 border-t border-[#e2e8f0] text-center">
            <span className="block text-[11px] font-semibold text-[#64748b] mb-2.5">
              Store Manager or Owner Access:
            </span>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => onRoleLogin("MANAGER", "Store Manager")}
                className="rounded-xl border border-[#cbd5e1] bg-[#f8fafc] px-3.5 py-1.5 text-xs font-bold text-[#0f172a] hover:bg-slate-200 transition"
              >
                Sign In as Manager
              </button>
              <button
                type="button"
                onClick={() => onRoleLogin("OWNER", "Store Owner")}
                className="rounded-xl border border-[#cbd5e1] bg-[#f8fafc] px-3.5 py-1.5 text-xs font-bold text-[#0f172a] hover:bg-slate-200 transition"
              >
                Sign In as Owner
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
