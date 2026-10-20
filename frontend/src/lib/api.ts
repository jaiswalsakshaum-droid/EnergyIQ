import type {
  OverviewKpis,
  BuildingOverview,
  RecommendationItem,
  ForecastResponse,
  ForecastExplanation,
  Anomaly,
  AnomalyExplanation,
  ModelBenchmarkItem,
  FeatureImportanceItem,
  ActualVsPredictedPoint,
  ErrorBreakdown,
  ModelDriftReport,
  AnomalyMetricsReport,
  SimulatorRequest,
  SimulatorResponse,
  CsvQualityReport,
  RetrainJobStatus,
  EnergyPoint,
} from "./types";

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new ApiError(`API error ${res.status}: ${errorText || res.statusText}`, res.status);
    }

    return (await res.json()) as T;
  } catch (err: unknown) {
    if (err instanceof ApiError) throw err;
    throw new ApiError((err as Error).message || "Network error: backend offline", 0);
  }
}

// Overview endpoints
export async function fetchKpis(): Promise<OverviewKpis> {
  return request<OverviewKpis>("/api/overview/kpis");
}

export async function fetchLiveSeries(hours = 24): Promise<EnergyPoint[]> {
  return request<EnergyPoint[]>(`/api/overview/live-series?hours=${hours}`);
}

export async function fetchBuildings(): Promise<BuildingOverview[]> {
  return request<BuildingOverview[]>("/api/overview/buildings");
}

export async function fetchRecommendations(): Promise<RecommendationItem[]> {
  return request<RecommendationItem[]>("/api/overview/recommendations");
}

// Forecast endpoints
export async function fetchForecast(body: {
  horizon: string;
  model?: string;
  building?: string;
}): Promise<ForecastResponse> {
  return request<ForecastResponse>("/api/forecast", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function fetchForecastExplain(
  building: string,
  timestamp: string,
): Promise<ForecastExplanation> {
  const params = new URLSearchParams({ building, timestamp });
  return request<ForecastExplanation>(`/api/forecast/explain?${params.toString()}`);
}

// Anomalies endpoints
export async function fetchAnomalies(filters?: {
  severity?: string;
  type?: string;
  dateRange?: string;
  building?: string;
  status?: string;
}): Promise<Anomaly[]> {
  const params = new URLSearchParams();
  if (filters?.severity) params.set("severity", filters.severity);
  if (filters?.type) params.set("type", filters.type);
  if (filters?.dateRange) params.set("dateRange", filters.dateRange);
  if (
    filters?.building &&
    filters.building !== "All Buildings" &&
    filters.building !== "Aster Portfolio"
  ) {
    params.set("building", filters.building);
  }
  if (filters?.status) params.set("status", filters.status);

  const query = params.toString() ? `?${params.toString()}` : "";
  return request<Anomaly[]>(`/api/anomalies${query}`);
}

export async function updateAnomalyStatus(
  id: number,
  status: string,
  reviewerNote?: string,
): Promise<{ success: boolean; id: number; status: string }> {
  return request<{ success: boolean; id: number; status: string }>(`/api/anomalies/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, reviewerNote }),
  });
}

export async function fetchAnomalyExplain(id: number): Promise<AnomalyExplanation> {
  return request<AnomalyExplanation>(`/api/anomalies/${id}/explain`);
}

// Models endpoints
export async function fetchBenchmarks(): Promise<ModelBenchmarkItem[]> {
  return request<ModelBenchmarkItem[]>("/api/models/benchmarks");
}

export async function fetchFeatureImportance(): Promise<FeatureImportanceItem[]> {
  return request<FeatureImportanceItem[]>("/api/models/features");
}

export async function fetchActualVsPredicted(): Promise<ActualVsPredictedPoint[]> {
  return request<ActualVsPredictedPoint[]>("/api/models/actual-vs-predicted");
}

export async function fetchErrorBreakdown(): Promise<ErrorBreakdown> {
  return request<ErrorBreakdown>("/api/models/error-breakdown");
}

export async function fetchDriftReport(): Promise<ModelDriftReport> {
  return request<ModelDriftReport>("/api/models/drift");
}

export async function fetchAnomalyMetrics(): Promise<AnomalyMetricsReport> {
  return request<AnomalyMetricsReport>("/api/models/anomaly-metrics");
}

export async function triggerRetrain(): Promise<{
  jobId: string;
  status: string;
  message: string;
}> {
  return request<{ jobId: string; status: string; message: string }>("/api/models/retrain", {
    method: "POST",
  });
}

export async function getRetrainStatus(jobId: string): Promise<RetrainJobStatus> {
  return request<RetrainJobStatus>(`/api/models/retrain/${jobId}`);
}

// Simulator endpoint
export async function calculateSavings(payload: SimulatorRequest): Promise<SimulatorResponse> {
  return request<SimulatorResponse>("/api/simulator/calculate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Data upload & quality
export async function uploadCsv(file: File, commit = false): Promise<CsvQualityReport> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE_URL}/api/data/upload?commit=${commit}`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new ApiError(`Upload failed: ${errorText || res.statusText}`, res.status);
  }

  return (await res.json()) as CsvQualityReport;
}

export async function fetchSampleCsv(): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/api/data/sample`);
  if (!res.ok) {
    throw new ApiError("Failed to fetch sample CSV", res.status);
  }
  return res.text();
}
