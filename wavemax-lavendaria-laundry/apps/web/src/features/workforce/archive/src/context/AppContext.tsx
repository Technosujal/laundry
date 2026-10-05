// @ts-nocheck
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import {
  mockUsers,
  initialEmployeeDirectory,
  initialNotifications,
  initialRegistrations,
  initialLeaveBalances,
  initialLeaveRequests,
  initialAttendanceRecords,
  initialTimesheets,
  initialScheduleAssignments,
  type AppRole,
  type UserProfile,
  type DirectoryEmployee,
  type AppNotification,
  type RegistrationApplication,
  type LeaveBalance,
  type LeaveRequest,
  type AttendancePunch,
  type Timesheet,
  type ShiftAssignment,
} from '../data/workforceData';

export type Role = AppRole;

interface AppState {
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  role: Role;
  setRole: (role: Role) => void;
  location: string;
  setLocation: (location: string) => void;
  reportingPeriod: string;
  setReportingPeriod: (period: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  // Auth actions
  login: (user: UserProfile) => void;
  logout: () => void;
  loginAs: (role: AppRole) => void;

  // Workforce collections
  employeeDirectory: DirectoryEmployee[];
  notifications: AppNotification[];
  unreadNotificationCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  addNotification: (notif: Partial<AppNotification> & { title: string; message: string; type: AppNotification['type']; targetRole: AppRole[] }) => void;

  // Registrations
  registrations: RegistrationApplication[];
  submitRegistration: (data: {
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
  }) => string;
  approveRegistration: (id: string) => void;
  rejectRegistration: (id: string, reason: string) => void;
  clarifyRegistration: (id: string, message: string) => void;

  // Leave & Time Off
  leaveBalances: Record<string, LeaveBalance[]>;
  leaveRequests: LeaveRequest[];
  submitLeaveRequest: (req: {
    leaveType: LeaveRequest['leaveType'];
    startDate: string;
    endDate: string;
    daysCount: number;
    isPartialDay?: boolean;
    reason: string;
  }) => void;
  approveLeaveRequest: (id: string, note?: string) => void;
  rejectLeaveRequest: (id: string, reason: string) => void;
  clarifyLeaveRequest: (id: string, message: string) => void;

  // Attendance
  attendanceRecords: AttendancePunch[];
  currentPunchStatus: {
    status: 'Clocked In' | 'On Break' | 'Clocked Out';
    clockInTime?: string;
    breakStartTime?: string;
    totalBreakMinutes: number;
  };
  clockIn: (assignment?: string) => void;
  startBreak: () => void;
  endBreak: () => void;
  clockOut: () => void;

  // Timesheets
  timesheets: Timesheet[];
  submitTimesheet: (id: string) => void;
  approveTimesheet: (id: string) => void;
  returnTimesheet: (id: string, reason: string) => void;

  // Scheduling
  schedules: ShiftAssignment[];
  assignShift: (shiftId: string, empId: string, empName: string) => void;
  markShiftOpen: (shiftId: string) => void;
  publishSchedule: () => void;

  // Prototype Reset
  resetPrototypeData: () => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

const STORAGE_KEYS = {
  USER: 'cw_current_user',
  AUTH: 'cw_is_authenticated',
  NOTIFS: 'cw_notifications',
  REGS: 'cw_registrations',
  DIR: 'cw_directory',
  LEAVE_REQ: 'cw_leave_requests',
  LEAVE_BAL: 'cw_leave_balances',
  ATTENDANCE: 'cw_attendance',
  TIMESHEETS: 'cw_timesheets',
  SCHEDULES: 'cw_schedules',
  PUNCH: 'cw_punch_status',
  LOCATION: 'cw_location',
  PERIOD: 'cw_period',
};

function loadStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveStorage<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    // Ignore storage quota errors in prototype
  }
}

export function AppProvider({ children, previewRole = 'owner' }: { children: ReactNode; previewRole?: AppRole }) {
  // Auth state - default authenticated as Eleanor Vance (Owner) for immediate demo if stored, else fallback
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() =>
    mockUsers.find((user) => user.role === previewRole) ?? mockUsers[0]
  );
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() =>
    true
  );

  useEffect(() => {
    setCurrentUser(mockUsers.find((user) => user.role === previewRole) ?? mockUsers[0]);
  }, [previewRole]);

  const [location, setLocationState] = useState<string>(() =>
    loadStorage<string>(STORAGE_KEYS.LOCATION, 'loc-1')
  );
  const [reportingPeriod, setReportingPeriodState] = useState<string>(() =>
    loadStorage<string>(STORAGE_KEYS.PERIOD, 'today')
  );
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Workforce collections
  const [employeeDirectory, setEmployeeDirectory] = useState<DirectoryEmployee[]>(() =>
    loadStorage(STORAGE_KEYS.DIR, initialEmployeeDirectory)
  );
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    loadStorage(STORAGE_KEYS.NOTIFS, initialNotifications)
  );
  const [registrations, setRegistrations] = useState<RegistrationApplication[]>(() =>
    loadStorage(STORAGE_KEYS.REGS, initialRegistrations)
  );
  const [leaveBalances, setLeaveBalances] = useState<Record<string, LeaveBalance[]>>(() =>
    loadStorage(STORAGE_KEYS.LEAVE_BAL, initialLeaveBalances)
  );
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() =>
    loadStorage(STORAGE_KEYS.LEAVE_REQ, initialLeaveRequests)
  );
  const [attendanceRecords, setAttendanceRecords] = useState<AttendancePunch[]>(() => {
    const loaded = loadStorage(STORAGE_KEYS.ATTENDANCE, initialAttendanceRecords);
    return loaded.map(rec => ({
      ...rec,
      employeeName: rec.employeeName || (rec as any).name || 'Staff Member',
    }));
  });
  const [timesheets, setTimesheets] = useState<Timesheet[]>(() =>
    loadStorage(STORAGE_KEYS.TIMESHEETS, initialTimesheets)
  );
  const [schedules, setSchedules] = useState<ShiftAssignment[]>(() =>
    loadStorage(STORAGE_KEYS.SCHEDULES, initialScheduleAssignments)
  );
  const [currentPunchStatus, setCurrentPunchStatus] = useState<{
    status: 'Clocked In' | 'On Break' | 'Clocked Out';
    clockInTime?: string;
    breakStartTime?: string;
    totalBreakMinutes: number;
  }>(() =>
    loadStorage(STORAGE_KEYS.PUNCH, {
      status: 'Clocked In',
      clockInTime: '08:00 AM',
      totalBreakMinutes: 30,
    })
  );

  // Sync to local storage
  useEffect(() => { saveStorage(STORAGE_KEYS.USER, currentUser); }, [currentUser]);
  useEffect(() => { saveStorage(STORAGE_KEYS.AUTH, isAuthenticated); }, [isAuthenticated]);
  useEffect(() => { saveStorage(STORAGE_KEYS.DIR, employeeDirectory); }, [employeeDirectory]);
  useEffect(() => { saveStorage(STORAGE_KEYS.NOTIFS, notifications); }, [notifications]);
  useEffect(() => { saveStorage(STORAGE_KEYS.REGS, registrations); }, [registrations]);
  useEffect(() => { saveStorage(STORAGE_KEYS.LEAVE_BAL, leaveBalances); }, [leaveBalances]);
  useEffect(() => { saveStorage(STORAGE_KEYS.LEAVE_REQ, leaveRequests); }, [leaveRequests]);
  useEffect(() => { saveStorage(STORAGE_KEYS.ATTENDANCE, attendanceRecords); }, [attendanceRecords]);
  useEffect(() => { saveStorage(STORAGE_KEYS.TIMESHEETS, timesheets); }, [timesheets]);
  useEffect(() => { saveStorage(STORAGE_KEYS.SCHEDULES, schedules); }, [schedules]);
  useEffect(() => { saveStorage(STORAGE_KEYS.PUNCH, currentPunchStatus); }, [currentPunchStatus]);

  const setLocation = (loc: string) => {
    setLocationState(loc);
    saveStorage(STORAGE_KEYS.LOCATION, loc);
  };

  const setReportingPeriod = (p: string) => {
    setReportingPeriodState(p);
    saveStorage(STORAGE_KEYS.PERIOD, p);
  };

  const role: Role = currentUser ? currentUser.role : 'owner';
  const visibleEmployeeIds = new Set(
    role === 'owner'
      ? employeeDirectory.map((person) => person.employeeId)
      : role === 'manager'
        ? employeeDirectory.filter((person) => person.managerName === currentUser?.name).map((person) => person.employeeId)
        : currentUser?.employeeId ? [currentUser.employeeId] : []
  );
  const visibleDirectory = role === 'owner'
    ? employeeDirectory
    : employeeDirectory.filter((person) => visibleEmployeeIds.has(person.employeeId));
  const visibleAttendance = role === 'owner'
    ? attendanceRecords
    : attendanceRecords.filter((record) => visibleEmployeeIds.has(record.employeeId));
  const visibleTimesheets = role === 'owner'
    ? timesheets
    : timesheets.filter((record) => visibleEmployeeIds.has(record.employeeId));
  const visibleLeave = role === 'owner'
    ? leaveRequests
    : leaveRequests.filter((record) => visibleEmployeeIds.has(record.employeeId));
  const visibleSchedules = role === 'owner'
    ? schedules
    : schedules.filter((shift) =>
        (shift.assignedEmployeeId && visibleEmployeeIds.has(shift.assignedEmployeeId)) ||
        (shift.isOpen && currentUser?.locationIds.includes(shift.locationId))
      );

  const setRole = (newRole: Role) => {
    // Switch active user to mock persona for that role
    const matched = mockUsers.find((u) => u.role === newRole) || mockUsers[0];
    setCurrentUser(matched);
  };

  const login = (user: UserProfile) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEYS.AUTH);
    localStorage.removeItem(STORAGE_KEYS.USER);
  };

  const loginAs = (targetRole: AppRole) => {
    let user: UserProfile;
    if (targetRole === 'owner') user = mockUsers[0];
    else if (targetRole === 'manager') user = mockUsers[1]; // Anita
    else user = mockUsers[3]; // Mary Jensen
    login(user);
  };

  // Notifications
  const unreadNotificationCount = notifications.filter((n) => {
    if (n.read) return false;
    if (!currentUser) return false;
    return n.targetRole.includes(currentUser.role);
  }).length;

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const addNotification = (notif: Partial<AppNotification> & { title: string; message: string; type: AppNotification['type']; targetRole: AppRole[] }) => {
    const newN: AppNotification = {
      id: `notif-${Date.now()}`,
      title: notif.title,
      message: notif.message,
      type: notif.type,
      targetRole: notif.targetRole,
      targetLocationIds: notif.targetLocationIds,
      linkPath: notif.linkPath,
      timestamp: 'Just now',
      read: false,
      actionRequired: notif.actionRequired,
    };
    setNotifications((prev) => [newN, ...prev]);
  };

  // Registrations
  const submitRegistration = (data: {
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
  }): string => {
    const refNumber = `REG-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const isManager = data.requestedRole === 'Manager';
    const newReg: RegistrationApplication = {
      id: `reg-${Date.now()}`,
      refNumber,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      requestedRole: data.requestedRole,
      requestedLocationIds: data.requestedLocationIds,
      requestedLocationNames: data.requestedLocationNames,
      employmentType: data.employmentType,
      preferredShift: data.preferredShift,
      proposedStartDate: data.proposedStartDate,
      message: data.message,
      submittedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'Pending Approval',
      assignedApproverRole: isManager ? 'owner' : 'manager',
      approvalTimeline: [
        {
          date: `${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} — ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          actor: 'Applicant',
          action: `${data.requestedRole} application submitted online`,
          note: isManager ? 'Routed to Executive Owner' : `Routed to Manager for ${data.requestedLocationNames.join(', ')}`,
        },
      ],
    };

    setRegistrations((prev) => [newReg, ...prev]);

    // Create In-App notification for the approver
    addNotification({
      type: 'registration',
      title: `New ${data.requestedRole} Registration Submitted`,
      message: `${data.fullName} has registered as ${data.requestedRole} for ${data.requestedLocationNames.join(', ')}. Pending review.`,
      targetRole: isManager ? ['owner'] : ['manager'],
      targetLocationIds: data.requestedLocationIds,
      linkPath: '/workforce/registrations',
      actionRequired: true,
    });

    return refNumber;
  };

  const approveRegistration = (id: string) => {
    const reg = registrations.find((r) => r.id === id);
    if (!reg) return;

    const nowStr = `${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} — ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    setRegistrations((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'Approved',
              approvalTimeline: [
                ...r.approvalTimeline,
                {
                  date: nowStr,
                  actor: currentUser ? currentUser.name : 'Approver',
                  action: 'Registration Approved',
                  note: 'Account provisioned into organization directory.',
                },
              ],
            }
          : r
      )
    );

    // Add to Employee Directory
    const newDirEmp: DirectoryEmployee = {
      id: `dir-${Date.now()}`,
      employeeId: `CW-${reg.requestedRole === 'Manager' ? 'M' : 'E'}${Math.floor(100 + Math.random() * 899)}`,
      name: reg.fullName,
      role: reg.requestedRole === 'Manager' ? 'Store Operations Manager' : 'Production Associate',
      employmentType: reg.employmentType,
      primaryLocationId: reg.requestedLocationIds[0] || 'loc-1',
      primaryLocationName: reg.requestedLocationNames[0] || 'Clean Wave Express — Springfield',
      currentShift: `${reg.preferredShift} Shift`,
      status: 'Active',
      startDate: reg.proposedStartDate,
      managerName: reg.requestedRole === 'Manager' ? 'Eleanor Vance' : 'Anita Ramirez',
      email: reg.email,
      phone: reg.phone,
    };
    setEmployeeDirectory((prev) => [newDirEmp, ...prev]);

    // Notify applicant & system
    addNotification({
      type: 'registration',
      title: 'Registration Approved',
      message: `Registration for ${reg.fullName} has been approved. Welcome to Clean Wave!`,
      targetRole: ['owner', 'manager', 'employee'],
      linkPath: '/workforce/directory',
    });
  };

  const rejectRegistration = (id: string, reason: string) => {
    const reg = registrations.find((r) => r.id === id);
    if (!reg) return;

    const nowStr = `${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} — ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    setRegistrations((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'Rejected',
              approvalTimeline: [
                ...r.approvalTimeline,
                {
                  date: nowStr,
                  actor: currentUser ? currentUser.name : 'Approver',
                  action: 'Registration Rejected',
                  note: reason,
                },
              ],
            }
          : r
      )
    );

    addNotification({
      type: 'registration',
      title: 'Registration Rejected',
      message: `Application for ${reg.fullName} was rejected. Reason: ${reason}`,
      targetRole: ['owner', 'manager'],
      linkPath: '/workforce/registrations',
    });
  };

  const clarifyRegistration = (id: string, message: string) => {
    const reg = registrations.find((r) => r.id === id);
    if (!reg) return;

    const nowStr = `${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} — ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    setRegistrations((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'Clarification Requested',
              approvalTimeline: [
                ...r.approvalTimeline,
                {
                  date: nowStr,
                  actor: currentUser ? currentUser.name : 'Approver',
                  action: 'Clarification Requested',
                  note: message,
                },
              ],
            }
          : r
      )
    );

    addNotification({
      type: 'registration',
      title: 'Clarification Requested on Registration',
      message: `Applicant ${reg.fullName} requested for clarification: "${message}"`,
      targetRole: ['owner', 'manager'],
      linkPath: '/workforce/registrations',
    });
  };

  // Leave Management
  const submitLeaveRequest = (req: {
    leaveType: LeaveRequest['leaveType'];
    startDate: string;
    endDate: string;
    daysCount: number;
    isPartialDay?: boolean;
    reason: string;
  }) => {
    const empId = currentUser?.employeeId || 'CW-E101';
    const empName = currentUser?.name || 'Mary Jensen';
    const nowStr = `${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} — ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const newReq: LeaveRequest = {
      id: `lr-${Date.now()}`,
      employeeId: empId,
      employeeName: empName,
      locationId: currentUser?.locationIds[0] || 'loc-1',
      locationName: 'Clean Wave Express — Springfield',
      leaveType: req.leaveType,
      startDate: req.startDate,
      endDate: req.endDate,
      daysCount: req.daysCount,
      isPartialDay: req.isPartialDay,
      reason: req.reason,
      submittedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'Pending',
      coverageImpact: req.daysCount > 1 ? 'High Risk' : 'Moderate',
      timeline: [
        {
          date: nowStr,
          actor: empName,
          action: 'Leave request submitted',
        },
      ],
    };

    setLeaveRequests((prev) => [newReq, ...prev]);

    // Update pending balance
    setLeaveBalances((prev) => {
      const userBals = prev[empId] || [];
      const updated = userBals.map((b) =>
        b.type === req.leaveType ? { ...b, pendingDays: b.pendingDays + req.daysCount } : b
      );
      return { ...prev, [empId]: updated };
    });

    // Notify Manager
    addNotification({
      type: 'leave',
      title: `Leave Request: ${empName} (${req.leaveType})`,
      message: `${empName} requested ${req.daysCount} day(s) off from ${req.startDate} to ${req.endDate}. Coverage check recommended.`,
      targetRole: ['manager'],
      targetLocationIds: currentUser?.locationIds,
      linkPath: '/workforce/leave',
      actionRequired: true,
    });
  };

  const approveLeaveRequest = (id: string, note?: string) => {
    const req = leaveRequests.find((r) => r.id === id);
    if (!req) return;

    const nowStr = `${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} — ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    setLeaveRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'Approved',
              approverNote: note || 'Approved by Manager',
              timeline: [
                ...r.timeline,
                {
                  date: nowStr,
                  actor: currentUser ? currentUser.name : 'Manager',
                  action: 'Leave Approved',
                  note: note || 'Approved with shift coverage adjustments.',
                },
              ],
            }
          : r
      )
    );

    // Update leave balance
    setLeaveBalances((prev) => {
      const userBals = prev[req.employeeId] || [];
      const updated = userBals.map((b) =>
        b.type === req.leaveType
          ? {
              ...b,
              availableDays: Math.max(0, b.availableDays - req.daysCount),
              usedDays: b.usedDays + req.daysCount,
              pendingDays: Math.max(0, b.pendingDays - req.daysCount),
            }
          : b
      );
      return { ...prev, [req.employeeId]: updated };
    });

    // Notify Employee
    addNotification({
      type: 'leave',
      title: 'Leave Request Approved',
      message: `Your ${req.leaveType} request for ${req.startDate} (${req.daysCount} day) was approved.`,
      targetRole: ['employee'],
      linkPath: '/workforce/leave',
    });
  };

  const rejectLeaveRequest = (id: string, reason: string) => {
    const req = leaveRequests.find((r) => r.id === id);
    if (!req) return;

    const nowStr = `${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} — ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    setLeaveRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'Rejected',
              timeline: [
                ...r.timeline,
                {
                  date: nowStr,
                  actor: currentUser ? currentUser.name : 'Manager',
                  action: 'Leave Rejected',
                  note: reason,
                },
              ],
            }
          : r
      )
    );

    // Release pending balance
    setLeaveBalances((prev) => {
      const userBals = prev[req.employeeId] || [];
      const updated = userBals.map((b) =>
        b.type === req.leaveType ? { ...b, pendingDays: Math.max(0, b.pendingDays - req.daysCount) } : b
      );
      return { ...prev, [req.employeeId]: updated };
    });

    addNotification({
      type: 'leave',
      title: 'Leave Request Declined',
      message: `Your ${req.leaveType} request for ${req.startDate} was declined: ${reason}`,
      targetRole: ['employee'],
      linkPath: '/workforce/leave',
    });
  };

  const clarifyLeaveRequest = (id: string, message: string) => {
    const req = leaveRequests.find((r) => r.id === id);
    if (!req) return;

    const nowStr = `${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} — ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    setLeaveRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'Clarification Requested',
              timeline: [
                ...r.timeline,
                {
                  date: nowStr,
                  actor: currentUser ? currentUser.name : 'Manager',
                  action: 'Clarification Requested',
                  note: message,
                },
              ],
            }
          : r
      )
    );

    addNotification({
      type: 'leave',
      title: 'Clarification Needed on Leave Request',
      message: `Manager note on your leave request: "${message}"`,
      targetRole: ['employee'],
      linkPath: '/workforce/leave',
    });
  };

  // Attendance Punch Clock
  const clockIn = (assignment = 'General Wash & Fold Line') => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const empId = currentUser?.employeeId || 'CW-E101';
    const empName = currentUser?.name || 'Mary Jensen';

    setCurrentPunchStatus({
      status: 'Clocked In',
      clockInTime: timeStr,
      totalBreakMinutes: 0,
    });

    // Add to attendance records
    const newPunch: AttendancePunch = {
      id: `att-${Date.now()}`,
      employeeId: empId,
      employeeName: empName,
      locationId: currentUser?.locationIds[0] || 'loc-1',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      clockInTime: timeStr,
      breakDurationMinutes: 0,
      totalHoursWorked: 0.1,
      status: 'Clocked In',
      currentAssignment: assignment,
    };
    setAttendanceRecords((prev) => [newPunch, ...prev.filter((p) => p.employeeId !== empId)]);
  };

  const startBreak = () => {
    if (currentPunchStatus.status !== 'Clocked In') return;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setCurrentPunchStatus((prev) => ({
      ...prev,
      status: 'On Break',
      breakStartTime: timeStr,
    }));
  };

  const endBreak = () => {
    if (currentPunchStatus.status !== 'On Break') return;
    setCurrentPunchStatus((prev) => ({
      ...prev,
      status: 'Clocked In',
      breakStartTime: undefined,
      totalBreakMinutes: prev.totalBreakMinutes + 15,
    }));
  };

  const clockOut = () => {
    if (currentPunchStatus.status === 'Clocked Out') return;
    setCurrentPunchStatus({
      status: 'Clocked Out',
      clockInTime: undefined,
      breakStartTime: undefined,
      totalBreakMinutes: 0,
    });
  };

  // Timesheets
  const submitTimesheet = (id: string) => {
    const nowStr = `${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} — ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    setTimesheets((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status: 'Submitted',
              submittedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              timeline: [
                ...t.timeline,
                { date: nowStr, actor: currentUser?.name || 'Employee', action: 'Timesheet submitted' },
              ],
            }
          : t
      )
    );

    addNotification({
      type: 'timesheet',
      title: 'Timesheet Submitted for Approval',
      message: `${currentUser?.name || 'Employee'} submitted timesheet for pay period.`,
      targetRole: ['manager'],
      linkPath: '/workforce/timesheets',
      actionRequired: true,
    });
  };

  const approveTimesheet = (id: string) => {
    const nowStr = `${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} — ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const ts = timesheets.find((t) => t.id === id);
    setTimesheets((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status: 'Approved',
              timeline: [
                ...t.timeline,
                { date: nowStr, actor: currentUser?.name || 'Manager', action: 'Timesheet approved' },
              ],
            }
          : t
      )
    );

    if (ts) {
      addNotification({
        type: 'timesheet',
        title: 'Timesheet Approved',
        message: `Your timesheet for ${ts.payPeriod} was approved.`,
        targetRole: ['employee'],
        linkPath: '/workforce/timesheets',
      });
    }
  };

  const returnTimesheet = (id: string, reason: string) => {
    const nowStr = `${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} — ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const ts = timesheets.find((t) => t.id === id);
    setTimesheets((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status: 'Returned for Correction',
              correctionNotes: reason,
              timeline: [
                ...t.timeline,
                { date: nowStr, actor: currentUser?.name || 'Manager', action: 'Timesheet returned', note: reason },
              ],
            }
          : t
      )
    );

    if (ts) {
      addNotification({
        type: 'timesheet',
        title: 'Timesheet Returned for Correction',
        message: `Your timesheet was returned: ${reason}`,
        targetRole: ['employee'],
        linkPath: '/workforce/timesheets',
      });
    }
  };

  // Scheduling
  const assignShift = (shiftId: string, empId: string, empName: string) => {
    setSchedules((prev) =>
      prev.map((s) =>
        s.id === shiftId
          ? {
              ...s,
              assignedEmployeeId: empId,
              assignedEmployeeName: empName,
              isOpen: false,
            }
          : s
      )
    );

    addNotification({
      type: 'schedule',
      title: 'Shift Assignment Updated',
      message: `${empName} assigned to shift.`,
      targetRole: ['employee', 'manager'],
      linkPath: '/workforce/scheduling',
    });
  };

  const markShiftOpen = (shiftId: string) => {
    setSchedules((prev) =>
      prev.map((s) =>
        s.id === shiftId
          ? {
              ...s,
              assignedEmployeeId: undefined,
              assignedEmployeeName: undefined,
              isOpen: true,
            }
          : s
      )
    );
  };

  const publishSchedule = () => {
    addNotification({
      type: 'schedule',
      title: 'Weekly Schedule Published',
      message: 'Store manager published the upcoming weekly roster for all stations.',
      targetRole: ['employee', 'manager', 'owner'],
      linkPath: '/workforce/scheduling',
    });
  };

  // Reset Prototype
  const resetPrototypeData = () => {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    setEmployeeDirectory(initialEmployeeDirectory);
    setNotifications(initialNotifications);
    setRegistrations(initialRegistrations);
    setLeaveBalances(initialLeaveBalances);
    setLeaveRequests(initialLeaveRequests);
    setAttendanceRecords(initialAttendanceRecords);
    setTimesheets(initialTimesheets);
    setSchedules(initialScheduleAssignments);
    setCurrentPunchStatus({
      status: 'Clocked In',
      clockInTime: '08:00 AM',
      totalBreakMinutes: 30,
    });
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        role,
        setRole,
        location,
        setLocation,
        reportingPeriod,
        setReportingPeriod,
        sidebarOpen,
        setSidebarOpen,
        login,
        logout,
        loginAs,
        employeeDirectory: visibleDirectory,
        notifications,
        unreadNotificationCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        addNotification,
        registrations,
        submitRegistration,
        approveRegistration,
        rejectRegistration,
        clarifyRegistration,
        leaveBalances,
        leaveRequests: visibleLeave,
        submitLeaveRequest,
        approveLeaveRequest,
        rejectLeaveRequest,
        clarifyLeaveRequest,
        attendanceRecords: visibleAttendance,
        currentPunchStatus,
        clockIn,
        startBreak,
        endBreak,
        clockOut,
        timesheets: visibleTimesheets,
        submitTimesheet,
        approveTimesheet,
        returnTimesheet,
        schedules: visibleSchedules,
        assignShift,
        markShiftOpen,
        publishSchedule,
        resetPrototypeData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
}
// @ts-nocheck — verbatim local-preview code from LaundryAI - Copy.zip.
