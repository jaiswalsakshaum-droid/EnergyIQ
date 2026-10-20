import io
import math
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Tuple
import numpy as np
import pandas as pd
from sqlalchemy.orm import Session

from app.schemas.data import CsvQualityReport
from app.db.models import MeterReading, Building, DataUpload

REQUIRED_COLUMNS = ["timestamp", "building", "kwh", "peak_kw", "temperature_c"]

def format_file_size(size_bytes: int) -> str:
    """Format bytes into human readable KB / MB string."""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.2f} MB"

def validate_and_parse_csv(
    content: str,
    filename: str = "upload.csv",
    file_size_bytes: int = 0,
) -> Tuple[CsvQualityReport, Optional[pd.DataFrame]]:
    """Thoroughly inspects and validates smart meter CSV exports."""
    if not file_size_bytes:
        file_size_bytes = len(content.encode("utf-8"))
    size_str = format_file_size(file_size_bytes)
    
    issues: List[str] = []
    
    # 1. Parse raw text
    try:
        df_raw = pd.read_csv(io.StringIO(content))
    except Exception as e:
        report = CsvQualityReport(
            filename=filename,
            size=size_str,
            count=0,
            missing=0,
            duplicates=0,
            dates=0,
            coverage_pct=0.0,
            is_valid=False,
            headers=[],
            sample_rows=[],
            issues=[f"Failed to parse CSV format: {str(e)}"],
            error="Malformed CSV structure",
        )
        return report, None

    if df_raw.empty:
        report = CsvQualityReport(
            filename=filename,
            size=size_str,
            count=0,
            missing=0,
            duplicates=0,
            dates=0,
            coverage_pct=0.0,
            is_valid=False,
            headers=list(df_raw.columns),
            sample_rows=[],
            issues=["CSV file contains no rows."],
            error="Empty dataset",
        )
        return report, None

    headers = [str(c).strip() for c in df_raw.columns]
    # Normalize headers to lowercase
    col_map = {c: c.strip().lower() for c in headers}
    df = df_raw.rename(columns=col_map)
    
    # Check column aliases
    alias_map = {
        "datetime": "timestamp",
        "date": "timestamp",
        "time": "timestamp",
        "meter_reading": "kwh",
        "consumption": "kwh",
        "energy_kwh": "kwh",
        "kw_peak": "peak_kw",
        "demand_kw": "peak_kw",
        "temp_c": "temperature_c",
        "temperature": "temperature_c",
        "temp": "temperature_c",
    }
    for old_name, target in alias_map.items():
        if target not in df.columns and old_name in df.columns:
            df.rename(columns={old_name: target}, inplace=True)
            
    # Check required columns
    missing_cols = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing_cols:
        issues.append(f"Missing required columns: {', '.join(missing_cols)}")
        report = CsvQualityReport(
            filename=filename,
            size=size_str,
            count=len(df),
            missing=int(df.isna().sum().sum()),
            duplicates=0,
            dates=0,
            coverage_pct=0.0,
            is_valid=False,
            headers=headers,
            sample_rows=[[str(v) for v in row] for row in df_raw.head(5).values.tolist()],
            issues=issues,
            error=f"Missing columns: {', '.join(missing_cols)}",
        )
        return report, None

    total_rows = len(df)
    missing_cells = int(df[REQUIRED_COLUMNS].isna().sum().sum())
    
    # 2. Timestamp parsing
    try:
        df["parsed_timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
        invalid_ts_count = int(df["parsed_timestamp"].isna().sum())
        if invalid_ts_count > 0:
            issues.append(f"Found {invalid_ts_count} invalid or unparseable timestamps.")
    except Exception as e:
        invalid_ts_count = total_rows
        issues.append(f"Failed timestamp parsing: {str(e)}")

    valid_dates_count = total_rows - invalid_ts_count

    # 3. Duplicate checks
    duplicates_count = int(df.duplicated(subset=["building", "parsed_timestamp"]).sum())
    if duplicates_count > 0:
        issues.append(f"Detected {duplicates_count} duplicate timestamp records for same building.")

    # 4. Numeric validity (negative numbers & non-numeric)
    for col in ["kwh", "peak_kw", "temperature_c"]:
        df[col] = pd.to_numeric(df[col], errors="coerce")
        bad_num = int(df[col].isna().sum())
        if bad_num > 0:
            issues.append(f"Column '{col}' contains {bad_num} non-numeric or missing entries.")
            
    neg_kwh = int((df["kwh"] < 0).sum())
    if neg_kwh > 0:
        issues.append(f"Detected {neg_kwh} negative kWh energy readings.")

    # 5. Flatlines check (runs of constant value > 6 hours)
    for b_name, group in df.groupby("building"):
        if "parsed_timestamp" in group and not group["parsed_timestamp"].isna().all():
            grp = group.sort_values(by="parsed_timestamp")
            # check identical kwh
            diffs = grp["kwh"].diff().fillna(1.0)
            stuck_mask = (diffs == 0)
            stuck_streak = (stuck_mask != stuck_mask.shift()).cumsum()
            streak_lens = grp[stuck_mask].groupby(stuck_streak).size()
            if any(streak_lens >= 6):
                issues.append(f"Building '{b_name}' contains flat-line sensor readings (>=6 consecutive hours identical).")

    # 6. Gaps check and coverage percentage
    coverage_pct = 100.0
    gaps: List[str] = []
    if valid_dates_count > 0:
        min_ts = df["parsed_timestamp"].min()
        max_ts = df["parsed_timestamp"].max()
        if pd.notna(min_ts) and pd.notna(max_ts):
            total_expected_hours = max(1, int((max_ts - min_ts).total_seconds() / 3600) + 1)
            unique_ts_count = df["parsed_timestamp"].nunique()
            coverage_pct = min(100.0, round((unique_ts_count / total_expected_hours) * 100.0, 1))
            if coverage_pct < 95.0:
                issues.append(f"Timestamp coverage is {coverage_pct}% (missing records across date range).")

    is_valid = (len(missing_cols) == 0) and (invalid_ts_count == 0) and (neg_kwh == 0)

    # Format sample preview rows (head 5)
    sample_preview = [[str(v) for v in row] for row in df_raw.head(5).values.tolist()]

    report = CsvQualityReport(
        filename=filename,
        size=size_str,
        count=total_rows,
        missing=missing_cells,
        duplicates=duplicates_count,
        dates=valid_dates_count,
        coverage_pct=coverage_pct,
        is_valid=is_valid,
        headers=headers,
        sample_rows=sample_preview,
        issues=issues,
        error=None if is_valid else (issues[0] if issues else "Validation warning"),
    )
    
    # Clean DataFrame for commit
    clean_df = None
    if is_valid:
        clean_df = pd.DataFrame({
            "building": df["building"].astype(str),
            "timestamp": df["parsed_timestamp"],
            "kwh": df["kwh"].astype(float),
            "peak_kw": df["peak_kw"].astype(float),
            "temperature_c": df["temperature_c"].astype(float),
            "humidity": df["humidity"].astype(float) if "humidity" in df.columns else 55.0,
            "occupancy": df["occupancy"].astype(float) if "occupancy" in df.columns else 0.50,
        }).dropna(subset=["timestamp", "kwh"])

    return report, clean_df

def commit_meter_data(clean_df: pd.DataFrame, db: Session) -> int:
    """Inserts validated records into SQLite meter_readings table and ensures buildings exist."""
    unique_buildings = clean_df["building"].unique()
    for b_name in unique_buildings:
        existing = db.query(Building).filter(Building.name == b_name).first()
        if not existing:
            new_b = Building(
                name=b_name,
                area_sqm=15000.0,
                building_type="office",
                base_load=25.0,
                occupancy_profile="standard_workday",
                description="Imported building from CSV upload.",
            )
            db.add(new_b)
    db.commit()

    # Clear any overlapping readings for the same buildings and timestamps to allow re-upload/updates
    for b_name in unique_buildings:
        b_df = clean_df[clean_df["building"] == b_name]
        min_ts = b_df["timestamp"].min().to_pydatetime()
        max_ts = b_df["timestamp"].max().to_pydatetime()
        db.query(MeterReading).filter(
            MeterReading.building == b_name,
            MeterReading.timestamp >= min_ts,
            MeterReading.timestamp <= max_ts,
        ).delete(synchronize_session=False)
    db.commit()

    # Bulk insert records
    readings = [
        MeterReading(
            building=row["building"],
            timestamp=row["timestamp"].to_pydatetime(),
            kwh=float(row["kwh"]),
            peak_kw=float(row["peak_kw"]),
            temperature_c=float(row["temperature_c"]),
            humidity=float(row.get("humidity", 55.0)),
            occupancy=float(row.get("occupancy", 0.50)),
            is_anomaly_injected=False,
        )
        for _, row in clean_df.iterrows()
    ]
    db.bulk_save_objects(readings)
    db.commit()
    return len(readings)

# External Dataset Adapters
def load_bdg2(filepath: Path) -> pd.DataFrame:
    """
    Adapter for Building Data Genome 2 (BDG2) hourly electricity files.
    Maps building meter readings into EnergyIQ standard schema.
    """
    df = pd.read_csv(filepath)
    # BDG2 format: timestamp, building_id_1, building_id_2, ...
    if "timestamp" in df.columns:
        melted = df.melt(id_vars=["timestamp"], var_name="building", value_name="kwh")
        melted["peak_kw"] = melted["kwh"] * 1.15
        melted["temperature_c"] = 28.0  # Default climatology if external weather not joined
        melted["humidity"] = 55.0
        melted["occupancy"] = 0.5
        return melted
    return pd.DataFrame()

def load_ashrae(filepath: Path) -> pd.DataFrame:
    """
    Adapter for ASHRAE Great Energy Predictor III (GEPIII) train.csv.
    """
    df = pd.read_csv(filepath)
    # ASHRAE format: building_id, meter, timestamp, meter_reading
    # Filter for electricity meter (meter == 0)
    if "meter" in df.columns:
        df = df[df["meter"] == 0]
    df["building"] = "ASHRAE_" + df["building_id"].astype(str)
    df["kwh"] = df["meter_reading"]
    df["peak_kw"] = df["kwh"] * 1.2
    df["temperature_c"] = 25.0
    return df[["timestamp", "building", "kwh", "peak_kw", "temperature_c"]]
