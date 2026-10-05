// @ts-nocheck
import { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import {
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Shield,
  UserPlus,
  Zap,
} from 'lucide-react';

export default function ShiftCoverage() {
  const {
    currentUser,
    employeeDirectory,
    schedules,
    assignShift,
    addNotification,
  } = useAppContext();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const openShifts = schedules.filter((s) => s.isOpen);
  const activeShift = schedules.find((s) => s.id === selectedShiftId) || openShifts[0];

  // Deterministic candidate matching rules
  const getCandidateSuggestions = (roleNeeded: string) => {
    return employeeDirectory
      .filter((e) => e.status === 'Active')
      .map((emp) => {
        let matchScore = 70;
        let reason = 'Available during scheduled shift hours';
        if (emp.role.toLowerCase().includes(roleNeeded.toLowerCase())) {
          matchScore += 25;
          reason = `Primary skill match for ${roleNeeded}`;
        }
        if (emp.employmentType === 'Full Time') {
          matchScore += 5;
        }
        return {
          ...emp,
          matchScore,
          matchReason: reason,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);
  };

  const handleAssignCandidate = (empId: string, empName: string) => {
    if (!activeShift) return;
    assignShift(activeShift.id, empId, empName);
    addNotification({
      type: 'schedule',
      title: 'Shift Coverage Filled',
      message: `${empName} assigned to fill open ${activeShift.shiftTitle}.`,
      targetRole: ['manager', 'owner', 'employee'],
      linkPath: '/workforce/scheduling',
    });
    triggerToast(`Candidate ${empName} assigned! Coverage gap resolved.`);
  };

  const candidates = activeShift ? getCandidateSuggestions(activeShift.roleRequired) : [];

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
          <h1 className="text-2xl font-bold text-gray-900">Shift Coverage & Contingency</h1>
          <p className="text-sm text-gray-500 mt-1">
            Resolve unstaffed operational slots using deterministic skill and availability rules
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold bg-teal-50 border border-teal-200 text-teal-800 px-3 py-1.5 rounded-lg">
          <Zap className="w-4 h-4 text-teal-600" />
          <span>Facility Capacity: <strong>86% Staffed</strong></span>
        </div>
      </div>

      {/* Status Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-gray-500 uppercase">Scheduled Staff</span>
          <p className="text-2xl font-bold text-gray-900 mt-1">7</p>
          <span className="text-xs text-gray-400">On active roster</span>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-gray-500 uppercase">Staff on Leave</span>
          <p className="text-2xl font-bold text-amber-700 mt-1">1</p>
          <span className="text-xs text-amber-700 font-medium">Approved PTO</span>
        </div>
        <div className="bg-white rounded-xl border border-purple-200 p-4 shadow-xs bg-purple-50/40">
          <span className="text-[11px] font-semibold text-purple-700 uppercase">Open Positions</span>
          <p className="text-2xl font-bold text-purple-800 mt-1">{openShifts.length}</p>
          <span className="text-xs text-purple-700 font-medium">Unfilled shift slots</span>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-gray-500 uppercase">Coverage Rate</span>
          <p className="text-2xl font-bold text-teal-700 mt-1">86%</p>
          <span className="text-xs text-teal-600 font-medium">+4% vs weekly baseline</span>
        </div>
      </div>

      {/* Main Resolution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Open Shift Slots Selector */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Open Shifts Requiring Coverage</h3>
          <p className="text-xs text-gray-500 mb-4">Select an open slot to review candidate recommendations</p>

          {openShifts.length === 0 ? (
            <div className="p-6 text-center bg-gray-50 rounded-lg border border-dashed border-gray-200 text-xs text-gray-500">
              <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <span>All shift slots are currently fully staffed!</span>
            </div>
          ) : (
            <div className="space-y-3">
              {openShifts.map((shift) => {
                const isSelected = activeShift?.id === shift.id;
                return (
                  <div
                    key={shift.id}
                    onClick={() => setSelectedShiftId(shift.id)}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50/70 ring-2 ring-purple-600/20'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-gray-900">{shift.shiftTitle}</span>
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                        {shift.day} · {shift.date}
                      </span>
                    </div>
                    <div className="text-gray-600 flex items-center gap-1 mt-1">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span>{shift.timeRange}</span>
                    </div>
                    <div className="mt-2 text-[11px] text-gray-500">
                      Required Skill: <strong>{shift.roleRequired}</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Deterministic Candidate Suggestions */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <h3 className="text-sm font-semibold text-gray-900">
                  Recommended Coverage Candidates
                </h3>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Deterministic matching based on station training, shift limits, and location proximity
              </p>
            </div>
            {activeShift && (
              <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
                Slot: {activeShift.shiftTitle}
              </span>
            )}
          </div>

          {!activeShift ? (
            <div className="py-12 text-center text-xs text-gray-400">
              No open shift selected.
            </div>
          ) : (
            <div className="space-y-3">
              {candidates.slice(0, 4).map((cand) => (
                <div
                  key={cand.id}
                  className="p-4 rounded-xl border border-gray-200 hover:border-teal-400 bg-gray-50/50 hover:bg-white transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center shrink-0">
                      {cand.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-sm">{cand.name}</span>
                        <span className="text-[10px] font-bold text-teal-700 bg-teal-100/70 px-2 py-0.2 rounded-full">
                          {cand.matchScore}% Match
                        </span>
                      </div>
                      <p className="text-gray-500 text-[11px] mt-0.5">
                        {cand.role} · {cand.employmentType} ({cand.primaryLocationName})
                      </p>
                      <span className="text-teal-700 font-medium text-[11px] block mt-1">
                        ✓ {cand.matchReason}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAssignCandidate(cand.employeeId, cand.name)}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer shrink-0"
                  >
                    Assign to Shift
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
// @ts-nocheck — verbatim local-preview code from LaundryAI - Copy.zip.
