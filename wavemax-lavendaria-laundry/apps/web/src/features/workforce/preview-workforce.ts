import type { AppRole } from "../../app/auth/session-types";

export interface PreviewStaff {
  id: string;
  name: string;
  jobTitle: string;
  managerId: string | null;
  active: boolean;
}

export interface PreviewShift {
  id: string;
  staffId: string | null;
  startsAt: string;
  endsAt: string;
  status: "OPEN" | "PUBLISHED";
}

export interface PreviewTimeEntry {
  id: string;
  staffId: string;
  clockIn: string;
  clockOut: string | null;
  status: "OPEN" | "SUBMITTED" | "APPROVED" | "RETURNED";
  returnReason: string | null;
}

export interface PreviewLeave {
  id: string;
  staffId: string;
  from: string;
  to: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "DECLINED";
}

export interface PreviewCoverageRequest {
  id: string;
  shiftId: string;
  staffId: string;
  status: "PENDING" | "APPROVED" | "DECLINED";
}

export interface PreviewEvent {
  id: string;
  at: string;
  label: string;
  staffId: string | null;
}

export interface PreviewWorkforceState {
  version: 1;
  staff: PreviewStaff[];
  shifts: PreviewShift[];
  timeEntries: PreviewTimeEntry[];
  leave: PreviewLeave[];
  coverageRequests: PreviewCoverageRequest[];
  events: PreviewEvent[];
}

export interface PreviewActor {
  role: AppRole;
  staffId: string | null;
}

export const PREVIEW_MANAGER_ID = "sample-manager";
export const PREVIEW_EMPLOYEE_ID = "sample-staff-a";

function dayOffset(base: string, days: number): string {
  const date = new Date(`${base}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function sampleWorkforce(today: string): PreviewWorkforceState {
  const yesterday = dayOffset(today, -1);
  const tomorrow = dayOffset(today, 1);
  return {
    version: 1,
    staff: [
      {
        id: PREVIEW_EMPLOYEE_ID,
        name: "Sample staff A",
        jobTitle: "Laundry attendant",
        managerId: PREVIEW_MANAGER_ID,
        active: true,
      },
      {
        id: "sample-staff-b",
        name: "Sample staff B",
        jobTitle: "Shift lead",
        managerId: PREVIEW_MANAGER_ID,
        active: true,
      },
      {
        id: "sample-staff-c",
        name: "Sample staff C",
        jobTitle: "Laundry attendant",
        managerId: null,
        active: true,
      },
    ],
    shifts: [
      {
        id: "sample-shift-a",
        staffId: PREVIEW_EMPLOYEE_ID,
        startsAt: `${today}T09:00`,
        endsAt: `${today}T17:00`,
        status: "PUBLISHED",
      },
      {
        id: "sample-shift-b",
        staffId: "sample-staff-b",
        startsAt: `${tomorrow}T10:00`,
        endsAt: `${tomorrow}T18:00`,
        status: "PUBLISHED",
      },
      {
        id: "sample-shift-open",
        staffId: null,
        startsAt: `${tomorrow}T14:00`,
        endsAt: `${tomorrow}T20:00`,
        status: "OPEN",
      },
    ],
    timeEntries: [
      {
        id: "sample-time-a",
        staffId: PREVIEW_EMPLOYEE_ID,
        clockIn: `${yesterday}T09:02`,
        clockOut: `${yesterday}T16:58`,
        status: "SUBMITTED",
        returnReason: null,
      },
      {
        id: "sample-time-b",
        staffId: "sample-staff-b",
        clockIn: `${yesterday}T10:03`,
        clockOut: `${yesterday}T18:01`,
        status: "APPROVED",
        returnReason: null,
      },
    ],
    leave: [
      {
        id: "sample-leave-a",
        staffId: PREVIEW_EMPLOYEE_ID,
        from: dayOffset(today, 7),
        to: dayOffset(today, 8),
        reason: "Personal leave",
        status: "PENDING",
      },
    ],
    coverageRequests: [],
    events: [],
  };
}

export function visibleStaff(state: PreviewWorkforceState, actor: PreviewActor): PreviewStaff[] {
  if (actor.role === "OWNER") return state.staff;
  if (actor.role === "MANAGER")
    return state.staff.filter((staff) => staff.managerId === PREVIEW_MANAGER_ID);
  return state.staff.filter((staff) => staff.id === actor.staffId);
}

export function mayManageStaff(
  state: PreviewWorkforceState,
  actor: PreviewActor,
  staffId: string,
): boolean {
  if (actor.role === "OWNER") return state.staff.some((staff) => staff.id === staffId);
  return (
    actor.role === "MANAGER" &&
    state.staff.some((staff) => staff.id === staffId && staff.managerId === PREVIEW_MANAGER_ID)
  );
}

export function loadPreviewWorkforce(today: string): PreviewWorkforceState {
  try {
    const raw = window.localStorage.getItem("wavemax.workforce-poc.v1");
    if (raw) {
      const value: unknown = JSON.parse(raw);
      if (typeof value === "object" && value !== null) {
        const candidate = value as Partial<PreviewWorkforceState>;
        if (
          candidate.version === 1 &&
          Array.isArray(candidate.staff) &&
          Array.isArray(candidate.shifts) &&
          Array.isArray(candidate.timeEntries) &&
          Array.isArray(candidate.leave) &&
          Array.isArray(candidate.coverageRequests) &&
          Array.isArray(candidate.events)
        )
          return candidate as PreviewWorkforceState;
      }
    }
  } catch {
    // The POC can always start from its clearly labelled sample records.
  }
  return sampleWorkforce(today);
}

export function savePreviewWorkforce(state: PreviewWorkforceState): void {
  try {
    window.localStorage.setItem("wavemax.workforce-poc.v1", JSON.stringify(state));
  } catch {
    // Browser storage is optional in this development-only preview.
  }
}
