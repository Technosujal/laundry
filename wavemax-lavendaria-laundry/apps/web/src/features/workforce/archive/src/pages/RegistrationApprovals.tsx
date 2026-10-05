// @ts-nocheck
import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import {
  UserPlus,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Eye,
  Clock,
  MapPin,
  Calendar,
  Briefcase,
  X,
  AlertTriangle,
  History,
  ShieldCheck,
} from 'lucide-react';
import type { RegistrationApplication } from '../data/workforceData';

export default function RegistrationApprovals() {
  const {
    currentUser,
    registrations,
    approveRegistration,
    rejectRegistration,
    clarifyRegistration,
  } = useAppContext();

  const role = currentUser?.role || 'owner';

  // State for detail drawer / modal
  const [selectedReg, setSelectedReg] = useState<RegistrationApplication | null>(null);

  // Dialog action state
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'clarify' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Scope filter:
  // Managers see pending Employee registrations only for assigned laundry locations.
  // Owners see pending Manager registrations + all org registrations.
  const visibleRegistrations = registrations.filter((reg) => {
    if (role === 'owner') return true;
    if (role === 'manager') {
      if (reg.requestedRole !== 'Employee') return false;
      const userLocs = currentUser?.locationIds || [];
      return reg.requestedLocationIds.some((id) => userLocs.includes(id));
    }
    return false;
  });

  const pendingCount = visibleRegistrations.filter((r) => r.status === 'Pending Approval').length;

  const handleApprove = (reg: RegistrationApplication) => {
    approveRegistration(reg.id);
    showToast(`Approved ${reg.fullName} (${reg.requestedRole}). Added to organization directory!`);
    setActionType(null);
    setSelectedReg(null);
  };

  const handleReject = () => {
    if (!selectedReg || !actionReason.trim()) return;
    rejectRegistration(selectedReg.id, actionReason);
    showToast(`Rejected application for ${selectedReg.fullName}.`);
    setActionType(null);
    setActionReason('');
    setSelectedReg(null);
  };

  const handleClarify = () => {
    if (!selectedReg || !actionReason.trim()) return;
    clarifyRegistration(selectedReg.id, actionReason);
    showToast(`Clarification request dispatched to ${selectedReg.fullName}.`);
    setActionType(null);
    setActionReason('');
    setSelectedReg(null);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-teal-800 text-white text-xs font-semibold py-3 px-4 rounded-xl shadow-lg flex items-center gap-2 border border-teal-600 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-teal-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Registration Approvals</h1>
          <p className="text-sm text-gray-500 mt-1">
            {role === 'owner'
              ? 'Organization-wide onboarding queue & Store Manager candidate reviews'
              : 'Assigned location employee onboarding & staff credential verification'}
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-50 border border-teal-200 rounded-lg text-teal-800 text-xs font-semibold">
          <Clock className="w-4 h-4 text-teal-600" />
          <span>Pending Decisions: <strong>{pendingCount} applicant(s)</strong></span>
        </div>
      </div>

      {/* Summary Banner for Role Context */}
      <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-700">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>
            Acting Reviewer: <strong>{currentUser?.name}</strong> ({role === 'owner' ? 'Executive Owner' : 'Store Manager'})
            {role === 'manager' && ' · Scoped to assigned facility applicants only.'}
          </span>
        </div>
        <span className="text-gray-400 font-mono text-[11px]">
          {visibleRegistrations.length} applications on file
        </span>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-2.5 px-3">Applicant & Ref</th>
                <th className="py-2.5 px-3">Role & Type</th>
                <th className="py-2.5 px-3">Requested Location</th>
                <th className="py-2.5 px-3">Shift & Start</th>
                <th className="py-2.5 px-3">Submitted</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visibleRegistrations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400 text-xs">
                    No registration applications found matching your facility scope.
                  </td>
                </tr>
              ) : (
                visibleRegistrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-gray-900">{reg.fullName}</div>
                      <div className="text-[11px] font-mono text-gray-400">{reg.refNumber}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-100 text-teal-800">
                        {reg.requestedRole}
                      </span>
                      <div className="text-[11px] text-gray-500 mt-0.5">{reg.employmentType}</div>
                    </td>
                    <td className="py-3 px-3 text-xs text-gray-700 font-medium">
                      {reg.requestedLocationNames.join(', ')}
                    </td>
                    <td className="py-3 px-3 text-xs text-gray-600">
                      <div>{reg.preferredShift} Shift</div>
                      <div className="text-[11px] text-gray-400">Start: {reg.proposedStartDate}</div>
                    </td>
                    <td className="py-3 px-3 text-xs text-gray-500">
                      {reg.submittedDate}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          reg.status === 'Approved'
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : reg.status === 'Rejected'
                            ? 'bg-red-100 text-red-700 border border-red-200'
                            : reg.status === 'Clarification Requested'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {reg.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedReg(reg)}
                          className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
                          title="View Full Profile & Timeline"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {reg.status === 'Pending Approval' || reg.status === 'Clarification Requested' ? (
                          <>
                            <button
                              onClick={() => handleApprove(reg)}
                              className="px-2 py-1 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-md transition-colors"
                              title="Approve Applicant"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setSelectedReg(reg);
                                setActionType('reject');
                              }}
                              className="px-2 py-1 text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-md transition-colors"
                              title="Reject Applicant"
                            >
                              Reject
                            </button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Detail Drawer */}
      {selectedReg && !actionType && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex justify-end">
          <div className="bg-white w-full max-w-lg h-full p-6 shadow-2xl overflow-y-auto flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-teal-600" />
                  <h2 className="text-base font-bold text-gray-900">Registration Details</h2>
                </div>
                <button
                  onClick={() => setSelectedReg(null)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Detail Content */}
              <div className="mt-5 space-y-4 text-xs">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase">Applicant</span>
                    <strong className="text-sm text-gray-900">{selectedReg.fullName}</strong>
                    <span className="text-gray-500 block">{selectedReg.email} · {selectedReg.phone}</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-teal-800 bg-teal-100 px-2 py-1 rounded">
                    {selectedReg.refNumber}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-400 block text-[10px] uppercase">Role</span>
                    <strong className="text-gray-900">{selectedReg.requestedRole}</strong>
                    <span className="text-gray-500 block">{selectedReg.employmentType}</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-400 block text-[10px] uppercase">Shift Preference</span>
                    <strong className="text-gray-900">{selectedReg.preferredShift}</strong>
                    <span className="text-gray-500 block">Proposed: {selectedReg.proposedStartDate}</span>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-400 block text-[10px] uppercase">Target Facilities</span>
                  <p className="font-medium text-gray-800">{selectedReg.requestedLocationNames.join(', ')}</p>
                </div>

                {selectedReg.message && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-400 block text-[10px] uppercase">Applicant Message</span>
                    <p className="text-gray-700 italic mt-0.5">"{selectedReg.message}"</p>
                  </div>
                )}

                {/* Timeline */}
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 font-bold text-gray-900 mb-3">
                    <History className="w-4 h-4 text-gray-400" />
                    <span>Approval Audit Trail</span>
                  </div>
                  <div className="space-y-3 pl-2 border-l-2 border-teal-200">
                    {selectedReg.approvalTimeline.map((item, idx) => (
                      <div key={idx} className="relative pl-3">
                        <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-teal-600"></div>
                        <span className="text-[10px] text-gray-400 block">{item.date}</span>
                        <strong className="text-gray-800 block">{item.action}</strong>
                        <span className="text-gray-600 block text-[11px]">{item.actor}</span>
                        {item.note && (
                          <p className="text-teal-800 bg-teal-50/80 p-1.5 rounded mt-1 border border-teal-100">
                            {item.note}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Drawer Actions */}
            <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedReg(null)}
                className="px-3.5 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Close
              </button>
              {(selectedReg.status === 'Pending Approval' || selectedReg.status === 'Clarification Requested') && (
                <>
                  <button
                    onClick={() => setActionType('clarify')}
                    className="px-3 py-2 text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg"
                  >
                    Request Clarification
                  </button>
                  <button
                    onClick={() => setActionType('reject')}
                    className="px-3 py-2 text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(selectedReg)}
                    className="px-4 py-2 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-xs"
                  >
                    Approve Application
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation / Message Dialog for Reject or Clarify */}
      {selectedReg && actionType && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-md w-full p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-1">
              {actionType === 'reject' ? 'Reject Registration Application' : 'Request Applicant Clarification'}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              {actionType === 'reject'
                ? `Provide a reason for rejecting ${selectedReg.fullName}'s registration.`
                : `Specify what information or scheduling flexibility is required from ${selectedReg.fullName}.`}
            </p>

            <textarea
              rows={3}
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder={
                actionType === 'reject'
                  ? 'e.g. Schedule mismatch or full shift capacity reached...'
                  : 'e.g. Can you work alternate weekend shifts?'
              }
              className="w-full text-xs border border-gray-300 rounded-lg p-2.5 outline-teal-600"
              required
            ></textarea>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => { setActionType(null); setActionReason(''); }}
                className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={actionType === 'reject' ? handleReject : handleClarify}
                disabled={!actionReason.trim()}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg text-white ${
                  actionType === 'reject'
                    ? 'bg-red-600 hover:bg-red-700 disabled:opacity-50'
                    : 'bg-amber-600 hover:bg-amber-700 disabled:opacity-50'
                }`}
              >
                {actionType === 'reject' ? 'Confirm Rejection' : 'Send Clarification Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// @ts-nocheck — verbatim local-preview code from LaundryAI - Copy.zip.
