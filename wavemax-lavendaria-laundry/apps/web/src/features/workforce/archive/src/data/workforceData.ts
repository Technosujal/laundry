// @ts-nocheck
// Comprehensive Workforce Mock Data and Types
// Fictional users, staff directory, schedules, attendance, leave, timesheets, registrations, and notifications

export type AppRole = 'owner' | 'manager' | 'employee';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  avatar: string;
  title: string;
  locationIds: string[]; // Assigned locations
  employeeId?: string;
  phone?: string;
  photoUrl?: string;
  photoThumbnailUrl?: string;
  photoStatus?: 'none' | 'uploaded' | 'processing' | 'active';
}

export const mockUsers: UserProfile[] = [
  {
    id: 'usr-owner',
    name: 'Eleanor Vance',
    email: 'owner@cleanwave.com',
    role: 'owner',
    avatar: 'EV',
    title: 'Executive Owner',
    locationIds: ['loc-1', 'loc-2', 'loc-3', 'loc-4', 'loc-5', 'loc-6'],
    phone: '(555) 234-5678',
  },
  {
    id: 'usr-mgr-anita',
    name: 'Anita Ramirez',
    email: 'anita@cleanwave.com',
    role: 'manager',
    avatar: 'AR',
    title: 'Store Operations Manager',
    locationIds: ['loc-1'], // Springfield
    employeeId: 'CW-M01',
    phone: '(555) 345-6789',
  },
  {
    id: 'usr-mgr-marcus',
    name: 'Marcus Chen',
    email: 'marcus@cleanwave.com',
    role: 'manager',
    avatar: 'MC',
    title: 'Store Operations Manager',
    locationIds: ['loc-3', 'loc-4'], // Riverside & Northside
    employeeId: 'CW-M02',
    phone: '(555) 345-6790',
  },
  {
    id: 'usr-emp-mary',
    name: 'Mary Jensen',
    email: 'mary@cleanwave.com',
    role: 'employee',
    avatar: 'MJ',
    title: 'Counter & Production Lead',
    locationIds: ['loc-1'], // Springfield
    employeeId: 'CW-E101',
    phone: '(555) 456-7890',
  },
  {
    id: 'usr-emp-anna',
    name: 'Anna Kowalski',
    email: 'anna@cleanwave.com',
    role: 'employee',
    avatar: 'AK',
    title: 'Wash & Fold Specialist',
    locationIds: ['loc-1'],
    employeeId: 'CW-E102',
    phone: '(555) 456-7891',
  },
];

// Employee Directory Interface
export interface DirectoryEmployee {
  id: string;
  employeeId: string;
  name: string;
  role: string;
  employmentType: 'Full Time' | 'Part Time' | 'Contractor';
  primaryLocationId: string;
  primaryLocationName: string;
  currentShift: string;
  status: 'Active' | 'On Leave' | 'Terminated' | 'Pending';
  startDate: string;
  managerName: string;
  email: string;
  phone: string;
  photoUrl?: string;
  photoThumbnailUrl?: string;
  photoUpdatedAt?: string;
  photoStatus?: 'none' | 'uploaded' | 'processing' | 'active';
}

export const initialEmployeeDirectory: DirectoryEmployee[] = [
  {
    id: 'dir-1',
    employeeId: 'CW-E101',
    name: 'Mary Jensen',
    role: 'Counter / Production',
    employmentType: 'Full Time',
    primaryLocationId: 'loc-1',
    primaryLocationName: 'Clean Wave Express — Springfield',
    currentShift: 'Morning (8:00 AM – 4:00 PM)',
    status: 'Active',
    startDate: 'Jan 15, 2025',
    managerName: 'Anita Ramirez',
    email: 'mary@cleanwave.com',
    phone: '(555) 456-7890',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&h=256&q=80',
    photoStatus: 'active',
  },
  {
    id: 'dir-2',
    employeeId: 'CW-E102',
    name: 'Anna Kowalski',
    role: 'Production Specialist',
    employmentType: 'Full Time',
    primaryLocationId: 'loc-1',
    primaryLocationName: 'Clean Wave Express — Springfield',
    currentShift: 'Morning (8:00 AM – 3:00 PM)',
    status: 'Active',
    startDate: 'Mar 10, 2025',
    managerName: 'Anita Ramirez',
    email: 'anna@cleanwave.com',
    phone: '(555) 456-7891',
    photoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&h=256&q=80',
    photoStatus: 'active',
  },
  {
    id: 'dir-3',
    employeeId: 'CW-E103',
    name: 'Dinees Patel',
    role: 'Production Associate',
    employmentType: 'Part Time',
    primaryLocationId: 'loc-1',
    primaryLocationName: 'Clean Wave Express — Springfield',
    currentShift: 'Evening (3:00 PM – 9:00 PM)',
    status: 'Active',
    startDate: 'Jun 1, 2025',
    managerName: 'Anita Ramirez',
    email: 'dinees@cleanwave.com',
    phone: '(555) 456-7892',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80',
    photoStatus: 'active',
  },
  {
    id: 'dir-4',
    employeeId: 'CW-C201',
    name: 'Hilda Morales',
    role: 'Production Contractor',
    employmentType: 'Contractor',
    primaryLocationId: 'loc-1',
    primaryLocationName: 'Clean Wave Express — Springfield',
    currentShift: 'Day (9:00 AM – 5:00 PM)',
    status: 'Active',
    startDate: 'Aug 14, 2025',
    managerName: 'Anita Ramirez',
    email: 'hilda.m@contractor.cleanwave.com',
    phone: '(555) 456-7893',
    photoUrl: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=256&h=256&q=80',
    photoStatus: 'active',
  },
  {
    id: 'dir-5',
    employeeId: 'CW-C202',
    name: 'Mellisa Cruz',
    role: 'Production Contractor',
    employmentType: 'Contractor',
    primaryLocationId: 'loc-1',
    primaryLocationName: 'Clean Wave Express — Springfield',
    currentShift: 'Day (10:00 AM – 6:00 PM)',
    status: 'Active',
    startDate: 'Sep 2, 2025',
    managerName: 'Anita Ramirez',
    email: 'mellisa.c@contractor.cleanwave.com',
    phone: '(555) 456-7894',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
    photoStatus: 'active',
  },
  {
    id: 'dir-6',
    employeeId: 'CW-D301',
    name: 'Alex Turner',
    role: 'Delivery Driver',
    employmentType: 'Contractor',
    primaryLocationId: 'loc-1',
    primaryLocationName: 'Clean Wave Express — Springfield',
    currentShift: 'Delivery Route (9:00 AM – 4:00 PM)',
    status: 'Active',
    startDate: 'Feb 1, 2025',
    managerName: 'Anita Ramirez',
    email: 'alex.t@driver.cleanwave.com',
    phone: '(555) 456-7895',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&h=256&q=80',
    photoStatus: 'active',
  },
  {
    id: 'dir-7',
    employeeId: 'CW-E104',
    name: 'Lucas Silva',
    role: 'Wash & Fold Associate',
    employmentType: 'Full Time',
    primaryLocationId: 'loc-3',
    primaryLocationName: 'Riverside Laundry Center',
    currentShift: 'Morning (7:30 AM – 3:30 PM)',
    status: 'Active',
    startDate: 'Apr 12, 2025',
    managerName: 'Marcus Chen',
    email: 'lucas.s@cleanwave.com',
    phone: '(555) 456-7896',
    photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=256&h=256&q=80',
    photoStatus: 'active',
  },
  {
    id: 'dir-8',
    employeeId: 'CW-E105',
    name: 'Zoe Washington',
    role: 'Intake Counter Specialist',
    employmentType: 'Part Time',
    primaryLocationId: 'loc-4',
    primaryLocationName: 'Northside Wash and Fold',
    currentShift: 'Afternoon (1:00 PM – 7:00 PM)',
    status: 'On Leave',
    startDate: 'May 20, 2025',
    managerName: 'Marcus Chen',
    email: 'zoe.w@cleanwave.com',
    phone: '(555) 456-7897',
    photoUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=256&h=256&q=80',
    photoStatus: 'active',
  },
];

// In-App Notifications
export interface AppNotification {
  id: string;
  type:
    | 'registration'
    | 'leave'
    | 'schedule'
    | 'timesheet'
    | 'attendance'
    | 'machine'
    | 'procurement';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  targetRole: AppRole[];
  targetLocationIds?: string[];
  linkPath?: string;
  actionRequired?: boolean;
}

export const initialNotifications: AppNotification[] = [
  {
    id: 'notif-1',
    type: 'registration',
    title: 'New Employee Registration Submitted',
    message: 'Jordan Blake has registered as Employee for Clean Wave Express — Springfield. Pending manager approval.',
    timestamp: '15 mins ago',
    read: false,
    targetRole: ['manager'],
    targetLocationIds: ['loc-1'],
    linkPath: '/workforce/registrations',
    actionRequired: true,
  },
  {
    id: 'notif-2',
    type: 'registration',
    title: 'New Manager Application Submitted',
    message: 'David Vance has registered as Manager for Riverside & Northside hubs. Pending owner review.',
    timestamp: '1 hour ago',
    read: false,
    targetRole: ['owner'],
    linkPath: '/workforce/registrations',
    actionRequired: true,
  },
  {
    id: 'notif-3',
    type: 'leave',
    title: 'Leave Request Pending Review',
    message: 'Anna Kowalski submitted a 1-day PTO request for Sep 18. Shift coverage check required.',
    timestamp: '2 hours ago',
    read: false,
    targetRole: ['manager'],
    targetLocationIds: ['loc-1'],
    linkPath: '/workforce/leave',
    actionRequired: true,
  },
  {
    id: 'notif-4',
    type: 'attendance',
    title: 'Missed Clock-In Warning',
    message: 'Contractor Alex Turner is 20 minutes past scheduled pickup start time.',
    timestamp: '3 hours ago',
    read: true,
    targetRole: ['manager', 'owner'],
    targetLocationIds: ['loc-1'],
    linkPath: '/workforce/attendance',
  },
  {
    id: 'notif-5',
    type: 'machine',
    title: 'Dryer #4 Thermal Fault Reported',
    message: 'Heating element shut off. Technician dispatched. Estimated repair time: 2h.',
    timestamp: '4 hours ago',
    read: true,
    targetRole: ['manager', 'owner'],
    linkPath: '/resource-plan',
  },
  {
    id: 'notif-6',
    type: 'schedule',
    title: 'Schedule Published',
    message: 'Your schedule for the week of Sep 15–21 has been published.',
    timestamp: 'Yesterday',
    read: false,
    targetRole: ['employee'],
    linkPath: '/workforce/scheduling',
  },
];

// Registration Applications
export interface TimelineEntry {
  date: string;
  actor: string;
  action: string;
  note?: string;
}

export interface RegistrationApplication {
  id: string;
  refNumber: string;
  fullName: string;
  email: string;
  phone: string;
  requestedRole: 'Manager' | 'Employee';
  requestedLocationIds: string[];
  requestedLocationNames: string[];
  employmentType: 'Full Time' | 'Part Time' | 'Contractor';
  preferredShift: 'Morning' | 'Afternoon' | 'Evening' | 'Flexible';
  proposedStartDate: string;
  message?: string;
  submittedDate: string;
  status: 'Pending Approval' | 'Approved' | 'Rejected' | 'Clarification Requested';
  assignedApproverRole: 'owner' | 'manager';
  approvalTimeline: TimelineEntry[];
}

export const initialRegistrations: RegistrationApplication[] = [
  {
    id: 'reg-101',
    refNumber: 'REG-2026-0891',
    fullName: 'Jordan Blake',
    email: 'jordan.blake@example.com',
    phone: '(555) 789-0123',
    requestedRole: 'Employee',
    requestedLocationIds: ['loc-1'],
    requestedLocationNames: ['Clean Wave Express — Springfield'],
    employmentType: 'Full Time',
    preferredShift: 'Morning',
    proposedStartDate: 'Sep 22, 2026',
    message: 'Experienced commercial wash-fold operator with 3 years hospitality laundry background.',
    submittedDate: 'Sep 14, 2026',
    status: 'Pending Approval',
    assignedApproverRole: 'manager',
    approvalTimeline: [
      {
        date: 'Sep 14, 2026 — 10:15 AM',
        actor: 'Applicant',
        action: 'Application submitted online',
        note: 'Routed to Store Manager Anita Ramirez',
      },
    ],
  },
  {
    id: 'reg-102',
    refNumber: 'REG-2026-0888',
    fullName: 'David Vance',
    email: 'david.vance@example.com',
    phone: '(555) 890-1234',
    requestedRole: 'Manager',
    requestedLocationIds: ['loc-3', 'loc-4'],
    requestedLocationNames: ['Riverside Laundry Center', 'Northside Wash and Fold'],
    employmentType: 'Full Time',
    preferredShift: 'Flexible',
    proposedStartDate: 'Oct 1, 2026',
    message: 'Multi-unit retail manager seeking store operations leadership role across Northern hubs.',
    submittedDate: 'Sep 13, 2026',
    status: 'Pending Approval',
    assignedApproverRole: 'owner',
    approvalTimeline: [
      {
        date: 'Sep 13, 2026 — 2:40 PM',
        actor: 'Applicant',
        action: 'Manager application submitted',
        note: 'Routed to Executive Owner',
      },
    ],
  },
  {
    id: 'reg-103',
    refNumber: 'REG-2026-0875',
    fullName: 'Chloe Martinez',
    email: 'chloe.m@example.com',
    phone: '(555) 901-2345',
    requestedRole: 'Employee',
    requestedLocationIds: ['loc-1'],
    requestedLocationNames: ['Clean Wave Express — Springfield'],
    employmentType: 'Part Time',
    preferredShift: 'Evening',
    proposedStartDate: 'Sep 25, 2026',
    message: 'Available evening shifts 4-9 PM on weekdays.',
    submittedDate: 'Sep 11, 2026',
    status: 'Clarification Requested',
    assignedApproverRole: 'manager',
    approvalTimeline: [
      {
        date: 'Sep 11, 2026 — 9:00 AM',
        actor: 'Applicant',
        action: 'Application submitted',
      },
      {
        date: 'Sep 12, 2026 — 11:30 AM',
        actor: 'Anita Ramirez (Manager)',
        action: 'Clarification Requested',
        note: 'Can you work alternate weekend morning shifts if needed?',
      },
    ],
  },
];

// Leave and Time Off Data
export interface LeaveBalance {
  type: 'Paid Time Off' | 'Sick Leave' | 'Unpaid Leave' | 'Emergency Leave';
  availableDays: number;
  usedDays: number;
  pendingDays: number;
  accrualRate: string;
}

export const initialLeaveBalances: Record<string, LeaveBalance[]> = {
  'CW-E101': [
    { type: 'Paid Time Off', availableDays: 12, usedDays: 3, pendingDays: 0, accrualRate: '1.25 days/mo' },
    { type: 'Sick Leave', availableDays: 5, usedDays: 1, pendingDays: 0, accrualRate: '0.5 days/mo' },
    { type: 'Emergency Leave', availableDays: 3, usedDays: 0, pendingDays: 0, accrualRate: 'Annual grant' },
    { type: 'Unpaid Leave', availableDays: 10, usedDays: 0, pendingDays: 0, accrualRate: 'Per approval' },
  ],
  'CW-E102': [
    { type: 'Paid Time Off', availableDays: 8, usedDays: 4, pendingDays: 1, accrualRate: '1.25 days/mo' },
    { type: 'Sick Leave', availableDays: 4, usedDays: 2, pendingDays: 0, accrualRate: '0.5 days/mo' },
    { type: 'Emergency Leave', availableDays: 3, usedDays: 0, pendingDays: 0, accrualRate: 'Annual grant' },
    { type: 'Unpaid Leave', availableDays: 10, usedDays: 0, pendingDays: 0, accrualRate: 'Per approval' },
  ],
};

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  locationId: string;
  locationName: string;
  leaveType: 'Paid Time Off' | 'Sick Leave' | 'Unpaid Leave' | 'Emergency Leave';
  startDate: string;
  endDate: string;
  daysCount: number;
  isPartialDay?: boolean;
  reason: string;
  submittedDate: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Clarification Requested';
  coverageImpact: 'None' | 'Moderate' | 'High Risk';
  conflictsNote?: string;
  approverNote?: string;
  timeline: TimelineEntry[];
}

export const initialLeaveRequests: LeaveRequest[] = [
  {
    id: 'lr-1',
    employeeId: 'CW-E102',
    employeeName: 'Anna Kowalski',
    locationId: 'loc-1',
    locationName: 'Clean Wave Express — Springfield',
    leaveType: 'Paid Time Off',
    startDate: '2026-09-18',
    endDate: '2026-09-18',
    daysCount: 1,
    isPartialDay: false,
    reason: 'Family appointment and doctor visit.',
    submittedDate: 'Sep 13, 2026',
    status: 'Pending',
    coverageImpact: 'Moderate',
    conflictsNote: 'Mary Jensen is on morning shift; contractor Hilda can extend 1 hour.',
    timeline: [
      {
        date: 'Sep 13, 2026 — 4:10 PM',
        actor: 'Anna Kowalski',
        action: 'Leave request submitted',
      },
    ],
  },
  {
    id: 'lr-2',
    employeeId: 'CW-E105',
    employeeName: 'Zoe Washington',
    locationId: 'loc-4',
    locationName: 'Northside Wash and Fold',
    leaveType: 'Sick Leave',
    startDate: '2026-09-14',
    endDate: '2026-09-15',
    daysCount: 2,
    isPartialDay: false,
    reason: 'Seasonal flu recovery.',
    submittedDate: 'Sep 13, 2026',
    status: 'Approved',
    coverageImpact: 'High Risk',
    approverNote: 'Approved. Shift covered by Lucas Silva.',
    timeline: [
      {
        date: 'Sep 13, 2026 — 8:00 AM',
        actor: 'Zoe Washington',
        action: 'Leave request submitted',
      },
      {
        date: 'Sep 13, 2026 — 8:45 AM',
        actor: 'Marcus Chen (Manager)',
        action: 'Approved with substitute coverage',
      },
    ],
  },
];

// Attendance & Punch Clock Data
export interface AttendancePunch {
  id: string;
  employeeId: string;
  employeeName: string;
  locationId: string;
  date: string;
  scheduledShift?: string; // e.g. "08:00 AM – 04:00 PM"
  clockInTime: string; // e.g. "08:02 AM"
  clockOutTime?: string;
  breakStartTime?: string;
  breakEndTime?: string;
  breakDurationMinutes: number;
  totalHoursWorked: number;
  status: 'Clocked In' | 'On Break' | 'Clocked Out' | 'Late' | 'Absent' | 'Missed Punch';
  currentAssignment: string;
}

export const initialAttendanceRecords: AttendancePunch[] = [
  {
    id: 'att-1',
    employeeId: 'CW-E101',
    employeeName: 'Mary Jensen',
    locationId: 'loc-1',
    date: 'Sep 14, 2026',
    scheduledShift: '08:00 AM – 04:00 PM',
    clockInTime: '08:00 AM',
    breakStartTime: '12:00 PM',
    breakEndTime: '12:30 PM',
    breakDurationMinutes: 30,
    totalHoursWorked: 6.2,
    status: 'Clocked In',
    currentAssignment: 'WDF Intake & Folding Station 1',
  },
  {
    id: 'att-2',
    employeeId: 'CW-E102',
    employeeName: 'Anna Kowalski',
    locationId: 'loc-1',
    date: 'Sep 14, 2026',
    scheduledShift: '08:00 AM – 03:00 PM',
    clockInTime: '07:58 AM',
    breakStartTime: '12:30 PM',
    breakEndTime: '01:00 PM',
    breakDurationMinutes: 30,
    totalHoursWorked: 6.2,
    status: 'Clocked In',
    currentAssignment: 'Commercial Batch Washers 1–3',
  },
  {
    id: 'att-3',
    employeeId: 'CW-C201',
    employeeName: 'Hilda Morales',
    locationId: 'loc-1',
    date: 'Sep 14, 2026',
    scheduledShift: '09:00 AM – 05:00 PM',
    clockInTime: '09:05 AM',
    breakDurationMinutes: 0,
    totalHoursWorked: 5.1,
    status: 'Clocked In',
    currentAssignment: 'Finishing & Inspection',
  },
  {
    id: 'att-4',
    employeeId: 'CW-D301',
    employeeName: 'Alex Turner',
    locationId: 'loc-1',
    date: 'Sep 14, 2026',
    scheduledShift: '08:30 AM – 04:30 PM',
    clockInTime: '09:20 AM',
    breakDurationMinutes: 0,
    totalHoursWorked: 4.8,
    status: 'Late',
    currentAssignment: 'Happy Nest Route B',
  },
  {
    id: 'att-5',
    employeeId: 'CW-E103',
    employeeName: 'Dinees Patel',
    locationId: 'loc-1',
    date: 'Sep 14, 2026',
    scheduledShift: '07:00 AM – 03:00 PM',
    clockInTime: '06:55 AM',
    clockOutTime: '03:05 PM',
    breakStartTime: '11:00 AM',
    breakEndTime: '11:30 AM',
    breakDurationMinutes: 30,
    totalHoursWorked: 7.6,
    status: 'Clocked Out',
    currentAssignment: 'Sorting & Staging',
  },
  {
    id: 'att-6',
    employeeId: 'CW-C202',
    employeeName: 'Mellisa Cruz',
    locationId: 'loc-1',
    date: 'Sep 14, 2026',
    scheduledShift: '10:00 AM – 06:00 PM',
    clockInTime: '10:00 AM',
    breakStartTime: '01:30 PM',
    breakDurationMinutes: 30,
    totalHoursWorked: 3.5,
    status: 'On Break',
    currentAssignment: 'Specialty Garment Press',
  },
  {
    id: 'att-7',
    employeeId: 'CW-M401',
    employeeName: 'Samuel Jackson',
    locationId: 'loc-1',
    date: 'Sep 14, 2026',
    scheduledShift: '06:00 AM – 02:00 PM',
    clockInTime: '06:02 AM',
    clockOutTime: '02:00 PM',
    breakStartTime: '10:00 AM',
    breakEndTime: '10:30 AM',
    breakDurationMinutes: 30,
    totalHoursWorked: 7.5,
    status: 'Clocked Out',
    currentAssignment: 'Facility & Boiler Maintenance',
  },
  {
    id: 'att-8',
    employeeId: 'CW-E104',
    employeeName: 'Jordan Hayes',
    locationId: 'loc-1',
    date: 'Sep 14, 2026',
    scheduledShift: '08:00 AM – 04:00 PM',
    clockInTime: '',
    breakDurationMinutes: 0,
    totalHoursWorked: 0,
    status: 'Absent',
    currentAssignment: 'Packaging & Dispatch',
  },
  // Previous Days in Week (Sep 8 - Sep 13, 2026)
  // Sep 13
  {
    id: 'att-101',
    employeeId: 'CW-E101',
    employeeName: 'Mary Jensen',
    locationId: 'loc-1',
    date: 'Sep 13, 2026',
    scheduledShift: '08:00 AM – 04:00 PM',
    clockInTime: '08:02 AM',
    clockOutTime: '04:05 PM',
    breakStartTime: '12:00 PM',
    breakEndTime: '12:30 PM',
    breakDurationMinutes: 30,
    totalHoursWorked: 7.5,
    status: 'Clocked Out',
    currentAssignment: 'Intake Counter',
  },
  {
    id: 'att-102',
    employeeId: 'CW-E102',
    employeeName: 'Anna Kowalski',
    locationId: 'loc-1',
    date: 'Sep 13, 2026',
    scheduledShift: '08:00 AM – 03:00 PM',
    clockInTime: '07:55 AM',
    clockOutTime: '03:00 PM',
    breakStartTime: '11:30 AM',
    breakEndTime: '12:00 PM',
    breakDurationMinutes: 30,
    totalHoursWorked: 6.5,
    status: 'Clocked Out',
    currentAssignment: 'Washer Operations',
  },
  {
    id: 'att-103',
    employeeId: 'CW-E103',
    employeeName: 'Dinees Patel',
    locationId: 'loc-1',
    date: 'Sep 13, 2026',
    scheduledShift: '03:00 PM – 09:00 PM',
    clockInTime: '03:00 PM',
    clockOutTime: '09:05 PM',
    breakStartTime: '06:00 PM',
    breakEndTime: '06:30 PM',
    breakDurationMinutes: 30,
    totalHoursWorked: 5.5,
    status: 'Clocked Out',
    currentAssignment: 'Folding Line',
  },
  // Sep 12
  {
    id: 'att-104',
    employeeId: 'CW-E101',
    employeeName: 'Mary Jensen',
    locationId: 'loc-1',
    date: 'Sep 12, 2026',
    scheduledShift: '08:00 AM – 04:00 PM',
    clockInTime: '07:58 AM',
    clockOutTime: '04:30 PM',
    breakStartTime: '12:00 PM',
    breakEndTime: '12:30 PM',
    breakDurationMinutes: 30,
    totalHoursWorked: 8.0,
    status: 'Clocked Out',
    currentAssignment: 'Commercial Wash-Fold',
  },
  {
    id: 'att-105',
    employeeId: 'CW-E102',
    employeeName: 'Anna Kowalski',
    locationId: 'loc-1',
    date: 'Sep 12, 2026',
    scheduledShift: '08:00 AM – 03:00 PM',
    clockInTime: '08:15 AM',
    clockOutTime: '03:00 PM',
    breakStartTime: '12:00 PM',
    breakEndTime: '12:30 PM',
    breakDurationMinutes: 30,
    totalHoursWorked: 6.2,
    status: 'Late',
    currentAssignment: 'Batch Washer 2',
  },
  {
    id: 'att-106',
    employeeId: 'CW-D301',
    employeeName: 'Alex Turner',
    locationId: 'loc-1',
    date: 'Sep 12, 2026',
    scheduledShift: '08:30 AM – 04:30 PM',
    clockInTime: '08:30 AM',
    clockOutTime: '04:45 PM',
    breakStartTime: '12:30 PM',
    breakEndTime: '01:00 PM',
    breakDurationMinutes: 30,
    totalHoursWorked: 7.7,
    status: 'Clocked Out',
    currentAssignment: 'Route A Delivery',
  },
  // Sep 11
  {
    id: 'att-107',
    employeeId: 'CW-E101',
    employeeName: 'Mary Jensen',
    locationId: 'loc-1',
    date: 'Sep 11, 2026',
    scheduledShift: '08:00 AM – 04:00 PM',
    clockInTime: '08:00 AM',
    clockOutTime: '05:30 PM',
    breakStartTime: '12:00 PM',
    breakEndTime: '12:30 PM',
    breakDurationMinutes: 30,
    totalHoursWorked: 9.0,
    status: 'Clocked Out',
    currentAssignment: 'Commercial Batch Finishing',
  },
  {
    id: 'att-108',
    employeeId: 'CW-C201',
    employeeName: 'Hilda Morales',
    locationId: 'loc-1',
    date: 'Sep 11, 2026',
    scheduledShift: '09:00 AM – 05:00 PM',
    clockInTime: '09:00 AM',
    clockOutTime: '05:00 PM',
    breakStartTime: '01:00 PM',
    breakEndTime: '01:30 PM',
    breakDurationMinutes: 30,
    totalHoursWorked: 7.5,
    status: 'Clocked Out',
    currentAssignment: 'Finishing Press',
  },
  // Sep 10
  {
    id: 'att-109',
    employeeId: 'CW-E101',
    employeeName: 'Mary Jensen',
    locationId: 'loc-1',
    date: 'Sep 10, 2026',
    scheduledShift: '08:00 AM – 04:00 PM',
    clockInTime: '08:00 AM',
    clockOutTime: '04:30 PM',
    breakStartTime: '12:00 PM',
    breakEndTime: '12:30 PM',
    breakDurationMinutes: 30,
    totalHoursWorked: 8.0,
    status: 'Clocked Out',
    currentAssignment: 'Intake Station',
  },
  {
    id: 'att-110',
    employeeId: 'CW-E102',
    employeeName: 'Anna Kowalski',
    locationId: 'loc-1',
    date: 'Sep 10, 2026',
    scheduledShift: '08:00 AM – 03:00 PM',
    clockInTime: '07:58 AM',
    clockOutTime: '03:00 PM',
    breakStartTime: '11:30 AM',
    breakEndTime: '12:00 PM',
    breakDurationMinutes: 30,
    totalHoursWorked: 6.5,
    status: 'Clocked Out',
    currentAssignment: 'Dryer Tumblers',
  },
  // Sep 9
  {
    id: 'att-111',
    employeeId: 'CW-E101',
    employeeName: 'Mary Jensen',
    locationId: 'loc-1',
    date: 'Sep 9, 2026',
    scheduledShift: '08:00 AM – 04:00 PM',
    clockInTime: '08:00 AM',
    clockOutTime: '04:30 PM',
    breakStartTime: '12:00 PM',
    breakEndTime: '12:30 PM',
    breakDurationMinutes: 30,
    totalHoursWorked: 8.0,
    status: 'Clocked Out',
    currentAssignment: 'Intake & Inspection',
  },
  {
    id: 'att-112',
    employeeId: 'CW-E103',
    employeeName: 'Dinees Patel',
    locationId: 'loc-1',
    date: 'Sep 9, 2026',
    scheduledShift: '07:00 AM – 03:00 PM',
    clockInTime: '07:00 AM',
    clockOutTime: '03:00 PM',
    breakStartTime: '11:00 AM',
    breakEndTime: '11:30 AM',
    breakDurationMinutes: 30,
    totalHoursWorked: 7.5,
    status: 'Clocked Out',
    currentAssignment: 'Sorting Area',
  },
  // Sep 8
  {
    id: 'att-113',
    employeeId: 'CW-E101',
    employeeName: 'Mary Jensen',
    locationId: 'loc-1',
    date: 'Sep 8, 2026',
    scheduledShift: '08:00 AM – 04:00 PM',
    clockInTime: '08:00 AM',
    clockOutTime: '04:30 PM',
    breakStartTime: '12:00 PM',
    breakEndTime: '12:30 PM',
    breakDurationMinutes: 30,
    totalHoursWorked: 8.0,
    status: 'Clocked Out',
    currentAssignment: 'Intake & Registration',
  },
  {
    id: 'att-114',
    employeeId: 'CW-E102',
    employeeName: 'Anna Kowalski',
    locationId: 'loc-1',
    date: 'Sep 8, 2026',
    scheduledShift: '08:00 AM – 03:00 PM',
    clockInTime: '08:00 AM',
    clockOutTime: '03:00 PM',
    breakStartTime: '11:30 AM',
    breakEndTime: '12:00 PM',
    breakDurationMinutes: 30,
    totalHoursWorked: 6.5,
    status: 'Clocked Out',
    currentAssignment: 'Chemical Dispenser',
  },
];

// Timesheets
export interface TimesheetDayRecord {
  date: string;
  day: string;
  clockIn: string;
  clockOut: string;
  breakMin: number;
  totalHours: number;
  hasException: boolean;
  exceptionNote?: string;
}

export interface Timesheet {
  id: string;
  employeeId: string;
  employeeName: string;
  locationId: string;
  locationName: string;
  payPeriod: string; // e.g., "Sep 1 – Sep 14, 2026"
  totalRegularHours: number;
  totalOvertimeHours: number;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Returned for Correction';
  submittedDate?: string;
  records: TimesheetDayRecord[];
  correctionNotes?: string;
  timeline: TimelineEntry[];
}

export const initialTimesheets: Timesheet[] = [
  {
    id: 'ts-101',
    employeeId: 'CW-E101',
    employeeName: 'Mary Jensen',
    locationId: 'loc-1',
    locationName: 'Clean Wave Express — Springfield',
    payPeriod: 'Sep 1 – Sep 14, 2026',
    totalRegularHours: 78.5,
    totalOvertimeHours: 2.0,
    status: 'Submitted',
    submittedDate: 'Sep 14, 2026',
    records: [
      { date: 'Sep 1', day: 'Mon', clockIn: '08:00 AM', clockOut: '04:30 PM', breakMin: 30, totalHours: 8.0, hasException: false },
      { date: 'Sep 2', day: 'Tue', clockIn: '08:00 AM', clockOut: '04:30 PM', breakMin: 30, totalHours: 8.0, hasException: false },
      { date: 'Sep 3', day: 'Wed', clockIn: '08:00 AM', clockOut: '05:00 PM', breakMin: 30, totalHours: 8.5, hasException: false },
      { date: 'Sep 4', day: 'Thu', clockIn: '08:00 AM', clockOut: '04:30 PM', breakMin: 30, totalHours: 8.0, hasException: false },
      { date: 'Sep 5', day: 'Fri', clockIn: '08:00 AM', clockOut: '04:30 PM', breakMin: 30, totalHours: 8.0, hasException: false },
      { date: 'Sep 8', day: 'Mon', clockIn: '08:00 AM', clockOut: '04:30 PM', breakMin: 30, totalHours: 8.0, hasException: false },
      { date: 'Sep 9', day: 'Tue', clockIn: '08:00 AM', clockOut: '04:30 PM', breakMin: 30, totalHours: 8.0, hasException: false },
      { date: 'Sep 10', day: 'Wed', clockIn: '08:00 AM', clockOut: '04:30 PM', breakMin: 30, totalHours: 8.0, hasException: false },
      { date: 'Sep 11', day: 'Thu', clockIn: '08:00 AM', clockOut: '05:30 PM', breakMin: 30, totalHours: 9.0, hasException: true, exceptionNote: 'Overtime authorized for rush commercial order' },
      { date: 'Sep 12', day: 'Fri', clockIn: '08:00 AM', clockOut: '04:30 PM', breakMin: 30, totalHours: 8.0, hasException: false },
      { date: 'Sep 14', day: 'Mon', clockIn: '08:00 AM', clockOut: '—', breakMin: 30, totalHours: 5.0, hasException: false },
    ],
    timeline: [
      { date: 'Sep 14, 2026 — 11:00 AM', actor: 'Mary Jensen', action: 'Timesheet submitted for review' },
    ],
  },
  {
    id: 'ts-102',
    employeeId: 'CW-E102',
    employeeName: 'Anna Kowalski',
    locationId: 'loc-1',
    locationName: 'Clean Wave Express — Springfield',
    payPeriod: 'Sep 1 – Sep 14, 2026',
    totalRegularHours: 68.0,
    totalOvertimeHours: 0.0,
    status: 'Submitted',
    submittedDate: 'Sep 14, 2026',
    records: [
      { date: 'Sep 1', day: 'Mon', clockIn: '08:00 AM', clockOut: '03:00 PM', breakMin: 30, totalHours: 6.5, hasException: false },
      { date: 'Sep 2', day: 'Tue', clockIn: '08:00 AM', clockOut: '03:00 PM', breakMin: 30, totalHours: 6.5, hasException: false },
      { date: 'Sep 3', day: 'Wed', clockIn: '08:00 AM', clockOut: '03:00 PM', breakMin: 30, totalHours: 6.5, hasException: false },
      { date: 'Sep 4', day: 'Thu', clockIn: '08:00 AM', clockOut: '03:00 PM', breakMin: 30, totalHours: 6.5, hasException: false },
      { date: 'Sep 5', day: 'Fri', clockIn: '08:00 AM', clockOut: '03:00 PM', breakMin: 30, totalHours: 6.5, hasException: false },
      { date: 'Sep 8', day: 'Mon', clockIn: '08:00 AM', clockOut: '03:00 PM', breakMin: 30, totalHours: 6.5, hasException: false },
      { date: 'Sep 9', day: 'Tue', clockIn: '08:00 AM', clockOut: '03:00 PM', breakMin: 30, totalHours: 6.5, hasException: false },
      { date: 'Sep 10', day: 'Wed', clockIn: '07:58 AM', clockOut: '03:00 PM', breakMin: 30, totalHours: 6.5, hasException: false },
      { date: 'Sep 11', day: 'Thu', clockIn: '08:00 AM', clockOut: '03:00 PM', breakMin: 30, totalHours: 6.5, hasException: false },
      { date: 'Sep 12', day: 'Fri', clockIn: '08:15 AM', clockOut: '03:00 PM', breakMin: 30, totalHours: 6.2, hasException: true, exceptionNote: 'Tardy arrival; approved by manager' },
      { date: 'Sep 13', day: 'Sat', clockIn: '07:55 AM', clockOut: '03:00 PM', breakMin: 30, totalHours: 6.5, hasException: false },
    ],
    timeline: [
      { date: 'Sep 14, 2026 — 9:30 AM', actor: 'Anna Kowalski', action: 'Timesheet submitted for approval' },
    ],
  },
  {
    id: 'ts-103',
    employeeId: 'CW-E103',
    employeeName: 'Dinees Patel',
    locationId: 'loc-1',
    locationName: 'Clean Wave Express — Springfield',
    payPeriod: 'Sep 1 – Sep 14, 2026',
    totalRegularHours: 54.0,
    totalOvertimeHours: 0.0,
    status: 'Submitted',
    submittedDate: 'Sep 14, 2026',
    records: [
      { date: 'Sep 1', day: 'Mon', clockIn: '07:00 AM', clockOut: '03:00 PM', breakMin: 30, totalHours: 7.5, hasException: false },
      { date: 'Sep 3', day: 'Wed', clockIn: '07:00 AM', clockOut: '03:00 PM', breakMin: 30, totalHours: 7.5, hasException: false },
      { date: 'Sep 5', day: 'Fri', clockIn: '07:00 AM', clockOut: '03:00 PM', breakMin: 30, totalHours: 7.5, hasException: false },
      { date: 'Sep 8', day: 'Mon', clockIn: '07:00 AM', clockOut: '03:00 PM', breakMin: 30, totalHours: 7.5, hasException: false },
      { date: 'Sep 9', day: 'Tue', clockIn: '07:00 AM', clockOut: '03:00 PM', breakMin: 30, totalHours: 7.5, hasException: false },
      { date: 'Sep 11', day: 'Thu', clockIn: '07:00 AM', clockOut: '03:00 PM', breakMin: 30, totalHours: 7.5, hasException: false },
      { date: 'Sep 13', day: 'Sat', clockIn: '03:00 PM', clockOut: '09:05 PM', breakMin: 30, totalHours: 5.5, hasException: false },
      { date: 'Sep 14', day: 'Sun', clockIn: '06:55 AM', clockOut: '03:05 PM', breakMin: 30, totalHours: 7.6, hasException: false },
    ],
    timeline: [
      { date: 'Sep 14, 2026 — 4:00 PM', actor: 'Dinees Patel', action: 'Timesheet submitted for review' },
    ],
  },
  {
    id: 'ts-104',
    employeeId: 'CW-C201',
    employeeName: 'Hilda Morales',
    locationId: 'loc-1',
    locationName: 'Clean Wave Express — Springfield',
    payPeriod: 'Sep 1 – Sep 14, 2026',
    totalRegularHours: 72.0,
    totalOvertimeHours: 4.5,
    status: 'Submitted',
    submittedDate: 'Sep 14, 2026',
    records: [
      { date: 'Sep 1', day: 'Mon', clockIn: '09:00 AM', clockOut: '05:00 PM', breakMin: 30, totalHours: 7.5, hasException: false },
      { date: 'Sep 2', day: 'Tue', clockIn: '09:00 AM', clockOut: '05:00 PM', breakMin: 30, totalHours: 7.5, hasException: false },
      { date: 'Sep 3', day: 'Wed', clockIn: '09:00 AM', clockOut: '05:00 PM', breakMin: 30, totalHours: 7.5, hasException: false },
      { date: 'Sep 4', day: 'Thu', clockIn: '09:00 AM', clockOut: '05:00 PM', breakMin: 30, totalHours: 7.5, hasException: false },
      { date: 'Sep 8', day: 'Mon', clockIn: '09:00 AM', clockOut: '05:00 PM', breakMin: 30, totalHours: 7.5, hasException: false },
      { date: 'Sep 9', day: 'Tue', clockIn: '09:00 AM', clockOut: '05:00 PM', breakMin: 30, totalHours: 7.5, hasException: false },
      { date: 'Sep 10', day: 'Wed', clockIn: '09:00 AM', clockOut: '05:00 PM', breakMin: 30, totalHours: 7.5, hasException: false },
      { date: 'Sep 11', day: 'Thu', clockIn: '09:00 AM', clockOut: '07:30 PM', breakMin: 30, totalHours: 10.0, hasException: true, exceptionNote: '2.5h OT authorized by Anita for commercial contract' },
      { date: 'Sep 12', day: 'Fri', clockIn: '09:00 AM', clockOut: '07:00 PM', breakMin: 30, totalHours: 9.5, hasException: true, exceptionNote: '2.0h OT authorized for evening spillover' },
      { date: 'Sep 14', day: 'Sun', clockIn: '09:05 AM', clockOut: '—', breakMin: 0, totalHours: 5.1, hasException: false },
    ],
    timeline: [
      { date: 'Sep 14, 2026 — 10:15 AM', actor: 'Hilda Morales', action: 'Timesheet submitted with overtime justification' },
    ],
  },
  {
    id: 'ts-105',
    employeeId: 'CW-D301',
    employeeName: 'Alex Turner',
    locationId: 'loc-1',
    locationName: 'Clean Wave Express — Springfield',
    payPeriod: 'Sep 1 – Sep 14, 2026',
    totalRegularHours: 64.0,
    totalOvertimeHours: 2.5,
    status: 'Approved',
    submittedDate: 'Sep 13, 2026',
    records: [
      { date: 'Sep 1', day: 'Mon', clockIn: '08:30 AM', clockOut: '04:30 PM', breakMin: 30, totalHours: 7.5, hasException: false },
      { date: 'Sep 2', day: 'Tue', clockIn: '08:30 AM', clockOut: '04:30 PM', breakMin: 30, totalHours: 7.5, hasException: false },
      { date: 'Sep 3', day: 'Wed', clockIn: '08:30 AM', clockOut: '04:30 PM', breakMin: 30, totalHours: 7.5, hasException: false },
      { date: 'Sep 4', day: 'Thu', clockIn: '08:30 AM', clockOut: '04:30 PM', breakMin: 30, totalHours: 7.5, hasException: false },
      { date: 'Sep 8', day: 'Mon', clockIn: '08:30 AM', clockOut: '04:30 PM', breakMin: 30, totalHours: 7.5, hasException: false },
      { date: 'Sep 10', day: 'Wed', clockIn: '08:30 AM', clockOut: '04:30 PM', breakMin: 30, totalHours: 7.5, hasException: false },
      { date: 'Sep 12', day: 'Fri', clockIn: '08:30 AM', clockOut: '07:00 PM', breakMin: 30, totalHours: 10.0, hasException: true, exceptionNote: 'Extended commercial pickup run' },
      { date: 'Sep 14', day: 'Sun', clockIn: '09:20 AM', clockOut: '—', breakMin: 0, totalHours: 4.8, hasException: true, exceptionNote: 'Late arrival due to traffic detour' },
    ],
    timeline: [
      { date: 'Sep 13, 2026 — 5:00 PM', actor: 'Alex Turner', action: 'Timesheet submitted' },
      { date: 'Sep 14, 2026 — 8:00 AM', actor: 'Anita Ramirez (Manager)', action: 'Timesheet approved' },
    ],
  },
  {
    id: 'ts-106',
    employeeId: 'CW-C202',
    employeeName: 'Mellisa Cruz',
    locationId: 'loc-1',
    locationName: 'Clean Wave Express — Springfield',
    payPeriod: 'Sep 1 – Sep 14, 2026',
    totalRegularHours: 58.0,
    totalOvertimeHours: 0.0,
    status: 'Returned for Correction',
    submittedDate: 'Sep 13, 2026',
    correctionNotes: 'Missing clock-out punch for Thursday Sep 11. Please confirm your actual departure time.',
    records: [
      { date: 'Sep 1', day: 'Mon', clockIn: '10:00 AM', clockOut: '06:00 PM', breakMin: 30, totalHours: 7.5, hasException: false },
      { date: 'Sep 3', day: 'Wed', clockIn: '10:00 AM', clockOut: '06:00 PM', breakMin: 30, totalHours: 7.5, hasException: false },
      { date: 'Sep 5', day: 'Fri', clockIn: '10:00 AM', clockOut: '06:00 PM', breakMin: 30, totalHours: 7.5, hasException: false },
      { date: 'Sep 8', day: 'Mon', clockIn: '10:00 AM', clockOut: '06:00 PM', breakMin: 30, totalHours: 7.5, hasException: false },
      { date: 'Sep 10', day: 'Wed', clockIn: '10:00 AM', clockOut: '06:00 PM', breakMin: 30, totalHours: 7.5, hasException: false },
      { date: 'Sep 11', day: 'Thu', clockIn: '10:00 AM', clockOut: '—', breakMin: 30, totalHours: 4.0, hasException: true, exceptionNote: 'Missing clock-out punch' },
      { date: 'Sep 14', day: 'Sun', clockIn: '10:00 AM', clockOut: '—', breakMin: 30, totalHours: 3.5, hasException: false },
    ],
    timeline: [
      { date: 'Sep 13, 2026 — 6:15 PM', actor: 'Mellisa Cruz', action: 'Timesheet submitted' },
      { date: 'Sep 14, 2026 — 9:00 AM', actor: 'Anita Ramirez (Manager)', action: 'Returned for correction: missing punch' },
    ],
  },
  {
    id: 'ts-107',
    employeeId: 'CW-E104',
    employeeName: 'Lucas Silva',
    locationId: 'loc-3',
    locationName: 'Riverside Laundry Center',
    payPeriod: 'Sep 1 – Sep 14, 2026',
    totalRegularHours: 76.0,
    totalOvertimeHours: 0.0,
    status: 'Approved',
    submittedDate: 'Sep 13, 2026',
    records: [
      { date: 'Sep 1', day: 'Mon', clockIn: '07:30 AM', clockOut: '03:30 PM', breakMin: 30, totalHours: 7.5, hasException: false },
      { date: 'Sep 2', day: 'Tue', clockIn: '07:30 AM', clockOut: '03:30 PM', breakMin: 30, totalHours: 7.5, hasException: false },
      { date: 'Sep 3', day: 'Wed', clockIn: '07:30 AM', clockOut: '03:30 PM', breakMin: 30, totalHours: 7.5, hasException: false },
      { date: 'Sep 4', day: 'Thu', clockIn: '07:30 AM', clockOut: '03:30 PM', breakMin: 30, totalHours: 7.5, hasException: false },
      { date: 'Sep 5', day: 'Fri', clockIn: '07:30 AM', clockOut: '03:30 PM', breakMin: 30, totalHours: 7.5, hasException: false },
      { date: 'Sep 8', day: 'Mon', clockIn: '07:30 AM', clockOut: '03:30 PM', breakMin: 30, totalHours: 7.5, hasException: false },
      { date: 'Sep 9', day: 'Tue', clockIn: '07:30 AM', clockOut: '03:30 PM', breakMin: 30, totalHours: 7.5, hasException: false },
      { date: 'Sep 10', day: 'Wed', clockIn: '07:30 AM', clockOut: '03:30 PM', breakMin: 30, totalHours: 7.5, hasException: false },
      { date: 'Sep 11', day: 'Thu', clockIn: '07:30 AM', clockOut: '03:30 PM', breakMin: 30, totalHours: 7.5, hasException: false },
      { date: 'Sep 12', day: 'Fri', clockIn: '07:30 AM', clockOut: '03:30 PM', breakMin: 30, totalHours: 7.5, hasException: false },
    ],
    timeline: [
      { date: 'Sep 13, 2026 — 4:00 PM', actor: 'Lucas Silva', action: 'Timesheet submitted' },
      { date: 'Sep 14, 2026 — 8:30 AM', actor: 'Marcus Chen (Manager)', action: 'Timesheet approved' },
    ],
  },
  {
    id: 'ts-108',
    employeeId: 'CW-E105',
    employeeName: 'Zoe Washington',
    locationId: 'loc-4',
    locationName: 'Northside Wash and Fold',
    payPeriod: 'Sep 1 – Sep 14, 2026',
    totalRegularHours: 42.0,
    totalOvertimeHours: 0.0,
    status: 'Submitted',
    submittedDate: 'Sep 14, 2026',
    records: [
      { date: 'Sep 1', day: 'Mon', clockIn: '01:00 PM', clockOut: '07:00 PM', breakMin: 30, totalHours: 5.5, hasException: false },
      { date: 'Sep 2', day: 'Tue', clockIn: '01:00 PM', clockOut: '07:00 PM', breakMin: 30, totalHours: 5.5, hasException: false },
      { date: 'Sep 3', day: 'Wed', clockIn: '01:00 PM', clockOut: '07:00 PM', breakMin: 30, totalHours: 5.5, hasException: false },
      { date: 'Sep 8', day: 'Mon', clockIn: '01:00 PM', clockOut: '07:00 PM', breakMin: 30, totalHours: 5.5, hasException: false },
      { date: 'Sep 9', day: 'Tue', clockIn: '01:00 PM', clockOut: '07:00 PM', breakMin: 30, totalHours: 5.5, hasException: false },
      { date: 'Sep 10', day: 'Wed', clockIn: '01:00 PM', clockOut: '07:00 PM', breakMin: 30, totalHours: 5.5, hasException: false },
    ],
    timeline: [
      { date: 'Sep 14, 2026 — 11:30 AM', actor: 'Zoe Washington', action: 'Timesheet submitted for review' },
    ],
  },
];

// Schedule and Shift Data
export interface ShiftAssignment {
  id: string;
  shiftTitle: string; // Morning, Afternoon, Evening, Night
  timeRange: string;
  day: string; // Mon, Tue, Wed, Thu, Fri, Sat, Sun
  date: string;
  locationId: string;
  locationName: string;
  assignedEmployeeId?: string;
  assignedEmployeeName?: string;
  roleRequired: string;
  isOpen: boolean;
  conflictWarning?: string;
  isOvertimeRisk?: boolean;
}

export const initialScheduleAssignments: ShiftAssignment[] = [
  {
    id: 'sh-1',
    shiftTitle: 'Morning Production Lead',
    timeRange: '8:00 AM – 4:00 PM',
    day: 'Mon',
    date: 'Sep 15',
    locationId: 'loc-1',
    locationName: 'Clean Wave Express — Springfield',
    assignedEmployeeId: 'CW-E101',
    assignedEmployeeName: 'Mary Jensen',
    roleRequired: 'Counter / Production',
    isOpen: false,
  },
  {
    id: 'sh-2',
    shiftTitle: 'Morning Washer Specialist',
    timeRange: '8:00 AM – 3:00 PM',
    day: 'Mon',
    date: 'Sep 15',
    locationId: 'loc-1',
    locationName: 'Clean Wave Express — Springfield',
    assignedEmployeeId: 'CW-E102',
    assignedEmployeeName: 'Anna Kowalski',
    roleRequired: 'Production Specialist',
    isOpen: false,
  },
  {
    id: 'sh-3',
    shiftTitle: 'Evening Closer',
    timeRange: '3:00 PM – 9:00 PM',
    day: 'Mon',
    date: 'Sep 15',
    locationId: 'loc-1',
    locationName: 'Clean Wave Express — Springfield',
    assignedEmployeeId: 'CW-E103',
    assignedEmployeeName: 'Dinees Patel',
    roleRequired: 'Production Associate',
    isOpen: false,
    conflictWarning: 'Solo shift: Single associate coverage between 5:00 PM and 9:00 PM.',
  },
  {
    id: 'sh-4',
    shiftTitle: 'Midday Commercial Batch',
    timeRange: '10:00 AM – 6:00 PM',
    day: 'Mon',
    date: 'Sep 15',
    locationId: 'loc-1',
    locationName: 'Clean Wave Express — Springfield',
    assignedEmployeeId: 'CW-C202',
    assignedEmployeeName: 'Mellisa Cruz',
    roleRequired: 'Production Contractor',
    isOpen: false,
    isOvertimeRisk: true,
  },
  {
    id: 'sh-5',
    shiftTitle: 'Morning Counter Assistant',
    timeRange: '8:30 AM – 2:30 PM',
    day: 'Tue',
    date: 'Sep 16',
    locationId: 'loc-1',
    locationName: 'Clean Wave Express — Springfield',
    roleRequired: 'Counter Associate',
    isOpen: true,
  },
  {
    id: 'sh-6',
    shiftTitle: 'Evening Intake & Fold',
    timeRange: '4:00 PM – 9:30 PM',
    day: 'Wed',
    date: 'Sep 17',
    locationId: 'loc-1',
    locationName: 'Clean Wave Express — Springfield',
    roleRequired: 'Production Associate',
    isOpen: true,
  },
];
// @ts-nocheck — verbatim local-preview code from LaundryAI - Copy.zip.
