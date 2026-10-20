from abc import ABC, abstractmethod
from typing import Dict, List, Optional
import numpy as np
import pandas as pd
import holidays

BUILDING_TYPE_ENCODING: Dict[str, int] = {
    "office": 0,
    "lab": 1,
    "operations": 2,
    "studio": 3,
    "library": 4,
}

FEATURE_COLUMNS = [
    "hour",
    "dow",
    "month",
    "is_weekend",
    "is_holiday",
    "day_before_holiday",
    "day_after_holiday",
    "hour_sin",
    "hour_cos",
    "dow_sin",
    "dow_cos",
    "month_sin",
    "month_cos",
    "lag_1h",
    "lag_2h",
    "lag_24h",
    "lag_48h",
    "lag_168h",
    "rolling_6h_mean",
    "rolling_6h_std",
    "rolling_6h_min",
    "rolling_6h_max",
    "rolling_24h_mean",
    "rolling_24h_std",
    "rolling_24h_min",
    "rolling_24h_max",
    "rolling_168h_mean",
    "rolling_168h_std",
    "rolling_168h_min",
    "rolling_168h_max",
    "temperature_c",
    "humidity",
    "cooling_degree_hours",
    "heating_degree_hours",
    "temp_hour_interaction",
    "occupancy",
    "building_type_enc",
    "area_sqm",
]

def create_features(
    df: pd.DataFrame,
    target_col: str = "kwh",
    is_inference: bool = False,
) -> pd.DataFrame:
    """
    Transforms raw building meter records into model-ready features.
    
    CRITICAL LEAKAGE GUARANTEES:
    - All lag features use .shift(k >= 1).
    - All rolling window features use .shift(1) before calculating rolling statistics.
    - Neither target(t) nor target(t + k) is EVER included in features for time t.
    """
    out = df.copy()
    
    # Ensure datetime index or column
    if "timestamp" in out.columns:
        out["timestamp"] = pd.to_datetime(out["timestamp"])
        out = out.sort_values(by="timestamp").reset_index(drop=True)
        ts = out["timestamp"]
    else:
        raise ValueError("DataFrame must contain 'timestamp' column.")

    # 1. Calendar features
    hour = ts.dt.hour
    dow = ts.dt.dayofweek
    month = ts.dt.month
    
    out["hour"] = hour
    out["dow"] = dow
    out["month"] = month
    out["is_weekend"] = (dow >= 5).astype(int)

    # Indian holidays
    in_holidays = holidays.country_holidays("IN", subdiv="DL")
    dates_series = ts.dt.date
    out["is_holiday"] = dates_series.apply(lambda d: 1 if d in in_holidays else 0)
    
    # Days adjacent to holidays
    next_day_dates = (ts + pd.Timedelta(days=1)).dt.date
    prev_day_dates = (ts - pd.Timedelta(days=1)).dt.date
    out["day_before_holiday"] = next_day_dates.apply(lambda d: 1 if d in in_holidays else 0)
    out["day_after_holiday"] = prev_day_dates.apply(lambda d: 1 if d in in_holidays else 0)

    # Cyclic representations
    out["hour_sin"] = np.sin(2 * np.pi * hour / 24.0)
    out["hour_cos"] = np.cos(2 * np.pi * hour / 24.0)
    out["dow_sin"] = np.sin(2 * np.pi * dow / 7.0)
    out["dow_cos"] = np.cos(2 * np.pi * dow / 7.0)
    out["month_sin"] = np.sin(2 * np.pi * month / 12.0)
    out["month_cos"] = np.cos(2 * np.pi * month / 12.0)

    # 2. Strict non-leaking Lags
    # Target value at time t MUST NEVER be used; lag_1h is target at t-1
    if target_col in out.columns:
        out["lag_1h"] = out[target_col].shift(1)
        out["lag_2h"] = out[target_col].shift(2)
        out["lag_24h"] = out[target_col].shift(24)
        out["lag_48h"] = out[target_col].shift(48)
        out["lag_168h"] = out[target_col].shift(168)

        # 3. Shifted Rolling Window Statistics
        # shift(1) guarantees that the rolling window covers [t-W, ..., t-1]
        shifted_target = out[target_col].shift(1)
        
        for w in [6, 24, 168]:
            out[f"rolling_{w}h_mean"] = shifted_target.rolling(w, min_periods=max(1, w // 4)).mean()
            out[f"rolling_{w}h_std"] = shifted_target.rolling(w, min_periods=max(2, w // 4)).std().fillna(0.0)
            out[f"rolling_{w}h_min"] = shifted_target.rolling(w, min_periods=max(1, w // 4)).min()
            out[f"rolling_{w}h_max"] = shifted_target.rolling(w, min_periods=max(1, w // 4)).max()

    # 4. Weather & Thermal features
    temp = out["temperature_c"] if "temperature_c" in out.columns else 28.0
    out["cooling_degree_hours"] = np.maximum(0.0, temp - 24.0)
    out["heating_degree_hours"] = np.maximum(0.0, 18.0 - temp)
    out["temp_hour_interaction"] = temp * hour
    
    if "humidity" not in out.columns:
        out["humidity"] = 55.0
        
    if "occupancy" not in out.columns:
        out["occupancy"] = 0.50

    # 5. Building metadata
    if "building_type" in out.columns:
        out["building_type_enc"] = out["building_type"].map(BUILDING_TYPE_ENCODING).fillna(0).astype(int)
    else:
        out["building_type_enc"] = 0

    if "area_sqm" not in out.columns:
        out["area_sqm"] = 18000.0

    if not is_inference:
        # For training, drop initial warm-up period where 168h lag is absent
        out = out.dropna(subset=["lag_168h"]).reset_index(drop=True)

    return out

# Weather Provider Interface & Implementations
class WeatherProvider(ABC):
    @abstractmethod
    def get_forecast(self, hours: int = 24, latitude: float = 28.6139, longitude: float = 77.2090) -> pd.DataFrame:
        """Returns forecast DataFrame with columns: [timestamp, temperature_c, humidity]"""
        pass

class ClimatologyWeatherProvider(WeatherProvider):
    """
    Offline climatology weather engine.
    Uses seasonal sinusoidal base temperature for North India + diurnal cycle
    and blends with recent observed anomalies.
    """
    def __init__(self, recent_temp_anomaly: float = 0.0):
        self.recent_anomaly = recent_temp_anomaly

    def get_forecast(self, hours: int = 24, latitude: float = 28.6139, longitude: float = 77.2090) -> pd.DataFrame:
        start_time = pd.Timestamp.now().floor("h") + pd.Timedelta(hours=1)
        timestamps = pd.date_range(start=start_time, periods=hours, freq="h")
        
        doy = timestamps.dayofyear.values
        h = timestamps.hour.values
        
        # Seasonal base (New Delhi: cool Jan, hot May/June)
        seasonal_temp = 26.0 + 13.0 * np.sin(2 * np.pi * (doy - 70) / 365.25)
        diurnal_temp = 5.0 * np.sin(2 * np.pi * (h - 9) / 24.0)
        temp_c = np.round(np.clip(seasonal_temp + diurnal_temp + self.recent_anomaly, 6.0, 48.0), 1)
        
        # Humidity
        monsoon_factor = np.exp(-((doy - 210) ** 2) / (2 * (30 ** 2)))
        base_hum = 40.0 + 42.0 * monsoon_factor
        diurnal_hum = -12.0 * np.sin(2 * np.pi * (h - 9) / 24.0)
        humidity = np.round(np.clip(base_hum + diurnal_hum, 15.0, 95.0), 1)
        
        return pd.DataFrame({
            "timestamp": timestamps,
            "temperature_c": temp_c,
            "humidity": humidity,
        })

class OpenMeteoWeatherProvider(WeatherProvider):
    """
    Online Open-Meteo free API weather provider.
    Falls back gracefully to Climatology if network is unavailable or timed out.
    """
    def __init__(self, enabled: bool = False):
        self.enabled = enabled
        self.fallback = ClimatologyWeatherProvider()

    def get_forecast(self, hours: int = 24, latitude: float = 28.6139, longitude: float = 77.2090) -> pd.DataFrame:
        if not self.enabled:
            return self.fallback.get_forecast(hours=hours, latitude=latitude, longitude=longitude)
            
        try:
            import httpx
            url = f"https://api.open-meteo.com/v1/forecast?latitude={latitude}&longitude={longitude}&hourly=temperature_2m,relative_humidity_2m&forecast_days=3"
            response = httpx.get(url, timeout=3.0)
            if response.status_code == 200:
                data = response.json()
                hourly = data.get("hourly", {})
                times = pd.to_datetime(hourly.get("time", []))
                temps = hourly.get("temperature_2m", [])
                hums = hourly.get("relative_humidity_2m", [])
                
                df_api = pd.DataFrame({
                    "timestamp": times,
                    "temperature_c": temps,
                    "humidity": hums,
                })
                # Filter starting from next hour
                now = pd.Timestamp.now()
                df_api = df_api[df_api["timestamp"] > now].head(hours)
                if len(df_api) >= hours:
                    return df_api.reset_index(drop=True)
        except Exception:
            pass
            
        # Seamless offline fallback
        return self.fallback.get_forecast(hours=hours, latitude=latitude, longitude=longitude)
