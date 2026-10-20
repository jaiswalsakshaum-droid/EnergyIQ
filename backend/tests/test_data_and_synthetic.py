import pytest
import io
import pandas as pd
from fastapi.testclient import TestClient

from app.main import app
from app.db.session import init_db, SessionLocal
from app.db.models import Building, MeterReading, GroundTruthAnomaly
from app.services.synthetic import generate_campus_dataset, BUILDINGS_SPEC
from app.services.ingest import validate_and_parse_csv, commit_meter_data

init_db()
client = TestClient(app)

def test_synthetic_dataset_properties():
    # Generate 14 days to keep unit test fast and deterministic
    df, anomalies = generate_campus_dataset(days=14, seed=42)
    
    assert not df.empty
    assert len(df["building"].unique()) == 5
    
    # Check expected columns
    expected_cols = {"timestamp", "building", "kwh", "peak_kw", "temperature_c", "humidity", "occupancy", "is_anomaly_injected"}
    assert expected_cols.issubset(set(df.columns))
    
    # Check physical constraints
    assert (df["kwh"] > 0).all()
    assert (df["peak_kw"] >= df["kwh"]).all()
    assert (df["temperature_c"] >= 5.0).all() and (df["temperature_c"] <= 50.0).all()
    assert (df["humidity"] >= 10.0).all() and (df["humidity"] <= 100.0).all()
    assert (df["occupancy"] >= 0.0).all() and (df["occupancy"] <= 1.0).all()
    
    # Check injected anomalies
    assert len(anomalies) > 0
    first_anom = anomalies[0]
    assert "building" in first_anom
    assert "anomaly_type" in first_anom
    assert "start_time" in first_anom

def test_csv_validation_valid_and_invalid():
    valid_csv = (
        "timestamp,building,kwh,peak_kw,temperature_c\n"
        "2026-10-20 00:00,North Tower,42.1,45.2,21.4\n"
        "2026-10-20 01:00,North Tower,39.8,41.0,20.8\n"
        "2026-10-20 02:00,North Tower,36.4,38.1,20.2\n"
    )
    report, clean_df = validate_and_parse_csv(valid_csv, filename="test_valid.csv")
    assert report.is_valid is True
    assert report.count == 3
    assert report.missing == 0
    assert report.duplicates == 0
    assert clean_df is not None
    assert len(clean_df) == 3

    # Negative kWh check
    neg_csv = (
        "timestamp,building,kwh,peak_kw,temperature_c\n"
        "2026-10-20 00:00,North Tower,-42.1,45.2,21.4\n"
    )
    report_neg, clean_neg = validate_and_parse_csv(neg_csv)
    assert report_neg.is_valid is False
    assert any("negative" in issue.lower() for issue in report_neg.issues)

    # Missing column check
    missing_col_csv = (
        "timestamp,kwh\n"
        "2026-10-20 00:00,42.1\n"
    )
    report_col, _ = validate_and_parse_csv(missing_col_csv)
    assert report_col.is_valid is False
    assert any("missing required columns" in issue.lower() for issue in report_col.issues)

def test_data_api_sample_and_quality():
    # Sample download endpoint
    res = client.get("/api/data/sample")
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    assert "timestamp,building,kwh,peak_kw,temperature_c" in res.text

    # Quality report endpoint
    res_q = client.get("/api/data/quality")
    assert res_q.status_code == 200
    data_q = res_q.json()
    assert "count" in data_q
    assert "coveragePct" in data_q
    assert "isValid" in data_q

def test_data_api_upload_preview_and_commit():
    valid_csv = (
        "timestamp,building,kwh,peak_kw,temperature_c\n"
        "2026-10-20 12:00,North Tower,95.5,102.1,31.5\n"
        "2026-10-20 13:00,North Tower,92.0,99.4,32.0\n"
    )
    file_bytes = io.BytesIO(valid_csv.encode("utf-8"))
    
    # 1. Preview mode (commit=false)
    res = client.post(
        "/api/data/upload?commit=false",
        files={"file": ("test_upload.csv", file_bytes, "text/csv")}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["committed"] is False
    assert data["report"]["isValid"] is True
    assert data["report"]["count"] == 2

    # 2. Commit mode (commit=true)
    file_bytes.seek(0)
    res_commit = client.post(
        "/api/data/upload?commit=true",
        files={"file": ("test_upload.csv", file_bytes, "text/csv")}
    )
    assert res_commit.status_code == 200
    data_commit = res_commit.json()
    assert data_commit["committed"] is True
    assert data_commit["retrainJobId"] is not None
