import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import init_db
from app.schemas.overview import OverviewKpis
from app.schemas.simulator import SimulatorRequest

init_db()
client = TestClient(app)

def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "EnergyIQ"

def test_overview_kpis_camel_case():
    response = client.get("/api/overview/kpis")
    assert response.status_code == 200
    data = response.json()
    
    # Assert camelCase keys are returned for frontend compatibility
    assert "currentConsumptionKwh" in data
    assert "forecast24hKwh" in data
    assert "estMonthlyCostLakh" in data
    assert "activeAnomalies" in data
    assert "co2EmissionsTonnes" in data
    assert data["currentConsumptionKwh"] == 1284.0
    assert data["forecast24hKwh"] == 1106.0

def test_simulator_calculate():
    payload = {
        "afterHoursReduction": 0.20,
        "occupancyChange": 0.10,
        "usageAdjustment": 0.10,
        "tariff": 10.0,
    }
    response = client.post("/api/simulator/calculate", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    # Assert camelCase response fields
    assert "reduction" in data
    assert "savings" in data
    assert "co2" in data
    assert "projectedMonthlyKwh" in data
    assert data["reduction"] == 5650
    assert data["savings"] == 56500
    assert data["co2"] == 4.01
    assert data["projectedMonthlyKwh"] == 42800 - 5650

def test_schema_alias_generator():
    req = SimulatorRequest(after_hours_reduction=0.3, tariff=12.0)
    dumped = req.model_dump(by_alias=True)
    assert "afterHoursReduction" in dumped
    assert "tariff" in dumped
    assert dumped["afterHoursReduction"] == 0.3
