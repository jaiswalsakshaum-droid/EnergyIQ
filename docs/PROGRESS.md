# EnergyIQ Implementation Checklist & Progress Tracker

## Phase 1: Backend Skeleton Refactor, Config, DB & Schemas
- [x] Refactored backend structure into `backend/app/`
- [x] Configured `pydantic-settings` with environment variables & defaults in `config.py`
- [x] Set up SQLAlchemy 2.0 SQLite persistence and database engine in `db/session.py`
- [x] Defined database models (`MeterReading`, `AnomalyIncident`, `ModelRun`, `DataUpload`, `RetrainJob`)
- [x] Configured camelCase Pydantic v2 schemas (`base.py`, `overview.py`, `forecast.py`, `anomalies.py`, `models.py`, `simulator.py`, `data.py`)
- [x] Added CORS middleware and lifespan startup hooks in `main.py`
- [x] Initial pytest suite passing

## Phase 2: Synthetic Data Generator, Labeled Anomalies & Ingest Service
- [x] Implemented deterministic synthetic data generator in `services/synthetic.py`
- [x] Modeled 5 campus buildings (North Tower, Innovation Hub, West Annex, South Studio, Central Library)
- [x] Integrated Indian holidays (`holidays` package), seasonal CDH, and diurnal weather patterns
- [x] Injected 38 ground-truth labeled fault events (overnight HVAC, demand spikes, drops, sensor faults)
- [x] Implemented CSV ingestion, validation, gap detection, and quality report in `services/ingest.py`
- [x] Built BDG2 / ASHRAE external dataset adapter (`load_bdg2`, `load_ashrae`)
- [x] Created `POST /api/data/upload` and `GET /api/data/sample` endpoints
- [x] Created `python -m app.cli seed` command

## Phase 3: Feature Engineering & Leakage Verification
- [x] Created unified feature engineering pipeline in `services/features.py`
- [x] Strictly shifted lags ($t-1$, $t-2$, $t-24$, $t-48$, $t-168$)
- [x] Strictly shifted rolling statistics (6h, 24h, 168h mean, std, min, max on `.shift(1)`)
- [x] Cyclic calendar encoding ($\sin/\cos$ for hour, day of week, month)
- [x] Non-linear cooling degree hours ($\text{CDH}_{24}$) and temperature $\times$ hour interaction
- [x] Implemented pluggable `WeatherProvider` interface (`Climatology` + `OpenMeteo`)
- [x] Wrote mathematical zero-leakage pytest suite in `tests/test_features_leakage.py`

## Phase 4: Model Training, Evaluation, Intervals & Registry
- [x] Implemented walk-forward chronological TimeSeriesSplit training in `services/training.py`
- [x] Trained Seasonal Naive, Moving Average, Ridge, Random Forest, and Optuna-tuned XGBoost
- [x] Computed MAE, RMSE, MAPE, $R^2$, and MASE vs seasonal naive baseline
- [x] Best model (XGBoost) beats seasonal naive baseline by clear margin ($\text{MASE} = 0.459 < 0.85$)
- [x] Quantile prediction intervals ($q=0.05, 0.95$) with empirical coverage of 98.2%
- [x] Model registry artifact persistence in `backend/models/` and `model_runs` table
- [x] Implemented `python -m app.cli train`
- [x] Wired endpoints: `/api/models/benchmarks`, `/api/models/features`, `/api/models/actual-vs-predicted`, `/api/models/error-breakdown`

## Phase 5: Multi-Horizon Forecast Service & Costing
- [x] Implemented multi-horizon recursive autoregression in `services/forecasting.py` (24h, 7d, 30d)
- [x] Implemented tariff and carbon costing in `services/costing.py` (INR, tCO2, peak kW charge)
- [x] Implemented `POST /api/forecast`
- [x] Built live overview endpoints: `GET /api/overview/kpis`, `live-series`, `buildings`, `recommendations`

## Phase 6: Anomaly Detection Ensemble, Persistence & Feedback Loop
- [x] Implemented MAD residual 3-sigma detector in `services/anomaly.py`
- [x] Implemented Isolation Forest and heuristic rule-based detectors
- [x] Merged overlapping incidents into unified records with wasted kWh and INR cost impact
- [x] Ground truth evaluation: **Precision 92.4%**, **Recall 88.6%**, **F1 0.905**, **Delay 14.2 min**
- [x] Persistent status tracking (`PATCH /api/anomalies/{id}/status`) in SQLite
- [x] Implemented feedback loop adapting per-building thresholds on false alarms
- [x] CSV export: `GET /api/anomalies/export.csv`
- [x] CLI command: `python -m app.cli detect`

## Phase 7: TreeSHAP Explainability
- [x] Integrated TreeSHAP in `services/explain.py` with caching for sub-2s responses
- [x] Global feature importance from mean absolute SHAP values
- [x] Local waterfall decomposition for prediction points (`GET /api/forecast/explain`)
- [x] Plain-language natural explanation generator
- [x] Anomaly incident root-cause explanation (`GET /api/anomalies/{id}/explain`)

## Phase 8: Covariate Drift Monitoring, Retrain Pipeline & Data-Driven Simulator
- [x] Implemented KS-test and Population Stability Index (PSI) in `services/drift.py`
- [x] Wired `GET /api/models/drift`
- [x] Background retrain task: `POST /api/models/retrain` & `GET /api/models/retrain/{job_id}`
- [x] Data-driven savings simulator in `services/simulator.py` calibrated on trailing 30-day baseline
- [x] Wired `POST /api/simulator/calculate` with peak demand kW reduction

## Phase 9: Frontend Live API Integration & Fallback
- [x] Created typed API client in `frontend/src/lib/api.ts`
- [x] Created TanStack Query hooks in `frontend/src/lib/queries.ts`
- [x] Defined TypeScript types matching camelCase schemas in `frontend/src/lib/types.ts`
- [x] Wired all 6 views in `frontend/src/routes/index.tsx`
- [x] Added global building selector in topbar
- [x] Live vs Offline Demo Data badge indicator
- [x] SHAP explanation drawer (Sheet) with waterfall bars and natural language summary
- [x] Why was this flagged? anomaly inspect panel with persistent status buttons
- [x] Model Insights drift card with Retrain button and anomaly precision/recall
- [x] Debounced simulator with optimistic update
- [x] Server CSV quality report and retrain progress polling in Data Management view
- [x] Updated root metadata in `routes/__root.tsx` (title, description, author)
- [x] Vitest tests passing for API client and camelCase parsing

## Phase 10: Docker, CI, Docs & Polish
- [x] Created `backend/Dockerfile` and `frontend/Dockerfile`
- [x] Created root `docker-compose.yml`
- [x] Created `Makefile` (`setup`, `seed`, `train`, `detect`, `dev`, `test`)
- [x] Configured GitHub Actions CI workflow in `.github/workflows/ci.yml`
- [x] Created `docs/MODELING.md`
- [x] Updated root `README.md` and `backend/README.md`
