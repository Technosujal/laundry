// @ts-nocheck
import React, { useState } from 'react';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  RotateCcw,
  X,
  History,
  Eye,
  Check,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Calendar,
  AlertCircle,
  Building2,
  User,
  ShieldCheck,
} from 'lucide-react';
import { useTimesheets, type TimesheetListItem } from '../../hooks/useTimesheets';
import Avatar from '../../components/workforce/Avatar';
import type { TimesheetDayRecord } from '../../data/workforceData';

export default function Timesheets() {
  const {
    period,
    setPeriod,
    search,
    setSearch,
    locationFilter,
    setLocationFilter,
    statusFilter,
    setStatusFilter,
    exceptionsOnly,
    setExceptionsOnly,
    selectedPayPeriod,
    setSelectedPayPeriod,
    availablePeriods,
    timesheetList,
    selectedTimesheetId,
    setSelectedTimesheetId,
    selectedTimesheetItem,
    groupedWeeklyRecords,
    nextEmployee,
    prevEmployee,
    hasNext,
    hasPrev,
    metrics,
    approveTimesheet,
    returnTimesheet,
    submitTimesheet,
    locations,
    role,
  } = useTimesheets();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [returnModal, setReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState('');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleApprove = (id: string) => {
    approveTimesheet(id);
    triggerToast('Timesheet approved and finalized for pay period closing.');
  };

  const handleReturn = () => {
    if (!selectedTimesheetItem || !returnReason.trim()) return;
    returnTimesheet(selectedTimesheetItem.id, returnReason);
    triggerToast(`Timesheet returned for correction to ${selectedTimesheetItem.employeeName}.`);
    setReturnModal(false);
    setReturnReason('');
  };

  const handleSubmit = (id: string) => {
    submitTimesheet(id);
    triggerToast('Timesheet submitted to Store Operations Manager.');
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-teal-900 text-white text-xs font-semibold py-3 px-4 rounded-xl shadow-xl flex items-center gap-2 border border-teal-700 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-teal-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Return for Correction Modal */}
      {returnModal && selectedTimesheetItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-bold text-gray-900">Return Timesheet for Correction</h3>
              </div>
              <button
                onClick={() => setReturnModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Please specify the reason for return (e.g. missing clock-out punch, unauthorized overtime, or date discrepancy) for{' '}
              <strong>{selectedTimesheetItem.employeeName}</strong>:
            </p>

            <textarea
              rows={3}
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              placeholder="e.g. Please clarify missing clock-out punch for Thursday Sep 11 afternoon shift..."
              className="w-full text-xs p-3 border border-gray-300 rounded-xl outline-teal-600"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setReturnModal(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleReturn}
                disabled={!returnReason.trim()}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-40 rounded-lg transition-colors cursor-pointer"
              >
                Confirm Return
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Timesheets & Hours Review</h1>
          <p className="text-sm text-gray-500 mt-1">
            Workforce timesheet management: Regular hours, overtime variance, punch audit exceptions, and manager approvals
          </p>
        </div>

        {/* Period Selector & Pay Period Switcher */}
        <div className="flex items-center gap-3">
          <div className="bg-gray-100 p-1 rounded-xl flex items-center shadow-inner">
            {(['Week', 'Month'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  period === p
                    ? 'bg-white text-teal-700 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {p}ly View
              </button>
            ))}
          </div>

          <select
            value={selectedPayPeriod}
            onChange={(e) => setSelectedPayPeriod(e.target.value)}
            className="text-xs font-bold bg-white border border-gray-300 rounded-xl px-3 py-2 outline-teal-600 text-gray-800 shadow-2xs cursor-pointer"
          >
            {availablePeriods.map((pp) => (
              <option key={pp} value={pp}>
                {pp}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Submitted for Review</span>
          <p className="text-2xl font-bold text-teal-700 mt-1">{metrics.totalSubmitted}</p>
          <span className="text-xs text-gray-400">Awaiting supervisor sign-off</span>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Approved & Finalized</span>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{metrics.totalApproved}</p>
          <span className="text-xs text-gray-400">Locked for payroll cycle</span>
        </div>
        <div className="bg-white rounded-xl border border-rose-200 p-4 shadow-2xs bg-rose-50/20">
          <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Returned for Correction</span>
          <p className="text-2xl font-bold text-rose-700 mt-1">{metrics.totalReturned}</p>
          <span className="text-xs text-rose-600 font-medium">Pending staff revision</span>
        </div>
        <div className="bg-white rounded-xl border border-amber-200 p-4 shadow-2xs bg-amber-50/20">
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Timesheet Exceptions</span>
          <p className="text-2xl font-bold text-amber-700 mt-1">{metrics.totalExceptions}</p>
          <span className="text-xs text-amber-600 font-medium">OT / Missing punches flagged</span>
        </div>
      </div>

      {/* VIEW A: LIST VIEW (When no individual drill-down is active) */}
      {!selectedTimesheetId && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative min-w-[220px]">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search employee name or ID..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-xl outline-teal-600 bg-white"
                />
              </div>

              {role !== 'employee' && (
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="text-xs font-semibold border border-gray-300 rounded-xl px-3 py-2 outline-teal-600 bg-white"
                >
                  <option value="all">All Locations</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              )}

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs font-semibold border border-gray-300 rounded-xl px-3 py-2 outline-teal-600 bg-white"
              >
                <option value="all">All Approval Statuses</option>
                <option value="Submitted">Submitted</option>
                <option value="Approved">Approved</option>
                <option value="Returned for Correction">Returned for Correction</option>
                <option value="Draft">Draft</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setExceptionsOnly(!exceptionsOnly)}
              className={`px-3 py-2 text-xs font-bold rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                exceptionsOnly
                  ? 'bg-amber-50 border-amber-300 text-amber-900 ring-2 ring-amber-400/30'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${exceptionsOnly ? 'text-amber-600' : 'text-gray-400'}`} />
              <span>Exceptions Only</span>
              {exceptionsOnly && <Check className="w-3.5 h-3.5 text-amber-600" />}
            </button>
          </div>

          {/* Timesheets Roster Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  {period}ly Timesheet Master Registry ({selectedPayPeriod})
                </h3>
                <p className="text-xs text-gray-500">
                  Click on any employee row to drill into daily punch logs, week-by-week hours, and supervisor approvals
                </p>
              </div>
              <span className="text-xs font-bold text-gray-500 bg-white px-2.5 py-1 rounded-lg border border-gray-200">
                {timesheetList.length} timesheets
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-[10px] tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3">Associate</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-3 py-3 text-center">Sched (h)</th>
                    <th className="px-3 py-3 text-center">Regular (h)</th>
                    <th className="px-3 py-3 text-center">OT (h)</th>
                    <th className="px-3 py-3 text-center">Break (h)</th>
                    <th className="px-3 py-3 text-center">Total (h)</th>
                    <th className="px-3 py-3 text-center">Variance</th>
                    <th className="px-3 py-3 text-center">Exceptions</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {timesheetList.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-4 py-12 text-center text-gray-400 italic">
                        No timesheets matching your search or filter criteria.
                      </td>
                    </tr>
                  ) : (
                    timesheetList.map((item) => (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedTimesheetId(item.id)}
                        className="hover:bg-teal-50/20 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar
                              src={item.photoUrl}
                              name={item.employeeName}
                              employeeId={item.employeeId}
                              size="sm"
                            />
                            <div>
                              <div className="font-semibold text-gray-900">{item.employeeName}</div>
                              <div className="text-[10px] text-gray-400 font-mono">
                                {item.employeeId} • {item.role}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700 font-medium whitespace-nowrap">
                          {item.locationName}
                        </td>
                        <td className="px-3 py-3 text-center text-gray-600 font-medium">
                          {item.scheduledHours.toFixed(1)}h
                        </td>
                        <td className="px-3 py-3 text-center font-bold text-gray-900">
                          {item.regularHours.toFixed(1)}h
                        </td>
                        <td className="px-3 py-3 text-center font-bold">
                          <span className={item.overtimeHours > 0 ? 'text-amber-700' : 'text-gray-400'}>
                            {item.overtimeHours > 0 ? `${item.overtimeHours.toFixed(1)}h` : '0h'}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center text-gray-600">
                          {item.breakHours > 0 ? `${item.breakHours}h` : '0h'}
                        </td>
                        <td className="px-3 py-3 text-center font-extrabold text-gray-900 text-sm">
                          {item.totalHours.toFixed(1)}h
                        </td>
                        <td className="px-3 py-3 text-center font-bold">
                          <span className={item.varianceHours >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                            {item.varianceHours > 0 ? `+${item.varianceHours}` : item.varianceHours}h
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          {item.exceptionCount > 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              {item.exceptionCount} flag
                            </span>
                          ) : (
                            <span className="text-gray-300 text-xs">0</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              item.status === 'Approved'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : item.status === 'Submitted'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : item.status === 'Returned for Correction'
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : 'bg-gray-100 text-gray-700 border border-gray-200'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTimesheetId(item.id);
                            }}
                            className="text-teal-700 hover:text-teal-900 font-semibold inline-flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Audit</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW B: INDIVIDUAL EMPLOYEE TIMESHEET DRILL-DOWN */}
      {selectedTimesheetId && selectedTimesheetItem && (
        <div className="space-y-6">
          {/* Back & Employee Navigation Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
            <button
              onClick={() => setSelectedTimesheetId(null)}
              className="inline-flex items-center gap-2 text-xs font-bold text-teal-700 hover:text-teal-900 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Master Timesheet List</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-medium">Navigate Associates:</span>
              <button
                onClick={prevEmployee}
                disabled={!hasPrev}
                className="p-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40 text-gray-700 flex items-center gap-1 text-xs font-semibold cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
              <button
                onClick={nextEmployee}
                disabled={!hasNext}
                className="p-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40 text-gray-700 flex items-center gap-1 text-xs font-semibold cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Hero Profile Card */}
          <div className="p-6 bg-gradient-to-br from-teal-50/70 via-white to-cyan-50/40 rounded-2xl border border-teal-200 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <Avatar
                src={selectedTimesheetItem.photoUrl}
                name={selectedTimesheetItem.employeeName}
                employeeId={selectedTimesheetItem.employeeId}
                size="xl"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900">{selectedTimesheetItem.employeeName}</h2>
                  <span
                    className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                      selectedTimesheetItem.status === 'Approved'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : selectedTimesheetItem.status === 'Submitted'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : selectedTimesheetItem.status === 'Returned for Correction'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : 'bg-gray-100 text-gray-700 border border-gray-200'
                    }`}
                  >
                    {selectedTimesheetItem.status}
                  </span>
                </div>
                <p className="text-xs text-teal-900 font-semibold mt-0.5">
                  {selectedTimesheetItem.role} • {selectedTimesheetItem.employmentType}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                  <span>Facility: <strong>{selectedTimesheetItem.locationName}</strong></span>
                  <span>•</span>
                  <span>Pay Period: <strong>{selectedTimesheetItem.payPeriod}</strong></span>
                  <span>•</span>
                  <span>ID: <strong className="font-mono">{selectedTimesheetItem.employeeId}</strong></span>
                </div>
              </div>
            </div>

            {/* Quick Metrics & Approval Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-2.5 bg-white rounded-xl border border-gray-200 shadow-2xs">
                  <span className="text-[10px] uppercase text-gray-400 font-bold block">Regular</span>
                  <span className="text-base font-bold text-gray-900">{selectedTimesheetItem.regularHours}h</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-gray-200 shadow-2xs">
                  <span className="text-[10px] uppercase text-gray-400 font-bold block">Overtime</span>
                  <span className="text-base font-bold text-teal-700">{selectedTimesheetItem.overtimeHours}h</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-gray-200 shadow-2xs">
                  <span className="text-[10px] uppercase text-gray-400 font-bold block">Total</span>
                  <span className="text-base font-bold text-gray-900">{selectedTimesheetItem.totalHours}h</span>
                </div>
              </div>

              {/* State Machine Actions */}
              <div className="flex flex-wrap items-center gap-2">
                {selectedTimesheetItem.status === 'Submitted' && (
                  <>
                    <button
                      onClick={() => handleApprove(selectedTimesheetItem.id)}
                      className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve Timesheet</span>
                    </button>
                    <button
                      onClick={() => setReturnModal(true)}
                      className="px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Return for Correction</span>
                    </button>
                  </>
                )}

                {selectedTimesheetItem.status === 'Draft' && (
                  <button
                    onClick={() => handleSubmit(selectedTimesheetItem.id)}
                    className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Submit Timesheet</span>
                  </button>
                )}

                {selectedTimesheetItem.status === 'Approved' && (
                  <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-100/70 border border-emerald-300 text-emerald-900 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>Approved & Locked</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Correction Note Alert Banner if returned */}
          {selectedTimesheetItem.correctionNotes && (
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-900 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold text-sm block">Returned for Correction Note:</strong>
                <p className="mt-1 leading-relaxed">{selectedTimesheetItem.correctionNotes}</p>
              </div>
            </div>
          )}

          {/* Detailed Daily Breakdown Table (Split into Week 1 and Week 2) */}
          <div className="space-y-6">
            {/* Week 1 */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-3.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase text-gray-700 tracking-wider">
                  Pay Period Week 1 (Sep 1 – Sep 5)
                </h4>
                <span className="text-xs text-gray-500 font-medium">5 Working Days</span>
              </div>
              <TimesheetTable records={groupedWeeklyRecords.week1} />
            </div>

            {/* Week 2 */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-3.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase text-gray-700 tracking-wider">
                  Pay Period Week 2 (Sep 8 – Sep 14)
                </h4>
                <span className="text-xs text-gray-500 font-medium">Shift & Weekend Punches</span>
              </div>
              <TimesheetTable records={groupedWeeklyRecords.week2} />
            </div>
          </div>

          {/* Audit History Timeline */}
          {selectedTimesheetItem.timesheet.timeline && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs space-y-3">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-teal-600" />
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Audit History & Signature Log
                </h4>
              </div>
              <div className="space-y-2">
                {selectedTimesheetItem.timesheet.timeline.map((entry, idx) => (
                  <div key={idx} className="flex items-start justify-between text-xs py-1.5 border-b border-gray-50">
                    <div>
                      <span className="font-semibold text-gray-900">{entry.action}</span>
                      <span className="text-gray-500 ml-2">by {entry.actor}</span>
                    </div>
                    <span className="text-[11px] text-gray-400 font-mono">{entry.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TimesheetTable({ records }: { records: TimesheetDayRecord[] }) {
  if (records.length === 0) {
    return <div className="p-6 text-center text-xs text-gray-400 italic">No shift entries recorded for this week.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="bg-gray-50/50 text-gray-500 uppercase text-[10px] font-semibold tracking-wider border-b border-gray-100">
          <tr>
            <th className="px-4 py-2.5">Date & Day</th>
            <th className="px-4 py-2.5">Clock In</th>
            <th className="px-4 py-2.5">Clock Out</th>
            <th className="px-4 py-2.5 text-center">Break</th>
            <th className="px-4 py-2.5 text-center">Total (h)</th>
            <th className="px-4 py-2.5">Audit Flags & Notes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {records.map((r, i) => (
            <tr key={i} className={`hover:bg-gray-50 transition-colors ${r.hasException ? 'bg-amber-50/30' : ''}`}>
              <td className="px-4 py-2.5 font-medium text-gray-900">
                {r.date} ({r.day})
              </td>
              <td className="px-4 py-2.5 font-semibold text-gray-800">
                {r.clockIn}
              </td>
              <td className="px-4 py-2.5 font-semibold text-gray-800">
                {r.clockOut}
              </td>
              <td className="px-4 py-2.5 text-center text-gray-600">
                {r.breakMin > 0 ? `${r.breakMin}m` : '—'}
              </td>
              <td className="px-4 py-2.5 text-center font-bold text-gray-900">
                {r.totalHours.toFixed(1)}h
              </td>
              <td className="px-4 py-2.5">
                {r.hasException ? (
                  <span className="inline-flex items-center gap-1.5 text-amber-800 font-semibold bg-amber-100/80 px-2 py-0.5 rounded text-[11px] border border-amber-200">
                    <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                    <span>{r.exceptionNote || 'Exception Flagged'}</span>
                  </span>
                ) : (
                  <span className="text-gray-400 text-[11px]">Regular Shift Punch</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
// @ts-nocheck — verbatim local-preview code from LaundryAI - Copy.zip.
