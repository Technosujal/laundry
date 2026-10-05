import { useState, useEffect } from "react";
import {
  type EmployeeRegistration,
  loadRegistrations,
  approveEmployeeRegistration,
  rejectEmployeeRegistration,
} from "./staff-registration-store";

interface ManagerApprovalDashboardProps {
  onViewEmail: (regId: string) => void;
  onRefreshRegistrations?: () => void;
  onClose?: () => void;
}

export function ManagerApprovalDashboard({
  onViewEmail,
  onRefreshRegistrations,
  onClose,
}: ManagerApprovalDashboardProps) {
  const [registrations, setRegistrations] = useState<EmployeeRegistration[]>(() =>
    loadRegistrations(),
  );
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const hash = window.location.hash;
      const qIndex = hash.indexOf("?");
      if (qIndex !== -1) {
        const params = new URLSearchParams(hash.slice(qIndex + 1));
        const targetId = params.get("id");
        const action = params.get("action");
        if (targetId && action === "approve") {
          const res = approveEmployeeRegistration(targetId, "Store Manager (via Email Link)");
          if (res.registration) {
            setStatusMessage(
              `✓ Successfully approved ${res.registration.fullName} for ${res.registration.station} from email link! Terminal credentials activated.`,
            );
            refreshList();
          }
        } else if (targetId && action === "reject") {
          const res = rejectEmployeeRegistration(
            targetId,
            "Manager declined onboarding authorization via email action.",
            "Store Manager (via Email Link)",
          );
          if (res.registration) {
            setStatusMessage(`Declined ${res.registration.fullName} from email link.`);
            refreshList();
          }
        }
      }
    } catch {}
  }, []);

  const refreshList = () => {
    const list = loadRegistrations();
    setRegistrations(list);
    if (onRefreshRegistrations) onRefreshRegistrations();
  };

  const handleApprove = (id: string) => {
    const res = approveEmployeeRegistration(id, "Store Manager");
    if (res.registration) {
      setStatusMessage(`Approved ${res.registration.fullName} for ${res.registration.station}. Confirmation email dispatched.`);
      refreshList();
    }
  };

  const handleConfirmReject = (id: string) => {
    const res = rejectEmployeeRegistration(
      id,
      rejectReason || "Manager declined onboarding authorization.",
      "Store Manager",
    );
    if (res.registration) {
      setStatusMessage(`Declined ${res.registration.fullName}. Notice email dispatched.`);
      setRejectingId(null);
      setRejectReason("");
      refreshList();
    }
  };

  const filtered = registrations.filter((r) => {
    if (filter === "ALL") return true;
    return r.status === filter;
  });

  const pendingCount = registrations.filter((r) => r.status === "PENDING").length;

  return (
    <div className="w-full space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#e2e8f0] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-800 uppercase tracking-wider">
              Manager Authorization Portal
            </span>
            {pendingCount > 0 && (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 animate-pulse">
                {pendingCount} Pending Review
              </span>
            )}
          </div>
          <h2 className="mt-1 text-2xl font-black text-[#0f172a]">
            Employee Registration &amp; Station Approvals
          </h2>
          <p className="text-xs text-[#64748b]">
            Review incoming staff onboarding requests, inspect geofence checks, and authorize terminal credentials.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onViewEmail(registrations[0]?.id || "")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#cbd5e1] bg-white px-3.5 py-2 text-xs font-bold text-[#0f172a] shadow-xs hover:bg-[#f8fafc] transition"
          >
            <svg className="h-4 w-4 text-[#2563eb]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            Manager Inbox
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-line bg-white px-3 py-2 text-xs font-bold text-[#64748b] hover:text-[#0f172a]"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 flex items-center justify-between animate-fade-in">
          <span>{statusMessage}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold ml-2"
          >
            ×
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#e2e8f0] pb-2 text-xs font-bold">
        {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            className={`rounded-lg px-3 py-1.5 transition ${
              filter === tab
                ? "bg-[#0f172a] text-white shadow-xs"
                : "text-[#64748b] hover:bg-slate-100 hover:text-[#0f172a]"
            }`}
          >
            {tab === "ALL" ? "All Requests" : tab.charAt(0) + tab.slice(1).toLowerCase()}
            {tab === "PENDING" && pendingCount > 0 && ` (${pendingCount})`}
          </button>
        ))}
      </div>

      {/* Registrations List */}
      <div className="space-y-4">
        {filtered.map((reg) => {
          const isPending = reg.status === "PENDING";
          const isApproved = reg.status === "APPROVED";
          const isRejected = reg.status === "REJECTED";

          return (
            <div
              key={reg.id}
              className={`rounded-2xl border bg-white p-5 shadow-xs transition ${
                isPending
                  ? "border-[#93c5fd] ring-1 ring-[#93c5fd]/50 bg-[#fbfdff]"
                  : "border-[#e2e8f0]"
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Staff summary */}
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                        isApproved
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : isRejected
                            ? "bg-red-100 text-red-800 border border-red-200"
                            : "bg-amber-100 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {reg.status}
                    </span>
                    <span className="text-xs font-bold text-[#64748b]">
                      Request #{reg.requestIdNumber}
                    </span>
                    <span className="text-xs text-[#94a3b8]">
                      Submitted {new Date(reg.createdAt).toLocaleDateString()} at{" "}
                      {new Date(reg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-[#0f172a] flex items-center gap-2">
                    {reg.fullName}
                    <span className="text-xs font-semibold text-[#64748b]">
                      (@{reg.username})
                    </span>
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#475569]">
                    <div>
                      <span className="text-[#94a3b8]">Station: </span>
                      <strong className="text-[#2563eb]">{reg.station}</strong>
                    </div>
                    <div>
                      <span className="text-[#94a3b8]">Email: </span>
                      <span>{reg.email}</span>
                    </div>
                    <div>
                      <span className="text-[#94a3b8]">Geofence: </span>
                      <span className="text-emerald-700 font-medium">✓ {reg.stationGeofence}</span>
                    </div>
                  </div>

                  {reg.notes && (
                    <p className="mt-1 text-xs text-[#64748b] bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <strong>Notes:</strong> {reg.notes}
                    </p>
                  )}

                  {isRejected && reg.rejectionReason && (
                    <p className="mt-1 text-xs text-red-700 bg-red-50 p-2 rounded-lg border border-red-100">
                      <strong>Rejection Reason:</strong> {reg.rejectionReason}
                    </p>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onViewEmail(reg.id)}
                    className="inline-flex items-center gap-1 rounded-xl border border-[#cbd5e1] bg-white px-3 py-2 text-xs font-bold text-[#334155] hover:bg-slate-50 transition"
                  >
                    <svg className="h-3.5 w-3.5 text-[#2563eb]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect width="20" height="16" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                    Email Notification
                  </button>

                  {isPending && (
                    <span className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
                      <svg className="h-3.5 w-3.5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect width="20" height="16" x="2" y="4" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                      Approve via Gmail Only
                    </span>
                  )}

                  {!isPending && (
                    <button
                      type="button"
                      onClick={() => {
                        const all = loadRegistrations();
                        const updated = all.map((r) =>
                          r.id === reg.id ? { ...r, status: "PENDING" as const, reviewedAt: null } : r,
                        );
                        localStorage.setItem("wavemax.employee-registrations.v1", JSON.stringify(updated));
                        refreshList();
                      }}
                      className="text-xs text-[#64748b] underline hover:text-[#0f172a] px-2 py-1"
                    >
                      Reopen as Pending
                    </button>
                  )}
                </div>
              </div>

              {/* Rejection input prompt */}
              {rejectingId === reg.id && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50/50 p-4 animate-fade-in">
                  <label className="block text-xs font-bold text-red-900 mb-1">
                    State the reason for rejecting {reg.fullName}&apos;s onboarding request:
                  </label>
                  <input
                    type="text"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="e.g. Workstation schedule is currently full; please re-apply next cycle."
                    className="w-full rounded-lg border border-red-300 bg-white p-2.5 text-xs outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <div className="mt-2.5 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setRejectingId(null)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConfirmReject(reg.id)}
                      className="rounded-lg bg-red-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-red-700 transition"
                    >
                      Confirm Reject &amp; Send Email
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="rounded-2xl border border-line bg-white p-12 text-center text-xs text-[#64748b]">
            No registration requests found under this filter.
          </div>
        )}
      </div>
    </div>
  );
}
