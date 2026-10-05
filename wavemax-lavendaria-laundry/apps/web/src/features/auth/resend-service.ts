import {
  type EmployeeRegistration,
  loadEmails,
  saveEmails,
  type DispatchedEmail,
} from "./staff-registration-store";

export interface ResendSettings {
  apiKey: string;
  managerEmail: string;
  senderEmail: string;
}

const STORAGE_KEY_RESEND = "wavemax.resend-settings.v1";

export function getResendSettings(): ResendSettings {
  const envKey = import.meta.env.VITE_RESEND_API_KEY?.trim() || "";
  const envManagerEmail = import.meta.env.VITE_MANAGER_EMAIL?.trim() || "";

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_RESEND);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        apiKey: parsed.apiKey || envKey || "",
        managerEmail:
          (parsed.managerEmail && parsed.managerEmail !== "manager@wavemaxlaundry.com"
            ? parsed.managerEmail
            : envManagerEmail) || "sujaldhar666@gmail.com",
        senderEmail: parsed.senderEmail || "Wavemax Onboarding <onboarding@resend.dev>",
      };
    }
  } catch {
    // fallback
  }

  return {
    apiKey: envKey,
    managerEmail: envManagerEmail || "sujaldhar666@gmail.com",
    senderEmail: "Wavemax Onboarding <onboarding@resend.dev>",
  };
}

export function saveResendSettings(settings: ResendSettings): void {
  try {
    window.localStorage.setItem(STORAGE_KEY_RESEND, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

export function isResendConfigured(): boolean {
  const settings = getResendSettings();
  return Boolean(settings.apiKey && settings.apiKey.trim().startsWith("re_"));
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendEmailViaResend(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<SendEmailResult> {
  const settings = getResendSettings();

  if (!settings.apiKey) {
    return {
      success: false,
      error: "No Resend API Key configured. Please add your Resend API Key in Resend Settings.",
    };
  }

  // 1. Try sending through the Vite dev-server middleware endpoint
  try {
    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey: settings.apiKey,
        from: settings.senderEmail || "Wavemax Onboarding <onboarding@resend.dev>",
        to: params.to,
        subject: params.subject,
        html: params.html,
      }),
    });

    const data = await response.json();
    if (response.ok && data.success) {
      return {
        success: true,
        messageId: data.data?.id,
      };
    } else {
      // If endpoint returned error, return the explicit error message
      if (data.error) {
        return {
          success: false,
          error: typeof data.error === "string" ? data.error : JSON.stringify(data.error),
        };
      }
    }
  } catch {
    // If /api/send-email not reachable, try direct Resend API
  }

  // 2. Direct Resend REST API fallback
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.apiKey}`,
      },
      body: JSON.stringify({
        from: settings.senderEmail || "Wavemax Onboarding <onboarding@resend.dev>",
        to: [params.to],
        subject: params.subject,
        html: params.html,
      }),
    });

    const resData = await res.json();
    if (res.ok && resData.id) {
      return {
        success: true,
        messageId: resData.id,
      };
    }
    return {
      success: false,
      error: resData.message || resData.error || "Failed to deliver email through Resend.",
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Network error contacting Resend API";
    return {
      success: false,
      error: msg,
    };
  }
}

export function buildManagerApprovalEmailHtml(reg: EmployeeRegistration, origin: string): string {
  const approveUrl = `${origin}/#manager-approvals?id=${reg.id}&action=approve`;
  const rejectUrl = `${origin}/#manager-approvals?id=${reg.id}&action=reject`;
  const portalUrl = `${origin}/#manager-approvals`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Employee Registration Approval Request</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #0f172a;">
  <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1752b5 0%, #258cfb 100%); padding: 28px 32px; color: #ffffff; text-align: center;">
      <div style="display: inline-block; background: rgba(255,255,255,0.2); width: 42px; height: 42px; line-height: 42px; border-radius: 12px; font-size: 22px; font-weight: 900; margin-bottom: 10px;">
        W
      </div>
      <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: #bfdbfe;">
        WAVEMAX LAVENDARIA LAUNDRY
      </div>
      <h1 style="margin: 6px 0 0 0; font-size: 22px; font-weight: 800; color: #ffffff;">
        New Employee Registration Request
      </h1>
      <div style="font-size: 13px; color: #dbeafe; margin-top: 4px;">
        Request ID: #${reg.requestIdNumber} &bull; Action Required
      </div>
    </div>

    <!-- Body -->
    <div style="padding: 32px;">
      <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-top: 0;">
        Hello Store Manager,
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #334155;">
        A new staff member has submitted a registration request and is waiting for your authorization before they can log in to their assigned terminal.
      </p>

      <!-- Details Card -->
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 7px 0; color: #64748b; width: 140px;">Staff Member:</td>
            <td style="padding: 7px 0; font-weight: 700; color: #0f172a;">${reg.fullName}</td>
          </tr>
          <tr>
            <td style="padding: 7px 0; color: #64748b;">Username:</td>
            <td style="padding: 7px 0; font-weight: 700; color: #0f172a; font-family: monospace;">${reg.username}</td>
          </tr>
          <tr>
            <td style="padding: 7px 0; color: #64748b;">Assigned Station:</td>
            <td style="padding: 7px 0; font-weight: 700; color: #1d4ed8;">${reg.station}</td>
          </tr>
          <tr>
            <td style="padding: 7px 0; color: #64748b;">Email Address:</td>
            <td style="padding: 7px 0; color: #334155;">${reg.email}</td>
          </tr>
          <tr>
            <td style="padding: 7px 0; color: #64748b;">Geofence Verification:</td>
            <td style="padding: 7px 0; color: #16a34a; font-weight: 600;">✓ Verified (Store #104)</td>
          </tr>
          ${
            reg.notes
              ? `<tr>
            <td style="padding: 7px 0; color: #64748b;">Shift Notes:</td>
            <td style="padding: 7px 0; color: #334155; font-style: italic;">"${reg.notes}"</td>
          </tr>`
              : ""
          }
        </table>
      </div>

      <!-- Action Buttons -->
      <div style="text-align: center; margin: 30px 0 20px 0;">
        <p style="font-size: 13px; font-weight: 700; color: #475569; margin-bottom: 16px;">
          Please choose an approval action:
        </p>

        <table style="margin: 0 auto;">
          <tr>
            <td style="padding-right: 12px;">
              <a href="${approveUrl}" style="display: inline-block; background-color: #16a34a; color: #ffffff; font-size: 14px; font-weight: 800; text-decoration: none; padding: 13px 26px; border-radius: 10px; box-shadow: 0 4px 12px rgba(22,163,74,0.3);">
                ✓ Approve Employee
              </a>
            </td>
            <td>
              <a href="${rejectUrl}" style="display: inline-block; background-color: #ffffff; color: #dc2626; border: 1px solid #f87171; font-size: 14px; font-weight: 800; text-decoration: none; padding: 12px 22px; border-radius: 10px;">
                ✕ Reject
              </a>
            </td>
          </tr>
        </table>

        <div style="margin-top: 20px;">
          <a href="${portalUrl}" style="color: #2563eb; font-size: 12px; font-weight: 600; text-decoration: underline;">
            Open Wavemax Manager Approval Desk &rarr;
          </a>
        </div>
      </div>

    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 32px; font-size: 11px; color: #94a3b8; text-align: center;">
      This email was automatically generated by the Wavemax Laundry Employee Authorization System via Resend.
      <br>&copy; ${new Date().getFullYear()} Wavemax Laundry Platform &bull; Store #104
    </div>
  </div>
</body>
</html>
  `;
}

export function buildEmployeeDecisionEmailHtml(
  reg: EmployeeRegistration,
  approved: boolean,
  origin: string,
  reason?: string,
): string {
  const loginUrl = `${origin}/#staff-login`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Wavemax Registration ${approved ? "Approved" : "Update"}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #0f172a;">
  <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
    
    <div style="background: ${
      approved
        ? "linear-gradient(135deg, #15803d 0%, #22c55e 100%)"
        : "linear-gradient(135deg, #b91c1c 0%, #ef4444 100%)"
    }; padding: 28px 32px; color: #ffffff; text-align: center;">
      <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff;">
        ${approved ? "Registration Approved!" : "Registration Review Update"}
      </h1>
      <div style="font-size: 13px; color: #ffffff; opacity: 0.9; margin-top: 4px;">
        Request ID: #${reg.requestIdNumber} &bull; Wavemax Laundry
      </div>
    </div>

    <div style="padding: 32px;">
      <p style="font-size: 15px; color: #334155; margin-top: 0;">
        Hello <strong>${reg.fullName}</strong>,
      </p>

      ${
        approved
          ? `
      <p style="font-size: 14px; line-height: 1.6; color: #334155;">
        Great news! Your employee registration has been <strong>approved</strong> by the Store Manager. Your terminal and timecard access for <strong>${reg.station}</strong> are now activated.
      </p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${loginUrl}" style="display: inline-block; background-color: #1752b5; color: #ffffff; font-size: 14px; font-weight: 800; text-decoration: none; padding: 13px 28px; border-radius: 10px; box-shadow: 0 4px 12px rgba(23,82,181,0.3);">
          Sign In to Your Station Terminal &rarr;
        </a>
      </div>
      `
          : `
      <p style="font-size: 14px; line-height: 1.6; color: #334155;">
        Your registration could not be authorized at this time.
      </p>
      <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 16px; margin: 20px 0; color: #991b1b; font-size: 13px;">
        <strong>Manager Note:</strong> ${reason || "Shift capacity reached or station details could not be verified."}
      </div>
      `
      }
    </div>
  </div>
</body>
</html>
  `;
}

export async function sendManagerApprovalEmail(
  reg: EmployeeRegistration,
): Promise<SendEmailResult> {
  const settings = getResendSettings();
  const recipient = settings.managerEmail.trim() || "sujaldhar666@gmail.com";
  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:5173";
  const html = buildManagerApprovalEmailHtml(reg, origin);

  const subject = `Action Required: New Employee Registration Request (#${reg.requestIdNumber} - ${reg.fullName})`;

  // Save to local inbox for in-app viewing as well
  const dispatched: DispatchedEmail = {
    id: `resend-${reg.id}-${Date.now()}`,
    recipient,
    recipientRole: "MANAGER",
    subject,
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

  const existingEmails = loadEmails();
  saveEmails([dispatched, ...existingEmails]);

  // If user has configured Resend API key, send live email!
  if (settings.apiKey && settings.apiKey.trim().startsWith("re_")) {
    return await sendEmailViaResend({
      to: recipient,
      subject,
      html,
    });
  }

  return {
    success: false,
    error: "Resend API key not configured yet. Dispatched to local inbox.",
  };
}

export async function sendEmployeeDecisionEmail(
  reg: EmployeeRegistration,
  approved: boolean,
  reason?: string,
): Promise<SendEmailResult> {
  const settings = getResendSettings();
  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:5173";
  const html = buildEmployeeDecisionEmailHtml(reg, approved, origin, reason);
  const subject = approved
    ? `Registration Approved - Welcome to Wavemax (#${reg.requestIdNumber})`
    : `Registration Review Decision (#${reg.requestIdNumber})`;

  if (settings.apiKey && settings.apiKey.trim().startsWith("re_")) {
    const targetRecipient = reg.email || settings.managerEmail || "sujaldhar666@gmail.com";
    const res = await sendEmailViaResend({
      to: targetRecipient,
      subject,
      html,
    });
    if (!res.success && settings.managerEmail && targetRecipient !== settings.managerEmail) {
      return await sendEmailViaResend({
        to: settings.managerEmail,
        subject: `[Notification Copy] ${subject}`,
        html,
      });
    }
    return res;
  }

  return {
    success: false,
    error: "Resend API key not configured yet.",
  };
}

export async function sendTestResendEmail(targetEmail: string): Promise<SendEmailResult> {
  const settings = getResendSettings();
  const subject = "Wavemax Laundry - Resend Integration Test";
  const html = `
    <div style="font-family: sans-serif; padding: 20px;">
      <h2 style="color: #1752b5;">Wavemax Resend Integration Verified!</h2>
      <p>This test email confirms that your Resend API Key is working properly and sending emails to <strong>${targetEmail}</strong>.</p>
      <p style="color: #64748b; font-size: 12px;">Sent at: ${new Date().toLocaleString()}</p>
    </div>
  `;

  return await sendEmailViaResend({
    to: targetEmail,
    subject,
    html,
  });
}
