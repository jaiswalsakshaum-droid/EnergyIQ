import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.training import load_model_registry

client = TestClient(app)

def test_models_benchmarks_endpoint():
    res = client.get("/api/models/benchmarks")
    assert res.status_code == 200
    benchmarks = res.json()
    assert len(benchmarks) >= 3
    
    first = benchmarks[0]
    assert "name" in first
    assert "mae" in first
    assert "rmse" in first
    assert "mape" in first
    assert "r2" in first
    assert "time" in first
    assert "tone" in first
    assert "isBest" in first
    
    # Verify at least one model is designated best
    assert any(b["isBest"] for b in benchmarks)

def test_features_importance_endpoint():
    res = client.get("/api/models/features")
    assert res.status_code == 200
    features = res.json()
    assert len(features) >= 3
    assert "name" in features[0]
    assert "value" in features[0]
    assert features[0]["value"] > 0

def test_actual_vs_predicted_endpoint():
    res = client.get("/api/models/actual-vs-predicted")
    assert res.status_code == 200
    points = res.json()
    assert len(points) > 0
    assert "time" in points[0]
    assert "actual" in points[0]
    assert "predicted" in points[0]
    assert "residual" in points[0]

def test_error_breakdown_endpoint():
    res = client.get("/api/models/error-breakdown")
    assert res.status_code == 200
    breakdown = res.json()
    assert "byHour" in breakdown
    assert "byDayOfWeek" in breakdown
    assert "byBuilding" in breakdown
    assert "byHorizon" in breakdown
    assert len(breakdown["byHour"]) == 24

def test_model_outperforms_seasonal_naive():
    meta = load_model_registry()
    assert meta, "Model registry metadata must exist"
    benchmarks = meta.get("benchmarks", [])
    best = next((b for b in benchmarks if b.get("is_best")), None)
    assert best is not None, "Best model must be identified"
    mase = float(best.get("mase", 1.0))
    # Proves the best model beats the seasonal naive baseline by a clear margin
    assert mase < 0.85, f"Expected MASE < 0.85, got {mase}"

def test_retrain_endpoint():
    res = client.post("/api/models/retrain")
    assert res.status_code == 200
    data = res.json()
    assert "jobId" in data
    assert data["status"] in ["queued", "running"]

    job_id = data["jobId"]
    res_status = client.get(f"/api/models/retrain/{job_id}")
    assert res_status.status_code == 200
    assert res_status.json()["id"] == job_id
