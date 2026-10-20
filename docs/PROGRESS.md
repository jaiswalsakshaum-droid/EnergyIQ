# EnergyIQ Implementation Progress

Running checklist for building out the full-stack AI-Powered Building Energy Intelligence platform.

---

## Phases & Tasks

- [x] **Phase 1: Backend Skeleton Refactor & Core Foundation**
  - [x] Requirements setup (`requirements.txt`, `requirements-dev.txt`) & virtualenv/dependencies
  - [x] App structure: `app/main.py`, `app/config.py` (pydantic-settings), `app/api/deps.py`
  - [x] Pydantic v2 schemas with camelCase aliases (`alias_generator=to_camel_case`, `populate_by_name=True`)
  - [x] SQLAlchemy 2.0 SQLite models & database initialization (`app/db/`)
  - [x] Existing endpoints updated to work with schemas & DB (`health.py`, `overview.py`, `simulator.py`)
  - [x] Pytest suite setup and verification (`tests/test_health_and_schemas.py`)
  - [x] Verification: tests green & git commit

- [x] **Phase 2: Synthetic Data Generator & Data Ingestion Layer**
  - [x] Synthetic generator (`app/services/synthetic.py`) for 5 buildings over 12 months hourly
  - [x] Realistic seasonal, diurnal, weather (CDH), Indian holiday, and occupancy patterns
  - [x] Ground-truth labeled anomalies injection (HVAC overnight, spikes, drops, sensor faults, drift)
  - [x] Data ingestion service (`app/services/ingest.py`) for validation, gaps, duplicates, clean parsing
  - [x] CSV upload endpoint `POST /api/data/upload` with `?commit=true|false` and quality reporting
  - [x] `load_bdg2()` / `load_ashrae()` external adapters structure
  - [x] CLI command `python -m app.cli seed`
  - [x] Tests for synthetic data generator, data validator & upload endpoint

- [x] **Phase 3: Feature Engineering & Leakage Protection**
  - [x] Feature engineering pipeline (`app/services/features.py`)
  - [x] Calendar, cyclic hour/dow/month sin/cos, lagged target (1h, 2h, 24h, 48h, 168h)
  - [x] Shifted rolling window statistics (6h, 24h, 168h mean, std, min, max) without leakage
  - [x] Weather CDH/HDH and interaction features
  - [x] Future weather climatology estimator & `WeatherProvider` pluggable interface
  - [x] Pytest target leakage unit test (perturb future target assertion)

- [ ] **Phase 4: Model Training, Evaluation, Registry & Prediction Intervals**
  - [ ] Model training service (`app/services/training.py`) with chronological walk-forward TimeSeriesSplit
  - [ ] Models: Seasonal Naive, Moving Average, Ridge, Random Forest, XGBoost
  - [ ] Performance metrics: MAE, RMSE, MAPE, R², MASE, train/inference durations
  - [ ] Quantile prediction intervals (0.05 / 0.95 bounds) & empirical coverage reporting
  - [ ] Model artifact persistence in `models/` and DB metadata tracking in `model_runs`
  - [ ] CLI command `python -m app.cli train`
  - [ ] Endpoints: `GET /api/models/benchmarks`, `GET /api/models/features`, `GET /api/models/actual-vs-predicted`, `GET /api/models/error-breakdown`

- [ ] **Phase 5: Forecasting Service & Overview Endpoints**
  - [ ] Multi-horizon forecasting engine (`app/services/forecasting.py`) for 24h, 7d, 30d
  - [ ] Endpoints: `POST /api/forecast`, `GET /api/overview/kpis`, `GET /api/overview/live-series`, `GET /api/overview/buildings`, `GET /api/overview/recommendations`, `GET /api/buildings`
  - [ ] Costing and emission conversion service (`app/services/costing.py`)
  - [ ] Unit & API tests for forecast endpoints

- [ ] **Phase 6: Anomaly Detection Ensemble & Feedback Loop**
  - [ ] Anomaly detection ensemble (`app/services/anomaly.py`): Residual MAD sigma, Isolation Forest, Rule-based detectors
  - [ ] Event merging into consolidated incident records
  - [ ] Evaluation against injected ground truth: Precision, Recall, F1, mean detection delay
  - [ ] Endpoints: `GET /api/anomalies`, `PATCH /api/anomalies/{id}/status`, `GET /api/anomalies/export.csv`, `GET /api/models/anomaly-metrics`
  - [ ] Persistent status updates and threshold feedback loop in SQLite

- [ ] **Phase 7: Explainability Layer (SHAP & Plain Language)**
  - [ ] SHAP computation service (`app/services/explain.py`)
  - [ ] Global feature importances based on mean |SHAP|
  - [ ] Local waterfall contributions and template-based natural language explanations
  - [ ] Endpoints: `GET /api/forecast/explain`, `GET /api/anomalies/{id}/explain`
  - [ ] Caching for sub-2s responses

- [ ] **Phase 8: Drift Monitoring, Retraining Pipeline & Data-Driven Simulator**
  - [ ] Drift service (`app/services/drift.py`) with KS-test & PSI on key features and rolling MAE
  - [ ] Background retrain job service with status polling (`POST /api/models/retrain`, `GET /api/models/retrain/{job_id}`)
  - [ ] Data-driven simulator (`app/services/simulator.py`) using trailing 30-day baseline and model-derived coefficients
  - [ ] Endpoints: `GET /api/models/drift`, `POST /api/simulator/calculate`

- [ ] **Phase 9: Frontend Live API Integration & Fallback System**
  - [ ] Typed API client (`frontend/src/lib/api.ts`) with `VITE_API_URL`
  - [ ] TanStack Query hooks (`frontend/src/lib/queries.ts`) with caching and graceful offline fallback
  - [ ] Wire Page 1: Overview with live KPIs, live series, building share, recommendations
  - [ ] Wire Page 2: Energy Forecast with live model switching, confidence bands, Recharts SHAP explanation drawer
  - [ ] Wire Page 3: Anomaly Detection with live filters, incident inspector, persistent status mutation, explanation
  - [ ] Wire Page 4: Model Insights with live leaderboard, temporal error breakdown, residual chart, drift PSI, retrain button
  - [ ] Wire Page 5: Savings Simulator with live API calculation and 250ms debouncing
  - [ ] Wire Page 6: Data Management with server upload, quality report, and commit & retrain workflow
  - [ ] Shared global building selector & offline indicator pill
  - [ ] Metadata updates in `__root.tsx` (title, SEO, clean tags)
  - [ ] Frontend tests (`vitest`) for API client and fallbacks

- [ ] **Phase 10: Docker, CI/CD, Documentation & Full Verification**
  - [ ] `Dockerfile` and `docker-compose.yml` for unified single-command deployment
  - [ ] Root `Makefile` (`make setup`, `make seed`, `make train`, `make dev`, `make test`) and package.json scripts
  - [ ] GitHub Actions CI workflow (`.github/workflows/ci.yml`)
  - [ ] Comprehensive documentation: `README.md`, `backend/README.md`, `docs/MODELING.md`, `docs/PROGRESS.md`
  - [ ] Full end-to-end verification run
