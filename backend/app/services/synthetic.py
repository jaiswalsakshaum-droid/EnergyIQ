import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Tuple
import holidays
from app.config import settings
from app.db.session import SessionLocal
from app.db.models import Building, MeterReading, GroundTruthAnomaly

BUILDINGS_SPEC = [
    {
        "name": "North Tower",
        "area_sqm": 24500.0,
        "building_type": "office",
        "base_load": 32.0,
        "occupancy_profile": "corporate_standard",
        "description": "Primary corporate tower with centralized chillers and 12 tenant floors.",
        "cooling_coeff": 1.45,
        "occ_coeff": 45.0,
    },
    {
        "name": "Innovation Hub",
        "area_sqm": 18200.0,
        "building_type": "lab",
        "base_load": 42.0,
        "occupancy_profile": "high_tech_continuous",
        "description": "R&D laboratories, cleanrooms, and high-density compute server rooms.",
        "cooling_coeff": 1.65,
        "occ_coeff": 38.0,
    },
    {
        "name": "West Annex",
        "area_sqm": 12800.0,
        "building_type": "operations",
        "base_load": 18.0,
        "occupancy_profile": "facilities_admin",
        "description": "Campus facilities, administration offices, and logistics handling.",
        "cooling_coeff": 0.95,
        "occ_coeff": 28.0,
    },
    {
        "name": "South Studio",
        "area_sqm": 8400.0,
        "building_type": "studio",
        "base_load": 12.0,
        "occupancy_profile": "flexible_creative",
        "description": "Creative workshop spaces, auditorium, and multi-media studio suites.",
        "cooling_coeff": 0.75,
        "occ_coeff": 22.0,
    },
    {
        "name": "Central Library",
        "area_sqm": 15000.0,
        "building_type": "library",
        "base_load": 22.0,
        "occupancy_profile": "academic_study",
        "description": "Campus central archive, quiet reading rooms, and digital discovery center.",
        "cooling_coeff": 1.10,
        "occ_coeff": 32.0,
    },
]

def generate_weather(timestamps: pd.DatetimeIndex, seed: int = 42) -> Tuple[np.ndarray, np.ndarray]:
    """Generate realistic North Indian (Delhi/NCR) hourly weather: hot summer, monsoon, mild winter."""
    rng = np.random.default_rng(seed)
    n = len(timestamps)
    
    # Day of year (0 to 365) and hour of day (0 to 23)
    doy = timestamps.dayofyear.values
    hours = timestamps.hour.values
    
    # Base seasonal cycle: Min in Jan (~14C avg), Max in June (~38C avg)
    # Peak day ~ June 10 (doy ~161)
    seasonal_temp = 26.0 + 13.0 * np.sin(2 * np.pi * (doy - 70) / 365.25)
    
    # Diurnal variation: cool at 5am (-4C), hot at 3pm (+5C)
    diurnal_temp = 5.0 * np.sin(2 * np.pi * (hours - 9) / 24.0)
    
    # Day-to-day weather wave + stochastic noise
    wave = 2.5 * np.sin(2 * np.pi * doy / 18.0) + rng.normal(0, 1.2, n)
    temp_c = np.clip(seasonal_temp + diurnal_temp + wave, 5.0, 47.0)
    
    # Humidity: monsoon peak (July-Aug, doy 180-240 ~ 75-90%), dry pre-monsoon (April-May ~ 25-45%)
    monsoon_factor = np.exp(-((doy - 210) ** 2) / (2 * (30 ** 2)))
    base_humidity = 40.0 + 42.0 * monsoon_factor
    diurnal_hum = -12.0 * np.sin(2 * np.pi * (hours - 9) / 24.0)  # humidity lower during hot afternoon
    humidity = np.clip(base_humidity + diurnal_hum + rng.normal(0, 4.0, n), 15.0, 98.0)
    
    return np.round(temp_c, 1), np.round(humidity, 1)

def generate_occupancy(timestamps: pd.DatetimeIndex, b_type: str, seed: int = 42) -> np.ndarray:
    """Generate realistic occupancy fraction [0.0 - 1.0] taking Indian holidays into account."""
    rng = np.random.default_rng(seed)
    n = len(timestamps)
    
    in_holidays = holidays.country_holidays("IN", subdiv="DL")
    
    hours = timestamps.hour.values
    dows = timestamps.dayofweek.values  # 0=Monday, 6=Sunday
    is_weekend = (dows >= 5)
    
    # Identify holidays
    is_holiday = np.array([ts.date() in in_holidays for ts in timestamps])
    
    # Diurnal profile for normal workday
    # Ramps up from 8am to 11am, small dip at lunch (1pm), tapers 5pm to 8pm
    day_curve = np.zeros(24)
    for h in range(24):
        if h < 7:
            day_curve[h] = 0.03
        elif 7 <= h < 9:
            day_curve[h] = 0.05 + 0.40 * ((h - 7) / 2)
        elif 9 <= h < 13:
            day_curve[h] = 0.85 + 0.05 * np.sin((h - 9) / 4 * np.pi)
        elif 13 <= h < 14:
            day_curve[h] = 0.65  # Lunch
        elif 14 <= h < 18:
            day_curve[h] = 0.90
        elif 18 <= h < 21:
            day_curve[h] = 0.90 - 0.70 * ((h - 18) / 3)
        else:
            day_curve[h] = 0.05
            
    occ = day_curve[hours].copy()
    
    # Weekend suppression
    if b_type == "lab":
        # Labs run experiments on weekends
        occ[is_weekend] *= 0.40
        occ[is_holiday] *= 0.35
    elif b_type == "library":
        # Library busy on weekends
        occ[is_weekend] *= 0.75
        occ[is_holiday] *= 0.20
    else:
        occ[is_weekend] *= 0.08
        occ[is_holiday] *= 0.05
        
    # Add small random variation
    occ = np.clip(occ + rng.normal(0, 0.03, n), 0.01, 1.0)
    return np.round(occ, 3)

def generate_building_series(
    b_spec: dict,
    timestamps: pd.DatetimeIndex,
    temp_c: np.ndarray,
    humidity: np.ndarray,
    seed: int,
) -> Tuple[pd.DataFrame, List[dict]]:
    """Synthesizes 12 months of realistic hourly power with injected labeled anomalies."""
    rng = np.random.default_rng(seed)
    n = len(timestamps)
    
    b_name = b_spec["name"]
    b_type = b_spec["building_type"]
    base_kw = b_spec["base_load"]
    cooling_k = b_spec["cooling_coeff"]
    occ_k = b_spec["occ_coeff"]
    
    occ = generate_occupancy(timestamps, b_type, seed=seed)
    
    # Cooling Degree Hours above 24.0C
    cdh = np.maximum(0.0, temp_c - 24.0)
    # Non-linear thermal surge during high heat
    cooling_load = cooling_k * (cdh ** 1.35) * (1.0 + 0.005 * (humidity - 50.0))
    
    # Plug loads and lighting driven by occupancy
    occupancy_load = occ_k * occ
    
    # Slow trend across the year (+2.5% expansion)
    trend = np.linspace(1.0, 1.025, n)
    
    # Combined expected baseline kWh
    base_profile = (base_kw + occupancy_load + cooling_load) * trend
    noise = rng.normal(0, 0.04 * (base_kw + occupancy_load), n)
    kwh = np.maximum(base_kw * 0.7, base_profile + noise)
    
    # Calculate peak kW (spikes during cycling equipment)
    peak_kw = kwh * rng.uniform(1.12, 1.25, n)
    
    is_anomaly = np.zeros(n, dtype=bool)
    injected_anomalies: List[dict] = []
    
    # Injection 1: Overnight HVAC left on
    if b_name in ["North Tower", "Innovation Hub"] and n >= 48:
        # Find overnight hours (hour == 23)
        night_indices = np.where((timestamps.hour == 23))[0]
        if len(night_indices) > 0:
            target_night = night_indices[len(night_indices) // 2]
            start_idx = target_night
            end_idx = min(n - 1, start_idx + 7)
            kwh[start_idx:end_idx] += 38.0 * cooling_k
            peak_kw[start_idx:end_idx] = kwh[start_idx:end_idx] * 1.15
            is_anomaly[start_idx:end_idx] = True
            injected_anomalies.append({
                "building": b_name,
                "start_time": timestamps[start_idx].isoformat(),
                "end_time": timestamps[end_idx].isoformat(),
                "anomaly_type": "Overnight usage",
                "severity": "Medium",
                "description": f"Overnight chiller circuit left active outside BMS occupancy schedule in {b_name}."
            })

    # Injection 2: Sudden demand spike
    if n >= 24:
        spike_indices = [int(n * 0.25), int(n * 0.70)] if n >= 200 else [int(n * 0.5)]
        for s_idx in spike_indices:
            if s_idx < n:
                dur = min(3, max(1, n - s_idx - 1))
                end_idx = min(n - 1, s_idx + dur)
                kwh[s_idx:end_idx] *= 1.85
                peak_kw[s_idx:end_idx] *= 2.10
                is_anomaly[s_idx:end_idx] = True
                injected_anomalies.append({
                    "building": b_name,
                    "start_time": timestamps[s_idx].isoformat(),
                    "end_time": timestamps[end_idx].isoformat(),
                    "anomaly_type": "Usage spike",
                    "severity": "High",
                    "description": f"Unplanned peak demand spike (1.85x normal) detected in {b_name}."
                })

    # Injection 3: Sudden drop (Substation breaker trip)
    if n >= 30:
        drop_idx = int(n * 0.40)
        dur = min(4, max(1, n - drop_idx - 1))
        end_idx = min(n - 1, drop_idx + dur)
        kwh[drop_idx:end_idx] *= 0.25
        peak_kw[drop_idx:end_idx] *= 0.30
        is_anomaly[drop_idx:end_idx] = True
        injected_anomalies.append({
            "building": b_name,
            "start_time": timestamps[drop_idx].isoformat(),
            "end_time": timestamps[end_idx].isoformat(),
            "anomaly_type": "Sudden drop",
            "severity": "Medium",
            "description": f"Abrupt 75% load drop consistent with feeder breaker trip in {b_name}."
        })

    # Injection 4: Sensor faults (RS-485 Modbus zero or stuck values)
    if n >= 40:
        stuck_idx = int(n * 0.85)
        dur = min(6, max(1, n - stuck_idx - 1))
        end_idx = min(n - 1, stuck_idx + dur)
        val = float(kwh[stuck_idx])
        kwh[stuck_idx:end_idx] = val
        peak_kw[stuck_idx:end_idx] = val * 1.05
        is_anomaly[stuck_idx:end_idx] = True
        injected_anomalies.append({
            "building": b_name,
            "start_time": timestamps[stuck_idx].isoformat(),
            "end_time": timestamps[end_idx].isoformat(),
            "anomaly_type": "Sensor fault",
            "severity": "Low",
            "description": f"Telemetry flat-line / stuck sensor reading across {dur} hours in {b_name}."
        })

    df = pd.DataFrame({
        "timestamp": timestamps,
        "building": b_name,
        "kwh": np.round(kwh, 2),
        "peak_kw": np.round(peak_kw, 2),
        "temperature_c": temp_c,
        "humidity": humidity,
        "occupancy": occ,
        "is_anomaly_injected": is_anomaly,
    })
    
    return df, injected_anomalies

def generate_campus_dataset(
    end_date: datetime = None,
    days: int = 365,
    seed: int = 42,
) -> Tuple[pd.DataFrame, List[dict]]:
    """Generates complete dataset for all 5 buildings and ground truth anomalies."""
    if end_date is None:
        end_date = datetime.now().replace(minute=0, second=0, microsecond=0)
    
    start_date = end_date - timedelta(days=days)
    # 8760 hourly points
    timestamps = pd.date_range(start=start_date, end=end_date, freq="1h", inclusive="right")
    
    temp_c, humidity = generate_weather(timestamps, seed=seed)
    
    dfs = []
    all_anomalies = []
    
    for i, b_spec in enumerate(BUILDINGS_SPEC):
        b_df, b_anomalies = generate_building_series(
            b_spec=b_spec,
            timestamps=timestamps,
            temp_c=temp_c,
            humidity=humidity,
            seed=seed + i * 101,
        )
        dfs.append(b_df)
        all_anomalies.extend(b_anomalies)
        
    campus_df = pd.concat(dfs, ignore_index=True).sort_values(by=["timestamp", "building"]).reset_index(drop=True)
    return campus_df, all_anomalies

def seed_database(days: int = 365, seed: int = 42):
    """Populates SQLite database with building specifications, meter readings, and ground truth anomalies."""
    df, anomalies = generate_campus_dataset(days=days, seed=seed)
    
    db = SessionLocal()
    try:
        # 1. Seed buildings
        for spec in BUILDINGS_SPEC:
            existing = db.query(Building).filter(Building.name == spec["name"]).first()
            if not existing:
                b = Building(
                    name=spec["name"],
                    area_sqm=spec["area_sqm"],
                    building_type=spec["building_type"],
                    base_load=spec["base_load"],
                    occupancy_profile=spec["occupancy_profile"],
                    description=spec["description"],
                )
                db.add(b)
        db.commit()

        # 2. Clear old readings for fresh deterministic seed
        db.query(MeterReading).delete()
        db.query(GroundTruthAnomaly).delete()
        db.commit()

        # 3. Bulk insert meter readings
        readings = [
            MeterReading(
                building=row["building"],
                timestamp=row["timestamp"].to_pydatetime(),
                kwh=row["kwh"],
                peak_kw=row["peak_kw"],
                temperature_c=row["temperature_c"],
                humidity=row["humidity"],
                occupancy=row["occupancy"],
                is_anomaly_injected=bool(row["is_anomaly_injected"]),
            )
            for _, row in df.iterrows()
        ]
        db.bulk_save_objects(readings)

        # 4. Insert ground truth anomalies
        gt_objects = [
            GroundTruthAnomaly(
                building=a["building"],
                timestamp_start=datetime.fromisoformat(a["start_time"]),
                timestamp_end=datetime.fromisoformat(a["end_time"]),
                anomaly_type=a["anomaly_type"],
                severity=a["severity"],
                description=a["description"],
            )
            for a in anomalies
        ]
        db.bulk_save_objects(gt_objects)
        db.commit()

        print(f"Successfully seeded {len(readings)} meter readings and {len(gt_objects)} ground truth anomalies.")
    finally:
        db.close()
