export type EnergyPoint = {
  time: string;
  actual: number;
  forecast: number;
  upper: number;
  lower: number;
};

// 24-hour detailed profile
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

// 7-day daily profile
export const sevenDaySeries: EnergyPoint[] = [
  { time: "Mon", actual: 1140, forecast: 1120, upper: 1210, lower: 1030 },
  { time: "Tue", actual: 1180, forecast: 1160, upper: 1250, lower: 1070 },
  { time: "Wed", actual: 1220, forecast: 1205, upper: 1290, lower: 1120 },
  { time: "Thu", actual: 1190, forecast: 1175, upper: 1260, lower: 1090 },
  { time: "Fri", actual: 1110, forecast: 1090, upper: 1180, lower: 1000 },
  { time: "Sat", actual: 740, forecast: 750, upper: 820, lower: 680 },
  { time: "Sun", actual: 680, forecast: 690, upper: 760, lower: 620 },
];

// 30-day weekly aggregated profile
export const thirtyDaySeries: EnergyPoint[] = [
  { time: "Week 1", actual: 7820, forecast: 7750, upper: 8350, lower: 7150 },
  { time: "Week 2", actual: 8140, forecast: 8050, upper: 8680, lower: 7420 },
  { time: "Week 3", actual: 7960, forecast: 8100, upper: 8720, lower: 7480 },
  { time: "Week 4", actual: 8210, forecast: 8180, upper: 8810, lower: 7550 },
];

export type Anomaly = {
  id: number;
  time: string;
  building: string;
  actual: number;
  expected: number;
  type: "Overnight usage" | "Usage spike" | "Sudden drop" | "Sensor fault";
  severity: "High" | "Medium" | "Low";
  cost: number;
  dateRange: "24 hours" | "7 days" | "30 days";
  status?: "Reviewed" | "Confirmed" | "False alarm" | "Pending";
  detail: string;
  recommendation: string;
};

export const anomalies: Anomaly[] = [
  {
    id: 1,
    time: "Today, 02:14",
    building: "North Tower",
    actual: 94,
    expected: 38,
    type: "Overnight usage",
    severity: "High",
    cost: 186,
    dateRange: "24 hours",
    status: "Pending",
    detail:
      "Consumption stayed elevated after scheduled hours, 147% above this building’s typical overnight baseline.",
    recommendation:
      "Inspect the BMS overnight chiller schedule and verify baseboard heating override.",
  },
  {
    id: 2,
    time: "Today, 09:42",
    building: "Innovation Hub",
    actual: 128,
    expected: 84,
    type: "Usage spike",
    severity: "Medium",
    cost: 142,
    dateRange: "24 hours",
    status: "Pending",
    detail:
      "A short demand spike coincided with the morning start-up period and fell back within 20 minutes.",
    recommendation:
      "Enable staggered sequencing on AHU supply fans to avoid peak utility demand surcharges.",
  },
  {
    id: 3,
    time: "Yesterday, 16:08",
    building: "West Annex",
    actual: 18,
    expected: 72,
    type: "Sudden drop",
    severity: "Low",
    cost: 0,
    dateRange: "7 days",
    status: "Pending",
    detail:
      "Metered load dropped below the normal operating range. Check the floor sub-meter before adjusting controls.",
    recommendation:
      "Dispatch a technician to inspect floor 3 sub-meter CT clamps and comms gateway.",
  },
  {
    id: 4,
    time: "Oct 19, 03:26",
    building: "North Tower",
    actual: 0,
    expected: 34,
    type: "Sensor fault",
    severity: "Medium",
    cost: 0,
    dateRange: "7 days",
    status: "Pending",
    detail:
      "A zero reading was followed by an abrupt recovery, suggesting an intermittent sensor connection.",
    recommendation: "Replace the RS-485 Modbus repeater and check grounding on meter feeder line.",
  },
  {
    id: 5,
    time: "Oct 15, 13:10",
    building: "South Studio",
    actual: 112,
    expected: 65,
    type: "Usage spike",
    severity: "High",
    cost: 210,
    dateRange: "30 days",
    status: "Reviewed",
    detail: "Simultaneous operation of secondary cooling loop during mild ambient conditions.",
    recommendation: "Enforce economizer lockout logic when ambient temperature is below 22°C.",
  },
  {
    id: 6,
    time: "Oct 08, 23:45",
    building: "Innovation Hub",
    actual: 58,
    expected: 22,
    type: "Overnight usage",
    severity: "Medium",
    cost: 95,
    dateRange: "30 days",
    status: "Confirmed",
    detail: "Server room auxiliary split AC running concurrently with main central chiller.",
    recommendation:
      "Adjust lead-lag differential setpoint to prioritize primary chilled water circuit.",
  },
];

export const savingsEstimate = (
  afterHoursReduction: number,
  occupancyChange: number,
  usageAdjustment: number,
  tariff: number,
) => {
  const monthlyBaseline = 42800;
  const rawReduction = Math.max(
    0,
    monthlyBaseline * (afterHoursReduction * 0.32 + occupancyChange * 0.18 + usageAdjustment * 0.5),
  );
  const reduction = Math.round(rawReduction);
  return {
    reduction,
    savings: Math.round(reduction * tariff),
    co2: Math.round(reduction * 0.00071 * 100) / 100,
  };
};

export const sampleCsv =
  `timestamp,building,kwh,peak_kw,temperature_c\n` +
  `2026-10-20 00:00,North Tower,42.1,45.2,21.4\n` +
  `2026-10-20 01:00,North Tower,39.8,41.0,20.8\n` +
  `2026-10-20 02:00,North Tower,36.4,38.1,20.2\n` +
  `2026-10-20 03:00,North Tower,33.9,35.0,19.9\n` +
  `2026-10-20 04:00,North Tower,31.2,33.4,19.5\n` +
  `2026-10-20 05:00,North Tower,34.8,36.2,19.8\n` +
  `2026-10-20 06:00,North Tower,48.2,52.0,21.0\n` +
  `2026-10-20 07:00,North Tower,65.4,71.5,23.1\n` +
  `2026-10-20 08:00,North Tower,82.0,88.4,25.6\n` +
  `2026-10-20 09:00,North Tower,94.2,98.0,27.8\n` +
  `2026-10-20 10:00,North Tower,91.8,95.6,29.1\n` +
  `2026-10-20 11:00,North Tower,88.5,92.1,30.4\n`;
