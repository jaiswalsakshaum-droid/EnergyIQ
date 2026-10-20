import time
import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

def test_forecast_local_explainability():
    t0 = time.time()
    res = client.get("/api/forecast/explain?building=North%20Tower&timestamp=14:00")
    duration = time.time() - t0
    
    assert res.status_code == 200
    # Must stay fast (under 2 seconds per spec)
    assert duration < 2.0, f"Explain endpoint took too long: {duration:.2f}s"
    
    data = res.json()
    assert data["building"] == "North Tower"
    assert data["timestamp"] == "14:00"
    assert data["predictedKwh"] > 0
    assert "summarySentence" in data
    assert "Predicted" in data["summarySentence"]
    assert len(data["topPositive"]) > 0

    first_pos = data["topPositive"][0]
    assert "feature" in first_pos
    assert "impactKwh" in first_pos
    assert "displayName" in first_pos
    assert first_pos["isPositive"] is True

def test_anomaly_incident_explainability():
    # Fetch first incident ID
    res_list = client.get("/api/anomalies")
    assert res_list.status_code == 200
    incidents = res_list.json()
    assert len(incidents) > 0
    test_id = incidents[0]["id"]

    t0 = time.time()
    res_exp = client.get(f"/api/anomalies/{test_id}/explain")
    duration = time.time() - t0
    
    assert res_exp.status_code == 200
    assert duration < 2.0, f"Anomaly explain endpoint took too long: {duration:.2f}s"
    
    data = res_exp.json()
    assert data["anomalyId"] == test_id
    assert "deviationKwh" in data
    assert "plainTextExplanation" in data
    assert "recommendedAction" in data
    assert len(data["primaryCauses"]) > 0

def test_global_shap_feature_importance():
    t0 = time.time()
    res = client.get("/api/models/features")
    duration = time.time() - t0
    
    assert res.status_code == 200
    assert duration < 2.0
    
    features = res.json()
    assert len(features) >= 4
    total_pct = sum(f["value"] for f in features)
    assert total_pct > 50, f"Total feature importance percentage should be significant, got {total_pct}"
