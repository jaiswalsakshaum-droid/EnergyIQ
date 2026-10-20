.PHONY: setup seed train detect dev test clean docker-up docker-down

PYTHON ?= python
NPM ?= npm

setup:
	@echo "Setting up Python backend dependencies..."
	cd backend && $(PYTHON) -m pip install -r requirements.txt -r requirements-dev.txt
	@echo "Setting up Frontend npm dependencies..."
	cd frontend && $(NPM) install

seed:
	@echo "Seeding synthetic dataset and injected ground-truth anomalies..."
	cd backend && $(PYTHON) -m app.cli seed

train:
	@echo "Training walk-forward models and quantile bounds..."
	cd backend && $(PYTHON) -m app.cli train

detect:
	@echo "Running anomaly ensemble detection..."
	cd backend && $(PYTHON) -m app.cli detect

all: seed train detect
	@echo "All data, models, and anomaly incidents prepared."

test:
	@echo "Running backend pytest suite..."
	cd backend && $(PYTHON) -m pytest
	@echo "Running frontend vitest suite..."
	cd frontend && $(NPM) test -- --run
	@echo "Running frontend linter..."
	cd frontend && $(NPM) run lint

dev:
	@echo "Starting EnergyIQ platform (Backend :8000 and Frontend :5173)..."
	$(NPM) run dev

dev-backend:
	cd backend && $(PYTHON) -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

docker-up:
	docker compose up --build -d

docker-down:
	docker compose down

clean:
	rm -rf backend/data/*.db backend/models/*.joblib
