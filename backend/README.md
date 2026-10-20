# EnergyIQ — Backend Architecture & API Specification

This directory contains the backend architecture, Pydantic schemas, and reference FastAPI service specifications for EnergyIQ.

> **Note**: As per requirements, the core application currently operates as a standalone, frontend-only intelligence dashboard with in-browser computation and local demo datasets. This backend folder provides the structured API contract, schemas, and endpoints ready for future server-side or database integration.

## Proposed Tech Stack
- **Framework**: Python 3.11+ with FastAPI & Uvicorn
- **Validation**: Pydantic v2
- **Data & ML**: Pandas, NumPy, Scikit-learn, XGBoost, Statsmodels
- **Storage**: TimescaleDB / PostgreSQL (time-series sensor streams)
- **Cache & Message Queue**: Redis / Celery (for asynchronous model re-training)

## Endpoint Specifications

### 1. Overview API
- `GET /api/overview/kpis`: Current load, 24h forecast, monthly projected cost, active anomaly count, CO₂ emission intensity.
- `GET /api/overview/buildings`: Per-building energy usage and peak demand breakdown.

### 2. Predictive Forecasting API
- `POST /api/forecast`: Generate usage forecast.
  - Query parameters:
    - `horizon`: `24h` | `7d` | `30d`
    - `model`: `random_forest` | `xgboost` | `seasonal_baseline`
  - Returns forecasted load array, 95% upper and lower confidence intervals, and peak coincident demand.

### 3. Anomaly Detection API
- `GET /api/anomalies`: List detected anomalies with filters for severity, type, and date range.
- `PATCH /api/anomalies/{anomaly_id}/status`: Update review status (`Reviewed`, `Confirmed`, `False alarm`).

### 4. Model Insights & Benchmarks API
- `GET /api/models/benchmarks`: Model leaderboard metrics (MAE, RMSE, MAPE, R², train duration).
- `GET /api/models/features`: Gini feature importance ranking.
- `GET /api/models/drift`: Kolmogorov-Smirnov distribution drift status.

### 5. What-If Savings Simulator API
- `POST /api/simulator/calculate`: Calculate projected monthly kWh reduction, rupee savings, and avoided tCO₂ based on operational slider assumptions.

### 6. Meter Data Management API
- `POST /api/data/upload`: Ingest meter CSV, validate timestamps, detect missing records, and return schema summary.
- `GET /api/data/sample`: Download canonical sample meter CSV.

## Getting Started (Future Deployment)
```bash
# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install requirements
pip install -r requirements.txt

# Run server in development mode
uvicorn main:app --reload --port 8000
```
