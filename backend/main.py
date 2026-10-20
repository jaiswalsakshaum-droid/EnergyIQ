from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from schemas import (
    OverviewKpis,
    EnergyPoint,
    BuildingLoad,
    Anomaly,
    AnomalyStatusUpdate,
    ModelBenchmark,
    SimulatorRequest,
    SimulatorResponse,
)

app = FastAPI(
    title="EnergyIQ API Service",
    description="Backend reference service for EnergyIQ Building Energy Intelligence platform",
    version="1.0.0",
)

# Allow CORS for local frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def healthcheck():
    return {"status": "healthy", "service": "EnergyIQ API", "version": "1.0.0"}

@app.get("/api/overview/kpis", response_model=OverviewKpis)
def get_overview_kpis():
    return OverviewKpis(
        current_consumption_kwh=1284.0,
        forecast_24h_kwh=1106.0,
        est_monthly_cost_lakh=5.14,
        active_anomalies=4,
        co2_emissions_tonnes=0.92,
    )

@app.post("/api/simulator/calculate", response_model=SimulatorResponse)
def calculate_savings(payload: SimulatorRequest):
    monthly_baseline = 42800
    reduction = monthly_baseline * (
        payload.after_hours_reduction * 0.32
        + payload.occupancy_change * 0.18
        + payload.usage_adjustment * 0.5
    )
    rounded_reduction = round(reduction)
    return SimulatorResponse(
        reduction_kwh=rounded_reduction,
        savings_inr=round(rounded_reduction * payload.tariff),
        co2_tonnes=round(rounded_reduction * 0.00071 * 100) / 100,
        projected_monthly_kwh=max(0, monthly_baseline - rounded_reduction),
    )
