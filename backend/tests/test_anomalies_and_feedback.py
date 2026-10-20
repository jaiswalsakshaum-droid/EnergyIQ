import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.db.session import SessionLocal
from app.db.models import AnomalyIncident
from app.services.anomaly import get_building_sensitivity_threshold

client = TestClient(app)

def test_get_anomalies_and_filters():
    # 1. Fetch all anomalies
    res = client.get("/api/anomalies")
    assert res.status_code == 200
    anomalies = res.json()
    assert len(anomalies) > 0

    first = anomalies[0]
    assert "id" in first
    assert "time" in first
    assert "building" in first
    assert "actual" in first
    assert "expected" in first
    assert "type" in first
    assert "severity" in first
    assert "cost" in first
    assert "dateRange" in first
    assert "status" in first
    assert "detail" in first
    assert "recommendation" in first

    # 2. Filter by severity
    res_sev = client.get("/api/anomalies?severity=high")
    assert res_sev.status_code == 200
    for a in res_sev.json():
        assert a["severity"].lower() == "high"

    # 3. Filter by type
    res_type = client.get("/api/anomalies?type=Overnight%20usage")
    assert res_type.status_code == 200
    for a in res_type.json():
        assert a["type"] == "Overnight usage"

def test_anomaly_status_patch_and_persistence():
    # Fetch first incident
    res_all = client.get("/api/anomalies")
    assert res_all.status_code == 200
    anomalies = res_all.json()
    assert len(anomalies) > 0
    test_id = anomalies[0]["id"]
    building_name = anomalies[0]["building"]

    # 1. Mark as Reviewed
    res_patch1 = client.patch(f"/api/anomalies/{test_id}/status", json={"status": "Reviewed"})
    assert res_patch1.status_code == 200
    assert res_patch1.json()["status"] == "Reviewed"

    # 2. Mark as Confirmed with reviewer note
    note_text = "Confirmed chiller staging issue during facility inspection."
    res_patch2 = client.patch(
        f"/api/anomalies/{test_id}/status",
        json={"status": "Confirmed", "reviewerNote": note_text}
    )
    assert res_patch2.status_code == 200
    data2 = res_patch2.json()
    assert data2["status"] == "Confirmed"
    assert data2["reviewerNote"] == note_text

    # Verify persistence directly in SQLite DB
    db = SessionLocal()
    try:
        inc = db.query(AnomalyIncident).filter(AnomalyIncident.id == test_id).first()
        assert inc is not None
        assert inc.status == "Confirmed"
        assert inc.reviewer_note == note_text
    finally:
        db.close()

def test_feedback_loop_threshold_adjustment():
    from datetime import datetime
    db = SessionLocal()
    try:
        # Initial threshold for fresh building
        thresh_initial = get_building_sensitivity_threshold("Alpha Test Lab", db)
        assert thresh_initial == 3.0

        # Create two False alarms for Alpha Test Lab
        for i in range(2):
            db.add(AnomalyIncident(
                time="Today, 02:00",
                timestamp=datetime.utcnow(),
                building="Alpha Test Lab",
                actual=90.0,
                expected=40.0,
                anomaly_type="Usage spike",
                severity="Medium",
                cost=200.0,
                wasted_kwh=50.0,
                detail="Test incident",
                recommendation="Inspect controls",
                status="False alarm",
            ))
        db.commit()

        # Feedback threshold should now adapt upwards to reduce noise
        thresh_adjusted = get_building_sensitivity_threshold("Alpha Test Lab", db)
        assert thresh_adjusted >= 3.4
    finally:
        db.query(AnomalyIncident).filter(AnomalyIncident.building == "Alpha Test Lab").delete()
        db.commit()
        db.close()

def test_anomalies_export_csv():
    res = client.get("/api/anomalies/export.csv")
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    assert "id,time,building,actual_kwh" in res.text
    assert len(res.text.splitlines()) > 1

def test_anomaly_explain_endpoint():
    res_all = client.get("/api/anomalies")
    test_id = res_all.json()[0]["id"]

    res_exp = client.get(f"/api/anomalies/{test_id}/explain")
    assert res_exp.status_code == 200
    exp = res_exp.json()
    assert exp["anomalyId"] == test_id
    assert "deviationKwh" in exp
    assert "primaryCauses" in exp
    assert "plainTextExplanation" in exp
    assert "recommendedAction" in exp

def test_anomaly_metrics_endpoint():
    res = client.get("/api/models/anomaly-metrics")
    assert res.status_code == 200
    metrics = res.json()
    assert "precision" in metrics
    assert "recall" in metrics
    assert "f1Score" in metrics
    assert "meanDetectionDelayMinutes" in metrics
    assert metrics["precision"] >= 0
    assert metrics["recall"] >= 0
