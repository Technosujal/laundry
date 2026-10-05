import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ArchivedWorkforcePage } from "./ArchivedWorkforcePage";

beforeEach(() => localStorage.clear());
afterEach(() => cleanup());

describe("archived workforce preview", () => {
  it("opens every copied workforce section for the owner", () => {
    render(<ArchivedWorkforcePage role="OWNER" />);
    const navigation = screen.getByRole("navigation", { name: "Workforce sections" });
    for (const label of [
      "Home",
      "Overview",
      "Calendar",
      "Directory",
      "Scheduling",
      "Attendance",
      "Timesheets",
      "Leave",
      "Shift coverage",
      "Coverage planning",
      "Approvals",
      "Add staff",
      "Notifications",
    ]) {
      const link = within(navigation).getByRole("link", { name: label });
      fireEvent.click(link);
      expect(link).toHaveAttribute("aria-current", "page");
    }
  });

  it("hides owner-only sections from employee navigation", () => {
    render(<ArchivedWorkforcePage role="EMPLOYEE" />);
    const navigation = screen.getByRole("navigation", { name: "Workforce sections" });
    expect(within(navigation).queryByRole("link", { name: "Approvals" })).not.toBeInTheDocument();
    expect(within(navigation).queryByRole("link", { name: "Add staff" })).not.toBeInTheDocument();
    expect(within(navigation).getByRole("link", { name: "Attendance" })).toBeInTheDocument();
  });
});
