import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { fetchKpis, fetchForecast, fetchAnomalies, calculateSavings, ApiError } from "@/lib/api";
import { savingsEstimate } from "@/lib/energy-data";

describe("API Client & CamelCase Schema Tests", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("fetches KPIs and parses camelCase fields", async () => {
    const mockKpis = {
      currentConsumptionKwh: 1284,
      forecast24hKwh: 1106,
      estMonthlyCostLakh: 5.14,
      activeAnomalies: 4,
      co2EmissionsTonnes: 0.92,
      changeVsYesterdayPct: 8.2,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockKpis,
    });

    const data = await fetchKpis();
    expect(data.currentConsumptionKwh).toBe(1284);
    expect(data.forecast24hKwh).toBe(1106);
    expect(data.estMonthlyCostLakh).toBe(5.14);
    expect(data.activeAnomalies).toBe(4);
    expect(data.co2EmissionsTonnes).toBe(0.92);
  });

  it("posts forecast request with horizon and receives quantile bands", async () => {
    const mockForecast = {
      building: "North Tower",
      horizon: "24 hours",
      model: "XGBoost (Tuned)",
      totalKwh: 1250,
      estCostInr: 10625,
      peakDemandKw: 94.2,
      peakDemandTime: "2:00 PM",
      points: [
        { time: "00:00", forecast: 42, upper: 48, lower: 36, actual: 41 },
        { time: "02:00", forecast: 36, upper: 41, lower: 30, actual: 35 },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockForecast,
    });

    const res = await fetchForecast({ horizon: "24 hours", building: "North Tower" });
    expect(res.building).toBe("North Tower");
    expect(res.totalKwh).toBe(1250);
    expect(res.points.length).toBe(2);
    expect(res.points[0].upper).toBeGreaterThanOrEqual(res.points[0].forecast);
  });

  it("handles offline backend error gracefully", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Failed to fetch"));

    await expect(fetchKpis()).rejects.toThrow(ApiError);
  });

  it("verifies pure function offline fallback produces close results for default baseline", () => {
    const offline = savingsEstimate(0.2, 0.1, 0.1, 8.5);
    expect(offline.reduction).toBe(5650);
    expect(offline.savings).toBe(Math.round(5650 * 8.5));
    expect(offline.co2).toBeGreaterThan(0);
  });
});
