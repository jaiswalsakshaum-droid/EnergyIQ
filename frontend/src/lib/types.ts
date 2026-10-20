export type EnergyPoint = {
  time: string;
  actual: number;
  forecast: number;
  upper: number;
  lower: number;
};

export type OverviewKpis = {
  currentConsumptionKwh: number;
  forecast24hKwh: number;
  estMonthlyCostLakh: number;
  activeAnomalies: number;
  co2EmissionsTonnes: number;
  changeVsYesterdayPct: number;
};

export type BuildingOverview = {
  name: string;
  share: number;
  currentKwh: number;
  peakKw: number;
  area: string;
  status: string;
};

export type RecommendationItem = {
  id: string;
  copy: string;
  impact: string;
  building: string;
  severity: "High" | "Medium" | "Low";
};

export type ForecastPoint = {
  time: string;
  forecast: number;
  upper: number;
  lower: number;
  actual?: number | null;
};

export type ForecastResponse = {
  building: string;
  horizon: string;
  model: string;
  totalKwh: number;
  estCostInr: number;
  peakDemandKw: number;
  peakDemandTime: string;
  points: ForecastPoint[];
};

export type ShapContribution = {
  feature: string;
  impactKwh: number;
  displayName: string;
  isPositive: boolean;
};

export type ForecastExplanation = {
  building: string;
  timestamp: string;
  predictedKwh: number;
  baseValueKwh: number;
  topPositive: ShapContribution[];
  topNegative: ShapContribution[];
  summarySentence: string;
};

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
  status: "Reviewed" | "Confirmed" | "False alarm" | "Pending";
  detail: string;
  recommendation: string;
};

export type AnomalyExplanation = {
  anomalyId: number;
  building: string;
  time: string;
  actual: number;
  expected: number;
  deviationKwh: number;
  deviationPct: number;
  anomalyType: string;
  severity: string;
  primaryCauses: ShapContribution[];
  plainTextExplanation: string;
  recommendedAction: string;
};

export type ModelBenchmarkItem = {
  name: string;
  mae: string;
  rmse: string;
  mape: string;
  r2: string;
  time: string;
  tone: string;
  mase?: string;
  isBest: boolean;
};

export type FeatureImportanceItem = {
  name: string;
  value: number;
  rawScore?: number;
};

export type ModelDriftReport = {
  status: string;
  summary: string;
  pValue: number;
  psiScores: Record<string, number>;
  rollingMaeChangePct: number;
  lastReview: string;
  badge: string;
};

export type AnomalyMetricsReport = {
  precision: number;
  recall: number;
  f1Score: number;
  meanDetectionDelayMinutes: number;
  totalEvaluated: number;
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
};

export type ActualVsPredictedPoint = {
  time: string;
  actual: number;
  predicted: number;
  residual: number;
};

export type ErrorBreakdown = {
  byHour: Array<{ hour: number; mae: number }>;
  byDayOfWeek: Array<{ day: string; mae: number }>;
  byBuilding: Array<{ building: string; mae: number }>;
  byHorizon: Array<{ horizon: string; mae: number }>;
};

export type SimulatorRequest = {
  afterHoursReduction: number;
  occupancyChange: number;
  usageAdjustment: number;
  tariff?: number;
  building?: string;
};

export type SimulatorComparisonPoint = {
  name: string;
  usage: number;
};

export type SimulatorResponse = {
  reduction: number;
  savings: number;
  co2: number;
  monthlyBaselineKwh: number;
  projectedMonthlyKwh: number;
  peakDemandReductionKw: number;
  comparison: SimulatorComparisonPoint[];
  confidenceNote: string;
};

export type CsvQualityReport = {
  rows: number;
  missingCells: number;
  duplicateTimestamps: number;
  coveragePct: number;
  gaps: string[];
  issues: string[];
  isValid: boolean;
  message?: string;
};

export type RetrainJobStatus = {
  id: string;
  status: "queued" | "running" | "completed" | "failed";
  error?: string | null;
};
