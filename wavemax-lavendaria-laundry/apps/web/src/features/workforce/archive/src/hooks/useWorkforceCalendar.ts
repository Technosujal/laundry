// @ts-nocheck
import { useAppContext } from '../context/AppContext';
import { type CalendarEvent, type CalendarEventType } from '../components/workforce/WorkforceCalendar';

export function useWorkforceCalendar() {
  const {
    schedules,
    leaveRequests,
    attendanceRecords,
  } = useAppContext();

  const parseDate = (dateStr: string) => {
    const year = new Date().getFullYear();
    return new Date(`${dateStr}, ${year}`);
  };

  const events: CalendarEvent[] = [
    ...schedules.map(s => ({
      id: s.id,
      title: s.isOpen ? `Open Shift: ${s.shiftTitle}` : `${s.assignedEmployeeName || 'Unassigned'}: ${s.shiftTitle}`,
      type: 'shift' as CalendarEventType,
      start: parseDate(s.date),
      end: parseDate(s.date),
      employee: s.assignedEmployeeName || 'Open',
      status: (s.isOpen ? 'pending' : 'published') as CalendarEvent['status'],
      workArea: s.roleRequired, // Using roleRequired as workArea for prototype
    })),
    ...leaveRequests.filter(l => l.status === 'Approved').map(l => ({
      id: l.id,
      title: `Leave: ${l.leaveType}`,
      type: 'leave' as CalendarEventType,
      start: new Date(l.startDate),
      end: new Date(l.endDate),
      employee: l.employeeName,
      status: 'approved' as CalendarEvent['status'],
    })),
    ...attendanceRecords.filter(a => a.status === 'Late' || a.status === 'Missed Punch').map(a => ({
      id: a.id,
      title: `Exception: ${a.status}`,
      type: 'exception' as CalendarEventType,
      start: new Date(a.date),
      end: new Date(a.date),
      employee: a.employeeName,
      status: 'exception' as CalendarEvent['status'],
    }))
  ];

  return { events };
}
// @ts-nocheck — verbatim local-preview code from LaundryAI - Copy.zip.
