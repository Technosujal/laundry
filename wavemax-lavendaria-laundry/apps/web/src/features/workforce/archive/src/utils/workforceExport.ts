// @ts-nocheck
import * as XLSX from 'xlsx';

export interface AttendanceExportRecord {
  employeeId: string;
  employeeName: string;
  locationName: string;
  date: string;
  scheduledShift?: string;
  clockInTime?: string;
  clockOutTime?: string;
  breakDurationMinutes?: number;
  totalHoursWorked: number;
  status: string;
}

export interface WeeklyAttendanceExportRecord {
  employeeId: string;
  employeeName: string;
  locationName: string;
  scheduledHours: number;
  actualHours: number;
  varianceHours: number;
  exceptionsCount: number;
  mondayStatus: string;
  tuesdayStatus: string;
  wednesdayStatus: string;
  thursdayStatus: string;
  fridayStatus: string;
  saturdayStatus: string;
  sundayStatus: string;
}

export interface MonthlyAttendanceExportRecord {
  employeeId: string;
  employeeName: string;
  locationName: string;
  scheduledDays: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  leaveDays: number;
  missedPunches: number;
  scheduledHours: number;
  actualHours: number;
  varianceHours: number;
  attendanceRate: string;
}

export function exportAttendanceReport({
  period,
  dateLabel,
  locationName = 'All Locations',
  liveRecords = [],
  weeklyRecords = [],
  monthlyRecords = [],
}: {
  period: 'Live' | 'Week' | 'Month';
  dateLabel: string;
  locationName?: string;
  liveRecords?: AttendanceExportRecord[];
  weeklyRecords?: WeeklyAttendanceExportRecord[];
  monthlyRecords?: MonthlyAttendanceExportRecord[];
}) {
  const wb = XLSX.utils.book_new();

  // 1. Generate primary sheet data based on period
  let primarySheetData: any[] = [];
  let dataSheetName = 'Attendance';

  if (period === 'Live') {
    primarySheetData = liveRecords.map(r => ({
      'Employee ID': r.employeeId,
      'Employee Name': r.employeeName,
      'Location': r.locationName,
      'Date': r.date,
      'Scheduled Shift': r.scheduledShift || '—',
      'Clock In': r.clockInTime || '—',
      'Clock Out': r.clockOutTime || '—',
      'Break (min)': r.breakDurationMinutes ?? 0,
      'Hours Worked': Number(r.totalHoursWorked.toFixed(2)),
      'Status': r.status,
    }));
  } else if (period === 'Week') {
    primarySheetData = weeklyRecords.map(r => ({
      'Employee ID': r.employeeId,
      'Employee Name': r.employeeName,
      'Location': r.locationName,
      'Scheduled (h)': r.scheduledHours,
      'Actual (h)': r.actualHours,
      'Variance (h)': r.varianceHours,
      'Exceptions': r.exceptionsCount,
      'Mon': r.mondayStatus,
      'Tue': r.tuesdayStatus,
      'Wed': r.wednesdayStatus,
      'Thu': r.thursdayStatus,
      'Fri': r.fridayStatus,
      'Sat': r.saturdayStatus,
      'Sun': r.sundayStatus,
    }));
  } else {
    primarySheetData = monthlyRecords.map(r => ({
      'Employee ID': r.employeeId,
      'Employee Name': r.employeeName,
      'Location': r.locationName,
      'Scheduled Days': r.scheduledDays,
      'Present': r.presentDays,
      'Late': r.lateDays,
      'Absent': r.absentDays,
      'Leave': r.leaveDays,
      'Missed Punches': r.missedPunches,
      'Scheduled (h)': r.scheduledHours,
      'Actual (h)': r.actualHours,
      'Variance (h)': r.varianceHours,
      'Attendance Rate': r.attendanceRate,
    }));
  }

  // 2. Metadata Summary Sheet
  const metadata = [
    { Property: 'Report Title', Value: `Workforce Attendance Report — ${period} View` },
    { Property: 'Period / Date', Value: dateLabel },
    { Property: 'Facility / Location', Value: locationName },
    { Property: 'Total Records Exported', Value: primarySheetData.length },
    { Property: 'Generated At', Value: new Date().toLocaleString() },
    { Property: 'System Application', Value: 'LaundryAI Enterprise Workforce Management' },
    { Property: 'Compliance Standards', Value: 'FLSA & Department of Labor Recordkeeping Compliant' },
  ];
  const summaryWs = XLSX.utils.json_to_sheet(metadata);
  summaryWs['!cols'] = [{ wch: 25 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

  const attendanceWs = XLSX.utils.json_to_sheet(primarySheetData);

  // Set column widths
  attendanceWs['!cols'] = [
    { wch: 14 },
    { wch: 22 },
    { wch: 28 },
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
  ];

  XLSX.utils.book_append_sheet(wb, attendanceWs, dataSheetName);

  // 3. Trigger file download
  const sanitizedDate = dateLabel.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const filename = `workforce-attendance-${period.toLowerCase()}-${sanitizedDate}.xlsx`;
  XLSX.writeFile(wb, filename);
}
// @ts-nocheck — verbatim local-preview code from LaundryAI - Copy.zip.
