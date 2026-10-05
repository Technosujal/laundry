// @ts-nocheck
import { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { locations } from '../data/dashboardData';
import type {
  CriticalEvent,
  DayActivity,
  ScheduleDayDetail,
  PendingActionItem,
  AwarenessEvent,
} from '../types/workforce';
import type { LeaveRequest } from '../data/workforceData';

export function useWorkforceHome() {
  const {
    employeeDirectory,
    attendanceRecords,
    schedules,
    leaveRequests,
    timesheets,
    registrations,
    role,
    currentUser,
  } = useAppContext();

  // Scoped locations based on role
  const isManager = role === 'manager';
  const effectiveLocationId = isManager ? (currentUser?.locationIds?.[0] || 'loc-1') : undefined;

  const filteredEmployees = useMemo(() => {
    if (!effectiveLocationId) return employeeDirectory;
    return employeeDirectory.filter(e => e.primaryLocationId === effectiveLocationId);
  }, [employeeDirectory, effectiveLocationId]);

  const filteredAttendance = useMemo(() => {
    if (!effectiveLocationId) return attendanceRecords;
    return attendanceRecords.filter(a => a.locationId === effectiveLocationId);
  }, [attendanceRecords, effectiveLocationId]);

  const filteredSchedules = useMemo(() => {
    if (!effectiveLocationId) return schedules;
    return schedules.filter(s => s.locationId === effectiveLocationId);
  }, [schedules, effectiveLocationId]);

  const filteredLeave = useMemo(() => {
    if (!effectiveLocationId) return leaveRequests;
    return leaveRequests.filter(l => l.locationId === effectiveLocationId);
  }, [leaveRequests, effectiveLocationId]);

  // Metrics
  const metrics = useMemo(() => {
    const activeTeam = filteredEmployees.filter(e => e.status === 'Active').length;
    const onShift = filteredAttendance.filter(a => a.status === 'Clocked In' || a.status === 'On Break').length;
    const onLeave = filteredEmployees.filter(e => e.status === 'On Leave').length;
    const openShifts = filteredSchedules.filter(s => s.isOpen).length;
    const pendingLeave = filteredLeave.filter(l => l.status === 'Pending').length;
    const exceptions = filteredAttendance.filter(a => a.status === 'Late' || a.status === 'Missed Punch' || a.status === 'Absent').length;

    return { activeTeam, onShift, onLeave, openShifts, pendingLeave, exceptions };
  }, [filteredEmployees, filteredAttendance, filteredSchedules, filteredLeave]);

  // Critical Events (Derived deterministically)
  const criticalEvents = useMemo<CriticalEvent[]>(() => {
    const list: CriticalEvent[] = [];

    // 1. Open shifts (immediate coverage gap)
    filteredSchedules.filter(s => s.isOpen).forEach(s => {
      list.push({
        id: `crit-open-${s.id}`,
        severity: 'Critical',
        title: `Uncovered Shift: ${s.shiftTitle}`,
        category: 'Shift Shortage',
        locationName: s.locationName,
        locationId: s.locationId,
        scheduledTime: `${s.day}, ${s.date} • ${s.timeRange}`,
        timeRemaining: 'Starts in 14h',
        operationalImpact: `Zero coverage for ${s.roleRequired}; risks intake backlogs`,
        recommendedAction: 'Assign available operator or dispatch contractor',
        actionUrl: '/workforce/shift-coverage',
        timestamp: 'Immediate Attention',
      });
    });

    // 2. Attendance Exceptions (Absent, Late, Missed Punches)
    filteredAttendance.forEach(att => {
      if (att.status === 'Absent') {
        list.push({
          id: `crit-att-${att.id}`,
          severity: 'Critical',
          title: `Unexcused Absence: ${att.employeeName}`,
          category: 'Attendance Exception',
          employeeName: att.employeeName,
          employeeId: att.employeeId,
          locationName: locations.find(l => l.id === att.locationId)?.name || 'Springfield Hub',
          locationId: att.locationId,
          scheduledTime: att.scheduledShift || '08:00 AM – 04:00 PM',
          timeRemaining: 'Shift underway',
          operationalImpact: `Station "${att.currentAssignment}" unmanned; work re-routed`,
          recommendedAction: 'Call employee or request standby replacement',
          actionUrl: '/workforce/attendance',
          timestamp: 'Today',
        });
      } else if (att.status === 'Late') {
        list.push({
          id: `crit-att-${att.id}`,
          severity: 'Attention',
          title: `Tardy Arrival: ${att.employeeName} (${att.clockInTime})`,
          category: 'Attendance Exception',
          employeeName: att.employeeName,
          employeeId: att.employeeId,
          locationName: locations.find(l => l.id === att.locationId)?.name || 'Springfield Hub',
          locationId: att.locationId,
          scheduledTime: att.scheduledShift || '08:30 AM – 04:30 PM',
          timeRemaining: 'Under observation',
          operationalImpact: 'Route departure delayed 50 mins; staging stacked',
          recommendedAction: 'Review punch note and confirm route adjustments',
          actionUrl: '/workforce/attendance',
          timestamp: 'Today',
        });
      }
    });

    // 3. High/Moderate impact pending leave
    filteredLeave.filter((l: LeaveRequest) => l.status === 'Pending').forEach((l: LeaveRequest) => {
      list.push({
        id: `crit-leave-${l.id}`,
        severity: l.coverageImpact === 'High Risk' ? 'Critical' : 'Attention',
        title: `Pending Leave: ${l.employeeName} (${l.leaveType})`,
        category: 'Leave Coverage',
        employeeName: l.employeeName,
        employeeId: l.employeeId,
        locationName: l.locationName,
        locationId: l.locationId,
        scheduledTime: `${l.startDate} to ${l.endDate}`,
        timeRemaining: 'Waiting 2 days',
        operationalImpact: l.conflictsNote || 'Cross-station coverage conflict with scheduled shifts',
        recommendedAction: 'Evaluate substitute coverage and approve or request reschedule',
        actionUrl: '/workforce/leave',
        timestamp: l.submittedDate,
      });
    });

    // 4. Solo shift / Overtime risk warning
    filteredSchedules.filter(s => s.conflictWarning || s.isOvertimeRisk).forEach(s => {
      list.push({
        id: `crit-conflict-${s.id}`,
        severity: 'Attention',
        title: s.isOvertimeRisk ? `Overtime Risk: ${s.assignedEmployeeName}` : `Staffing Risk: ${s.shiftTitle}`,
        category: 'Compliance',
        employeeName: s.assignedEmployeeName,
        employeeId: s.assignedEmployeeId,
        locationName: s.locationName,
        locationId: s.locationId,
        scheduledTime: `${s.day}, ${s.date} • ${s.timeRange}`,
        timeRemaining: 'Upcoming shift',
        operationalImpact: s.conflictWarning || 'Projected hours exceed 40 hrs/wk threshold by 3.5 hrs',
        recommendedAction: 'Reassign portion of shift to part-time associate',
        actionUrl: '/workforce/scheduling',
        timestamp: 'Upcoming',
      });
    });

    // 5. Pending registrations exceeding wait threshold
    const pendingRegs = registrations.filter(r => r.status === 'Pending Approval');
    if (pendingRegs.length > 0) {
      list.push({
        id: 'crit-reg-queue',
        severity: pendingRegs.length > 3 ? 'Attention' : 'Informational',
        title: `${pendingRegs.length} Staff Registration Application(s) Pending`,
        category: 'Compliance',
        locationName: 'Clean Wave Network',
        timeRemaining: 'Oldest: 3 days',
        operationalImpact: 'New onboarding stalled; background verification held',
        recommendedAction: 'Review applicant qualifications and complete credential check',
        actionUrl: '/workforce/registrations',
        timestamp: 'Active Queue',
      });
    }

    // Sort order: Critical -> Attention -> Informational
    const severityRank: Record<string, number> = {
      Critical: 1,
      Attention: 2,
      Informational: 3,
    };

    return list.sort((a, b) => (severityRank[a.severity] || 99) - (severityRank[b.severity] || 99));
  }, [filteredSchedules, filteredAttendance, filteredLeave, registrations]);

  // 7-day Schedule & Absence Preview with day-level drill-down
  const scheduleDays = useMemo<ScheduleDayDetail[]>(() => {
    const days: ScheduleDayDetail[] = [];
    const today = new Date();
    const requirements = [6, 8, 8, 10, 9, 12, 11]; // Sun through Sat

    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      const isToday = i === 0;
      const dayOfWeek = d.getDay();
      const required = requirements[dayOfWeek];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      // Match shifts for this day
      const daySchedules = filteredSchedules.filter(s => {
        return s.day === dayName || s.date === dateStr;
      });

      const openShifts = daySchedules.filter(s => s.isOpen).length;
      const scheduled = daySchedules.filter(s => !s.isOpen).length;

      // Match approved leave
      const approvedLeave = filteredLeave.filter((l: LeaveRequest) => {
        if (l.status !== 'Approved') return false;
        const start = new Date(l.startDate);
        const end = new Date(l.endDate);
        return d >= start && d <= end;
      }).length;

      const available = Math.max(0, scheduled - approvedLeave);
      const gap = required - available;

      let status: 'Healthy' | 'Attention' | 'Critical' = 'Healthy';
      if (gap > 0 && gap <= 2) status = 'Attention';
      if (gap > 2 || openShifts > 1) status = 'Critical';

      // Activities list for this day
      const activities: DayActivity[] = [];

      daySchedules.forEach(s => {
        const isMorning = s.timeRange.toLowerCase().includes('am') && !s.timeRange.toLowerCase().includes('pm –') && !s.timeRange.includes('4:00 PM');
        const isEvening = s.timeRange.includes('PM – 9') || s.timeRange.includes('Evening');
        const period = isEvening ? 'Evening' : isMorning ? 'Morning' : 'Afternoon';

        if (s.isOpen) {
          activities.push({
            id: `act-open-${s.id}`,
            type: 'open_shift',
            title: `Open Shift: ${s.shiftTitle}`,
            employeeName: 'Unassigned Position',
            timeRange: s.timeRange,
            period,
            role: s.roleRequired,
            status: 'Unfilled',
            locationName: s.locationName,
            actionUrl: '/workforce/shift-coverage',
          });
        } else {
          activities.push({
            id: `act-shift-${s.id}`,
            type: 'shift',
            title: s.shiftTitle,
            employeeName: s.assignedEmployeeName || 'Assigned Staff',
            employeeId: s.assignedEmployeeId,
            timeRange: s.timeRange,
            period,
            role: s.roleRequired,
            status: s.conflictWarning ? 'Flagged Conflict' : s.isOvertimeRisk ? 'OT Risk' : 'Scheduled',
            locationName: s.locationName,
            actionUrl: '/workforce/scheduling',
          });
        }
      });

      // Include approved leave as activities
      filteredLeave
        .filter((l: LeaveRequest) => l.status === 'Approved' && d >= new Date(l.startDate) && d <= new Date(l.endDate))
        .forEach((l: LeaveRequest) => {
          activities.push({
            id: `act-leave-${l.id}`,
            type: 'leave',
            title: `${l.leaveType} (Approved)`,
            employeeName: l.employeeName,
            employeeId: l.employeeId,
            timeRange: 'All Day',
            period: 'Morning',
            status: 'On Approved Leave',
            locationName: l.locationName,
            actionUrl: '/workforce/leave',
          });
        });

      // Top event summary
      let topEvent: string | undefined;
      if (openShifts > 0) {
        topEvent = `${openShifts} open shift${openShifts > 1 ? 's' : ''} unfilled`;
      } else if (approvedLeave > 0) {
        topEvent = `${approvedLeave} on approved leave`;
      } else if (gap > 0) {
        topEvent = `Coverage gap: ${gap} needed`;
      } else {
        topEvent = 'Full schedule coverage';
      }

      days.push({
        date: d,
        dateStr,
        dayName,
        isToday,
        required,
        scheduled: scheduled + openShifts,
        available,
        approvedLeave,
        openShifts,
        status,
        topEvent,
        activities,
      });
    }

    return days;
  }, [filteredSchedules, filteredLeave]);

  // Pending Actions
  const pendingActions = useMemo<PendingActionItem[]>(() => {
    const pendingLeaveCount = filteredLeave.filter((l: LeaveRequest) => l.status === 'Pending').length;
    const timesheetPending = timesheets.filter(t => t.status === 'Submitted').length;
    const regPending = registrations.filter(r => r.status === 'Pending Approval').length;
    const openShiftsCount = filteredSchedules.filter(s => s.isOpen).length;
    const scheduleConflicts = filteredSchedules.filter(s => s.conflictWarning || s.isOvertimeRisk).length;

    return [
      {
        id: 'pa-leave',
        label: 'Leave Requests',
        count: pendingLeaveCount,
        urgentCount: filteredLeave.filter((l: LeaveRequest) => l.coverageImpact === 'High Risk' && l.status === 'Pending').length,
        oldestWaiting: 'Oldest: 2 days',
        operationalImpact: 'Immediate coverage uncertainty for scheduled shifts',
        destination: '/workforce/leave',
        iconName: 'CalendarClock',
        urgency: pendingLeaveCount > 0 ? 'high' : 'low',
      },
      {
        id: 'pa-timesheets',
        label: 'Timesheet Approvals',
        count: timesheetPending,
        urgentCount: timesheets.filter(t => t.records.some(r => r.hasException) && t.status === 'Submitted').length,
        oldestWaiting: 'Current pay period closes Fri',
        operationalImpact: '3 records contain unreviewed punch exceptions',
        destination: '/workforce/timesheets',
        iconName: 'FileText',
        urgency: timesheetPending > 0 ? 'high' : 'medium',
      },
      {
        id: 'pa-registrations',
        label: 'Registration Approvals',
        count: regPending,
        urgentCount: registrations.filter(r => r.assignedApproverRole === role && r.status === 'Pending Approval').length,
        oldestWaiting: 'Oldest: 3 days',
        operationalImpact: 'Staff onboarding queue held pending verification',
        destination: '/workforce/registrations',
        iconName: 'UserPlus',
        urgency: regPending > 2 ? 'high' : 'medium',
      },
      {
        id: 'pa-scheduling',
        label: 'Schedule Acknowledgements & Risks',
        count: scheduleConflicts,
        urgentCount: filteredSchedules.filter(s => s.conflictWarning).length,
        oldestWaiting: 'Published for next cycle',
        operationalImpact: 'Solo shift coverage gap and 1 overtime flag detected',
        destination: '/workforce/scheduling',
        iconName: 'CheckCircle2',
        urgency: scheduleConflicts > 0 ? 'medium' : 'low',
      },
      {
        id: 'pa-open-shifts',
        label: 'Open Shift Fillings',
        count: openShiftsCount,
        urgentCount: openShiftsCount,
        oldestWaiting: 'Earliest start: 14h',
        operationalImpact: 'Production throughput deficit at Springfield WDF station',
        destination: '/workforce/shift-coverage',
        iconName: 'ShieldAlert',
        urgency: openShiftsCount > 0 ? 'high' : 'low',
      },
    ];
  }, [filteredLeave, timesheets, registrations, filteredSchedules, role]);

  // Upcoming Awareness Events
  const upcomingAwarenessEvents = useMemo<AwarenessEvent[]>(() => {
    return [
      {
        id: 'u-1',
        title: 'Planned Vacation Begins: Anna Kowalski',
        eventType: 'Leave Coming Up',
        employeeName: 'Anna Kowalski',
        locationName: 'Springfield Hub',
        shift: 'Morning (08:00 AM – 03:00 PM)',
        dateStr: 'Sep 18, 2026',
        operationalEffect: 'Contractor Hilda Morales scheduled to cover intake station',
        actionUrl: '/workforce/leave',
      },
      {
        id: 'u-2',
        title: 'Commercial Chemical Handling Certification',
        eventType: 'Training',
        employeeName: 'Dinees Patel',
        locationName: 'Springfield Hub',
        shift: 'Afternoon (01:00 PM – 03:00 PM)',
        dateStr: 'Sep 21, 2026',
        operationalEffect: 'Required for OSHA compliant commercial washer operations',
        actionUrl: '/workforce/employees',
      },
      {
        id: 'u-3',
        title: 'New Associate Onboarding: Jordan Blake',
        eventType: 'Onboarding',
        employeeName: 'Jordan Blake',
        locationName: 'Clean Wave Express — Springfield',
        shift: 'Morning (08:30 AM – 12:30 PM)',
        dateStr: 'Sep 22, 2026',
        operationalEffect: 'Paired with Mary Jensen for WDF workflow orientation',
        actionUrl: '/workforce/registrations',
      },
      {
        id: 'u-4',
        title: 'Supervisor Shift Handoff & Machine Maintenance',
        eventType: 'Shift Handoff',
        employeeName: 'Marcus Chen & Anita Ramirez',
        locationName: 'All Hubs',
        shift: 'Evening (05:30 PM – 06:00 PM)',
        dateStr: 'Sep 19, 2026',
        operationalEffect: 'Mid-week filter clean and production quota handoff',
        actionUrl: '/workforce/scheduling',
      },
    ];
  }, []);

  return {
    metrics,
    criticalEvents,
    scheduleDays,
    pendingActions,
    upcomingAwarenessEvents,
    filteredAttendance,
    filteredEmployees,
    filteredSchedules,
  };
}
// @ts-nocheck — verbatim local-preview code from LaundryAI - Copy.zip.
