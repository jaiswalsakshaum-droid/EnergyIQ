export type EnergyPoint = { time: string; actual: number; forecast: number; upper: number; lower: number };

export const energySeries: EnergyPoint[] = [
  { time: "00:00", actual: 42, forecast: 43, upper: 49, lower: 37 },
  { time: "02:00", actual: 35, forecast: 36, upper: 42, lower: 30 },
  { time: "04:00", actual: 31, forecast: 32, upper: 38, lower: 26 },
  { time: "06:00", actual: 38, forecast: 39, upper: 46, lower: 32 },
  { time: "08:00", actual: 68, forecast: 66, upper: 75, lower: 57 },
  { time: "10:00", actual: 82, forecast: 80, upper: 90, lower: 70 },
  { time: "12:00", actual: 77, forecast: 78, upper: 88, lower: 68 },
  { time: "14:00", actual: 91, forecast: 88, upper: 99, lower: 77 },
  { time: "16:00", actual: 86, forecast: 84, upper: 95, lower: 73 },
  { time: "18:00", actual: 70, forecast: 72, upper: 82, lower: 62 },
  { time: "20:00", actual: 59, forecast: 57, upper: 66, lower: 48 },
  { time: "22:00", actual: 47, forecast: 46, upper: 54, lower: 38 },
];

export const anomalies = [
  { id: 1, time: "Today, 02:14", building: "North Tower", actual: 94, expected: 38, type: "Overnight usage", severity: "High", cost: 186, detail: "Consumption stayed elevated after scheduled hours, 147% above this building’s typical overnight baseline." },
  { id: 2, time: "Today, 09:42", building: "Innovation Hub", actual: 128, expected: 84, type: "Usage spike", severity: "Medium", cost: 142, detail: "A short demand spike coincided with the morning start-up period and fell back within 20 minutes." },
  { id: 3, time: "Yesterday, 16:08", building: "West Annex", actual: 18, expected: 72, type: "Sudden drop", severity: "Low", cost: 0, detail: "Metered load dropped below the normal operating range. Check the floor meter before adjusting controls." },
  { id: 4, time: "Yesterday, 03:26", building: "North Tower", actual: 0, expected: 34, type: "Sensor fault", severity: "Medium", cost: 0, detail: "A zero reading was followed by an abrupt recovery, suggesting an intermittent sensor connection." },
];

export const savingsEstimate = (afterHoursReduction: number, occupancyChange: number, usageAdjustment: number, tariff: number) => {
  const monthlyBaseline = 42800;
  const reduction = Math.max(0, monthlyBaseline * (afterHoursReduction * 0.32 + occupancyChange * 0.18 + usageAdjustment * 0.5));
  return { reduction: Math.round(reduction), savings: Math.round(reduction * tariff), co2: Math.round(reduction * 0.00071 * 100) / 100 };
};

export const sampleCsv = "timestamp,building,kwh\n2026-10-20 00:00,North Tower,42.1\n2026-10-20 01:00,North Tower,39.8\n2026-10-20 02:00,North Tower,36.4\n2026-10-20 03:00,North Tower,33.9\n2026-10-20 04:00,North Tower,31.2\n";