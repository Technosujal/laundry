// @ts-nocheck
import { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Send,
  X,
  History,
  Shield,
  FileText,
  AlertTriangle,
  Users,
} from 'lucide-react';
import type { LeaveRequest, LeaveBalance } from '../../data/workforceData';

export default function LeaveManagement() {
  const {
    currentUser,
    leaveBalances,
    leaveRequests,
    submitLeaveRequest,
    approveLeaveRequest,
    rejectLeaveRequest,
    clarifyLeaveRequest,
  } = useAppContext();

  const role = currentUser?.role || 'owner';
  const empId = currentUser?.employeeId || 'CW-E101';

  const [activeTab, setActiveTab] = useState<'my-leave' | 'approvals'>(
    role === 'employee' ? 'my-leave' : 'approvals'
  );

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [leaveType, setLeaveType] = useState<LeaveRequest['leaveType']>('Paid Time Off');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isPartialDay, setIsPartialDay] = useState(false);
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Approver Action State
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'clarify' | null>(null);
  const [actionNote, setActionNote] = useState('');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const userBalances = leaveBalances[empId] || [];

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!startDate) { setFormError('Start date is required.'); return; }
    if (!endDate) { setFormError('End date is required.'); return; }
    if (new Date(endDate) < new Date(startDate)) {
      setFormError('End date cannot be earlier than start date.');
      return;
    }
    if (!reason.trim()) { setFormError('Reason is required.'); return; }
    if (isPartialDay && startDate !== endDate) {
      setFormError('Partial-day option is available only for a single-day request.');
      return;
    }

    // Calculate days count
    const diffTime = Math.abs(new Date(endDate).getTime() - new Date(startDate).getTime());
    const daysCount = isPartialDay ? 0.5 : Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Check balance warning
    const currentBal = userBalances.find((b) => b.type === leaveType);
    if (currentBal && daysCount > currentBal.availableDays) {
      if (!window.confirm(`Warning: Requested ${daysCount} day(s) exceeds your available prototype balance of ${currentBal.availableDays} day(s). Proceed anyway as unpaid?`)) {
        return;
      }
    }

    submitLeaveRequest({
      leaveType,
      startDate,
      endDate,
      daysCount,
      isPartialDay,
      reason,
    });

    setShowApplyModal(false);
    setStartDate('');
    setEndDate('');
    setIsPartialDay(false);
    setReason('');
    triggerToast('Leave request submitted! Manager has been notified for coverage check.');
  };

  const handleActionConfirm = () => {
    if (!selectedRequest) return;
    if (actionType === 'approve') {
      approveLeaveRequest(selectedRequest.id, actionNote);
      triggerToast(`Approved leave for ${selectedRequest.employeeName}. Team calendar updated.`);
    } else if (actionType === 'reject') {
      rejectLeaveRequest(selectedRequest.id, actionNote);
      triggerToast(`Rejected leave request for ${selectedRequest.employeeName}.`);
    } else if (actionType === 'clarify') {
      clarifyLeaveRequest(selectedRequest.id, actionNote);
      triggerToast(`Clarification request sent to ${selectedRequest.employeeName}.`);
    }
    setActionType(null);
    setActionNote('');
    setSelectedRequest(null);
  };

  // Filter requests
  const myRequests = leaveRequests.filter((r) => r.employeeId === empId);
  const pendingApprovals = leaveRequests.filter((r) => r.status === 'Pending' || r.status === 'Clarification Requested');

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-teal-800 text-white text-xs font-semibold py-3 px-4 rounded-xl shadow-lg flex items-center gap-2 border border-teal-600 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-teal-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave & Time Off Portal</h1>
          <p className="text-sm text-gray-500 mt-1">
            {role === 'employee'
              ? 'Self-service PTO requests, sick leave balances, and team coverage calendar'
              : 'Supervisor time-off review, shift impact diagnostics, and organization leave calendar'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowApplyModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Apply for Time Off</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs (if Manager or Owner) */}
      {role !== 'employee' && (
        <div className="flex border-b border-gray-200 gap-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('approvals')}
            className={`pb-3 transition-colors border-b-2 ${
              activeTab === 'approvals'
                ? 'border-teal-600 text-teal-800'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            Leave Approvals Inbox ({pendingApprovals.length})
          </button>
          <button
            onClick={() => setActiveTab('my-leave')}
            className={`pb-3 transition-colors border-b-2 ${
              activeTab === 'my-leave'
                ? 'border-teal-600 text-teal-800'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            Team Calendar & My Balances
          </button>
        </div>
      )}

      {/* Balances Banner (Self-Service View) */}
      {(role === 'employee' || activeTab === 'my-leave') && (
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Available Prototype Balances</h3>
              <span className="text-[11px] text-gray-400">Policy: Clean Wave Standard Full-Time</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {userBalances.map((bal) => (
                <div key={bal.type} className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs">
                  <span className="text-[11px] font-semibold text-gray-500 block truncate">{bal.type}</span>
                  <p className="text-2xl font-bold text-teal-700 mt-1">
                    {bal.availableDays} <span className="text-xs font-normal text-gray-500">days</span>
                  </p>
                  <div className="mt-2 text-[11px] text-gray-400 flex justify-between">
                    <span>Used: {bal.usedDays}d</span>
                    <span>Pending: {bal.pendingDays}d</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Employee Request History Table */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">My Leave Requests & History</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase">
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">Dates</th>
                    <th className="py-2 px-3 text-right">Days</th>
                    <th className="py-2 px-3">Reason</th>
                    <th className="py-2 px-3">Submitted</th>
                    <th className="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {myRequests.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50/80">
                      <td className="py-3 px-3 font-semibold text-gray-900">{r.leaveType}</td>
                      <td className="py-3 px-3 text-gray-700 font-medium">
                        {r.startDate} to {r.endDate}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-gray-800">{r.daysCount}d</td>
                      <td className="py-3 px-3 text-gray-600 max-w-xs truncate">{r.reason}</td>
                      <td className="py-3 px-3 text-gray-400">{r.submittedDate}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            r.status === 'Approved'
                              ? 'bg-green-100 text-green-700'
                              : r.status === 'Rejected'
                              ? 'bg-red-100 text-red-700'
                              : r.status === 'Clarification Requested'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Manager Approvals Tab */}
      {role !== 'employee' && activeTab === 'approvals' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Leave Approvals & Coverage Review</h3>
              <p className="text-xs text-gray-500">
                Review shift impact and approve or return time-off requests
              </p>
            </div>
            <span className="text-xs text-gray-500">{pendingApprovals.length} pending review</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase">
                  <th className="py-2.5 px-3">Associate</th>
                  <th className="py-2.5 px-3">Leave Type</th>
                  <th className="py-2.5 px-3">Requested Window</th>
                  <th className="py-2.5 px-3">Days</th>
                  <th className="py-2.5 px-3">Coverage Impact</th>
                  <th className="py-2.5 px-3">Reason</th>
                  <th className="py-2.5 px-3 text-right">Decisions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {pendingApprovals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400">
                      No pending leave requests in your approval inbox.
                    </td>
                  </tr>
                ) : (
                  pendingApprovals.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-semibold text-gray-900 block">{req.employeeName}</span>
                        <span className="text-[11px] text-gray-400">{req.locationName}</span>
                      </td>
                      <td className="py-3 px-3 font-medium text-teal-800">{req.leaveType}</td>
                      <td className="py-3 px-3 text-gray-700">
                        {req.startDate} – {req.endDate}
                      </td>
                      <td className="py-3 px-3 font-bold text-gray-900">{req.daysCount}d</td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            req.coverageImpact === 'High Risk'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          <AlertTriangle className="w-3 h-3" />
                          {req.coverageImpact}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-gray-600 max-w-xs truncate">{req.reason}</td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedRequest(req);
                              setActionType('approve');
                            }}
                            className="px-2.5 py-1 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-md"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRequest(req);
                              setActionType('reject');
                            }}
                            className="px-2.5 py-1 text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-md"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRequest(req);
                              setActionType('clarify');
                            }}
                            className="px-2.5 py-1 text-xs font-semibold bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-md"
                          >
                            Clarify
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Apply for Leave Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900">Apply for Time Off</h3>
              <button
                onClick={() => setShowApplyModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleApplySubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Leave Type</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as any)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 outline-teal-600 bg-white"
                >
                  <option value="Paid Time Off">Paid Time Off (PTO)</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Emergency Leave">Emergency Leave</option>
                  <option value="Unpaid Leave">Unpaid Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2.5 outline-teal-600"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2.5 outline-teal-600"
                    required
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isPartialDay}
                  onChange={(e) => setIsPartialDay(e.target.checked)}
                  className="w-3.5 h-3.5 text-teal-600 accent-teal-600 rounded"
                />
                <span className="text-gray-700 font-medium">Partial day request (half-day · 4 hours)</span>
              </label>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Reason for Leave</label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Medical appointment, family event..."
                  className="w-full border border-gray-300 rounded-lg p-2.5 outline-teal-600"
                  required
                ></textarea>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-400 text-center">
                Optional attachment placeholder (Doctor's note, appointment slip)
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-3.5 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg shadow-xs"
                >
                  Submit Leave Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approver Action Modal */}
      {selectedRequest && actionType && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-md w-full p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-1">
              {actionType === 'approve'
                ? 'Approve Time Off Request'
                : actionType === 'reject'
                ? 'Reject Leave Request'
                : 'Request Clarification on Leave'}
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              {selectedRequest.employeeName} ({selectedRequest.leaveType} · {selectedRequest.daysCount} day)
            </p>

            <textarea
              rows={3}
              value={actionNote}
              onChange={(e) => setActionNote(e.target.value)}
              placeholder={
                actionType === 'approve'
                  ? 'Optional supervisor note (e.g. Approved. Cover shift assigned)...'
                  : actionType === 'reject'
                  ? 'Reason for declining leave (required)...'
                  : 'Specify clarification needed...'
              }
              className="w-full text-xs border border-gray-300 rounded-lg p-2.5 outline-teal-600"
              required={actionType !== 'approve'}
            ></textarea>

            <div className="mt-4 flex justify-end gap-2 text-xs">
              <button
                onClick={() => { setSelectedRequest(null); setActionType(null); setActionNote(''); }}
                className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleActionConfirm}
                disabled={actionType !== 'approve' && !actionNote.trim()}
                className={`px-4 py-1.5 font-bold text-white rounded-lg disabled:opacity-50 ${
                  actionType === 'approve'
                    ? 'bg-teal-600 hover:bg-teal-700'
                    : actionType === 'reject'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                Confirm {actionType.toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// @ts-nocheck — verbatim local-preview code from LaundryAI - Copy.zip.
