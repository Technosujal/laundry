import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { loadArtifact } from "../../../test/artifact";
import type { CardAccounts, Machines, Metric, VacLog } from "../analytics-gateway";
import { MachinesSection } from "./MachinesSection";

/**
 * Two vendors feed this product and they measure different things, so the guarantee that
 * matters is attribution: a LaundroPortal figure must say LaundroPortal, and must never be
 * presented as part of the WDF counter-sales picture.
 */
const artifact = loadArtifact<{
  machines: Machines;
  metrics: Record<string, Metric>;
  accounts: CardAccounts;
  vac: VacLog;
}>();
const metrics = Object.values(artifact.metrics);

describe("machines section", () => {
  afterEach(cleanup);

  it("publishes the LaundroPortal figures the owner could not previously see", () => {
    render(
      <MachinesSection
        accounts={artifact.accounts}
        machines={artifact.machines}
        metrics={metrics}
        vac={artifact.vac}
      />,
    );
    expect(screen.getAllByText("$453,201").length).toBeGreaterThan(0);
    expect(screen.getAllByText("70,403").length).toBeGreaterThan(0);
  });

  it("labels every figure as LaundroPortal without a generated narrative", () => {
    render(
      <MachinesSection
        accounts={artifact.accounts}
        machines={artifact.machines}
        metrics={metrics}
        vac={artifact.vac}
      />,
    );
    expect(screen.getAllByText("LaundroPortal").length).toBeGreaterThan(3);
    expect(
      screen.queryByText("This section is LaundroPortal, not WDF POS"),
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole("img", { name: /Line chart/ })).toHaveLength(2);
    expect(screen.getAllByRole("img", { name: /Column chart/ }).length).toBeGreaterThan(3);
  });

  it("never offers a total that adds the two systems together", () => {
    const { container } = render(
      <MachinesSection
        accounts={artifact.accounts}
        machines={artifact.machines}
        metrics={metrics}
        vac={artifact.vac}
      />,
    );
    const text = container.textContent ?? "";
    // WDF counter sales must not appear here, and no combined figure may be shown.
    expect(text).not.toContain("42,102");
    expect(text).not.toContain("WDF paid counter sales");
  });

  it("does not imply a dryer cycle rate the source cannot support", () => {
    render(
      <MachinesSection
        accounts={artifact.accounts}
        machines={artifact.machines}
        metrics={metrics}
        vac={artifact.vac}
      />,
    );
    expect(screen.getByText(/cycles not reported/)).toBeInTheDocument();
  });
});
