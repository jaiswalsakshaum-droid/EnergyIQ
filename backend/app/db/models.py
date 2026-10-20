from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    Float,
    String,
    Boolean,
    DateTime,
    Text,
    ForeignKey,
    Index,
)
from sqlalchemy.orm import relationship
from app.db.session import Base

class Building(Base):
    __tablename__ = "buildings"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    area_sqm = Column(Float, nullable=False)
    building_type = Column(String(50), nullable=False)  # office, lab, operations, studio, library
    base_load = Column(Float, nullable=False)  # typical standby load in kW
    occupancy_profile = Column(String(50), default="standard_workday")
    description = Column(String(255), nullable=True)

class MeterReading(Base):
    __tablename__ = "meter_readings"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    building = Column(String(100), nullable=False, index=True)
    kwh = Column(Float, nullable=False)
    peak_kw = Column(Float, nullable=False)
    temperature_c = Column(Float, nullable=False)
    humidity = Column(Float, nullable=True)
    occupancy = Column(Float, nullable=True)  # estimated 0.0 to 1.0 fraction
    is_synthetic = Column(Boolean, default=True)

    __table_args__ = (
        Index("idx_building_time", "building", "timestamp", unique=True),
    )

class AnomalyIncident(Base):
    __tablename__ = "anomaly_incidents"

    id = Column(Integer, primary_key=True, index=True)
    time = Column(String(100), nullable=False)  # Display string e.g. "Today, 02:14"
    timestamp = Column(DateTime, nullable=False, index=True)
    building = Column(String(100), nullable=False, index=True)
    actual = Column(Float, nullable=False)
    expected = Column(Float, nullable=False)
    anomaly_type = Column(String(50), nullable=False, index=True)  # Overnight usage, Usage spike, Sudden drop, Sensor fault
    severity = Column(String(20), nullable=False, index=True)  # High, Medium, Low
    cost = Column(Float, default=0.0)
    wasted_kwh = Column(Float, default=0.0)
    date_range = Column(String(20), default="24 hours")
    status = Column(String(20), default="Pending", index=True)  # Pending, Reviewed, Confirmed, False alarm
    detail = Column(Text, nullable=False)
    recommendation = Column(Text, nullable=False)
    reviewer_note = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class GroundTruthAnomaly(Base):
    __tablename__ = "ground_truth_anomalies"

    id = Column(Integer, primary_key=True, index=True)
    timestamp_start = Column(DateTime, nullable=False, index=True)
    timestamp_end = Column(DateTime, nullable=False)
    building = Column(String(100), nullable=False)
    anomaly_type = Column(String(50), nullable=False)
    severity = Column(String(20), nullable=False)
    description = Column(String(255), nullable=True)

class ModelRun(Base):
    __tablename__ = "model_runs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    model_name = Column(String(100), nullable=False)
    horizon = Column(String(20), default="24h")
    mae = Column(Float, nullable=False)
    rmse = Column(Float, nullable=False)
    mape = Column(Float, nullable=False)
    r2 = Column(Float, nullable=False)
    mase = Column(Float, nullable=True)
    train_time_sec = Column(Float, nullable=False)
    inference_time_sec = Column(Float, nullable=True)
    is_best = Column(Boolean, default=False)
    artifact_path = Column(String(255), nullable=True)
    metrics_json = Column(Text, nullable=True)
    params_json = Column(Text, nullable=True)

class DataUpload(Base):
    __tablename__ = "data_uploads"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    row_count = Column(Integer, default=0)
    missing_cells = Column(Integer, default=0)
    duplicate_timestamps = Column(Integer, default=0)
    is_committed = Column(Boolean, default=False)
    quality_report_json = Column(Text, nullable=True)

class RetrainJob(Base):
    __tablename__ = "retrain_jobs"

    id = Column(String(50), primary_key=True, index=True)
    status = Column(String(20), default="queued")  # queued, running, completed, failed
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    error = Column(Text, nullable=True)
    logs = Column(Text, nullable=True)
