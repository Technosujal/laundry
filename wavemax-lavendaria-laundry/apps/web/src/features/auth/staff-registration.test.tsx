import { describe, expect, it, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  loadRegistrations,
  saveRegistrations,
  loadEmails,
  saveEmails,
  submitEmployeeRegistration,
  approveEmployeeRegistration,
  rejectEmployeeRegistration,
  type EmployeeRegistration,
} from "./staff-registration-store";
import { RegistrationStatusCard } from "./RegistrationStatusCard";
import { StaffSignInPage } from "./StaffSignInPage";
import { ManagerEmailViewerModal } from "./ManagerEmailViewerModal";

describe("Employee Registration and Manager Approval System", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("initializes with sample registration #355 for dd d (matching screenshot)", () => {
    const list = loadRegistrations();
    const reg355 = list.find((r) => r.requestIdNumber === 355);

    expect(reg355).toBeDefined();
    expect(reg355?.fullName).toBe("dd d");
    expect(reg355?.username).toBe("we2");
    expect(reg355?.station).toBe("Commercial Wash Bay");
    expect(reg355?.status).toBe("PENDING");
  });

  it("submits employee registration and dispatches email to store manager", () => {
    const { registration, managerEmail } = submitEmployeeRegistration({
      fullName: "Alex Rivera",
      username: "arivera",
      email: "alex@wavemaxstaff.com",
      station: "Drop-off & Intake Counter",
    });

    expect(registration.requestIdNumber).toBe(356);
    expect(registration.status).toBe("PENDING");
    expect(registration.fullName).toBe("Alex Rivera");

    expect(managerEmail.recipient).toBe("manager@wavemaxlaundry.com");
    expect(managerEmail.recipientRole).toBe("MANAGER");
    expect(managerEmail.subject).toContain("Action Required: New Employee Registration Request (#356");
    expect(managerEmail.actionUrls?.approveUrl).toContain("approve");
    expect(managerEmail.actionUrls?.rejectUrl).toContain("reject");

    const allEmails = loadEmails();
    expect(allEmails.some((e) => e.registrationId === registration.id)).toBe(true);
  });

  it("approves employee registration and sends welcome email to staff", () => {
    const { registration: approvedReg, notificationEmail } = approveEmployeeRegistration("REG-355", "Store Manager");

    expect(approvedReg?.status).toBe("APPROVED");
    expect(approvedReg?.reviewedBy).toBe("Store Manager");
    expect(notificationEmail?.recipientRole).toBe("EMPLOYEE");
    expect(notificationEmail?.subject).toContain("Registration Approved");
  });

  it("rejects employee registration with explanation and notifies staff", () => {
    const { registration: rejectedReg, notificationEmail } = rejectEmployeeRegistration(
      "REG-355",
      "Shift currently overstaffed",
      "Store Manager",
    );

    expect(rejectedReg?.status).toBe("REJECTED");
    expect(rejectedReg?.rejectionReason).toBe("Shift currently overstaffed");
    expect(notificationEmail?.subject).toContain("Manager Review Decision");
  });

  it("renders RegistrationStatusCard matching the picture layout and details", () => {
    const sampleReg: EmployeeRegistration = {
      id: "REG-355",
      requestIdNumber: 355,
      fullName: "dd d",
      username: "we2",
      email: "we2@wavemaxstaff.com",
      station: "Commercial Wash Bay",
      stationGeofence: "Store #104 - Bay #2 (Geofence Verified)",
      role: "EMPLOYEE",
      status: "PENDING",
      createdAt: new Date().toISOString(),
      reviewedAt: null,
      reviewedBy: null,
      rejectionReason: null,
    };

    render(
      <RegistrationStatusCard
        registration={sampleReg}
        onGoToSignIn={() => {}}
      />,
    );

    // Verification of heading and subtext
    expect(screen.getByText("Registration Submitted Successfully")).toBeInTheDocument();
    expect(screen.getByText("STATUS: PENDING")).toBeInTheDocument();
    expect(screen.getByText(/Your account is waiting for manager approval/)).toBeInTheDocument();

    // Verification of onboarding pipeline progress
    expect(screen.getByText("ONBOARDING PIPELINE PROGRESS")).toBeInTheDocument();
    expect(screen.getByText("1. Registration Submitted")).toBeInTheDocument();
    expect(screen.getByText("2. Details Validated")).toBeInTheDocument();
    expect(screen.getByText("3. Waiting for Manager Approval")).toBeInTheDocument();
    expect(screen.getByText("4. Ready for Login")).toBeInTheDocument();

    expect(screen.getByText("In Review")).toBeInTheDocument();
    expect(screen.getByText("Locked")).toBeInTheDocument();

    // Verification of exact staff details from picture
    expect(screen.getByText("dd d")).toBeInTheDocument();
    expect(screen.getByText("we2")).toBeInTheDocument();
    expect(screen.getByText("Commercial Wash Bay")).toBeInTheDocument();
    expect(screen.getByText("#355")).toBeInTheDocument();

    // Verification of action buttons
    expect(screen.getByText("Refresh Approval Status")).toBeInTheDocument();
    expect(screen.getByText("Go to Staff Sign In")).toBeInTheDocument();
  });

  it("handles StaffSignInPage redirecting pending applicants to status view", () => {
    let pendingRedirected: EmployeeRegistration | null = null;
    let loggedIn = false;

    render(
      <StaffSignInPage
        onSuccessLogin={() => {
          loggedIn = true;
        }}
        onShowPendingStatus={(reg) => {
          pendingRedirected = reg;
        }}
        onGoToRegister={() => {}}
      />,
    );

    const input = screen.getByPlaceholderText(/e\.g\. we2 or mvance/i);
    fireEvent.change(input, { target: { value: "we2" } });

    const submitBtn = screen.getByRole("button", { name: /Sign In to Terminal/i });
    fireEvent.click(submitBtn);

    // After async timeout
    setTimeout(() => {
      expect(pendingRedirected).not.toBeNull();
      expect(pendingRedirected?.id).toBe("REG-355");
      expect(loggedIn).toBe(false);
    }, 400);
  });

  it("shows that direct approval is disabled in modal and requires approval via Gmail", () => {
    render(
      <ManagerEmailViewerModal
        isOpen={true}
        onClose={() => {}}
        selectedRegistrationId="REG-355"
      />,
    );

    expect(screen.getByText("Wavemax Mail Dispatch")).toBeInTheDocument();
    expect(screen.getAllByText(/manager@wavemaxlaundry\.com/).length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/Action Required: New Employee Registration Request/).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText(/Manager Approval Action Required via Gmail/i)).toBeInTheDocument();
    expect(screen.getByText(/Direct in-app approval has been disabled/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Simulate Gmail Approval Link/i })).toBeInTheDocument();
  });

  it("handles Resend settings storage and HTML email template generation", async () => {
    const {
      saveResendSettings,
      getResendSettings,
      buildManagerApprovalEmailHtml,
      sendManagerApprovalEmail,
    } = await import("./resend-service");

    saveResendSettings({
      apiKey: "re_test_123456",
      managerEmail: "my-manager@company.com",
      senderEmail: "Wavemax <onboarding@resend.dev>",
    });

    const settings = getResendSettings();
    expect(settings.apiKey).toBe("re_test_123456");
    expect(settings.managerEmail).toBe("my-manager@company.com");

    const sampleReg: EmployeeRegistration = {
      id: "REG-399",
      requestIdNumber: 399,
      fullName: "Sarah Connor",
      username: "sconnor",
      email: "sarah@wavemaxstaff.com",
      station: "Dryer Quad B",
      stationGeofence: "Store #104 - Bay #2",
      role: "EMPLOYEE",
      status: "PENDING",
      createdAt: new Date().toISOString(),
      reviewedAt: null,
      reviewedBy: null,
      rejectionReason: null,
    };

    const html = buildManagerApprovalEmailHtml(sampleReg, "http://localhost:5173");
    expect(html).toContain("Sarah Connor");
    expect(html).toContain("Dryer Quad B");
    expect(html).toContain("#399");
    expect(html).toContain("action=approve");
    expect(html).toContain("action=reject");

    // Test sendManagerApprovalEmail records email with manager recipient
    await sendManagerApprovalEmail(sampleReg);
    const emails = loadEmails();
    const found = emails.find((e) => e.registrationId === "REG-399");
    expect(found).toBeDefined();
    expect(found?.recipient).toBe("my-manager@company.com");
  });

  it("approves employee registration when manager visits Gmail approve link", async () => {
    const { EmailApprovalActionView } = await import("./EmailApprovalActionView");

    window.location.hash = "#manager-approvals?id=REG-355&action=approve";

    render(<EmailApprovalActionView onGoToSignIn={() => {}} />);

    expect(screen.getByText("Registration Approved!")).toBeInTheDocument();
    expect(screen.getByText("EMAIL AUTHORIZATION VERIFIED")).toBeInTheDocument();
    expect(
      screen.getByText(/You have successfully approved this employee via your manager email/),
    ).toBeInTheDocument();

    const registrations = loadRegistrations();
    const reg355 = registrations.find((r) => r.id === "REG-355");
    expect(reg355?.status).toBe("APPROVED");
    expect(reg355?.reviewedBy).toBe("Store Manager (via Gmail Link)");
  });
});

