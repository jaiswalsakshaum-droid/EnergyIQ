# EnergyIQ Backend API

FastAPI backend for EnergyIQ — AI-Powered Building Energy Intelligence. Provides real-time smart meter analytics, multi-horizon load forecasting, ensemble anomaly detection, TreeSHAP explainability, and what-if savings simulation.

---

## Quickstart

```bash
# 1. Install dependencies
pip install -r requirements.txt -r requirements-dev.txt

# 2. Seed database, train models, and detect anomalies
python -m app.cli seed
python -m app.cli train
python -m app.cli detect
# Or run all in one step:
python -m app.cli all

# 3. Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Interactive OpenAPI documentation is available at `http://localhost:8000/docs`.

---

## API Endpoints Reference

All request and response JSON payloads use `camelCase` naming conventions.

### 1. Health Check
- **`GET /api/health`**
  ```json
  { "status": "healthy", "service": "EnergyIQ", "version": "1.0.0" }
  ```

### 2. Overview Endpoints
- **`GET /api/overview/kpis`**
  Returns campus-wide live KPIs:
  ```json
  {
    "currentConsumptionKwh": 1284.0,
    "forecast24hKwh": 1106.0,
    "estMonthlyCostLakh": 5.14,
    "activeAnomalies": 4,
    "co2EmissionsTonnes": 0.92,
    "changeVsYesterdayPct": 8.2
  }
  ```
- **`GET /api/overview/live-series?hours=24`**
  Returns actual metered readings + forecasted load profile + quantile bounds.
- **`GET /api/overview/buildings`**
  Returns per-building load, percentage share of campus energy, and peak demand.
- **`GET /api/overview/recommendations`**
  Returns actionable energy-saving opportunities derived from baseline analysis.

### 3. Forecasting Endpoints
- **`POST /api/forecast`**
  Body:
  ```json
  {
    "horizon": "24 hours",
    "model": "XGBoost (Tuned)",
    "building": "North Tower"
  }
  ```
  Returns `ForecastResponse` with `points` (forecast, upper, lower, actual), `totalKwh`, `estCostInr`, `peakDemandKw`, and `peakDemandTime`.
- **`GET /api/forecast/explain?building=North%20Tower&timestamp=14:00`**
  Computes local TreeSHAP attribution waterfall for the given building and timestamp:
  ```json
  {
    "building": "North Tower",
    "timestamp": "14:00",
    "predictedKwh": 94.2,
    "baseValueKwh": 62.0,
    "topPositive": [
      { "feature": "temperature_c", "impactKwh": 21.4, "displayName": "Ambient Temperature (+21.4 kWh)", "isPositive": true }
    ],
    "topNegative": [
      { "feature": "hour_cos", "impactKwh": -6.2, "displayName": "Hour of Day (-6.2 kWh)", "isPositive": false }
    ],
    "summarySentence": "Predicted 94.2 kWh for North Tower at 14:00: +21.4 kWh from ambient temperature, +14.2 kWh from occupancy, offset by -6.2 kWh from hour of day."
  }
  ```

### 4. Anomaly Detection Endpoints
- **`GET /api/anomalies?severity=&type=&dateRange=&building=&status=`**
  Query detected incidents with multi-field filtering.
- **`PATCH /api/anomalies/{id}/status`**
  Body:
  ```json
  {
    "status": "Reviewed | Confirmed | False alarm",
    "reviewerNote": "Inspected floor BMS panel; override reset."
  }
  ```
  Persists review status in SQLite and feeds into threshold adaptation.
- **`GET /api/anomalies/{id}/explain`**
  Deconstructs root cause of the anomaly with deviation metrics and recommended action.
- **`GET /api/anomalies/export.csv`**
  Streams CSV export of all detected anomalies.

### 5. Model Insights & Benchmarks
- **`GET /api/models/benchmarks`**
  Returns model evaluation leaderboard comparing walk-forward MAE, RMSE, MAPE, R², and MASE.
- **`GET /api/models/features`**
  Returns global TreeSHAP feature importance ranking.
- **`GET /api/models/actual-vs-predicted`**
  Returns test window actual vs predicted values.
- **`GET /api/models/error-breakdown`**
  Returns MAE breakdown by hour of day, day of week, building, and horizon.
- **`GET /api/models/drift`**
  Returns two-sample Kolmogorov-Smirnov test and Population Stability Index (PSI) drift report.
- **`GET /api/models/anomaly-metrics`**
  Returns precision, recall, F1-score, and mean detection delay against injected ground truth.
- **`POST /api/models/retrain`**
  Launches asynchronous background retraining job; returns `jobId`.
- **`GET /api/models/retrain/{job_id}`**
  Polls retraining job status (`queued`, `running`, `completed`, `failed`).

### 6. Savings Simulator
- **`POST /api/simulator/calculate`**
  Body:
  ```json
  {
    "afterHoursReduction": 0.20,
    "occupancyChange": 0.10,
    "usageAdjustment": 0.15,
    "tariff": 8.5,
    "building": "North Tower"
  }
  ```
  Computes data-driven scenario simulation from trailing 30-day smart meter baselines.

### 7. Data Ingestion & Quality
- **`POST /api/data/upload?commit=false|true`**
  Uploads CSV file. `commit=false` returns quality audit report; `commit=true` persists records to SQLite.
- **`GET /api/data/sample`**
  Downloads reference CSV template.
- **`GET /api/data/quality`**
  Returns quality audit of data currently in the database.
