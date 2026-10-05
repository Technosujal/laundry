// @ts-nocheck
import { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { locations } from '../../data/dashboardData';
import {
  Calendar,
  Clock,
  UserCheck,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Plus,
  Send,
  ArrowRight,
  Shield,
  HelpCircle,
  X,
} from 'lucide-react';
import type { ShiftAssignment } from '../../data/workforceData';

export default function Scheduling() {
  const {
    currentUser,
    schedules,
    employeeDirectory,
    assignShift,
    markShiftOpen,
    publishSchedule,
  } = useAppContext();

  const role = currentUser?.role || 'owner';

  const [selectedLocation, setSelectedLocation] = useState('loc-1');
  const [viewMode, setViewMode] = useState<'weekly' | 'daily'>('weekly');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Assign modal state
  const [activeShiftId, setActiveShiftId] = useState<string | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

  // Employee shift-swap request modal
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [swapReason, setSwapReason] = useState('');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handlePublish = () => {
    publishSchedule();
    triggerToast('Weekly schedule published! Notifications sent to all rostered personnel.');
  };

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShiftId || !selectedEmployeeId) return;

    const emp = employeeDirectory.find((e) => e.employeeId === selectedEmployeeId);
    if (!emp) return;

    assignShift(activeShiftId, emp.employeeId, emp.name);
    triggerToast(`Assigned ${emp.name} to shift.`);
    setActiveShiftId(null);
    setSelectedEmployeeId('');
  };

  const handleEmployeeAcknowledge = (shiftId: string) => {
    triggerToast('Schedule acknowledged! Supervisor notified.');
  };

  const handleEmployeeSwapRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSwapModal(false);
    triggerToast('Shift change request submitted to your Store Manager.');
    setSwapReason('');
  };

  // Filter schedules
  const filteredSchedules = schedules.filter((s) => {
    if (role === 'employee') {
      // Employee sees their own shifts, plus open shifts if viewing
      return s.assignedEmployeeId === currentUser?.employeeId || s.isOpen;
    }
    return s.locationId === selectedLocation;
  });

  const openCount = schedules.filter((s) => s.isOpen).length;
  const conflictCount = schedules.filter((s) => s.conflictWarning || s.isOvertimeRisk).length;

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
          <h1 className="text-2xl font-bold text-gray-900">Shift Scheduling & Roster</h1>
          <p className="text-sm text-gray-500 mt-1">
            {role === 'employee'
              ? 'View your published stations, acknowledge assignments, or request shift swaps'
              : 'Weekly station allocation, coverage validation, conflict alerts, and roster publishing'}
          </p>
        </div>

        {role !== 'employee' ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handlePublish}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Publish Schedule</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowSwapModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-gray-50 text-teal-700 text-xs font-bold rounded-lg border border-teal-300 shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <span>Request Shift Change</span>
          </button>
        )}
      </div>

      {/* Filter and Mode Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          {role !== 'employee' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 font-medium">Location:</span>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="text-xs font-semibold text-gray-900 bg-gray-50 border border-gray-200 rounded-lg py-1.5 px-2.5 outline-teal-600 cursor-pointer"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                viewMode === 'weekly' ? 'bg-white text-teal-800 shadow-2xs' : 'text-gray-600'
              }`}
            >
              Weekly Grid
            </button>
            <button
              onClick={() => setViewMode('daily')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                viewMode === 'daily' ? 'bg-white text-teal-800 shadow-2xs' : 'text-gray-600'
              }`}
            >
              Daily Roster
            </button>
          </div>
        </div>

        {/* Diagnostic Badges */}
        <div className="flex items-center gap-2 text-xs">
          {openCount > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 font-semibold border border-purple-200">
              {openCount} Open Shift(s)
            </span>
          )}
          {conflictCount > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-semibold border border-amber-200 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{conflictCount} Scheduling Alerts</span>
            </span>
          )}
        </div>
      </div>

      {/* Shifts Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSchedules.map((shift) => (
          <div
            key={shift.id}
            className={`p-5 rounded-xl border flex flex-col justify-between transition-all ${
              shift.isOpen
                ? 'bg-purple-50/40 border-purple-200'
                : shift.conflictWarning || shift.isOvertimeRisk
                ? 'bg-amber-50/30 border-amber-200'
                : 'bg-white border-gray-200'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  {shift.day} · {shift.date}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    shift.isOpen
                      ? 'bg-purple-600 text-white'
                      : 'bg-teal-100 text-teal-800'
                  }`}
                >
                  {shift.isOpen ? 'Open Position' : 'Assigned'}
                </span>
              </div>

              <h3 className="text-sm font-bold text-gray-900">{shift.shiftTitle}</h3>
              <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span>{shift.timeRange}</span>
              </p>

              {/* Assignment Details */}
              <div className="mt-3 p-3 bg-gray-50/80 rounded-lg text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-400">Station Role:</span>
                  <span className="font-semibold text-gray-700">{shift.roleRequired}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Assigned Team Member:</span>
                  <strong className="text-gray-900">
                    {shift.assignedEmployeeName || 'Unassigned (Open)'}
                  </strong>
                </div>
              </div>

              {/* Warnings */}
              {shift.conflictWarning && (
                <div className="mt-2 p-2 bg-amber-100/70 border border-amber-200 rounded text-[11px] text-amber-900 flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>{shift.conflictWarning}</span>
                </div>
              )}
              {shift.isOvertimeRisk && (
                <div className="mt-2 p-2 bg-red-100/70 border border-red-200 rounded text-[11px] text-red-900 flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                  <span>Overtime Risk: Contractor hours exceed 38 hrs this week.</span>
                </div>
              )}
            </div>

            {/* Actions for Manager vs Employee */}
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
              {role !== 'employee' ? (
                <>
                  {shift.isOpen ? (
                    <button
                      onClick={() => setActiveShiftId(shift.id)}
                      className="w-full py-1.5 px-3 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Assign Candidate</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => markShiftOpen(shift.id)}
                      className="text-xs text-red-600 hover:text-red-800 font-medium cursor-pointer"
                    >
                      Mark Shift Open
                    </button>
                  )}
                </>
              ) : (
                <>
                  {!shift.isOpen && (
                    <button
                      onClick={() => handleEmployeeAcknowledge(shift.id)}
                      className="w-full py-1.5 px-3 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                      <span>Acknowledge Shift</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Assign Shift Modal for Manager */}
      {activeShiftId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900">Assign Candidate to Shift</h3>
              <button
                onClick={() => setActiveShiftId(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssign} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Select Available Associate</label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2.5 outline-teal-600 bg-white"
                  required
                >
                  <option value="">-- Choose Candidate --</option>
                  {employeeDirectory
                    .filter((e) => e.status === 'Active')
                    .map((emp) => (
                      <option key={emp.employeeId} value={emp.employeeId}>
                        {emp.name} ({emp.role} · {emp.employmentType})
                      </option>
                    ))}
                </select>
              </div>

              <div className="p-3 bg-teal-50 rounded-lg border border-teal-200 text-teal-800 text-[11px]">
                Deterministic scheduler verifies associate qualifications and prevents overlapping shift hours.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveShiftId(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedEmployeeId}
                  className="px-4 py-1.5 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employee Shift Swap Request Modal */}
      {showSwapModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900">Request Shift Change</h3>
              <button
                onClick={() => setShowSwapModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEmployeeSwapRequest} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Target Shift to Swap</label>
                <select className="w-full text-xs border border-gray-300 rounded-lg p-2.5 outline-teal-600 bg-white">
                  <option>Mon, Sep 15 · Morning Production Lead (8:00 AM – 4:00 PM)</option>
                  <option>Tue, Sep 16 · Counter Intake (8:00 AM – 4:00 PM)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Reason for Request</label>
                <textarea
                  rows={3}
                  value={swapReason}
                  onChange={(e) => setSwapReason(e.target.value)}
                  placeholder="Explain scheduling conflict..."
                  className="w-full text-xs border border-gray-300 rounded-lg p-2.5 outline-teal-600"
                  required
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSwapModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-lg"
                >
                  Submit Swap Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
// @ts-nocheck — verbatim local-preview code from LaundryAI - Copy.zip.
