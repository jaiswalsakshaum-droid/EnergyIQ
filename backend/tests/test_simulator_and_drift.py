import pytest
import numpy as np
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.services.drift import calculate_psi, evaluate_dataset_drift
from app.services.simulator import calculate_savings_simulation, DEFAULT_CAMPUS_BASELINE_KWH
from app.schemas.simulator import SimulatorRequest
from app.db.session import SessionLocal

client = TestClient(app)

def test_calculate_psi_stability():
    # Identical distributions should have PSI close to 0
    rng = np.random.default_rng(42)
    ref = rng.normal(loc=50, scale=10, size=500)
    curr = rng.normal(loc=50, scale=10, size=500)
    
    psi_stable = calculate_psi(ref, curr)
    assert psi_stable < 0.10, f"Expected stable PSI, got {psi_stable}"
    
    # Significant shift in mean and spread
    curr_shifted = rng.normal(loc=80, scale=20, size=500)
    psi_shifted = calculate_psi(ref, curr_shifted)
    assert psi_shifted > 0.15, f"Expected high PSI for shifted distribution, got {psi_shifted}"

def test_simulator_math_pure():
    session = SessionLocal()
    try:
        req = SimulatorRequest(
            after_hours_reduction=0.10,
            occupancy_change=0.05,
            usage_adjustment=0.10,
            tariff=8.5,
        )
        res = calculate_savings_simulation(req, session)
        assert res.reduction > 0
        assert res.savings > 0
        assert res.co2 > 0
        assert res.monthly_baseline_kwh > 0
        assert res.projected_monthly_kwh < res.monthly_baseline_kwh
        assert len(res.comparison) == 2
        assert "₹8.5" in res.confidence_note
    finally:
        session.close()

def test_drift_service_evaluation():
    session = SessionLocal()
    try:
        report = evaluate_dataset_drift(session)
        assert report.status in ["Stable", "Watch", "Retrain recommended"]
        assert report.badge in ["Healthy", "Watch", "Retrain recommended"]
        assert report.p_value >= 0.0
        assert isinstance(report.psi_scores, dict)
    finally:
        session.close()

def test_api_simulator_and_drift():
    # Test POST /api/simulator/calculate
    sim_payload = {
        "afterHoursReduction": 0.20,
        "occupancyChange": 0.10,
        "usageAdjustment": 0.15,
        "tariff": 9.0,
    }
    res_sim = client.post("/api/simulator/calculate", json=sim_payload)
    assert res_sim.status_code == 200
    data_sim = res_sim.json()
    assert "reduction" in data_sim
    assert "savings" in data_sim
    assert "projectedMonthlyKwh" in data_sim
    assert "peakDemandReductionKw" in data_sim
    
    # Test GET /api/models/drift
    res_drift = client.get("/api/models/drift")
    assert res_drift.status_code == 200
    data_drift = res_drift.json()
    assert "psiScores" in data_drift
    assert "rollingMaeChangePct" in data_drift
    assert "badge" in data_drift

def test_retrain_job_endpoints():
    res = client.post("/api/models/retrain")
    assert res.status_code == 200
    data = res.json()
    assert "jobId" in data
    job_id = data["jobId"]
    
    res_status = client.get(f"/api/models/retrain/{job_id}")
    assert res_status.status_code == 200
    status_data = res_status.json()
    assert status_data["id"] == job_id
    assert status_data["status"] in ["queued", "running", "completed"]
