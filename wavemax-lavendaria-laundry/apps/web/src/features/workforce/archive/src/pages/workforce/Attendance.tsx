// @ts-nocheck
import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import {
  Clock,
  CheckCircle2,
  Coffee,
  Square,
  Play,
  Users,
  Search,
  Download,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
  Filter,
  Check,
  Eye,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { useAttendance, type WeeklyDayCell } from '../../hooks/useAttendance';
import Avatar from '../../components/workforce/Avatar';
import type { AttendancePunch } from '../../data/workforceData';

export default function Attendance() {
  const {
    currentUser,
    currentPunchStatus,
    clockIn,
    startBreak,
    endBreak,
    clockOut,
  } = useAppContext();

  const role = currentUser?.role || 'owner';

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
    selectedWeekOffset,
    setSelectedWeekOffset,
    selectedMonthOffset,
    setSelectedMonthOffset,
    weekDays,
    liveRecords,
    weeklyRows,
    monthlyRows,
    summaryMetrics,
    handleExport,
    locations,
  } = useAttendance();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedPunch, setSelectedPunch] = useState<AttendancePunch | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleClockIn = () => {
    clockIn('Wash & Fold Production Line 1');
    triggerToast('Clocked in. Shift timer initiated.');
  };

  const handleStartBreak = () => {
    startBreak();
    triggerToast('Break started. Enjoy your rest period.');
  };

  const handleEndBreak = () => {
    endBreak();
    triggerToast('Break ended. Shift resumed.');
  };

  const handleClockOut = () => {
    clockOut();
    triggerToast('Clocked out. Shift hours saved to your timesheet.');
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

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance & Punctuality Operations</h1>
          <p className="text-sm text-gray-500 mt-1">
            Official time and attendance records: Live punch clock, 7-day weekly roster, and monthly attendance rates
          </p>
        </div>

        {/* Global Action: Period Switcher & Export */}
        <div className="flex items-center gap-3">
          <div className="bg-gray-100 p-1 rounded-xl flex items-center shadow-inner">
            {(['Live', 'Week', 'Month'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  period === p
                    ? 'bg-white text-teal-700 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {p} View
              </button>
            ))}
          </div>

          <button
            onClick={handleExport}
            className="px-3.5 py-2 text-xs font-bold text-teal-700 hover:text-teal-900 bg-white border border-gray-300 hover:border-teal-400 rounded-xl shadow-2xs flex items-center gap-2 transition-all cursor-pointer"
            title="Download formatted Excel workbook (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Export Excel</span>
          </button>
        </div>
      </div>

      {/* Employee Digital Punch Clock Console (Preserved Self-Service Console) */}
      <div className="bg-white rounded-2xl border border-teal-200 p-5 shadow-xs bg-gradient-to-r from-teal-50/50 via-white to-teal-50/20">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-100/60 px-2 py-0.5 rounded-full">
                Active Station Punch
              </span>
              <span
                className={`text-xs font-bold uppercase px-2.5 py-0.5 rounded-full ${
                  currentPunchStatus.status === 'Clocked In'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : currentPunchStatus.status === 'On Break'
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}
              >
                {currentPunchStatus.status}
              </span>
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              {currentUser?.name || 'Anita Ramirez'} · Direct Punch Terminal
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 pt-0.5">
              <span>Clock In: <strong>{currentPunchStatus.clockInTime || '—'}</strong></span>
              <span>Break Time: <strong>{currentPunchStatus.totalBreakMinutes} mins</strong></span>
              <span>Assigned Shift: <strong>08:00 AM – 04:00 PM</strong></span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleClockIn}
              disabled={currentPunchStatus.status !== 'Clocked Out'}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Clock In</span>
            </button>

            <button
              onClick={handleStartBreak}
              disabled={currentPunchStatus.status !== 'Clocked In'}
              className="px-4 py-2 bg-amber-50 hover:bg-amber-100 disabled:opacity-40 text-amber-900 border border-amber-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>Start Break</span>
            </button>

            <button
              onClick={handleEndBreak}
              disabled={currentPunchStatus.status !== 'On Break'}
              className="px-4 py-2 bg-blue-50 hover:bg-blue-100 disabled:opacity-40 text-blue-900 border border-blue-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>End Break</span>
            </button>

            <button
              onClick={handleClockOut}
              disabled={currentPunchStatus.status === 'Clocked Out'}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 disabled:opacity-40 text-rose-800 border border-rose-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Clock Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Overview Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Clocked In (Active)</span>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{summaryMetrics.clockedIn}</p>
          <span className="text-xs text-gray-400">On shift floor</span>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">On Break</span>
          <p className="text-2xl font-bold text-blue-700 mt-1">{summaryMetrics.onBreak}</p>
          <span className="text-xs text-gray-400">Rest & meal break</span>
        </div>
        <div className="bg-white rounded-xl border border-amber-200 p-4 shadow-2xs bg-amber-50/20">
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Late Arrivals</span>
          <p className="text-2xl font-bold text-amber-700 mt-1">{summaryMetrics.late}</p>
          <span className="text-xs text-amber-600 font-medium">Tardy punches flagged</span>
        </div>
        <div className="bg-white rounded-xl border border-rose-200 p-4 shadow-2xs bg-rose-50/20">
          <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Unexcused Absences</span>
          <p className="text-2xl font-bold text-rose-700 mt-1">{summaryMetrics.absent}</p>
          <span className="text-xs text-rose-600 font-medium">No clock-in recorded</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search associate name or ID..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-xl outline-teal-600 bg-white"
            />
          </div>

          {/* Location Scoping */}
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

          {/* Status Filter (Live view) */}
          {period === 'Live' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-semibold border border-gray-300 rounded-xl px-3 py-2 outline-teal-600 bg-white"
            >
              <option value="all">All Punch Statuses</option>
              <option value="Clocked In">Clocked In</option>
              <option value="On Break">On Break</option>
              <option value="Clocked Out">Clocked Out</option>
              <option value="Late">Late</option>
              <option value="Absent">Absent</option>
            </select>
          )}
        </div>

        {/* Exceptions Only Toggle */}
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

      {/* VIEW 1: LIVE ATTENDANCE ROSTER */}
      {period === 'Live' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gray-50/50">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Live Attendance Roster — Today (Sep 14, 2026)</h3>
              <p className="text-xs text-gray-500">
                Official shift punches, scheduled vs actual clock times, break tracking, and recorded hours
              </p>
            </div>
            <span className="text-xs font-bold text-gray-500 bg-white px-2.5 py-1 rounded-lg border border-gray-200">
              {liveRecords.length} associates active
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-[10px] tracking-wider border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3">Associate</th>
                  <th className="px-4 py-3">Scheduled Shift</th>
                  <th className="px-4 py-3">Clock In</th>
                  <th className="px-4 py-3">Clock Out</th>
                  <th className="px-4 py-3">Break Duration</th>
                  <th className="px-4 py-3">Hours Worked</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {liveRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-gray-400 italic">
                      No attendance records found for current search/filter settings.
                    </td>
                  </tr>
                ) : (
                  liveRecords.map((rec) => {
                    const scheduled = rec.scheduledShift || '08:00 AM – 04:00 PM';
                    let clockOut = '—';
                    if (rec.clockOutTime) {
                      clockOut = rec.clockOutTime;
                    } else if (rec.status === 'Clocked In' || rec.status === 'On Break' || rec.status === 'Late') {
                      const parts = scheduled.split('–');
                      clockOut = parts[1]?.trim() ? `Sched: ${parts[1].trim()}` : 'In progress';
                    }

                    return (
                      <tr
                        key={rec.id}
                        onClick={() => setSelectedPunch(rec)}
                        className="hover:bg-teal-50/20 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar
                              name={rec.employeeName}
                              employeeId={rec.employeeId}
                              size="sm"
                              showStatus
                              status={rec.status as any}
                            />
                            <div>
                              <div className="font-semibold text-gray-900">{rec.employeeName}</div>
                              <div className="text-[10px] text-gray-400 font-mono">{rec.employeeId}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700 font-medium whitespace-nowrap">
                          {scheduled}
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">
                          {rec.clockInTime || '—'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={rec.clockOutTime ? 'font-semibold text-gray-900' : 'text-gray-400 italic text-[11px]'}>
                            {clockOut}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                          {rec.breakDurationMinutes > 0 ? `${rec.breakDurationMinutes}m` : '0m'}
                        </td>
                        <td className="px-4 py-3 font-bold text-gray-900 whitespace-nowrap">
                          {rec.totalHoursWorked > 0 ? `${rec.totalHoursWorked.toFixed(1)}h` : '0h'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            rec.status === 'Clocked In'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : rec.status === 'On Break'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : rec.status === 'Clocked Out'
                              ? 'bg-gray-100 text-gray-700 border border-gray-200'
                              : rec.status === 'Late'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              rec.status === 'Clocked In' ? 'bg-emerald-500' :
                              rec.status === 'On Break' ? 'bg-blue-500' :
                              rec.status === 'Clocked Out' ? 'bg-gray-400' :
                              rec.status === 'Late' ? 'bg-amber-500' : 'bg-rose-500'
                            }`} />
                            {rec.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPunch(rec);
                            }}
                            className="text-teal-700 hover:text-teal-900 font-semibold inline-flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: WEEKLY ATTENDANCE MATRIX */}
      {period === 'Week' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden space-y-4">
          {/* Week Navigation Header */}
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSelectedWeekOffset(selectedWeekOffset - 1)}
                  className="p-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-gray-700"
                  title="Previous week"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedWeekOffset(selectedWeekOffset + 1)}
                  disabled={selectedWeekOffset >= 0}
                  className="p-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40 text-gray-700"
                  title="Next week"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  Week: Mon Sep 8 – Sun Sep 14, 2026 {selectedWeekOffset === 0 && '(Current Pay Period)'}
                </h3>
                <p className="text-xs text-gray-500">Employee-by-day attendance punch tracking and scheduled variance</p>
              </div>
            </div>

            {selectedWeekOffset !== 0 && (
              <button
                onClick={() => setSelectedWeekOffset(0)}
                className="text-xs font-semibold text-teal-700 hover:underline"
              >
                Return to This Week
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-[10px] tracking-wider border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 min-w-[180px]">Associate</th>
                  {weekDays.map((wd) => (
                    <th key={wd.dayName} className="px-2.5 py-3 text-center min-w-[95px]">
                      <div>{wd.dayName}</div>
                      <div className="text-[9px] text-gray-400 font-normal">{wd.shortDate}</div>
                    </th>
                  ))}
                  <th className="px-3 py-3 text-center min-w-[80px]">Sched</th>
                  <th className="px-3 py-3 text-center min-w-[80px]">Actual</th>
                  <th className="px-3 py-3 text-center min-w-[80px]">Variance</th>
                  <th className="px-3 py-3 text-center min-w-[80px]">Flags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {weeklyRows.map((row) => (
                  <tr key={row.employee.id} className="hover:bg-teal-50/10 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          src={row.employee.photoUrl}
                          name={row.employee.name}
                          employeeId={row.employee.employeeId}
                          size="sm"
                        />
                        <div>
                          <div className="font-semibold text-gray-900">{row.employee.name}</div>
                          <div className="text-[10px] text-gray-400 font-mono">{row.employee.employeeId}</div>
                        </div>
                      </div>
                    </td>

                    {/* Mon-Sun Day Cells */}
                    {row.days.map((d: WeeklyDayCell, idx: number) => {
                      const hasRecord = !!d.record;
                      return (
                        <td key={idx} className="px-2 py-2 text-center">
                          {hasRecord ? (
                            <button
                              type="button"
                              onClick={() => setSelectedPunch(d.record!)}
                              className={`w-full p-1.5 rounded-lg border text-[10px] font-semibold transition-all hover:scale-105 cursor-pointer ${
                                d.hasException
                                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                                  : d.status === 'Clocked In'
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                                  : 'bg-gray-50 border-gray-200 text-gray-700'
                              }`}
                            >
                              <div className="truncate font-bold">{d.totalHoursWorked ? `${d.totalHoursWorked}h` : '0h'}</div>
                              <div className="text-[9px] truncate opacity-75">{d.status}</div>
                            </button>
                          ) : (
                            <span className="text-gray-300 text-[11px] select-none">—</span>
                          )}
                        </td>
                      );
                    })}

                    <td className="px-3 py-3 text-center font-medium text-gray-600">
                      {row.scheduledHours}h
                    </td>
                    <td className="px-3 py-3 text-center font-bold text-gray-900">
                      {row.actualHours}h
                    </td>
                    <td className="px-3 py-3 text-center font-bold">
                      <span className={row.varianceHours >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                        {row.varianceHours > 0 ? `+${row.varianceHours}` : row.varianceHours}h
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      {row.exceptionsCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          {row.exceptionsCount} flag
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: MONTHLY ATTENDANCE SUMMARY */}
      {period === 'Month' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden space-y-4">
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSelectedMonthOffset(selectedMonthOffset - 1)}
                  className="p-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-gray-700"
                  title="Previous month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedMonthOffset(selectedMonthOffset + 1)}
                  disabled={selectedMonthOffset >= 0}
                  className="p-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40 text-gray-700"
                  title="Next month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  Month: September 2026 (Operational Period)
                </h3>
                <p className="text-xs text-gray-500">Monthly aggregate attendance, punctuality records, and attendance compliance rates</p>
              </div>
            </div>

            <div className="text-xs text-gray-500">
              Target monthly working days: <strong>22 Days (176.0h)</strong>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-[10px] tracking-wider border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3">Associate</th>
                  <th className="px-3 py-3 text-center">Sched Days</th>
                  <th className="px-3 py-3 text-center">Present</th>
                  <th className="px-3 py-3 text-center">Late</th>
                  <th className="px-3 py-3 text-center">Absent</th>
                  <th className="px-3 py-3 text-center">On Leave</th>
                  <th className="px-3 py-3 text-center">Sched (h)</th>
                  <th className="px-3 py-3 text-center">Actual (h)</th>
                  <th className="px-3 py-3 text-center">Variance</th>
                  <th className="px-3 py-3 text-center">Rate (%)</th>
                  <th className="px-4 py-3 text-right">Drill-Down</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {monthlyRows.map((row) => (
                  <tr key={row.employee.id} className="hover:bg-teal-50/10 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          src={row.employee.photoUrl}
                          name={row.employee.name}
                          employeeId={row.employee.employeeId}
                          size="sm"
                        />
                        <div>
                          <div className="font-semibold text-gray-900">{row.employee.name}</div>
                          <div className="text-[10px] text-gray-400 font-mono">{row.employee.employeeId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center text-gray-600 font-medium">
                      {row.scheduledDays}
                    </td>
                    <td className="px-3 py-3 text-center font-bold text-emerald-700">
                      {row.presentDays}
                    </td>
                    <td className="px-3 py-3 text-center font-bold text-amber-700">
                      {row.lateDays > 0 ? row.lateDays : '0'}
                    </td>
                    <td className="px-3 py-3 text-center font-bold text-rose-700">
                      {row.absentDays > 0 ? row.absentDays : '0'}
                    </td>
                    <td className="px-3 py-3 text-center text-gray-600">
                      {row.leaveDays > 0 ? `${row.leaveDays}d` : '—'}
                    </td>
                    <td className="px-3 py-3 text-center font-medium text-gray-600">
                      {row.scheduledHours}h
                    </td>
                    <td className="px-3 py-3 text-center font-bold text-gray-900">
                      {row.actualHours}h
                    </td>
                    <td className="px-3 py-3 text-center font-bold">
                      <span className={row.varianceHours >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                        {row.varianceHours > 0 ? `+${row.varianceHours}` : row.varianceHours}h
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        row.attendanceRate >= 95
                          ? 'bg-emerald-100 text-emerald-800'
                          : row.attendanceRate >= 85
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {row.attendanceRate}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          if (row.dailyRecords.length > 0) {
                            setSelectedPunch(row.dailyRecords[0]);
                          }
                        }}
                        className="text-teal-700 hover:text-teal-900 font-semibold inline-flex items-center gap-1 hover:underline"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Logs</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Attendance Detail Drawer */}
      {selectedPunch && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex justify-end">
          <div className="bg-white w-full max-w-md h-full p-6 shadow-2xl overflow-y-auto flex flex-col justify-between animate-fadeIn">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-teal-600" />
                  <h3 className="text-base font-bold text-gray-900">Attendance Punch Record</h3>
                </div>
                <button
                  onClick={() => setSelectedPunch(null)}
                  className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Employee Summary Card */}
              <div className="p-4 bg-teal-50/60 rounded-xl border border-teal-200/70 flex items-center gap-3">
                <Avatar
                  name={selectedPunch.employeeName}
                  employeeId={selectedPunch.employeeId}
                  size="lg"
                  showStatus
                  status={selectedPunch.status as any}
                />
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{selectedPunch.employeeName}</h4>
                  <p className="text-xs text-teal-800 font-mono">ID: {selectedPunch.employeeId}</p>
                  <span className="text-[10px] font-bold text-gray-500 uppercase mt-0.5 block">
                    {selectedPunch.date}
                  </span>
                </div>
              </div>

              {/* Status and Shift info */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">Shift Status</span>
                  <span className={`inline-block font-bold mt-1 px-2 py-0.5 rounded text-[11px] ${
                    selectedPunch.status === 'Clocked In'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selectedPunch.status === 'Late'
                      ? 'bg-amber-100 text-amber-800'
                      : selectedPunch.status === 'Absent'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {selectedPunch.status}
                  </span>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">Total Hours Worked</span>
                  <span className="text-base font-bold text-gray-900 block mt-0.5">
                    {selectedPunch.totalHoursWorked.toFixed(1)}h
                  </span>
                </div>
              </div>

              {/* Time Breakdown */}
              <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-200 space-y-3 text-xs">
                <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider">
                  Detailed Punch Timestamps
                </span>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1 border-b border-gray-200/60">
                    <span className="text-gray-600 font-medium">Scheduled Shift:</span>
                    <strong className="text-gray-900">{selectedPunch.scheduledShift || '08:00 AM – 04:00 PM'}</strong>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-gray-200/60">
                    <span className="text-gray-600 font-medium">Recorded Clock In:</span>
                    <strong className="text-gray-900">{selectedPunch.clockInTime || '—'}</strong>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-gray-200/60">
                    <span className="text-gray-600 font-medium">Recorded Clock Out:</span>
                    <strong className="text-gray-900">{selectedPunch.clockOutTime || 'Shift in progress'}</strong>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-gray-600 font-medium">Rest & Meal Break:</span>
                    <strong className="text-gray-900">{selectedPunch.breakDurationMinutes} minutes</strong>
                  </div>
                </div>
              </div>

              {/* Operational exception notes if any */}
              {selectedPunch.status === 'Late' && (
                <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold block">Punctuality Exception Flagged</strong>
                    <p className="mt-0.5 text-[11px] leading-relaxed">
                      Clock-in occurred after the grace period. Shift supervisor was notified to adjust initial intake routing.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedPunch(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// @ts-nocheck — verbatim local-preview code from LaundryAI - Copy.zip.
