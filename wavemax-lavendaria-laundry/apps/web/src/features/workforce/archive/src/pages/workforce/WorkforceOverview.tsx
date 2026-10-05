// @ts-nocheck
import { Link } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import {
  Users,
  Clock,
  Calendar,
  AlertTriangle,
  UserCheck,
  UserX,
  FileCheck,
  UserPlus,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default function WorkforceOverview() {
  const {
    currentUser,
    employeeDirectory,
    attendanceRecords,
    leaveRequests,
    registrations,
    schedules,
  } = useAppContext();

  const role = currentUser?.role || 'owner';
  const userLocs = currentUser?.locationIds || [];

  // Filter scoped to user role
  const scopedDirectory = employeeDirectory.filter((e) =>
    role === 'owner' ? true : userLocs.includes(e.primaryLocationId)
  );

  const scopedAttendance = attendanceRecords.filter((a) =>
    role === 'owner' ? true : userLocs.includes(a.locationId)
  );

  const scopedLeave = leaveRequests.filter((l) =>
    role === 'owner' ? true : userLocs.includes(l.locationId)
  );

  const scopedSchedules = schedules.filter((s) =>
    role === 'owner' ? true : userLocs.includes(s.locationId)
  );

  const scopedRegistrations = registrations.filter((r) => {
    if (role === 'owner') return true;
    return r.requestedLocationIds.some((id) => userLocs.includes(id));
  });

  // Calculate KPIs
  const activeCount = scopedDirectory.filter((e) => e.status === 'Active').length;
  const onShiftCount = scopedAttendance.filter((a) => a.status === 'Clocked In' || a.status === 'On Break').length;
  const absentCount = scopedAttendance.filter((a) => a.status === 'Absent' || a.status === 'Late').length;
  const onLeaveCount = scopedDirectory.filter((e) => e.status === 'On Leave').length;
  const openShiftsCount = scopedSchedules.filter((s) => s.isOpen).length;
  const pendingLeaveCount = scopedLeave.filter((l) => l.status === 'Pending').length;
  const pendingRegCount = scopedRegistrations.filter((r) => r.status === 'Pending Approval').length;
  const exceptionsCount = scopedAttendance.filter((a) => a.status === 'Late' || a.status === 'Missed Punch').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workforce Overview</h1>
          <p className="text-sm text-gray-500 mt-1">
            {role === 'owner'
              ? 'Organization-wide headcount, shift execution, and labor capacity diagnostics'
              : 'Assigned facility workforce operations, live attendance, and daily shift status'}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-600 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>Scope: <strong>{role === 'owner' ? 'All Pilot Locations (Org-Wide)' : 'Assigned Store Hub'}</strong></span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Active Staff</span>
            <Users className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{activeCount}</p>
          <span className="text-xs text-gray-400">Total rostered employees</span>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Currently On Shift</span>
            <UserCheck className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-700 mt-2">{onShiftCount}</p>
          <span className="text-xs text-green-600 font-medium">Clocked in at stations</span>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">On Leave / Absent</span>
            <UserX className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-2">{onLeaveCount + absentCount}</p>
          <span className="text-xs text-amber-700 font-medium">{absentCount} late/absent today</span>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Open Shifts</span>
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-purple-700 mt-2">{openShiftsCount}</p>
          <span className="text-xs text-purple-600 font-medium">Require candidate assignment</span>
        </div>
      </div>

      {/* Action Queue Banners: Pending Registrations & Leave */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/workforce/registrations"
          className="p-4 bg-white rounded-xl border border-gray-200 hover:border-teal-400 hover:shadow-md transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900 group-hover:text-teal-900">
                Pending Registrations ({pendingRegCount})
              </h4>
              <p className="text-xs text-gray-500">Applicant credential verification & review queue</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          to="/workforce/leave"
          className="p-4 bg-white rounded-xl border border-gray-200 hover:border-teal-400 hover:shadow-md transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900 group-hover:text-teal-900">
                Pending Leave Requests ({pendingLeaveCount})
              </h4>
              <p className="text-xs text-gray-500">Time-off approvals & shift impact checks</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Grid: Staffing Coverage by Shift & Today's Workforce Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shift Coverage breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Staffing Coverage by Shift</h3>
              <p className="text-xs text-gray-500">Current schedule fulfillment across operating windows</p>
            </div>
            <Link to="/workforce/shift-coverage" className="text-xs text-teal-700 font-semibold hover:underline">
              Coverage Board →
            </Link>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-between">
              <div>
                <strong className="text-gray-900 block">Morning Shift (7:30 AM – 3:30 PM)</strong>
                <span className="text-gray-500">Production line, commercial washers, counter intake</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-green-100 text-green-700">
                100% Covered (4/4)
              </span>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-between">
              <div>
                <strong className="text-gray-900 block">Afternoon Shift (12:00 PM – 6:00 PM)</strong>
                <span className="text-gray-500">Dryer unload, folding station, quality check</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                75% Covered (3/4)
              </span>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-between">
              <div>
                <strong className="text-gray-900 block">Evening Closing Shift (3:00 PM – 9:30 PM)</strong>
                <span className="text-gray-500">Late intake, customer pickup, sanitization cycle</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700">
                50% Covered (1/2) · Solo Risk
              </span>
            </div>
          </div>
        </div>

        {/* Today's Workforce Alerts & Exceptions */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Today's Workforce Exceptions</h3>
              <p className="text-xs text-gray-500">Punctuality alerts, coverage risks, and attendance flags</p>
            </div>
            <Link to="/workforce/attendance" className="text-xs text-teal-700 font-semibold hover:underline">
              Live Board →
            </Link>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-red-900 block">Alex Turner (Contractor Driver) Late</strong>
                <span className="text-red-700 text-[11px]">
                  Clock-in expected at 9:00 AM; clocked in at 9:20 AM (+20m delay). Pickup route rescheduled.
                </span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-900 block">Evening Solo Shift Risk (Dinees Patel)</strong>
                <span className="text-amber-700 text-[11px]">
                  Only 1 team member assigned after 6:00 PM. Recommend extending contractor Hilda's shift.
                </span>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-blue-900 block">Upcoming Scheduled PTO (Anna Kowalski)</strong>
                <span className="text-blue-700 text-[11px]">
                  Sep 18 (1 day). Substitute coverage suggested via Mary Jensen.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
// @ts-nocheck — verbatim local-preview code from LaundryAI - Copy.zip.
