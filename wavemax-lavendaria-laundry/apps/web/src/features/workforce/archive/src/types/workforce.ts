// @ts-nocheck
export type WorkforceSeverity = 'Critical' | 'Attention' | 'Informational';

export interface CriticalEvent {
  id: string;
  severity: WorkforceSeverity;
  title: string;
  category: 'Shift Shortage' | 'Attendance Exception' | 'Leave Coverage' | 'Compliance' | 'Certification';
  employeeName?: string;
  employeeId?: string;
  locationName: string;
  locationId?: string;
  scheduledTime?: string;
  timeRemaining: string;
  operationalImpact: string;
  recommendedAction: string;
  actionUrl: string;
  timestamp: string;
}

export interface DayActivity {
  id: string;
  type: 'shift' | 'leave' | 'open_shift' | 'training' | 'exception';
  title: string;
  employeeName: string;
  employeeId?: string;
  timeRange: string;
  period: 'Morning' | 'Afternoon' | 'Evening';
  role?: string;
  status: string;
  locationName: string;
  actionUrl?: string;
}

export interface ScheduleDayDetail {
  date: Date;
  dateStr: string;
  dayName: string;
  isToday: boolean;
  required: number;
  scheduled: number;
  available: number;
  approvedLeave: number;
  openShifts: number;
  status: 'Healthy' | 'Attention' | 'Critical';
  topEvent?: string;
  activities: DayActivity[];
}

export interface PendingActionItem {
  id: string;
  label: string;
  count: number;
  urgentCount: number;
  oldestWaiting: string;
  operationalImpact: string;
  destination: string;
  iconName: 'CalendarClock' | 'FileText' | 'UserPlus' | 'CheckCircle2' | 'ShieldAlert' | 'Clock';
  urgency: 'high' | 'medium' | 'low';
}

export interface AwarenessEvent {
  id: string;
  title: string;
  eventType: 'Leave Coming Up' | 'Training' | 'Shift Change' | 'Onboarding' | 'Shift Handoff';
  employeeName: string;
  locationName: string;
  shift: string;
  dateStr: string;
  operationalEffect: string;
  actionUrl: string;
}
// @ts-nocheck — verbatim local-preview code from LaundryAI - Copy.zip.
