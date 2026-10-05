import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ChartPanel, DoughnutChart } from "./primitives";

describe("doughnut chart", () => {
  afterEach(cleanup);

  it("uses the shared clockwise ring-sweep animation", () => {
    render(
      <ChartPanel subtitle="Source share." title="Revenue share">
        <DoughnutChart
          segments={[
            { label: "WDF POS", value: 40, color: "#355f86" },
            { label: "LaundroPortal", value: 60, color: "#66556f" },
          ]}
          unit="CURRENCY_USD"
        />
      </ChartPanel>,
    );

    const chart = screen.getByRole("img", { name: /Pie chart showing/ });
    expect(chart).not.toHaveClass("chart-reveal-ring");
    expect(chart.querySelector("mask circle")).toHaveClass("chart-reveal-ring-sweep");
    expect(chart.querySelector("g")).toHaveAttribute(
      "mask",
      expect.stringMatching(/^url\(#ring-sweep-/),
    );
  });
});
