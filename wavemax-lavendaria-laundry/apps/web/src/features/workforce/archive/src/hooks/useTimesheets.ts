// @ts-nocheck
import { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { locations } from '../data/dashboardData';
import type { Timesheet, TimesheetDayRecord } from '../data/workforceData';

export type TimesheetPeriod = 'Week' | 'Month';

export interface TimesheetListItem {
  id: string;
  employeeId: string;
  employeeName: string;
  locationName: string;
  locationId: string;
  role: string;
  employmentType: string;
  photoUrl?: string;
  payPeriod: string;
  scheduledHours: number;
  regularHours: number;
  overtimeHours: number;
  breakHours: number;
  totalHours: number;
  varianceHours: number;
  exceptionCount: number;
  status: Timesheet['status'];
  submittedDate?: string;
  correctionNotes?: string;
  timesheet: Timesheet;
}

export function useTimesheets() {
  const {
    timesheets,
    employeeDirectory,
    currentUser,
    role,
    approveTimesheet,
    returnTimesheet,
    submitTimesheet,
  } = useAppContext();

  const [period, setPeriod] = useState<TimesheetPeriod>('Month');
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [exceptionsOnly, setExceptionsOnly] = useState(false);
  const [selectedTimesheetId, setSelectedTimesheetId] = useState<string | null>(null);

  // Role scoping
  const isManager = role === 'manager';
  const managerLocationId = isManager ? (currentUser?.locationIds?.[0] || 'loc-1') : undefined;

  // Pay periods available
  const availablePeriods = [
    'Sep 1 – Sep 14, 2026',
    'Aug 16 – Aug 31, 2026',
    'Aug 1 – Aug 15, 2026',
  ];
  const [selectedPayPeriod, setSelectedPayPeriod] = useState(availablePeriods[0]);

  // Scoped & Filtered list items
  const timesheetList = useMemo<TimesheetListItem[]>(() => {
    return timesheets
      .filter((ts) => {
        if (managerLocationId && ts.locationId !== managerLocationId) return false;
        if (locationFilter !== 'all' && ts.locationId !== locationFilter) return false;
        if (statusFilter !== 'all' && ts.status !== statusFilter) return false;

        const emp = employeeDirectory.find((e) => e.employeeId === ts.employeeId);
        const exceptionCount = ts.records.filter((r) => r.hasException).length;
        if (exceptionsOnly && exceptionCount === 0) return false;

        if (search.trim()) {
          const q = search.toLowerCase();
          const matchName = ts.employeeName.toLowerCase().includes(q);
          const matchId = ts.employeeId.toLowerCase().includes(q);
          const matchRole = emp?.role.toLowerCase().includes(q);
          if (!matchName && !matchId && !matchRole) return false;
        }

        return true;
      })
      .map((ts) => {
        const emp = employeeDirectory.find((e) => e.employeeId === ts.employeeId);
        const scheduledHours = 80.0; // Standard 2-week pay period
        const regularHours = ts.totalRegularHours;
        const overtimeHours = ts.totalOvertimeHours;
        const totalHours = Number((regularHours + overtimeHours).toFixed(1));
        const varianceHours = Number((totalHours - scheduledHours).toFixed(1));
        const breakHours = Number(
          (ts.records.reduce((sum, r) => sum + (r.breakMin || 0), 0) / 60).toFixed(1)
        );
        const exceptionCount = ts.records.filter((r) => r.hasException).length;

        return {
          id: ts.id,
          employeeId: ts.employeeId,
          employeeName: ts.employeeName,
          locationName: ts.locationName,
          locationId: ts.locationId,
          role: emp?.role || 'Staff Specialist',
          employmentType: emp?.employmentType || 'Full Time',
          photoUrl: emp?.photoUrl,
          payPeriod: ts.payPeriod,
          scheduledHours,
          regularHours,
          overtimeHours,
          breakHours,
          totalHours,
          varianceHours,
          exceptionCount,
          status: ts.status,
          submittedDate: ts.submittedDate,
          correctionNotes: ts.correctionNotes,
          timesheet: ts,
        };
      });
  }, [
    timesheets,
    employeeDirectory,
    managerLocationId,
    locationFilter,
    statusFilter,
    exceptionsOnly,
    search,
  ]);

  // Selected timesheet for drill-down
  const selectedTimesheetItem = useMemo(() => {
    if (!selectedTimesheetId) return null;
    return timesheetList.find((item) => item.id === selectedTimesheetId) || null;
  }, [selectedTimesheetId, timesheetList]);

  // Navigate next / previous employee in drill-down
  const currentIdx = timesheetList.findIndex((item) => item.id === selectedTimesheetId);
  const hasNext = currentIdx >= 0 && currentIdx < timesheetList.length - 1;
  const hasPrev = currentIdx > 0;

  const nextEmployee = () => {
    if (hasNext) setSelectedTimesheetId(timesheetList[currentIdx + 1].id);
  };

  const prevEmployee = () => {
    if (hasPrev) setSelectedTimesheetId(timesheetList[currentIdx - 1].id);
  };

  // Group daily records into Week 1 and Week 2 for drill-down view
  const groupedWeeklyRecords = useMemo(() => {
    if (!selectedTimesheetItem) return { week1: [], week2: [] };
    const records = selectedTimesheetItem.timesheet.records;
    return {
      week1: records.slice(0, 5),
      week2: records.slice(5),
    };
  }, [selectedTimesheetItem]);

  // Metrics summary
  const metrics = useMemo(() => {
    const totalSubmitted = timesheets.filter((t) => t.status === 'Submitted').length;
    const totalApproved = timesheets.filter((t) => t.status === 'Approved').length;
    const totalReturned = timesheets.filter((t) => t.status === 'Returned for Correction').length;
    const totalExceptions = timesheets.reduce(
      (sum, t) => sum + t.records.filter((r) => r.hasException).length,
      0
    );

    return {
      totalSubmitted,
      totalApproved,
      totalReturned,
      totalExceptions,
      totalTimesheets: timesheets.length,
    };
  }, [timesheets]);

  return {
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
  };
}
// @ts-nocheck — verbatim local-preview code from LaundryAI - Copy.zip.
