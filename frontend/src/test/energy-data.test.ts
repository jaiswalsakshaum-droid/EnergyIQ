import { describe, expect, it } from "vitest";
import { savingsEstimate } from "@/lib/energy-data";

describe("illustrative savings simulator", () => {
  it("returns zero savings and emissions when no reductions are applied", () => {
    expect(savingsEstimate(0, 0, 0, 12)).toEqual({ reduction: 0, savings: 0, co2: 0 });
  });

  it("calculates local monthly savings from the selected tariff", () => {
    expect(savingsEstimate(0.2, 0.1, 0.1, 10)).toEqual({
      reduction: 5650,
      savings: 56500,
      co2: 4.01,
    });
  });
});
