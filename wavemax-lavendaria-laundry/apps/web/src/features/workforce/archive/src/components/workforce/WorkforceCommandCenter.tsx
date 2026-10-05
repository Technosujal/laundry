// @ts-nocheck
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, ArrowRight, CheckCircle2, AlertCircle, Coffee, ShieldAlert } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import Avatar from './Avatar';

export default function WorkforceCommandCenter() {
  const { attendanceRecords, schedules, employeeDirectory } = useAppContext();
  const [rosterFilter, setRosterFilter] = useState<'All' | 'Working' | 'On Break' | 'Clocked Out' | 'Late' | 'Absent'>('All');

  // 1. LIVE ROSTER LOGIC
  const filteredRoster = attendanceRecords.filter(a => {
    if (rosterFilter === 'All') return true;
    if (rosterFilter === 'Working') return a.status === 'Clocked In';
    if (rosterFilter === 'On Break') return a.status === 'On Break';
    if (rosterFilter === 'Clocked Out') return a.status === 'Clocked Out';
    if (rosterFilter === 'Late') return a.status === 'Late';
    if (rosterFilter === 'Absent') return a.status === 'Absent';
    return true;
  });

  // 2. STAFFING POSITION LOGIC
  const currentlyAvailable = attendanceRecords.filter(a => a.status === 'Clocked In' || a.status === 'On Break').length;
  const requiredToday = 10; // Deterministic baseline for Springfield hub
  const gap = Math.max(0, requiredToday - currentlyAvailable);

  // Helper for initials
  const getInitials = (name?: string) => {
    if (!name) return 'CW';
    return name
      .split(' ')
      .filter(Boolean)
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'CW';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* LEFT: Live Roster (Spans 2 cols) */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col justify-between">
        <div>
          <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900">Live Workforce Roster</h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                  Live Feed
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">Real-time attendance, scheduled shifts, clock times, and active hours</p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {(['All', 'Working', 'On Break', 'Clocked Out', 'Late', 'Absent'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setRosterFilter(f)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                    rosterFilter === f
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 text-gray-500 font-semibold uppercase text-[10px] tracking-wider border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Scheduled Shift</th>
                  <th className="px-4 py-3">Clock In</th>
                  <th className="px-4 py-3">Clock Out</th>
                  <th className="px-4 py-3">Break</th>
                  <th className="px-4 py-3">Hours</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRoster.map((record) => {
                  const emp = employeeDirectory.find(e => e.id === record.employeeId);
                  const scheduledShift = record.scheduledShift || emp?.currentShift || '08:00 AM – 04:00 PM';
                  
                  // Compute display for clock-out:
                  // If Clocked Out -> actual clockOutTime
                  // If Clocked In / On Break / Late -> "Sched: [end of shift]"
                  // If Absent -> em dash
                  let clockOutDisplay = '—';
                  if (record.clockOutTime) {
                    clockOutDisplay = record.clockOutTime;
                  } else if (record.status === 'Clocked In' || record.status === 'On Break' || record.status === 'Late') {
                    const parts = scheduledShift.split('–');
                    const schedEnd = parts[1]?.trim() || '';
                    clockOutDisplay = schedEnd ? `Sched: ${schedEnd}` : 'In progress';
                  }

                  const displayName = record.employeeName || (record as any).name || 'Staff Member';

                  return (
                    <tr key={record.id} className="hover:bg-teal-50/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar
                            src={emp?.photoUrl}
                            name={displayName}
                            employeeId={record.employeeId}
                            size="sm"
                            showStatus
                            status={record.status as any}
                          />
                          <div>
                            <div className="font-semibold text-gray-900 leading-tight">{displayName}</div>
                            <div className="text-[10px] text-gray-400">{record.employeeId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 font-medium whitespace-nowrap">
                        {scheduledShift}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800 whitespace-nowrap">
                        {record.clockInTime || '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={record.clockOutTime ? 'font-semibold text-gray-900' : 'text-gray-400 italic text-[11px]'}>
                          {clockOutDisplay}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                        {record.breakDurationMinutes > 0 ? (
                          <span className="inline-flex items-center gap-1 font-medium">
                            <Coffee className="w-3 h-3 text-amber-500" />
                            {record.breakDurationMinutes}m
                          </span>
                        ) : (
                          '0m'
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-bold text-gray-900">
                        {record.totalHoursWorked > 0 ? `${record.totalHoursWorked.toFixed(1)}h` : '0h'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          record.status === 'Clocked In'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : record.status === 'On Break'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : record.status === 'Clocked Out'
                            ? 'bg-gray-100 text-gray-700 border border-gray-200'
                            : record.status === 'Late'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            record.status === 'Clocked In' ? 'bg-emerald-500' :
                            record.status === 'On Break' ? 'bg-blue-500' :
                            record.status === 'Clocked Out' ? 'bg-gray-400' :
                            record.status === 'Late' ? 'bg-amber-500' : 'bg-rose-500'
                          }`} />
                          {record.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <Link
                          to="/workforce/attendance"
                          className="text-teal-600 hover:text-teal-800 font-semibold inline-flex items-center gap-1 text-xs hover:underline"
                        >
                          Review <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {filteredRoster.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-400 italic">
                      No staff records found matching filter "{rosterFilter}".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>Showing {filteredRoster.length} active shift entries</span>
          <Link to="/workforce/attendance" className="font-semibold text-teal-700 hover:underline flex items-center gap-1">
            Open Full Attendance Console <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* RIGHT: Staffing Position */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900">Current Staffing Position</h3>
            <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
              Springfield Hub
            </span>
          </div>

          <div className="space-y-3.5">
            <div className="flex justify-between items-center p-3.5 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-xs text-gray-600 font-medium">Required Staff (Target)</span>
              <span className="text-xl font-bold text-gray-900">{requiredToday}</span>
            </div>
            <div className="flex justify-between items-center p-3.5 bg-teal-50/50 rounded-xl border border-teal-100">
              <span className="text-xs text-teal-800 font-medium">Currently On Floor / Available</span>
              <span className="text-xl font-bold text-teal-700">{currentlyAvailable}</span>
            </div>
            <div className={`flex justify-between items-center p-3.5 rounded-xl border ${
              gap > 0 ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'
            }`}>
              <div className="flex items-center gap-2">
                {gap > 0 ? <AlertCircle className="w-4 h-4 text-rose-600" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                <span className={`text-xs font-semibold ${gap > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>Staffing Gap</span>
              </div>
              <span className={`text-base font-bold ${gap > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                {gap === 0 ? 'Optimal Coverage' : `${gap} Staff Short`}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-gray-100 space-y-2">
          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Fast Operational Actions</h4>
          <div className="grid grid-cols-1 gap-2">
            <Link
              to="/workforce/attendance"
              className="p-2.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:border-teal-500 hover:text-teal-700 hover:bg-teal-50/30 transition-all flex items-center justify-between group shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400 group-hover:text-teal-600" />
                <span>Live Attendance Punch Console</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              to="/workforce/shift-coverage"
              className="p-2.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:border-teal-500 hover:text-teal-700 hover:bg-teal-50/30 transition-all flex items-center justify-between group shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-500 group-hover:text-teal-600" />
                <span>Fill Open Shifts & Request Coverage</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              to="/workforce/scheduling"
              className="p-2.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:border-teal-500 hover:text-teal-700 hover:bg-teal-50/30 transition-all flex items-center justify-between group shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400 group-hover:text-teal-600" />
                <span>Publish Schedule Adjustments</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
// @ts-nocheck — verbatim local-preview code from LaundryAI - Copy.zip.
