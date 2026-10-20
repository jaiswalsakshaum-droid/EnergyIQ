import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

def test_forecast_24h_multi_horizon():
    # 24 hours horizon
    payload_24h = {
        "horizon": "24 hours",
        "model": "Random Forest",
        "building": "North Tower",
    }
    res = client.post("/api/forecast", json=payload_24h)
    assert res.status_code == 200
    data = res.json()
    
    assert data["horizon"] == "24 hours"
    assert data["building"] == "North Tower"
    assert data["totalKwh"] > 0
    assert data["estCostInr"] > 0
    assert data["peakDemandKw"] > 0
    assert "peakDemandTime" in data
    assert len(data["points"]) > 0
    
    first_pt = data["points"][0]
    assert "time" in first_pt
    assert "forecast" in first_pt
    assert "upper" in first_pt
    assert "lower" in first_pt
    assert first_pt["upper"] >= first_pt["forecast"]
    assert first_pt["forecast"] >= first_pt["lower"]

def test_forecast_7d_and_30d():
    # 7 days
    res_7d = client.post("/api/forecast", json={"horizon": "7 days", "model": "XGBoost"})
    assert res_7d.status_code == 200
    data_7d = res_7d.json()
    assert len(data_7d["points"]) == 7
    assert data_7d["totalKwh"] > 0

    # 30 days
    res_30d = client.post("/api/forecast", json={"horizon": "30 days"})
    assert res_30d.status_code == 200
    data_30d = res_30d.json()
    assert len(data_30d["points"]) > 20

def test_forecast_explain_endpoint():
    res = client.get("/api/forecast/explain?building=North%20Tower&timestamp=14:00")
    assert res.status_code == 200
    data = res.json()
    assert data["building"] == "North Tower"
    assert "summarySentence" in data
    assert "topPositive" in data
    assert "topNegative" in data
    assert len(data["topPositive"]) > 0

def test_overview_endpoints():
    # KPIs
    res_kpis = client.get("/api/overview/kpis")
    assert res_kpis.status_code == 200
    kpis = res_kpis.json()
    assert kpis["currentConsumptionKwh"] > 0
    assert kpis["estMonthlyCostLakh"] > 0
    assert kpis["activeAnomalies"] > 0
    assert kpis["co2EmissionsTonnes"] > 0

    # Buildings overview
    res_b = client.get("/api/overview/buildings")
    assert res_b.status_code == 200
    buildings = res_b.json()
    assert len(buildings) >= 4
    assert "share" in buildings[0]
    assert "area" in buildings[0]
    assert "peakKw" in buildings[0]

    # Live series
    res_live = client.get("/api/overview/live-series?hours=24")
    assert res_live.status_code == 200
    series = res_live.json()
    assert len(series) == 12

    # Recommendations
    res_reco = client.get("/api/overview/recommendations")
    assert res_reco.status_code == 200
    recos = res_reco.json()
    assert len(recos) >= 3
    assert "copy" in recos[0]
    assert "impact" in recos[0]
