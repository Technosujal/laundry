import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useState } from "react";

import type { AppRole } from "../../app/auth/session-types";
import { WorkforcePocPage } from "./WorkforcePocPage";
import {
  PREVIEW_EMPLOYEE_ID,
  PREVIEW_MANAGER_ID,
  sampleWorkforce,
  type PreviewWorkforceState,
} from "./preview-workforce";

const today = "2026-09-20";

function Fixture({ role }: { role: AppRole }) {
  const [state, setState] = useState<PreviewWorkforceState>(() => sampleWorkforce(today));
  return (
    <WorkforcePocPage
      employeeId={PREVIEW_EMPLOYEE_ID}
      managerId={PREVIEW_MANAGER_ID}
      role={role}
      setState={setState}
      state={state}
    />
  );
}

function SwitchingFixture() {
  const [role, setRole] = useState<AppRole>("EMPLOYEE");
  const [state, setState] = useState<PreviewWorkforceState>(() => sampleWorkforce(today));
  return (
    <>
      <button onClick={() => setRole("MANAGER")} type="button">
        Switch to manager
      </button>
      <button onClick={() => setRole("EMPLOYEE")} type="button">
        Switch to employee
      </button>
      <WorkforcePocPage
        employeeId={PREVIEW_EMPLOYEE_ID}
        managerId={PREVIEW_MANAGER_ID}
        role={role}
        setState={setState}
        state={state}
      />
    </>
  );
}

describe("local workforce POC", () => {
  afterEach(cleanup);

  it("labels all sample records and lets the owner create staff", () => {
    render(<Fixture role="OWNER" />);
    expect(screen.getByText("Sample data · Local POC")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Directory" }));
    expect(screen.getByText("Sample staff C")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
      target: { value: "Sample staff D" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Job title" }), {
      target: { value: "Attendant" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add staff" }));
    expect(screen.getByText("Sample staff D")).toBeInTheDocument();
  });

  it("keeps the manager directory to direct reports", () => {
    render(<Fixture role="MANAGER" />);
    fireEvent.click(screen.getByRole("button", { name: "Directory" }));
    expect(screen.getByText("Sample staff A")).toBeInTheDocument();
    expect(screen.getByText("Sample staff B")).toBeInTheDocument();
    expect(screen.queryByText("Sample staff C")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add staff" })).not.toBeInTheDocument();
  });

  it("shows calendar shifts and a target-free coverage plan", () => {
    render(<Fixture role="MANAGER" />);
    fireEvent.click(screen.getByRole("button", { name: "Calendar" }));
    expect(screen.getByRole("heading", { name: "Seven-day calendar" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Coverage plan" }));
    expect(screen.getByRole("heading", { name: "Seven-day coverage" })).toBeInTheDocument();
    expect(screen.getByText(/No staffing target is configured/)).toBeInTheDocument();
  });

  it("gives employees only their own schedule and leave request", () => {
    render(<Fixture role="EMPLOYEE" />);
    expect(screen.getByRole("heading", { name: "My schedule" })).toBeInTheDocument();
    expect(screen.getByText("Sample staff A")).toBeInTheDocument();
    expect(screen.queryByText("Sample staff B")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Directory" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Leave" }));
    expect(screen.getByText(/Personal leave/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Approve" })).not.toBeInTheDocument();
  });

  it("lets a manager approve a direct report's pending leave", () => {
    render(<Fixture role="MANAGER" />);
    fireEvent.click(screen.getByRole("button", { name: "Leave" }));
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    expect(screen.getByText(/approved/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Approve" })).not.toBeInTheDocument();
  });

  it("lets an employee clock time and submit it", () => {
    render(<Fixture role="EMPLOYEE" />);
    fireEvent.click(screen.getByRole("button", { name: "Attendance" }));
    fireEvent.click(screen.getByRole("button", { name: "Clock in" }));
    expect(screen.getByText("Clocked in")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clock out" }));
    fireEvent.click(screen.getByRole("button", { name: "Timesheets" }));
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(screen.queryByRole("button", { name: "Submit" })).not.toBeInTheDocument();
  });

  it("moves an open shift to the employee only after manager approval", () => {
    render(<SwitchingFixture />);
    fireEvent.click(screen.getByRole("button", { name: "Shift coverage" }));
    fireEvent.click(screen.getByRole("button", { name: "Request shift" }));
    fireEvent.click(screen.getByRole("button", { name: "Switch to manager" }));
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    fireEvent.click(screen.getByRole("button", { name: "Switch to employee" }));
    fireEvent.click(screen.getByRole("button", { name: "Schedule" }));
    expect(screen.getAllByText("Sample staff A")).toHaveLength(2);
  });
});
