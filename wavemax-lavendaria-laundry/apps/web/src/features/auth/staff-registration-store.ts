export interface EmployeeRegistration {
  id: string;
  requestIdNumber: number;
  fullName: string;
  username: string;
  email: string;
  password?: string | undefined;
  station: string;
  stationGeofence: string;
  role: "EMPLOYEE";
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  rejectionReason: string | null;
  notes?: string | undefined;
}

export interface DispatchedEmail {
  id: string;
  recipient: string;
  recipientRole: "MANAGER" | "EMPLOYEE";
  subject: string;
  previewText: string;
  sentAt: string;
  read: boolean;
  registrationId: string;
  actionUrls: {
    approveUrl: string;
    rejectUrl: string;
  } | null;
  applicant: {
    fullName: string;
    username: string;
    station: string;
    requestIdNumber: number;
  };
  details: {
    status: "PENDING" | "APPROVED" | "REJECTED";
    notes?: string | undefined;
  };
}

const STORAGE_KEY_REGISTRATIONS = "wavemax.employee-registrations.v1";
const STORAGE_KEY_EMAILS = "wavemax.dispatched-emails.v1";
const STORAGE_KEY_CURRENT_REGISTRATION = "wavemax.active-registration-id.v1";

export const STATIONS = [
  "Commercial Wash Bay",
  "Drop-off & Intake Counter",
  "Dryer Quad B",
  "Folding & Packaging Station",
  "Self-Service Attendant Bay",
  "Inventory & Chemical Dispenser",
] as const;

export type StationName = (typeof STATIONS)[number];

const INITIAL_REGISTRATIONS: EmployeeRegistration[] = [
  {
    id: "REG-355",
    requestIdNumber: 355,
    fullName: "dd d",
    username: "we2",
    email: "we2@wavemaxstaff.com",
    station: "Commercial Wash Bay",
    stationGeofence: "Store #104 - Terminal Bay #2 (Geofence Verified)",
    role: "EMPLOYEE",
    status: "PENDING",
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    reviewedAt: null,
    reviewedBy: null,
    rejectionReason: null,
    notes: "Assigned to Morning Commercial Wash & Sanitization bay.",
  },
  {
    id: "REG-354",
    requestIdNumber: 354,
    fullName: "Marcus Vance",
    username: "mvance",
    email: "mvance@wavemaxstaff.com",
    station: "Drop-off & Intake Counter",
    stationGeofence: "Store #104 - Front POS (Geofence Verified)",
    role: "EMPLOYEE",
    status: "APPROVED",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    reviewedAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    reviewedBy: "Store Manager",
    rejectionReason: null,
    notes: "Transferred from Austin branch.",
  },
];

function generateManagerEmail(reg: EmployeeRegistration): DispatchedEmail {
  return {
    id: `email-${reg.id}-${Date.now()}`,
    recipient: "manager@wavemaxlaundry.com",
    recipientRole: "MANAGER",
    subject: `Action Required: New Employee Registration Request (#${reg.requestIdNumber} - ${reg.fullName})`,
    previewText: `New staff onboarding request for station: ${reg.station}. Authorization required to grant terminal access.`,
    sentAt: new Date().toISOString(),
    read: false,
    registrationId: reg.id,
    actionUrls: {
      approveUrl: `#manager-approvals?id=${reg.id}&action=approve`,
      rejectUrl: `#manager-approvals?id=${reg.id}&action=reject`,
    },
    applicant: {
      fullName: reg.fullName,
      username: reg.username,
      station: reg.station,
      requestIdNumber: reg.requestIdNumber,
    },
    details: {
      status: "PENDING",
      notes: reg.notes,
    },
  };
}

function generateEmployeeDecisionEmail(
  reg: EmployeeRegistration,
  approved: boolean,
  reason?: string,
): DispatchedEmail {
  return {
    id: `email-emp-${reg.id}-${Date.now()}`,
    recipient: reg.email,
    recipientRole: "EMPLOYEE",
    subject: approved
      ? `Registration Approved - Welcome to Wavemax (#${reg.requestIdNumber})`
      : `Registration Update - Manager Review Decision (#${reg.requestIdNumber})`,
    previewText: approved
      ? `Your registration has been approved. You may now sign in to your terminal at ${reg.station}.`
      : `Your registration request was not approved at this time: ${reason ?? "Manager review completed."}`,
    sentAt: new Date().toISOString(),
    read: false,
    registrationId: reg.id,
    actionUrls: approved
      ? {
          approveUrl: "#staff-login",
          rejectUrl: "",
        }
      : null,
    applicant: {
      fullName: reg.fullName,
      username: reg.username,
      station: reg.station,
      requestIdNumber: reg.requestIdNumber,
    },
    details: {
      status: approved ? "APPROVED" : "REJECTED",
      notes: reason,
    },
  };
}

export function loadRegistrations(): EmployeeRegistration[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_REGISTRATIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as EmployeeRegistration[];
      }
    }
  } catch {
    // fallback
  }
  saveRegistrations(INITIAL_REGISTRATIONS);
  return INITIAL_REGISTRATIONS;
}

export function saveRegistrations(regs: EmployeeRegistration[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY_REGISTRATIONS, JSON.stringify(regs));
  } catch {
    // ignore
  }
}

export function loadEmails(): DispatchedEmail[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_EMAILS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed as DispatchedEmail[];
      }
    }
  } catch {
    // fallback
  }
  // Initialize with initial manager email for reg 355
  const initial = [generateManagerEmail(INITIAL_REGISTRATIONS[0]!)];
  saveEmails(initial);
  return initial;
}

export function saveEmails(emails: DispatchedEmail[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY_EMAILS, JSON.stringify(emails));
  } catch {
    // ignore
  }
}

export function getActiveRegistrationId(): string {
  try {
    return window.localStorage.getItem(STORAGE_KEY_CURRENT_REGISTRATION) || "REG-355";
  } catch {
    return "REG-355";
  }
}

export function setActiveRegistrationId(id: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY_CURRENT_REGISTRATION, id);
  } catch {
    // ignore
  }
}

export function submitEmployeeRegistration(data: {
  fullName: string;
  username: string;
  email: string;
  password?: string;
  station: string;
  notes?: string;
}): { registration: EmployeeRegistration; managerEmail: DispatchedEmail } {
  const existing = loadRegistrations();

  // Find max request ID number
  const maxReqId = existing.reduce((max, r) => Math.max(max, r.requestIdNumber), 354);
  const nextReqId = maxReqId + 1;

  const newReg: EmployeeRegistration = {
    id: `REG-${nextReqId}`,
    requestIdNumber: nextReqId,
    fullName: data.fullName.trim(),
    username: data.username.trim().toLowerCase(),
    email: data.email.trim().toLowerCase(),
    password: data.password,
    station: data.station || "Commercial Wash Bay",
    stationGeofence: `Store #104 - ${data.station} Geofence Beacon Verified`,
    role: "EMPLOYEE",
    status: "PENDING",
    createdAt: new Date().toISOString(),
    reviewedAt: null,
    reviewedBy: null,
    rejectionReason: null,
    notes: data.notes,
  };

  const updated = [newReg, ...existing];
  saveRegistrations(updated);
  setActiveRegistrationId(newReg.id);

  // Dispatch manager email
  const managerEmail = generateManagerEmail(newReg);
  const existingEmails = loadEmails();
  saveEmails([managerEmail, ...existingEmails]);

  return { registration: newReg, managerEmail };
}

export function approveEmployeeRegistration(
  id: string,
  managerName = "Store Manager",
): { registration: EmployeeRegistration | null; notificationEmail: DispatchedEmail | null } {
  const existing = loadRegistrations();
  let updatedReg: EmployeeRegistration | null = null;

  const updated = existing.map((r) => {
    if (r.id === id) {
      updatedReg = {
        ...r,
        status: "APPROVED",
        reviewedAt: new Date().toISOString(),
        reviewedBy: managerName,
        rejectionReason: null,
      };
      return updatedReg;
    }
    return r;
  });

  if (updatedReg) {
    saveRegistrations(updated);
    const notificationEmail = generateEmployeeDecisionEmail(updatedReg, true);
    const existingEmails = loadEmails();
    saveEmails([notificationEmail, ...existingEmails]);
    return { registration: updatedReg, notificationEmail };
  }

  return { registration: null, notificationEmail: null };
}

export function rejectEmployeeRegistration(
  id: string,
  reason: string,
  managerName = "Store Manager",
): { registration: EmployeeRegistration | null; notificationEmail: DispatchedEmail | null } {
  const existing = loadRegistrations();
  let updatedReg: EmployeeRegistration | null = null;

  const updated = existing.map((r) => {
    if (r.id === id) {
      updatedReg = {
        ...r,
        status: "REJECTED",
        reviewedAt: new Date().toISOString(),
        reviewedBy: managerName,
        rejectionReason: reason || "Manager declined onboarding authorization.",
      };
      return updatedReg;
    }
    return r;
  });

  if (updatedReg) {
    saveRegistrations(updated);
    const notificationEmail = generateEmployeeDecisionEmail(updatedReg, false, reason);
    const existingEmails = loadEmails();
    saveEmails([notificationEmail, ...existingEmails]);
    return { registration: updatedReg, notificationEmail };
  }

  return { registration: null, notificationEmail: null };
}

export function markEmailAsRead(emailId: string): void {
  const emails = loadEmails();
  const updated = emails.map((e) => (e.id === emailId ? { ...e, read: true } : e));
  saveEmails(updated);
}
