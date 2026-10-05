import { useState } from "react";
import {
  type DispatchedEmail,
  loadEmails,
  markEmailAsRead,
  approveEmployeeRegistration,
  rejectEmployeeRegistration,
} from "./staff-registration-store";

interface ManagerEmailViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRegistrationId?: string | undefined;
  onDecisionMade?: (() => void) | undefined;
}

export function ManagerEmailViewerModal({
  isOpen,
  onClose,
  selectedRegistrationId,
  onDecisionMade,
}: ManagerEmailViewerModalProps) {
  const [emails, setEmails] = useState<DispatchedEmail[]>(() => loadEmails());
  const [selectedEmailId, setSelectedEmailId] = useState<string>(() => {
    const list = loadEmails();
    if (selectedRegistrationId) {
      const match = list.find((e) => e.registrationId === selectedRegistrationId);
      if (match) return match.id;
    }
    return list[0]?.id || "";
  });
  const [rejectionNotes, setRejectionNotes] = useState("");
  const [showRejectPrompt, setShowRejectPrompt] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentEmail = emails.find((e) => e.id === selectedEmailId) || emails[0];

  const handleSelectEmail = (email: DispatchedEmail) => {
    setSelectedEmailId(email.id);
    markEmailAsRead(email.id);
    setEmails(loadEmails());
    setShowRejectPrompt(false);
    setActionNotice(null);
  };

  const handleApprove = () => {
    if (!currentEmail?.registrationId) return;
    const res = approveEmployeeRegistration(currentEmail.registrationId, "Store Manager");
    if (res.registration) {
      setActionNotice("Registration APPROVED! Employee has been granted terminal access & confirmation email dispatched.");
      setEmails(loadEmails());
      if (onDecisionMade) onDecisionMade();
    }
  };

  const handleRejectConfirm = () => {
    if (!currentEmail?.registrationId) return;
    const res = rejectEmployeeRegistration(
      currentEmail.registrationId,
      rejectionNotes || "Manager declined registration request.",
      "Store Manager",
    );
    if (res.registration) {
      setActionNotice("Registration REJECTED. Notification email sent to employee.");
      setShowRejectPrompt(false);
      setEmails(loadEmails());
      if (onDecisionMade) onDecisionMade();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
      <div className="flex h-[90vh] max-h-[780px] w-full max-w-[960px] flex-col overflow-hidden rounded-2xl border border-[#cbd5e1] bg-white shadow-2xl">
        {/* Email Client Header */}
        <div className="flex items-center justify-between border-b border-[#e2e8f0] bg-[#0f172a] px-5 py-3.5 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2563eb] text-white">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Wavemax Mail Dispatch</h3>
              <p className="text-[11px] text-[#94a3b8]">
                Store Manager Inbox: <span className="text-[#38bdf8]">manager@wavemaxlaundry.com</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-blue-500/20 px-2.5 py-1 text-[11px] font-semibold text-blue-300">
              Live Mock Email System
            </span>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              aria-label="Close"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Client Body: Split Sidebar & Email Preview */}
        <div className="grid flex-1 grid-cols-1 md:grid-cols-[300px_1fr] overflow-hidden">
          {/* Email List Sidebar */}
          <div className="border-r border-[#e2e8f0] bg-[#f8fafc] overflow-y-auto">
            <div className="p-3 border-b border-[#e2e8f0] bg-white">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
                Dispatched Emails ({emails.length})
              </span>
            </div>

            <div className="divide-y divide-[#e2e8f0]">
              {emails.map((email) => {
                const isSelected = email.id === currentEmail?.id;
                return (
                  <button
                    key={email.id}
                    type="button"
                    onClick={() => handleSelectEmail(email)}
                    className={`w-full text-left p-3.5 transition ${
                      isSelected
                        ? "bg-[#eff6ff] border-l-4 border-l-[#2563eb]"
                        : "hover:bg-slate-100 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] text-[#64748b] mb-1">
                      <span className="font-semibold text-[#0f172a] truncate max-w-[170px]">
                        {email.recipientRole === "MANAGER" ? "To: Store Manager" : `To: ${email.recipient}`}
                      </span>
                      <span>{new Date(email.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <div className="text-[12px] font-bold text-[#1e293b] truncate mb-1">
                      {email.subject}
                    </div>
                    <p className="text-[11px] text-[#64748b] line-clamp-2 leading-relaxed">
                      {email.previewText}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Email Content Area */}
          <div className="flex flex-col bg-white overflow-y-auto p-6">
            {currentEmail ? (
              <div className="space-y-6">
                {/* Email Metadata */}
                <div className="border-b border-[#e2e8f0] pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-[#0f172a] leading-snug">
                        {currentEmail.subject}
                      </h2>
                      <div className="mt-2 text-xs text-[#64748b] space-y-1">
                        <div>
                          <strong className="text-[#334155]">From:</strong> Wavemax Onboarding Dispatch &lt;onboarding@wavemaxlaundry.com&gt;
                        </div>
                        <div>
                          <strong className="text-[#334155]">To:</strong> {currentEmail.recipient}
                        </div>
                        <div>
                          <strong className="text-[#334155]">Date:</strong> {new Date(currentEmail.sentAt).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <span className="shrink-0 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                      {currentEmail.recipientRole === "MANAGER" ? "Manager Action Required" : "Staff Notification"}
                    </span>
                  </div>
                </div>

                {/* Status Notice Banner if action taken */}
                {actionNotice && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-800 animate-fade-in">
                    {actionNotice}
                  </div>
                )}

                {/* Email Body Visual Render (Standard Wavemax Email Template) */}
                <div className="rounded-2xl border border-[#cbd5e1] bg-[#f8fafc] p-6 shadow-xs">
                  {/* Brand Header */}
                  <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563eb] text-white font-bold text-sm">
                        W
                      </div>
                      <span className="text-base font-extrabold tracking-tight text-[#0f172a]">
                        WAVEMAX LAUNDRY
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-[#64748b]">STORE #104 TERMINAL SYSTEM</span>
                  </div>

                  {/* Email Message Content */}
                  <div className="py-5 text-[13px] leading-relaxed text-[#334155] space-y-4">
                    <p className="font-semibold text-slate-800">
                      Hello Store Manager,
                    </p>
                    <p>
                      A new employee registration has been submitted and identity &amp; geofence checks have passed.
                      Please review the candidate's station assignment and authorize or decline access to the store's POS terminal and timecard system.
                    </p>

                    {/* Registration Details Card */}
                    <div className="rounded-xl border border-[#bfdbfe] bg-white p-4 shadow-xs">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#1e40af] mb-3">
                        Employee Registration Details
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-[#64748b] block">Staff Full Name:</span>
                          <strong className="text-[#0f172a] text-sm">{currentEmail.applicant.fullName}</strong>
                        </div>
                        <div>
                          <span className="text-[#64748b] block">Requested Username:</span>
                          <strong className="text-[#0f172a] text-sm">{currentEmail.applicant.username}</strong>
                        </div>
                        <div>
                          <span className="text-[#64748b] block">Assigned Station:</span>
                          <strong className="text-[#2563eb] text-sm">{currentEmail.applicant.station}</strong>
                        </div>
                        <div>
                          <span className="text-[#64748b] block">Registration Request ID:</span>
                          <strong className="text-[#0f172a] text-sm">#{currentEmail.applicant.requestIdNumber}</strong>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#64748b]">
                        <span>✓ Geofence Status: Verified (Bay Geofence Beacon #2)</span>
                        <span>Terminal Access: Locked (Pending Approval)</span>
                      </div>
                    </div>

                    {/* Email Action Notice */}
                    {currentEmail.recipientRole === "MANAGER" && (
                      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50/70 p-5 text-center">
                        <p className="text-xs font-bold text-blue-950 mb-2">
                          Manager Approval Action Required via Gmail
                        </p>
                        <p className="text-xs text-[#475569] max-w-md mx-auto mb-4">
                          Direct in-app approval has been disabled. To authorize this employee, open the email delivered to your inbox (<strong>manager@wavemaxlaundry.com / sujaldhar666@gmail.com</strong>) and click <strong>Approve Employee</strong>.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                          <a
                            href={`/#manager-approvals?id=${currentEmail.registrationId}&action=approve`}
                            onClick={() => {
                              onClose();
                            }}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#16a34a] px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#15803d] transition active:scale-[0.98]"
                          >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            Simulate Gmail Approval Link
                          </a>
                        </div>
                      </div>
                    )}

                    <p className="text-[11px] text-[#94a3b8] pt-2 border-t border-[#e2e8f0]">
                      This is an automated dispatch from the Wavemax Laundry Employee Management System. Please do not reply directly to this email.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-[#94a3b8]">
                No email selected.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
