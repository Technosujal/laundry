import { useMemo, useState, type Dispatch, type FormEvent, type SetStateAction } from "react";

import type { AppRole } from "../../app/auth/session-types";
import type {
  PreviewEvent,
  PreviewLeave,
  PreviewShift,
  PreviewStaff,
  PreviewTimeEntry,
  PreviewWorkforceState,
} from "./preview-workforce";


type Section =
  | "overview"
  | "directory"
  | "calendar"
  | "schedule"
  | "attendance"
  | "timesheets"
  | "leave"
  | "coverage"
  | "coverage-plan"
  | "notifications";

const sections: readonly { id: Section; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "directory", label: "Directory" },
  { id: "calendar", label: "Calendar" },
  { id: "schedule", label: "Schedule" },
  { id: "attendance", label: "Attendance" },
  { id: "timesheets", label: "Timesheets" },
  { id: "leave", label: "Leave" },
  { id: "coverage", label: "Shift coverage" },
  { id: "coverage-plan", label: "Coverage plan" },
  { id: "notifications", label: "Notifications" },
];

function id(prefix: string): string {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
}

function timestamp(): string {
  return new Date().toISOString();
}

function addEvent(
  state: PreviewWorkforceState,
  label: string,
  staffId: string | null,
): PreviewEvent[] {
  return [{ id: id("event"), at: timestamp(), label, staffId }, ...state.events];
}

function displayDate(value: string): string {
  const parsed = new Date(value.includes("T") ? value : `${value}T12:00:00`);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: value.includes("T") ? "short" : undefined,
      });
}

function duration(entry: PreviewTimeEntry): string {
  if (!entry.clockOut) return "In progress";
  const minutes = Math.max(
    0,
    Math.round((new Date(entry.clockOut).getTime() - new Date(entry.clockIn).getTime()) / 60_000),
  );
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`;
}

const panel =
  "rounded-2xl border border-line bg-white p-4 shadow-[0_5px_16px_rgba(29,47,78,0.04)] sm:p-5";
const input =
  "min-h-10 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-[#e58a05]";
const primary =
  "min-h-10 rounded-xl bg-[#e58a05] px-4 text-sm font-semibold text-white transition hover:bg-[#b96d00] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e58a05] disabled:cursor-not-allowed disabled:opacity-50";
const secondary =
  "min-h-9 rounded-xl border border-line bg-white px-3 text-xs font-semibold text-ink transition hover:bg-[#fff7e6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e58a05] disabled:cursor-not-allowed disabled:opacity-50";

export function WorkforcePocPage({
  role,
  state,
  setState,
  employeeId,
  managerId,
}: {
  role: AppRole;
  state: PreviewWorkforceState;
  setState: Dispatch<SetStateAction<PreviewWorkforceState>>;
  employeeId: string;
  managerId: string;
}) {
  const [section, setSection] = useState<Section>("overview");
  const activeSection =
    role === "EMPLOYEE" &&
    ["overview", "directory", "coverage-plan"].includes(section)
      ? "schedule"
      : section;
  const [newName, setNewName] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [shiftStaffId, setShiftStaffId] = useState("");
  const [shiftStart, setShiftStart] = useState("");
  const [shiftEnd, setShiftEnd] = useState("");
  const [leaveFrom, setLeaveFrom] = useState("");
  const [leaveTo, setLeaveTo] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  const [returnReasons, setReturnReasons] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);


  const visiblePeople = useMemo(
    () =>
      state.staff.filter(
        (person) =>
          role === "OWNER" ||
          (role === "MANAGER" ? person.managerId === managerId : person.id === employeeId),
      ),
    [employeeId, managerId, role, state.staff],
  );
  const visibleIds = useMemo(
    () => new Set(visiblePeople.map((person) => person.id)),
    [visiblePeople],
  );
  const staffName = (staffId: string | null) =>
    state.staff.find((person) => person.id === staffId)?.name ?? "Open shift";
  const canManage = (staffId: string) =>
    role === "OWNER" || (role === "MANAGER" && visibleIds.has(staffId));
  const visibleShifts = state.shifts.filter(
    (shift) =>
      role === "OWNER" ||
      shift.staffId === null ||
      (shift.staffId !== null && visibleIds.has(shift.staffId)),
  );
  const visibleTime = state.timeEntries.filter((entry) => visibleIds.has(entry.staffId));
  const visibleLeave = state.leave.filter((request) => visibleIds.has(request.staffId));
  const visibleEvents = state.events.filter(
    (event) => role === "OWNER" || event.staffId === null || visibleIds.has(event.staffId),
  );
  const pendingLeave = visibleLeave.filter((request) => request.status === "PENDING").length;
  const openShifts = visibleShifts.filter((shift) => shift.status === "OPEN").length;
  const activeEntries = visibleTime.filter((entry) => entry.clockOut === null).length;
  const isManagerView = role !== "EMPLOYEE";

  function createStaff(event: FormEvent) {
    event.preventDefault();
    if (role !== "OWNER" || !newName.trim() || !newTitle.trim()) return;
    const person: PreviewStaff = {
      id: id("staff"),
      name: newName.trim(),
      jobTitle: newTitle.trim(),
      managerId: null,
      active: true,
    };
    setState((current) => ({
      ...current,
      staff: [...current.staff, person],
      events: addEvent(current, "Staff record created", person.id),
    }));
    setNewName("");
    setNewTitle("");
  }

  function assignManager(staffId: string, nextManagerId: string | null) {
    if (role !== "OWNER") return;
    setState((current) => ({
      ...current,
      staff: current.staff.map((person) =>
        person.id === staffId ? { ...person, managerId: nextManagerId } : person,
      ),
      events: addEvent(current, "Manager assignment changed", staffId),
    }));
  }

  function createShift(event: FormEvent) {
    event.preventDefault();
    if (!isManagerView) return;
    if (!shiftStart || !shiftEnd || new Date(shiftEnd) <= new Date(shiftStart)) {
      setFormError("End time must follow start time.");
      return;
    }
    if (shiftStaffId && !canManage(shiftStaffId)) return;
    const shift: PreviewShift = {
      id: id("shift"),
      staffId: shiftStaffId || null,
      startsAt: shiftStart,
      endsAt: shiftEnd,
      status: shiftStaffId ? "PUBLISHED" : "OPEN",
    };
    setState((current) => ({
      ...current,
      shifts: [...current.shifts, shift],
      events: addEvent(
        current,
        shiftStaffId ? "Shift published" : "Open shift created",
        shiftStaffId || null,
      ),
    }));
    setShiftStart("");
    setShiftEnd("");
    setShiftStaffId("");
    setFormError(null);
  }

  function clockIn() {
    if (
      role !== "EMPLOYEE" ||
      !visibleIds.has(employeeId) ||
      state.timeEntries.some((entry) => entry.staffId === employeeId && !entry.clockOut)
    )
      return;
    setState((current) => ({
      ...current,
      timeEntries: [
        ...current.timeEntries,
        {
          id: id("time"),
          staffId: employeeId,
          clockIn: timestamp(),
          clockOut: null,
          status: "OPEN",
          returnReason: null,
        },
      ],
      events: addEvent(current, "Clocked in", employeeId),
    }));
  }

  function clockOut() {
    if (role !== "EMPLOYEE") return;
    setState((current) => ({
      ...current,
      timeEntries: current.timeEntries.map((entry) =>
        entry.staffId === employeeId && !entry.clockOut
          ? { ...entry, clockOut: timestamp() }
          : entry,
      ),
      events: addEvent(current, "Clocked out", employeeId),
    }));
  }

  function setTimeStatus(entryId: string, status: PreviewTimeEntry["status"]) {
    const entry = state.timeEntries.find((item) => item.id === entryId);
    if (!entry || !entry.clockOut) return;
    if (
      role === "EMPLOYEE"
        ? entry.staffId !== employeeId || status !== "SUBMITTED"
        : !canManage(entry.staffId) || !["APPROVED", "RETURNED"].includes(status)
    )
      return;
    const reason = status === "RETURNED" ? returnReasons[entryId]?.trim() : null;
    if (status === "RETURNED" && !reason) return;
    setState((current) => ({
      ...current,
      timeEntries: current.timeEntries.map((item) =>
        item.id === entryId ? { ...item, status, returnReason: reason ?? null } : item,
      ),
      events: addEvent(
        current,
        status === "APPROVED"
          ? "Time approved"
          : status === "RETURNED"
            ? "Time returned"
            : "Time submitted",
        entry.staffId,
      ),
    }));
  }

  function requestLeave(event: FormEvent) {
    event.preventDefault();
    if (
      role !== "EMPLOYEE" ||
      !visibleIds.has(employeeId) ||
      !leaveFrom ||
      !leaveTo ||
      leaveTo < leaveFrom ||
      !leaveReason.trim()
    ) {
      setFormError("Enter a valid date range and reason.");
      return;
    }
    const request: PreviewLeave = {
      id: id("leave"),
      staffId: employeeId,
      from: leaveFrom,
      to: leaveTo,
      reason: leaveReason.trim(),
      status: "PENDING",
    };
    setState((current) => ({
      ...current,
      leave: [...current.leave, request],
      events: addEvent(current, "Leave requested", employeeId),
    }));
    setLeaveFrom("");
    setLeaveTo("");
    setLeaveReason("");
    setFormError(null);
  }

  function decideLeave(requestId: string, status: "APPROVED" | "DECLINED") {
    const request = state.leave.find((item) => item.id === requestId);
    if (!request || request.status !== "PENDING" || !canManage(request.staffId)) return;
    setState((current) => ({
      ...current,
      leave: current.leave.map((item) => (item.id === requestId ? { ...item, status } : item)),
      events: addEvent(
        current,
        status === "APPROVED" ? "Leave approved" : "Leave declined",
        request.staffId,
      ),
    }));
  }

  function requestCoverage(shiftId: string) {
    if (
      role !== "EMPLOYEE" ||
      !visibleIds.has(employeeId) ||
      state.coverageRequests.some(
        (item) =>
          item.shiftId === shiftId && item.staffId === employeeId && item.status === "PENDING",
      )
    )
      return;
    setState((current) => ({
      ...current,
      coverageRequests: [
        ...current.coverageRequests,
        { id: id("coverage"), shiftId, staffId: employeeId, status: "PENDING" },
      ],
      events: addEvent(current, "Shift coverage requested", employeeId),
    }));
  }

  function decideCoverage(requestId: string, status: "APPROVED" | "DECLINED") {
    const request = state.coverageRequests.find((item) => item.id === requestId);
    const shift = state.shifts.find((item) => item.id === request?.shiftId);
    if (
      !request ||
      !shift ||
      !isManagerView ||
      !canManage(request.staffId) ||
      shift.status !== "OPEN"
    )
      return;
    setState((current) => ({
      ...current,
      coverageRequests: current.coverageRequests.map((item) =>
        item.id === requestId
          ? { ...item, status }
          : status === "APPROVED" && item.shiftId === request.shiftId && item.status === "PENDING"
            ? { ...item, status: "DECLINED" }
            : item,
      ),
      shifts:
        status === "APPROVED"
          ? current.shifts.map((item) =>
              item.id === shift.id
                ? { ...item, staffId: request.staffId, status: "PUBLISHED" }
                : item,
            )
          : current.shifts,
      events: addEvent(
        current,
        status === "APPROVED" ? "Shift coverage approved" : "Shift coverage declined",
        request.staffId,
      ),
    }));
  }

  return (
    <div className="pb-8">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#b96d00]">
            People
          </p>
          <h1 className="mt-1 text-[clamp(26px,3vw,38px)] font-bold tracking-[-0.04em] text-ink">
            {role === "EMPLOYEE" ? "My workforce" : "Workforce management"}
          </h1>
        </div>
        <span className="rounded-full border border-[#f4d895] bg-[#fff7e6] px-3 py-1.5 text-xs font-bold text-[#805000]">
          Sample data · Local POC
        </span>
      </div>
      <nav aria-label="Workforce sections" className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {sections
          .filter(
            (item) =>
              role !== "EMPLOYEE" ||
              !["overview", "directory", "coverage-plan"].includes(item.id),
          )
          .map((item) => (
            <button
              aria-current={activeSection === item.id ? "page" : undefined}
              className={`min-h-10 shrink-0 rounded-xl border px-3 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e58a05] ${activeSection === item.id ? "border-[#e58a05] bg-[#fff7e6] text-[#805000]" : "border-line bg-white text-muted hover:text-ink"}`}
              key={item.id}
              onClick={() => setSection(item.id)}
              type="button"
            >
              {item.label}
            </button>
          ))}
      </nav>

      {activeSection === "overview" && role !== "EMPLOYEE" ? (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Staff in view", visiblePeople.length],
              [
                "Published shifts",
                visibleShifts.filter((item) => item.status === "PUBLISHED").length,
              ],
              ["Open shifts", openShifts],
              ["Leave to review", pendingLeave],
            ].map(([label, value]) => (
              <article className={panel} key={label}>
                <p className="text-xs font-semibold text-muted">{label}</p>
                <strong className="mt-2 block text-3xl font-bold text-ink">{value}</strong>
              </article>
            ))}
          </div>
          <div className={panel}>
            <h2 className="text-lg font-bold">Recent activity</h2>
            <EventList events={visibleEvents.slice(0, 5)} />
          </div>
        </div>
      ) : null}

      {activeSection === "directory" && isManagerView ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_310px]">
          <div className={panel}>
            <h2 className="mb-4 text-lg font-bold">Employee directory</h2>
            <div className="divide-y divide-line">
              {visiblePeople.map((person) => (
                <div
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                  key={person.id}
                >
                  <div>
                    <strong className="block text-sm">{person.name}</strong>
                    <span className="text-xs text-muted">{person.jobTitle}</span>
                  </div>
                  {role === "OWNER" ? (
                    <select
                      aria-label={`Manager for ${person.name}`}
                      className={`${input} max-w-[180px]`}
                      onChange={(event) => assignManager(person.id, event.target.value || null)}
                      value={person.managerId ?? ""}
                    >
                      <option value="">No manager</option>
                      <option value={managerId}>Sample manager</option>
                    </select>
                  ) : (
                    <span className="text-xs text-muted">Direct report</span>
                  )}
                </div>
              ))}
            </div>
          </div>
          {role === "OWNER" ? (
            <form className={panel} onSubmit={createStaff}>
              <h2 className="mb-4 text-lg font-bold">Add staff</h2>
              <div className="space-y-3">
                <label className="block text-xs font-semibold">
                  Name
                  <input
                    className={`${input} mt-1`}
                    onChange={(event) => setNewName(event.target.value)}
                    required
                    value={newName}
                  />
                </label>
                <label className="block text-xs font-semibold">
                  Job title
                  <input
                    className={`${input} mt-1`}
                    onChange={(event) => setNewTitle(event.target.value)}
                    required
                    value={newTitle}
                  />
                </label>
                <button className={primary} type="submit">
                  Add staff
                </button>
              </div>
              <p className="mt-3 text-xs text-muted">Use sample names only.</p>
            </form>
          ) : null}
        </div>
      ) : null}

      {activeSection === "schedule" ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_310px]">
          <div className={panel}>
            <h2 className="mb-4 text-lg font-bold">
              {role === "EMPLOYEE" ? "My schedule" : "Shift schedule"}
            </h2>
            <RecordList empty="No shifts in view.">
              {visibleShifts
                .filter((shift) => role !== "EMPLOYEE" || shift.staffId === employeeId)
                .map((shift) => (
                  <div
                    className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-3 last:border-0"
                    key={shift.id}
                  >
                    <div>
                      <strong className="block text-sm">{staffName(shift.staffId)}</strong>
                      <span className="text-xs text-muted">
                        {displayDate(shift.startsAt)} – {displayDate(shift.endsAt)}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-[#805000]">
                      {shift.status === "OPEN" ? "Open" : "Published"}
                    </span>
                  </div>
                ))}
            </RecordList>
          </div>
          {isManagerView ? (
            <form className={panel} onSubmit={createShift}>
              <h2 className="mb-4 text-lg font-bold">Add shift</h2>
              <div className="space-y-3">
                <label className="block text-xs font-semibold">
                  Assign to
                  <select
                    className={`${input} mt-1`}
                    onChange={(event) => setShiftStaffId(event.target.value)}
                    value={shiftStaffId}
                  >
                    <option value="">Open shift</option>
                    {visiblePeople.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs font-semibold">
                  Start
                  <input
                    className={`${input} mt-1`}
                    onChange={(event) => setShiftStart(event.target.value)}
                    required
                    type="datetime-local"
                    value={shiftStart}
                  />
                </label>
                <label className="block text-xs font-semibold">
                  End
                  <input
                    className={`${input} mt-1`}
                    onChange={(event) => setShiftEnd(event.target.value)}
                    required
                    type="datetime-local"
                    value={shiftEnd}
                  />
                </label>
                {formError ? (
                  <p className="text-xs text-red-700" role="alert">
                    {formError}
                  </p>
                ) : null}
                <button className={primary} type="submit">
                  Save shift
                </button>
              </div>
            </form>
          ) : null}
        </div>
      ) : null}

      {activeSection === "calendar" ? (
        <CalendarPanel
          shifts={visibleShifts.filter(
            (shift) => role !== "EMPLOYEE" || shift.staffId === employeeId,
          )}
          staffName={staffName}
        />
      ) : null}

      {activeSection === "attendance" ? (
        <div className="space-y-5">
          {role === "EMPLOYEE" ? (
            <div className={`${panel} flex flex-wrap items-center justify-between gap-3`}>
              <div>
                <h2 className="text-lg font-bold">My attendance</h2>
                <p className="text-xs text-muted">
                  {activeEntries ? "Clocked in" : "Not clocked in"}
                </p>
              </div>
              <button
                className={primary}
                onClick={activeEntries ? clockOut : clockIn}
                type="button"
              >
                {activeEntries ? "Clock out" : "Clock in"}
              </button>
            </div>
          ) : null}
          <div className={panel}>
            <h2 className="mb-3 text-lg font-bold">Clock entries</h2>
            <RecordList empty="No clock entries in view.">
              {visibleTime.map((entry) => (
                <div
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-3 last:border-0"
                  key={entry.id}
                >
                  <div>
                    <strong className="block text-sm">{staffName(entry.staffId)}</strong>
                    <span className="text-xs text-muted">
                      {displayDate(entry.clockIn)} –{" "}
                      {entry.clockOut ? displayDate(entry.clockOut) : "In progress"}
                    </span>
                  </div>
                  <span className="text-sm font-semibold">{duration(entry)}</span>
                </div>
              ))}
            </RecordList>
          </div>
        </div>
      ) : null}

      {activeSection === "timesheets" ? (
        <div className={panel}>
          <h2 className="mb-3 text-lg font-bold">Timesheet review</h2>
          <RecordList empty="No time entries in view.">
            {visibleTime.map((entry) => (
              <div
                className="grid gap-2 border-b border-line py-4 last:border-0 sm:grid-cols-[minmax(0,1fr)_auto]"
                key={entry.id}
              >
                <div>
                  <strong className="block text-sm">
                    {staffName(entry.staffId)} · {duration(entry)}
                  </strong>
                  <span className="text-xs text-muted">
                    {displayDate(entry.clockIn)} · {entry.status.toLowerCase()}
                  </span>
                  {entry.returnReason ? (
                    <p className="mt-1 text-xs text-[#805000]">
                      Return reason: {entry.returnReason}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {role === "EMPLOYEE" &&
                  entry.staffId === employeeId &&
                  entry.clockOut &&
                  ["OPEN", "RETURNED"].includes(entry.status) ? (
                    <button
                      className={secondary}
                      onClick={() => setTimeStatus(entry.id, "SUBMITTED")}
                      type="button"
                    >
                      Submit
                    </button>
                  ) : null}
                  {isManagerView && entry.status === "SUBMITTED" && canManage(entry.staffId) ? (
                    <>
                      <button
                        className={secondary}
                        onClick={() => setTimeStatus(entry.id, "APPROVED")}
                        type="button"
                      >
                        Approve
                      </button>
                      <input
                        aria-label={`Return reason for ${staffName(entry.staffId)}`}
                        className={`${input} w-[140px]`}
                        onChange={(event) =>
                          setReturnReasons((current) => ({
                            ...current,
                            [entry.id]: event.target.value,
                          }))
                        }
                        placeholder="Return reason"
                        value={returnReasons[entry.id] ?? ""}
                      />
                      <button
                        className={secondary}
                        disabled={!returnReasons[entry.id]?.trim()}
                        onClick={() => setTimeStatus(entry.id, "RETURNED")}
                        type="button"
                      >
                        Return
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            ))}
          </RecordList>
        </div>
      ) : null}

      {activeSection === "leave" ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_310px]">
          <div className={panel}>
            <h2 className="mb-3 text-lg font-bold">Leave requests</h2>
            <RecordList empty="No leave requests in view.">
              {visibleLeave.map((request) => (
                <div
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-4 last:border-0"
                  key={request.id}
                >
                  <div>
                    <strong className="block text-sm">
                      {staffName(request.staffId)} · {request.reason}
                    </strong>
                    <span className="text-xs text-muted">
                      {request.from} – {request.to} · {request.status.toLowerCase()}
                    </span>
                  </div>
                  {isManagerView && request.status === "PENDING" && canManage(request.staffId) ? (
                    <div className="flex gap-2">
                      <button
                        className={secondary}
                        onClick={() => decideLeave(request.id, "APPROVED")}
                        type="button"
                      >
                        Approve
                      </button>
                      <button
                        className={secondary}
                        onClick={() => decideLeave(request.id, "DECLINED")}
                        type="button"
                      >
                        Decline
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
            </RecordList>
          </div>
          {role === "EMPLOYEE" ? (
            <form className={panel} onSubmit={requestLeave}>
              <h2 className="mb-4 text-lg font-bold">Request leave</h2>
              <div className="space-y-3">
                <label className="block text-xs font-semibold">
                  From
                  <input
                    className={`${input} mt-1`}
                    onChange={(event) => setLeaveFrom(event.target.value)}
                    required
                    type="date"
                    value={leaveFrom}
                  />
                </label>
                <label className="block text-xs font-semibold">
                  To
                  <input
                    className={`${input} mt-1`}
                    onChange={(event) => setLeaveTo(event.target.value)}
                    required
                    type="date"
                    value={leaveTo}
                  />
                </label>
                <label className="block text-xs font-semibold">
                  Reason
                  <input
                    className={`${input} mt-1`}
                    onChange={(event) => setLeaveReason(event.target.value)}
                    required
                    value={leaveReason}
                  />
                </label>
                {formError ? (
                  <p className="text-xs text-red-700" role="alert">
                    {formError}
                  </p>
                ) : null}
                <button className={primary} type="submit">
                  Send request
                </button>
              </div>
            </form>
          ) : null}
        </div>
      ) : null}

      {activeSection === "coverage" ? (
        <div className={panel}>
          <h2 className="mb-3 text-lg font-bold">Open shifts</h2>
          <RecordList empty="No open shifts.">
            {visibleShifts
              .filter((shift) => shift.status === "OPEN")
              .map((shift) => (
                <div className="border-b border-line py-4 last:border-0" key={shift.id}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <strong className="text-sm">
                      {displayDate(shift.startsAt)} – {displayDate(shift.endsAt)}
                    </strong>
                    {role === "EMPLOYEE" ? (
                      <button
                        className={secondary}
                        disabled={state.coverageRequests.some(
                          (request) =>
                            request.shiftId === shift.id &&
                            request.staffId === employeeId &&
                            request.status === "PENDING",
                        )}
                        onClick={() => requestCoverage(shift.id)}
                        type="button"
                      >
                        Request shift
                      </button>
                    ) : null}
                  </div>
                  {isManagerView ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {state.coverageRequests
                        .filter(
                          (request) =>
                            request.shiftId === shift.id &&
                            request.status === "PENDING" &&
                            canManage(request.staffId),
                        )
                        .map((request) => (
                          <div
                            className="flex items-center gap-2 rounded-lg bg-[#fff7e6] px-2 py-1 text-xs"
                            key={request.id}
                          >
                            <span>{staffName(request.staffId)}</span>
                            <button
                              className="font-bold text-[#805000]"
                              onClick={() => decideCoverage(request.id, "APPROVED")}
                              type="button"
                            >
                              Approve
                            </button>
                            <button
                              className="font-bold text-muted"
                              onClick={() => decideCoverage(request.id, "DECLINED")}
                              type="button"
                            >
                              Decline
                            </button>
                          </div>
                        ))}
                    </div>
                  ) : null}
                </div>
              ))}
          </RecordList>
        </div>
      ) : null}

      {activeSection === "coverage-plan" && isManagerView ? (
        <CoveragePlan shifts={visibleShifts} />
      ) : null}

      {activeSection === "notifications" ? (
        <div className={panel}>
          <h2 className="text-lg font-bold">Notifications</h2>
          <EventList events={visibleEvents} />
        </div>
      ) : null}


    </div>
  );
}

function RecordList({ children, empty }: { children: React.ReactNode; empty: string }) {
  return (
    <div>
      {Array.isArray(children) && children.length === 0 ? (
        <p className="py-6 text-sm text-muted">{empty}</p>
      ) : (
        children
      )}
    </div>
  );
}

function EventList({ events }: { events: PreviewEvent[] }) {
  return events.length ? (
    <div className="mt-3 divide-y divide-line">
      {events.map((event) => (
        <div
          className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
          key={event.id}
        >
          <span>{event.label}</span>
          <time className="text-xs text-muted">{displayDate(event.at)}</time>
        </div>
      ))}
    </div>
  ) : (
    <p className="mt-3 text-sm text-muted">No recent activity.</p>
  );
}

function nextSevenDays(): string[] {
  const today = new Intl.DateTimeFormat("sv-SE").format(new Date());
  return Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(`${today}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + offset);
    return date.toISOString().slice(0, 10);
  });
}

function CalendarPanel({
  shifts,
  staffName,
}: {
  shifts: PreviewShift[];
  staffName: (id: string | null) => string;
}) {
  return (
    <section className={panel}>
      <h2 className="mb-4 text-lg font-bold">Seven-day calendar</h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
        {nextSevenDays().map((day) => {
          const dayShifts = shifts.filter((shift) => shift.startsAt.slice(0, 10) === day);
          return (
            <div className="min-h-32 rounded-xl border border-line bg-[#fbfcfe] p-3" key={day}>
              <h3 className="text-xs font-bold text-ink">{displayDate(day)}</h3>
              <p className="mt-1 text-[11px] text-muted">{dayShifts.length} shifts</p>
              <div className="mt-3 grid gap-2">
                {dayShifts.map((shift) => (
                  <div
                    className="rounded-lg border border-[#f4d895] bg-[#fff7e6] px-2 py-1.5"
                    key={shift.id}
                  >
                    <strong className="block text-xs text-[#805000]">
                      {staffName(shift.staffId)}
                    </strong>
                    <span className="text-[10px] text-muted">
                      {new Date(shift.startsAt).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CoveragePlan({ shifts }: { shifts: PreviewShift[] }) {
  return (
    <section className={panel}>
      <h2 className="text-lg font-bold">Seven-day coverage</h2>
      <p className="mt-1 text-xs text-muted">
        Scheduled and open shifts only. No staffing target is configured.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left text-muted">
              <th className="pb-2">Day</th>
              <th className="pb-2 text-right">Assigned shifts</th>
              <th className="pb-2 text-right">Open shifts</th>
            </tr>
          </thead>
          <tbody>
            {nextSevenDays().map((day) => {
              const todayShifts = shifts.filter((shift) => shift.startsAt.slice(0, 10) === day);
              return (
                <tr className="border-b border-line last:border-0" key={day}>
                  <th className="py-3 text-left font-semibold">{displayDate(day)}</th>
                  <td className="py-3 text-right tabular-nums">
                    {todayShifts.filter((shift) => shift.status === "PUBLISHED").length}
                  </td>
                  <td className="py-3 text-right font-semibold tabular-nums text-[#805000]">
                    {todayShifts.filter((shift) => shift.status === "OPEN").length}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
