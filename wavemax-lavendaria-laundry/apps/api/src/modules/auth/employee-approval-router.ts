import { Router, type Request, type Response } from "express";

export interface ApiEmployeeRegistration {
  id: string;
  requestIdNumber: number;
  fullName: string;
  username: string;
  email: string;
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

export interface ApiDispatchedEmail {
  id: string;
  recipient: string;
  recipientRole: "MANAGER" | "EMPLOYEE";
  subject: string;
  previewText: string;
  sentAt: string;
  read: boolean;
  registrationId: string;
  actionUrls: { approveUrl: string; rejectUrl: string } | null;
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

// In-memory backing store for employee registration pipeline
let registrations: ApiEmployeeRegistration[] = [
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

let emails: ApiDispatchedEmail[] = [
  {
    id: "email-reg-355",
    recipient: process.env.MANAGER_EMAIL || "Ankushkoul.koul@outlook.com",
    recipientRole: "MANAGER",
    subject: "Action Required: New Employee Registration Request (#355 - dd d)",
    previewText: "New staff onboarding request for station: Commercial Wash Bay. Authorization required to grant terminal access.",
    sentAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    read: false,
    registrationId: "REG-355",
    actionUrls: {
      approveUrl: "/v1/auth/employee-registrations/REG-355/approve",
      rejectUrl: "/v1/auth/employee-registrations/REG-355/reject",
    },
    applicant: {
      fullName: "dd d",
      username: "we2",
      station: "Commercial Wash Bay",
      requestIdNumber: 355,
    },
    details: {
      status: "PENDING",
      notes: "Assigned to Morning Commercial Wash & Sanitization bay.",
    },
  },
];

export function createEmployeeApprovalRouter(): Router {
  const router = Router();

  // List all registrations
  router.get("/registrations", (_req: Request, res: Response) => {
    res.json({ items: registrations });
  });

  // Submit new registration
  router.post("/register", (req: Request, res: Response) => {
    const { fullName, username, email, station, notes } = req.body;
    if (!fullName || !username || !email) {
      res.status(400).json({ error: "Missing required registration fields" });
      return;
    }

    const maxReqId = registrations.reduce((max, r) => Math.max(max, r.requestIdNumber), 354);
    const nextReqId = maxReqId + 1;

    const newReg: ApiEmployeeRegistration = {
      id: `REG-${nextReqId}`,
      requestIdNumber: nextReqId,
      fullName: String(fullName).trim(),
      username: String(username).trim().toLowerCase(),
      email: String(email).trim().toLowerCase(),
      station: String(station || "Commercial Wash Bay"),
      stationGeofence: `Store #104 - ${station || "Commercial Wash Bay"} Geofence Beacon Verified`,
      role: "EMPLOYEE",
      status: "PENDING",
      createdAt: new Date().toISOString(),
      reviewedAt: null,
      reviewedBy: null,
      rejectionReason: null,
      notes: notes ? String(notes) : undefined,
    };

    registrations = [newReg, ...registrations];

    // Dispatch manager email
    const managerEmail: ApiDispatchedEmail = {
      id: `email-${newReg.id}-${Date.now()}`,
      recipient: process.env.MANAGER_EMAIL || "Ankushkoul.koul@outlook.com",
      recipientRole: "MANAGER",
      subject: `Action Required: New Employee Registration Request (#${newReg.requestIdNumber} - ${newReg.fullName})`,
      previewText: `New staff onboarding request for station: ${newReg.station}. Authorization required to grant terminal access.`,
      sentAt: new Date().toISOString(),
      read: false,
      registrationId: newReg.id,
      actionUrls: {
        approveUrl: `/v1/auth/employee-registrations/${newReg.id}/approve`,
        rejectUrl: `/v1/auth/employee-registrations/${newReg.id}/reject`,
      },
      applicant: {
        fullName: newReg.fullName,
        username: newReg.username,
        station: newReg.station,
        requestIdNumber: newReg.requestIdNumber,
      },
      details: {
        status: "PENDING",
        notes: newReg.notes,
      },
    };

    emails = [managerEmail, ...emails];

    res.status(201).json({ registration: newReg, managerEmail });
  });

  // Approve registration
  router.post("/registrations/:id/approve", (req: Request, res: Response) => {
    const { id } = req.params;
    const { managerName = "Store Manager" } = req.body || {};

    const reg = registrations.find((r) => r.id === id);
    if (!reg) {
      res.status(404).json({ error: "Registration not found" });
      return;
    }

    reg.status = "APPROVED";
    reg.reviewedAt = new Date().toISOString();
    reg.reviewedBy = managerName;
    reg.rejectionReason = null;

    // Dispatch employee confirmation email
    const employeeEmail: ApiDispatchedEmail = {
      id: `email-emp-${reg.id}-${Date.now()}`,
      recipient: reg.email,
      recipientRole: "EMPLOYEE",
      subject: `Registration Approved - Welcome to Wavemax (#${reg.requestIdNumber})`,
      previewText: `Your registration has been approved. You may now sign in to your terminal at ${reg.station}.`,
      sentAt: new Date().toISOString(),
      read: false,
      registrationId: reg.id,
      actionUrls: null,
      applicant: {
        fullName: reg.fullName,
        username: reg.username,
        station: reg.station,
        requestIdNumber: reg.requestIdNumber,
      },
      details: {
        status: "APPROVED",
      },
    };

    emails = [employeeEmail, ...emails];

    res.json({ registration: reg, notificationEmail: employeeEmail });
  });

  // Reject registration
  router.post("/registrations/:id/reject", (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason = "Manager declined onboarding authorization.", managerName = "Store Manager" } =
      req.body || {};

    const reg = registrations.find((r) => r.id === id);
    if (!reg) {
      res.status(404).json({ error: "Registration not found" });
      return;
    }

    reg.status = "REJECTED";
    reg.reviewedAt = new Date().toISOString();
    reg.reviewedBy = managerName;
    reg.rejectionReason = reason;

    // Dispatch employee notification email
    const employeeEmail: ApiDispatchedEmail = {
      id: `email-emp-${reg.id}-${Date.now()}`,
      recipient: reg.email,
      recipientRole: "EMPLOYEE",
      subject: `Registration Update - Manager Review Decision (#${reg.requestIdNumber})`,
      previewText: `Your registration request was not approved: ${reason}`,
      sentAt: new Date().toISOString(),
      read: false,
      registrationId: reg.id,
      actionUrls: null,
      applicant: {
        fullName: reg.fullName,
        username: reg.username,
        station: reg.station,
        requestIdNumber: reg.requestIdNumber,
      },
      details: {
        status: "REJECTED",
        notes: reason,
      },
    };

    emails = [employeeEmail, ...emails];

    res.json({ registration: reg, notificationEmail: employeeEmail });
  });

  // List dispatched emails
  router.get("/emails", (_req: Request, res: Response) => {
    res.json({ items: emails });
  });

  return router;
}
