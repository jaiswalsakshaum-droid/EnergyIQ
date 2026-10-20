import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchKpis,
  fetchLiveSeries,
  fetchBuildings,
  fetchRecommendations,
  fetchForecast,
  fetchForecastExplain,
  fetchAnomalies,
  updateAnomalyStatus,
  fetchAnomalyExplain,
  fetchBenchmarks,
  fetchFeatureImportance,
  fetchActualVsPredicted,
  fetchErrorBreakdown,
  fetchDriftReport,
  fetchAnomalyMetrics,
  calculateSavings,
  triggerRetrain,
  getRetrainStatus,
  API_BASE_URL,
} from "./api";
import type { SimulatorRequest, Anomaly, ForecastResponse } from "./types";

// Quick health check hook to detect whether backend is online
export function useBackendHealth() {
  return useQuery({
    queryKey: ["backend-health"],
    queryFn: async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(`${API_BASE_URL}/api/health`, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return res.ok;
      } catch {
        return false;
      }
    },
    refetchInterval: 15000,
    retry: 1,
  });
}

export function useKpis() {
  return useQuery({
    queryKey: ["overview-kpis"],
    queryFn: fetchKpis,
    staleTime: 30000,
    retry: 1,
  });
}

export function useLiveSeries(hours = 24) {
  return useQuery({
    queryKey: ["live-series", hours],
    queryFn: () => fetchLiveSeries(hours),
    staleTime: 30000,
    retry: 1,
  });
}

export function useBuildings() {
  return useQuery({
    queryKey: ["overview-buildings"],
    queryFn: fetchBuildings,
    staleTime: 60000,
    retry: 1,
  });
}

export function useRecommendations() {
  return useQuery({
    queryKey: ["overview-recommendations"],
    queryFn: fetchRecommendations,
    staleTime: 60000,
    retry: 1,
  });
}

export function useForecast(body: { horizon: string; model?: string; building?: string }) {
  return useQuery({
    queryKey: ["forecast", body.horizon, body.model, body.building],
    queryFn: () => fetchForecast(body),
    staleTime: 60000,
    retry: 1,
  });
}

export function useForecastExplain(building: string, timestamp: string, enabled = true) {
  return useQuery({
    queryKey: ["forecast-explain", building, timestamp],
    queryFn: () => fetchForecastExplain(building, timestamp),
    enabled: enabled && !!building && !!timestamp,
    staleTime: 120000,
  });
}

export function useAnomalies(filters?: {
  severity?: string;
  type?: string;
  dateRange?: string;
  building?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ["anomalies", filters],
    queryFn: () => fetchAnomalies(filters),
    staleTime: 20000,
    retry: 1,
  });
}

export function useUpdateAnomalyStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      reviewerNote,
    }: {
      id: number;
      status: string;
      reviewerNote?: string;
    }) => updateAnomalyStatus(id, status, reviewerNote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anomalies"] });
      queryClient.invalidateQueries({ queryKey: ["overview-kpis"] });
    },
  });
}

export function useAnomalyExplain(id: number | null, enabled = true) {
  return useQuery({
    queryKey: ["anomaly-explain", id],
    queryFn: () => (id ? fetchAnomalyExplain(id) : null),
    enabled: enabled && id !== null,
    staleTime: 120000,
  });
}

export function useBenchmarks() {
  return useQuery({
    queryKey: ["models-benchmarks"],
    queryFn: fetchBenchmarks,
    staleTime: 60000,
    retry: 1,
  });
}

export function useFeatureImportance() {
  return useQuery({
    queryKey: ["models-features"],
    queryFn: fetchFeatureImportance,
    staleTime: 120000,
    retry: 1,
  });
}

export function useActualVsPredicted() {
  return useQuery({
    queryKey: ["models-actual-vs-predicted"],
    queryFn: fetchActualVsPredicted,
    staleTime: 120000,
    retry: 1,
  });
}

export function useErrorBreakdown() {
  return useQuery({
    queryKey: ["models-error-breakdown"],
    queryFn: fetchErrorBreakdown,
    staleTime: 120000,
    retry: 1,
  });
}

export function useDrift() {
  return useQuery({
    queryKey: ["models-drift"],
    queryFn: fetchDriftReport,
    staleTime: 60000,
    retry: 1,
  });
}

export function useAnomalyMetrics() {
  return useQuery({
    queryKey: ["models-anomaly-metrics"],
    queryFn: fetchAnomalyMetrics,
    staleTime: 60000,
    retry: 1,
  });
}

export function useSimulatorMutation() {
  return useMutation({
    mutationFn: (payload: SimulatorRequest) => calculateSavings(payload),
  });
}

export function useTriggerRetrain() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: triggerRetrain,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["models-benchmarks"] });
      queryClient.invalidateQueries({ queryKey: ["models-drift"] });
    },
  });
}

export function useRetrainJobStatus(jobId: string | null) {
  return useQuery({
    queryKey: ["retrain-status", jobId],
    queryFn: () => (jobId ? getRetrainStatus(jobId) : null),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && (data.status === "completed" || data.status === "failed")) {
        return false;
      }
      return 2000;
    },
  });
}
