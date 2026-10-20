import pytest
import numpy as np
import pandas as pd
from app.services.features import create_features, FEATURE_COLUMNS, ClimatologyWeatherProvider, OpenMeteoWeatherProvider

def test_no_future_leakage():
    """
    Leakage Verification Test:
    Proves that features calculated at timestamp t are completely invariant to any
    perturbations or modifications to the target variable at future times (t + 1, t + 2, ...).
    """
    n_points = 500
    start = pd.Timestamp("2026-01-01 00:00:00")
    timestamps = pd.date_range(start=start, periods=n_points, freq="h")
    
    np.random.seed(123)
    kwh_base = np.random.uniform(30.0, 100.0, n_points)
    temp_base = np.random.uniform(15.0, 35.0, n_points)
    
    df_orig = pd.DataFrame({
        "timestamp": timestamps,
        "building": "North Tower",
        "building_type": "office",
        "area_sqm": 24500.0,
        "kwh": kwh_base,
        "peak_kw": kwh_base * 1.2,
        "temperature_c": temp_base,
        "humidity": 60.0,
        "occupancy": 0.5,
    })

    # Baseline features
    feat_orig = create_features(df_orig, is_inference=True)
    
    # Select arbitrary evaluation point t (well past warm-up window of 168h)
    t = 280

    # Test 1: Perturb ALL future target values at t+1, t+2, ...
    df_perturbed_future = df_orig.copy()
    df_perturbed_future.loc[t + 1:, "kwh"] = df_perturbed_future.loc[t + 1:, "kwh"] * 100.0 + 500.0
    feat_future_pert = create_features(df_perturbed_future, is_inference=True)

    # Assert that all features at time t are identical to the baseline
    for col in FEATURE_COLUMNS:
        orig_val = feat_orig.loc[t, col]
        pert_val = feat_future_pert.loc[t, col]
        assert np.isclose(orig_val, pert_val, rtol=1e-5, atol=1e-5), (
            f"LEAKAGE DETECTED in feature '{col}' at index {t}! "
            f"Original: {orig_val}, Perturbed: {pert_val}"
        )

    # Test 2: Perturb target value at current time t
    # Lagged features (lag_1h, lag_2h...) and rolling stats (rolling_6h...) must NOT change at time t
    df_perturbed_current = df_orig.copy()
    df_perturbed_current.loc[t, "kwh"] = 99999.0
    feat_curr_pert = create_features(df_perturbed_current, is_inference=True)

    lag_and_rolling_cols = [
        "lag_1h", "lag_2h", "lag_24h", "lag_48h", "lag_168h",
        "rolling_6h_mean", "rolling_6h_std", "rolling_6h_min", "rolling_6h_max",
        "rolling_24h_mean", "rolling_24h_std", "rolling_24h_min", "rolling_24h_max",
        "rolling_168h_mean", "rolling_168h_std", "rolling_168h_min", "rolling_168h_max",
    ]
    for col in lag_and_rolling_cols:
        orig_val = feat_orig.loc[t, col]
        pert_val = feat_curr_pert.loc[t, col]
        assert np.isclose(orig_val, pert_val, rtol=1e-5, atol=1e-5), (
            f"CURRENT-STEP LEAKAGE DETECTED in feature '{col}' at index {t}! "
            f"Original: {orig_val}, Perturbed: {pert_val}"
        )

def test_climatology_weather_provider():
    provider = ClimatologyWeatherProvider(recent_temp_anomaly=2.0)
    forecast = provider.get_forecast(hours=48)
    
    assert len(forecast) == 48
    assert "timestamp" in forecast.columns
    assert "temperature_c" in forecast.columns
    assert "humidity" in forecast.columns
    assert (forecast["temperature_c"] >= 5.0).all() and (forecast["temperature_c"] <= 50.0).all()
    assert (forecast["humidity"] >= 10.0).all() and (forecast["humidity"] <= 100.0).all()

def test_open_meteo_fallback():
    provider = OpenMeteoWeatherProvider(enabled=False)
    forecast = provider.get_forecast(hours=24)
    assert len(forecast) == 24
    assert "temperature_c" in forecast.columns
